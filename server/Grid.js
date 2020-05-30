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
		//Mock position for now
		/*
		this.grid[0][0].piece = 'wp';
		this.grid[5][0].piece = 'wb';
		this.grid[3][7].piece = 'bp';
		this.grid[0][5].piece = 'bp';
		//this.grid[0][1].piece = 'wr';
		this.grid[0][3].piece = 'bk';
		*/
		//---Actual position---
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
				squareColorComponent = this.grid[x][y].getColorSpecificComponent(color);
				squareVisibility = squareColorComponent.visibility;
				if(squareVisibility.includes('cloudy')){
					boardData[x].push({state: squareVisibility, piece: ''});
				}
				else if(squareVisibility.includes('clear')){
					if(this.grid[x][y].piece[1] == 'q' && squareColorComponent.observers.length == 0){
						boardData[x].push({state: squareVisibility, piece: ''});
					}
					else{
						boardData[x].push({state: squareVisibility, piece: this.grid[x][y].piece});
					}
				}
			}
		}
		return boardData;
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
		this.forEach(function(square, grid) {
			if(square.piece[1] == 'k'){
				var checks = piecesData['k'].getChecks(square, grid);
				for (var i = 0; i < checks.length; ++i) {
					checks[i].getColorSpecificComponent(square.piece[0]).visibility += '_X';
				}
			}
		});
	}
	//calls func for each square in the grid. if func returns something, the returned values will be returned in the list 'results'.
	forEach(func){
		var results = [];
		for (var x = this.grid.length - 1; x >= 0; x--) {
			for (var y = this.grid[x].length - 1; y >= 0; y--) {
				results.push(func(this.grid[x][y], this));
			}
		}
		return results;
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
			if(this.white.ghostsObservers > 0){
				--this.white.ghostsObservers;
			}
		}
		//kill one black ghost from each square
		else if(color == 'b'){
			if(this.black.ghostsObservers > 0){
				--this.black.ghostsObservers;
			}
		}
		//kill all white ghosts
		else if(color == 'wReset'){
			this.white.ghostsObservers = 0;
		}
		//kill all black ghosts
		else if(color == 'bReset'){
			this.black.ghostsObservers = 0;
		}
	}
}

module.exports.Grid = Grid;