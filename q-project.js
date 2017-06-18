//Dominick Miller

var gl;
var myShaderProgram;
var alpha;
var beta;
var gamma;
var Xtrans;
var Ytrans;
var Xscale;
var Yscale;

var colorUniform;

var nodeVertices =[];
var nodeIndexList =[];
var initialNodeVertices = [];

var iBuffer;
var vertexBuffer;
var myPosition1;

var edgeVertices= [];
var edgeIndexList =[];

var edgeIndexBuffer;
var edgeBuffer;
var myPosition2;

var Eye_uniform;

var testingFlag = 1;


function init() {
    	alpha = 0.0;
	beta = 0.0;
	gamma = 0.0;
	Xtrans = 0.0;
	Ytrans = 0.0;
	Xscale = 1.0;
	Yscale = 1.0;

	var canvas=document.getElementById("gl-canvas");
	gl=WebGLUtils.setupWebGL(canvas);
	    
	if (!gl) { alert( "WebGL is not available" ); }
	    
	gl.viewport( 0, 0, 512, 512 );
	    
	gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
	    
	myShaderProgram = initShaders( gl,"vertex-shader", "fragment-shader" );
	gl.useProgram( myShaderProgram );
	
	var ysLocal = gl.getUniformLocation(myShaderProgram, "Yscale");
	gl.uniform1f(ysLocal, Yscale);
	var xsLocal = gl.getUniformLocation(myShaderProgram, "Xscale");
	gl.uniform1f(xsLocal, Xscale);

	//needed to render the faces properly

	setupElements();
	gl.enable( gl.DEPTH_TEST );
	colorUniform = gl.getUniformLocation(myShaderProgram, "color");
	addNode();
	setupCamera();

	render();

}

function translate(nodeVertices, x, y, z) {
	for ( var i = 0; i < nodeVertices.length; ++i) {
		nodeVertices[i][0] += x;
		nodeVertices[i][1] += y;
		nodeVertices[i][2] += z;	
	}
}

function addEdge(initp1,initp2){
	var offset = 0.01;	
	var p0 = initp1.slice(), p1 = initp1.slice(), p2 = initp1.slice(), p3 = initp1.slice();
	p0[0] -= offset;
	p0[2] -= offset;
	p1[0] += offset;
	p1[2] -= offset;
	p2[0] += offset;
	p2[2] += offset;
	p3[0] -= offset;
	p3[2] += offset;
	var p4 = initp2.slice(), p5 = initp2.slice(), p6 = initp2.slice(), p7 = initp2.slice();
	p4[0] -= offset;
	p4[2] -= offset;
	p5[0] += offset;
	p5[2] -= offset;
	p6[0] += offset;
	p6[2] += offset;
	p7[0] -= offset;
	p7[2] += offset;	
	var addition = [p0,p1,p2,p3,p4,p5,p6,p7];

	edgeVertices.push(addition);
}

function setupCamera() {

	var eye = vec3(0.0, 0.0, 4.0);
	var vUp = vec3(0.0, 1.0, 0.0);
	var at =  vec3(0.0, 0.0, 0.0);

	var near, far, topp, bottom, left, right, aspect, fov;

	aspect = 1; //since clipspace is square
	fov = Math.PI/4; //45 degrees

	near = length(subtract(eye,at)) - 5;
        far =  length(subtract(eye,at)) + 5;
	//top is a keyword
        bottom = -(topp = near * Math.tan(fov) );
        left = -(right = topp*aspect );
	
	//perspective matrix
        var M_per = [
	( 2*near/(right-left) ), 0, 0, 0,
        0, ( 2*near/(topp-bottom) ), 0, 0,
        ( (right+left)/(right-left) ), ( (topp+bottom)/(topp-bottom) ), 
        -( (far+near)/(far-near) ), -1,
        0, 0, -( (2*far*near)/(far-near) ), 0];

	//orthagraphic matrix.
	var M_ort = [
	2/(right-left), 0, 0, 0,
	0, 2/(topp - bottom), 0, 0,
	0, 0, -2/(far-near), 0,
	-( (left + right)/(right - left) ),
	-( (topp + bottom)/(topp - bottom) ),
	-( (far + near)/(far - near) ),
	1];
	
	//set projection to perspective to start.
	var M_P = M_ort;

	//send values over to vertex shader for the model view matrix
	Eye_uniform = gl.getUniformLocation(myShaderProgram, "e");
	gl.uniform3f(Eye_uniform, eye[0], eye[1], eye[2]);
	var At_uniform = gl.getUniformLocation(myShaderProgram, "a");
	gl.uniform3f(At_uniform, at[0], at[1], at[2]);
	var vUp_uniform = gl.getUniformLocation(myShaderProgram, "vUp");
	gl.uniform3f(vUp_uniform, vUp[0], vUp[1], vUp[2]);
	
	//send the projection matrix.
	var M_P_uniform = gl.getUniformLocation(myShaderProgram, "P");
	gl.uniformMatrix4fv( M_P_uniform, false, flatten(M_P));
	
}

function setupElements() {

        var latitudeBands = 30;
        var longitudeBands = 30;
        var radius = 0.1;

        for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
            var theta = latNumber * Math.PI / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
                var phi = longNumber * 2 * Math.PI / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;


                initialNodeVertices.push( vec4( (radius * x), (radius * y), (radius * z), 1) );
            }
        }

        for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
            for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
                var first = (latNumber * (longitudeBands + 1)) + longNumber;
                var second = first + longitudeBands + 1;
                nodeIndexList.push(first);
                nodeIndexList.push(second);
                nodeIndexList.push(first + 1);

                nodeIndexList.push(second);
                nodeIndexList.push(second + 1);
                nodeIndexList.push(first + 1);
            }
        }

	iBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, iBuffer);
	gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( nodeIndexList ), gl.STATIC_DRAW );

	vertexBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(nodeVertices) , gl.STATIC_DRAW );

	myPosition1 = gl.getAttribLocation(myShaderProgram, "myPosition");
	gl.vertexAttribPointer( myPosition1, 4, gl.FLOAT, false, 0.0, 0.0);
	gl.enableVertexAttribArray( myPosition1 );

	edgeIndexList = [(0), (4), (5),
			(1), (0), (5),
			(1), (5), (6),
			(2), (1), (6),
			(2), (6), (7),
			(3), (2), (7),
			(3), (7), (4),
			(0), (3), (4)];
	
	edgeIndexBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, edgeIndexBuffer);
	gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( edgeIndexList ), gl.STATIC_DRAW );

	edgeBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, edgeBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(edgeVertices) , gl.STATIC_DRAW );

	myPosition2 = gl.getAttribLocation(myShaderProgram, "myPosition");
	gl.vertexAttribPointer( myPosition2, 4, gl.FLOAT, false, 0.0, 0.0);
	gl.enableVertexAttribArray( myPosition2 );

}


function render() {
	//clears both buffers
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	//nodes
	gl.uniform4f(colorUniform, 1.0, 0.0, 0.0, 1 );


	var numVertices = initialNodeVertices.length;
	var numNodes = nodeVertices.length;
	//for however many nodes there are.
	for(var i = 0; i < numNodes; ++i){
		
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, iBuffer);
		gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( nodeIndexList ), gl.STATIC_DRAW );

		gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData( gl.ARRAY_BUFFER, flatten(nodeVertices[i]) , gl.STATIC_DRAW );

		myPosition1 = gl.getAttribLocation(myShaderProgram, "myPosition");
		gl.vertexAttribPointer( myPosition1, 4, gl.FLOAT, false, 0.0, 0.0);
		gl.enableVertexAttribArray( myPosition1 );
	
		gl.drawElements( gl.TRIANGLES, 30*30*6, gl.UNSIGNED_SHORT, 0);
	}

	//edges

	gl.uniform4f(colorUniform, 0.0, 0.0, 0.0, 1 );
	var numEdges = edgeVertices.length;
	for (var i = 0; i < numEdges; ++i){
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, edgeIndexBuffer);
		gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( edgeIndexList ), gl.STATIC_DRAW );

		gl.bindBuffer( gl.ARRAY_BUFFER, edgeBuffer);
		gl.bufferData( gl.ARRAY_BUFFER, flatten(edgeVertices[i]) , gl.STATIC_DRAW );

		myPosition2 = gl.getAttribLocation(myShaderProgram, "myPosition");
		gl.vertexAttribPointer( myPosition2, 4, gl.FLOAT, false, 0.0, 0.0);
		gl.enableVertexAttribArray( myPosition2 );

		gl.drawElements( gl.TRIANGLES, edgeIndexList.length, gl.UNSIGNED_SHORT, 0);
	}

	requestAnimFrame(render);
}

function addNode(){
	var x = Math.random();	
	var y = Math.random();	
	var z = Math.random();	

	if (Math.random() < 0.5){
		x *= -1;
	}
	if (Math.random() < 0.5){
		y *= -1;
	}
	if (Math.random() < 0.5){
		z *= -1;
	}

	var startingPosition = vec4(x, y, z, 1.0 );
	var vertex = [];
	var vertexList = [];
	for ( var i = 0; i < initialNodeVertices.length; ++i) {
		vertex = [];
		vertex.push(initialNodeVertices[i][0] + startingPosition[0]);
		vertex.push(initialNodeVertices[i][1] + startingPosition[1]);
		vertex.push(initialNodeVertices[i][2] + startingPosition[2]);
		vertex.push(1);	
		vertexList.push(vertex);	
	}
	nodeVertices.push(vertexList);

	//add an edge inbetween the last two nodes added.
	if (nodeVertices.length > 1) {
		oldStartingPosition = subtract(nodeVertices[(nodeVertices.length - 2)][0],
			initialNodeVertices[0]);
		oldStartingPosition[3] = 1; 
		addEdge( startingPosition, oldStartingPosition );
	}

}

function editX() {
	gl.uniform3f(Eye_uniform, 4.0, 0.0, 0.0);
}
function editY() {
	gl.uniform3f(Eye_uniform, 0.0, -4.0, 0.0);
}
function editZ() {
	gl.uniform3f(Eye_uniform, 0.0, 0.0, 4.0);
}

function rotateShape(event) {
	var keyCode = event.keyCode;
	switch(keyCode) {
		case 88: //x- rotate on x axis
		alpha += 0.1;
		var alphaLocal = gl.getUniformLocation(myShaderProgram, "alpha");
		gl.uniform1f(alphaLocal, alpha);
	      	break;
	case 89: //y- rotate on y axiz
		beta += 0.1;
		var betaLocal = gl.getUniformLocation(myShaderProgram, "beta");
		gl.uniform1f(betaLocal, beta);
		break;
	case 90: //z- rotate on z axis
		gamma += 0.1;
		var gammaLocal = gl.getUniformLocation(myShaderProgram, "gamma");
		gl.uniform1f(gammaLocal, gamma);
		break;

	//I had thought this was a requirement.
	case 49: //1- x and z axis rotation
		gamma += 0.1;
		alpha += 0.1;
		var gammaLocal = gl.getUniformLocation(myShaderProgram, "gamma");
		gl.uniform1f(gammaLocal, gamma);
		var alphaLocal = gl.getUniformLocation(myShaderProgram, "alpha");
		gl.uniform1f(alphaLocal, alpha);
		break;
	case 50: //2- x and y axis rotation
		alpha += 0.1;
		var alphaLocal = gl.getUniformLocation(myShaderProgram, "alpha");
		gl.uniform1f(alphaLocal, alpha);
		beta += 0.1;
		var betaLocal = gl.getUniformLocation(myShaderProgram, "beta");
		gl.uniform1f(betaLocal, beta);
		break;

	case 65: //a- slide to left
		Xtrans -= 0.01;
		var xLocal = gl.getUniformLocation(myShaderProgram, "Xtrans");
		gl.uniform1f(xLocal, Xtrans);
		break;
	case 68: //d- slide to the right
		Xtrans += 0.01;
		var xLocal = gl.getUniformLocation(myShaderProgram, "Xtrans");
		gl.uniform1f(xLocal, Xtrans);
		break;
	case 83: //s- move down
		Ytrans -= 0.01;
		var yLocal = gl.getUniformLocation(myShaderProgram, "Ytrans");
		gl.uniform1f(yLocal, Ytrans);
		break;
	case 87: //w- move up
		Ytrans += 0.01;
		var yLocal = gl.getUniformLocation(myShaderProgram, "Ytrans");
		gl.uniform1f(yLocal, Ytrans);
		break;
	case 69: //e- scale up in the x dimension
		Xscale += 0.1;
		var xsLocal = gl.getUniformLocation(myShaderProgram, "Xscale");
		gl.uniform1f(xsLocal, Xscale);
		break;
	case 81: //q- scale up in the y dimension
		Yscale += 0.1;
		var ysLocal = gl.getUniformLocation(myShaderProgram, "Yscale");
		gl.uniform1f(ysLocal, Yscale);
		break;
	case 67: //c- scale down in the x dimension
		Xscale -= 0.1;
		var xsLocal = gl.getUniformLocation(myShaderProgram, "Xscale");
		gl.uniform1f(xsLocal, Xscale);
		break;
	case 86: //v- scale down in the y dimension
		Yscale -= 0.1;
		var ysLocal = gl.getUniformLocation(myShaderProgram, "Yscale");
		gl.uniform1f(ysLocal, Yscale);
		break;

	}
}


