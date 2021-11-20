import { Component } from "react";
import Card from "./card";

const Type = {
    MOVE_1: "move1",
    MOVE_2: "move2",
    MOVE_3: "move3",
    BACK_UP: "backup",
    ROTATE_RIGHT: "rotate-right",
    ROTATE_LEFT: "rotate-left",
    U_TURN: "u-turn"
};

class Deck extends Component {
    constructor(props) {
        super(props);
        this.color = props.color;
        this.cards = [];
        this.deck = [];
        this.discard = [];
        this.hand = [];
        this.initializeCards();
        this.deck = this.shuffle(this.cards);
        //this.draw(9); // this works to display UI
    }

    initializeCards() {
        var idx = 1;
        for(var i = 0; i < 18; i++) {
            this.cards.push(new Card({type: Type.MOVE_1, key: idx++}));
        }
        for(i = 0; i < 12; i++) {
            this.cards.push(new Card({type: Type.MOVE_2, key: idx++}));
        }
        for(i = 0; i < 6; i++) {
            this.cards.push(new Card({type: Type.MOVE_3, key: idx++}));
        }
        for(i = 0; i < 6; i++) {
            this.cards.push(new Card({type: Type.BACK_UP, key: idx++}));
        }
        for(i = 0; i < 18; i++) {
            this.cards.push(new Card({type: Type.ROTATE_RIGHT, key: idx++}));
        }
        for(i = 0; i < 18; i++) {
            this.cards.push(new Card({type: Type.ROTATE_LEFT, key: idx++}));
        }
        for(i = 0; i < 6; i++) {
            this.cards.push(new Card({type: Type.U_TURN, key: idx++}));
        }
    }

    shuffle(arr) {
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
    }

    draw(num) {
        this.hand = [];
        for(var i = 0; i < num; i++) {
            var card = this.deck.shift();
            this.hand.push(card);
            this.discard.push(card);

            if(this.deck.length === 0) {
                this.deck = this.shuffle(this.discard);
                this.discard = [];
            }
        }
        this.log(this.hand);
        console.log('deck size: ' + this.deck.length);
    }

    log(arr) {
        console.log(arr.map(c => c.key));
    }

    render() {
        return (
            <div className={"deck " + this.color}>
                {this.hand.map(c => c.render())}
            </div>
        );
    }
}

export default Deck;