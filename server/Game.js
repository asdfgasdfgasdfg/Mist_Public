var Grid = require('./Grid.js');

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
}

module.exports.Game = Game;