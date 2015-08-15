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

    static props() {
        return {
            Numbers:Numbers,
            Colors:Colors,
            Shapes:Shapes,
            Fills:Fills
        };
    }

    static isSet(a, b, c) {

        var numberOK =  (
            (a.num == b.num && b.num == c.num) || 
            (a.num != b.num && b.num != c.num && a.num != c.num)
        );
        var fillOK =  (
            (a.fill == b.fill && b.fill == c.fill) || 
            (a.fill != b.fill && b.fill != c.fill && a.fill != c.fill)
        );
        var colorOK =  (
            (a.color == b.color && b.color == c.color) || 
            (a.color != b.color && b.color != c.color && a.color != c.color)
        );
        var shapeOK =  (
            (a.shape == b.shape && b.shape == c.shape) || 
            (a.shape != b.shape && b.shape != c.shape && a.shape != c.shape)
        );
    
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
