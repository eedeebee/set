import d3 from 'd3';
import Card from './card';
import Board from './board';

export default class Game {

    constructor() {
        this.deck = Card.newDeck();
        this.board = new Board();

        for (let i = 0; i < 12; i++) {
            this.board.push(this.deck.pop());
        }
        this.redrawUI();
    }

    error(s) {
        $('#error').children('span.msg').text(s);
        $('#error').show(400);
    }

    message(s) {
        $('#message').children('span.msg').text(s);
        $('#message').show(400);
    }


    addThree() {
        for (var i = 0; i < 3; i++) {
            this.board.push(this.deck.pop());
        }
    }

    hint() {
        var s = this.board.hasSet();
        if (s) {
            this.message(s[0].toString() + " " + s[1].toString());
            console.log(s);
        } else {
            this.error("No Set!");
        }
    
    }
    
    redrawUI() {

        var card = d3.select('#board').selectAll('.card').data(this.board,
            function(d) { return d.toString(); } 
        );

        card.exit().transition()
            .duration(750)
            .style('opacity', 0)
            .remove();
    
        var svg = card.enter().append('svg')
                .style('opacity', 0) 
                .attr('class', function(d) { return d.toCSSClass(); })
                .on('click', function(d) { 
                    this.classList.toggle('selected'); 
                    console.log(d.toString() + ' ' + this.classList.contains('selected'));
                });

        svg.append('text')
            .attr('class', 'debug-text')
            .attr('x', 10)
            .attr('y', 10)
            .attr('stroke', 'black')
            .attr('fill', 'black')
        ;
    
        svg.append('pattern')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('x', '0').attr('y', '0').attr('width', '5').attr('height', '5')
            .append('use')
                .attr('xlink:href', '#line-1')
        ;
    
        svg.append('use').attr('class', 's1');
        svg.append('use').attr('class', 's2');
        svg.append('use').attr('class', 's3');

        svg.transition()
            .delay(1000)
            .duration(750)
            .style('opacity', 1); 
    
        d3.selectAll('.card').selectAll('pattern')
            .attr('id', function(d) { return 'lines-' + d.color; })
    
        d3.selectAll('use.s1')
            .attr('xlink:href', function(d) { return '#' + d.shape;})
            .attr('style', function(d) { return d.toFillStyleAttr(); } )
            .attr('x', function(d) { return d.toS1x();} );
        d3.selectAll('use.s2')
            .attr('xlink:href', function(d) { return '#' + d.shape;})
            .attr('style', function(d) { return d.toFillStyleAttr(); } )
            .attr('x', function(d) { return d.toS2x();} );
        d3.selectAll('use.s3')
            .attr('xlink:href', function(d) { return '#' + d.shape;})
            .attr('style', function(d) { return d.toFillStyleAttr(); } )
            .attr('x', function(d) { return d.toS3x();} );
    }
    
    noset() {
         if (this.board.hasSet()) {
            this.message("There is a set!");
        } else {
            if (this.deck.length >= 3) {
                for(let i = 0; i < 3; i++) {
                    this.board.push(this.deck.pop());
                }
            } else {
                this.message("Game over, deck empty!");
            }
            this.redrawUI();
        }
    }

    checkForSet() {
        var s = d3.selectAll('.card.selected').data();
        if (s.length != 3) {
            this.error("Choose 3 cards");
            return false;
        }
    
        if (Card.isSet(s[0], s[1], s[2])) {
            // this.message('Set!');
    
            var me = this;

            // Replace these cards
            d3.selectAll('.card.selected').each(function(d) {
    
                console.log("remove " + d.toString());
             
                for (let c = 0; c < me.board.length; c++) {
                    if (me.board[c].toString() == d.toString())  {
                        console.log("removed " + d.toString());
                        if (me.deck.length > 0 && me.board.length <= 12) {
                            me.board[c] = me.deck.pop();
                        } else {
                            me.board.splice(c, 1);
                        }
                        break;
                    }
                }
            });

            this.redrawUI();
        }
        else {
            this.error('Nope!');
        }
    }
}
