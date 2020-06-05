var Grid = require('./Grid.js');
var piecesData = require('./pieces.js').PIECES_LIST;

class Game{
	constructor(takenCodes){
		this.turn = 1;
		this.players = {'w': 'waiting', 'b': 'waiting'};
		this.grid = new Grid.Grid(8, 9);
		this.grid.setStartingPosition();
		this.grid.recalibrate();
		var codeNotValid = true;
		var code;
		while (codeNotValid){
			code = '';
			for (var i = 0; i < 5; i++) {
				code += String.fromCharCode( Math.floor(Math.random()*26) + 65 );
			}
			codeNotValid = false;
			for (var i = 0; i < takenCodes.length; i++) {
				if (code == takenCodes[i]){
					codeNotValid = true;
				}
			}
			if(!codeNotValid){
				this.code = code;
			}
		}
	}
	getStatus(color){
		//it is assumed that 'color' has just made a move. since you cannot checkmate yourself, we will only check if enemyColor has been checkmated.
		//if not game over, return false. if game ended by checkmate, return 'checkmate'. if game ended in draw, return 'tie'
		var enemyColor = (color == 'w') ? 'b' : 'w';
		if(Object.keys(this.grid.getAllMoves(enemyColor)).length == 0){
			var checkmate = this.grid.forEach(function(square){
				if(square.piece == enemyColor+'k' && square.getColorSpecificComponent(enemyColor).visibility.includes('_X')){
					return true;
				}
			});
			//'color' won by checkmate
			if(checkmate.length == 1 && checkmate[0]){
				return 'checkmate';
			}
			//game ended in draw
			else{
				return 'tie';
			}
		}
		return 'playing';
	}
}

module.exports.Game = Game;