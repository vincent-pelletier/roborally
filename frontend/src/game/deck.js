import { useEffect, useState } from "react";
import Card from "./card";
import './deck.css';

const Type = {
    MOVE_1: "move1",
    MOVE_2: "move2",
    MOVE_3: "move3",
    BACK_UP: "backup",
    ROTATE_RIGHT: "rotate-right",
    ROTATE_LEFT: "rotate-left",
    U_TURN: "u-turn"
};

const Deck = ({color, drawHand, onDrawHandComplete, discardHand, onDiscardHandComplete}) => {
    const [, setCards] = useState([]);
    const [drawPile, setDrawPile] = useState([]);
    const [discardPile, setDiscardPile] = useState([]);
    const [hand, setHand] = useState([]);

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
        for(let i = 0; i < 18; i++) {
            localCards.push({type: Type.MOVE_1, id: localCards.length + 1});
        }
        for(let i = 0; i < 12; i++) {
            localCards.push({type: Type.MOVE_2, id: localCards.length + 1});
        }
        for(let i = 0; i < 6; i++) {
            localCards.push({type: Type.MOVE_3, id: localCards.length + 1});
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
    }, []);

    useEffect(() => {
        const draw = (num) => {
            const localHand = [];
            let localDrawPile = drawPile;
            for(let i = 0; i < num; i++) {
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

        if(drawHand > 0) {
            draw(drawHand);
            onDrawHandComplete();
        }
    }, [drawHand, drawPile, discardPile, onDrawHandComplete]);

    useEffect(() => {
        const discard = () => {
            const localHand = hand;
            const localDiscardPile = discardPile;
            while(localHand.length > 0) {
                localDiscardPile.push(localHand.shift());
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
        console.log(arr?.map(c => c.id));
    }

    return (
        <div className={"deck " + color}>
            {hand.map(c => <Card key={c.id} card={c} />)}
        </div>
    );
};

export default Deck;