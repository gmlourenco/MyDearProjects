let snake;
let size;
let fruits;
let speed;

let vertices;

let gl;
let canvas;
let program;
let bufferId;
let color, colorLoc;

let time;

const NUMCOLS = 100;
const NUMROWS = 100;
const INITIAL_SIZE = 1;
const SNAKE = 'snake';
const FRUIT = 'fruit';
const HEIGHT = 2 / NUMROWS;
const WIDTH = 2 / NUMCOLS;
const SPEED_CONVERSOR = 1/20;



window.onload = function init() {

    this.snake = [vec2(0.0, 0.0)];
    this.size = INITIAL_SIZE;
    newSnake();
    this.fruits = [];
    newFruit();

    this.speed = [0, 0];
    this.time = 0;

    this.canvas = document.getElementById('snake-canvas');
    this.gl = WebGLUtils.setupWebGL(this.canvas);
    if (!this.gl) { alert("WebGL isn't available"); }

    // Configure WebGL
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Load shaders and initialize attribute buffers
    this.program = initShaders(this.gl, "vertex-shader", "fragment-shader");
    this.gl.useProgram(this.program);

    this.colorLoc = this.gl.getUniformLocation(this.program, "color");
    this.fixedColorLoc = this.gl.getUniformLocation(this.program, "fixedColor");


    document.onkeydown = function (event) {
        var command = (event.key).toLowerCase();
        switch (command) {
            case 'w': this.speed = [0.0, 1.0]; 
                        console.log(this.speed); 
                        break;
            case 's': this.speed = [0.0, -1.0]; 
                        console.log(this.speed);
                        break;
            case 'a': this.speed = [-1.0, 0.0]; 
                        console.log(this.speed);
                        break;
            case 'd': this.speed = [1.0, 0.0]; 
                        console.log(this.speed);
                        break;

        }
    }

    // Load the data into the GPU
    this.bufferId = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferId);
    //this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(vertices), this.gl.STATIC_DRAW);



    // Associate our shader variables with our data buffer
    var vPosition = this.gl.getAttribLocation(this.program, "vPosition");
    this.gl.vertexAttribPointer(vPosition, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(vPosition);
    render();
}

function computeVertex(x, y, pos) {
    this.vertices[pos++] = vec2(x, y);
    this.vertices[pos++] = vec2(x + WIDTH, y);
    this.vertices[pos++] = vec2(x, y - HEIGHT);
    this.vertices[pos++] = vec2(x + WIDTH, y - HEIGHT);

}


function computeColor(part) {
    switch (part) {
        case SNAKE: this.color = vec4(0.0, 1.0, 0.0, 1.0); break;
        case FRUIT: this.color = vec4(1.0, 0.0, 0.0, 1.0); break;
        default: this.color = vec4(1.0, 1.0, 1.0, 1.0); break;
    }

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.uniform4fv(this.colorLoc, this.color);
}

function newSnake() {
    for (let i = 0; i < this.size; i++) {
        this.snake[i] = vec2(0.0, 0.0);
    }
}


function newFruit() {
    let x = Math.random() * 1.9 - 1;
    let y = Math.random() * 1.9 - 1;
    fruits = [vec2(x, y)];
}

function move() {
    let aux = this.snake[this.size - 1];
    console.log(this.speed);
    aux[0] += this.speed[0] * WIDTH * SPEED_CONVERSOR;
    aux[1] += this.speed[1] * HEIGHT * SPEED_CONVERSOR;

    for (let i = 0; i < this.size - 1; i++)
        this.snake[i] = this.snake[i + 1];

    this.snake[this.size - 1] = aux;

}

function eat() {
    size += 1;
}

function render() {
    requestAnimationFrame(render);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    move();

    drawScene();


}

function drawScene(){


    this.vertices = [];
    computeVertex(fruits[0][0], fruits[0][1], 0);
    for (let i = 0; i < this.size; i++) {
        computeVertex(this.snake[i][0], this.snake[i][1], (i + 1) * 4);
    }

    this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(this.vertices), this.gl.STATIC_DRAW);

    computeColor(FRUIT);
    this.gl.drawArrays(this.gl.LINE_LOOP, 0, 4);
    computeColor(SNAKE);
    for (let i = 0; i < this.size; i++)
        this.gl.drawArrays(this.gl.LINE_LOOP, (i + 1) * 4, 4);

}


