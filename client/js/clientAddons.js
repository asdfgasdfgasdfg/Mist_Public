//------Additional functionality------
/*
Purpose:
	Lets you change the default functions of onclickSquare, createMenuPage, and createGamePage. 
	Made for organisational purposes, so the default functions stay basic and don't get cluttered up with too many features.

Description:
	Format: {before: [function1, function2, ...], after: [function1, function2, ...]}
	The functions in "before" are called right before the default function runs, and the ones in after are called right afterwards.

Return values:
	If the before function returns true, the default function will be overridden and won't run. otherwise, please return false.
	These "extra functions" from "before" cannot override eachother. ALL extra functions in "before" will run everytime the default function runs.
	However, if one or more "extra functions" from "before" return true, the "extra functions" in "after" will be overridden and none of them will run.

Parameters:
	All "extra functions" will be passed the same parameter(s) as their corresponding default function. It's up to you if you wanna 
	actually accept these parameters. The comment above each dictionary of extra functions will tell you what the parameters being passed are,
	but if you wanna know more then you can find the actual default function and look at it youself.
*/
//Global variables from client.js will be accessed through this dictionary 'clientVariables'. To see what's inside the dictionary, go to client.js
var clientVariables;

//"squareEle" will be passed
var extraOnclickSquare = {
	before:[
		function(){
			//get client variables so all the following functions can use them
			clientVariables = getClientVariables();
		},
		function(squareEle){
			//add stuff for king X squares and green squares
			return false;
		}, 
		function(squareEle){
			//disable moving if board is in history mode. override = return true
			//otherwise, do nothing and don't override, return false.
			return false;
		}/*,
		function(squareEle){
			//pawn promotion
			if(clientVariables.noMoveMoves || clientVariables.selectedSquare === undefined || !(squareEle.id[1] == '0' || squareEle.id[1] == '7') || getPieceFromSquare(clientVariables.selectedSquare)[1] != 'p'){
				console.log('not applicable');
				return false; //if selected square is not a pawn, or squareEle is not at edge of board, ignore
			}
			var hasDot = false;
		    for (var i = 0; i < squareEle.children.length; i++) {
				if(squareEle.children[i].className == 'square__canvas'){
				    hasDot = true;
				    break;
				}
		    }
		    if(!hasDot){
		    	console.log('cant move here');
		    	return false;
		    }
		    //CLIENT IS UNABLE TO TELL IF PAWN SUICIDED OR NOT, SO LET THE SERVER HANDLE PROMOTION. SERVER WILL CALLBACK CLIENT AND ASK FOR PROMOTION IF NEEDED.
		    if(squareEle.id[0] === selectedSquare.id[0] && typeof squareEle.id === 'string' && getPieceFromSquare(squareEle) !== ""){
		    	console.log('pawn suicided, no promotion');
		    	return false;
		    }
		    console.log('PROMOTE!');
		    //All checks passed, pawn needs to promote
		    //put up promotion div in middle of screen, disable all other clicking, wait for player to choose piece to promote to
		    //move the promoted piece w/ addOrRemoveSquare(), then deselect()
		    //send move to server and verify legality and updateBoard()
		    //return true; to override client.js
		}*/
	],
	after: [
	]
};

//nothing is passed
var extraCreateMenuPage = {
	before: [
		function(){
			//get client variables so all the following functions can use them
			clientVariables = getClientVariables();
		},
	],
	after: [
	]
}

//"data" will be passed
var extraCreateGamePage = {
	before: [
		function(){
			//get client variables so all the following functions can use them
			clientVariables = getClientVariables();
		},
	],
	after: [
	]
}