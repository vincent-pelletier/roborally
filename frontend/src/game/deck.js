import { useCallback, useEffect, useState } from "react";
import Card from "./card";
import './deck.css';
const Type = require('./type');

// Discard must be called after each draw, before the next draw, otherwise cards will run out.
const Deck = ({color, drawHand, onDrawHandComplete, discardHand, onDiscardHandComplete, assignRandom, onAssignRandomComplete, confirmRegister, onConfirmRegisterComplete, cardsVisible, hp}) => {
    const [, setCards] = useState([]);
    const [drawPile, setDrawPile] = useState([]);
    const [discardPile, setDiscardPile] = useState([]);
    const [hand, setHand] = useState([]);

    const [register, setRegister] = useState([]);
    const [selectedCard, setSelectedCard] = useState(0);
    const [registerLocked, setRegisterLocked] = useState(false);

    const shuffle = (arr) => {
        let array = [...arr]; // copy
        let currentIndex = array.length, randomIndex;

        // While there remain elements to shuffle...
        while (currentIndex !== 0) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }

        return array;
    };

    useEffect(() => {
        const localCards = [];
        // Lowest id has priority, server will send in that order.
        // The antenna is in the new version of the game
        for(let i = 0; i < 6; i++) {
            localCards.push({type: Type.MOVE_3, id: localCards.length + 1});
        }
        for(let i = 0; i < 12; i++) {
            localCards.push({type: Type.MOVE_2, id: localCards.length + 1});
        }
        for(let i = 0; i < 18; i++) {
            localCards.push({type: Type.MOVE_1, id: localCards.length + 1});
        }
        for(let i = 0; i < 6; i++) {
            localCards.push({type: Type.BACK_UP, id: localCards.length + 1});
        }
        for(let i = 0; i < 18; i++) {
            localCards.push({type: Type.ROTATE_RIGHT, id: localCards.length + 1});
        }
        for(let i = 0; i < 18; i++) {
            localCards.push({type: Type.ROTATE_LEFT, id: localCards.length + 1});
        }
        for(let i = 0; i < 6; i++) {
            localCards.push({type: Type.U_TURN, id: localCards.length + 1});
        }
        setCards(localCards);
        setDrawPile(shuffle(localCards));

        const reg = [];
        for(let i = 0; i < 5; i++) {
            reg.push({type: undefined, id: -(reg.length + 1)});
        }
        setRegister(reg);
    }, []);

    const isLocked = useCallback((id) => {
        // hp:  5 ... lock register 5
        // hp:  4 ... lock registers 4, 5
        // hp:  3 ... lock registers 3, 4, 5
        // hp:  2 ... lock registers 2, 3, 4, 5
        // hp:  1 ... lock registers 1, 2, 3, 4, 5

        for(let i = 0; i < register.length; i++) {
            if(register[i].id === id) {
                return hp <= i + 1;
            }
        }
        return false;
    }, [hp, register]);

    useEffect(() => {
        const draw = () => {
            // discard previous register
            let localRegister = [...register];
            let localDiscardPile = discardPile;
            let lockedRegisterCards = [];
            while(localRegister.length > 0) {
                let card = localRegister.shift();
                if(card.id > 0) {
                    if(isLocked(card.id)) {
                        lockedRegisterCards.push(card);
                    } else {
                        localDiscardPile.push(card);
                    }
                }
            }
            const reg = [];
            for(let i = 0; i < 5 - lockedRegisterCards.length; i++) {
                reg.push({type: undefined, id: -(reg.length + 1)});
            }
            for(const card of lockedRegisterCards) {
                reg.push(card);
            }
            setRegister(reg);

            // draw
            // hp: 10 ... draw 9
            // hp:  9 ... draw 8
            // hp:  8 ... draw 7
            // hp:  7 ... draw 6
            // hp:  6 ... draw 5
            // hp:  5 ... draw 4 ... lock register 5
            // hp:  4 ... draw 3 ... lock registers 4, 5
            // hp:  3 ... draw 2 ... lock registers 3, 4, 5
            // hp:  2 ... draw 1 ... lock registers 2, 3, 4, 5
            // hp:  1 ... draw 0 ... lock registers 1, 2, 3, 4, 5
            // hp:  0 ... destruction
            const localHand = [];
            let localDrawPile = drawPile;
            // TODO when hp == 0, don't draw, reboot
            for(let i = 0; i < hp - 1; i++) {
                const card = localDrawPile.shift();
                localHand.push(card);

                if(localDrawPile.length === 0) {
                    localDrawPile = shuffle(discardPile);
                    setDiscardPile([]);
                }
            }
            setHand(localHand);
            setDrawPile(localDrawPile);
            log(localHand);
        };

        if(drawHand) {
            draw();
            setRegisterLocked(false);
            onDrawHandComplete();
        }
    }, [drawHand, onDrawHandComplete, drawPile, discardPile, register, isLocked, hp]);

    useEffect(() => {
        const discard = () => {
            const localHand = hand;
            const localDiscardPile = discardPile;
            while(localHand.length > 0) {
                let card = localHand.shift();
                if(card.id > 0) {
                    localDiscardPile.push(card);
                }
            }
            setHand(localHand);
            setDiscardPile(discardPile);
        };

        if(discardHand) {
            discard();
            onDiscardHandComplete();
        }
    }, [discardHand, discardPile, hand, onDiscardHandComplete]);

    const log = (arr) => {
        console.log(arr?.map(c => c?.id));
    }

    const cardClicked = (id, e) => {
        if(registerLocked) {
            return;
        }

        if(isLocked(id)) {
            return;
        }

        switch(e.detail) {
            case 1:
                if(selectedCard === id) {
                    // Commenting line below allows single > double-click to work fine...
                    // Otherwise the double click does the swap, register/hand are updated, but not UI...
                    // Maybe it needs to be in a useEffect or something...?
                    // Keeping it allows unselecting a selected card, which is nice.
                    setSelectedCard(0);
                } else if((id < 0 || inRegister(id)) && selectedCard > 0) {
                    swap(selectedCard, id);
                    setSelectedCard(0);
                } else if(id > 0) {
                    setSelectedCard(id);
                }
                break;
            case 2:
                if(id < 0) {
                    return;
                }
                if(inRegister(id)) {
                    const swapWith = getFirstEmptyInHand();
                    if(swapWith !== 0) {
                        swap(id, swapWith);
                    }
                } else {
                    const swapWith = getFirstEmptyInRegister();
                    if(swapWith !== 0) {
                        swap(id, swapWith);
                    }
                }
                setSelectedCard(0);
                break;
            default:
                break;
        }
    };

    const getFirstEmptyInRegister = useCallback(() => {
        for(let i = 0; i < register.length; i++) {
            if(register[i].id < 0) {
                return register[i].id;
            }
        }
        return 0;
    }, [register]);

    const getFirstEmptyInHand = useCallback(() => {
        for(let i = 0; i < hand.length; i++) {
            if(hand[i].id < 0) {
                return hand[i].id;
            }
        }
        return 0;
    }, [hand]);

    const swap = useCallback((a, b) => {
        let cardA;
        let cardB;
        let cardC = {type: undefined, id: -100};
        let cardD = {type: undefined, id: -101};

        const localHand = hand;
        const localRegister = register;
        // find
        for(let i = 0; i < localHand.length; i++) {
            if(localHand[i].id === a) {
                cardA = localHand[i];
                localHand[i] = cardC;
            } else if(localHand[i].id === b) {
                cardB = localHand[i];
                localHand[i] = cardD;
            }
        }
        for(let i = 0; i < localRegister.length; i++) {
            if(localRegister[i].id === a) {
                cardA = localRegister[i];
                localRegister[i] = cardC;
            } else if(localRegister[i].id === b) {
                cardB = localRegister[i];
                localRegister[i] = cardD;
            }
        }

        // swap
        for(let i = 0; i < localHand.length; i++) {
            if(localHand[i].id === cardC.id) {
                localHand[i] = cardB;
            } else if(localHand[i].id === cardD.id) {
                localHand[i] = cardA;
            }
        }
        for(let i = 0; i < localRegister.length; i++) {
            if(localRegister[i].id === cardC.id) {
                localRegister[i] = cardB;
            } else if(localRegister[i].id === cardD.id) {
                localRegister[i] = cardA;
            }
        }
        setHand(localHand);
        setRegister(localRegister);
    }, [hand, register]);

    const inRegister = (id) => {
        for(let i = 0; i < register.length; i++) {
            if(register[i].id === id) {
                return true;
            }
        }
        return false;
    };

    useEffect(() => {
        const randomizeRegister = () => {
            let localHand = hand;
            localHand = shuffle(localHand);
            let localHandValid = [];
            for(let i = 0; i < localHand.length; i++) {
                if(localHand[i].id > 0) {
                    localHandValid.push(localHand[i].id);
                }
            }
            while(getFirstEmptyInRegister() !== 0) {
                swap(getFirstEmptyInRegister(), localHandValid.shift());
            }
        };

        if(assignRandom) {
            // when timer runs out this will be called >:)
            randomizeRegister();
            onAssignRandomComplete();
            setSelectedCard(0);
        }
    }, [assignRandom, onAssignRandomComplete, hand, register, swap, getFirstEmptyInRegister]);

    useEffect(() => {
        if(confirmRegister) {
            for(const card of register) {
                if(card.id < 0) {
                    onConfirmRegisterComplete(false);
                    return; // incomplete
                }
            }
            onConfirmRegisterComplete(register);
            setRegisterLocked(true);
            setSelectedCard(0);
        }
    }, [confirmRegister, onConfirmRegisterComplete, register]);

    return (
        <div className={"deck " + color}>
            {hand.map(c => <Card key={c.id} card={c} selected={selectedCard} inRegister={inRegister} isLocked={(id) => false} clicked={cardClicked} visible={true}/>)}
            {hand.length > 0 && register.length > 0 ? <span className="separator">→</span> : null}
            {register.map((c, i) => <Card key={c.id} card={c} selected={selectedCard} inRegister={inRegister} isLocked={isLocked} clicked={cardClicked} visible={i < cardsVisible}/>)}
        </div>
    );
};

export default Deck;