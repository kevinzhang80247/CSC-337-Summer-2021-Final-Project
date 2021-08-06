/**
 * Primary server file for checkers vs-AI program for CSC 337 final project
 * Authors: Kevin Zhang, Spencer Woodward
 */
// server will be one sectioned file due to the lack of webpack.

//// ----- config -----
// config is an object. access via config['key'];
const config = {
    port: 6192,
    mongodb: "mongodb://127.0.0.1:27017/CSC337Final"
};

//// ----- requires/imports -----
// express server
const express = require('express');
const sessionMiddleware = require('express-sessions');
const bodyParserMiddleware = require('body-parser');
// mongoose
const mongoose = require('mongoose');

//// ----- instantiate server and db -----
// server
const server = express();
server.use(sessionMiddleware({secret: 'ourSecret'}));
server.use(bodyParserMiddleware());

// db
mongoose.connect(config.mongodb);
const db = mongoose.connection;
db.on('error', console.error.bind(console, "Could not establish database connection."));
db.once('open', () => {
    console.log("Connection established to database.");
});

//// ----- object defines, constructors -----
// client-facing objects: these are serialized directly to the client.
function GameState(IsFinished, GameBoard, PlayerScore, ComputerScore, Winner, Player, _id){
    this.isFinished = IsFinished;
    this.board = GameBoard;
    this.playerScore = PlayerScore;
    this.computerScore = ComputerScore;
    this.winner = Winner;
    this.player = Player;
    this.id = _id;
}

function SessionState(Username){
    if(Username == undefined){
        this.loggedIn = false;
    }
    else{
        this.loggedIn = true;
        this.userName = Username;
    }
}

// responses from get/post functions
function Success(message){
    this.errored = false;
    this.message = message;
}
function Fail(message){
    this.errored = true;
    this.message = message;
}

// shared objects
// board coordinates are x-y from lower left corner.
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
    this.x = null;
    this.y = null;
}

// serverside only
function User(username, password){
    this.username = username;
    this.password = password;
    this.scores = [];
}

//// ----- database "schema" ----- 

// the two things we need to store right now

// user information: username, password, uid, score, game uid
// uid is the "primary key" of a user.

// game state information: finished, board, current score for the user and computer, who won (if finished), and game uid
// game uid identifies a game uniquely

// in mongoose, _id is uid.

const UserSchema = new mongoose.Schema({
    username: mongoose.Schema.Types.String,
    password: mongoose.Schema.Types.String,
    activegame: mongoose.Schema.Types.ObjectId,
    scores: [Number]
});

const GameStateSchema = new mongoose.Schema({
    board: mongoose.Schema.Types.Mixed,
    finished: mongoose.Schema.Types.Boolean,
    playerScore: mongoose.Schema.Types.Number,
    computerScore: mongoose.Schema.Types.Number,
    player: mongoose.Schema.Types.ObjectId
});

const UserModel = mongoose.model('user', UserSchema);
const GameStateModel = mongoose.model('gamestate', GameStateSchema);

//// ----- helpers and processing: users and sessions -----

//// ----- helpers and processing: checkers -----
// perform a single AI 'tick' on a game state
function aiMove(gamestate){

}

// instantiate a new game
// returns the gamestate
function newGame(){

}

// checks for victory. returns null, true for player, or false for computer.
function checkVictory(){
    
}

// lists valid 3-tuples of coordinates a piece can move to, as [x, y, captures]
function validMoves(piece){

}

// moves a piece capturing all pieces along the way.
function move(piece, x, y){

}

// captures a piece
function capture(piece){
    
}

// kings a piece
function king(piece){
    
}

//// ----- express setup and bindings -----

// GET: session state
server.get("/site_api/session", (req, res) => {
    if(req.session.username == undefined){
        res.json(new SessionState(undefined));
    }
    else{
        res.json(new SessionState(req.session.username));
    }
})

// GET: game state
server.get("/site_api/game", (req, res) => {
    if(req.session.username == undefined){
        res.json(req.session.gameState);
    }
    else{
        let gameid = undefined;
        let user = await UserModel.findOne({username: req.session.username}).exec();
        if(user == undefined || user.activegame == undefined){
            res.json(undefined);
            return;
        }
        gameid = user.activegame
        let game = await GameStateModel.findOne({_id: gameid});
        if(game == undefined){
            res.json(undefined);
            return;
        }
        else{
            res.json(game);
        }
    }
})

// POST: attempt login
server.post("/site_api/login", (req, res) =>{
    let username = req.body.username;
    let password = req.body.password;
    let account = await UserModel.findOne({username: username, password: password}).exec();
    if(account == undefined){
        res.json(new Error("Invalid username or password."));
        return;
    }
    req.session.username = username;
    res.json(new Success("Successfully logged in."));
})

// GET: high scores for ourselves.
server.get("/site_api/scoreboard", (req, res) => {
    const max = 5;     // default maximum number of users to get
    if(req.session.username == undefined){
        res.json(new Error("Not logged in."));
        return;
    }
})

// POST: account creation
server.post("/site_api/create_account", (req, res) =>{
    let username = req.body.username;
    let password = req.body.password;
    let activegame = undefined;
    if(req.session.gameState != undefined){
        activegame = req.session.gameState.id;
    }
    let existing = await UserModel.findOne({username: username}).exec();
    if(existing != undefined){
        res.json(new Error("Username already exists."));
        return;
    }
    UserModel.create({username: username, password: password, activegame: activegame, scores: []});
    req.session.username = username;
    res.json(new Success("User created."));
})

// POST: game move
// input: x1, y1, x2, y2
// if successful, the client should request game state again.
server.post("/site_api/move_piece", (req, res) =>{
    
})


