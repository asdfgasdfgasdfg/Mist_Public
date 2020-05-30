//init Grid obj for each game

//TODO: add "_X" to state if (color) king cant move there

var trn = 1;
var grid;
function mockServer(request) {
	//TODO: Which player did the request come from? ('w' or 'b')
	//		If request.desc is 'generateRoom' or 'joinRoom', assign a color to the player.
	let player = 'w';

	var reply = 'Request not understood';
	if(request.desc == 'generateRoom'){
		// generate code, create room. Create a new Grid(sideLength) object and call setStartingPosition() method 
		// when creating a new room. The Grid obj is basically a board, and can be found in grid.js
		grid = new Grid(8, 9);
		grid.setStartingPosition();
		grid.recalibrate();

		let options = [{code: 'ABCDEF', board: grid.getBoardDataForColor(player), turn: trn, color: player}, {error: 'Error msg'}];
		reply = options[0];
	}
	else if(request.desc == 'joinRoom'){
		// --- trying to join room with code 'request.code' ---
		/*	TODO:
		if error, eg request.code is not a room, or the room is already full (maybe add spectating in the future):
		reply = {error: 'Error msg'};

		else: 	send board and turn data*/
		reply = mockServer({desc: 'getBoard'});
	}
	else if(request.desc == 'getBoard'){
		reply = {board: grid.getBoardDataForColor(player), turn: trn, color: player};
	}
	else if(request.desc == 'move'){
		//TODO: 
		//if there's a request.promotion or anything else, handle that
		//the move will be 'request.move', and in the format of {from: [x, y], to: [x_f, y_f]}
		if(grid.squareExists(request.move.from[0], request.move.from[1]) && grid.squareExists(request.move.to[0], request.move.to[1])){
			let from = grid.grid[request.move.from[0]][request.move.from[1]];
			let to = grid.grid[request.move.to[0]][request.move.to[1]];
			let legalMoves = piecesData[from.piece[1]].getMoves(from, grid);
			//if move is legal, move piece and send new board
			if( legalMoves.includes(to) ){
				piecesData[from.piece[1]].move(from, to);
				grid.recalibrate();
				reply = {status: 'legal', board: grid.getBoardDataForColor(player)};
			}
		}
		//move is illegal
		else{
			reply = {status: 'illegal', board: grid.getBoardDataForColor(player)};
		}
	}
	else if(request.desc == 'promote'){
		console.log(request.piece);
	}
	//TODO: send reply
	return reply;
}