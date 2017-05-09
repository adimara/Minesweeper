/* Borad data structers */
var my_board; // game board
var superman_board; // board for superman mode
var superman_list; // mine's list
var queue; 
/* Booleans */
var superman; // in superman mode
var end;	// game eneded
/* Game params */
var flags; // current num of flags 
var flags_max;	// max flag num = num of mines
var uncovered;	// num of squares uncovered
var row;
var mines_detected	// num of mine's user detected
/* Consts */
/* Board consts */
const MINE = 1;
const FLAG_NO_MINE = 2; // flag with no mine under
const FLAG_MINE = 3;	// flag with mine under
const EMPTY = 0;
/* Max height & width */
const MAX_SIZE = 300;
/* When page is loaded */
window.onload = function() {
  // Add event listeners
  document.getElementById("superman").addEventListener("click", handleSuperman, false);
  document.getElementById("new_game").addEventListener("click", restartGame, false);
  restartGame();
};
/* React game class */
var Game = React.createClass({
  /* Function: clickSquare
	Params: e - key
	Return value: None
	The function handle's two options - shift + left mouse click 
	or left mouse click */ 
  clickSquare:function(e){
	// only act if the game is on!
	if(!end){
		// getting the square's location in the board
		var id = e.target.id;
		var i = parseInt(id.substr(0,id.search("_")));
		var j = parseInt(id.substr(id.search("_")+1, id.length));
		// shift + left mouse click
		if(e.shiftKey){
			this.handleFlag(i,j);
		}
		// left mouse click
		else if(e.target.className != "uncover"){
			if(my_board[i][j] == EMPTY || my_board[i][j] == MINE){
			   // clicked on mine - die!
			   if(my_board[i][j] == MINE){
					// change visual
					var square = getSquare(i, j);
					square.className = "mine";
					document.body.className = "dead_background";
					// update - the game has ended
					end = true;
					// update rest of the bombs to red
					if(!superman){
						for (var t = 0; t < superman_list.length; t++){			
							if(superman_list[t][0] != i || superman_list[t][1] != j){
								getSquare(superman_list[t][0], superman_list[t][1]).className += " red_mine";
							}
						}
					}
					return;
			   }
			   // if the player is not dead
			   queue.push([i,j]);
			   this.handleClick();
			   //this.handleClick(i,j);
			}
		}	
	}
  },
  /* Function: handleClick
  Params: None
  Return value: None
  The function reveal the board */ 
  handleClick:function(){
	var a; // current square
	var i;
	var j;
	// uncover first square
	a = queue.pop();
	this.uncoverSquare(a[0],a[1]);
	while(queue.length > 0){
		i = a[0];
		j = a[1];
		// Check if the square is empty
		if (superman_board[i][j] > 0){
			getSquare(i,j).innerHTML = superman_board[i][j];
		}
		else{
			/* Check for each neighbor, if it's a legal one, 
			and if it's yet to be uncovered.
			Left - i, j-1
			Right - i, j+1
			Top - i-1, j
			Bottom - i+1, j
			Top Left - i-1, j-1
			Top Right - i-1, j+1
			Bottom Left - i+1, j-1
			Bottom Right - i+1, j+1 */
			this.uncoverSquare(i-1,j);
			this.uncoverSquare(i+1,j);
			this.uncoverSquare(i,j-1);
			this.uncoverSquare(i,j+1);
			this.uncoverSquare(i+1,j-1);
			this.uncoverSquare(i+1,j+1);
			this.uncoverSquare(i-1,j-1);
			this.uncoverSquare(i-1,j+1);
		}
		a = queue.pop();
	}	
  },
  /* Function: uncoverSquare
  Params: int i & j location in the board
  Return value: None
  The function uncover the square and push it into
  the queue*/ 
  uncoverSquare:function(i,j){
	var square = getSquare(i, j);
	if (isValid(i, j, my_board) && my_board[i][j] == EMPTY){
		if(!isUncoverd(square)){
			square.className = "uncover";
			uncovered ++;
			// check if won
			this.checkWin();
			queue.push([i,j]);  
		}
	}
  },
  /* Function: handleFlag
  Params: i,j location of square
  Return value: None
  The function put or remove a flag */ 
  handleFlag:function(i,j){
	var square = getSquare(i, j);
	// uncovered squares can not be flaged
	if(!isUncoverd(square)){
		//	the square is not a flag
		if (my_board[i][j] != FLAG_NO_MINE && my_board[i][j] != FLAG_MINE){
			// max flags detected
			if (flags == flags_max){
				// visual animation
				var message = document.getElementById("message");
				message.innerHTML = "No more flags left!!!"
				message.className += " flash animated";
				setTimeout(function(){
					message.innerHTML = ""
					message.classList.remove("flash");
					message.classList.remove("animated");
				}, 2000);
			}
			else{
				// put a falg
				square.className = "flag";
				square.innerHTML = "";
				// update value's 
				if (my_board[i][j] == EMPTY){
					my_board[i][j] = FLAG_NO_MINE;
				}
				else{
					// when putting a flag on a mine, check if won
					my_board[i][j] = FLAG_MINE;
					mines_detected++;
					this.checkWin();
				}
				flags++;	
			}
		}
		else {
			square.className = "board_td";
			// remove flag from an empty square
			if (my_board[i][j] == FLAG_NO_MINE){
				my_board[i][j] = EMPTY;
				// restore superman mode
				if(superman){
					square.className += " superman";
					if(superman_board[i][j] > 0){
						square.innerHTML = superman_board[i][j];
					}
				}
			}
			else{
				// restore superman mode
				if(superman){
					square.className += " red_mine";
				}
				my_board[i][j] = MINE;
				mines_detected--;
			}
			flags--;
		}
		// update number of flags
		document.getElementById("flags").innerHTML = flags_max - flags;	
	}
  },
  /* Function: checkWin
  Params: None
  Return value: None
  The function check if the player won - by putting
  all of the flags, or by winning automatically.
  If the user won, update the page visualy. */ 
  checkWin:function(){
	// The player detected all mines
	if(mines_detected == flags_max){
		// Change to win background
		document.body.className ="emoji_background";
		// Visual winning
		for(var i = 0; i < superman_board.length; i++){
			for (var j = 0; j < superman_board[0].length; j++){	
				var square = getSquare(i,j);
				if(my_board[i][j] != FLAG_MINE){
					// Change to winning calss
					square.className = "uncover";
					// Update number of mines around empty squares
					if(superman_board[i][j] > 0){
						square.innerHTML = superman_board[i][j];
					}
				}				
			}	
		}
		end = true;
	}	
	// Auto- winning, when the only thing left is to put flags
	if(uncovered + flags_max == my_board.length*my_board[0].length){
		// Winning background
		document.body.className ="emoji_background";
		for (var i = 0; i < superman_list.length; i++){
			// Get the mines on the board
			var square = getSquare(superman_list[i][0],superman_list[i][1]);
			// If the user didn't put flags, update the mine to be a flag
			if(square.className != "flag") square.className = "flag";
		}
		// Update flgas left to be 0
		flags = flags_max;
		document.getElementById("flags").innerHTML = 0;
		end = true;
	}
  },
  /* Function: render_tr
  Params: tr_t - tr of a table, index- inedx of the tr
  Return value: Table
  The function creates a table by calling th render_td function */ 
  render_tr: function(tr_t, index){
	  row = index;
	  return (<tr className="board_tr">{tr_t.map(this.render_td)}</tr>)  
  },
  /* Function: render_td
  Params: td_t - td of a table, index- inedx of the td
  Return value: Td object*/ 
  render_td: function(td_t, index){
	  var my_id = row+"_"+index;
	  // create a square and name it according to row and column
	  return (<td className="board_td" id={my_id} onClick={this.clickSquare}></td>)
  },
  /* Function: render
  Params: none
  Return value: none
  This function renders the board of the game*/ 
  render: function(){
	return (<table className="game_table"><tbody>
			{my_board.map(this.render_tr)}
			</tbody></table>)
  }
});
/* Function: putMines
Params: int mines- number of mines, int height- of the board
int width- of the board.
Return value: none
The function is locating mines in the board,
and updating the superman_board. */
function putMines(mines, height, width){
  // Can't have mines larger then the board
  mines = Math.min(mines, height*width);
  // Update number of flags according to mines
  flags_max = mines;
  document.getElementById("flags").innerHTML = mines;
  // Put mines
  while (mines > 0){
	  var rand_x = Math.floor(Math.random() * height);
	  var rand_y = Math.floor(Math.random() * width);
	  // The mine is taken
	  while (my_board[rand_x][rand_y] != EMPTY){
			rand_x = Math.floor(Math.random() * height);
			rand_y = Math.floor(Math.random() * width);
	  }
	  // found a location for the mine
	  // update in the gamae board
	  my_board[rand_x][rand_y] = MINE;
	  // insert to list of mines
	  superman_list.push([rand_x, rand_y]);
	  /* Update the cell around the mines (only when they are empty),
	  that there is a mine around them.
	  Nehibor:
	  Left - rand_x, rand_y-1
	  Right - rand_x, rand_y+1
	  Top - rand_x-1, rand_y
	  Bottom - rand_x+1, rand_y
	  Top Left - rand_x-1, rand_y-1
	  Top Right - rand_x-1, rand_y+1
	  Bottom Left - rand_x+1, rand_y-1
	  Bottom Right - rand_x+1, rand_y+1 */	  
	  if(isValid(rand_x, rand_y+1, my_board) && my_board[rand_x][rand_y+1] != MINE){
		superman_board[rand_x][rand_y+1]++;  
	  }
	  if(isValid(rand_x, rand_y-1, my_board) && my_board[rand_x][rand_y-1] != MINE){
		superman_board[rand_x][rand_y-1]++;  
	  }
	  if(isValid(rand_x-1, rand_y, my_board) && my_board[rand_x-1][rand_y] != MINE){
		superman_board[rand_x-1][rand_y]++;  
	  }
	  if(isValid(rand_x+1, rand_y, my_board) && my_board[rand_x+1][rand_y] != MINE){
		superman_board[rand_x+1][rand_y]++;  
	  }
	  if(isValid(rand_x-1, rand_y+1, my_board) && my_board[rand_x-1][rand_y+1] != MINE){
		superman_board[rand_x-1][rand_y+1]++;  
	  }
	  if(isValid(rand_x-1, rand_y-1, my_board) && my_board[rand_x-1][rand_y-1] != MINE){
		superman_board[rand_x-1][rand_y-1]++;  
	  }
	  if(isValid(rand_x+1, rand_y-1, my_board) && my_board[rand_x+1][rand_y-1] != MINE){
		superman_board[rand_x+1][rand_y-1]++;  
	  }
	  if(isValid(rand_x+1, rand_y+1, my_board) && my_board[rand_x+1][rand_y+1] != MINE){
		superman_board[rand_x+1][rand_y+1]++;  
	  }
	 mines --;
  }
}
/* Function: createBoard
Params: int height- of the board, int width- of the board.
Return value: none
The function is creating the game board according to height and width,
the superman_board and the mine's list */
function createBoard(height, width){
	my_board = new Array(height); // game board
	superman_board = new Array(height); // superman board
	superman_list = new Array();// mines list
	// Crating a matrix
	for (var i = 0; i < height; i++) {
		my_board[i] = new Array(width);
		superman_board[i] = new Array(width);
		for (var j = 0; j < width; j++){
			// INIT the values
			my_board[i][j] = EMPTY;
			superman_board[i][j] = EMPTY;
		}
	}
}
/* Function: handleSuperman
Params: e- target
Return value: none
The function is fired when clicking on the superman button,
and add/ remove the superman mode. */
function handleSuperman(e){
  // The button is clickable if the game is on
  if(!end){
	// Active superman or unactive it
	if(!superman){
		// Loop over the superman_board
		for(var i = 0; i < superman_board.length; i++){
			for (var j = 0; j < superman_board[0].length; j++){	
				var square = getSquare(i,j);
				// Show mines
				if(my_board[i][j] == MINE){
					square.className += " red_mine";
				}
				else if(!isUncoverd(square) && my_board[i][j] == EMPTY){	
					//Change to superman class
					square.className += " superman";
					//Update number of mines around the square if there are any
					if(superman_board[i][j] > 0){
						square.innerHTML = superman_board[i][j];
					}	
				}				
			}			
		}  
	}
	else{
		//Loop over superman_board
		for(var i = 0; i < superman_board.length; i++){
			for (var j = 0; j < superman_board[0].length; j++){	
				var square = getSquare(i,j);
				// If the square was on superman mode
				if((square.classList.contains("superman") && (my_board[i][j] == EMPTY)) || my_board[i][j] == MINE){
					//Update to prev class
					square.className = "board_td";
					if(superman_board[i][j] > 0){
						square.innerHTML = "";
					}	
				}				
			}			
		}     
	}
	superman = !superman;  
  }
}
/* Function: getSquare
Params: int i- row,int j - clomun
Return value: A visual square
The function return the square in the game board
in row i and clomun j. */
function getSquare(i, j){
  var id = i+"_"+j;
  return document.getElementById(id); 
}
/* Function: isUncoverd
Params: square - visual in the board
Return value: boolean
The function return if class of the square is uncover */
function isUncoverd(square){
	return square.className == "uncover";
}
/* Function: isValid
Params: int i- row,int j- clomun, board- to check the limits
Return value: boolean
The function return if the value is in the limit of the matrix */
function isValid(i, j, board){
	return (i >= 0 && i < board.length && j >= 0 && j < board[0].length);
}
/* Function: restartGame
Params: none
Return value: none
The function init the game parameter and creating a new game */
function restartGame(){
	end = false; // The game has just started!
	superman = false; // No one pressed the superman button yet
	mines_detected = 0; // No mines detected
	uncovered = 0;// No mines uncovered
	flags = 0;// No flags where located
	queue = [];
	// board div
	var board = document.getElementById("board");
	// get parameters from the input toolbar
	var width = parseInt(document.getElementById("width").value);
	var height = parseInt(document.getElementById("height").value);
	var mines = parseInt(document.getElementById("mines").value);
	// white background
	document.body.className = "";
	// remove board to re-render it
	ReactDOM.unmountComponentAtNode(board);
	// limit the width & height params
	width = width > MAX_SIZE ? MAX_SIZE : width;
	height = height > MAX_SIZE ? MAX_SIZE : height;
	width = width < 0 ? -width : width;
	height = height < 0 ? -height : height;
	// create board
	createBoard(height, width);
	// put mines on the board
	putMines(mines,height,width);
	// render board
	ReactDOM.render(<Game />, board);
}