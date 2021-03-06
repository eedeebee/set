import $ from 'jquery';
import angular from 'angular';
import d3 from 'd3';
import _ from 'underscore';
import Card from './card';
import Deck from './deck';
import Board from './board';

import firebase from 'firebase';

export default class Game {

    constructor($scope, db, user, name) {

        this.id = '0';
        this.user = user;
        this.name = name;
        this.hint_index = 0;
        this.players = [];
        this.last_name = "";
        this.last_set = [];
        this.last_uid = undefined;
    
        this.db = db;
        this.ref = db.ref("game-"+this.id);

        var game = this;
        this.ref.once('value').then(function(snap) {
            console.log('once');
            if (!snap.exists()) {
                game.redeal();
            }
        }).catch(function(err) {
            game.error(err);
            console.log(err);
        });

        this.ref.on('value', function(snap) {
            if (snap.exists()) {
                console.log("Game updated");
                console.dir(snap.val());
                game.update(snap.val());
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }
        });

        this.ref.child('players').once('value', function(snap) {
            if (snap.exists()) {
                $scope.$apply();
            }
        });

        console.log("Setting score to 0");

        this.ref.child('players').child(this.user.uid).set({
            name: name,
            uid: this.user.uid,
            score: 0
        }).catch(function(error) {
            console.error(error);
        });

        this.ref.child('players').child(this.user.uid).onDisconnect().remove();

        $(window).resize(function() {
            game.updateCardUI();
        });

        this.updateCardUI();
    }

    updateCardUI() {
        var w = $(window).width();
        var h = $(window).height();

        console.log("Window: width=" + w + ", height=" + h);
        var lim = 3 * (h) / 2;

        // Card UI stuff
        this.cw = (((w > lim ? lim : w) / 3) / 5 * 3) - 3;
        this.ch = this.cw * 10/18;
        var ow = (((w) / 3) / 5 * 3) - 3;
        this.cm = ow * 6/18;
        this.br = this.cw / 10;

        $('.card').width(this.cw);
        $('.card').height(this.ch);
        $('.card').css('margin', "10 " + this.cm + " 10 " + this.cm);
        $('.card').css('border-radius', this.br);

    }

    error(s) {
        $('#error').children('span.msg').text(s);
        $('#error').show(400);
    }

    dismissError() {
        $('#error').hide(400);
    }

    message(s) {
        $('#message').children('span.msg').text(s);
        $('#message').show(400).delay(2200).fadeOut(500);
    }

    showLastSet(set) {
        var card = d3.select('#last-set').selectAll('.card').data([]).exit().remove();

        $('#last-set').show(400).delay(2200).fadeOut(1000);

        var card = d3.select('#last-set').selectAll('.card').data(set,
            function(d) { return d.toString(); } 
        );

        var svg = card.enter().append('svg')
            .attr('viewBox', '0 0 180 100')
            .style('width', this.cw/2)
            .style('height', this.ch/2)
            .style('margin', "10 " + this.cm/2 + " 10 " + this.cm/2)
            .style('border-radius', this.br/2)
            .attr('class', function(d) { 
                return d.toCSSClass() + " small"; 
            })

        this.drawCard(svg);
    }

    update(game) {
        if (!game) return;

        if (game.players != undefined) {

            // Look for first player who's score went up
            // TODO: share all score deltas
            for (var player in game.players) {
                var newPlayer = game.players[player];
                var oldPlayer = this.players[player];

                if (oldPlayer != undefined) {
                    if (newPlayer.score > oldPlayer.score) {
                        this.message(oldPlayer.name + " scored a set");
                        break;
                    }
                }
            }

            this.players = game.players;
        }

        if (game.last_set != undefined) {
            this.last_set = _.map(game.last_set, function(x) {
                return Card.newCard(x);
            });
        }

        if (game.last_uid != undefined) {
            this.last_uid = game.last_uid;
        }
        if (game.last_name != undefined) {
            this.last_name = game.last_name;
        }

        if (game.board) {
            if (game.deck) {
                this.deck = new Deck(game.deck);
            } else {
                this.deck = [];
            }
        }

        this.board = new Board(game.board);
        this.redrawUI();
    }

    redeal() {
        var deck = new Deck();
        var board = new Board();
        for (let i = 0; i < 12; i++) {
            board.push(deck.pop());
        }
        
        for (var p in this.players) {
            this.players[p].score = 0;
        }

        this.updateDB(deck, board);
    }

    updateDB(newDeck, newBoard, set) {
        var game = this;

        this.last_name = this.name;
        this.last_uid = this.user.uid;

        this.ref.transaction(function(curGame) {
            var l1 = (curGame == null || curGame.deck == undefined) ? 0 : curGame.deck.length;
            var l2 = game.deck == undefined ? 0 : game.deck.length;
            if (set == undefined) set = [];

            if (l1 == l2) {
                console.log("Cur deck has " + l1 + " cards");
                return {
                    deck: newDeck,
                    board: newBoard,
                    last_set: set,
                    players: game.players,
                    last_name: game.name,
                    last_uid: game.user.uid
                }
            } else {
                console.log("Cur deck has " + l1 + " cards");
                console.log("Our deck has " + l2 + " cards");
                console.log("Stale!");
                game.message("Someone (" + curGame.last_name +  ") beat you to it!");
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
                var g = snap.val();
                if (g) {
                    if (g.deck) {
                        console.log("Deck has " + g.deck.length + " cards");
                    } else {
                        console.log("Deck is empty");
                    }
                    var set = _.map(g.last_set, function(x) {
                        return new Card(x.num, x.fill, x.color, x.shape);
                    });
                    console.log("Set was " + 
                        _.reduce(set, function(memo, x) {
                            return memo + " " + (Card.newCard(x)).toString();
                        })
                    );
                }
            }
        });
    }

    hint() {
        var s = this.board.hasSet();
        if (s) {
            let sel = "svg[data-card='" + s[this.hint_index].toString() + "']";
            $(sel)[0].classList.add("selected");
            this.hint_index = (this.hint_index + 1) % 3;

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
            .style('width', this.cw)
            .style('height', this.ch)
            .style('margin', "10 " + this.cm + " 10 " + this.cm)
            .style('border-radius', this.br)
            .style('opacity', 0) 
            .attr('viewBox', '0 0 180 100')
            .attr('tabindex', 0) 
            .attr('data-card', function(d) { 
                return d.toString(); 
            })
            .attr('class', function(d) { 
                return d.toCSSClass(); 
            })
            .on('keydown', function(d) {
                console.log("D3 Key code " + d3.event.keyCode);
                if (d3.event.keyCode == 32 || d3.event.keyCode == 13) {
                    this.classList.toggle('selected'); 
                    console.log(d.toString() + ' ' + this.classList.contains('selected'));
                }
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
    
        this.drawCard(svg);

        svg.transition()
            .delay(1000)
            .duration(750)
            .style('opacity', 1); 
    }

    drawCard(svg) {

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

        svg.selectAll('pattern')
            .attr('id', function(d) { return 'lines-' + d.toDashString(); })
    
    }
    
    noset() {
        if (this.board.hasSet()) {
            this.error("There is a set!");
            this.updateScore(-1);
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

    updateScore(delta) {
        this.players[this.user.uid].score = this.players[this.user.uid].score + delta;
        console.log("Update score to : " + this.players[this.user.uid].score);
        this.ref.child('players').child(this.user.uid).update({
            score: firebase.database.ServerValue.increment(delta)
        }).catch(function(error) {
            console.error(error);
        });
    }
    
    checkForSet() {
        var s = d3.selectAll('.card.selected').data();
        if (s.length != 3) {
            this.message("Choose 3 cards");
            return false;
        }

        
        if (Card.isSet(s[0], s[1], s[2])) {
            this.message('Set!');
            this.players[this.user.uid].score = this.players[this.user.uid].score + 1;
    
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
            this.updateScore(-1);
            this.message('Nope!');
        }
    }

    keyPress(e) {
        switch (e.keyCode) {
            case 115: /* s */
                this.checkForSet();
                break;
            case 104: /* h */
                this.hint();
                break;
            case 110: /* n */
                this.hint();
                break;
        }
        console.log("keycode " + e.keyCode);
    }
}
