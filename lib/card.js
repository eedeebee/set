import d3 from 'd3';

const Numbers = [1, 2, 3];
const Colors  = ['red', 'green', 'purple'];
const Shapes  = ['oval', 'diamond', 'squiggle'];
const Fills   = ['solid', 'empty', 'lines'];
    
export default class Card {

    constructor(num, fill, color, shape) {
        this.num = num;
        this.fill = fill;
        this.color = color;
        this.shape = shape;
    }

    static newDeck() {
        var d = [];

        for (var n = 0; n < Numbers.length; n++) { 
            for (var f = 0; f < Fills.length; f++) { 
                for (var s = 0; s < Shapes.length; s++) { 
                    for (var c = 0; c < Colors.length; c++) { 
                        d.push(new Card(Numbers[n], Fills[f], Colors[c], Shapes[s]));
                    }
                }
            }
        }
        d3.shuffle(d);
        return d;
    }

    static isSet(a, b, c) {

        var numberOK =  (
            (a.num == b.num && b.num == c.num) || 
            (a.num != b.num && b.num != c.num && a.num != c.num)
        );
        console.log(numberOK);
        var fillOK =  (
            (a.fill == b.fill && b.fill == c.fill) || 
            (a.fill != b.fill && b.fill != c.fill && a.fill != c.fill)
        );
        console.log(fillOK);
        var colorOK =  (
            (a.color == b.color && b.color == c.color) || 
            (a.color != b.color && b.color != c.color && a.color != c.color)
        );
        console.log(colorOK);
        var shapeOK =  (
            (a.shape == b.shape && b.shape == c.shape) || 
            (a.shape != b.shape && b.shape != c.shape && a.shape != c.shape)
        );
        console.log(shapeOK);
    
        return colorOK && fillOK && shapeOK && numberOK
    }

    toS1x() {
        switch(this.num) {
            case 1: return 72;
            case 2: return 47;
            case 3: return 22;
        }
    }

    toS2x() {
        switch(this.num) {
            case 1: return 72;
            case 2: return 97;
            case 3: return 72;
        }
    }

    toS3x() {
        switch(this.num) {
            case 1: return 72;
            case 2: return 97;
            case 3: return 122;
        }
    }

    toCSSClass() {
         return "card " + this.color + " " + this.fill;
    }

    toFillStyleAttr() {
        if (this.fill == 'lines') {
            return "fill:url('#lines-" + this.color + "')";
        }
        else {
            return "";
        }
    }

    toString() {
        return  this.num + ' ' + this.fill + ' ' + 
                this.color + ' ' + this.shape;
    }
}
