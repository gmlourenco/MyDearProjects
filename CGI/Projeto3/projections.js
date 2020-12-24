
/*
Projeto 3, 
Joana Soares Faria 55754
Gonçalo Martins Lourenço 55780 */
var canvas;
var gl;
var program;
var aspect;

var mProjectionLoc, mViewLoc, mModelLoc, mNormalsLoc, lightPositionLoc, mViewNormalsLoc;
var materialAmbLoc, materialSpeLoc, shininessLoc, lightAmbLoc, lightDifLoc, lightSpeLoc, illumination1Loc, illumination2Loc;
var mView, pLoc;
var filledColor, zBuffer, backfaceCulling;
var projectionMode, orthoMode, axonometricMode;
var a, b, d;
var shape;
var zoom;

var lightMode, lightOn;
var lightX, lightY, lightZ, lightW;
var lightR, lightG, lightB;
var materialKaR, materialKaG, materialKaB;
var materialKsR, materialKsG, materialKsB;
var n;

var activeMouse;
var mouseX, mouseY;
var yTot, xTot;
var mMove, mModel;


const LIGHT_OFF = 0;
const LIGHT_PONTUAL = 1;
const LIGHT_DIRECTIONAL = 2;

const ORTHO = 0;
const AXONOMETRIC = 1
const PERSPECTIVE = 2;

const ALCADO_PRINCIPAL = 0;
const PLANTA = 1;
const ALCADO_DIREITO = 2;


const ISOMETRIA = 0;
const DIMETRIA = 1;
const TRIMETRIA = 2;
const FREE = 3;


const CUBE = 0;
const SPHERE = 1;
const TORUS = 2;
const CYLINDER = 3;
const PARABOLOID = 4;


//Temporario
const VP_DISTANCE = 1;



function computeInterface() {
    var orthoDiv = document.getElementById("ortho_menu");
    var perspectiveDiv = document.getElementById("perspective");
    var axonometricDiv = document.getElementById("axonometric_menu");
    var freeAxonometricDiv = document.getElementById("free_axonometric");
    var lightPosDiv = document.getElementById("light_pos");
    var lightColorDiv = document.getElementById("light_color");
    var materialDiv = document.getElementById("material");

    if (projectionMode === ORTHO) {
        orthoDiv.style.display = "inline";
        perspectiveDiv.style.display = "none";
        axonometricDiv.style.display = "none";
        freeAxonometricDiv.style.display = "none";
    } else if (projectionMode === AXONOMETRIC) {
        orthoDiv.style.display = "none";
        perspectiveDiv.style.display = "none";
        axonometricDiv.style.display = "inline";
        if (axonometricMode == FREE) {
            freeAxonometricDiv.style.display = "block";
        } else {
            freeAxonometricDiv.style.display = "none";
        }

    } else if (projectionMode === PERSPECTIVE) {
        orthoDiv.style.display = "none";
        perspectiveDiv.style.display = "inline";
        axonometricDiv.style.display = "none";
        freeAxonometricDiv.style.display = "none";
    }

    if (lightMode == LIGHT_OFF || lightOn == LIGHT_OFF) {
        lightPosDiv.style.display = "none";
        lightColorDiv.style.display = "none";
        materialDiv.style.display = "none";
    } else {
        lightPosDiv.style.display = "block";
        lightColorDiv.style.display = "block";
        materialDiv.style.display = "block";
    }
}


function fit_canvas_to_window() {
    canvas.width = window.innerWidth;
    canvas.height = 0.7 * window.innerHeight;

    aspect = canvas.width / canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);

}

window.onresize = function () {
    fit_canvas_to_window();
}

window.onload = function () {
    canvas = document.getElementById('gl-canvas');

    //initialize variables to default values
    filledColor = false;
    zBuffer = false;
    backfaceCulling = false;
    projectionMode = AXONOMETRIC;
    orthoMode = ALCADO_PRINCIPAL;
    axonometricMode = DIMETRIA;
    shape = CUBE;
    a = 30 * Math.PI / 180.0;
    b = 30 * Math.PI / 180.0;
    d = 5;
    zoom = 1;
    lightMode = LIGHT_OFF;
    n = 6;
    lightX = 0.5;
    lightY = lightZ = 1;
    lightW = 0.0;
    lightR = lightG = lightB = 1.0;
    materialKaR = 1
    materialKaG = materialKaB = 0;
    materialKsR = materialKsG = materialKsB = 1;
    lightOn = LIGHT_PONTUAL;

    activeMouse = false;
    mouseX = 0;
    mouseY = 0;
    mMove = mModel = mat4();

    gl = WebGLUtils.setupWebGL(document.getElementById('gl-canvas'));
    fit_canvas_to_window();

    gl.clearColor(0.2, 0.2, 0.2, 1.0);

    program = initShaders(gl, 'default-vertex', 'default-fragment');

    gl.useProgram(program);

    mViewLoc = gl.getUniformLocation(program, "mView");
    mModelLoc = gl.getUniformLocation(program, "mModel");
    gl.uniformMatrix4fv(mModelLoc, false, flatten(mModel));
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");

    mNormalsLoc = gl.getUniformLocation(program, "mNormals");
    lightPositionLoc = gl.getUniformLocation(program, "lightPosition");
    mViewNormalsLoc = gl.getUniformLocation(program, "mViewNormals");
    materialAmbLoc = gl.getUniformLocation(program, "materialAmb");
    materialDifLoc = gl.getUniformLocation(program, "materialDif");
    materialSpeLoc = gl.getUniformLocation(program, "materialSpe");
    shininessLoc = gl.getUniformLocation(program, "shininess");
    //lightAmbLoc = gl.getUniformLocation(program, "lightAmb");
    lightDifLoc = gl.getUniformLocation(program, "lightDif");
    //lightSpeLoc = gl.getUniformLocation(program, "lightSpe");
    illumination1Loc = gl.getUniformLocation(program, "illumination1");
    illumination2Loc = gl.getUniformLocation(program, "illumination2");
    pLoc = gl.getUniformLocation(program, "p");


    sphereInit(gl);
    cubeInit(gl);
    cylinderInit(gl);
    torusInit(gl);
    paraboloidInit(gl);

    document.onkeydown = function (event) {
        var command = (event.key).toLowerCase();
        switch (command) {
            case 'f':
                filledColor = true;
                var output = document.getElementById("filled");
                output.innerHTML = "FILLED";
                break;
            case 'w':
                filledColor = false;
                var output = document.getElementById("filled");
                output.innerHTML = "WIRE";
                break;
            case 'z':
                zBuffer = !zBuffer;
                var output = document.getElementById("z_buffer");
                output.innerHTML = zBuffer;
                break;
            case 'b':
                backfaceCulling = !backfaceCulling;
                var output = document.getElementById("culling");
                output.innerHTML = backfaceCulling;
                break;
            case 'r':
                mMove = mat4();
                break;
            case 'l':
                if (lightMode === LIGHT_OFF) {
                    lightMode = lightOn;
                } else {
                    lightOn = lightMode;
                    lightMode = LIGHT_OFF;
                }
                computeInterface();
                break;
        }
    }

    canvas.onmousedown = function (event) {
        activeMouse = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
    }
    document.onmouseup = function () {
        activeMouse = false;
    }
    document.onmousemove = function (event) {
        if (!activeMouse || projectionMode != PERSPECTIVE) {
            return;
        }
        var newX = event.clientX;
        var newY = event.clientY;

        var dX = newX - mouseX;
        var dY = newY - mouseY;

        var yAngle = Math.atan(dX / (d * aspect * zoom * 2)) * 180 / Math.PI;
        var xAngle = Math.atan(dY / (d * aspect * zoom * 2)) * 180 / Math.PI;

        mMove = mult(mMove, rotateY(yAngle));
        mMove = mult(mMove, rotateX(xAngle));

        mouseX = newX
        mouseY = newY;
    }


    document.getElementById("distance").oninput = function () {
        var x = document.getElementById("distance");
        d = x.value;
        var output = document.getElementById("dValue");
        output.innerHTML = d;
    };
    document.getElementById("aSlider").oninput = function () {
        maxRange();
        var x = document.getElementById("aSlider");
        a = x.value * Math.PI / 180.0;
        var output = document.getElementById("aValue");
        output.innerHTML = x.value;
    };
    document.getElementById("bSlider").oninput = function () {
        maxRange();
        var x = document.getElementById("bSlider");
        b = x.value * Math.PI / 180.0;
        var output = document.getElementById("bValue");
        output.innerHTML = x.value;
    };
    document.getElementById("projection").onchange = function () {
        var x = document.getElementById("projection");
        projectionMode = x.options.selectedIndex;
        computeInterface();
    };

    document.getElementById("axonometric_menu").onchange = function () {
        var x = document.getElementById("axonometricOptions");
        axonometricMode = x.selectedIndex;
        computeInterface();
    };
    document.getElementById("ortho_menu").onchange = function () {
        var x = document.getElementById("orthogonalOptions");
        computeInterface();
        orthoMode = x.options.selectedIndex;

    };

    document.getElementById("objects").onchange = function () {
        var x = document.getElementById("objects");
        shape = x.options.selectedIndex;
    };
    document.onwheel = function (event) {
        //TODO
        var y = event.deltaY;
        if (y < 0 && zoom < 3) {
            zoom += 0.1;
        } else if (zoom > 0.2) {
            zoom -= 0.1;
        }

        var output = document.getElementById("zoom");
        output.innerHTML = Math.round(zoom * 100) + "%";
    }
    document.getElementById("x_pos").oninput = function () {
        var pos = document.getElementById("x_pos");
        lightX = pos.value;
        var output = document.getElementById("x_value");
        output.innerHTML = lightX;
    };
    document.getElementById("y_pos").oninput = function () {
        var pos = document.getElementById("y_pos");
        lightY = pos.value;
        var output = document.getElementById("y_value");
        output.innerHTML = lightY;
    };
    document.getElementById("z_pos").oninput = function () {
        var pos = document.getElementById("z_pos");
        lightZ = pos.value;
        var output = document.getElementById("z_value");
        output.innerHTML = lightZ;
    };
    document.getElementById("r").oninput = function () {
        var pos = document.getElementById("r");
        lightR = pos.value;
        var output = document.getElementById("r_value");
        output.innerHTML = lightR;
    };
    document.getElementById("g").oninput = function () {
        var pos = document.getElementById("g");
        lightG = pos.value;
        var output = document.getElementById("g_value");
        output.innerHTML = lightG;
    };
    document.getElementById("b").oninput = function () {
        var pos = document.getElementById("b");
        lightB = pos.value;
        var output = document.getElementById("b_value");
        output.innerHTML = lightB;
    };
    document.getElementById("r_ka").oninput = function () {
        var pos = document.getElementById("r_ka");
        materialKaR = pos.value;
        var output = document.getElementById("r_ka_value");
        output.innerHTML = materialKaR;
    };
    document.getElementById("g_ka").oninput = function () {
        var pos = document.getElementById("g_ka");
        materialKaG = pos.value;
        var output = document.getElementById("g_ka_value");
        output.innerHTML = materialKaG;
    };
    document.getElementById("b_ka").oninput = function () {
        var pos = document.getElementById("b_ka");
        materialKaB = pos.value;
        var output = document.getElementById("b_ka_value");
        output.innerHTML = materialKsB;
    };
    document.getElementById("r_ks").oninput = function () {
        var pos = document.getElementById("r_ks");
        materialKsR = pos.value;
        var output = document.getElementById("r_ks_value");
        output.innerHTML = materialKsR;
    };
    document.getElementById("g_ks").oninput = function () {
        var pos = document.getElementById("g_ks");
        materialKsG = pos.value;
        var output = document.getElementById("g_ks_value");
        output.innerHTML = materialKsG;
    };
    document.getElementById("b_ks").oninput = function () {
        var pos = document.getElementById("b_ks");
        materialKsB = pos.value;
        var output = document.getElementById("b_ks_value");
        output.innerHTML = materialKsB;
    };
    document.getElementById("n").oninput = function () {
        var pos = document.getElementById("n");
        n = pos.value;
        var output = document.getElementById("n_value");
        output.innerHTML = n;
    };
    document.getElementById("light").onchange = function () {
        var x = document.getElementById("light");
        lightMode = x.selectedIndex;
        if (lightMode == LIGHT_PONTUAL) {
            lightW = 1;
        } else if (lightMode == LIGHT_DIRECTIONAL) {
            lightW = 0;
        }

        computeInterface();
    };

    computeInterface();
    render();
}
function illumination() {

    gl.uniform1i(illumination1Loc, lightMode);
    gl.uniform1i(illumination2Loc, lightMode);

    if (lightMode != LIGHT_OFF) {
        var mNormals = normalMatrix(mult(mView, mModel));
        var mViewNormals = normalMatrix(mView);
        var lightPosition = vec4(lightX, lightY, lightZ, lightW);

        gl.uniformMatrix4fv(mNormalsLoc, false, flatten(mNormals));
        gl.uniformMatrix4fv(mViewNormalsLoc, false, flatten(mViewNormals));
        gl.uniform4fv(lightPositionLoc, flatten(lightPosition));

        var lightDif = vec3(lightR, lightG, lightB);
        var materialAmb = vec3(materialKaR, materialKaG, materialKaB);
        var materialDif = materialAmb;
        var materialSpec = vec3(materialKsR, materialKsG, materialKsB);

        gl.uniform3fv(lightDifLoc, flatten(lightDif));
        gl.uniform3fv(materialAmbLoc, flatten(materialAmb));
        gl.uniform3fv(materialDifLoc, flatten(materialDif));
        gl.uniform3fv(materialSpeLoc, flatten(materialSpec));
        gl.uniform1f(shininessLoc, n);

    }

}
function maxRange() {
    var aa = document.getElementById("aSlider");
    var bb = document.getElementById("bSlider");
    aa.setAttribute("max", 90 - (b * 180.0 / Math.PI));
    bb.setAttribute("max", 90 - (a * 180.0 / Math.PI));
}

function computeView() {

    switch (projectionMode) {
        case ORTHO: orthoProjection();
            gl.uniform1i(pLoc, ORTHO); break;
        case AXONOMETRIC: axonometricProjection();
            gl.uniform1i(pLoc, AXONOMETRIC); break;
        case PERSPECTIVE: perspectiveProjection();
            gl.uniform1i(pLoc, PERSPECTIVE); break;
    }
    gl.uniformMatrix4fv(mViewLoc, false, flatten(mView));
}

function orthoProjection() {
    var projection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -3 * VP_DISTANCE, 3 * VP_DISTANCE);
    projection = mult(scalem([zoom, zoom, zoom]), projection);

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    switch (orthoMode) {
        case ALCADO_PRINCIPAL: mView = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]); break;
        case PLANTA: mView = lookAt([0, VP_DISTANCE, 0], [0, 0, 0], [0, 0, -1]); break;
        case ALCADO_DIREITO: mView = lookAt([VP_DISTANCE, 0, 0], [0, 0, 0], [0, 1, 0]); break;
    }
}

function axonometricProjection() {
    var projection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -10 * VP_DISTANCE, 10 * VP_DISTANCE);

    projection = mult(scalem([zoom, zoom, zoom]), projection);

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    var eye;
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);
    var theta, gamma;
    var aa, bb;

    switch (axonometricMode) {
        case ISOMETRIA:
            aa = 30 * Math.PI / 180.0;
            bb = aa;
            break;
        case DIMETRIA:
            aa = 42 * Math.PI / 180.0;
            bb = 7 * Math.PI / 180.0;
            break;
        case TRIMETRIA:
            aa = (54 + 16 / 60) * Math.PI / 180.0;
            bb = (23 + 16 / 60) * Math.PI / 180.0;
            break;
        case FREE:
            aa = a;
            bb = b;
            break;
    }
    theta = computeTheta(aa, bb) * 180 / Math.PI;
    gamma = computeGamma(aa, bb) * 180 / Math.PI;
    eye = vec4(0, 0, 1, 1);
    eye = mult(rotateY(-theta), mult(rotateX(-gamma), eye));
    eye = [eye[0], eye[1], eye[2]];
    mView = lookAt(eye, at, up);

}
function computeTheta(aa, bb) {
    return Math.atan(Math.sqrt((Math.tan(aa) / Math.tan(bb)))) - Math.PI / 2;
}
function computeGamma(aa, bb) {
    return Math.asin(Math.sqrt((Math.tan(aa) * Math.tan(bb))));
}

function perspectiveProjection() {
    let near = Math.min(d, VP_DISTANCE) * zoom;
    let fovy = 2 * Math.atan(VP_DISTANCE / (d * aspect)) * 180 / Math.PI;

    var projection = perspective(fovy, aspect, near, -3 * VP_DISTANCE);
    projection = mult(scalem([zoom, zoom, zoom]), projection);
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    var eye = vec3(0.0, 0.0, d);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);
    mView = lookAt(eye, at, up);
    mView = mult(mView, mMove);
    mView = mult(mView, scalem([0.5, 0.5, 0.5]));


}

function render() {
    requestAnimationFrame(render);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (backfaceCulling) {
        gl.enable(gl.CULL_FACE);
    } else {
        gl.disable(gl.CULL_FACE);
    }
    if (zBuffer) {
        gl.enable(gl.DEPTH_TEST);
    } else {
        gl.disable(gl.DEPTH_TEST);
    }
    computeView();
    illumination();

    switch (shape) {
        case CUBE:
            gl.uniformMatrix4fv(mModelLoc, false, flatten(mModel));
            cubeDraw(gl, program, filledColor);
            break;
        case SPHERE:
            gl.uniformMatrix4fv(mModelLoc, false, flatten(mModel));
            sphereDraw(gl, program, filledColor);
            break;
        case TORUS:
            gl.uniformMatrix4fv(mModelLoc, false, flatten(mModel));
            torusDraw(gl, program, filledColor);
            break;
        case CYLINDER:
            gl.uniformMatrix4fv(mModelLoc, false, flatten(mModel));
            cylinderDraw(gl, program, filledColor);
            break;
        case PARABOLOID:
            mModel = mult(mModel, scalem([0.5, 0.5, 0.5]));
            gl.uniformMatrix4fv(mModelLoc, false, flatten(mModel));
            paraboloidDraw(gl, program, filledColor);
            mModel = mat4();
            break;
    }
}