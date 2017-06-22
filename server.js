var express = require('express');
var app = express();
var rpio = require('rpio');
fs = require('fs');
var shell = require('shelljs');
var Enum = require('enum');

var right_forward = 19;
var left_forward = 13;
var right_backward = 11;
var left_backward = 15;

var status = "stopped";

var vertical_state = new Enum(['going_forward','going_backwards','still']);
var horizontal_state = new Enum(['none','right_moderate','right_sharp','left_moderate','left_sharp']);
var v_state = vertical_state.still;
var h_state = horizontal_state.none;

function rightForward(){
	rpio.write(right_forward, rpio.HIGH);
	rpio.write(right_backward, rpio.LOW);
}
function rightBackwards(){
	rpio.write(right_backward, rpio.HIGH);
	rpio.write(right_forward, rpio.LOW);
}
function leftForward(){
	rpio.write(left_forward, rpio.HIGH);
	rpio.write(left_backward, rpio.LOW);
}
function leftBackward(){
	rpio.write(left_backward, rpio.HIGH);
	rpio.write(left_forward, rpio.LOW);
}
function rightStop(){
	rpio.write(right_backward, rpio.LOW);
	rpio.write(right_forward, rpio.LOW);
}
function leftStop(){
	rpio.write(left_backward, rpio.LOW);
	rpio.write(left_forward, rpio.LOW);
}

function forward(){
	rightForward();
	leftForward();
	v_state = vertical_state.going_forward;
}

function backwards(){
	rightBackwards();
	leftBackwards();
	v_state = vertical_state.going_backwards;
}

function startModerateRight(){
	rightStop();
	switch(v_state){
		case vertical_state.still:
			leftForward();
			break;
	}
}

function startModerateLeft(){
	leftStop();
	switch(v_state){
		case vertical_state.still:
			rightForward();
			break;
	}
}

function startSharpRight(){
	switch(v_state){
		case vertical_state.going_forward:
			rightBackward();
			leftForward();
			break;
		case vertical_state.going_backward:
			rightForward();
			leftBackward();
			break;			
	}
}

function startSharpLeft(){
	switch(v_state){
		case vertical_state.going_forward:
			leftBackward();
			rightForward();
			break;
		case vertical_state.going_backward:
			leftForward();
			rightBackward();
			break;			
	}
}



function stopTurning(){
	switch(v_state){
		case vertical_state.going_forward:
			forward();
			break;
		case vertical_state.going_backwads:
			backward();
			break;
		case vertical_state.still:
			stop();
	}		
}

app.use(express.static(__dirname));


//video on/off
app.get('/video/on', function (req, res) {
    console.log('starting motion');
	shell.exec('sudo service motion restart', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		console.log('started motion');
		res.send('started video');
	});
});

app.get('/video/off', function (req, res) {
    console.log('stopping motion');
    shell.exec('sudo service motion stop', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		console.log('stopped motion');
		res.send('stopped video');
	});
});


//audio on/off
app.get('/audio/on', function (req, res) {
    console.log('starting audio at ' + __dirname + '/startAudioStreaming.sh');    
    shell.exec(__dirname + '/startAudioStreaming.sh', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		console.log('started audio');
		if(stderr == ''){
			res.send('started audio');
		}
		else{
			res.send('error while starting audio! ' + stderr);
		}
		
	});
});


app.get('/audio/off', function (req, res) {
    console.log('stopping audio');
    shell.exec(__dirname +  '/stopAudioStreaming.sh', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		console.log('stopped audio');
		if(stderr == ''){
			res.send('stopped audio');
		}
		else{
			res.send('error while stopping audio! ' + stderr);
		}
	});
});


// car controller

app.get('/forward', function (req, res) {
    forward();
	v_state = vertical_status.going_forward;
    res.send('going forward');
})

app.get('/backward', function (req, res) {
    backwards();
	v_state = vertical_status.going_backwards;
    res.send('going backwards');
})

app.get('/moderateRight', function (req, res) {
    startModerateRight();
    res.send('moderate right');
})

app.get('/moderateLeft', function (req, res) {
    startModerateLeft();
    res.send('moderate left');
})

app.get('/sharpRight', function (req, res) {
    startSharpRight();
    res.send('sharp right');
})

app.get('/sharpLeft', function (req, res) {
    startSharpLeft();
    res.send('sharp left');
})

app.get('/stopTurning', function (req, res) {
    stopTurning();
    res.send('stopped turning');
})

app.get('/left/:degrees', function (req, res) {    
    var deg = req.params['degrees'];
    console.log("turning left " + deg + " degrees");
    
    if(status == "stopped"){
		
	}
    else if(status == "forward"){
		rpio.write(left_forward, rpio.LOW);
		rpio.write(left_backward, rpio.HIGH);
		rpio.sleep(0.97);
		rpio.write(left_backward, rpio.LOW);
		rpio.write(left_forward, rpio.HIGH);
	}
	else if(status == "backward"){
		rpio.write(left_backward, rpio.LOW);
		rpio.write(left_forward, rpio.HIGH);
		rpio.sleep(0.97);
		rpio.write(left_backward, rpio.HIGH);
		rpio.write(left_forward, rpio.LOW);
	}
	else{
		console.log("got an unrecognized status" + status + ". stopping");	
		stop();
	}
   
    
    res.send('turned left ' + deg);
})


app.get('/right/:degrees', function (req, res) {
    var deg = req.params['degrees'];
    console.log("turning right " + deg + " degrees");
    
    if(status == "stopped"){
		
	}
    else if(status == "forward"){
		rpio.write(right_forward, rpio.LOW);
		rpio.write(right_backward, rpio.HIGH);
		rpio.sleep(0.97);
		rpio.write(right_backward, rpio.LOW);
		rpio.write(right_forward, rpio.HIGH);
	}
	else if(status == "backward"){
		rpio.write(right_backward, rpio.LOW);
		rpio.write(right_forward, rpio.HIGH);
		rpio.sleep(0.97);
		rpio.write(right_forward,rpio.LOW);
		rpio.write(right_backward,rpio.HIGH);
	}
	else{
		console.log("got an unrecognized status" + status + ". stopping");	
		stop();
	}
   
    
    res.send('turned right ' + deg);
    
    
})





app.get('/stop', function (req, res) {
    stop();
    res.send('stop');
})

function stop()
{
    rpio.write(right_forward, rpio.LOW);
    rpio.write(left_forward, rpio.LOW);
    rpio.write(right_backward, rpio.LOW);
    rpio.write(left_backward, rpio.LOW);
    status = "stopped";
}

// setup: open all pins and set them to LOW which is OFF
rpio.open(right_forward, rpio.OUTPUT, rpio.LOW);
rpio.open(right_backward, rpio.OUTPUT, rpio.LOW);
rpio.open(left_forward, rpio.OUTPUT, rpio.LOW);
rpio.open(left_backward, rpio.OUTPUT, rpio.LOW);



var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("car controller application listening at http://%s:%s", host, port)
}); 


process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    rpio.close(right_forward);
    rpio.close(right_backward);
    rpio.close(left_forward);
    rpio.close(left_backward);
    console.log("exiting")
    if (options.cleanup) console.log('clean');
    if (err) console.log('error: ' + err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
