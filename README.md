# SET

There are two versions so far.  

- A command line engine written in python
- A multi-user, web app written using ES6, svg, D3 and firebase.

Multiplayer webapp runs at https://eedeebee.github.io/set

# Pre-requisites

## Cmd line
For the python command line on MacOS 10.15:

    % pip3 install termcolor --user
    % python3 set.py

## For the web app

    % npm install jspm --save-dev
    % ./node_modules/.bin/jspm update
    % python3 -m http.server
    % open http://localhost:8000/index.html

The built version of master is usually pushed up to the gh-pages branch of the the github repo 
but sometimes gh-pages is lagging. There are likely bugs as I didn't write any tests :)
