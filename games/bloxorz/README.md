# bloxorz-game-clone
Simple clone of the famous game bloxorz in webgl

## Quick start
you need to run a local server. Open a terminal/shell/command prompt and type<br>
cd <path/to/files><br>
python -m SimpleHTTPServer<br>
<br>
Then in your browser go to http://localhost:8000

Enjoy the game!

# Table of Contents 
1. The Game
2. Game Controls 
3. Game Level
4. Building the Game 
5. Extra Futures
6. ScreenShots

## 1. The Game
The purpose of the game is to move the brick into the end pile in standing position in order to continue to the next level.The best practice is to finish every level with least moves possible in order to archive higher score.

## 2. Game Controls
The Brick can move on the surface of the level using the arrow keys in the keyboard(Up, Down, Left and Right).The player can also control the camera view using keys(W,A,S,D,Q,E,Z,X).The W-S
 keys move the whole level up and down in the Y axis, A-D keys move the whole level left and right in X axis and Q-E move the whole level in and out in the Z axis. Z-X rotate the view of the game in Z axis also in order to have a better view of the level in the user desires it. In any occasion the player can reset the camera and position to the defaults values by pressing the ‘R’ key.
 
## 3. Game Level
Each level of the game is a 2 dimensional array, the length of every level can vary is size and it consists of the letters s: start pile this the place the brick is initially located when the level loads, letter e: this is the end of the level which the user have to get there having the brick in a standing position. Letter x: is void if the user moves the brick to a religion marked as x the game round is lost. Finally letter p: is the space in the level where user can move freely around. 

## 4. Building the Game
The basic geometry in game is made  be drawing a cube in different positions and different scale.The basic cube has 1x1x1 dimensions in 3d space. In order to make the pile for the level the basic cube was scale to 1x1x0.2 of the original cube. Placing a lot of piles in rows makes a level for the game. Also the brick the moves around is the made by scaling the the basic cube in factor 1x1x2.In order to move around the brick we use rotations by 0 ,90 , 180, -90, -180 degrees according to the previews state of the brick and the currently pressed key and displacements in the x,y axis depending on the currently pressed keys.The brick it self has a variable representing it position if it is in a standing position or laying on the level floor and also variables to calculate it’s current position in the level by keeping track it’s relative coordinates.

## 5. Extra Futures
When the game starts the player has 3 life's, if the player moves the brick into empty space a life is removed and the level is restarted, when 3 life's are lost the game ends. If the player advances to the next level and has fewer than 3 life's an extra life is added in order to have more chance to finish the next levels. Also the game keeps a total of moves the player have done in order to finish the game and calculates a score every time a level is finished.The formula calculating the score is below

Moves Number     =>      Score <br>
moves < 10       => moves * lifes *100<br>
10 <= moves < 20 => moves * lifes * 50<br>
moves > 20       => moves * lifes<br>
  
While playing the game the user can listen to music by clicking on the music option in the header portion of the site and selecting a track from the drop-down list.Also the player can customize the appearance of the game by loading different texture from the Theme selection by default there are 2 textures themes one dark-black and one more psychedelic red-blue. In addition to these the player can change the background picture by clicking on the Change Background, backgrounds change in a
 random way , click until the image satisfy your needs. Finally the player can manually select a level of the game and play by clicking on the Level and selecting the level he wants to play.

6. Screenshots

![Image of Yaktocat](http://i.imgur.com/o4Guyqp.jpg)
  
