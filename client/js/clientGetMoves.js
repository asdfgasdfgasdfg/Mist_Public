function getMoves(boardData, x, y = undefined) {
	var moves;
	var isString = false;
	//if passed a string through "getMoves('xy')", return a list of coors as strings
	if(x.length == 2 && y === undefined){
		isString = true;
		y = parseInt(x[1]);
		x = parseInt(x[0]);
		moves = piecesList[boardData[x][y].piece[1]].getMoves(x, y, boardData);
		for (var i = 0; i < moves.length; i++) {
			moves[i] = moves[i][0].toString() + moves[i][1].toString();
		}
	}
	//if passed integer coors through "getMoves(x, y)", return a list of integer coors
	else if(y !== undefined){
		moves = piecesList[boardData[x][y].piece[1]].getMoves(x, y, boardData);
	}
	return moves;
}

function squareExists(x, y){
	if(x > 7 || y > 7 || x < 0 || y < 0){
		return false;
	}
	else{
		return true;
	}
}

var piecesList = {};
class ClientPawn{
	constructor(){
	    this.name = 'p';
	    piecesList[this.name] = this;
	}

	//returns list of Squares that are legal moves for a pawn at 'square'. checks if piece at 'square' is a black or white pawn and returns accordingly. assumes piece at 'square' is a pawn.
	getMoves(x, y, boardData){
	    var results = [];

	    //color, enemy color, and forward (forward direction is different for black and white pawns)
		var team = {color: 'w', enemy: 'b', forward: 1};
		if(boardData[x][y].piece[0] == 'b'){
			team = {color: 'b', enemy: 'w', forward: -1};
		}

	    //move forward once as long as it's not at the top of the map
	    if(squareExists(x, y+team.forward)){
			results.push([x, y+team.forward]);
			//move forward twice if pawn is in its starting square and there's nothing in its way
			const isInStartingPos = ((y == 1 && team.color == 'w') || (y == 7 && team.color == 'b')) && x > 0 && x < 7;
			if(squareExists(x, y+2*team.forward)){
				if(boardData[x][y+team.forward].piece == '' && isInStartingPos){
					results.push([x, y+2*team.forward]);
				}
			}
	    }

	    //attack squares
	    if(squareExists(x+1, y+team.forward)){
			if(boardData[x+1][y+team.forward].piece[0] == team.enemy){
				results.push([x+1, y+team.forward]);
			}
	    }
	    if(squareExists(x-1, y+team.forward)){
			if(boardData[x-1][y+team.forward].piece[0] == team.enemy){
			    results.push([x-1, y+team.forward]);
			}
	    }
	    return results;
	}
	//TODO: promoteIfAtTop()
	promoteIfAtTop(square){
		if(square.piece == '' || square.piece === undefined){
			return; //invalid parameter
		}
		//promote if at top of the map - the weird orientation stuff is for different top of the map for black and white
		var top = (square.piece[0] == 'w')
			? 7 //TODO: make compatible with rectangle
			: 0;
	    if(square.y == top){
	    	//TODO: promote
	    	//ask server for the piece that the player wants to promote to, eg queen, then promote it to a queen
	    }
	}
}

class ClientBishop{
	constructor(){
		this.name = 'b';
	    piecesList[this.name] = this;
	}
	getMoves(x, y, boardData){
		var results = [];

		const color = boardData[x][y].piece[0];

		//[top right diagonal, top left diagonal, bottom right diagonal, bottom left diagonal]
		var diagVectors = [{x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
		//get moves for each direction (top right, top left, bottom right, bottom left)
		for (var i = 0; i < 4; i++) {
			let vector = diagVectors[i];
			var tempX = x+vector.x;
			var tempY = y+vector.y;
			while(squareExists(tempX, tempY)){
				if(boardData[tempX][tempY].piece[0] == color){break;}//can't move on top of friendly piece
				results.push([tempX, tempY]);
				if(boardData[tempX][tempY].piece != ''){
					break; //there is a piece on this square. It can't move beyond the piece.
				}
				tempX += vector.x;
				tempY += vector.y;
			}
		}

		return results;
	}
}

class ClientRook{
	constructor(){
		this.name = 'r';
	    piecesList[this.name] = this;
	}
	getMoves(x, y, boardData){
		var results = [];
		const color = boardData[x][y].piece[0];

		//[up, down, left, right]
		const horizontalVectors = [{x: 0, y: 1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 1, y: 0}];
		//get moves for each direction (top right, top left, bottom right, bottom left)
		for (var i = 0; i < 4; i++) {
			let vector = horizontalVectors[i];
			var tempX = x+vector.x;
			var tempY = y+vector.y;
			while(squareExists(tempX, tempY)){
				if(boardData[tempX][tempY].piece[0] == color){break;}//can't move on top of friendly piece
				results.push([tempX, tempY]);
				if(boardData[tempX][tempY].piece != ''){
					break; //there is a piece on this square. It can't move beyond the piece.
				}
				tempX += vector.x;
				tempY += vector.y;
			}
		}
		return results;
	}
}

class ClientKnight{
	constructor(){
		this.name = 'n';
	    piecesList[this.name] = this;
	}
	getMoves(x, y, boardData){
		var results = [];
		var square = boardData[x][y];
		const enemyColor = (square.piece[0] == 'w') ? 'b' : 'w';
		const forward = (enemyColor == 'b') ? 1 : -1;

		//---regular moves---
		//[up, bottom left, bottom right]
		const moves = [{x: 0, y: forward}, {x: -1, y: -forward}, {x: 1, y: -forward}];
		var tempX;
		var tempY;
		var tempSquare;
		for (var i = 0; i < 3; i++) {
			tempX = x + moves[i].x;
			tempY = y + moves[i].y;
			if(squareExists(tempX, tempY)){
				tempSquare = boardData[tempX][tempY];
				if(tempSquare.piece === '' || tempSquare.piece[0] == enemyColor){
					results.push([tempX, tempY]);
				}
			}
		}
		//---jumps (any enemy piece on the same row)---
		for (var i = 0; i < boardData.length; i++) {
			tempSquare = boardData[i][y];
			if(tempSquare.piece[0] == enemyColor){
				results.push([i, y]);
			}
		}
		return results;
	}
}

class ClientQueen{
	constructor(){
		this.name = 'q';
	    piecesList[this.name] = this;
	}
	getMoves(x, y, boardData){
		var results = [];
		const color = boardData[x][y].piece[0];
		const enemyColor = (color == 'w') ? 'b' : 'w';

		//[top right, top left, bottom right, bottom left, up, down, left, right]
		const directions = [{x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}, {x: 0, y: 1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 1, y: 0}];
		//get moves for each direction
		for (var i = 0; i < 8; i++) {
			let vector = directions[i];
			var tempX = x+vector.x;
			var tempY = y+vector.y;
			while(squareExists(tempX, tempY)){
				var tempSquare = boardData[tempX][tempY];
				if(tempSquare.piece[0] == color){break;}//can't move on top of friendly piece
				if(tempSquare.state.includes('clear') && (tempSquare.piece === '' || tempSquare.piece == enemyColor+'k')){//if it is visible, and is either empty or the enemy king, it's a legal move
					results.push([tempX, tempY]);
				}
				if(tempSquare.piece !== ''){
					break; //there is a piece on this square. It can't move beyond the piece.
				}
				tempX += vector.x;
				tempY += vector.y;
			}
		}
		return results;
	}
}

class ClientKing{
	constructor(){
		this.name = 'k';
	    piecesList[this.name] = this;
	}
	getMoves(x, y, boardData){
		var results = [];
		const square = boardData[x][y];
		const enemyColor = (square.piece[0] == 'w') ? 'b' : 'w';

		//[up, down, left, right, top right, top left, bottom right, bottom left]
		const adjacentSquares = [{x: 0, y: 1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
		//iterate over get adjacent squares, add them to results if it is not a friendly piece and its not guarded by enemy piece
		var tempSquare;
		var tempX;
		var tempY;
		for (var i = 0; i < adjacentSquares.length; i++) {
			tempX = x + adjacentSquares[i].x;
			tempY = y + adjacentSquares[i].y;
			//is legal move if it's on the map and not a friendly piece and it's unguarded/unchecked by the enemy
			if(squareExists(tempX, tempY)){
				tempSquare = boardData[tempX][tempY];
				if(tempSquare.piece[0] != square.piece[0] && !tempSquare.state.includes("_X")){
					results.push([tempX, tempY]);
				}
			}
		}
		return results;
	}
}

new ClientPawn();
new ClientBishop();
new ClientRook();
new ClientKnight();
new ClientKing();
new ClientQueen();