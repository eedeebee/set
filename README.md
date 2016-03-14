# SET

There are two versions so far.  

- A command line engine written in python
- A web page written using ES6, using svg and D3.

Multiplayer webapp runs at https://eedeebee.github.io/set

# Pre-requisites

For the python command line:

    % pip3 install termcolor
    % python3 set.py

For the web app

    % npm install jspm --save-dev
    % ./node_modules/.bin/jspm update
    % python3 http.server
    % open http://localhost:8000/index.html

The built version of master is usually pushed up to the gh-pages branch of the the github repo but sometimes gh-pages is lagging.  There are likely some bugs as I didn't write any tests :)


