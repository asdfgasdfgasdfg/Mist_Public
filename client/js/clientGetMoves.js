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

function getVisibleSquares(boardData, x, y = undefined){
	var visibleSquares;
	var isString = false;
	//if passed a string through "getMoves('xy')", return a list of coors as strings
	if(x.length == 2 && y === undefined){
		isString = true;
		y = parseInt(x[1]);
		x = parseInt(x[0]);
		visibleSquares = piecesList[boardData[x][y].piece[1]].getVisible(x, y, boardData);
		for (var i = 0; i < visibleSquares.length; i++) {
			visibleSquares[i] = visibleSquares[i][0].toString() + visibleSquares[i][1].toString();
		}
	}
	//if passed integer coors through "getMoves(x, y)", return a list of integer coors
	else if(y !== undefined){
		visibleSquares = piecesList[boardData[x][y].piece[1]].getVisible(x, y, boardData);
	}
	return visibleSquares;
}

function squareExists(x, y){
	if(x > 7 || y > 8 || x < 0 || y < 0){
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
			const isInStartingPos = ((y == 1 && team.color == 'w') || (y == boardData[0].length-2 && team.color == 'b')) && x > 0 && x < boardData.length-1;
			if(squareExists(x, y+2*team.forward)){
				if(isInStartingPos){
					results.push([x, y+2*team.forward]);
				}
			}
	    }

	    //attack squares
	    if(squareExists(x+1, y+team.forward)){
			results.push([x+1, y+team.forward]);
	    }
	    if(squareExists(x-1, y+team.forward)){
			results.push([x-1, y+team.forward]);
	    }
	    return results;
	}
	getVisible(x, y, boardData){
		var results = [];
		var forward = (boardData[x][y].piece[0] == 'w') ? 1 : -1;
		if(squareExists(x+1, y+forward)){
			results.push([x+1, y+forward]);
	    }
	    if(squareExists(x-1, y+forward)){
			results.push([x-1, y+forward]);
	    }
	    return results;
	}
}

class ClientBishop{
	constructor(){
		this.name = 'b';
	    piecesList[this.name] = this;
	}
	getMoves(x, y){
		var results = [];

		//[top right diagonal, top left diagonal, bottom right diagonal, bottom left diagonal]
		var diagVectors = [{x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
		//get moves for each direction (top right, top left, bottom right, bottom left)
		for (var i = 0; i < 4; i++) {
			let vector = diagVectors[i];
			var tempX = x+vector.x;
			var tempY = y+vector.y;
			while(squareExists(tempX, tempY)){
				results.push([tempX, tempY]);
				tempX += vector.x;
				tempY += vector.y;
			}
		}

		return results;
	}
	getVisible(x, y, boardData){
		var results = [];

		//[top right diagonal, top left diagonal, bottom right diagonal, bottom left diagonal]
		const diagVectors = [{x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
		//get moves for each direction (top right, top left, bottom right, bottom left)
		for (var i = 0; i < 4; i++) {
			let vector = diagVectors[i];
			var tempX = x+vector.x;
			var tempY = y+vector.y;
			while(squareExists(tempX, tempY)){
				results.push([tempX, tempY]);
				if(boardData[tempX][tempY].piece != ''){break;}
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
	getMoves(x, y){
		var results = [];

		//[up, down, left, right]
		const horizontalVectors = [{x: 0, y: 1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 1, y: 0}];
		//get moves for each direction (top right, top left, bottom right, bottom left)
		for (var i = 0; i < 4; i++) {
			let vector = horizontalVectors[i];
			var tempX = x+vector.x;
			var tempY = y+vector.y;
			while(squareExists(tempX, tempY)){
				results.push([tempX, tempY]);
				tempX += vector.x;
				tempY += vector.y;
			}
		}
		return results;
	}
	getVisible(x, y, boardData){
		var results = [];

		//[top right diagonal, top left diagonal, bottom right diagonal, bottom left diagonal]
		const horizontalVectors = [{x: 0, y: 1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 1, y: 0}];
		//get moves for each direction (top right, top left, bottom right, bottom left)
		for (var i = 0; i < 4; i++) {
			let vector = horizontalVectors[i];
			var tempX = x+vector.x;
			var tempY = y+vector.y;
			while(squareExists(tempX, tempY)){
				results.push([tempX, tempY]);
				if(boardData[tempX][tempY].piece != ''){break;}
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
		const forward = (boardData[x][y].piece[0] == 'w') ? 1 : -1;

		//---regular moves---
		//[up, bottom left, bottom right]
		const moves = [{x: 0, y: forward}, {x: -1, y: -forward}, {x: 1, y: -forward}];
		var tempX;
		var tempY;
		for (var i = 0; i < 3; i++) {
			tempX = x + moves[i].x;
			tempY = y + moves[i].y;
			if(squareExists(tempX, tempY)){
				results.push([tempX, tempY]);
			}
		}
		//---jumps (any enemy piece on the same row and on the same color square)---
		for (var i = (x%2); i < boardData.length; i+=2) {
			results.push([i, y]);
		}
		return results;
	}
	getVisible(x, y, boardData){
		return this.getMoves(x, y, boardData);
	}
}

class ClientQueen{
	constructor(){
		this.name = 'q';
	    piecesList[this.name] = this;
	}
	getMoves(x, y, boardData){
		var results = [];

		//[top right, top left, bottom right, bottom left, up, down, left, right]
		const directions = [{x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}, {x: 0, y: 1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 1, y: 0}];
		//get moves for each direction
		for (var i = 0; i < 8; i++) {
			let vector = directions[i];
			var tempX = x+vector.x;
			var tempY = y+vector.y;
			while(squareExists(tempX, tempY)){
				results.push([tempX, tempY]);
				tempX += vector.x;
				tempY += vector.y;
			}
		}
		return results;
	}
	getVisible(x, y, boardData){
		var results = [];
/*
		//[top right, top left, bottom right, bottom left, up, down, left, right]
		const directions = [{x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}, {x: 0, y: 1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 1, y: 0}];
		//get moves for each direction (top right, top left, bottom right, bottom left)
		for (var i = 0; i < 8; i++) {
			let vector = directions[i];
			var tempX = x+vector.x;
			var tempY = y+vector.y;
			while(squareExists(tempX, tempY)){
				results.push([tempX, tempY]);
				if(boardData[tempX][tempY].piece != ''){break;}
				tempX += vector.x;
				tempY += vector.y;
			}
		}*/
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
				results.push([tempX, tempY]);
			}
		}
		return results;
	}
	getVisible(x, y, boardData){
		return this.getMoves(x, y, boardData);
	}
}

new ClientPawn();
new ClientBishop();
new ClientRook();
new ClientKnight();
new ClientKing();
new ClientQueen();