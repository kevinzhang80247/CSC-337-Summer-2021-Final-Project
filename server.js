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
// dependencies
const crypto = require('crypto');

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
function GameState(IsFinished, GameBoard, PlayerScore, ComputerScore, Winner, LastAction, _id, lastmovedpiece){
    this.isFinished = IsFinished;
    this.board = GameBoard;
    this.playerScore = PlayerScore;
    this.computerScore = ComputerScore;
    this.winner = Winner;
    this.lastAction = LastAction;
    this._id = _id;
    this.lastMovedPiece = lastmovedpiece
}

function SessionState(Username){
    if(Username == undefined){
        this.loggedIn = false;
    }
    else{
        this.loggedIn = true;
        this.userName = Username;
        this.scores = [];
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
                piece.x = x - 1;
                piece.y = y - 1;
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
    scores: [Number],
    salt: mongoose.Schema.Types.String
});

const GameStateSchema = new mongoose.Schema({
    board: mongoose.Schema.Types.Mixed,
    isFinished: mongoose.Schema.Types.Mixed,
    playerScore: mongoose.Schema.Types.Number,
    computerScore: mongoose.Schema.Types.Number,
    winner: mongoose.Schema.Types.Mixed,
    lastAction: mongoose.Schema.Types.String,
    lastMovedPiece: mongoose.Schema.Types.Mixed
});

const UserModel = mongoose.model('user', UserSchema);
const GameStateModel = mongoose.model('gamestate', GameStateSchema);

//// ----- helpers and processing: users and sessions -----

async function get_salt(username){
    let user = await UserModel.findOne({username}).exec();
    if(!user){
        return undefined;
    }
    return user.salt;
}

async function gen_salt(){
    let salt = crypto.randomBytes(64).toString('base64');
    console.debug("generated salt " + salt);
    return salt;
}

async function password_to_db(plaintext, salt){
    let result = crypto.pbkdf2Sync(plaintext, salt, 1000, 64, 'sha512');
    // console.debug("successfully transformed " + plaintext + " plaintext password --> " + result);
    return result;
}

//// ----- helpers and processing: checkers -----
// perform a single AI 'tick' on a game state
function aiMove(state, force_piece, jumpOnly = false){
    console.log("ai moving");
    let pieces = [];
    if(force_piece == undefined){
        // gather all our pieces
        for(let y = 0; y < 8; y++){
            for(let x = 0; x < 8; x++){
                if(pieceAt(state, x, y) == false){
                    pieces.push(state.board[x][y]);
                }
            }
        }
    }
    else{
        pieces = [force_piece];
    }
    console.debug("ai found " + pieces.length + " of its pieces.");
    let possible_slides = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    let possible_jumps = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
    let possible_moves = [];
    // 2 loops
    // 1: prefer capture
    for(let i = 0; i < pieces.length; i++){
        let piece = pieces[i];
        for(let j = 0; j < possible_jumps.length; j++){
            if(checkJump(state, piece, piece.x + possible_jumps[j][0], piece.y + possible_jumps[j][1])){
                possible_moves.push([piece, piece.x + possible_jumps[j][0], piece.y + possible_jumps[j][1]])
            }
        }
    }
    console.debug("ai found " + possible_moves.length + " possible jump moves.");
    if(possible_moves.length){
        let moveTuple = possible_moves[Math.floor(Math.random() * possible_moves.length)];
        let capture = move(state, moveTuple[0], moveTuple[1], moveTuple[2]);
        return capture;
    }
    if(jumpOnly){
        return 0;
    }
    possible_moves = [];
    // 2: random directmove
    for(let i = 0; i < pieces.length; i++){
        let piece = pieces[i];
        for(let j = 0; j < possible_slides.length; j++){
            if(checkDirectMove(state, piece, piece.x + possible_slides[j][0], piece.y + possible_slides[j][1])){
                possible_moves.push([piece, piece.x + possible_slides[j][0], piece.y + possible_slides[j][1]])
            }
        }
    }
    console.debug("ai found " + possible_moves.length + " possible direct moves.");
    if(possible_moves.length){
        let moveTuple = possible_moves[Math.floor(Math.random() * possible_moves.length)];
        let capture = move(state, moveTuple[0], moveTuple[1], moveTuple[2]);
        return capture;
    }
}

// instantiate a new game
// returns the gamestate
async function newGame(){
    let obj = await GameStateModel.create({finished: false, board: Board(), playerScore: 0, computerScore: 0, undefined, lastAction: "", lastMovedPiece: undefined});
    return new GameState(obj.finished, obj.board, obj.playerScore, obj.computerScore, obj.winner, obj.lastAction, obj._id, obj.lastMovedPiece);
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
function autoVictory(state, username){
    let returned = checkVictory(state);
    if(returned != null){
        state.winner = returned;
        state.isFinished = true;
        state.lastAction = state.winner? "You won!" : "You lost!";
        scoreInject(username, state.playerScore);
    }
    return returned != null;
}

// get scores list for a user
async function getScores(username){
    let user = await UserModel.findOne({username : username}).exec();
    if(!user){
        return [0, 0, 0, 0, 0];
    }
    let scores = [];
    scores.length = 5;
    for(let i = 0; i < user.scores.length; i++){
        scores[i] = user.scores[i];
        if(i == 4){
            break;
        }
    }
    return scores;
}

// inject scores for a user
async function scoreInject(username, score){
    if(username == undefined || !username.length){
        return;
    }
    if(score == 0){
        return;
    }
    let user = await UserModel.findOne({username: username}).exec();
    if(!user){
        return;
    }
    user.scores.push(score);
    user.scores.sort();
    if(user.scores.length > 5){
        user.scores.length = 5;
    }
    UserModel.updateOne({username: username}, {scores: user.scores}).exec();
}

// user move function
// returns undefined if invalid move
// false if success
// true if jump
function user_move(state, oldx, oldy, newx, newy){
    let piece = pieceAt(state, oldx, oldy);
    if(!piece){
        state.lastAction = "Invalid piece!";
        return undefined;
    }
    piece = state.board[oldx][oldy];
    if(outOfBounds(newx, newy)){
        state.lastAction = "Invalid location!";
        return undefined;
    }
    let returned = move(state, piece, newx, newy);
    if(returned == undefined){
        state.lastAction = "Invalid move!";
        return undefined;
    }
    return returned;
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
    console.log("checking jump move for " + JSON.stringify([piece, newx, newy, state != undefined]));
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
    if(pieceAt(state, newx, newy) != undefined){
        return undefined;
    }
    // check middle piece
    let midx = (newx - x) / 2 + x;
    let midy = (newy - y) / 2 + y;
    let mid = pieceAt(state, midx, midy);
    if(mid == undefined){
        return undefined;
    }
    mid = state.board[midx][midy]
    if(mid.owner == piece.owner){
        return undefined;
    }
    return mid;
}

// returns true/false for a direct move
function checkDirectMove(state, piece, newx, newy){
    console.log("checking direct move for " + JSON.stringify([piece, newx, newy, state != undefined]));
    if(outOfBounds(newx, newy)){
        return false;
    }
    if(pieceAt(state, newx, newy) != undefined){
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

// moves a piece capturing all pieces along the way. returns false for fail.
// otherwise,
// returns 1 for capture
// returns 2 for king
// returns 3 for capture + king
function move(state, piece, x, y){
    console.debug("attempting move " + piece.x + "/" + piece.y + " to " + x + "/" + y);
    if(outOfBounds(x, y)){
        return undefined;
    }
    // ensure diagonalness
    if(Math.abs(piece.x - x) != Math.abs(piece.y - y)){
        return undefined;
    }
    // direct move
    if(Math.abs(piece.x - x) == 1){
        console.debug("attempting directmove " + piece.x + "/" + piece.y + " to " + x + "/" + y);
        if(!checkDirectMove(state, piece, x, y)){
            return undefined;
        }
        state.board[piece.x][piece.y] = undefined;
        piece.x = x;
        piece.y = y;
        state.board[x][y] = piece;
        state.lastMovedPiece = piece
        // if reaching end, king
        if(piece.owner && piece.y == 7 || !piece.owner && piece.y == 0){
            king(piece);
            console.log("kinged " + JSON.stringify(piece))
            return 2;
        }
        return 0;
    }
    // jump
    else if(Math.abs(piece.x - x) == 2){
        console.debug("attempting jumpmove " + piece.x + "/" + piece.y + " to " + x + "/" + y);
        let captured = checkJump(state, piece, x, y);
        if(!captured){
            return undefined;
        }
        state.board[piece.x][piece.y] = undefined;
        piece.x = x;
        piece.y = y;
        capture(state, captured);
        state.board[x][y] = piece;
        state.lastMovedPiece = piece
        // if reaching end, king
        if(piece.owner && piece.y == 7 || !piece.owner && piece.y == 0){
            king(piece);
            console.log("kinged " + JSON.stringify(piece))
            return 3;
        }
        return 1;
    }
    else{
        return undefined;
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

async function get_state_from_id(id){
    console.debug("Fetching state with ID " + id);
    let state = await GameStateModel.findOne({_id: id}).exec();
    console.debug("Found state " + JSON.stringify(state));
    return state;
}

async function get_state_from_request(req){
    if(req.session.username == undefined){
        console.debug("Returning anonymous session state: not logged in.");
        return get_state_from_id(req.session.gameid);
    }
    let user = await UserModel.findOne({username: req.session.username});
    if(user == undefined){
        console.debug("Returning anonymous session state: no user found.");
        return get_state_from_id(req.session.gameid);
    }
    let stateid = user.activegame;
    if(stateid == undefined){
        console.debug("Returning anonymous session state: no active gamestate.");
        return get_state_from_id(req.session.gameid);
    }
    return get_state_from_id(stateid);
}

// converts coordinates too because the actual board is 0 indexed as in most programming languages
async function handle_move_piece(req, res){
    // get state
    let state = await get_state_from_request(req);
    if(!state){
        console.debug("Couldn't move: No state - " + JSON.stringify(state));
        res.send(new Fail("No gamestate detected; Start a new game."));
        return;
    }
    if(state.isFinished == true){
        console.debug("Couldn't move: game finished");
        res.send(new Fail("The game already ended! Start a new game to play more."));
        return;
    }
    // move piece
    let returned = user_move(state, req.body.oldx - 1, req.body.oldy - 1, req.body.newx - 1, req.body.newy - 1)
    if(returned == undefined){
        console.debug("Couldn't move: invalid move.");
        res.send(new Fail("Invalid move."));
        return;
    }
    else{
        state.lastAction = "You moved.";
    }
    // check victory
    if(autoVictory(state, req.session.username)){
        console.debug("Player won.");
        await saveGameState(state)
        res.send(new Success("Game concluded."));
        return;
    }
    if(returned == 1 || returned == 3){
        console.debug("player captured a piece, ignoring aimove");
        state.lastAction += " You capture one of the opponent's pieces.";
        if(returned != 3){  // no double move on king
            await saveGameState(state);
            res.send(new Success("Player captures a piece."));
            // true value means it's still our turn because we jumped
            return;
        }
    }
    let captured = 0;
    let hasCaptured = 0;
    do{
        captured = aiMove(state, captured == 1? state.lastMovedPiece : undefined, captured == 1? true : false);
        if(captured == 1 || captured == 3){
            hasCaptured++;
        }
        if(autoVictory(state, req.session.username)){
            console.debug("Computer won..");
            await saveGameState(state);
            res.send(new Success("Game concluded."));
            return;
        }
    } while(captured == 1)
    if(hasCaptured > 0){
        state.lastAction += " The opponent captures " + hasCaptured + " of your piece(s)!";
    }
    console.debug("Move complete; saving data and sending client success packet.");
    await saveGameState(state)
    res.send(new Success("Move complete; update pending."));
}

async function handle_new_game(req, res){
    // first, create a new state
    let state = await newGame();
    state.lastAction = "Game started!";
    await saveGameState(state);
    // save as necessary
    req.session.gameid = state._id;
    req.session.save();
    if(req.session.username){
        console.log("updating existing user " + req.session.username + " activegame to " + state._id);
        await UserModel.updateOne({username: req.session.username}, {activegame: state._id});
    }
    res.send(new Success("New game started."));
}

async function saveGameState(state){
    console.debug("Saving state: " + JSON.stringify(state));
    await GameStateModel.updateOne({_id: state._id}, {isFinished: state.isFinished, board: state.board, playerScore: state.playerScore, computerScore: state.computerScore, winner: state.winner, lastAction: state.lastAction}, (err, res) => {
        if(err){
            console.debug("ERROR DURING SAVE: " + err);
        }
    });
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
        let state = new SessionState(req.session.username)
        getScores(req.session.username).then((v) => {
            state.scores = v;
            res.send(state);
            console.log("Responding with " + req.session.username + ".");
        });
    }
})

// GET: game state
server.get("/site_api/game", (req, res) => {
    get_state_from_request(req).then((v) => {
        res.send(v);
    });
})

// POST: attempt login
server.post("/site_api/login", (req, res) =>{
    handle_user_login(req, res);
});

async function handle_user_login(req, res) {
    let username = req.body.username;
    let password = req.body.password;
    let salt = await get_salt(username);
    if(!salt || !salt.length){
        res.send(new Fail("No such user exists."));
        return;
    }
    let user = await UserModel.findOne({username: username, password: await password_to_db(password, salt)}).exec();
    if(user == undefined){
        res.send(new Fail("Invalid username or password."));
        return;
    }
    req.session.username = username;
    console.log("Recording session.");
    console.log("Session is " + JSON.stringify(req.session));
    res.send(new Success("Successfully logged in."));
    req.session.save();
}

// POST: account creation
server.post("/site_api/register", (req, res) =>{
    handle_user_register(req, res);
})

async function handle_user_register(req, res){
    let username = req.body.username;
    let user = await UserModel.findOne({username: username}).exec();
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
    let salt = await gen_salt();
    let keygen = await password_to_db(password, salt);
    UserModel.create({username: username, password: keygen, activegame: undefined, score: [], salt: salt});
    req.session.username = username;
    res.send(new Success("User created."));
    req.session.save();
}

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

