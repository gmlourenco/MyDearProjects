/*     Lode Runner

01234567890123456789012345678901234567890123456789012345678901234567890123456789
Autores: Gonçalo Lourenço (55780), Joana Faria (55754)
*/

// GLOBAL VARIABLES

// tente não definir mais nenhuma variável global
let animation;// to clear the SetInterval
let empty, hero, control, gameInfo;

let rooling;

//Constants - Walking types
const ASCENDABLE = 4;
const FLOOR = 1;
const CLIMBABLE = 2;
const VOID = 0;

//Constants - game rules
const START_LEVEL = 1;
const TIME_RESTORE_BRICK = 250;
const SPEED_ROBOTS = 4;
const LEVEL_UP_BONUS = 100000;
const DEAD_PENALTY = 100;
const START_LIVES = 5;
const DROP_GOLD = 5;
const BONUS_SCORE_GOLD = 200;
const BONUS_SCORE_TRAPPED_ROBOT = 2;
const BONUS_SCORE_KILL_ROBOT = 1000;

//Constants - messages to the user
const DIED = "You died, try again. Level: ";
const END_LIVES = "You died and you don't have any more lives.\n Restart at level 1!";
const LEVEL_UP = 'Congratulations! You leveled up!\n Level: ';
const FINISH_GAME = "Congratulations! You Finished the game!";
const RESTART_LEVEL = "Restart level ";



const IMAGES_NAMES = ['_falls_left', '_falls_right',
	'_on_ladder_left', '_on_ladder_right', '_on_rope_left',
	'_on_rope_right', '_runs_left', '_runs_right',
	'_shoots_left', '_shoots_right'];


// ACTORS

class Actor {
	constructor(x, y, imageName) {
		this.x = x;
		this.y = y;
		this.imageName = imageName;
		this.show();
		this.free = false;  //available to move to
		this.walkableType = VOID;
		this.evil = false; //if is against the hero
	}
	draw(x, y) {
		control.ctx.drawImage(GameImages[this.imageName],
			x * ACTOR_PIXELS_X, y * ACTOR_PIXELS_Y);
	}
	/**Returns true is the place is free to move to 
	 * (empty, chimney, ladder and rope) */
	isFree() {
		return this.free;
	}

	/**Returns true if the active actor can walk if it is under is feet */
	isWalkable() {
		return this.walkableType === FLOOR
			|| this.walkableType === ASCENDABLE;
	}

	/**Returns true if is climbable (rope) */
	isClimbable() {
		return this.walkableType === CLIMBABLE;
	}

	/**Returns true is is ascendable (rope) */
	isAscendable() {
		return this.walkableType === ASCENDABLE;
	}

	/**Returns true if the actor is against the hero 
	 * (In the future we thought we could add passive actors that are
	 * armful to the hero) */
	isEnemy() {
		return this.evil;
	}
}


class PassiveActor extends Actor {
	constructor(x, y, imageName) {
		super(x, y, imageName);
	}

	show() {
		control.world[this.x][this.y] = this;
		this.draw(this.x, this.y);
	}

	hide() {
		control.world[this.x][this.y] = empty;
		empty.draw(this.x, this.y);
	}

	/**Returns true is the passive actor can be destroyed */
	isDestructible() {
		return this instanceof PassiveActorShootable;
	}

	animation() { }
}

/**Class with the characteristics of a passive actor that can 
 * be shotted (brick) */
class PassiveActorShootable extends PassiveActor {

	constructor(x, y, imageName) {
		super(x, y, imageName);
	}

	/**Redefine hide so the brick can no longer be walkable 
	 * and if shows a empty image */
	hide() {
		this.imageName = "empty";
		this.walkableType = VOID;
		this.free = true;
		this.show();
	}

	/**Operation to performed a shot on the destructible active actor 
	 * Hides the brick, saves the position as a trap to robots and a time
	 * necessary to restore
	*/
	getShot() {
		if (control.world[this.x][this.y - 1].isFree()) {
			this.hide();
			gameInfo.traps.push([this.x, this.y, TIME_RESTORE_BRICK]);
		}
	}

	/**Operation to restore a brick after the time to restore is passed.
	 * If there is a active actor in the brick to restore then the active actor 
	 * will be pull up, unless there is a active actor in the position already.
	 * In that case the trap will not be removed and the active actor will wait
	 * till it can be pulled up
	 */
	restore() {
		if ((control.worldActive[this.x][this.y] instanceof ActiveActor)) {
			control.worldActive[this.x][this.y].jumpBrick();
		} else {
			gameInfo.traps.shift();
		}

		this.free = false;
		this.walkableType = FLOOR;
		this.imageName = "brick";
		this.show();
	}

	/**Animation of the passive actor so it can be restored we the time
	 * passes 
	 */
	animation() {
		for (let i = 0; i < gameInfo.traps.length; i++) {
			//time left to restore brick
			let time = gameInfo.traps[i][2];
			//trap's coordinates
			let x = gameInfo.traps[i][0];
			let y = gameInfo.traps[i][1];
			if (time <= 0) {
				control.world[x][y].restore();
			}

			if (this.x === x && this.y === y) {
				//decreases the time of the trap
				gameInfo.traps[i][2] -= 1;
			}
		}
	}
}


class ActiveActor extends Actor {

	constructor(x, y, imageName) {
		super(x, y, imageName);
		this.time = 0;
		this.goldCollected = 0;
		this.walkableType = FLOOR;
		this.name;
	}

	show() {
		control.worldActive[this.x][this.y] = this;
		this.draw(this.x, this.y);
	}

	hide() {
		control.worldActive[this.x][this.y] = empty;
		control.world[this.x][this.y].draw(this.x, this.y);
	}
	/** Evaluates if a move will occur inside the borders of the game */
	insideBorders(dx, dy) {
		return this.x + dx >= 0 && this.x + dx < WORLD_WIDTH
			&& this.y + dy >= 0 && this.y + dy < WORLD_WIDTH;
	}

	/**Evaluates the collision of actors in the active world.
	 * If the good guy colides with the bad guy then the good guy dies
	*/
	evalCollision(dx, dy) {

		if (this.insideBorders(dx, dy)
			&& !(control.worldActive[this.x + dx][this.y + dy] instanceof Empty)) {

			if (!this.isEnemy() //hero colides with robot
				&& control.worldActive[this.x + dx][this.y + dy].isEnemy()) {
				this.die();
			} else if (this.isEnemy() //robot colides with hero
				&& !control.worldActive[this.x + dx][this.y + dy].isEnemy()) {
				control.worldActive[this.x + dx][this.y + dy].die();
			}
		}
	}

	/**Computes the common aspects of the active actors movement */
	move(dx, dy) {

		//Collect gold on the way
		if (this.canMove(dx, dy)) {
			this.catch(dx, dy);
		}


		//evaluate if the good guy dies due to collision with robot
		this.evalCollision(dx, dy);

		//if the actor can move it will move
		if (this.canMove(dx, dy)) {
			this.hide();
			this.x += dx;
			this.y += dy;
			//determinates the direction of the image of the actor
			let left = (dx === 0) ? this.imageName.includes('left') : dx < 0;
			this.changeImage(6, left);
			this.show();
		}

	}

	/**Collects the gold and return true is the gold has collected*/
	collectGold() {
		this.goldCollected += 1;
		return true;
	}

	/**Evaluates if the active actor can make the desired move */
	canMove(dx, dy) {
		//in the canvas
		return (this.x + dx < WORLD_WIDTH) && (this.x + dx >= 0
			&& this.y + dy < WORLD_HEIGHT)
			//the new position is free
			&& (this.y + dy >= 0
				&& control.world[this.x + dx][this.y + dy].isFree())
			// can go up only when on a ladder
			&& (dy >= 0 || control.world[this.x][this.y].isAscendable())
			// can't move during a fall
			&& (control.world[this.x][this.y].isClimbable()
				|| (this.y + 1 === WORLD_HEIGHT)//can walk on the bottom border
				|| control.world[this.x][this.y + 1].isWalkable()
				|| control.worldActive[this.x][this.y + 1].isWalkable()
				|| control.world[this.x][this.y].isAscendable());
	}

	/**Returns true if the actor is in a position from which it may fall */
	mayFall() {
		return this.y + 1 < WORLD_HEIGHT //in canvas
			//the position bellow the actor must be walkable for not occur a fall
			&& !(control.world[this.x][this.y + 1].isWalkable()
				|| control.worldActive[this.x][this.y + 1].isWalkable()
				//unless the actor is in a ladder or a rope
				|| (control.world[this.x][this.y].isClimbable()
					|| control.world[this.x][this.y].isAscendable()));
	}

	/**Catch collectable items on the way*/
	catch(dx, dy) {
		if (this.insideBorders(dx, dy)
			&& control.world[this.x + dx][this.y + dy] instanceof CollectableActor) {
			if (this.collectGold()) {
				control.world[this.x + dx][this.y + dy].collect();
			}
		}
	}

	/** Performers a fall*/
	fall(left) {
		//if it passes a gold on the fall it will catch it
		this.catch(0, 1);

		this.hide();
		this.y += 1;
		this.show();

		if (!this.mayFall()) { //stop the fall
			this.changeImage(6, left);
			this.show();
		}
	}

	/** Computes the image to show in the movement of the active actors
	 * pos is the position in the vector of IMAGES_NAMES constant, 
	 * indicating the type of movement to perform
	 * Direction is the direction of the movement
	 */
	changeImage(pos, isLeftDirection) {
		let direction = isLeftDirection ? 0 : 1;

		if (control.world[this.x][this.y].isAscendable()) {
			this.imageName = this.name + IMAGES_NAMES[2 + direction];

		} else if (control.world[this.x][this.y].isClimbable()) {
			this.imageName = this.name + IMAGES_NAMES[4 + direction];

		} else {
			this.imageName = this.name + IMAGES_NAMES[pos + direction];
		}
		this.draw(this.x, this.y)
	}

	/**Makes a active actor move from a hole open the a shot */
	jumpBrick() {

		if (control.world[this.x][this.y - 1].isFree() // new position is free
			//no active actor on top 
			&& control.worldActive[this.x][this.y - 1] instanceof Empty
			//trapped inside a hole made by a shoot
			&& control.world[this.x][this.y] instanceof PassiveActorShootable) {

			this.y -= 1; //go up
			control.worldActive[this.x][this.y + 1] = empty;
			this.show();

		} else if (!control.world[this.x][this.y - 1].isFree()) {
			//if trapped between bricks then it will die
			this.die();
		} else { //if active ator on top it will wait to come up
			control.world[this.x][this.y].timeToRestore = 5;
		}
	}

	/**Returns false if the actor is currently falling */
	animation() {
		let direction = this.imageName.includes('left');
		if (this.mayFall()) {
			this.hide();
			this.changeImage(0, direction);
			this.show();
			this.fall(direction);
			return false;
		}
		return true;
	}

	/**Kill the active actor */
	die() {
		this.hide();
	}
}

class CollectableActor extends PassiveActor {
	constructor(x, y, imageName) {
		super(x, y, imageName);
		this.free = true;
	}

	/**Collects the collectable actor */
	collect() {
		this.hide();
	}
}

class EvilActiveActor extends ActiveActor {
	constructor(x, y, imageName) {
		super(x, y, imageName);
		this.evil = true;
		this.free = true; //the hero and the robot have to colide
		this.hX = 0;
		this.hY = 0;
		this.movCounter = 0;

	}
	/**Kills the bad guy (only when trapped with bricks on top) */
	die() {
		super.hide();
		gameInfo.bonusScore(BONUS_SCORE_KILL_ROBOT);
	}

	/**Informes the bad guy of the coordinates of the hero */
	findHero() {
		this.hX = hero.x;
		this.hY = hero.y;
	}

	/**Collects gold, returns true if the gold was collected */
	collectGold() {
		if (this.goldCollected < 1) { // can only collect one gold
			super.collectGold();
			return true;
		}
		return false;

	}
	/**Evaluates if the bad guy can move
	 * It can't move to the same position that other bad guy
	 */
	canMove(dx, dy) {
		return super.canMove(dx, dy)
			&& !(control.worldActive[this.x + dx][this.y + dy].isEnemy());

	}

	/**Checks if the bad guy is trapped in a hole open by the hero
	 * If it is then will drop the gold on top of the trap
	 */
	isTrapped() {
		let found = false;
		for (let i = 0; i < gameInfo.traps.length && !found; i++) {
			if (gameInfo.traps[i][0] == this.x
				&& gameInfo.traps[i][1] == this.y) {
				found = true;

				if (this.goldCollected > 0) {
					this.goldCollected--;
					GameFactory.actorFromCode('o', this.x, this.y - 1);

				}
			}
		}
		return found;
	}

	/**Operation to drop the gold, the gold will be dropped
	 *  after five movements of the robot
	 * If the gold can't be dropped in that moment it will try again
	*/
	dropGold(dx) {
		if (this.goldCollected > 0 // has to have gold
			&& (this.y + 1 === WORLD_HEIGHT ||//the gold has to be drop on floor
				control.world[this.x][this.y + 1].walkableType === FLOOR)
			//the gold can't be dropped in a ladder or a rope
			&& !(control.world[this.x - dx][this.y].isAscendable() ||
				control.world[this.x - dx][this.y].isClimbable())) {
			this.goldCollected = 0;
			GameFactory.actorFromCode('o', this.x - dx, this.y);
		}

	}

	/**Movement of t he bad guy, the robots will drop the 
	 * gold after 5 movements, if possible */
	move(dx, dy) {
		super.move(dx, dy);
		if (this.movCounter > DROP_GOLD) {
			this.dropGold(dx);
			this.movCounter = 0;
		}
		if (this.goldCollected > 0)
			this.movCounter++;
	}

	/**Animation of the robot */
	animation() {

		if (!this.isTrapped()) { //if the actor isn't in a trap
			if (super.animation()) { // if the actor is not falling
				this.findHero();
				if (this.hY < this.y && this.canMove(0, -1))
					this.move(0, -1);
				else if (this.hY > this.y && this.canMove(0, 1))
					this.move(0, 1);
				else if (this.hX < this.x && this.canMove(-1, 0))
					this.move(-1, 0);
				else if (this.canMove(1, 0))
					this.move(1, 0);
			}
		} else {
			gameInfo.bonusScore(BONUS_SCORE_TRAPPED_ROBOT);
		}
	}
}

class Brick extends PassiveActorShootable {
	constructor(x, y) {
		super(x, y, "brick");
		this.walkableType = FLOOR;
		this.destructible = true;
	}
}

class Chimney extends PassiveActor {
	constructor(x, y) {
		super(x, y, "chimney");
		this.free = true;
	}
}

class Empty extends PassiveActor {
	constructor() {
		super(-1, -1, "empty");
		this.free = true;
	}
	show() { }
	hide() { }
}

class Gold extends CollectableActor {
	constructor(x, y) {
		super(x, y, "gold");

	}
}

class Invalid extends PassiveActor {
	constructor(x, y) { super(x, y, "invalid"); }
}


class Ladder extends PassiveActor {
	constructor(x, y) {
		super(x, y, "empty");
		this.free = true;
		/**When the ladder is not visible it isn't walkable or ascendable */
		this.walkableType = VOID;
	}

	/**Makes the escape ladder visible and ascendable */
	makeVisible() {
		this.walkableType = ASCENDABLE;
		this.imageName = "ladder";
		this.show();
	}

}

class Rope extends PassiveActor {
	constructor(x, y) {
		super(x, y, "rope");
		this.free = true;
		this.walkableType = CLIMBABLE;
	}
}

class Stone extends PassiveActor {
	constructor(x, y) {
		super(x, y, "stone");
		this.walkableType = FLOOR;
	}
}

class Hero extends ActiveActor {
	constructor(x, y) {
		super(x, y, "hero_runs_left");
		this.name = 'hero';
	}

	/**Checks if the hero collected all the gold */
	isAllGoldCollected() {
		return this.goldCollected >= gameInfo.totalLevelGold;
	}

	/**Collects the gold on the way
	 * If all gold is collected then shows the escape ladder
	 */
	collectGold() {
		super.collectGold();
		this.show();
		gameInfo.bonusScore(BONUS_SCORE_GOLD);
		if (this.isAllGoldCollected()) {
			gameInfo.showEscapeLadder();
		}
		return true;
	}

	/**Animation of the hero. */
	animation() {
		super.animation();

		var k = control.getKey();
		if (k == ' ') {
			let direction = this.imageName.includes('left') ? -1 : 1
			this.shot(direction); return;
		}

		if (k == null) return;
		let [dx, dy] = k;

		if (this.isAllGoldCollected() && this.y + dy < 0
			&& control.world[this.x][this.y].isAscendable()) { //level up
			this.win();
		} else {
			this.move(dx, dy);
		}
	}

	/** Computes the level up */
	win() {
		gameInfo.levelUp();
	}

	/**Computes the dead of the hero */
	die() {
		this.hide();
		gameInfo.die();
	}

	/**Performs the hero's shot and the recoil of the gun*/
	shot(direction) {
		if (control.world[this.x][this.y].isFree()
			&& this.y + 1 != WORLD_HEIGHT
			&& control.world[this.x][this.y + 1].isWalkable()) {

			this.changeImage(8, (direction === -1)); //shot position

			if (this.insideBorders(0, 1)
				&& (this.x - 1 <= 0
					|| !control.world[this.x - 1][this.y].isFree())
				&& (this.x + 1 >= WORLD_WIDTH - 1
					|| !control.world[this.x + 1][this.y].isFree())
				&& control.world[this.x][this.y + 1].isDestructible()) {
				/**the hero is trapped between bricks or a brick and a border
				 * in this situation the hero may shot down
				 *  this condition is necessary to pass some levels 
				 * like level 9*/
				control.world[this.x][this.y + 1].getShot(); //shot

			} else if (this.insideBorders(direction, 1)
				&& control.world[this.x + direction][this.y + 1].isDestructible()) {
				//shot brick
				control.world[this.x + direction][this.y + 1].getShot();
			}

			if (this.insideBorders(-direction, 0) //gun's recoil
				&& control.world[this.x - direction][this.y].isFree()
				&& (control.world[this.x - direction][this.y + 1].isWalkable()
					|| control.worldActive[this.x - direction][this.y + 1].isWalkable())) {
				
				this.evalCollision(-direction, 0);
				this.catch(-direction, 0);
				this.hide();
				this.x -= direction;
				this.show();
			}

			this.changeImage(8, (direction === -1));
		}
	}
}


class Robot extends EvilActiveActor {
	constructor(x, y) {
		super(x, y, "robot_runs_right");
		this.name = 'robot';

	}
	/**Animation of the robots */
	animation() {
		if (control.time % SPEED_ROBOTS === 0) {
			super.animation();
		}
	}
}

// GAME CONTROL
/**Class to record informations about the game, like scores, lives, 
 * the current level, the gold to be collected in the level
 */
class GameInfo {
	constructor() {
		this.lives = START_LIVES;
		this.score = 0;
		this.maxScore = 0;
		this.currentLevel = START_LEVEL;
		this.traps = new Array();
		this.totalLevelGold = 0;
		this.escapeLadder = new Array();
		if (this.totalLevelGold === 0) {
			this.showEscapeLadder();
		}
	}

	/**Decreases the lives of the gamer */
	loseLife() {
		this.lives--;
	}

	/**Increases the lives of the gamer */
	bonusLife() {
		this.lives++;
	}

	/**Computes the new score after level up
	 * and updates the maximum score if necessary
	 */
	computeScore() {
		this.score += Math.floor(LEVEL_UP_BONUS * this.currentLevel / hero.time);
		showInfo();
		this.updateMaxScore();
	}

	/**Gives the gamer some bonus score in some events */
	bonusScore(bonus) {
		this.score += Math.floor(bonus * this.currentLevel / 2);
		showInfo();
		this.updateMaxScore();

	}

	/** Updates the maximum score recorded */
	updateMaxScore() {
		if (this.score > this.maxScore) {
			this.maxScore = this.score;
		}
	}

	/**Shows the escape ladder */
	showEscapeLadder() {
		for (let i = 0; i < this.escapeLadder.length; i++) {
			let x = this.escapeLadder[i][0];
			let y = this.escapeLadder[i][1];
			control.world[x][y].makeVisible();
		}
	}

	/**Computes the dead of the hero. 
	 * If the gamer has lives left the current level will be reset
	 * otherwise it will return to level 1 in the initial conditions
	 */
	die() {
		this.loseLife();
		if (this.lives > 0) {
			let msg = DIED + this.currentLevel + "\n Lives remaining: " + this.lives;
			this.score -= Math.floor(hero.goldCollected * 200 * this.currentLevel / 2 
							+ (DEAD_PENALTY * this.currentLevel));
			if (this.score < 0) {
				this.score = 0;
			}
			setTimeout(mesg, 0, msg);
			setTimeout(reset, 100, this.currentLevel);
		} else {
			setTimeout(mesg, 0, END_LIVES);
			control.time = 0;
			this.score = 0;
			this.lives = START_LIVES;
			setTimeout(reset, 100, 1);
		}
		showInfo();
	}

	/**Computes the level up
	 * If all level are completed the will display a victory message
	 */
	levelUp() {
		let level = this.currentLevel + 1;
		if (level <= MAPS.length) {
			setTimeout(mesg, 0, LEVEL_UP + level);
			setTimeout(reset, 5, level);
			this.bonusLife();
			this.computeScore();
		} else {
			endGame();
		}
	}
}

class GameControl {
	constructor() {
		control = this;
		this.key = 0;
		this.time = 0;
		gameInfo = new GameInfo();
		this.ctx = document.getElementById("canvas1").getContext("2d");
		empty = new Empty();	// only one empty actor needed
		this.world = this.createMatrix();
		this.worldActive = this.createMatrix();
		this.loadLevel(gameInfo.currentLevel);
		this.setupEvents();
		showInfo();

	}

	/**Clears the canvas of the game */
	clear() {
		this.ctx.canvas.width = this.ctx.canvas.width; //clear canvas
		this.world = this.createMatrix();
		this.worldActive = this.createMatrix();

	}
	createMatrix() { // stored by columns
		let matrix = new Array(WORLD_WIDTH);
		for (let x = 0; x < WORLD_WIDTH; x++) {
			let a = new Array(WORLD_HEIGHT);
			for (let y = 0; y < WORLD_HEIGHT; y++)
				a[y] = empty;
			matrix[x] = a;
		}
		return matrix;
	}
	loadLevel(level) {
		if (level < 1 || level > MAPS.length)
			fatalError("Invalid level " + level)

		let map = MAPS[level - 1];  // -1 because levels start at 1
		for (let x = 0; x < WORLD_WIDTH; x++)
			for (let y = 0; y < WORLD_HEIGHT; y++) {
				// x/y reversed because map stored by lines
				GameFactory.actorFromCode(map[y][x], x, y);
				if (map[y][x] === 'o') {
					gameInfo.totalLevelGold++;
				}
				if (map[y][x] === 'E') {
					gameInfo.escapeLadder.push([x, y]);
				}

			}

	}
	getKey() {//!NÃO MEXER
		let k = control.key;
		control.key = 0;
		switch (k) {
			case 37: case 79: case 74: return [-1, 0]; //  LEFT, O, J
			case 38: case 81: case 73: return [0, -1]; //    UP, Q, I
			case 39: case 80: case 76: return [1, 0];  // RIGHT, P, L
			case 40: case 65: case 75: return [0, 1];  //  DOWN, A, K
			case 0: return null;
			default: return String.fromCharCode(k);
			// http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
		};
	}
	setupEvents() {
		addEventListener("keydown", this.keyDownEvent, false);
		addEventListener("keyup", this.keyUpEvent, false);
		animation = setInterval(this.animationEvent, 1000 / ANIMATION_EVENTS_PER_SECOND);
	}
	animationEvent() {
		if (rooling === true){
			control.time++;

			for (let x = 0; x < WORLD_WIDTH; x++) {
				for (let y = 0; y < WORLD_HEIGHT; y++) {
					let a = control.worldActive[x][y];
					let b = control.world[x][y];
					b.animation();
					if (a.time < control.time) {
						a.time = control.time;
						a.animation();
					}
				}
			}
		}
	}
	keyDownEvent(k) {
		control.key = k.keyCode;
	}
	keyUpEvent(k) {
	}
}


function reset(level) {
	control.key = 0;
	gameInfo.currentLevel = level;
	gameInfo.totalLevelGold = 0;
	gameInfo.escapeLadder = new Array();
	gameInfo.traps = new Array();
	control.clear();
	control.loadLevel(level);
	showInfo();
}

// HTML FORM

function endGame() {

	let element = document.getElementById("level");
	let msg = FINISH_GAME + "\n Maximum Score: " + gameInfo.maxScore;
	element.innerHTML = msg;
	clearInterval(animation);

}

function showInfo() {
	let element = document.getElementById("info");
	let element2 = document.getElementById("level");
	element.innerHTML = "Score: " + gameInfo.score +
		"     Lives: " + gameInfo.lives +
		"     Gold: " + hero.goldCollected + " from " + gameInfo.totalLevelGold;
	element2.innerHTML = "Level: " + gameInfo.currentLevel;

}

function onLoad() {
	rooling = true;
	// Asynchronously load the images an then run the game
	GameImages.loadAll(function () { new GameControl(); });
}

function b1() {
	let level = gameInfo.currentLevel;
	gameInfo.lives--;
	reset(level);
	mesg(RESTART_LEVEL + level)
}

function b2() {
	let time = "Time: " + control.time + ".\n";
	let lives = "Lives remaining: " + gameInfo.lives + ".\n";
	let score = "Total Score: " + gameInfo.score + ".\n";
	let level = "Level: " + gameInfo.currentLevel + ".\n";
	let gold = "Gold Collected: " + hero.goldCollected + " from "
		+ gameInfo.totalLevelGold + " golds.\n"
	let maxScore = "Maximum Score: " + gameInfo.maxScore;
	let msg = time + level + gold + lives + score + maxScore;
	mesg(msg)
}

function b3() {
	clearInterval(animation);
	control.clear();
	onload();
}


function endGameEarlier() {

	let element = document.getElementById("level");
	let msg = "You didn't actually try did you?" + "\n Maximum Score: " + gameInfo.maxScore;
	element.innerHTML = msg;
	clearInterval(animation);

}

function timeSupreme(){
	if(rooling){
		rooling = false;
	} else {
		rooling = true;
	}
}

