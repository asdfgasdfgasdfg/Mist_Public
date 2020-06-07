var piecesData = require('./pieces.js').PIECES_LIST;

class Grid{
	constructor(width, height){
		//Note: code is only built around a square grid rn, a rectangal or any other shape may cause problems.
		//TODO: change it to work with rectangles or maybe even any shape. look for 7s or 8s, grid.width, for loops that use i < width, and especially the getMoves() methods
		this.grid = [];
		this.width = width;
		this.height = height;

		for (var x = 0; x < width; x++) {
			this.grid.push([]);
			for (var y = 0; y < height; y++) {
				this.grid[x].push(new Square(x, y));
			}
		}
	}
	setStartingPosition(){
		var wb = [{color: 'w', yCoor: function(y){return y}}, {color: 'b', yCoor: function(y, h){return h-y-1}}];
		for (var c = 0; c < 2; c++) {
			//---pawns---
			//NOTE: Messing with starting pos for pawns might screw up the pawns being able to move 2 squares on their first move.
			//		If you change the starting pos for the pawns, or the movement of the pawns, check getMoves() for pawns in pieces.js and clientGetMoves.js
			for (var i = 0; i < 6; i++) {
				this.grid[1+i][wb[c].yCoor(1, this.height)].piece = wb[c].color + 'p';
			}
			//---bishops---
			this.grid[1][wb[c].yCoor(0, this.height)].piece = wb[c].color + 'b';
			this.grid[6][wb[c].yCoor(0, this.height)].piece = wb[c].color + 'b';
			//---rooks---
			this.grid[2][wb[c].yCoor(0, this.height)].piece = wb[c].color + 'r';
			this.grid[5][wb[c].yCoor(0, this.height)].piece = wb[c].color + 'r';
			//---knights / guards---
			this.grid[0][wb[c].yCoor(1, this.height)].piece = wb[c].color + 'n';
			this.grid[7][wb[c].yCoor(1, this.height)].piece = wb[c].color + 'n';
			//---queens / black widows---
			this.grid[3][wb[c].yCoor(0, this.height)].piece = wb[c].color + 'q';
			//---kings---
			this.grid[4][wb[c].yCoor(0, this.height)].piece = wb[c].color + 'k';
		}
	}
	//returns an array of all the squares in the board. each square is represented by a dictionary {state: 'cloudy/clear + (_X)?', piece: 'piece initials', ... optional additional info}
	getBoardDataForColor(color){
		var boardData = [];
		var squareColorComponent;
		var squareVisibility;
			for (var x = 0; x < this.grid.length; x++) {
				boardData.push([]);
				for (var y = 0; y < this.grid[x].length; y++) {
					if(color == 'w' || color == 'b'){
						squareColorComponent = this.grid[x][y].getColorSpecificComponent(color);
						squareVisibility = squareColorComponent.visibility;
						if(squareVisibility.includes('cloudy')){
							boardData[x].push({state: squareVisibility, piece: ''});
						}
						else if(squareVisibility.includes('clear')){
							if(this.grid[x][y].piece[1] == 'q' && squareColorComponent.observers.length == 0 && squareColorComponent.ghostObservers == 0){
								boardData[x].push({state: squareVisibility, piece: ''});
							}
							else{
								boardData[x].push({state: squareVisibility, piece: this.grid[x][y].piece});
							}
						}
					}
					else if(color == 'all'){
						boardData[x].push({state: 'clear', piece: this.grid[x][y].piece});
					}
				}
			}
		return boardData;
	}
	getAllMoves(color){
		//will return a dict of all possible moves for 'color' player in the form
		//{'square coordinates': [coordinates of all legal moves for that square], '03': [[0, 1], [2, 0]], etc}
		var res = {};
		var gridCopy = this.createCopy();

		var allMoves = this.forEach(function(square, grid){
			if(square.piece.length == 2 && square.piece[0] == color){
				var moves = piecesData[square.piece[1]].getMoves(square, grid);
				for (var i = 0; i < moves.length; i++){
					moves[i] = [moves[i].x, moves[i].y];
				}
				if(moves.length > 0){
					return [[square.x, square.y], moves];
				}

			}
		});
		var piecesList = [];
		for (var key in piecesData){
			piecesList.push(piecesData[key]);
		}
		var enemyColor = (color == 'w') ? 'b' : 'w';
		for (var i = 0; i < allMoves.length; i++){
			res[allMoves[i][0][0].toString() + allMoves[i][0][1].toString()] = allMoves[i][1];
			var movesList = res[allMoves[i][0][0].toString() + allMoves[i][0][1].toString()];
			var from = gridCopy.grid[allMoves[i][0][0]][allMoves[i][0][1]];
			for (var x = movesList.length-1; x >= 0; x--) {
				piecesData[from.piece[1]].move(from, gridCopy.grid[movesList[x][0]][movesList[x][1]]);
				gridCopy.recalibrate();
				let inCheck = gridCopy.forEach(function(square){
					//loop through grid, find the square with your king, check if the king is being attacked. if it is, then this is an invalid move.
					if(square.piece == color + 'k'){
						if(gridCopy.getAttackers(square, piecesList, enemyColor).length > 0){
							return true;
						}
						else{
							return false;
						}
					}
				});
				if(inCheck[0]){
					movesList.splice(x, 1);
				}
				gridCopy = this.createCopy();
				from = gridCopy.grid[allMoves[i][0][0]][allMoves[i][0][1]];
			}
		}
		for (var key in res) {
			if(res[key].length == 0){
				delete res[key];
			}
		}
		return res;
	}
	getMoves(square){
		if(square.piece == ''){
			return []; //there is no piece here, therefore it cannot move anywhere
		}

		var moves = piecesData[square.piece[1]].getMoves(square, this);;
		var piecesList = [];
		for (var key in piecesData){
			piecesList.push(piecesData[key]);
		}
		var gridCopy = this.createCopy();
		var enemyColor = (square.piece[0] == 'w') ? 'b' : 'w';
		for (var i = moves.length-1; i >= 0; i--) {
			piecesData[square.piece[1]].move(gridCopy.grid[square.x][square.y], gridCopy.grid[moves[i].x][moves[i].y]);
			let inCheck = gridCopy.forEach(function(sq){
				//loop through grid, find the square with your king, check if the king is being attacked. if it is, then this is an invalid move.
				if(sq.piece == square.piece[0] + 'k'){
					if(gridCopy.getAttackers(sq, piecesList, enemyColor).length > 0){
						return true;
					}
					else{
						return false;
					}
				}
			});
			if(inCheck[0]){
				moves.splice(i, 1);
			}
			gridCopy = this.createCopy();
		}
		return moves;
	}
	//gets a list of all pieces in the list that can move to this square in 1 turn. useful for checks and similar things.
	//the list of pieces is a customisable parameter so that it will work with different sets of pieces in the future.
	//for example, i might add options for what "faction" you wanna play with, and each one will have their own unique pieces.
	getAttackers(square, pieces, color){
		var results = [];
		//concatinate each piece.getAttackers() into the results list
		for (var i = 0; i < pieces.length; i++) {
			results = results.concat(pieces[i].getAttackers(square, this, color));
		}
		//remove duplicates from results. shouldn't matter as there shouldn't be any duplicates anyways, but can't be too safe :)
	    for(var i=0; i<results.length; ++i) {
	        for(var j=i+1; j<results.length; ++j) {
	            if(results[i] === results[j])
	                results.splice(j--, 1);
	        }
	    }
	    return results;
	}
	squareExists(x, y){
		if(x >= this.width || y >= this.height || x < 0 || y < 0){
			return false;
		}
		else{
			return true;
		}
	}
	//recalibrates observers and visibility info
	recalibrate(){
		//reset observers
		this.forEach(function(square){
			square.resetObservers();
		});
		//add back observersd
		this.forEach(function(square, grid) {
			if(square.piece !== ""){
				var visibleSquares = piecesData[square.piece[1]].getVisibleSquares(square, grid);
				for (var i = 0; i < visibleSquares.length; i++) {
					visibleSquares[i].getColorSpecificComponent(square.piece[0]).observers.push(square);
				}
			}
		});
		//recalibate visibility according to new observer data. all '_X' are removed in this step
		this.forEach(function(square) {
			square.recalibrateVisibility();
		});
		//add red X's for the kings and their checks
		var piecesList = [];
		for (var key in piecesData){
			piecesList.push(piecesData[key]);
		}
		this.forEach(function(square, grid) {
			if(square.piece[1] == 'k'){
				if(grid.getAttackers(square, piecesList, ((square.piece[0] == 'w') ? 'b' : 'w') ).length > 0){
					square.getColorSpecificComponent(square.piece[0]).visibility += '_X';
				}
				/*var checks = piecesData['k'].getChecks(square, grid);
				for (var i = 0; i < checks.length; ++i) {
					checks[i].getColorSpecificComponent(square.piece[0]).visibility += '_X';
				}*/
			}
		});
	}
	//kills ghosts for 'color'. use: after white makes a move, all white ghosts should die, as they should only live for 1 turn.
	killGhosts(color){
		this.forEach(function(square){
			square.killGhosts(color);
		});
	}
	//calls func for each square in the grid. if func returns something, the returned values will be returned in the list 'results'.
	forEach(func){
		var results = [];
		var singleRes;
		for (var x = this.grid.length - 1; x >= 0; x--) {
			for (var y = this.grid[x].length - 1; y >= 0; y--) {
				singleRes = func(this.grid[x][y], this);
				if(singleRes !== undefined){
					results.push(singleRes);
				}
			}
		}
		return results;
	}
	createCopy(){
		var copy = new Grid(this.width, this.height);
		for(var x = 0; x < this.grid.length; x++){
			for (var y = 0; y < this.grid[x].length; y++) {
				copy.grid[x][y].piece = this.grid[x][y].piece;
			}
		}
		return copy;
	}
}

class Square{
	constructor(x, y){
		this.x = x;
		this.y = y;
		this.piece = '';
		this.white = {observers: [], ghostObservers: 0, visibility: 'clear'};
		this.black = {observers: [], ghostObservers: 0, visibility: 'clear'};
		//observers: list of all squares watching this square. if len = 0 and its opponent's territory, vis = none.
	    //ghostObervers: if a piece has recently died here, you can still see what's there for 1 turn. There should only be either 1 or 0 ghosts per color per square - there can only be 1 death on a single square in 1 round, and anyways, with the exception of the assassin, there can only be 1 kill per round.
	    //visibility: 'clear' or 'cloudy' is used instead of true/false so partial visibilities could be added in the future
	}
	//for when it's more convenient to do this.getColorSpecificComponent('w') instead of this.white
	getColorSpecificComponent(color){
		if(color == 'w'){
			return this.white;
		}
		else if(color == 'b'){
			return this.black;
		}
	}
	resetObservers(){
		this.white.observers = [];
		this.black.observers = [];
	}
	recalibrateVisibility(){
		//if this square is on your side or it's being oberved by you, its visible. otherwise, it's cloudy.
		if (this.y < 6 || this.white.observers.length > 0 || this.white.ghostObservers > 0) {
			this.white.visibility = 'clear';
		}
		else{
			//TESTING | for cmd f: "console"
			//this.white.visibility = 'clear';
			this.white.visibility = 'cloudy';
		}
		if (this.y > 2 || this.black.observers.length > 0 || this.black.ghostObservers > 0) {
			this.black.visibility = 'clear';
		}
		else{
			//TESTING | for cmd f: "console"
			//this.black.visibility = 'clear';
			this.black.visibility = 'cloudy';
		}
	}
	killGhosts(color){
		//Note: currently, there is no difference between killing one and killing all ghosts on a square,
		//		as there should only be at most one ghost per square at a time. However, these added functions
		//		may be useful if I ever add ghosts that live longer than 1 round.
		//----------------------------------------------------------------------------------------------------
		//kill one white ghost from each square
		if(color == 'w'){
			if(this.white.ghostObservers > 0){
				--this.white.ghostObservers;
			}
		}
		//kill one black ghost from each square
		else if(color == 'b'){
			if(this.black.ghostObservers > 0){
				--this.black.ghostObservers;
			}
		}
		//kill all white ghosts
		else if(color == 'wReset'){
			this.white.ghostObservers = 0;
		}
		//kill all black ghosts
		else if(color == 'bReset'){
			this.black.ghostObservers = 0;
		}
	}
}

module.exports.Grid = Grid;