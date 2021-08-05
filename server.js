/**
 * Primary server file for checkers vs-AI program for CSC 337 final project
 * Authors: Kevin Zhang, Spencer Woodward
 */
// server will be one sectioned file due to the lack of webpack.

//// ----- config -----
// config is an object. access via config['key'];
const config = {
    port: 6192,
    mongodb: "mongodb://127.0.0.1:27017"
};

//// ----- requires/imports -----
// express server
const server = require('express');
const sessionMiddleware = require('express-sessions');
const bodyParserMiddleware = require('body-parser');
// mongoose
const mongo = require('mongoose');

//// ----- object defines, constructors -----
// client-facing objects: these are serialized directly to the client.
function GameState(IsPlaying, IsFinished, GameBoard, PlayerScore, ComputerScore, Winner){
    this.isPlaying = IsPlaying;
    this.isFinished = IsFinished;
    this.board = GameBoard;
    this.playerScore = PlayerScore;
    this.computerScore = ComputerScore;
    this.winner = Winner;
}

function SessionState(Username){
    this.loggedIn = LoggedIn;
    this.username = Username;
}

function ScoreboardEntry(username, score){
    this.username = username;
    this.score = score;
}

// shared objects
function Board(){
    this.array = [];
    this.array.length = 8;
    for(let i = 0; i < this.array.length; i++){
        this.array[i] = [];
        this.array[i].length = 8;
    }
}

function Piece(){
    this.owner = null;
    this.king = false;
}

// serverside only
function User(username, password, uid){
    this.username = username;
    this.password = password;
    this.uid = uid;
}

//// ----- helpers and processing: checkers -----

//// ----- helpers and processing: users and sessions -----

//// ----- express setup and bindings -----



