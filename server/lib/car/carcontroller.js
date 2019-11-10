'use strict';

let rpio = null;
let Enum = require('enum');
let logger = require('../log');
let config = require('config');

let raspi;
let pwm;

///////////////// Define Motor Driver GPIO Pins /////////////////
// since we're using software PWM we can control each GPIO pin independently
// this allows us to use any GPIO pin
// Motor A, Right Side GPIO CONSTANTS
let right_forward_pin = config.car.right_forward_pin; // 'P1-32';	// IN1 - Forward Drive
let right_backward_pin = config.car.right_backward_pin; // 'P1-33';	// IN2 - Reverse Drive
// Motor B, Left Side GPIO CONSTANTS
let left_forward_pin = config.car.left_forward_pin; // 'P1-12';	    // IN1 - Forward Drive
let left_backward_pin = config.car.left_backward_pin; // 'P1-35';	// IN2 - Reverse Drive

let right_forward;
let right_backwards;
let left_forward;
let left_backwards;


let dryMode = false;


let vertical_state = new Enum(['going_forward', 'going_backwards', 'still']);
let horizontal_state = new Enum(['none', 'right_moderate', 'right_sharp', 'left_moderate', 'left_sharp']);
let v_state = vertical_state.still;
let h_state = horizontal_state.none;

let direction = new Enum(['forward', 'backwards', 'right', 'left', 'none']);

let currentSpeed = 0;
let currentDirection = direction.none;

let commands = [];
let currentCommand = 0;

let requestedState = {};
let executingState = {};

setInterval(function () {
    work();
}, 10);

// setup: open all pins and set them to LOW which is OFF
function setup(_dryMode) {
    logger.info('setup car entered. dryMode: ' + _dryMode);
    if(_dryMode !== null){
        dryMode = _dryMode;
    }

    currentSpeed = 0;

    if(dryMode){
        return;
    }

    raspi = require('raspi');
    pwm = require('raspi-soft-pwm');

    raspi.init(function () {
        right_forward = new pwm.SoftPWM(right_forward_pin);
        right_backwards = new pwm.SoftPWM(right_backward_pin);
        left_forward = new pwm.SoftPWM(left_forward_pin);
        left_backwards = new pwm.SoftPWM(left_backward_pin);

        stop();
    });
}

function teardown(callback) {
    if(dryMode){
        return callback();
    }
    if(right_forward !== null && right_forward !== undefined){
        right_forward.destroy();
    }
    if(right_backwards !== null && right_backwards !== undefined){
        right_backwards.destroy();
    }
    if(left_forward !== null && left_forward !== undefined){
        left_forward.destroy();
    }
    if(left_backwards !== null && left_backwards !== undefined){
        left_backwards.destroy();
    }
    return callback();
}

function work() {
    //logger.info('requested: ' + requested_operation + ' last: ' + last_executed);
    if(commands[currentCommand] === undefined){
        return;
    }

    if(commands[currentCommand].executing === true) {
        logger.info('still executing previous command');
        return;
    }

    commands[currentCommand].executing = true;

    applyState(commands[currentCommand]);

    commands[currentCommand].done(commands[currentCommand]);

    commands[currentCommand].executing = false;
    currentCommand++;


}

function addCommand(requestedSpeed, requestedDirection, eventId, cb) {
    let command = {};
    command.speed = requestedSpeed;
    command.eventId = eventId;
    command.done = cb;
    command.executing = false;

    switch(requestedDirection.toLowerCase()){
        case 'up':
            command.direction = direction.forward;
            break;
        case 'down':
            command.direction = direction.backwards;
            break;
        case 'right':
            command.direction = direction.right;
            break;
        case 'left':
            command.direction = direction.left;
            break;
        case 'none':
            command.direction = direction.none;
            break;
    }
    logger.info('adding command ' + JSON.stringify(command));
    commands.push(command);
}

function applyState(command) {
    logger.info('applyState - entered. currentSpeed=' + currentSpeed + ', currentDirection=' + currentDirection);

    let incomingSpeed = command.speed;
    if(incomingSpeed >= config.joystick.maxDistance){
        incomingSpeed = config.joystick.maxDistance;
    }

    let adjustedIncomingSpeed = 100 * incomingSpeed / config.joystick.maxDistance;
    let newSpeed = Math.floor(config.car.minSpeed + ((100-config.car.minSpeed)/100*adjustedIncomingSpeed));


    if(currentDirection === command.direction && newSpeed === currentSpeed){
        logger.info('no change from previous state, returning');
        return;
    }

    if(newSpeed !== currentSpeed){
        setSpeed(newSpeed);
    }

    switch (command.direction){
        case direction.forward:
            forward();
            break;
        case direction.backwards:
            backwards();
            break;
        case direction.right:
            startModerateRight();
            break;
        case direction.left:
            startModerateLeft();
            break;
        case direction.none:
            stop();
            break;
    }
    logger.info('applyState - done');
}

function setSpeed(speed) {
    logger.info('current speed = ' + currentSpeed + ', new speed = ' + speed);
    currentSpeed = speed;
}

function rightForward() {
    logger.info('entered rightForward. currentSpeed=' + currentSpeed);
    if(dryMode){
        return;
    }
    right_forward.write(currentSpeed/100);
    right_backwards.write(0);
}

function rightBackwards() {
    logger.info('entered rightBackwards. currentSpeed=' + currentSpeed);
    if(dryMode){
        return;
    }
    right_backwards.write(currentSpeed/100);
    right_forward.write(0);
}

function leftForward() {
    logger.info('entered leftForward. currentSpeed=' + currentSpeed);
    if(dryMode){
        return;
    }
    left_forward.write(currentSpeed/100);
    left_backwards.write(0);
}

function leftBackwards() {
    logger.info('entered leftBackwards. currentSpeed=' + currentSpeed);
    if(dryMode){
        return;
    }
    left_backwards.write(currentSpeed/100);
    left_forward.write(0);
}

function rightStop() {
    logger.info('entered rightStop');
    if(dryMode){
        return;
    }
    right_forward.write(0);
    right_backwards.write(0);
}

function leftStop() {
    logger.info('entered leftStop');
    if(dryMode){
        return;
    }
    left_forward.write(0);
    left_backwards.write(0);
}

function forward() {
    logger.info('forward: entered. vertical_state is ' + v_state.toString() + ', speed is ' + currentSpeed);
    rightForward();
    leftForward();
    v_state = vertical_state.going_forward;
    currentDirection = direction.forward;
    logger.info('forward: exiting. vertical_state is ' + v_state.toString());
}

function backwards() {
    logger.info('backwards: entered. vertical_state is ' + v_state.toString() + ', speed is ' + currentSpeed);
    rightBackwards();
    leftBackwards();
    v_state = vertical_state.going_backwards;
    currentDirection = direction.backwards;
    logger.info('backwards: uexiting. vertical_state is ' + v_state.toString());
}

function stop() {
    logger.info('stop: entered. vertical_state is ' + v_state.toString() + ', speed is ' + currentSpeed);
    leftStop();
    rightStop();
    v_state = vertical_state.still;
    currentDirection = direction.none;
    logger.info('stop: exiting. vertical_state is ' + v_state.toString());
}

function startModerateRight() {
    logger.info('startModerateRight: entered. vertical_state is ' + v_state.toString());
    rightStop();
    switch (v_state) {
        case vertical_state.still:
        case vertical_state.going_forward:
            leftForward();
            break;
    }
    currentDirection = direction.right;
    logger.info('startModerateRight: exiting');
}

function startModerateLeft() {
    logger.info('startModerateLeft: entered. vertical_state is ' + v_state.toString());
    leftStop();
    switch (v_state) {
        case vertical_state.still:
        case vertical_state.going_forward:
            rightForward();
            break;
    }
    currentDirection = direction.left;
    logger.info('startModerateLeft: exiting');
}

function startSharpRight() {
    logger.info('startSharpRight: entered. vertical_state is ' + v_state.toString());
    switch (v_state) {
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

function startSharpLeft() {
    logger.info('startSharpLeft: entered. vertical_state is ' + v_state.toString());
    switch (v_state) {
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

function stopTurning() {
    logger.info('stopTurning: entered. v_state is ' + v_state.toString());
    switch (v_state) {
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
module.exports.addCommand = addCommand;
