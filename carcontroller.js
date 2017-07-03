var rpio = require('rpio');
var Enum = require('enum');
var logger = require('./log');

var right_forward = 19;
var left_forward = 13;
var right_backward = 11;
var left_backward = 15;

// setup: open all pins and set them to LOW which is OFF
function setup(){
	rpio.open(right_forward, rpio.OUTPUT, rpio.LOW);
	rpio.open(right_backward, rpio.OUTPUT, rpio.LOW);
	rpio.open(left_forward, rpio.OUTPUT, rpio.LOW);
	rpio.open(left_backward, rpio.OUTPUT, rpio.LOW);
}

function teardown(){
	rpio.close(right_forward);
    rpio.close(right_backward);
    rpio.close(left_forward);
    rpio.close(left_backward);
}

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
function leftBackwards(){
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
	logger.info('forward: entered. vertical_state is ' + v_state + " " + vertical_state.get(v_state));
	rightForward();
	leftForward();
	v_state = vertical_state.going_forward;
	logger.info('forward: exiting');
}

function backwards(){
	logger.info('backwards: entered');
	rightBackwards();
	leftBackwards();
	v_state = vertical_state.going_backwards;
	logger.info('backwards: exiting');
}

function stop(){
	logger.info('stop: entered');
    leftStop();
    rightStop();
    v_state = vertical_state.still;
    logger.info('stop: exiting');
}

function startModerateRight(){
	logger.info('startModerateRight: entered');
	rightStop();
	switch(v_state){
		case vertical_state.still:
		case vertical_state.going_forward:		
			leftForward();
			break;
	}
	logger.info('startModerateRight: exiting');
}

function startModerateLeft(){
	logger.info('startModerateLeft: entered');
	leftStop();
	switch(v_state){
		case vertical_state.still:
		case vertical_state.going_forward:
			rightForward();
			break;
	}
	logger.info('startModerateLeft: exiting');
}

function startSharpRight(){
	logger.info('startSharpRight: entered');
	switch(v_state){
		case vertical_state.still:		
		case vertical_state.going_forward:
			rightBackwards();
			leftForward();
			break;
		case vertical_state.going_backwards:
			rightForward();
			leftBackwards();
			break;			
		default:
			logger.error("don't recognize this state: " + v_state);			
	}
	logger.info('startSharpRight: exiting');
}

function startSharpLeft(){
	logger.info('startSharpLeft: entered');
	switch(v_state){
		case vertical_state.still:
		case vertical_state.going_forward:
			leftBackwards();
			rightForward();
			break;
		case vertical_state.going_backwards:
			leftForward();
			rightBackwards();
			break;	
		default:
			logger.error("don't recognize this state: " + v_state);
	}
	logger.info('startSharpLeft: exiting');
}

function stopTurning(){
	logger.info('stopTurning: entered');
	switch(v_state){
		case vertical_state.going_forward:
			forward();
			break;
		case vertical_state.going_backwards:
			backwards();
			break;
		case vertical_state.still:
			stop();
			break;
		default:
			logger.error('unknown v_state: ' + v_state);
	}		
	logger.info('stopTurning: exiting');
}

module.exports.setup = setup;
module.exports.teardown = teardown;
module.exports.forward = forward;
module.exports.backwards = backwards;
module.exports.stop = stop;
module.exports.startModerateRight = startModerateRight;
module.exports.startModerateLeft = startModerateLeft;
module.exports.startSharpRight = startSharpRight;
module.exports.startSharpLeft = startSharpLeft;
module.exports.stopTurning = stopTurning;

