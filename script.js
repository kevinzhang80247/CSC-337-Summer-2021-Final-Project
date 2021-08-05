/*
Author: Spener Wollard, Kevin Zhang
Course: CSC 337
Project: PA 10 "Ostaa"
Due: 8/6/2021
Purpose:  See server.js for details.
*/


var turn = '';
var finalusername = '';
var selected = false;
var curSelect = '';

const boardtest = [[0,9,1,9,2,9,3,9, 3,9,2,9,1,9,0,9, 9,0,9,0,9,1,9,1, 3,9,2,9,3,9,2,9,
                    9,9,9,9,0,0,0,0, 1,1,1,1,9,9,9,9, 3,3,3,3,2,2,2,2, 9,0,9,0,9,1,9,1]];


function beginAction(){
  $.ajax({
    url: '/username',
    method: 'GET',
    success: function(result){
      console.log(result);
      finalusername = result[0];
      let highScore = result[1];
      document.getElementById('welcome').innerHTML = 'Welcome ' + finalusername;
      document.getElementById('personalScores').innerHTML = 'Your High Score: ' + highScore;
      return;
    }
  })
  return;
}


/*
This function is called whenever the user clicks the "Create" button.  It reads
the text in username and password box, checks to make sure neither are empty, and then
sends both to the server via jquery for storage in the database.
Arguments:  None.
Return:  None.
*/
function updateUsers(){
  let username = $('#in3').val();
  if (username == 'admin101'){
    finalusername = 'boss';
    alert('Hello Mate');
    location = 'file:///C:/Users/Spencer/Desktop/CSC%20337/Final%20Project/public_html/board.html';
    return;
  }
  if (username == ''){
    alert('Cannot leave field "Username" blank');
    return;
  }
  let password = $('#in4').val();
  if (password == ''){
    alert('Cannot leave field "Password" blank');
    return;
  }
  $.ajax({
    url: '/add/user/' + username + '/' + password,
    method: 'POST',
    success: function(result){
      alert('Account created successfully!');
      return;
    }
  })
}


function checkLogin(){
  let username = $('#in1').val();
  if (username == ''){
    alert('Issue logging in with that info');
    return;
  }
  let password = $('#in2').val();
  if (password == ''){
    alert('Issue logging in with that info');
    return;
  }
  $.ajax({
    url: '/check/user/' + username + '/' + password,
    method: 'GET',
    success: function(result){
      if(result == true){
        location = 'http://localhost:3000/board.html';
        beginAction();
        return;
      }else{
        alert('Issue logging in with that info');
      }
      return;
    }
  })
}

function createAccount(){
  location = 'file:///C:/Users/Spencer/Desktop/CSC%20337/Final%20Project/public_html/create.html';
}


function newGame3(){
  var letter = '';
  var num = 1;
  for(i=1; i < 9; i++){
    letter = 'D';
    document.getElementById(letter + num).innerHTML = '';
    num += 1;
  }
  num = 1;
  for(i=1; i < 9; i++){
    letter = 'E';
    document.getElementById(letter + num).innerHTML = '';
    num += 1;
  }
  num = 1;
  for(i=1; i < 9; i++){
    var el = document.createElement("p");
    el.className = "blackCircle";
    letter = 'H';
    document.getElementById(letter + num).innerHTML = '';
    if(document.getElementById(letter + num).innerHTML == '' && i%2 != 1){
      document.getElementById(letter + num).appendChild(el);
    }
    num += 1;
  }
  return;
}


function newGame2(){
  var letter = '';
  var num = 1;
  for(i=1; i < 9; i++){
    var el = document.createElement("p");
    el.className = "blackCircle";
    letter = 'F';
    document.getElementById(letter + num).innerHTML = '';
    if(document.getElementById(letter + num).innerHTML == '' && i%2 != 1){
      document.getElementById(letter + num).appendChild(el);
    }
    num += 1;
  }
  num = 1;
  for(i=1; i < 9; i++){
    var el = document.createElement("p");
    el.className = "blackCircle";
    letter = 'G';
    document.getElementById(letter + num).innerHTML = '';
    if(document.getElementById(letter + num).innerHTML == '' && i%2 != 0){
      document.getElementById(letter + num).appendChild(el);
    }
    num += 1;
  }
  num = 1;
  for(i=1; i < 9; i++){
    var el = document.createElement("p");
    el.className = "blackCircle";
    letter = 'H';
    document.getElementById(letter + num).innerHTML = '';
    if(document.getElementById(letter + num).innerHTML == '' && i%2 != 1){
      document.getElementById(letter + num).appendChild(el);
    }
    num += 1;
  }
  newGame3();
  return;
}

function newGame(){
  turn = 'red';
  document.getElementById('playerTurn').innerHTML = 'Player Turn: Red';
  var letter = '';
  var num = 1;
  for(i=1; i < 9; i++){
    var el = document.createElement("p");
    el.className = "redCircle";
    letter = 'A';
    document.getElementById(letter + num).innerHTML = '';
    if(i%2 != 0){
      document.getElementById(letter + num).appendChild(el);
    }
    num += 1;
  }
  num = 1;
  for(i=1; i < 9; i++){
    var el = document.createElement("p");
    el.className = "redCircle";
    letter = 'B';
    document.getElementById(letter + num).innerHTML = '';
    if(i%2 != 1){
      document.getElementById(letter + num).appendChild(el);
    }
    num += 1;
  }
  num = 1;
  for(i=1; i < 9; i++){
    var el = document.createElement("p");
    el.className = "redCircle";
    letter = 'C';
    document.getElementById(letter + num).innerHTML = '';
    if(i%2 != 0){
      document.getElementById(letter + num).appendChild(el);
    }
    num += 1;
  }
  newGame2();
  return;
}


function loadGame5(loaded){
  let board = loaded[0];
  var letter = '';
  var num = 1;
  //Draw G line of board
  for(i=48; i < 56; i++){
    letter = 'G';
    var el = document.createElement("p");
    if (board[i] == 0){
      el.className = "redCircle";
    } else if (board[i] == 1) {
      el.className = "blackCircle";
    } else if (board[i] == 2){
      el.className = "redCircle";
      el.innerText = 'K';
    } else if (board[i] == 3){
      el.className = "blackCircle";
      el.innerText = 'K';
    } else{
      document.getElementById(letter + num).innerHTML = '';
      num += 1;
      continue;
    }
    document.getElementById(letter + num).innerHTML = '';
    document.getElementById(letter + num).appendChild(el);
    num += 1;
  }
  num = 1;
  //Draw H line of board
  for(i=56; i < 64; i++){
    letter = 'H';
    var el = document.createElement("p");
    if (board[i] == 0){
      el.className = "redCircle";
    } else if (board[i] == 1) {
      el.className = "blackCircle";
    } else if (board[i] == 2){
      el.className = "redCircle";
      el.innerText = 'K';
    } else if (board[i] == 3){
      el.className = "blackCircle";
      el.innerText = 'K';
    } else{
      document.getElementById(letter + num).innerHTML = '';
      num += 1;
      continue;
    }
    document.getElementById(letter + num).innerHTML = '';
    document.getElementById(letter + num).appendChild(el);
    num += 1;
  }
}


function loadGame4(loaded){
  let board = loaded[0];
  var letter = '';
  var num = 1;
  //Draw E line of board
  for(i=32; i < 40; i++){
    letter = 'E';
    var el = document.createElement("p");
    if (board[i] == 0){
      el.className = "redCircle";
    } else if (board[i] == 1) {
      el.className = "blackCircle";
    } else if (board[i] == 2){
      el.className = "redCircle";
      el.innerText = 'K';
    } else if (board[i] == 3){
      el.className = "blackCircle";
      el.innerText = 'K';
    } else{
      document.getElementById(letter + num).innerHTML = '';
      num += 1;
      continue;
    }
    document.getElementById(letter + num).innerHTML = '';
    document.getElementById(letter + num).appendChild(el);
    num += 1;
  }
  num = 1;
  //Draw F line of board
  for(i=40; i < 48; i++){
    letter = 'F';
    var el = document.createElement("p");
    if (board[i] == 0){
      el.className = "redCircle";
    } else if (board[i] == 1) {
      el.className = "blackCircle";
    } else if (board[i] == 2){
      el.className = "redCircle";
      el.innerText = 'K';
    } else if (board[i] == 3){
      el.className = "blackCircle";
      el.innerText = 'K';
    } else{
      document.getElementById(letter + num).innerHTML = '';
      num += 1;
      continue;
    }
    document.getElementById(letter + num).innerHTML = '';
    document.getElementById(letter + num).appendChild(el);
    num += 1;
  }
  loadGame5(loaded);
}


function loadGame3(loaded){
  let board = loaded[0];
  var letter = '';
  var num = 1;
  //Draw C line of board
  for(i=16; i < 24; i++){
    letter = 'C';
    var el = document.createElement("p");
    if (board[i] == 0){
      el.className = "redCircle";
    } else if (board[i] == 1) {
      el.className = "blackCircle";
    } else if (board[i] == 2){
      el.className = "redCircle";
      el.innerText = 'K';
    } else if (board[i] == 3){
      el.className = "blackCircle";
      el.innerText = 'K';
    } else{
      document.getElementById(letter + num).innerHTML = '';
      num += 1;
      continue;
    }
    document.getElementById(letter + num).innerHTML = '';
    document.getElementById(letter + num).appendChild(el);
    num += 1;
  }
  num = 1;
  //Draw D line of board
  for(i=24; i < 32; i++){
    letter = 'D';
    var el = document.createElement("p");
    if (board[i] == 0){
      el.className = "redCircle";
    } else if (board[i] == 1) {
      el.className = "blackCircle";
    } else if (board[i] == 2){
      el.className = "redCircle";
      el.innerText = 'K';
    } else if (board[i] == 3){
      el.className = "blackCircle";
      el.innerText = 'K';
    } else{
      document.getElementById(letter + num).innerHTML = '';
      num += 1;
      continue;
    }
    console.log(letter + num);
    document.getElementById(letter + num).innerHTML = '';
    document.getElementById(letter + num).appendChild(el);
    num += 1;
  }
  loadGame4(loaded);
}



function loadGame2(loaded){
  let board = loaded[0];
  var letter = '';
  var num = 1;
  //Draw A line of board
  for(i=0; i < 8; i++){
    letter = 'A';
    var el = document.createElement("p");
    if (board[i] == 0){
      el.className = "redCircle";
    } else if (board[i] == 1) {
      el.className = "blackCircle";
    } else if (board[i] == 2){
      el.className = "redCircle";
      el.innerText = 'K';
    } else if (board[i] == 3){
      el.className = "blackCircle";
      el.innerText = 'K';
    } else{
      document.getElementById(letter + num).innerHTML = '';
      num += 1;
      continue;
    }
    document.getElementById(letter + num).innerHTML = '';
    document.getElementById(letter + num).appendChild(el);
    num += 1;
  }
  num = 1;
  //Draw B line of board
  for(i=8; i < 16; i++){
    letter = 'B';
    var el = document.createElement("p");
    if (board[i] == 0){
      el.className = "redCircle";
    } else if (board[i] == 1) {
      el.className = "blackCircle";
    } else if (board[i] == 2){
      el.className = "redCircle";
      el.innerText = 'K';
    } else if (board[i] == 3){
      el.className = "blackCircle";
      el.innerText = 'K';
    } else{
      document.getElementById(letter + num).innerHTML = '';
      num += 1;
      continue;
    }
    document.getElementById(letter + num).innerHTML = '';
    document.getElementById(letter + num).appendChild(el);
    num += 1;
  }
  loadGame3(loaded);
}

function loadGame(){
  $.ajax({
    url: '/lastGameState',
    method: 'GET',
    success: function(result){
      console.log(result);
      loadGame2(result);
      return;
    }
  })
}

function test(){
  loadGame2(boardtest);
}


function test2(){
  //console.log(finalusername);
  var el = document.createElement("p");
  el.className = "redCircle";
  el.innerText = 'K';
  document.getElementById('A1').appendChild(el);
}

function test1(){
  //console.log(document.getElementById('A1').innerHTML);
  document.getElementById('A1').innerHTML = '';
  //console.log(document.getElementById('A1').innerHTML);
  //document.getElementById('A1').removeChild;
}

function aIMove(){
  document.getElementById('curAction').innerHTML = 'AI is Moving';
  $.ajax({
    url: '/AI_move/',
    method: 'GET',
    success: function(result){
      if (result[0] == true){
        console.log('Game Over');
        document.getElementById('curAction').innerHTML = 'Game Over';
        document.getElementById('player1').innerHTML = 'Player1 Score: ' + result[1] * 5;
        document.getElementById('player2').innerHTML = 'Player2 Score: ' + result[2] * 5;
        selected = false;
        curSelect = '';
        return;
      }else{
        document.getElementById('player1').innerHTML = result[1] * 5;
        document.getElementById('player2').innerHTML = result[2] * 5;
        loadGame2(result[3]);
        if(turn == 'black'){
          aIMove();
          return;
        }
        return;
      }
    }
  })
}

function nextTurn(){
  if(turn == 'red'){
    turn = 'black';
  }else{
    turn = 'red';
  }
  $.ajax({
    url: '/isFinished/',
    method: 'GET',
    success: function(result){
      if (result[0] == true){
        console.log('Game Over');
        document.getElementById('curAction').innerHTML = 'Game Over';
        document.getElementById('player1').innerHTML = 'Player1 Score: ' + result[1] * 5;
        document.getElementById('player2').innerHTML = 'Player2 Score: ' + result[2] * 5;
        selected = false;
        curSelect = '';
        return;
      }else{
        document.getElementById('player1').innerHTML = result[1] * 5;
        document.getElementById('player2').innerHTML = result[2] * 5;
        loadGame2(result[3]);
        if(turn == 'black'){
          aIMove();
          return;
        }
        return;
      }
    }
  })
  return;
}


function select(loc){
  if (selected == false){
    $.ajax({
      url: '/select/' + turn + '/' + loc,
      method: 'GET',
      success: function(result){
        if (result == true){
          console.log('Selected: ' + loc);
          document.getElementById('curAction').innerHTML = 'Selected: ' + loc;
          selected = true;
          curSelect = loc;
          return;
        }else{
          console.log('' + loc + ' not available for selection');
          document.getElementById('curAction').innerHTML = '' + loc + ' not available for selection';
          selected = false;
          curSelect = '';
          return;
        }
      }
    })
  }else{
    $.ajax({
      url: '/move/' + turn + '/' + curSelect + '/' + loc,
      method: 'GET',
      success: function(result){
        if (result == true){
          console.log('Moved from ' + curSelect + ' to ' + loc);
          document.getElementById('curAction').innerHTML = 'Moved from ' + curSelect + ' to ' + loc
          selected = false;
          curSelect = '';
          nextTurn();
          return;
        }else{
          console.log('' + 'Cannot move from ' + curSelect + ' to ' + loc);
          document.getElementById('curAction').innerHTML = 'Cannot move, please select a new piece to move';
          selected = false;
          curSelect = '';
          return;
        }
      }
    })
  }
  return;
}
