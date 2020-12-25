let snake;
let size;
let fruits;
let speed;
let blockSpeed;

let vertices;

let gl;
let canvas;
let program;
let bufferId;
let color, colorLoc;

let time;

let eaten;


const NUMCOLS = 100;
const NUMROWS = 100;
const INITIAL_SIZE = 5;
const SNAKE = 'snake';
const FRUIT = 'fruit';
const HEIGHT = 2 / NUMROWS;
const WIDTH = 2 / NUMCOLS;
const SPEED_CONVERSOR = 1/2;




window.onload = function init() {

    snake = [];
    size = INITIAL_SIZE;
    newSnake();
    fruits = [];
    newFruit();
    eaten=0;

    speed = [0.0, 0.0];
    blockSpeed = false;
    time = 0;

    canvas = document.getElementById('snake-canvas');
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorLoc = gl.getUniformLocation(program, "color");
    fixedColorLoc = gl.getUniformLocation(program, "fixedColor");


    document.onkeydown = function (event) {
        var command = (event.key).toLowerCase();
        switch (command) {
            case ' ': speed = [0.0, 0.0];
                break;
            case 'w': if (!blockSpeed) speed = [0.0, 1.0];
                //console.log(speed);
                break;
            case 's': if (!blockSpeed) speed = [0.0, -1.0];
                //console.log(speed);
                break;
            case 'a': if (!blockSpeed) speed = [-1.0, 0.0];
                //console.log(speed);
                break;
            case 'd': if (!blockSpeed) speed = [1.0, 0.0];
                //console.log(speed);
                break;

        }
    }

    // Load the data into the GPU
    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    //gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);



    // Associate our shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    render();
}

function computeVertex(x, y, pos) {
    vertices[pos++] = vec2(x, y);
    vertices[pos++] = vec2(x + WIDTH, y);
    vertices[pos++] = vec2(x, y - HEIGHT);
    vertices[pos++] = vec2(x + WIDTH, y - HEIGHT);

}


function computeColor(part) {
    switch (part) {
        case SNAKE: color = vec4(0.0, 1.0, 0.0, 1.0); break;
        case FRUIT: color = vec4(1.0, 0.0, 0.0, 1.0); break;
        default: color = vec4(1.0, 1.0, 1.0, 1.0); break;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.uniform4fv(colorLoc, color);
}

function newSnake() {
    for (let i = 0; i < size; i++) {
        snake[i] = vec2(0.0, 0.0);
    }
}


function newFruit() {
    let x = Math.random() * 1.9 - 1;
    let y = Math.random() * 1.9 - 1;
    fruits = [vec2(x, y)];
}

function moveDir(x1, y1, x2, y2) {
    let x = 0;
    let y = 0;
    if (x1 > x2)
        x=-1;
    if (x1 < x2)
        x=1.0;
    if (y1 > y2)
        y = -1.0;
    if (y1 < y2)
        y = 1.0;
    return vec2(x, y);
}

function move() {
    let aux = vec2(snake[size - 1]);
    aux[0] += speed[0] * WIDTH * SPEED_CONVERSOR;
    aux[1] += speed[1] * HEIGHT * SPEED_CONVERSOR;


    if (colide(aux[0], aux[1], fruits[0][0], fruits[0][1])) {
        eat();
    } else {
        if (size > 1) {
            if (!colide(snake[size - 1][0], snake[size - 1][1], snake[size - 2][0], snake[size - 2][1])) {
                for (let i = 0; i < size - 1; i++) {
                    if (!colide(snake[i][0], snake[i][1], snake[i+1][0], snake[i+1][1])) {
                        let innerSpeed = moveDir(snake[i][0], snake[i][1], snake[i + 1][0], snake[i + 1][1]);
                        snake[i][0] += innerSpeed[0] * WIDTH * SPEED_CONVERSOR;
                        snake[i][1] += innerSpeed[1] * HEIGHT * SPEED_CONVERSOR;
                    }
                }
                if (blockSpeed == true)
                    blockSpeed = false;
            } else {
                if (speed[0] > 0 || speed[0] < 0 || speed[1] > 0 || speed[1] < 0){
                    blockSpeed = true;
                }
            }
        }
    }

    snake[size - 1] = aux;

    if (colide(aux[0], aux[1], fruits[0][0], fruits[0][1])) {
        console.log(true);
        eat();
    }
}


function colide(x1, y1, x2, y2) {
    /*aux[0] <= fruits[0][0] + WIDTH && aux[0]+WIDTH >= fruits[0][0]
        && aux[1] >= fruits[0][1]-HEIGHT && aux[1]-HEIGHT <= fruits[0][1]*/
    return x1 <= x2 + WIDTH && x1 + WIDTH >= x2 && y1 >= y2 - HEIGHT && y1 - HEIGHT <= y2;

}

function eat() {
    newFruit();
    size += 1;
    show('eaten', ++eaten);
}

function show(id, toShow){
    let out = document.getElementById(id);
    out.innerHTML = toShow;
}

function render() {
    requestAnimationFrame(render);

    gl.clear(gl.COLOR_BUFFER_BIT);

    move();

    drawScene();


}

function drawScene() {

    vertices = [];
    computeVertex(fruits[0][0], fruits[0][1], 0);
    for (let i = 0; i < size; i++) {
        computeVertex(snake[i][0], snake[i][1], (i + 1) * 4);
    }

    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    computeColor(FRUIT);
    gl.drawArrays(gl.LINE_LOOP, 0, 4);
    computeColor(SNAKE);
    for (let i = 0; i < size; i++)
        gl.drawArrays(gl.LINE_LOOP, (i + 1) * 4, 4);

}


