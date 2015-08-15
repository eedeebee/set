import $ from 'jquery';
import Card from './card';
import Game from './game';
import Board from './board';

import Firebase from 'firebase';

export function bootstrap() {


    //Parse.initialize("wm421JjX7G5p8Oq2c4TBtpCgjz48L2yOlaNuKzIt", "lVnzAOhZBYaEDw0l0TQW5dxIJSmgwyUUc2syvmoQ");
    var fb = new Firebase("https://funset.firebaseio.com/");

    var game = new Game(fb);

    $('#set').click(function() { game.checkForSet(); });
    $('#noset').click(function() { game.noset(); });
    $('#addrow').click(function() { 
        game.addThree(); 
        game.redraw(); 
    });

    $('#hint').click(function() { game.hint(); });

    $('#clear').click(function() { 
        game.board = new Board();
        game.redraw();
    });

    $('#removetoprow').click(function() { 
        game.board.splice(0, 3);
        game.redraw();
    });

    $('#redeal').click(function() { 
        game.board = new Board();
        game.redraw();

        game.deck = Card.newDeck();

        for (var i = 0; i < 4; i++) {
            game.addThree();
        }
        game.redraw();
    });

    $('.close').click(function() {
        $(this).parent().hide(300);
    });

}
