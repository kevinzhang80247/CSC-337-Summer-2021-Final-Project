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
                piece.x = x - 1;
                piece.y = y - 1;
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
function aiMove(state){
    let pieces = [];
    // gather all our pieces
    for(let y = 0; y < 8; y++){
        for(let x = 0; x < 8; x++){
            if(pieceAt(state, x, y) == false){
                pieces.push(state.board[x][y]);
            }
        }
    }
    let possible_slides = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    let possible_jumps = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
    let possible_moves = [];
    // 2 loops
    // 1: prefer capture
    for(let i = 0; i < pieces.len; i++){
        let piece = pieces[i];
        for(let j = 0; j < possible_jumps.len; j++){
            if(checkJump(state, piece, piece.x + possible_jumps[j][0], piece.y + possible_jumps[j][1])){
                possible_moves.push([piece, piece.x + possible_jumps[j][0], piece.y + possible_jumps[j][1]])
            }
        }
    }
    if(possible_moves.length){
        let moveTuple = possible_moves[Math.floor(Math.random() * possible_moves.length)];
        let capture = move(state, moveTuple[0], moveTuple[1], moveTuple[2]);
        return capture > 0;
    }
    possible_moves = [];
    // 2: random directmove
    for(let i = 0; i < pieces.len; i++){
        let piece = pieces[i];
        for(let j = 0; j < possible_slides.len; j++){
            if(checkDirectMove(state, piece, piece.x + possible_slides[j][0], piece.y + possible_slides[j][1])){
                possible_moves.push([piece, piece.x + possible_slides[j][0], piece.y + possible_slides[j][1]])
            }
        }
    }
    if(possible_moves.length){
        let moveTuple = possible_moves[Math.floor(Math.random() * possible_moves.length)];
        let capture = move(state, moveTuple[0], moveTuple[1], moveTuple[2]);
        if(capture > 0){
            aiMove(state);
        }
        return capture > 0;
    }
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

// automatic victory check function
function autoVictory(state){
    let returned = checkVictory(state);
    if(returned != null){
        state.winner = returned;
        state.isFinished = true;
        state.lastAction = state.winner? "You won!" : "You lost!";
    }
    return returned != null;
}

// user move function
// returns undefined if invalid move
// false if success
// true if jump
function user_move(state, oldx, oldy, newx, newy){
    let piece = pieceAt(oldx, oldy);
    if(!piece){
        state.lastAction = "Invalid piece!";
        return undefined;
    }
    if(outOfBounds(newx, newy)){
        state.lastAction = "Invalid location!";
        return undefined;
    }
    let returned = move(state, piece, newx, newy);
    if(returned == false){
        state.lastAction = "Invalid move!";
        return undefined;
    }
    return returned > 0;
}

// returns undefined, true, or false if no piece, player piece, or computer piece at pos
function pieceAt(state, x, y){
    if(outOfBounds(x, y)){
        return undefined;
    }
    return state.board[x][y]? state.board[x][y].owner : undefined
}

// returns undefined or capturedpiece for a jump. only direct 1-jumps!
function checkJump(state, piece, newx, newy){
    let x = piece.x
    let y = piece.y
    if(outOfBounds(newx, newy)){
        return undefined;
    }
    if(Math.abs(newx - x) != 2 || Math.abs(newy - y) != 2){
        return undefined;
    }
    if(!piece.king && ((piece.owner && (newy < piece.y)) || (!piece.owner && (newy > piece.y)))){
        return undefined;
    }
    // check middle piece
    let midx = (newx - x) / 2 + x;
    let midy = (newy - y) / 2 + y;
    let mid = pieceAt(state, midx, midy);
    if(mid == undefined){
        return undefined;
    }
    if(mid.owner == piece.owner){
        return undefined;
    }
    return mid;
}

// returns true/false for a direct move
function checkDirectMove(state, piece, newx, newy){
    if(outOfBounds(newx, newy)){
        return false;
    }
    if(!(Math.abs(piece.x - newx) == 1) || !(Math.abs(piece.y - newy) == 1)){
        return false;
    }
    if(!piece.king && ((piece.owner && (newy < piece.y)) || (!piece.owner && (newy > piece.y)))){
        return false;
    }
    return true;
}

// returns if a location is out of bounds
function outOfBounds(x, y){
    return x < 0 || y < 0 || x > 7 || y > 7;
}

// moves a piece capturing all pieces along the way. returns false for fail, returns number of captures otherwise.
function move(state, piece, x, y){
    if(outOfBounds(x, y)){
        return false;
    }
    // ensure diagonalness
    if(Math.abs(piece.x - x) != Math.abs(piece.y - y)){
        return false;
    }
    // direct move
    if(Math.abs(piece.x - x) == 1){
        if(!checkDirectMove(state, piece, x, y)){
            return false;
        }
        piece.x = x;
        piece.y = y;
        // if reaching end, king
        if(piece.owner && piece.y == 7 || !piece.owner && piece.y == 0){
            king(piece);
        }
        return 0;
    }
    // jump
    else if(Math.abs(piece.x - x) == 2){
        let captured = checkJump(state, piece, x, y);
        if(!captured){
            return false;
        }
        piece.x = x;
        piece.y = y;
        capture(state, captured);
        // if reaching end, king
        if(piece.owner && piece.y == 7 || !piece.owner && piece.y == 0){
            king(piece);
        }
        return 1;
    }
    else{
        return false;
    }
}

// captures a piece
function capture(gamestate, piece){
    gamestate.board[piece.x][piece.y] = undefined;
    piece.x = undefined;
    piece.y = undefined;
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

async function get_state_from_request(req){
    if(req.session.username == undefined){
        return req.session.gameState;
    }
    let user = await UserModel.findOne({username: req.session.username});
    if(user == undefined){
        return req.session.gameState;
    }
    let stateid = user.activegame;
    if(stateid == undefined){
        return req.session.gameState;
    }
    return await GameStateModel.findOne({_id: stateid});
}

// converts coordinates too because the actual board is 0 indexed as in most programming languages
async function handle_move_piece(req, res){
    // get state
    let state = get_state_from_request(req);
    if(!state){
        res.send(new Fail("No gamestate detected; Start a new game."));
        return;
    }
    // move piece
    let returned = user_move(state, req.body.oldx - 1, req.body.oldy - 1, req.body.newx - 1, req.body.newy - 1)
    if(returned == undefined){
        res.send(new Fail("Invalid move."));
        return;
    }
    // check victory
    if(autoVictory(state)){
        saveGameState(state)
        res.send(new Success("Game concluded."));
        return;
    }
    if(returned){
        // true value means it's still our turn because we jumped
        return;
    }
    let captured = false;
    do{
        captured = aiMove(state);
        if(autoVictory(state)){
            saveGameState(state);
            res.send(new Success("Game concluded."));
            return;
        }
    } while(captured)
    saveGameState(state)
    res.send(new Success("Move complete; update pending."));
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

