import Card from './card';

/** An array of cards */

export default class Board extends Array {

    constructor() {
        super();
    }

    hasSet() {
        console.log("hasSet");

        for (let i = 0; i < this.length - 2; i++) {
            for (let j = i+1; j < this.length - 1; j++) {
                for (let k = j+1; k < this.length; k++) {
                    if (Card.isSet(this[i], this[j], this[k])) {
                        return [this[i], this[j], this[k]];
                    }
                }
            }
        }

        return false;
    }
}
