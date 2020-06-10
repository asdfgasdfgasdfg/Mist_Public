//to load other files, server side:
//require('./for_current_directory')
//require('for/other/directories/someFile.js')
//to access the variables in other files, use 'export', or just remove the 'var' - but this is not reccomended

var express = require('express');
var app = express();
var serv = require('http').Server(app);

//game files
var Game = require('./server/Game.js');
var piecesData = require('./server/pieces.js').PIECES_LIST;

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.get('/favicon.ico', function(req, res){
    res.sendFile(__dirname + '/client/favicon.ico');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log('server started');

//player connections
var SOCKET_LIST = {};
//games
var GAME_LIST = {};
//waiting to recieve pawn promotion choices from these players
var promotions = {};

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
	//whenever a client connects
	//console.log('socket connection');
	socket.id = Math.random();
	socket.game = 'N/A';
	SOCKET_LIST[socket.id] = socket;

	//-----listening-----
	/*
	socket.on('test', function(data){
		console.log(data.id + ' says ' + data.somestuff);
	});*/

	//disconnect
	socket.on('disconnect', function(){
		delete SOCKET_LIST[socket.id];
		delete promotions[socket.id];
    if(socket.game in GAME_LIST){
    	let game = GAME_LIST[socket.game];
		let opponent = game.players['w'];
		if(opponent == socket.id){
			opponent = game.players['b'];
		}
		if(opponent in SOCKET_LIST){
			SOCKET_LIST[opponent].emit('opponentDC', {board: game.grid.getBoardDataForColor('all')});
		}
		if(socket.game in GAME_LIST){
			delete GAME_LIST[socket.game];
		}
    }
    //spectator
    else{
    	let code = socket.game.split('/')[1];
    	if(code in GAME_LIST){
    		GAME_LIST[code].removeSpectator(socket.id);
    	}
    }
	});

	/*-----client needs to listen for-----

	createRoom, response for when createRoom is called

	*/

	socket.on('move', function(data){
		if(!(socket.id in SOCKET_LIST) || !(socket.game in GAME_LIST)){
			//invalid connection
			return;
		}
		var game = GAME_LIST[socket.game];
		var legal = false;

		var color = (game.players['w'] == socket.id) ? 'w' : 'b';
		if(game.grid.squareExists(data.from[0], data.from[1]) && game.grid.squareExists(data.to[0], data.to[1])){
			let from = game.grid.grid[data.from[0]][data.from[1]];
			let to = game.grid.grid[data.to[0]][data.to[1]];
			let didCapture = (to.piece == '') ? false : true;
			let legalMoves = game.grid.getMoves(from);

			//if it's the player's turn to move, and the move is legal, then move piece and send new board
			if( ((color == 'w' && game.turn%2 == 1) || (color == 'b' && game.turn%2 == 0)) && legalMoves.includes(to) ){
				piecesData[from.piece[1]].move(from, to);
				game.grid.recalibrate();
				game.grid.killGhosts(color);
				//if they moved a pawn and it has reached the top of the board and needs to promote
				if(to.piece == (color + 'p') && piecesData['p'].needsToPromote(to)){
					promotions[socket.id] = [to.x, to.y];
					//update their board and ask them to choose a piece to promote to
					socket.emit('updateBoard', {status: 'promote', board: game.grid.getBoardDataForColor(color), x: to.x, y: to.y});
				}
				else{
					var enemyColor = (color == 'w') ? 'b' : 'w';
					game.turn += 1;
					//check for gameover
					let gameStatus = game.getStatus(color);
					let statusToSend = {'w': '', 'b': ''};

					if(gameStatus == 'playing'){
						//send new board to the player
						socket.emit('updateBoard', {status: 'legal', board: game.grid.getBoardDataForColor(color)});
						//send the move to the opponent
						let moves = game.grid.getAllMoves(enemyColor);
						SOCKET_LIST[game.players[enemyColor]].emit('updateBoard', {status: 'opponentMoved', board: game.grid.getBoardDataForColor(enemyColor), moves: moves, didCapture: didCapture});
					}
					else{
						if(gameStatus == 'checkmate'){
							//send new board to winner
							socket.emit('updateBoard', {status: 'win', board: game.grid.getBoardDataForColor('all')});
							//send new board to loser
							SOCKET_LIST[game.players[enemyColor]].emit('updateBoard', {status: 'lose', board: game.grid.getBoardDataForColor('all'), didCapture: didCapture});
						}
						else if(gameStatus == 'tie'){
							//send new board to winner
							socket.emit('updateBoard', {status: 'tie', board: game.grid.getBoardDataForColor('all')});
							//send new board to loser
							SOCKET_LIST[game.players[enemyColor]].emit('updateBoard', {status: 'tie', board: game.grid.getBoardDataForColor('all'), didCapture: didCapture});
						}
						delete GAME_LIST[socket.game];
						socket.game = 'N/A';
						SOCKET_LIST[game.players[enemyColor]].game = 'N/A';
						game.spectators.forEach(spectator => SOCKET_LIST[spectator].game = 'N/A');
					}
					//send new board to each of the spectators.
					let package = {status: 'spec', board: game.grid.getBoardDataForColor('spec'), didCapture: didCapture};
					game.spectators.forEach(spectator => SOCKET_LIST[spectator].emit('updateBoard', package));
				}
				legal = true;
			}
		}
		//move was illegal
		if(!legal){
			socket.emit('updateBoard', {status: 'illegal', board: game.grid.getBoardDataForColor(color), moves: game.grid.getAllMoves(color)});
		}
	});

	socket.on('promote', function(data){
		if(!(socket.id in SOCKET_LIST) || !(socket.game in GAME_LIST)){
			//invalid connection
			return;
		}

		var game = GAME_LIST[socket.game];
		var color = (game.players['w'] == socket.id) ? 'w' : 'b';

		const choices = ['q', 'b', 'r', 'n'];
		if(!promotions.hasOwnProperty(socket.id) || !choices.includes(data.piece[1]) || data.piece[0] !== color){
			//trying to illegally promote
			return;
		}
		//promote the piece
		game.grid.grid[promotions[socket.id][0]][promotions[socket.id][1]].piece = data.piece;
		//update turn
		game.turn += 1;
		//send updated board to player
		socket.emit('updateBoard', {status: 'legal', board: game.grid.getBoardDataForColor(color)});
		//send the move to the opponent
		let enemyColor = (color == 'w') ? 'b' : 'w';
		SOCKET_LIST[game.players[enemyColor]].emit('updateBoard', {status: 'opponentMoved', board: game.grid.getBoardDataForColor(enemyColor)});
	});

	socket.on('createRoom', function(){
		if(!(socket.id in SOCKET_LIST)){
			//invalid connection
			return;
		}
		//if socket already created a game, delete that game so you can replace it w/ a new one
		if(socket.game != 'N/A'){
			delete GAME_LIST[socket.game];
			socket.game = 'N/A';
		}

		//error handling not fully implemented yet
		let error = false;

		//create a game obj
		let game = new Game.Game(Object.keys(GAME_LIST));
		//assign a random color to the player and add him/her to the game
		let color = (Math.random() < 0.5) ? 'w' : 'b';
		game.players[color] = socket.id;
		socket.game = game.code;
		//add the game to the list of games
		GAME_LIST[game.code] = game;
		let response = {
			code: game.code,
			board: game.grid.getBoardDataForColor(color),
			turn: game.turn,
			color: color
		};
		//error handling not fully implemented yet
		if (error){response = {error: 'Error msg'};}
		else{
			response = {
				code: game.code,
				board: game.grid.getBoardDataForColor(color),
				turn: game.turn,
				color: color
			};
		}
		//send the game code and game info back to the player
		socket.emit('createRoom', response);
	});

	socket.on('joinRoom', function(data){
		if(!(socket.id in SOCKET_LIST)){
			//invalid connection
			return;
		}
		//if socket already created a game, delete that game so you can replace it w/ a new one
		if(socket.game != 'N/A'){
			delete GAME_LIST[socket.game];
			socket.game = 'N/A';
		}
		let error =  (data.code === undefined || GAME_LIST[data.code] === undefined || data.code == socket.game) ? true : false;
		if(error){
			socket.emit('joinRoom', {error: 'Invalid code. Are you sure you typed it in correctly?'});
		}
		else{
			var game = GAME_LIST[data.code];
			if(game.players['w'] != 'waiting' && game.players['b'] != 'waiting'){
				//add spectator to room
				game.spectators.push(socket.id);
				socket.game = 'spec/' + game.code;
				socket.emit('joinRoom', {code: game.code, board: game.grid.getBoardDataForColor('spec'), color: 'spec', turn: game.turn});
			}
			else{
				//add player to room
				socket.game = data.code;
				if(game.players['w'] == 'waiting'){
					game.players['w'] = socket.id;
				}
				else{
					game.players['b'] = socket.id;
				}
				//send game data to both players and tell them to join the room on the client side
				SOCKET_LIST[game.players['w']].emit('joinRoom', {
					code: game.code,
					board: game.grid.getBoardDataForColor('w'),
					turn: game.turn,
					color: 'w',
					moves: game.grid.getAllMoves('w')
				});

				SOCKET_LIST[game.players['b']].emit('joinRoom', {
					code: game.code,
					board: game.grid.getBoardDataForColor('b'),
					turn: game.turn,
					color: 'b'
				});
			}
		}

	});
});

function gameOver(winnerId, loserId) {
	var winner = SOCKET_LIST[winnerId];
	var loser = SOCKET_LIST[loserId];
	delete GAME_LIST[winner.game];
	winner.game = 'N/A';
	loser.game = 'N/A';
	winner.emit('gameOver', {status: 'You won!'});
	loser.emit('lose', {status: 'You lost!'});
}