import _ from 'lodash-node/modern/lang/isEqual';
import $ from 'jquery';
import underscore from 'myname';
import d3 from 'd3';

export function bootstrap() {

    deal();

    for (var i = 0; i < 4; i++) {
        addRow();
    }

    $('#set').click(function() { set(); });
    $('#noset').click(function() { noset(); });
    $('#addrow').click(function() { addRow(); });

    $('#clear').click(function() { 
        board = [];
        update();
    });

    $('#removetoprow').click(function() { 
        board.splice(0, 1);
        update();
    });

    $('#redeal').click(function() { 
        board = [];
        update();
        deck = [];
        deal();
        for (var i = 0; i < 4; i++) {
            addRow();
        }
    });

}

var Numbers = [1, 2, 3];
var Colors  = ['red', 'green', 'purple'];
var Shapes  = ['oval', 'diamond', 'squiggle'];
var Fills   = ['solid', 'empty', 'lines'];
    
function isSet(a, b, c) {

    var numberOK =  ((a.num == b.num && b.num == c.num) || (a.num != b.num && b.num != c.num && a.num != c.num))
    console.log(numberOK);
    var fillOK =  ((a.fill == b.fill && b.fill == c.fill) || (a.fill != b.fill && b.fill != c.fill && a.fill != c.fill))
    console.log(fillOK);
    var colorOK =  ((a.color == b.color && b.color == c.color) || (a.color != b.color && b.color != c.color && a.color != c.color))
    console.log(colorOK);
    var shapeOK =  ((a.shape == b.shape && b.shape == c.shape) || (a.shape != b.shape && b.shape != c.shape && a.shape != c.shape))
    console.log(shapeOK);

    return colorOK && fillOK && shapeOK && numberOK

}

export function hint() {
    var s = hasSet();
    if (s) {
        var ct = cardToText(s[0]);
        alert(ct);
    } else {
        alert("No Set!");
    }

}
function hasSet() {

    var cards = [];
    for (var c = 0; c < board.length; c++) {
        var r = board[c];
        for (var d = 0; d < 3; d++) {
            cards.push(r[d]);
        }
    }

    var N = board.length * 3;
    for (var i = 0; i < N - 2; i++) {
        for (var j = 1; j < N - 1; j++) {
            for (var k = 2; k < N; k++) {
                if (isSet(cards[i], cards[j], cards[k])) {
                    return [cards[i], cards[j], cards[k]];
                }
            }
        }
    }

    return false;
}

var deck = [];
var board = [];

function deal() {

    // Create deck
    for (var n in Numbers) {
        for (var f in Fills) {
            for (var c in Colors) {
                for (var s in Shapes) {
                    deck.push({
                        num: Numbers[n],
                        fill: Fills[f],
                        color: Colors[c],
                        shape: Shapes[s]
                    });
                }
            }
        }
    }
    d3.shuffle(deck);
};

function cardToS1x(c) {
    switch(c.num) {
        case 1: return 72;
        case 2: return 47;
        case 3: return 22;
    }
}
function cardToS2x(c) {
    switch(c.num) {
        case 1: return 72;
        case 2: return 97;
        case 3: return 72;
    }
}
function cardToS3x(c) {
    switch(c.num) {
        case 1: return 72;
        case 2: return 97;
        case 3: return 122;
    }
}

function cardToCSSClass(c) {
    return "card " + c.color + " " + c.fill;
}

function cardToFillStyleAttr(c) {
    if (c.fill == 'lines') {
        return "fill:url('#lines-" + c.color + "')";
    }
    else {
        return "";
    }
}

function cardToText(c) {
    return  c.num + ' ' + 
            c.fill + ' ' + 
            c.color + ' ' + 
            c.shape;
}

function update() {

    var row = d3.selectAll('.row').data(board, function(d) { 
        var r = "";
        for (var j = 0; j < d.length; j++) {
            r += cardToText(d[j]) + " ";
        } 
        return r;
    });

    row.exit()
        .transition().duration(750)
        .style('opacity', 0)
        .remove();

    var card = row.enter()
        .append('div').attr('class', 'row')
        .selectAll('.spot')
        .data(function(d) { return d; }, function(d) {
            return cardToText(d);
        })

    var c = card.enter()
        .append('div')
            .style('opacity', 0)
            .attr('class', 'spot col-xs-6 col-sm-4')

    c.transition()
        .duration(750)
        .style('opacity', 1); 

    var svg = c.append('svg')
        .attr('class', function(d) { return cardToCSSClass(d); })
        .on('click', function(d) { 
            this.classList.toggle('selected'); 
            console.log(cardToText(d) + ' ' + this.classList.contains('selected'));
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
            return cardToText(d);
        })

    upd.exit().transition()
        .duration(750)
        .style('opacity', 0)
        .remove();

    svg = upd.enter()
        .append('div')
            .attr('class', 'spot col-xs-6 col-sm-4')
            .append('svg')
                .style('opacity', 0)

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
    svg.insert('use').attr('class', 's3');

    upd.select('svg')
        .attr('class', function(d) { return cardToCSSClass(d); })
        .on('click', function(d) { 
            this.classList.toggle('selected'); 
            console.log(cardToText(d) + ' ' + this.classList.contains('selected'));
        });

    //upd.selectAll('.debug-text').text(function(d) { return cardToText(d); });

    d3.selectAll('.row').selectAll('pattern')
        .attr('id', function(d) { return 'lines-' + d.color; })

    row.selectAll('use.s1')
        .attr('xlink:href', function(d) { return '#' + d.shape;})
        .attr('style', function(d) { return cardToFillStyleAttr(d); } )
        .attr('x', function(d) { return cardToS1x(d);} );
    row.selectAll('use.s2')
        .attr('xlink:href', function(d) { return '#' + d.shape;})
        .attr('style', function(d) { return cardToFillStyleAttr(d); } )
        .attr('x', function(d) { return cardToS2x(d);} );
    row.selectAll('use.s3')
        .attr('xlink:href', function(d) { return '#' + d.shape;})
        .attr('style', function(d) { return cardToFillStyleAttr(d); } )
        .attr('x', function(d) { return cardToS3x(d);} );

}

export function noset() {
    if (hasSet()) {
        alert("There is a set!");
    } else {
        addRow();
    }
}

export function set() {
    var s = d3.selectAll('.card.selected').data();
    if (s.length != 3) {
        alert("Choose 3 cards");
        return false;
    }

    if (isSet(s[0], s[1], s[2])) {
        alert('Set!');

        // Replace these cards
        d3.selectAll('.card.selected').each(function(d, i) {

            var ct = cardToText(d);
            console.log("remove " + ct + " index " + i);
            
            for (var r = 0; r < board.length; r++) {
                row = board[r];
                for (var c = 0; c < row.length; c++) {
                    if (cardToText(row[c]) == ct)  {
                        console.log("removed " + ct);
                        // row.splice(c, 1);
                        row[c] = deck.pop();
                        board[r] = row;
                        for (var k = 0; k < row.length; k++) {
                            console.log("remaining row " + cardToText(row[k]));
                        }
                        break;
                    }
                }
            }
        });

        update();

    }
    else {
        alert('Nope!');
    }
}

function addRow() {
    var r = [];
    for (var i = 0; i < 3; i++) {
        // TODO: handle end of game
        r.push(deck.pop());
    }
    board.push(r);
    update();
}
