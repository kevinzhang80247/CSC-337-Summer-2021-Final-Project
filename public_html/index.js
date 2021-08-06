/*
Author: Spener Wollard, Kevin Zhang
Course: CSC 337
Project: PA 10 "Ostaa"
Due: 8/6/2021
Purpose:  See server.js for details.
*/

const server = 'http://localhost:6192';

let gameState = undefined;
let sessionData = undefined;
let modalOpened = false;
let selectedRow = undefined;
let selectedColumn = undefined;
let selectedTile = undefined;

window.addEventListener('load', siteInit);

async function siteInit(){
  console.debug('beginning init');
  HookButtons();
  await RenderUserData();
  await UpdateState();
  RenderScores();
  RenderBoard();
  RenderPanel();
  RenderStatus();
  console.debug('init finished');
}

async function OnLogin(){
  console.debug("rerendering for login");
  CloseModal();
  await UpdateState();
  RenderUserData();
  RenderScores();
  RenderBoard();
  RenderStatus();
  RenderPanel();
}

async function OnMove(){
  console.debug("rerendering for movement");
  await UpdateState();
  RenderBoard();
  RenderScores();
  RenderStatus();
  RenderPanel();
}

function HookButtons(){
  $('#loginButton').on('click', OpenModal);
  $('#registerButton').on('click', OpenModal);
  $('#doLoginButton').on('click', Login);
  $('#doRegisterButton').on('click', Register);
  $('#accountModalClose').on('click', CloseModal);
  $('#newGameButton').on('click', RequestNewGame);
}

function RenderUserData(){
  console.debug("rendering userdata");
  $.ajax({
    type: "GET",
    url: server + "/site_api/session",
    xhrFields:{
      withCredentials: true
    },
    success: (data, status) => {
      let name = "Guest";
      if(data.loggedIn != false){
        name = data.userName
      }
      sessionData = data;
      console.debug("got " + name + " ("+ JSON.stringify(data) + ")");
      $('#usernameRender').text(name);
    }
  })
}

async function UpdateState(){
  await $.ajax({
    type: "GET",
    url: server + "/site_api/game",
    xhrFields: {
      withCredentials: true
    },
    success: (data, status) => {
      gameState = data;
      if((typeof gameState) == "string" && gameState.length == 0){
        gameState = undefined;
      }
      console.log("gamestate: " + JSON.stringify(gameState));
    }
  })
}

function RenderScores(){
  if(sessionData == undefined || sessionData.loggedIn == false){
    $('#scoreRender').html("You must be logged in to view your top scores!");
  }
  else{
    
  }
}

function RenderBoard(){
  console.debug('rendering board');
  selectedRow = undefined;
  selectedColumn = undefined;
  selectedTile = undefined;
  let boardInner = document.querySelector('#chessboardInner');
  while(boardInner.firstChild){
    boardInner.removeChild(boardInner.lastChild);
  }
  let alternate = false;
  for(let y = 8; y >= 1; y--){
    for(let x = 1; x <= 8; x++){
      let tile = document.createElement('div');
      tile.className = "checkertile";
      if(alternate){
        tile.style.backgroundColor = '#ffffff';
      }
      else{
        tile.style.backgroundColor = '#000000';
      }
      tile.onclick = tileclick.bind(tile, x, y);
      alternate = !alternate;
      RenderPieceIntoTile(x, y, tile);
      boardInner.appendChild(tile);
    }
    alternate = !alternate;
  }
  if(gameState == undefined || gameState.isFinished == true){
    $('#chessboardModal').css('display', 'block');
    $('#chessboardModalContent').html(
      gameState == undefined? ("Game not started.<br>Start a new game with the buttons below!") :
      ("You " + gamestate.winner? "won" : "lost" + "!<br>Start a new game with the buttons below.")
    );
  }
  else{
    $('#chessboardModal').css('display', 'none');
    RenderGameError(gameState.lastAction);
  }
  console.debug('board render finished');
}

function RenderPieceIntoTile(x, y, tile){
  if(gameState == undefined){
    return;
  }
  let piece = gameState.board[x-1][y-1];
  if(!piece){
    return;
  }
  let inner = document.createElement('div');
  inner.className = piece.owner? "piecered" : "pieceblack";
  inner.textContent = piece.king? "K" : "";
  tile.appendChild(inner);
}

function RenderPanel(){

}

function RenderStatus(){
  let playerscore = 0;
  let computerscore = 0;
  if(gameState != undefined){
    playerscore = gameState.playerScore;
    computerscore = gameState.computerScore;
  }
  $('#panelPlayerScore').text("Your score: " + playerscore);
  $('#panelComputerScore').text("Computer's score: " + computerscore);
}

function OpenModal(){
  if(modalOpened == true){
    return;
  }
  modalOpened = true;
  $('#accountModal').css('display', 'block');
}

function CloseModal(){
  if(modalOpened == false){
    return;
  }
  modalOpened = false;
  $('#accountModal').css('display', 'none');
  $('#accountFormFeedback').html("");
}

function Login(){
  let username = $('#usernameField').val();
  let password = $('#passwordField').val();
  $.ajax({
    type: "POST",
    url: server + "/site_api/login",
    data: {username: username, password: password},
    xhrFields:{
      withCredentials: true
    },
    success: (data, status) =>{
      if(data.errored != true){
        OnLogin();
        return;
      }
      $('#accountFormFeedback').text(data.message);
    }
  })
}

function Register(){
  let username = $('#usernameField').val();
  let password = $('#passwordField').val();
  $.ajax({
    type: "POST",
    url: server + "/site_api/register",
    data: {username: username, password: password},
    xhrFields:{
      withCredentials: true
    },
    success: (data, status) =>{
      if(data.errored != true){
        OnLogin();
        return;
      }
      $('#accountFormFeedback').text(data.message);
    }
  })
}

function AttemptMove(oldx, oldy, newx, newy){
  console.debug("attempting move from " + oldx + " - " + oldy + " to " + newx + " - " + newy);
  $.ajax({
    type: "POST",
    url: server + "/site_api/move_piece",
    data: {oldx: oldx, oldy: oldy, newx: newx, newy: newy},
    xhrFields:{
      withCredentials: true
    },
    success: (data, status) => {
      OnMove();
    }
  })
}

function tileclick(x, y){
  console.debug("click detected on " + x + " - " + y);
  if(selectedTile){
    AttemptMove(selectedColumn, selectedRow, x, y);
    deselect();
    return;
  }
  selectedTile = this;
  selectedColumn = x;
  selectedRow = y;
  select();
}

function select(){
  selectedTile.style.border = 'solid';
  selectedTile.style.borderColor = 'yellow';
  selectedTile.style.borderWidth = '5px';
  selectedTile.style.margin = '-5px';
  selectedTile.style.zIndex = "26";
}

function deselect(){
  selectedTile.style.border = 'none';
  selectedTile.style.margin = '0px';
  selectedTile.style.zIndex = "25";
  selectedTile = undefined;
  selectedColumn = undefined;
  selectedRow = undefined;
}

function RequestNewGame(){
  console.debug("requesting new game");
  $.ajax({
    type: "GET",
    url: server + "/site_api/new_game",
    xhrFields:{
      withCredentials: true
    },
    success: (data, status) => {
      console.debug("Got back " + JSON.stringify(data));
      if(data.errored == false){
        RenderGameError("New game started.");
        OnMove();
      }
      else{
        RenderGameError(data.message);
      }
    }
  })
}

function RenderGameError(msg){
  $('#gameErrorRender').text(msg);
}

