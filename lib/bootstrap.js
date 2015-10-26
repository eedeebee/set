import angular from 'angular';
import Card from './card';
import Game from './game';
import Board from './board';

import Firebase from 'firebase';

export function bootstrap() {

    var fb = new Firebase("https://funset.firebaseio.com/");
    var auth = fb.getAuth();

    var app = angular.module('set', [])
        .controller("game", Game);

    app.fb = fb;
    app.auth = auth;

    console.log(app.auth);

    angular.bootstrap(document, ['set']);

    if (!auth) {
        fb.authAnonymously(function(error, authData) {
            if (error) {
                console.log("Login Failed!", error);
            } else {
                console.log("Authenticated successfully");
                app.auth = authData;
                
                fb.child("users").child(authData.uid).set({
                    provider: authData.provider,
                    name: anonymousName()
                }, function(err) {
                    if (err) consoke.log(err);
                });
            }
        });
    } else {
        fb.child("users").child(auth.uid).set({
            provider: auth.provider,
            name: anonymousName()
        }, function(err) {
            if (err) console.log(err);
        });
    } 
}

function anonymousName() {

    var presidents = [
        {
            num: 44,
            name: "Obama"
        },
        {
            num: 43,
            name: "Bush"
        },
        {
            num: 42,
            name: "Clinton"
        },
        {
            num: 41,
            name: "Bush"
        },
        {
            num: 40,
            name: "Reagan"
        },
        {
            num: 39,
            name: "Carter"
        },
        {
            num: 38,
            name: "Ford"
        },
        {
            num: 37,
            name: "Nixon"
        },
        {
            num: 36,
            name: "Johnson"
        },
        {
            num: 35,
            name: "Kennedy"
        },
        {
            num: 34,
            name: "Eisenhower"
        },
        {
            num: 33,
            name: "Truman"
        },
        {
            num: 32,
            name: "Roosevelt"
        },
        {
            num: 31,
            name: "Hoover"
        },
        {
            num: 30,
            name: "Coolidge"
        },
        {
            num: 29,
            name: "Harding"
        },
        {
            num: 28,
            name: "Wilson"
        },
        {
            num: 27,
            name: "Taft"
        },
        {
            num: 26,
            name: "Roosevelt"
        },
        {
            num: 25,
            name: "McKinley"
        },
        {
            num: 24,
            name: "Cleveland"
        },
        {
            num: 23,
            name: "Harrison"
        },
        {
            num: 22,
            name: "Cleveland"
        },
        {
            num: 21,
            name: "Arthur"
        },
        {
            num: 20,
            name: "Garfield"
        },
        {
            num: 19,
            name: "Hayes"
        },
        {
            num: 18,
            name: "Grant"
        },
        {
            num: 17,
            name: "Johnson"
        },
        {
            num: 16,
            name: "Lincoln"
        },
        {
            num: 15,
            name: "Buchanan"
        },
        {
            num: 14,
            name: "Pierce"
        },
        {
            num: 13,
            name: "Fillmore"
        },
        {
            num: 12,
            name: "Taylor"
        },
        {
            num: 11,
            name: "Polk"
        },
        {
            num: 10,
            name: "Tyler"
        },
        {
            num: 9,
            name: "Harrison"
        },
        {
            num: 8,
            name: "Van Buren"
        },
        {
            num: 7,
            name: "Jackson"
        },
        {
            num: 6,
            name: "Adams"
        },
        {
            num: 5,
            name: "Monroe"
        },
        {
            num: 4,
            name: "Madison"
        },
        {
            num: 3,
            name: "Jefferson"
        },
        {
            num: 2,
            name: "Adams"
        },
        {
            num: 1,
            name: "Washington"
        }
    ];

    var i = Math.floor(Math.random() * presidents.length);
    return "Anonymous " + presidents[i].name;

}
