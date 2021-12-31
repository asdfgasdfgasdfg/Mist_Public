# Mist_Public
Chess variant w/ fog of war and slightly different piece movements.
You can create a room then join using the code on another tab or device. [https://mistchess.herokuapp.com/](url)
You can spectate a game by joining a room that already has 2 players.

Rules are the same as chess, except:
- The board is 8x9, and the top 3 rows of your opponent's pieces are hidden behind a fog.
- Pawns can move forward even if there is another piece in front of it, however the pawn will be sacrificed in the process.
- Enemy queens cannot be seen even if they are outside of the fog. They can only be seen if one of your pieces are looking at it.
- The knight is completely different. It can move/capture the 3 squares in front of it, and it can jump horizontally to capture any enemy piece on the same color square. However it can only jump on a square if there is an enemy piece there to capture.
- Your king will flash red when you're in check, and you will be shown the only legal moves that can get you out of check. However the attacker that's giving a check will not be shown if it's hidden in the fog.
- There is no en passant.

Checkmate to win.

These rules are vague and incomplete. They're just meant to be a brief introduction to the game. You will learn the rest of the rules and strategies as you play.
