import $ from 'jquery';
import Card from './card';
import Game from './game';
import Board from './board';

import Firebase from 'firebase';

export function bootstrap() {

    var fb = new Firebase("https://funset.firebaseio.com/");

    var auth = fb.getAuth();

    if (!auth) {
        fb.authAnonymously(function(error, authData) {
            if (error) {
                console.log("Login Failed!", error);
            } else {
                console.log("Authenticated successfully");
                fb.child("users").child(authData.uid).set({
                    provider: authData.provider
                });
                boot(fb, auth);
            }
        });
    } else {
        fb.child("users").child(authData.uid).set({
            provider: authData.provider
        });
        boot(fb, auth);
    } 

}

function boot(fb, auth) {

    var game = new Game(fb, auth);

    $('#set').click(function() { game.checkForSet(); });
    $('#noset').click(function() { game.noset(); });
    $('#hint').click(function() { game.hint(); });
    $('#newgame').click(function() { game.redeal(); });

    $('.close').click(function() {
        $(this).parent().hide(300);
    });

}
