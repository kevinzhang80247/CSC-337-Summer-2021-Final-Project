/*
Author: Spener Wollard, Kevin Zhang
Course: CSC 337
Project: PA 10 "Ostaa"
Due: 8/6/2021
Purpose:  See server.js for details.
*/

const server = '127.0.0.1:6192';

let gameState = undefined;
let modalOpened = false;

window.addEventListener('load', siteInit);

function siteInit(){
  console.debug('beginning init');
  HookButtons();
  RenderUserData();
  RenderScores();
  RenderBoard();
  RenderPanel();
  RenderStatus();
  console.debug('init finished');
}

function HookButtons(){
  $('#loginButton').on('click', OpenModal);
  $('#registerButton').on('click', OpenModal);
  $('#doLoginButton').on('click', Login);
  $('#doRegisterButton').on('click', Register);
  $('#accountModalClose').on('click', CloseModal);
}

function RenderUserData(){

}

function RenderScores(){

}

function RenderBoard(){
  console.debug('rendering board');
  let boardInner = document.querySelector('#chessboardInner');
  while(boardInner.firstChild){
    boardInner.removeChild(boardInner.lastChild);
  }
  let alternate = false;
  for(let y = 8; y >= 1; y--){
    for(let x = 1; x <= 8; x++){
      let tile = document.createElement('div');
      tile.style.width = '80px';
      tile.style.height = '80px';
      tile.style.float = 'left';
      if(alternate){
        tile.style.backgroundColor = '#ffffff';
      }
      else{
        tile.style.backgroundColor = '#000000';
      }
      tile.style.display = 'table-cell';
      tile.style.verticalAlign = 'middle';
      alternate = !alternate;
      RenderPieceIntoTile(x, y, tile);
      boardInner.appendChild(tile);
    }
    alternate = !alternate;
  }
  console.debug('board render finished');
}

function RenderPieceIntoTile(x, y, tile){

}

function RenderPanel(){

}

function RenderStatus(){

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
}

function Login(){

}

function Register(){
  
}

function HandleClick(e){

}

function AttemptMove(){

}

function RequestNewGame(){

}
