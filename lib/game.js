import d3 from 'd3';
import _ from 'underscore';
import Card from './card';
import Deck from './deck';
import Board from './board';

export default class Game {

    constructor(fb) {

        this.id = "0";

        this.fb = fb.child("game-"+this.id);

        var game = this;
        fb.once('value', function(snap) {
            if (!snap.exists()) {
                game.redeal();
            }
        }, function(err) {
            game.error(err);
            console.log(err);
        });

        this.fb.on('value', function(snap) {
            game.update(snap);
        }, function(err) {
            game.error(err);
            console.log(err);
        });

        fb.child('users').on('value', function(snap) {
            if (snap.exists()) {
                game.users = snap.val();
                var pc = Object.keys(game.users).length;
                // $('#players').text(pc + " player(s)");
            }
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
        $('#message').show(400).delay(3000).fadeOut(1000);

        d3.select('#message').selectAll('.card').data([]).exit().remove();
    }

    showLastSet(set) {
        $('#message').children('span.msg').text("");
        $('#message').show(400).delay(4000).fadeOut(1000);

        var card = d3.select('#message').selectAll('.card').data([]).exit().remove();

        var card = d3.select('#message').selectAll('.card').data(set,
            function(d) { return d.toString(); } 
        );

        var svg = card.enter().append('svg')
            .attr('class', function(d) { 
                return d.toCSSClass() + " small"; 
            })

        svg.append('pattern')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('x', '0').attr('y', '0').attr('width', '5').attr('height', '5')
            .append('use')
                .attr('xlink:href', '#line-1')
        ;
    
        _.each([1, 2, 3], function(x) {
            svg.append('use').attr('class', 's' + x);
        });

        _.each([1, 2, 3], function(x) {
            svg.selectAll('use.s' + x)
                .attr('xlink:href', function(d) { return '#' + d.shape;})
                .attr('style', function(d) { return d.toFillStyleAttr(); } )
                .attr('x', function(d) { return d.toX(x);} );
        });

        svg.selectAll('.card').selectAll('pattern')
            .attr('id', function(d) { return 'lines-' + d.toDashString(); })
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
        if (g.set != undefined) {
            this.set = _.map(g.set, function(x) {
                return new Card(x.num, x.fill, x.color, x.shape);
            });
            // this.showLastSet(this.set);
        }
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

    updateDB(newDeck, newBoard, set) {
        var game = this;

        this.fb.transaction(function(curGame) {
            var l1 = curGame.deck == undefined ? 0 : curGame.deck.length;
            var l2 = game.deck == undefined ? 0 : game.deck.length;
            if (set == undefined) set = [];

            if (l1 == l2) {
                console.log("Cur deck has " + l1 + " cards");
                return {
                    deck: newDeck,
                    board: newBoard,
                    set: set
                }
            } else {
                console.log("Cur deck has " + l1 + " cards");
                console.log("Our deck has " + l2 + " cards");
                console.log("Stale!");
                game.message("Someone beat you to it!");
                return;
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
                var g = snap.val();
                if (g && g.deck) {
                    console.log("Deck has " + g.deck.length + " cards");
                    console.log("Set is " + g.deck.set);
                }
                // game.update(snap); 
            }
        });
    }

    hint() {
        var s = this.board.hasSet();
        if (s) {
            _.each([0, 1], function(x) {
                let sel = "svg[data-card='" + s[x].toString() + "']";
                $(sel)[0].classList.add("selected");
            });
            _.each([0,1,2], function(x) {
                console.log(s[x].toString());
            });
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
            .attr('data-card', function(d) { 
                return d.toString(); 
            })
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
    
        _.each([1, 2, 3], function(x) {
            svg.append('use').attr('class', 's' + x);
        });


        svg.transition()
            .delay(1000)
            .duration(750)
            .style('opacity', 1); 
    
        _.each([1, 2, 3], function(x) {
            svg.selectAll('use.s' + x)
                .attr('xlink:href', function(d) { return '#' + d.shape;})
                .attr('style', function(d) { return d.toFillStyleAttr(); } )
                .attr('x', function(d) { return d.toX(x);} );
        });

        d3.selectAll('.card').selectAll('pattern')
            .attr('id', function(d) { return 'lines-' + d.toDashString(); })
    
    }
    
    noset() {
        if (this.board.hasSet()) {
            this.message("There is a set!");
        } else {
            var deck = this.deck != undefined ? this.deck.slice() : [];
            var board = this.board != undefined ? this.board.slice() : [];

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
    
            var deck = this.deck != undefined ? this.deck.slice() : [];
            var board = this.board != undefined ? this.board.slice() : [];

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

            this.updateDB(deck, board, s);
        }
        else {
            this.message('Nope!');
        }
    }
}
