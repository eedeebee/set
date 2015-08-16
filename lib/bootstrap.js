import $ from 'jquery';
import Card from './card';
import Game from './game';
import Board from './board';

import Firebase from 'firebase';

export function bootstrap() {

    var fb = new Firebase("https://funset.firebaseio.com/");

    if (!fb.getAuth()) {
        fb.authAnonymously(function(error, authData) {
            if (error) {
                console.log("Login Failed!", error);
            } else {
                console.log("Authenticated successfully");
                fb.child("users").child(authData.uid).set({
                    provider: authData.provider
                });
            }
        });
    }

    var game = new Game(fb);

    $('#set').click(function() { game.checkForSet(); });
    $('#noset').click(function() { game.noset(); });
    $('#hint').click(function() { game.hint(); });
    $('#newgame').click(function() { game.redeal(); });

    $('.close').click(function() {
        $(this).parent().hide(300);
    });

}
