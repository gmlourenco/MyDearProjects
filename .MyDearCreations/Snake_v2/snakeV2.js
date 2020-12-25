
/**
 * Projeto 2 CGI _ Carrinha
 * Gonçalo Loureço nº55780
 * Joana Faria nº55754
 */

var canvas;
var gl;
var program;

var aspect;

var mProjectionLoc, mModelViewLoc, colorLoc, fixedColorLoc;

var matrixStack = [];
var mView;
var fixedColor;


let snake;
let size;
let fruit;
let speed;



const SNAKE = 'snake';
const INITIAL_SIZE = 5;
const HEAD_SIZE = 2;
const SNAKE_BODY_X = 1;
const SNAKE_BODY_Y = SNAKE_BODY_X * 2 / 3;
const SNAKE_BODY_Z = 1;


const FRUIT = 'fruit';
const FRUIT_X = 1;
const FRUIT_Y = 1;
const FRUIT_Z = 1;

const FLOOR = 'floor';
const FLOOR_SIZE = 1;


const WIDTH_PERCENTAGE = 1;
const HEIGHT_PERCENTAGE = 0.8;
//TODO
const TOP_VIEW = 1;
const SIDE_VIEW = 2;
const FRONT_VIEW = 3;
const OUR_VIEW = 0;
const GAMING = 5;


const VP_DISTANCE = 50;
//World limits
const WORLD_X = Math.floor(VP_DISTANCE);
const WORLD_Z = Math.floor(VP_DISTANCE);


// Stack related operations
function pushMatrix() {
    var m = mat4(mView[0], mView[1],
        mView[2], mView[3]);
    matrixStack.push(m);
}
function popMatrix() {
    mView = matrixStack.pop();
}
// Append transformations to modelView
function multMatrix(m) {
    mView = mult(mView, m);
}
function multTranslation(t) {
    mView = mult(mView, translate(t));
}
function multScale(s) {
    mView = mult(mView, scalem(s));
}
function multRotationX(angle) {
    mView = mult(mView, rotateX(angle));
}
function multRotationY(angle) {
    mView = mult(mView, rotateY(angle));
}
function multRotationZ(angle) {
    mView = mult(mView, rotateZ(angle));
}

function fit_canvas_to_window() {
    canvas.width = window.innerWidth*WIDTH_PERCENTAGE;
    canvas.height = window.innerHeight*HEIGHT_PERCENTAGE;

    aspect = canvas.width / canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);

}

window.onresize = function () {
    fit_canvas_to_window();
}

window.onload = function () {
    canvas = document.getElementById('gl-canvas');

    //initialize variables to default values
    fixedColor = true;
    view = GAMING;

    snake = [];
    size = INITIAL_SIZE;
    newSnake();
    fruit = [];
    newFruit();
    speed = [0.0, 0.0, 0.0];



    gl = WebGLUtils.setupWebGL(document.getElementById('gl-canvas'));
    fit_canvas_to_window();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, 'snakeV2-vertex', 'snakeV2-fragment');

    gl.useProgram(program);

    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");
    colorLoc = gl.getUniformLocation(program, "color");
    fixedColorLoc = gl.getUniformLocation(program, "fixedColor");


    sphereInit(gl);
    cubeInit(gl);
    cylinderInit(gl);
    torusInit(gl);

    document.onkeydown = function (event) {
        var command = (event.key).toLowerCase();
        switch (command) {
            case 'f': fixedColor = !fixedColor; break;
            case ' ': speed = [0.0, 0.0, 0.0]; break;
            case 'w': speed = [0.0, 0.0, 1.0]; break;
            case 's': speed = [0.0, 0.0, -1.0]; break;
            case 'a': speed = [1.0, 0.0, 0.0]; break;
            case 'd': speed = [-1.0, 0.0, 0.0]; break;
            case '1': view = TOP_VIEW; break;
            case '2': view = SIDE_VIEW; break;
            case '3': view = FRONT_VIEW; break;
            case '4': case '0': view = OUR_VIEW; break;
            case '5': view = GAMING; break;
            case 'b': slowDown(); break;
        }
    }

    render();
}

function newSnake(){
    for(let i = 0; i < size; i++)
        snake.push([0.0,0.0,0.0]);
}
function newFruit(){
    let x = Math.floor(Math.random() * 2 * WORLD_X - WORLD_X);
    let z = Math.floor(Math.random() * 2 * WORLD_Z - WORLD_Z);
    fruit.pop();
    fruit.push([x, 0.0, z]);
}
function slowDown(){
    speed *= 0.5;
}

function computeView() {
    var projection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE * 2, -VP_DISTANCE * aspect, VP_DISTANCE * aspect);

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    if (view == OUR_VIEW) {
        mView = lookAt([VP_DISTANCE/2, VP_DISTANCE/6, -VP_DISTANCE/2], [0, -VP_DISTANCE, 0], [0, 1, 0]);
    } else if (view == TOP_VIEW) {
        mView = lookAt([0, VP_DISTANCE, 0], [0, 0, 0], [0, 0, -1]);
    } else if (view == SIDE_VIEW) {
        mView = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
    } else if (view == FRONT_VIEW) {
        mView = lookAt([VP_DISTANCE, 0, 0], [0, 0, 0], [0, 1, 0]);
    } else if (view == GAMING){
        mView = lookAt([0, VP_DISTANCE/6, -VP_DISTANCE], [0, -VP_DISTANCE, 0], [0, 1, 0]);
    }
}

function render() {
    requestAnimationFrame(render);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    moveSnake();

    //let control;
    //setInterval(control, 100);

    computeView();
    drawScene();
    
}

//TODO be careful if those are x is turned to the front.
function moveSnake(){
    if(speed[0]!=0 || speed[2] != 0){
        let aux = vec3(snake[0]);
        aux[0] += speed[0] * SNAKE_BODY_X;
        if(aux[0] < -WORLD_X)
            aux[0] += 2 * WORLD_X;
        else if(aux[0]>WORLD_X)
            aux[0] -= 2* WORLD_X;
        
        aux[2] += speed[2] * SNAKE_BODY_X;
        if (aux[2] < -WORLD_Z)
            aux[2] += 2 * WORLD_Z;
        else if (aux[2] > WORLD_Z)
            aux[2] -= 2 * WORLD_Z;


        for(let i = size-1; i > 0; i--){
            if(snake[i]!=snake[i-1])
                snake[i] = vec3(snake[i-1]);
        }
        snake[0] = vec3(aux);
        if(eatable())
            eat();
    }
}

function eat(){
    newFruit();
    size++;
    show('eaten', size-5);
}

function show(id, toShow) {
    let out = document.getElementById(id);
    out.innerHTML = toShow;
}

function eatable(){
    /*console.log(snake[0][0]);
    console.log(fruit[0][0]);
    console.log(Math.abs(snake[0][0] - fruit[0][0]));
    console.log(HEAD_SIZE + FRUIT_X);
    console.log((Math.abs(snake[0][0] - fruit[0][0]) < (HEAD_SIZE + FRUIT_X)) && (Math.abs(snake[0][2] - fruit[0][2]) < (HEAD_SIZE + FRUIT_Z)));
    */
    return (Math.abs(snake[0][0] - fruit[0][0]) < (HEAD_SIZE + FRUIT_X)/2) && (Math.abs(snake[0][2] - fruit[0][2]) < (HEAD_SIZE + FRUIT_Z)/2);
}



function computeColor(part) {
    var color;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    if (fixedColor) {
        switch (part) {
            case SNAKE: color = vec4(0.0, 1.0, 0.0, 1.0); break;
            case FRUIT: color = vec4(1.0, 0.0, 0.0, 1.0); break;
            case FLOOR: color = vec4(1.0, 1.0, 1.0, 1.0); break;
            default: color = vec4(1.0, 1.0, 1.0, 1.0); break;
        }

        gl.uniform1i(fixedColorLoc, 1);
        gl.uniform4fv(colorLoc, color);
    } else {
        gl.uniform1i(fixedColorLoc, -1);
    }

}
function drawScene() {
    pushMatrix();
            //multTranslation([-VP_DISTANCE * aspect + BACKTRUCK_X, -VP_DISTANCE + FLOOR_SIZE, -zPos]);
        pushMatrix();
            floor();
        popMatrix();
        pushMatrix();
        //WorldObjects
            multTranslation([0.0, SNAKE_BODY_Y/2, 0.0]);
            //fruits
            drawFruits();
            //snake
            drawSnake();
        popMatrix();
    popMatrix();   
}



//FLOOR
function floor() {
    computeColor(FLOOR);
    multTranslation([0,-FLOOR_SIZE/2,0]);
    for (let i = -WORLD_X; i < WORLD_X; i += FLOOR_SIZE){
        for (let j = -WORLD_Z + 2*FLOOR_SIZE; j <= WORLD_Z; j+= FLOOR_SIZE){
            pushMatrix();
                multTranslation([i,0,j]);
                multScale([FLOOR_SIZE,FLOOR_SIZE,FLOOR_SIZE]);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
                cubeDraw(gl, program, false);
            popMatrix();
        }
    }
}

//FRUITS
function drawFruits(){
    pushMatrix();
        computeColor(FRUIT);
        multTranslation(fruit[0]);
        multScale([FRUIT_X, FRUIT_Y, FRUIT_Z]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
        cubeDraw(gl, program, true);
    popMatrix();
}


//SNAKE
function drawSnake(){
    computeColor(SNAKE);
    snakeHead();
    snakeBody();
}
function snakeHead(){
    pushMatrix();
        multTranslation(snake[0]);
        multScale([HEAD_SIZE, SNAKE_BODY_Y *3/2, HEAD_SIZE]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
        sphereDraw(gl, program, true);
    popMatrix();
}
function snakeBody(){
    for (let i = 1; i < size; i++) {
        pushMatrix();
            multTranslation(snake[i]);
            multScale([SNAKE_BODY_X, SNAKE_BODY_Y, SNAKE_BODY_Z]);
            gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
            cubeDraw(gl, program, true);
        popMatrix();
    }
}

