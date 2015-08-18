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
                }, function(err) {
                    if (err) consoke.log(err);
                });
                boot(fb, authData);
            }
        });
    } else {
        fb.child("users").child(auth.uid).set({
            provider: auth.provider
        }, function(err) {
            if (err) console.log(err);
        });
        boot(fb, auth);
    } 

}

function boot(fb, auth) {

    var game = new Game(fb, auth);

    $(document).keypress(function(e) {
        switch (e.keyCode) {
            case 115: /* s */
                game.checkForSet();
                break;
            case 104: /* h */
                game.hint();
                break;
            case 110: /* n */
                game.hint();
                break;
        }
        console.log("keycode " + e.keyCode);
    });

    $('#set').click(function() { game.checkForSet(); });
    $('#noset').click(function() { game.noset(); });
    $('#hint').click(function() { game.hint(); });
    $('#newgame').click(function() { game.redeal(); });

    $('.close').click(function() {
        $(this).parent().hide(300);
    });

}
