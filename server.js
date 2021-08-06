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
const sessionMiddleware = require('express-session');
const cookieMiddleware = require('cookie-parser');
const bodyParserMiddleware = require('body-parser');
const corsMiddleware = require('cors');
// mongoose
const mongoose = require('mongoose');

//// ----- instantiate server and db -----
// server
const server = express();
server.use(cookieMiddleware());
server.use(sessionMiddleware({
    secret: 'ourSecret',
    cookie: {maxAge: 1000 * 60 * 60 * 24, secure: false},
    resave: false,
    saveUninitialized: true
}));
server.use(express.json());
server.use(express.urlencoded());
server.use(express.static('public_html'));
server.use((req, res, next) => {
    if(req.headers.origin){
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    console.debug("Received request: " + req.url + " with " + JSON.stringify(req.body));
    console.debug("Cookie: " + JSON.stringify(req.cookies));
    next();
});

// db
mongoose.connect(config.mongodb);
const db = mongoose.connection;
db.on('error', console.error.bind(console, "Could not establish database connection."));
db.once('open', () => {
    console.log("Connection established to database.");
});

//// ----- object defines, constructors -----
// client-facing objects: these are serialized directly to the client.
function GameState(IsFinished, GameBoard, PlayerScore, ComputerScore, Winner, LastAction, _id){
    this.isFinished = IsFinished;
    this.board = GameBoard;
    this.playerScore = PlayerScore;
    this.computerScore = ComputerScore;
    this.winner = Winner;
    this.lastAction = LastAction;
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
function Board(startingPieces = true){
    let array = [];
    array.length = 8;
    for(let i = 0; i < array.length; i++){
        array[i] = [];
        array[i].length = 8;
    }
    if(startingPieces){
        // make pieces
        let alternate = false;
        // player pieces on bottom
        for(let y = 1; y <= 3; y++){
            for(let x = 1; x <= 8; x++){
                if(!alternate){
                    alternate = !alternate;
                    continue;
                }
                alternate = !alternate;
                let piece = new Piece();
                piece.owner = true;
                piece.x = x;
                piece.y = y;
                array[x - 1][y - 1] = piece;
            }
            alternate = !alternate;
        }
        alternate = true;
        // computer pieces on top
        for(let y = 8; y >= 6; y--){
            for(let x = 1; x <= 8; x++){
                if(!alternate){
                    alternate = !alternate;
                    continue;
                }
                alternate = !alternate;
                let piece = new Piece();
                piece.owner = false;
                piece.x = x;
                piece.y = y;
                array[x - 1][y - 1] = piece;
            }
            alternate = !alternate;
        }
    }
    return array;
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
    winner: mongoose.Schema.Types.Mixed,
    lastAction: mongoose.Schema.Types.String,
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
async function newGame(){
    let obj = await GameStateModel.create({finished: false, board: Board(), playerScore: 0, computerScore: 0, undefined, lastAction: ""});
    return new GameState(obj.finished, obj.board, obj.playerScore, obj.computerScore, obj.winner, obj.lastAction, obj._id);
}

// checks for victory. returns null, true for player, or false for computer.
function checkVictory(state){
    let playerpieces = 0;
    let computerpieces = 0;
    for(let x = 0; x < 8; x++){
        for(let y = 0; y < 8; y++){
            let piece = state.board[x][y];
            if(!piece){
                continue;
            }
            if(piece.owner){
                playerpieces++;
            }
            else{
                computerpieces++;
            }
        }
    }
    if(!playerpieces){
        return false;
    }
    else if(!computerpieces){
        return true;
    }
    else{
        return null;
    }
}

// lists valid 3-tuples of coordinates a piece can move to, as [x, y, captures]
function validMoves(piece){

}

// moves a piece capturing all pieces along the way. returns false for fail, returns number of captures otherwise.
function move(piece, x, y){

}

// captures a piece
function capture(gamestate, piece){
    gamestate.board[piece.x][piece.y] = undefined;
    if(piece.owner){
        gamestate.computerScore++;
    }
    else{
        gamestate.playerScore++;
    }
    gamestate.last_action = piece.owner? "Your piece has been captured!" : "You captured a piece!";
}

// kings a piece
function king(piece){
    piece.king = true;
}

async function handle_move_piece(req, res){
    // get state
    
    // move piece

    // check victory
    
    // ai move

    // check victory
}

async function handle_new_game(req, res){
    // first, create a new state
    let state = await newGame();
    state.lastAction = "Game started!";
    await saveGameState(state);
    // save as necessary
    req.session.gameState = state;
    req.session.save();
    if(req.session.username){
        console.log("updating existing user " + req.session.username + " activegame to " + state.id);
        await UserModel.updateOne({username: req.session.username}, {activegame: state.id});
    }
    res.send(new Success("New game started."));
}

async function saveGameState(state){
    GameStateModel.updateOne({_id: state.id}, {isFinished: state.isFinished, board: state.board, playerScore: state.playerScore, computerScore: state.computerScore, winner: state.winner, lastAction: state.lastAction});
}

//// ----- express setup and bindings -----

// GET: session state
server.get("/site_api/session", (req, res) => {
    console.log("Session was " + JSON.stringify(req.session));
    if(req.session.username == undefined){
        res.send(new SessionState(undefined));
        console.log("Responding with undefined.");
    }
    else{
        res.send(new SessionState(req.session.username));
        console.log("Responding with " + req.session.username + ".");
    }
})

// GET: game state
server.get("/site_api/game", (req, res) => {
    if(req.session.username == undefined){
        res.send(req.session.gameState);
    }
    else{
        UserModel.findOne({username: req.session.username}).then((user) => {
            if(user == undefined || user.activegame == undefined){
                res.send(undefined);
                return;
            }
            gameid = user.activegame;
            console.log("getting activegame: " + gameid);
            GameStateModel.findOne({_id: gameid}).then((game) => {
                res.send(game);
                console.log("sent gamestate: " + JSON.stringify(game));
                req.session.gameState = game;
            });
        });
    }
})

// POST: attempt login
server.post("/site_api/login", (req, res) =>{
    let username = req.body.username;
    let password = req.body.password;
    UserModel.findOne({username: username, password: password}).then((user) => {
        if(user == undefined){
            res.send(new Fail("Invalid username or password."));
            return;
        }
        req.session.username = username;
        console.log("Recording session.");
        console.log("Session is " + JSON.stringify(req.session));
        res.send(new Success("Successfully logged in."));
        req.session.save();
    });
});

// GET: high scores for ourselves.
server.get("/site_api/scoreboard", (req, res) => {
    const max = 5;     // default maximum number of users to get
    if(req.session.username == undefined){
        res.send(new Fail("Not logged in."));
        return;
    }
    UserModel.findOne({username: username, password: password}).then((user) => {
        
    })
})

// POST: account creation
server.post("/site_api/register", (req, res) =>{
    let username = req.body.username;
    UserModel.findOne({username: username}).then((user) => {
        if(user != undefined){
            res.send(new Fail("Username already exists."));
            return;
        }
        let password = req.body.password;
        if(username.length == 0){
            res.send(new Fail("Username cannot be empty."));
            return;
        }
        if(password.length == 0){
            res.send(new Fail("Password cannot be empty."));
            return;
        }
        let activegame = req.session.gameState == undefined? undefined : req.session.gameState.id;
        UserModel.create({username: username, password: password, activegame: activegame, score: []});
        req.session.username = username;
        res.send(new Success("User created."));
        req.session.save();
    });
})

// GET: New game
server.get("/site_api/new_game", (req, res) => {
    handle_new_game(req, res);
});

// POST: game move
// input: x1, y1, x2, y2
// if successful, the client should request game state again.
server.post("/site_api/move_piece", (req, res) =>{
    handle_move_piece(req, res);
})

//// ----- finalization ----
server.listen(config.port, () => console.log("Server running on port " + config.port));

