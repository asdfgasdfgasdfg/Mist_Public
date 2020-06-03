//TODO: check for checks in getMoves(). make a function to do that somewhere and call it in getMoves(). also check for pinned pieces, discovered checks, etc. simulate the move first and if there is a check then dont do it? but what about the client side, they cant see all the enemies and wont know if a piece is pinned.
var piecesData = {};
function initPieces() {
	new Pawn();
	new Bishop();
	new Rook();
	new Knight();
	new King();
	new Queen();
	module.exports.PIECES_LIST = piecesData;
}
/*
Template / Example for making Pieces:
	class Horse extends Piece{
		constructor(){
			super('a unique 1 letter initial, eg "h" for horse');
		}

		--- Required methods: ---
		getMoves(square, grid){return a list of Square objs which would be the legal moves for a horse on square.}
		getVisibleSquares(square, grid){return a list of Square objs which would be seen by a horse on square. This includes squares that're on friendly territory and squares that're already being seen by other pieces.}
		getAttackers(square, grid, color){return a list of Square objs with horses that're attacking square.}

		---Optional - these are default methods that're already inherited from Piece. "Overridding methods" should include the default functionality, which is described below---
		move(from, to){move the piece from (Square from) -> (Square to). Does not need to verify if the move is legal. Handle the capturing of pieces, and call onCapture() method for the captured piece if there was one. onCapture() must be called just BEFORE the piece is actually moved/captured.}
		onCapture(attackingSquare, capturedSquare){add a ghost observer for the captured piece}
	}
	---Instantiate your new Piece in the initPieces() function. Eg, "new Horse();"---
*/

class Piece{
	constructor(name){
	    if (new.target === Piece) {
	      	// or maybe test typeof this.method === "function"
	      	throw new Error("class Piece is only for inheriting, it cannot be instantiated.");
	    }
	    else if (!(typeof this.getMoves === "function" && typeof this.getVisibleSquares === "function" && typeof this.getAttackers === "function")) {
	      	// or maybe test typeof this.method === "function"
	      	throw new Error("Your new piece is missing one or more methods. Check the template at the top of piece.js and make sure you have all the required methods.");
	    }
		//name must match it's name on it's picture in the wikipedia folder. name must be 1 letter.
	    this.name = name;
	    piecesData[name] = this;
	}

	//moves a piece. does not verify if move is legal. 'from' and 'to' are Square objs. captures if available.
	move(from, to){ 
		if(from.piece == '' || from === undefined || to === undefined){
			return; //trying to move a nonexistent piece or squares are undefined
		}
		//if you captured a piece, onCapture()
		if(to.piece != ''){
			piecesData[to.piece[1]].onCapture(from, to);
		}
		//move the piece
		to.piece = from.piece;
		from.piece = '';
	}
	//Note: onCapture is called right before the piece is actually captured. If your onCapture() ends the game in someway and
	//		before the piece is actually moved, for example if you capture the king, the game will end before the king is actually captured on screen.
	
	//Called when piece is captured. adds a ghost for the captured piece.
	onCapture(attackingSquare, capturedSquare){
		if(attackingSquare.piece == '' || capturedSquare.piece == '' || attackingSquare === undefined || capturedSquare === undefined){
			return; //invalid parameters
		}
		var color = capturedSquare.piece[0];
		//if no ghosts, there is now a ghost
		if(capturedSquare.getColorSpecificComponent(color).ghostObservers < 1){
			capturedSquare.getColorSpecificComponent(color).ghostObservers = 1;
		}
	}
	//create wrapper for getMoves(), go through all the moves and make a copy of board to simulate to see if legal.
}

class Pawn extends Piece{
	constructor(){
	    super('p');
	}

	//returns list of Squares that are legal moves for a pawn at 'square'. checks if piece at 'square' is a black or white pawn and returns accordingly. assumes piece at 'square' is a pawn.
	getMoves(square, grid){
	    var results = [];

	    //color, enemy color, and forward (forward direction is different for black and white pawns)
		var team = {color: 'w', enemy: 'b', forward: 1};
		if(square.piece[0] == 'b'){
			team = {color: 'b', enemy: 'w', forward: -1};
		}

	    //move forward once as long as it's not at the top of the map
	    if(grid.squareExists(square.x, square.y+team.forward)){
			results.push(grid.grid[square.x][square.y+team.forward]);
			//move forward twice if pawn is in its starting square and there's nothing in its way
			const isInStartingPos = ((square.y == 1 && team.color == 'w') || (square.y == 7 && team.color == 'b')) && square.x > 0 && square.x < 7;
			if(grid.squareExists(square.x, square.y+2*team.forward)){
				if(grid.grid[square.x][square.y+team.forward].piece == '' && isInStartingPos){
					results.push(grid.grid[square.x][square.y+2*team.forward]);
				}
			}
	    }

	    //attack squares
	    if(grid.squareExists(square.x+1, square.y+team.forward)){
			if(grid.grid[square.x+1][square.y+team.forward].piece[0] == team.enemy){
				results.push(grid.grid[square.x+1][square.y+team.forward]);
			}
	    }
	    if(grid.squareExists(square.x-1, square.y+team.forward)){
			if(grid.grid[square.x-1][square.y+team.forward].piece[0] == team.enemy){
			    results.push(grid.grid[square.x-1][square.y+team.forward]);
			}
	    }
	    return results;
	}

	move(from, to, height){
	    if(from.piece == '' || from === undefined || to === undefined){
			return; //trying to move a nonexistent piece or squares are undefined
		}
	    var forward = (from.piece[0] == 'w')
	    	? 1
	    	: -1;

	    //move forward one or two squares
	    if(from.x == to.x && (from.y+forward == to.y || from.y+2*forward == to.y)){ 
			//move forward into empty square
			if(to.piece == ''){
				to.piece = from.piece;
			}
			//move forward and suicide into another piece
			else{
			    //add temporary 'ghost observer' for the suicided pawn
			    if(to.getColorSpecificComponent(from.piece[0]).ghostObservers < 1){
			    	to.getColorSpecificComponent(from.piece[0]).ghostObservers = 1;
			    }
			}
			//remove pawn from starting square
			from.piece = '';
	    }
	    //attack diagonally
	    else{ 
			//add ghost oberver for the enemy piece that's gonna get killed
			if(to.getColorSpecificComponent(from.piece[0]).ghostObservers < 1){
		    	to.getColorSpecificComponent(from.piece[0]).ghostObservers = 1;
		    }
		    //call onCapture() for the enemy piece
		    piecesData[to.piece[1]].onCapture(from, to);
			//capture the piece
			to.piece = from.piece;
			from.piece = '';
	    }
	}

	getVisibleSquares(square, grid){
		if(square.piece[1] != 'p'){
			return; //invalid parameter, piece is not a pawn
		}
	    var results = [square]; //it's own square is always visible
	    
	    var color = square.piece[0];
	    var forward = (color == 'w')
	    	? 1
	    	: -1;

	    //top right of pawn (technically bottom right if black pawn)
	    if(grid.squareExists(square.x+1, square.y+forward)){
	    	if(grid.grid[square.x+1][square.y+forward].piece[0] != color){
	    		results.push(grid.grid[square.x+1][square.y+forward]);
	    	}
	    }
	    //top left of pawn (technically bottom left if black pawn)
	    if(grid.squareExists(square.x-1, square.y+forward)){
	        if(grid.grid[square.x-1][square.y+forward].piece[0] != color){
	    		results.push(grid.grid[square.x-1][square.y+forward]);
	    	}
	    }
	    return results;
	}
	//gets all 'color' pawns attacking or guarding this square. 
	getAttackers(square, grid, color){
		var results = [];
		var forward = (color == 'w') ? 1 : -1;
		if(grid.squareExists(square.x-1, square.y-forward)){
			if(grid.grid[square.x-1][square.y-forward].piece == color + 'p'){
				results.push(grid.grid[square.x-1][square.y-forward]);
			}
	    }
	    if(grid.squareExists(square.x+1, square.y-forward)){
			if(grid.grid[square.x+1][square.y-forward].piece == color + 'p'){
			    results.push(grid.grid[square.x+1][square.y-forward]);
			}
	    }
	    return results;
	}
	needsToPromote(square, grid){
		if(square.piece.length != 2 || square.piece[1] != 'p'){
			return; //square is not a pawn
		}
		//promote if at top of the map - the weird orientation stuff is for different top of the map for black and white
		var top = (square.piece[0] == 'w')
			? grid.height-1
			: 0;
	    if(square.y == top){
	    	return true;
	    }
	    else{
	    	return false;
	    }
	}
}

class Bishop extends Piece{
	constructor(){
		super('b');
	}

	getMoves(square, grid){
		var results = [];
		const color = square.piece[0];

		//[top right diagonal, top left diagonal, bottom right diagonal, bottom left diagonal]
		const diagVectors = [{x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
		//get moves for each direction (top right, top left, bottom right, bottom left)
		var vector;
		var tempX;
		var tempY;
		var tempPiece;
		for (var i = 0; i < 4; i++) {
			vector = diagVectors[i];
			tempX = square.x+vector.x;
			tempY = square.y+vector.y;
			while(grid.squareExists(tempX, tempY)){
				tempPiece = grid.grid[tempX][tempY].piece;
				if(tempPiece[0] == color){break;}//can't move on top of friendly piece
				results.push(grid.grid[tempX][tempY]);
				if(tempPiece !== ''){
					break; //there is a piece on this square. It can't move beyond the piece.
				}
				tempX += vector.x;
				tempY += vector.y;
			}
		}

		return results;
	}

	getVisibleSquares(square, grid){
		var results = this.getMoves(square, grid);
		results.push(square);
		return results;
	}

	getAttackers(square, grid, color){
		var results = [];
		var enemyColor = (color == 'w') ? 'b' : 'w';

		//[top right diagonal, top left diagonal, bottom right diagonal, bottom left diagonal]
		const diagVectors = [{x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
		//get moves for each direction
		var vector;
		var tempX;
		var tempY;
		var tempPiece;
		for (var i = 0; i < 4; i++) {
			vector = diagVectors[i];
			tempX = square.x+vector.x;
			tempY = square.y+vector.y;
			while(grid.squareExists(tempX, tempY)){
				tempPiece = grid.grid[tempX][tempY].piece;
				if(tempPiece !== ""){
					if(tempPiece == color + 'b'){
						results.push(grid.grid[tempX][tempY]);
						break;
					}
					break; //all enemy bishops beyond this point will be blocked by the piece on this square
				}
				tempX += vector.x;
				tempY += vector.y;
			}
		}

		return results;
	}
}

class Rook extends Piece{
	constructor(){
		super('r');
	}

	getMoves(square, grid){
		var results = [];
		const color = square.piece[0];

		//[up, down, left, right]
		const horizontalVectors = [{x: 0, y: 1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 1, y: 0}];
		//get moves for each direction (up, down, left, right)
		var vector;
		var tempX;
		var tempY;
		var tempPiece;
		for (var i = 0; i < 4; i++) {
			vector = horizontalVectors[i];
			tempX = square.x+vector.x;
			tempY = square.y+vector.y;
			while(grid.squareExists(tempX, tempY)){
				tempPiece = grid.grid[tempX][tempY].piece;
				if(tempPiece[0] == color){break;}//can't move on top of friendly piece
				results.push(grid.grid[tempX][tempY]);
				if(tempPiece !== ''){
					break; //there is a piece on this square. It can't move beyond the piece.
				}
				tempX += vector.x;
				tempY += vector.y;
			}
		}

		return results;
	}

	getVisibleSquares(square, grid){
		var results = this.getMoves(square, grid);
		results.push(square);
		return results;
	}

	getAttackers(square, grid, color){
		var results = [];
		var enemyColor = (color == 'w') ? 'b' : 'w';

		//[up, down, left, right]
		const horizontalVectors = [{x: 0, y: 1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 1, y: 0}];
		//get moves for each direction (top right, top left, bottom right, bottom left)
		var vector;
		var tempX;
		var tempY;
		var tempPiece;
		for (var i = 0; i < 4; i++) {
			vector = horizontalVectors[i];
			tempX = square.x+vector.x;
			tempY = square.y+vector.y;
			while(grid.squareExists(tempX, tempY)){
				tempPiece = grid.grid[tempX][tempY].piece;
				if(tempPiece !== ""){
					if(tempPiece == color + 'r'){
						results.push(grid.grid[tempX][tempY]);
						break;
					}
					break; //all enemy rooks beyond this point will be blocked by the piece on this square
				}
				tempX += vector.x;
				tempY += vector.y;
			}
		}

		return results;
	}
}

class Knight extends Piece{
	constructor(){
		super('n');
	}
	getMoves(square, grid){
		var results = [];
		const enemyColor = (square.piece[0] == 'w') ? 'b' : 'w';
		const forward = (enemyColor == 'b') ? 1 : -1;

		//---regular moves---
		//[up, bottom left, bottom right]
		const moves = [{x: 0, y: forward}, {x: -1, y: -forward}, {x: 1, y: -forward}];
		var tempX;
		var tempY;
		var tempSquare;
		for (var i = 0; i < 3; i++) {
			tempX = square.x + moves[i].x;
			tempY = square.y + moves[i].y;
			if(grid.squareExists(tempX, tempY)){
				tempSquare = grid.grid[tempX][tempY];
				if(tempSquare.piece === '' || tempSquare.piece[0] == enemyColor){
					results.push(tempSquare);
				}
			}
		}
		//---jumps (any enemy piece on the same row)---
		for (var i = 0; i < grid.width; i++) {
			tempSquare = grid.grid[i][square.y];
			if(tempSquare.piece[0] == enemyColor){
				results.push(tempSquare);
			}
		}
		return results;
	}

	getVisibleSquares(square, grid){
		var results = this.getMoves(square, grid);
		results.push(square);
		return results;
	}

	getAttackers(square, grid, color){
		var results = [];
		const forward = (color == 'w') ? 1 : -1;
		//---regular moves---
		//[up, bottom left, bottom right]
		const moves = [{x: 0, y: forward}, {x: -1, y: -forward}, {x: 1, y: -forward}];
		var tempX;
		var tempY;
		var tempSquare;
		for (var i = 0; i < 3; i++) {
			tempX = square.x - moves[i].x;
			tempY = square.y - moves[i].y;
			if(grid.squareExists(tempX, tempY)){
				tempSquare = grid.grid[tempX][tempY];
				if(tempSquare.piece == color + 'n'){
					results.push(tempSquare);
				}
			}
		}
		//---jumps (any enemy knight on the same row other than on the square in question)---
		for (var i = 0; i < grid.width; i++) {
			if(i == square.x){continue;}
			tempSquare = grid.grid[i][square.y];
			if(tempSquare.piece == color + 'n'){
				results.push(tempSquare);
			}
		}
		return results;
	}
}

class Queen extends Piece{
	constructor(){
		super('q');
	}
	getMoves(square, grid){
		var results = [];
		const enemyColor = (square.piece[0] == 'w') ? 'b' : 'w';
		const color = square.piece[0];
		//[top right, top left, bottom right, bottom left, up, down, left, right]
		const directions = [{x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}, {x: 0, y: 1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 1, y: 0}];
		//get moves for each direction
		var vector;
		var tempX;
		var tempY;
		var tempPiece;
		for (var i = 0; i < 8; i++) {
			vector = directions[i];
			tempX = square.x+vector.x;
			tempY = square.y+vector.y;
			while(grid.squareExists(tempX, tempY)){
				tempPiece = grid.grid[tempX][tempY].piece;
				if(tempPiece[0] == color){break;}//can't move on top of friendly piece
				if(grid.grid[tempX][tempY].getColorSpecificComponent(square.piece[0]).visibility.includes('clear') && (tempPiece === '' || tempPiece === enemyColor+'k')){//if it is visible, and is either empty or the enemy king, it's a legal move
					results.push(grid.grid[tempX][tempY]);
				}
				if(tempPiece !== ''){
					break; //there is a piece on this square. It can't move beyond the piece.
				}
				tempX += vector.x;
				tempY += vector.y;
			}
		}
		return results;
	}
	getVisibleSquares(square, grid){
		/*
		var results = this.getMoves(square, grid);
		results.push(square);
		return results;*/
		
		var results = [square];
		const color = square.piece[0];
		const directions = [{x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}, {x: 0, y: 1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 1, y: 0}];
		var vector;
		var tempX;
		var tempY;
		var tempPiece;
		for (var i = 0; i < 8; i++) {
			vector = directions[i];
			tempX = square.x+vector.x;
			tempY = square.y+vector.y;
			while(grid.squareExists(tempX, tempY)){
				tempPiece = grid.grid[tempX][tempY].piece;
				if(tempPiece[0] == color){break;}//can't move on top of friendly piece
				results.push(grid.grid[tempX][tempY]);
				if(tempPiece !== ''){
					break; //there is a piece on this square. It can't move beyond the piece.
				}
				tempX += vector.x;
				tempY += vector.y;
			}
		}
		return results;
	}
	getAttackers(square, grid, color){
		//Assumes the square in question is either empty or contains the king, since Queens can only capture kings or move into empty spots
		var results = [];
		const enemyColor = (color == 'w') ? 'b' : 'w';
		//(Deprecated) if this square is invisible to 'color', no 'color' Queens will be able to see or attack it.
		//if(!square.getColorSpecificComponent(color).visibility.includes('clear')){return []};
		
		//[top right, top left, bottom right, bottom left, up, down, left, right]
		const directions = [{x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}, {x: 0, y: 1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 1, y: 0}];
		//go in each direction until an 'color' queen is found, or you reach some other piece or the end of the map.
		var vector;
		var tempX;
		var tempY;
		var tempPiece;
		for (var i = 0; i < 8; i++) {
			vector = directions[i];
			tempX = square.x+vector.x;
			tempY = square.y+vector.y;
			while(grid.squareExists(tempX, tempY)){
				tempPiece = grid.grid[tempX][tempY].piece;
				if(tempPiece !== ''){//there is a piece on this square
					if(tempPiece == color + 'q'){ //there is a 'color' queen on this square, add it to list of attackers
						results.push(grid.grid[tempX][tempY]);
					}
					break;
				}
				tempX += vector.x;
				tempY += vector.y;
			}
		}
		return results;
	}
}

class King extends Piece{
	constructor(){
		super('k');
	}

	getMoves(square, grid){
		var results = [];
		const enemyColor = (square.piece[0] == 'w') ? 'b' : 'w';

		//[up, down, left, right, top right, top left, bottom right, bottom left]
		const adjacentSquares = [{x: 0, y: 1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
		//iterate over get adjacent squares, add them to results if it is not a friendly piece and its not guarded by enemy piece
		var tempSquare;
		var tempX;
		var tempY;
		for (var i = 0; i < adjacentSquares.length; i++) {
			tempX = square.x + adjacentSquares[i].x;
			tempY = square.y + adjacentSquares[i].y;
			if(grid.squareExists(tempX, tempY)){
				tempSquare = grid.grid[tempX][tempY];
				//is legal move if it's not a friendly piece and it's unguarded/unchecked by the enemy
				if(tempSquare.piece[0] != square.piece[0] && grid.getAttackers(tempSquare, grid, enemyColor).length == 0){
					results.push(tempSquare);
				}
			}
			
		}

		return results;
	}

	getVisibleSquares(square, grid){
		var results = this.getMoves(square, grid);
		results.push(square);
		return results;
	}

	getAttackers(square, grid, color){
		var results = [];
		const enemyColor = (color == 'w') ? 'b' : 'w';

		//[up, down, left, right, top right, top left, bottom right, bottom left]
		const adjacentSquares = [{x: 0, y: 1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
		//iterate over get adjacent squares, add them to results if it is not a friendly piece and its not guarded by enemy piece
		var tempSquare;
		var tempX;
		var tempY;
		for (var i = 0; i < adjacentSquares.length; i++) {
			tempX = square.x - adjacentSquares[i].x;
			tempY = square.y - adjacentSquares[i].y;
			if(grid.squareExists(tempX, tempY)){
				tempSquare = grid.grid[tempX][tempY];
				if(tempSquare.piece == color + 'k'){
					results.push(tempSquare);
				}
			}
			
		}

		return results;
	}

	onCapture(attackingSquare, capturedSquare){
		super.onCapture(attackingSquare, capturedSquare);
		//console.log(attackingSquare.piece[0] + " wins");
	}

	getChecks(square, grid){
		var results = [];
		const enemyColor = (square.piece[0] == 'w') ? 'b' : 'w';

		//remove king from board temporarily to accurately calculate checked squares
		const originalPiece = square.piece;
		square.piece = "";

		//[self, up, down, left, right, top right, top left, bottom right, bottom left]
		const adjacentSquares = [{x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
		//iterate over get adjacent squares, add them to results if it is guarded by an enemy piece
		var tempSquare;
		var tempX;
		var tempY;
		var piecesList = [];
		for (var key in piecesData){
			piecesList.push(piecesData[key]);
		}
		for (var i = 0; i < adjacentSquares.length; i++) {
			tempX = square.x + adjacentSquares[i].x;
			tempY = square.y + adjacentSquares[i].y;
			if(grid.squareExists(tempX, tempY)){
				tempSquare = grid.grid[tempX][tempY];
				if(grid.getAttackers(tempSquare, piecesList, enemyColor).length > 0){
					results.push(tempSquare);
				}
			}
			
		}

		//place king back on board
		square.piece = originalPiece;
		return results;
	}
}

initPieces();