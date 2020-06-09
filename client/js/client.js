const options = {
	width: 500,
	legalMarksColor: 'cornflowerblue',
	visibleMarksColor: 'green'
}

var color;
var noMoreMoves;
var selectedSquare;
var boardData;
var moveHistory;
var moveIndex = 0; //move index of 0 means the last recorded move. move index of 1 is just 1 move before that.
var legalMoves = {};

var sfx = {
	move: new Audio("client/sfx/Move.mp3"),
	//select: new Audio("client/sfx/move.mp3"),
	capture: new Audio("client/sfx/Capture.mp3"),
	//check: new Audio("client/sfx/check.mp3"),
	startGame: new Audio("client/sfx/GenericNotify.mp3"),
	win: new Audio("client/sfx/Victory.mp3"),
	lose: new Audio("client/sfx/Defeat.mp3"),
	draw: new Audio("client/sfx/Draw.mp3")
};
createMenuPage();

//------recieving things from server------
var socket = io();

socket.on('createRoom', function(data){
	if(!('error' in data)){
		document.getElementById('codeDisplay').innerHTML = data.code;
	}
	else{
		document.getElementById('codeDisplay').innerHTML = data.error;
	}
});

socket.on('joinRoom', createGamePage);

socket.on('opponentDC', function(data){
	//opponent disconnected
	noMoreMoves = true;
	updateBoard(data.board);
	alert('Uh oh, opponent disconnected! Refresh the page to make a new game.');
});

socket.on('updateBoard', function(data){
	//update the board according to data sent from server
	updateBoard(data.board);
	if(data.hasOwnProperty('didCapture')){
		if(data.didCapture){
			sfx.capture.play();
		}
		else{
			sfx.move.play();
		}
	}

	if(data.status == 'illegal'){
			//allow player to try again
			legalMoves = data.moves;
			noMoreMoves = false;
			document.getElementById('turn').innerHTML = 'Your Turn';
	}
	else if(data.status == 'legal'){
		noMoreMoves = true;
		//add board to moveHistory
		moveHistory.unshift(boardData);
		document.getElementById('turn').innerHTML = "Opponent's Turn";
	}
	else if(data.status == 'opponentMoved'){
		//get legal moves from server
		legalMoves = data.moves;
		//it is now your turn to move
		noMoreMoves = false;
		//if a square was previously selected, reselect it with the new information
		if(selectedSquare !== undefined){
			let tempSquare = selectedSquare;
			deselect();
			select(tempSquare);
		}
		//add the opponent's move to the moveHistory, even if you might not be able to see what they moved.
		moveHistory.unshift(boardData);
		document.getElementById('turn').innerHTML = 'Your Turn';
	}
	else if(data.status == 'promote'){
		promotePawn(data.x, data.y);
	}
	else if(data.status == 'win' || data.status == 'lose' || data.status == 'tie'){
		//dont allow them to continue making moves
		noMoreMoves = true;
		//add board to moveHistory
		moveHistory.unshift(boardData);
		if(data.status == 'win'){
			//play win sound
			sfx.win.play();
			alert('You won!');
		}
		else if(data.status == 'lose'){
			//play lose sound
			sfx.lose.play();
			alert('You lost!');
		}
		else if(data.status == 'tie'){
			//play draw sound
			sfx.draw.play();
			alert('Draw');
		}
	}
	
});


function createMenuPage() {
	//-----see "additional functionality"-----
	/*not currently in use
	var override = false;
	for (var i = 0; i < extraCreateMenuPage.before.length; i++) {
		if (extraCreateMenuPage.before[i]()){
			override = true;
		}
	}
	if(override){
		return;
	}*/
	//-----default function begins-----
	//-----create room-----
	var createBtn = document.createElement('btn');
	var codeDisplay = document.createElement('p');
	codeDisplay.id = 'codeDisplay';
	createBtn.innerHTML = 'Create Room';
	createBtn.onclick = function(){
		document.getElementById('codeDisplay').innerHTML = 'Generating code...';
		socket.emit('createRoom');
	}
	//-----join room-----
	var joinBtn = document.createElement('btn');
	codeInput = document.createElement('input');
	codeInput.id = 'codeInput';
	joinBtn.innerHTML = 'Join';
	joinBtn.onclick = function(){
		var code = document.getElementById('codeInput').value;
		socket.emit('joinRoom', {code: code});
	}
	//-----add to document-----
	var menu = document.createElement('div');
	menu.id = 'menu';
	menu.appendChild(createBtn);
	menu.appendChild(codeDisplay);
	menu.appendChild(joinBtn);
	menu.appendChild(codeInput);
	document.body.appendChild(menu);
	//-----see "additional functionality"-----
	/*not currently in use
	for (var i = 0; i < extraCreateMenuPage.after.length; i++) {
		extraCreateMenuPage.after[i]();
	}*/
}

function createGamePage(data) {
	//if error
	if('error' in data){
		document.getElementById('codeInput').value = data.error;
		return;
	}
	//-----see "additional functionality"-----
	/*not currently in use
	var override = false;
	for (var i = 0; i < extraCreateGamePage.before.length; i++) {
		if (extraCreateGamePage.before[i](data)){
			override = true;
		}
	}
	if(override){
		return;
	}*/
	//-----default function begins-----
	boardData = data.board;
	color = data.color;
	if(color == 'w'){
		legalMoves = data.moves;
	}
	if((data.turn % 2 == 1 && color == 'w') || data.turn % 2 == 0 && color == 'b'){
		//your turn to move
		noMoreMoves = false;
	}
	else{
		//not your turn to move
		noMoreMoves = true;
	}
	//TODO: check if data is valid first
	//hide menu
	document.getElementById('menu').style.display = 'none';
	//create board
	var board = document.createElement('div');
	board.id = 'board';
	board.style.width = board.style.height = options.width.toString()+'px';
	board.style.position = 'relative';
	board.style.left = '20%';
	board.style.boxShadow = '0px 20px 30px';
	//create squares
	var width = boardData.length;
	var height = boardData[0].length; //it is assumed that the board is a rectangle
	for (var y = height-1; y >= 0; y--) {
	      for (var x = 0; x < width; x++) {
	      		let absX = (data.color == 'w' || data.color == 'spec')
	      			? x
	      			: width-x-1;
	      		let absY = (data.color == 'w' || data.color == 'spec')
	      			? y
	      			: height-y-1;
	      		let squareData = boardData[absX][absY];
	            let square = document.createElement('div');
	            //id
	            square.id = absX.toString()+absY.toString();
	            //clear or cloudy
	            square.className = (absX % 2 === absY % 2)
				  ? ('square black ' + squareData.state)
				  : ('square white ' + squareData.state);
				//piece
				if(squareData.piece != ''){
					addOrRemovePiece(square, squareData.piece);
				}
			    //onclick
			    square.onclick = function(){onclickSquare(this)};
			    //onrightclick
			    square.addEventListener('contextmenu', function(event){
				    event.preventDefault();
				    onclickSquare(this, true);
				    return false;
				}, false);
			    //add square to board
			    board.appendChild(square);
	      }
	}
	//add board to document
	document.body.appendChild(board);
	//add the info bar | for now its just a text box that tells you whos turn it is
	var p = document.createElement('p');
	p.id = 'turn';
	document.body.appendChild(p);
	//play start game sound
	sfx['startGame'].play();
	//add board to moveHistory
	moveHistory = [boardData];
	//create backward & forward btns to look through move history
	//back btn
	var btn = document.createElement('a');
	btn.className = 'roundBtn';
	btn.innerHTML = '&#8249;'
	btn.onclick = function(){
		if(moveIndex < moveHistory.length-1){
			++moveIndex;
			updateBoard(moveHistory[moveIndex]);
		}
	}
	document.body.appendChild(btn);
	//forward btn
	btn = document.createElement('a');
	btn.className = 'roundBtn';
	btn.innerHTML = '&#8250;'
	btn.onclick = function(){
		if(moveIndex > 0){
			--moveIndex;
			updateBoard(moveHistory[moveIndex]);
		}
	}
	document.body.appendChild(btn);
	/*not currently in use
	//-----see "additional functionality"-----
	for (var i = 0; i < extraCreateGamePage.after.length; i++) {
		extraCreateGamePage.after[i](data);
	}*/
}

function onclickSquare(squareEle, rightClick = false) {
	//-----see "additional functionality"-----
	/*not currently in use
	var override = false;
	for (var i = 0; i < extraOnclickSquare.before.length; i++) {
		if (extraOnclickSquare.before[i](squareEle)){
			override = true;
		}
	}
	if(override){
		return;
	}*/
	//-----default function begins-----
  var hasDot = false;
  for (var i = 0; i < squareEle.children.length; i++) {
    if(squareEle.children[i].className == 'square__canvas'){
        hasDot = true;
        break;
    }
  }
  //clicked on a square with a "dot" on it, aka a legal move square. if you're allowed to move, execute the move.
  if(hasDot && !noMoreMoves && moveIndex == 0){ 
  	if(!rightClick){
	    //play move sound
	    if(getPieceFromSquare(squareEle) == ''){
	      sfx['move'].play();
	    }
	    else{
	      sfx['capture'].play();
	    }

	    //move the piece
	    addOrRemovePiece(squareEle);
	    addOrRemovePiece(squareEle, getPieceFromSquare(selectedSquare));
	    addOrRemovePiece(selectedSquare);
	    //send move to server
	    var moveInfo = {from: [parseInt(selectedSquare.id[0]), parseInt(selectedSquare.id[1])], to: [parseInt(squareEle.id[0]), parseInt(squareEle.id[1])]};
	    deselect();
	    socket.emit('move', moveInfo);
	}
	else{
		//if it was a right click, just deselect and ignore everything else
		deselect();
	}
  }
  else if(squareEle === selectedSquare){ //clicked on the selected square, so deselect it
    selectedSquare = undefined;
    deselect();
  //TODO: play deselect sound?
  }
  else{
	let piece = getPieceFromSquare(squareEle);

  	if(piece != ''){ 
  		//clicked on a new square with a friendly piece. they want to select the piece.
    	if(piece[0] == color){
    		deselect();
	    	select(squareEle, rightClick);
	    	//TODO: play select sound
    	}
    	//spectator clicks on a piece
    	else if(color == 'spec'){
    		deselect();
	    	select(squareEle, rightClick);
    	}
  	}
	else{//clicked on nothing. just deselect.
	  deselect();
	  //TODO: play deselect sound?
	}
	}
  //-----see "additional functionality"-----
  /*not currently in use
	for (var i = 0; i < extraOnclickSquare.after.length; i++) {
		extraOnclickSquare.after[i](squareEle);
	}
	*/
}

function addOrRemovePiece(squareEle, piece = undefined) {
	//remove piece
	if(piece === undefined || piece === ''){
		var pieces = squareEle.getElementsByClassName('square__piece');
		for (var i = pieces.length - 1; i >= 0; i--) {
			squareEle.removeChild(pieces[i]);
		}
		
	}
	//add piece
	else{
		var pieceEle = document.createElement('div');
	    pieceEle.className = 'square__piece';
	    pieceEle.style.backgroundImage = 'url("client/imgs/pieces/wikipedia/' + piece + '.png")';
	    squareEle.appendChild(pieceEle);
	}
}

function updateBoard(newBoardData) {
	boardData = newBoardData;
	var square, newSquare, tempState;
	for (var x = 0; x < newBoardData.length; x++) {
		for (var y = 0; y < newBoardData[x].length; y++) {
			square = document.getElementById(x.toString()+y.toString());
			newSquare = newBoardData[x][y];
			var indexOfSpace = square.className.split(' ', 2).join(' ').length+1;
			//update state if needed (clear/cloudy + (_X)?)
			if(square.className.substring(indexOfSpace, square.className.length) !== newSquare.state){
				square.className = square.className.substring(0, indexOfSpace) + newSquare.state;
			}
			//update piece if needed
			if (getPieceFromSquare(square) !== newSquare.piece){
				addOrRemovePiece(square);
				addOrRemovePiece(square, newSquare.piece);
			}
		}
	}
}

function getPieceFromSquare(squareEle) {
	var pieceEle = squareEle.getElementsByClassName('square__piece')[0];
	//no piece
	if(pieceEle === undefined){
		return '';
	}
	else{
		return pieceEle.style.backgroundImage.match(/client\/imgs\/pieces\/wikipedia\/(.*)\.png/)[1];
	}
}

function deselect() {
	//remove legal move dots and visible square dots
	var dottedSquares = Array.from(document.getElementsByClassName('square__canvas')).concat(Array.from(document.getElementsByClassName('square__canvas_v')));
    for(var i = 0; i < dottedSquares.length; i++){
        dottedSquares[i].parentNode.removeChild(dottedSquares[i]);
    }
    //remove selected square highlight. while loop should be redundant as there should only be one selected square, but cant be too safe.
    var highlight = document.getElementsByClassName('square selected');
    while(highlight.length > 0){
        highlight[0].parentNode.removeChild(highlight[0]);
    }
    	
    //deselect the square
    selectedSquare = undefined;
}

function select(squareEle, rightClick = false) {
	selectedSquare = squareEle;
	//highlight selected square
	var highlight = document.createElement('div');
	highlight.className = 'square selected';
	squareEle.appendChild(highlight);
	//draw legal move dots, or in the case of right click, draw visible square dots
	var tempLegalMoves;
	if(rightClick){
		tempLegalMoves = getVisibleSquares(boardData, squareEle.id);
	}
	else if(!noMoreMoves && moveIndex == 0){
		if(squareEle.id in legalMoves){
			tempLegalMoves = legalMoves[squareEle.id];
		}
		else{
			tempLegalMoves = [];
		}
	}
	else{
		tempLegalMoves = getMoves(boardData, squareEle.id);
	}
	var width = options.width / Math.sqrt(document.getElementById('board').childElementCount);
	var className = (rightClick) ? 'square__canvas_v' : 'square__canvas';
	for (var i = 0; i < tempLegalMoves.length; i++) {
	    var canvas = document.createElement("canvas");
	    canvas.setAttribute("height", width + "px");
	    canvas.setAttribute("width", width + "px");
	    canvas.className = className;
	    var ctx = canvas.getContext("2d");
	    ctx.beginPath();
	    ctx.arc(width / 2, width / 2, width / 10, 0, 2 * Math.PI);
	    ctx.fillStyle = (rightClick) ? options.visibleMarksColor : options.legalMarksColor;
	    ctx.fill();
	    document.getElementById(tempLegalMoves[i][0].toString() + tempLegalMoves[i][1].toString()).appendChild(canvas);
	}
}

function promotePawn(x, y) {
	select(document.getElementById(x.toString()+y.toString()));
	var promotionDiv = document.createElement('div');
	promotionDiv.id = 'promotionDiv';
	promotionDiv.className = 'promotion-div';
	const pieceOptions = [color+'b', color+'r', color+'n', color+'q'];
	for (var i = 0; i < pieceOptions.length; i++) {
		var btn = document.createElement('div');
		btn.id = pieceOptions[i];
		btn.onclick = function(){
			socket.emit('promote', {piece: this.id});
			document.getElementById('promotionDiv').remove();
		};
		btn.className = 'promotion-button';
		btn.style.backgroundImage = 'url("client/imgs/pieces/wikipedia/' + pieceOptions[i] + '.png")';
		promotionDiv.appendChild(btn);
	}
	document.getElementById('board').appendChild(promotionDiv);
	//deselect(selectedSquare);
	//mockServer({desc: 'promote', piece: })
}

//Used to access client.js's global variables from other scripts. Used by clientAddons.js
/*not currently in use
function getClientVariables() {
	return {color: color, noMoreMoves: noMoreMoves, selectedSquare: selectedSquare, boardData: boardData, moveHistory: moveHistory};
}*/

