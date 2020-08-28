import $ from 'jquery';
import 'bootstrap';
import angular from 'angular';
import Game from './game';

import firebase from 'firebase';

export function bootstrap() {

    // Your web app's Firebase configuration
    var firebaseConfig = {
        apiKey: 'AIzaSyAdYgqpZis4VEIAZ1VvFwGhC5ZGvZQ4JWU',
        authDomain: 'set-game-ab2ae.firebaseapp.com',
        databaseURL: 'https://set-game-ab2ae.firebaseio.com',
        projectId: 'set-game-ab2ae',
        storageBucket: 'set-game-ab2ae.appspot.com',
        messagingSenderId: '593771934551',
        appId: '1:593771934551:web:f8ca3657e0945518a80412'
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // See if we're authenticated already 
    var user = firebase.auth().currentUser;
    if (!user) {
        firebase.auth().signInAnonymously()
        .then(function(results){
            user = results.user;

            name = anonymousName();
            var ref = firebase.database().ref('users').child(user.uid);

            ref.set({
                name: name,
                uid: user.uid
            }).catch(function(error) {
                console.error(error);
            });

            ref.onDisconnect().remove().then(function() {
                firebase.auth().signOut();
            });

            boot(name);
        })
        .catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            
            if (errorCode === 'auth/operation-not-allowed') {
                alert('Misconfiguration: enable Anonymous auth in the Firebase Console.');
            } else {
                console.error(error);
            }
        });
    } else {
        console.log("Connected as user: " + user.uid);
        firebase.database().ref('users').child(user.uid).once('value').then(function(snap) {
            if (!snap.exists()) {
                console.error("User " + user.uid + " missing from database");
            } else {
                boot(snap.val().name);
            }
        });
    }
}


function boot(name) {

    $('.spinner').hide();

    console.log('booting ' + 'user ' + firebase.auth().currentUser.uid + " with name " + name);
    console.log(firebase.auth().currentUser);

    var app = angular.module('set', []);

    app.value('db', firebase.database());
    app.value('user', firebase.auth().currentUser);
    app.value('name', name);

    app.controller('game', 
        ['$scope', 'db', 'user', 'name', Game]);


    angular.bootstrap(document, ['set']);
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
