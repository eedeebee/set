import d3 from 'd3';
import Card from './card';
import Board from './board';

const NUM_ROWS = 4;

export default class Game {

    constructor() {
        this.deck = Card.newDeck();
        this.board = new Board();

        for (var i = 0; i < NUM_ROWS; i++) {
            this.board.addRow(this.deck);
        }
        this.redraw();
    }

    hint() {
        var s = this.board.hasSet();
        if (s) {
            alert(s[0].toString());
            console.log(s);
        } else {
            alert("No Set!");
        }
    
    }
    
    redraw() {

        var row = d3.selectAll('.row').data(this.board, function(d) { 
            var r = "";
            for (var j = 0; j < d.length; j++) {
                r += d[j].toString() + " ";
            } 
            return r;
        });

        //row.exit()
            //.transition().duration(750)
            //.style('opacity', 0)
            //.remove();
    
        var card = row.enter()
            .append('div').attr('class', 'row')
            .selectAll('.spot')
            .data(function(d) { return d; }, function(d) {
                return d.toString();
            })
    
        var c = card.enter()
            .append('div')
                .style('opacity', 0)
                .attr('class', 'spot col-xs-6 col-sm-4')
    
        c.transition()
            .duration(750)
            .style('opacity', 1); 
    
        var svg = c.append('svg')
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
    
        svg.append('pattern')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('x', '0').attr('y', '0').attr('width', '5').attr('height', '5')
            .append('use')
                .attr('xlink:href', '#line-1')
        ;
    
        svg.append('use').attr('class', 's1');
        svg.append('use').attr('class', 's2');
        svg.insert('use').attr('class', 's3');
    
        var upd = row.selectAll('.spot')
            .data(function(d) { return d; }, function(d) {
                return d.toString();
            })
    
        upd.exit().transition()
            .duration(750)
            .style('opacity', 0)
            .remove();
    
        svg = upd.enter()
            .append('div')
                .attr('class', 'spot col-xs-6 col-sm-4')
                .append('svg')
                    .style('opacity', 1)
    
        svg.transition().duration(750).style('opacity', 1); 
    
        svg.append('text')
            .attr('class', 'debug-text')
            .attr('x', 10)
            .attr('y', 10)
            .attr('stroke', 'black')
            .attr('fill', 'black')
    
        svg.append('pattern')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('x', '0').attr('y', '0').attr('width', '5').attr('height', '5')
            .append('use')
                .attr('xlink:href', '#line-1')
        ;
    
        svg.append('use').attr('class', 's1');
        svg.append('use').attr('class', 's2');
        svg.append('use').attr('class', 's3');
    
        upd.select('svg')
            .attr('class', function(d) { return d.toCSSClass(); })
            .on('click', function(d) { 
                this.classList.toggle('selected'); 
                console.log(d.toString() + ' ' + this.classList.contains('selected'));
            });
    
        //upd.selectAll('.debug-text').text(function(d) { return d.toString(); });
    
        d3.selectAll('.row').selectAll('pattern')
            .attr('id', function(d) { return 'lines-' + d.color; })
    
        row.selectAll('use.s1')
            .attr('xlink:href', function(d) { return '#' + d.shape;})
            .attr('style', function(d) { return d.toFillStyleAttr(); } )
            .attr('x', function(d) { return d.toS1x();} );
        row.selectAll('use.s2')
            .attr('xlink:href', function(d) { return '#' + d.shape;})
            .attr('style', function(d) { return d.toFillStyleAttr(); } )
            .attr('x', function(d) { return d.toS2x();} );
        row.selectAll('use.s3')
            .attr('xlink:href', function(d) { return '#' + d.shape;})
            .attr('style', function(d) { return d.toFillStyleAttr(); } )
            .attr('x', function(d) { return d.toS3x();} );
    
    }
    
    noset() {
         if (this.board.hasSet()) {
            alert("There is a set!");
        } else {
            this.board.addRow(this.deck);
            this.redraw();
        }
    }

    checkForSet() {
        var s = d3.selectAll('.card.selected').data();
        if (s.length != 3) {
            alert("Choose 3 cards");
            return false;
        }
    
        if (Card.isSet(s[0], s[1], s[2])) {
            alert('Set!');
    
            var me = this;

            // Replace these cards
            d3.selectAll('.card.selected').each(function(d) {
    
                console.log("remove " + d.toString());
             
                for (var r = 0; r < me.board.length; r++) {
                    var row = me.board[r];
                    for (var c = 0; c < row.length; c++) {
                        if (row[c].toString() == d.toString())  {
                            console.log("removed " + d.toString());
                            // row.splice(c, 1);
                            row[c] = me.deck.pop();
                            me.board[r] = row;
                            for (var k = 0; k < row.length; k++) {
                                console.log("remaining row " + row[k].toString());
                            }
                            break;
                        }
                    }
                }
            });

            this.redraw();
        }
        else {
            alert('Nope!');
        }
    }
}
