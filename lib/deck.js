import d3 from 'd3';

import Card from './card';

export default class Deck extends Array {

    constructor(cards) {
        super();

        if (cards) {
            for(let i = 0; i < cards.length; i++) {
                this.push(new Card(
                    cards[i].num,
                    cards[i].fill,
                    cards[i].color,
                    cards[i].shape
                ));
            }
        } else {
            var p = Card.props();
    
            for (let n = 0; n < p.Numbers.length; n++) { 
                for (let f = 0; f < p.Fills.length; f++) { 
                    for (let s = 0; s < p.Shapes.length; s++) { 
                        for (let c = 0; c < p.Colors.length; c++) { 
                            this.push(new Card(
                                p.Numbers[n], 
                                p.Fills[f], 
                                p.Colors[c], 
                                p.Shapes[s]
                            ));
                        }
                    }
                }
            }

            d3.shuffle(this);
        }
    }

}
