import d3 from 'd3';
import Card from './card';
import Deck from './deck';
import Board from './board';

export default class Game {

    constructor(fb) {

        this.id = "0";


        this.fb = fb.child("game-"+this.id);

        var game = this;
        fb.once('value', function(snap) {
            // Create a new game
            if (!snap.exists()) {
                game.redeal();
            }
        }, function(err) {
            game.error(err);
            console.log(err);
        });

        this.fb.on('value', function(snap) {
            // Update the game
            game.update(snap);
        }, function(err) {
            game.error(err);
            console.log(err);
        });
    }

    error(s) {
        $('#error').children('span.msg').text(s);
        $('#error').show(400);
    }

    message(s) {
        $('#message').children('span.msg').text(s);
        $('#message').show(400);
    }

    update(snap) {
        var g = snap.val();
        if (!g) return;
        if (g.board && g.deck) {
            // Handle case when deck is empty, 
            // but we are still playing
            // Don't want to deal a new deck yet 
            // In that case.
            this.deck = new Deck(g.deck);
        }
        this.board = new Board(g.board);
        this.redrawUI();
    }

    redeal() {
        var deck = new Deck();
        var board = new Board();
        for (let i = 0; i < 12; i++) {
            board.push(deck.pop());
        }
        this.updateDB(deck, board);
    }

    updateDB(newDeck, newBoard) {
        var game = this;

        this.fb.transaction(function(curGame) {
            if (curGame.deck.length != game.deck.length) {
                console.log("Stale!");
                this.message("Someone beat you to it!");
                return;
            } else {
                return {
                    deck: newDeck,
                    board: newBoard
                }
            }
        }, function(error, committed, snap) {
            if (error) {
                console.log(error);
                game.error(error);
            }
            else if (!committed) {
                console.log("Aborted");
                game.error("Aborted");
            } else {
                console.log("Set recorded");
                game.update(snap); // Needed?
            }
        });
    }

    hint() {
        var s = this.board.hasSet();
        if (s) {
            this.message(s[0].toString() + " " + s[1].toString());
            console.log(s);
        } else {
            this.message("No Set!");
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
                .attr('class', function(d) { 
                    return d.toCSSClass(); 
                })
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

        d3.selectAll('.card').selectAll('pattern')
            .attr('id', function(d) { return 'lines-' + d.color; })
    
    }
    
    noset() {
        if (this.board.hasSet()) {
            this.message("There is a set!");
        } else {
            var deck = this.deck.slice();
            var board = this.board.slice();

            if (deck && deck.length >= 3) {
                for(let i = 0; i < 3; i++) {
                    board.push(deck.pop());
                }
                this.updateDB(deck, board);
            } else {
                this.message("Game over, deck empty!");
            }
        }
    }

    checkForSet() {
        var s = d3.selectAll('.card.selected').data();
        if (s.length != 3) {
            this.message("Choose 3 cards");
            return false;
        }
    
        if (Card.isSet(s[0], s[1], s[2])) {
            // this.message('Set!');
    
            var deck = this.deck.slice();
            var board = this.board.slice();

            // Replace these cards
            d3.selectAll('.card.selected').each(function(d) {
    
                console.log("remove " + d.toString());
             
                for (let c = 0; c < board.length; c++) {
                    if (board[c].toString() == d.toString())  {
                        console.log("removed " + d.toString());
                        if (deck && deck.length > 0 && board.length <= 12) {
                            board[c] = deck.pop();
                        } else {
                            board.splice(c, 1);
                        }
                        break;
                    }
                }
            });

            this.updateDB(deck, board);
        }
        else {
            this.message('Nope!');
        }
    }
}
