import Card from './card';

const CARDS_PER_ROW = 3;

/** An array of rows of cards */

export default class Board extends Array {

    constructor() {
        super();
    }

    addRow(deck) {
        var r = [];
        for (var i = 0; i < CARDS_PER_ROW; i++) {
            if (deck.length > 0) {
                r.push(deck.pop());
            } else {
                // TODO
                alert("Need to handle end of game");
            }
        }
        this.push(r);
    }

    hasSet() {
        console.log("hasSet");

        var cards = [];
        for (var c = 0; c < this.length; c++) {
            var r = this[c];
            for (var d = 0; d < CARDS_PER_ROW; d++) {
                cards.push(r[d]);
            }
        }

        console.log(this.length + " rows");
    
        var N = this.length * CARDS_PER_ROW;
        for (var i = 0; i < N - 2; i++) {
            for (var j = 1; j < N - 1; j++) {
                for (var k = 2; k < N; k++) {
                    if (Card.isSet(cards[i], cards[j], cards[k])) {
                        return [cards[i], cards[j], cards[k]];
                    }
                }
            }
        }

        return false;
    }
}
