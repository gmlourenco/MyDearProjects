
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
var time, view, wheelsAngle_Y, wheelsAngle_Z, antennaUpAngle, antennaSideAngle, speed, xPos, zPos, vanAngle; 
var fixedColor;

const DEGREE_TO_RADIAN = Math.PI / 180;
const RADIAN_TO_DEGREE = 180 / Math.PI;
const VP_DISTANCE = 1000;
//Van back FordTransit
const BACK_TRUCK = 1;
const BACKTRUCK_X = 330;
const BACKTRUCK_Y = 242;
const BACKTRUCK_Z = 206;
//cabine
const CABINE_TRUCK = 2;
const CABINETRUCK_X = 120;
const CABINETRUCK_Y = 170;
const CABINETRUCK_Z = 190;
//Support
const MAX_UP_ANGLE = 100;
const MIN_UP_ANGLE = -10;
const SUPPORT_ANTENNA = 3;
const SUPPORT_ANTENNA_X = 20;
const SUPPORT_ANTENNA_Y = 50;
const SUPPORT_ANTENNA_Z = 20;
//Wheels
const WHEEL = 4;
const WHEEL_DIAMETER = 80;
const WHEEL_WELL = 5;
const FBWHEEL_DISTANCE = (BACKTRUCK_X + WHEEL_DIAMETER)/2-BACKTRUCK_X / 3;
//Antena arm
const KNEECAP = 8;
const ARM_ANTENNA = 6;
const ARM_ANTENNA_SIZE = 110;
//Atenna
const ANTENNA = 7;
const ANTENNA_X = 100;
const ANTENNA_Y = 50;
const ANTENNA_Z = 100;
//Styling
const DOOR_THICKNESS=5;
const GLASS = 10;
const GLASS_THICKNESS=2;

const TOP_VIEW = 1;
const SIDE_VIEW = 2;
const FRONT_VIEW = 3;
const OUR_VIEW = 0;

const FLOOR = 9;
const FLOOR_SIZE = 200;


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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

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
    time = 0;
    view = 2;
    wheelsAngle_Y = 0;
    wheelsAngle_Z = 0;
    antennaSideAngle = antennaUpAngle = 0;
    drive = 0;
    speed = 0;
    xPos = 0;
    zPos = 0;
    vanAngle = 0;


    gl = WebGLUtils.setupWebGL(document.getElementById('gl-canvas'));
    fit_canvas_to_window();

    gl.clearColor(0.09, 0.508, 0.90, 1.0);

    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, 'default-vertex', 'default-fragment');

    gl.useProgram(program);

    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");
    colorLoc = gl.getUniformLocation(program, "color");
    fixedColorLoc = gl.getUniformLocation(program, "fixedColor");


    sphereInit(gl);
    cubeInit(gl);
    cylinderInit(gl);
    torusInit(gl);
    paraboloidInit(gl);
    document.onkeydown = function (event) {
        var command = (event.key).toLowerCase();
        switch (command) {
            case ' ': fixedColor = !fixedColor; break;
            case 's': speed -= 20; break;
            case 'w': speed += 20; break;
            case 'i': if(antennaUpAngle < MAX_UP_ANGLE) antennaUpAngle++; break;
            case 'k': if(antennaUpAngle> MIN_UP_ANGLE) antennaUpAngle--; break;
            case 'j': antennaSideAngle++; break;
            case 'l': antennaSideAngle--; break;
            case 'a': if (wheelsAngle_Y < 50) wheelsAngle_Y++; break;
            case 'd': if (wheelsAngle_Y > -50) wheelsAngle_Y--; break;
            case '1': view = TOP_VIEW; break;
            case '2': view = SIDE_VIEW; break;
            case '3': view = FRONT_VIEW; break;
            case '0': view = OUR_VIEW; break;
            case '4': view = OUR_VIEW; break;
            case 'b': slowDown(); break;
        }
    }

    render();
}
function slowDown(){
    if (speed > 2 || speed < -2) speed *= 0.85;
    else if (speed < -0.5 || speed > 0.5) speed *= 0.8;
    else speed = 0;
}

function computeView() {
    var projection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -3 * VP_DISTANCE, 3 * VP_DISTANCE);

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    if (view == OUR_VIEW) {
        mView = lookAt([VP_DISTANCE/1.5, VP_DISTANCE, VP_DISTANCE], [0, -VP_DISTANCE, 0], [0, 1, 0]);
    } else if (view == TOP_VIEW) {
        mView = lookAt([0, VP_DISTANCE, 0], [0, 0, 0], [0, 0, -1]);
    } else if (view == SIDE_VIEW) {
        mView = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
    } else if (view == FRONT_VIEW) {
        mView = lookAt([VP_DISTANCE, 0, 0], [0, 0, 0], [0, 1, 0]);
    }
}

function render() {
    requestAnimationFrame(render);
    time += 1 / 60;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    moveVan();

    computeView();
    drawScene();
    
}
function moveVan(){
    let distance = speed*1/60;
    
    wheelsAngle_Z -= 360 * distance / (Math.PI * WHEEL_DIAMETER);
    
    vanAngle += distance * 360 / (2 * Math.PI * ( FBWHEEL_DISTANCE / Math.cos((90-wheelsAngle_Y)*DEGREE_TO_RADIAN)));
    

    if((xPos < VP_DISTANCE*aspect*2-BACKTRUCK_X-CABINETRUCK_X*3 && 
            (distance) * Math.cos(vanAngle * DEGREE_TO_RADIAN)>0)||
        (xPos > 0 && 
            (distance) * Math.cos(vanAngle * DEGREE_TO_RADIAN)<0))
        xPos += (distance) * Math.cos(vanAngle * DEGREE_TO_RADIAN);
    else 
        speed = 0;
    
    if ((zPos < 3.0 * VP_DISTANCE &&
            (distance) * Math.cos(vanAngle * DEGREE_TO_RADIAN) < 0) ||
        (zPos > -3.0 * VP_DISTANCE && 
            (distance) * Math.cos(vanAngle * DEGREE_TO_RADIAN) > 0))
        zPos -= (distance) * Math.sin(vanAngle * DEGREE_TO_RADIAN);
    else
        speed = 0;
    

    if(wheelsAngle_Y < - 5 || wheelsAngle_Y > 5)
        wheelsAngle_Y *= 0.99;
    else if (wheelsAngle_Y < - 0.1 || wheelsAngle_Y > 0.1)
        wheelsAngle_Y*=0.9;
    else
        wheelsAngle_Y = 0;

}
function computeColor(part) {
    var color;
    if (fixedColor) {
        switch (part) {
            case BACK_TRUCK: color = vec4(1.0, 1.0, 1.0, 1.0); break;
            case CABINE_TRUCK: color = vec4(0.7, 0.7, 0.7, 1.0); break;
            case SUPPORT_ANTENNA: color = vec4(0.344, 0.0800, 0.800, 1.0); break;
            case WHEEL: color = vec4(0.0, 0.0, 0.0, 1.0); break;
            case WHEEL_WELL: color = vec4(0.6, 0.6, 0.6, 1.0); break;
            case ANTENNA: color = vec4(0.8, 0.89, 0.11, 1.0); break;
            case ARM_ANTENNA: color = vec4(1, 0.5, 0.7, 1.0); break;
            case KNEECAP: color = vec4(0.123, 0.770, 0.166, 1.0); break;
            case FLOOR: color = vec4(0.507, 0.860, 0.719, 1.0); break;
            case GLASS: color = vec4(0.0, 0.0, 1.0, 1.0); break;
            default: color = vec4(1.0, 1.0, 1.0, 1.0); break;
        }

        gl.clearColor(0.09, 0.508, 0.90, 1.0);
        gl.uniform1i(fixedColorLoc, 1);
        gl.uniform4fv(colorLoc, color);
    } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.uniform1i(fixedColorLoc, -1);
    }

}
function drawScene() {
    pushMatrix();
        //if(view === TOP_VIEW || view ===SIDE_VIEW){
            multTranslation([-VP_DISTANCE * aspect + BACKTRUCK_X, -VP_DISTANCE + FLOOR_SIZE, -zPos]);
        //} else
        //    multTranslation([-VP_DISTANCE*aspect+BACKTRUCK_X,-VP_DISTANCE + FLOOR_SIZE,0]);
        pushMatrix();
            floor();
        popMatrix();
        pushMatrix();
        //Truck
            multTranslation([xPos, (BACKTRUCK_Y + WHEEL_DIAMETER*1.6) / 2, zPos]);
            multRotationY(vanAngle);

            pushMatrix();
            //BackTruck
                backTruck();
            popMatrix();
            pushMatrix();
            //FrontTruck
                frontTruck();
            popMatrix();
            pushMatrix();
            //Antenna Support
                antennaSupport();
            popMatrix();
            pushMatrix();
            //Antenna
                completeAntenna();
            popMatrix();
            pushMatrix();
            //Eixos
                pushMatrix();
                    multTranslation([-BACKTRUCK_X / 3, -BACKTRUCK_Y / 2, 0]);
                    wheelAxis();
                popMatrix();
                pushMatrix();
                    multTranslation([(BACKTRUCK_X + WHEEL_DIAMETER) / 2, -BACKTRUCK_Y / 2, 0]);
                    wheelAxis()
                popMatrix();
            popMatrix();
            //Rodas
            pushMatrix();
                drawWheels(wheelsAngle_Y);
            popMatrix();
            pushMatrix();
                //styling
                stylingElements()
            popMatrix();
        popMatrix();
    popMatrix();   
}

function completeAntenna() {
    multTranslation([0, BACKTRUCK_Y / 2 + SUPPORT_ANTENNA_Y, 0]);
    multRotationY(antennaSideAngle);
    multRotationZ(antennaUpAngle);
    pushMatrix();
        //Antenna ball
        antennaKneecap();
    popMatrix();
    pushMatrix();
        //Antenna arm
        antennaArm();
    popMatrix();
    pushMatrix();
        //Antenna Fore-arm
        antenaForeArm();
    popMatrix();
    pushMatrix();
        //Antenna
        satelliteDish();
    popMatrix();
}

function wheelAxis() {
    multRotationY(90);
    multRotationZ(90);
    multScale([WHEEL_DIAMETER / 5, BACKTRUCK_Z, WHEEL_DIAMETER / 5]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
    computeColor(WHEEL_WELL);
    cylinderDraw(gl, program, false);
}

function drawWheels(frontWheelsAngle) {
    //backWheels
    pushMatrix();
        multTranslation([-BACKTRUCK_X / 3, -BACKTRUCK_Y / 2, 0]);
        multRotationZ(wheelsAngle_Z);
        pushMatrix();
            multTranslation([0, 0, BACKTRUCK_Z / 2]);
            wheels();
            wheelWell();
        popMatrix();
        pushMatrix();
            multTranslation([0, 0, -BACKTRUCK_Z / 2]);
            wheels();
            wheelWell();
        popMatrix();
    popMatrix();
    //frontWheels
    pushMatrix();
        multTranslation([(BACKTRUCK_X + WHEEL_DIAMETER) / 2, -BACKTRUCK_Y / 2, 0]);
        pushMatrix();
            multTranslation([0, 0, BACKTRUCK_Z / 2]);
            multRotationY(frontWheelsAngle);
            multRotationZ(wheelsAngle_Z);
            wheels();
            wheelWell();
        popMatrix();
        pushMatrix();
            multTranslation([0, 0, -BACKTRUCK_Z / 2]);
            multRotationY(frontWheelsAngle);
            multRotationZ(wheelsAngle_Z);
            wheels();
            wheelWell();
        popMatrix();
    popMatrix();
    
}

function wheels() {
    pushMatrix();
        multRotationX(90);
        multScale([WHEEL_DIAMETER, WHEEL_DIAMETER, WHEEL_DIAMETER]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
        computeColor(WHEEL);
        torusDraw(gl, program, false);
    popMatrix();
}
function wheelWell() {
    pushMatrix();
        pushMatrix();
            multRotationZ(90);
            multScale([WHEEL_DIAMETER / 10, WHEEL_DIAMETER, WHEEL_DIAMETER / 10]);
            gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
            computeColor(WHEEL_WELL);
            cylinderDraw(gl, program, false);
        popMatrix();
        pushMatrix();
            multScale([WHEEL_DIAMETER / 10, WHEEL_DIAMETER, WHEEL_DIAMETER / 10]);
            gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
            computeColor(WHEEL_WELL);
            cylinderDraw(gl, program, false);
        popMatrix();
    popMatrix();
}

function floor() {
    computeColor(FLOOR);
    multTranslation([-FLOOR_SIZE,-FLOOR_SIZE/2,0]);
    for(let i = 0; i<VP_DISTANCE*aspect*2; i += FLOOR_SIZE){
        for (let j = -3.0*VP_DISTANCE; j<3.0*VP_DISTANCE; j+= FLOOR_SIZE){
            pushMatrix();
                multTranslation([i,0,j]);
                multScale([FLOOR_SIZE,FLOOR_SIZE,FLOOR_SIZE]);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
                cubeDraw(gl, program, false);
            popMatrix();
        }
    }
}
function satelliteDish() {
    multTranslation([5 * ARM_ANTENNA_SIZE / 6, ARM_ANTENNA_SIZE * 0.35 + ARM_ANTENNA_SIZE * 0.43 / 8, 0]);
    multScale([ANTENNA_X, ANTENNA_Y, ANTENNA_Z]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
    computeColor(ANTENNA);
    paraboloidDraw(gl, program, false);
}

function antenaForeArm() {
    multTranslation([5 * ARM_ANTENNA_SIZE / 6, ARM_ANTENNA_SIZE * 0.60 / 8, 0]);
    multScale([SUPPORT_ANTENNA_X, ARM_ANTENNA_SIZE * 0.60, SUPPORT_ANTENNA_Z]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
    computeColor(ARM_ANTENNA);
    cubeDraw(gl, program, false);
}

function antennaArm() {
    multTranslation([ARM_ANTENNA_SIZE / 2, 0, 0]);
    multRotationZ(90);
    multScale([SUPPORT_ANTENNA_X, ARM_ANTENNA_SIZE, SUPPORT_ANTENNA_Z]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
    computeColor(SUPPORT_ANTENNA);
    cylinderDraw(gl, program, false);
}

function antennaKneecap() {
    multScale([SUPPORT_ANTENNA_X * 1.5, SUPPORT_ANTENNA_X * 1.5, SUPPORT_ANTENNA_Z * 1.5]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
    computeColor(KNEECAP);
    sphereDrawWireFrame(gl, program, false);
}

function antennaSupport() {
    multTranslation([0, (BACKTRUCK_Y + SUPPORT_ANTENNA_Y) / 2, 0]);
    multRotationY(90);
    multScale([SUPPORT_ANTENNA_X, SUPPORT_ANTENNA_Y, SUPPORT_ANTENNA_Z]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
    computeColor(SUPPORT_ANTENNA);
    cylinderDraw(gl, program, false);
}

function frontTruck() {
    multTranslation([(BACKTRUCK_X + CABINETRUCK_X) / 2, -(BACKTRUCK_Y - CABINETRUCK_Y) / 2, 0]);
    multScale([CABINETRUCK_X, CABINETRUCK_Y, CABINETRUCK_Z]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
    computeColor(CABINE_TRUCK);
    cubeDraw(gl, program, false);
}

function backTruck() {
    multScale([BACKTRUCK_X, BACKTRUCK_Y, BACKTRUCK_Z]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
    computeColor(BACK_TRUCK);
    cubeDraw(gl, program, false);
}

function stylingElements() {
    pushMatrix();//latdoor
        multTranslation([BACKTRUCK_X * 0.2, -DOOR_THICKNESS, BACKTRUCK_Z / 2 - DOOR_THICKNESS]);
        multScale([BACKTRUCK_X * 0.40, BACKTRUCK_Y * 0.8, DOOR_THICKNESS]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
        computeColor(BACK_TRUCK);
        cubeDraw(gl, program, false);
    popMatrix();
    pushMatrix();//latglass
        multTranslation([BACKTRUCK_X * 0.2, BACKTRUCK_Y * 0.17, BACKTRUCK_Z / 2 - DOOR_THICKNESS]);
        multScale([BACKTRUCK_X * 0.36, BACKTRUCK_Y * 0.35, GLASS_THICKNESS]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
        computeColor(GLASS);
        cubeDraw(gl, program, false);
    popMatrix();
    

    pushMatrix();//latdoor
        multTranslation([BACKTRUCK_X * 0.2, -DOOR_THICKNESS, -BACKTRUCK_Z / 2 + DOOR_THICKNESS]);
        multScale([BACKTRUCK_X * 0.40, BACKTRUCK_Y * 0.8, DOOR_THICKNESS]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
        computeColor(BACK_TRUCK);
        cubeDraw(gl, program, false);
    popMatrix();
    pushMatrix();//latglass
        multTranslation([BACKTRUCK_X * 0.2, BACKTRUCK_Y * 0.17, -BACKTRUCK_Z / 2 + DOOR_THICKNESS]);
        multScale([BACKTRUCK_X * 0.36, BACKTRUCK_Y * 0.35, GLASS_THICKNESS]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
        computeColor(GLASS);
        cubeDraw(gl, program, false);
    popMatrix();


    pushMatrix();//backdoor
        multTranslation([-BACKTRUCK_X / 2 + DOOR_THICKNESS, -DOOR_THICKNESS, BACKTRUCK_Z * 0.40/2]);
        multScale([DOOR_THICKNESS, BACKTRUCK_Y * 0.8, BACKTRUCK_Z * 0.40]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
        computeColor(BACK_TRUCK);
        cubeDraw(gl, program, false);
    popMatrix();
    pushMatrix();//backdoor
        multTranslation([-BACKTRUCK_X / 2 + DOOR_THICKNESS, -DOOR_THICKNESS, -BACKTRUCK_Z * 0.40 / 2]);
        multScale([DOOR_THICKNESS, BACKTRUCK_Y * 0.8, BACKTRUCK_Z * 0.40]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
        computeColor(BACK_TRUCK);
        cubeDraw(gl, program, false);
    popMatrix();


    pushMatrix();//frontGlass
        multTranslation([BACKTRUCK_X/2 + CABINETRUCK_X-2, 0, 0]);
        multScale([GLASS_THICKNESS, CABINETRUCK_Y * 0.45, CABINETRUCK_Z*0.9]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
        computeColor(GLASS);
        cubeDraw(gl, program, false);
    popMatrix();
    pushMatrix();//sideWindow
        multTranslation([BACKTRUCK_X / 2 + CABINETRUCK_X / 2, 0, GLASS_THICKNESS - CABINETRUCK_Z/2]);
        multScale([CABINETRUCK_X * 0.85, CABINETRUCK_Y * 0.45, GLASS_THICKNESS]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
        computeColor(GLASS);
        cubeDraw(gl, program, false);
    popMatrix();
    pushMatrix();//sideWindow
        multTranslation([BACKTRUCK_X / 2 + CABINETRUCK_X / 2, 0, -GLASS_THICKNESS+CABINETRUCK_Z / 2]);
        multScale([CABINETRUCK_X * 0.85, CABINETRUCK_Y * 0.45, GLASS_THICKNESS]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
        computeColor(GLASS);
        cubeDraw(gl, program, false);
    popMatrix();
}
