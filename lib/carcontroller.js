'use strict';

var rpio = null;
var Enum = require('enum');
var logger = require('./log');
var config = require('config');

///////////////// Define Motor Driver GPIO Pins /////////////////
// the pi has 2 pwm channels.
// one containing 32 and 12. the second contains 33 and 35
// both pins on each channel are controlled the together and cannot get a separete duty cycle
// Motor A, Left Side GPIO CONSTANTS
var left_forward = 32;	// IN1 - Forward Drive
var left_backward = 33;	// IN2 - Reverse Drive
// Motor B, Right Side GPIO CONSTANTS
var right_forward = 12;	// IN1 - Forward Drive
var right_backward = 35;	// IN2 - Reverse Drive


var requested_operation = 'none';
var last_executed = 'none';
var executing = false;
var dryMode = false;
var currentSpeed = 0;

setInterval(function () {
    work();
}, 100);

function work() {
    //logger.info('requested: ' + requested_operation + ' last: ' + last_executed);
    if (executing) {
        return;
    }
    if (requested_operation === 'none') {
        return;
    }
    if (requested_operation === last_executed) {
        return;
    }
    executing = true;
    last_executed = requested_operation;
    logger.info('about to execute: ' + requested_operation);
    switch (requested_operation) {
        case 'forward':
            forward();
            break;
        case 'backwards':
            backwards();
            break;
        case 'increaseForwardSpeed':
            increaseForwardSpeed();
            break;
        case 'increaseBackwardSpeed':
            increaseBackwardSpeed();
            break;
        case 'stop':
            stop();
            break;
        case 'startModerateRight':
            startModerateRight();
            break;
        case 'startSharpRight':
            startSharpRight();
            break;
        case 'startModerateLeft':
            startModerateLeft();
            break;
        case 'startSharpLeft':
            startSharpLeft();
            break;
        case 'stopTurning':
            stopTurning();
            break;
    }
    executing = false;
}

// setup: open all pins and set them to LOW which is OFF
function setup(_dryMode) {
    if(_dryMode !== null){
        dryMode = _dryMode;
    }

    currentSpeed = config.initialSpeed;
    logger.info('initial speed is ' + config.initialSpeed);

    if(dryMode){
        return;
    }

    rpio = require('rpio');

    rpio.init({
        gpiomem: false,          /* Use /dev/gpiomem */
        mapping: 'physical'
    });

    rpio.pwmSetClockDivider(64);

    stop();
    /*
    rpio.open(right_forward, rpio.PWM);
    rpio.open(right_backward, rpio.PWM);
    rpio.open(left_forward, rpio.PWM);
    rpio.open(left_backward, rpio.PWM);

    // set range - the pwm range is betwee 0 and 100
    // 0 means each cycle no HIGH power will be sent to the pin
    // 100 means each cycle, the entire cycle will get HIGH
    rpio.pwmSetRange(right_forward, config.pwmRange);
    rpio.pwmSetRange(right_backward, config.pwmRange);
    rpio.pwmSetRange(left_forward, config.pwmRange);
    rpio.pwmSetRange(left_backward, config.pwmRange);

    rpio.pwmSetData(right_forward, 0);
    rpio.pwmSetData(left_forward, 0);

    rpio.pwmSetData(right_backward, 0);
    rpio.pwmSetData(left_backward, 0);
    */
}

function setupPinAsPWM(pin, data){
    logger.info('setupAsPWM. pin ' + pin + ', data ' + data);
    if(dryMode){
        return;
    }
    rpio.open(pin, rpio.PWM);
    rpio.pwmSetRange(pin, config.pwmRange);
    rpio.pwmSetData(pin, data);
}

function setupPinAsNormal(pin, requiredVoltage){
    logger.info('setupAsNormal. pin ' + pin + ', voltage ' + requiredVoltage);
    if(dryMode){
        return;
    }
    if(requiredVoltage === voltage.high){
        rpio.open(pin, rpio.OUTPUT, rpio.HIGH);
    }
    else if(requiredVoltage === voltage.low){
        rpio.open(pin, rpio.OUTPUT, rpio.LOW);
    }
}


function teardown() {
    if(dryMode){
        return;
    }
    rpio.close(right_forward);
    rpio.close(right_backward);
    rpio.close(left_forward);
    rpio.close(left_backward);
}

var vertical_state = new Enum(['going_forward', 'going_backwards', 'still']);
var horizontal_state = new Enum(['none', 'right_moderate', 'right_sharp', 'left_moderate', 'left_sharp']);
var v_state = vertical_state.still;
var h_state = horizontal_state.none;
var pin_mode = {off: 'off', normal: 'normal', pwm: 'pwm'};
var voltage = {high: 'high', low: 'low'};
var pin_states = {};
pin_states[right_forward] = pin_mode.off;
pin_states[left_forward] = pin_mode.off;
pin_states[right_backward] = pin_mode.off;
pin_states[left_backward] = pin_mode.off;

function increaseForwardSpeed(){
    logger.info('entered increaseForwardSpeed. currentSpeed=' + currentSpeed + ', speedMax=' + config.speedMax + ', v_state=' + v_state);
    if(v_state === vertical_state.going_forward && currentSpeed === config.speedMax){
        return;
    }
    switch(v_state){
        case vertical_state.going_forward:
            changeSpeed('up');
            forward();
            break;
        case vertical_state.going_backwards:
            changeSpeed('down');
            if(currentSpeed < config.speedMin){
                logger.info('speed fell below minimum speed ' + config.speedMin + ' stopping');
                stop();
            }
            else{
                backwards();
            }
            break;
        case vertical_state.still:
            if(currentSpeed < config.speedMin){
                changeSpeed('min');
            }
            forward();
            break;
    }
}

function increaseBackwardSpeed(){
    logger.info('entered increaseBackwardSpeed. currentSpeed=' + currentSpeed + ', speedMax=' + config.speedMax + ', v_state=' + v_state);
    if(v_state === vertical_state.going_backwards && currentSpeed === config.speedMax){
        return;
    }
    switch(v_state){
        case vertical_state.going_forward:
            changeSpeed('down');
            logger.info('speed changed! new speed: ' + currentSpeed);
            if(currentSpeed < config.speedMin){
                logger.info('speed fell below minimum speed ' + config.speedMin + ' stopping');
                stop();
            }
            else{
                forward();
            }
            break;
        case vertical_state.going_backwards:
            changeSpeed('up');
            backwards();
            break;
        case vertical_state.still:
            if(currentSpeed < config.speedMin){
                changeSpeed('min');
            }
            backwards();
            break;
    }
}

function changeSpeed(direction){
    switch(direction){
        case 'up':
            currentSpeed += config.speedChangeStep;
            break;
        case 'down':
            currentSpeed -= config.speedChangeStep;
            break;
        case 'min':
            currentSpeed = config.speedMin;
            break;
    }
    logger.info('speed changed! new speed: ' + currentSpeed);
}

function rightForward() {
    logger.info('entered rightForward. currentSpeed=' + currentSpeed);
    setupPinAsPWM(right_forward, currentSpeed);
    setupPinAsPWM(right_backward, 0);
    //rpio.pwmSetData(right_forward, currentSpeed);
    //rpio.pwmSetData(right_backward, 0);
}

function rightBackwards() {
    logger.info('entered rightBackwards. currentSpeed=' + currentSpeed);
    setupPinAsPWM(right_backward, currentSpeed);
    setupPinAsPWM(right_forward, 0);
    //rpio.pwmSetData(right_backward, currentSpeed);
    //rpio.pwmSetData(right_forward, 0);
}

function leftForward() {
    logger.info('entered leftForward. currentSpeed=' + currentSpeed);
    setupPinAsPWM(left_forward, currentSpeed);
    setupPinAsPWM(left_backward, 0);
    //rpio.pwmSetData(left_forward, currentSpeed);
    //rpio.pwmSetData(left_backward, 0);
}

function leftBackwards() {
    logger.info('entered leftBackwards. currentSpeed=' + currentSpeed);
    setupPinAsPWM(left_backward, currentSpeed);
    setupPinAsPWM(left_forward, 0);
    //rpio.pwmSetData(left_backward, currentSpeed);
    //rpio.pwmSetData(left_forward, 0);
}

function rightStop() {
    logger.info('entered rightStop');
    //rpio.pwmSetData(right_backward, 0);
    //rpio.pwmSetData(right_forward, 0);
    setupPinAsNormal(right_backward, voltage.low);
    setupPinAsNormal(right_forward, voltage.low);
}

function leftStop() {
    logger.info('entered leftStop');

    //rpio.pwmSetData(left_backward, 0);
    //rpio.pwmSetData(left_forward, 0);
    setupPinAsNormal(left_backward, voltage.low);
    setupPinAsNormal(left_forward, voltage.low);
}

function forward() {
    logger.info('forward: entered. vertical_state is ' + v_state + ', speed is ' + currentSpeed);
    rightForward();
    leftForward();
    v_state = vertical_state.going_forward;
    logger.info('forward: exiting. vertical_state is ' + v_state);
}

function backwards() {
    logger.info('backwards: entered. vertical_state is ' + v_state + ', speed is ' + currentSpeed);
    rightBackwards();
    leftBackwards();
    v_state = vertical_state.going_backwards;
    logger.info('backwards: uexiting. vertical_state is ' + v_state);
}

function stop() {
    logger.info('stop: entered. vertical_state is ' + v_state + ', speed is ' + currentSpeed);
    leftStop();
    rightStop();
    v_state = vertical_state.still;
    logger.info('stop: exiting. vertical_state is ' + v_state);
}

function startModerateRight() {
    logger.info('startModerateRight: entered. vertical_state is ' + v_state);
    rightStop();
    switch (v_state) {
        case vertical_state.still:
        case vertical_state.going_forward:
            leftForward();
            break;
    }
    logger.info('startModerateRight: exiting');
}

function startModerateLeft() {
    logger.info('startModerateLeft: entered. vertical_state is ' + v_state);
    leftStop();
    switch (v_state) {
        case vertical_state.still:
        case vertical_state.going_forward:
            rightForward();
            break;
    }
    logger.info('startModerateLeft: exiting');
}

function startSharpRight() {
    logger.info('startSharpRight: entered. vertical_state is ' + v_state);
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
    logger.info('startSharpLeft: entered. vertical_state is ' + v_state);
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
    logger.info('stopTurning: entered. v_state is ' + v_state);
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

function execute(operation) {
    logger.info('execute: entered. operation: ' + operation);
    if(operation === 'increaseForwardSpeed' || operation === 'increaseBackwardSpeed'){
        last_executed = '';
    }
    requested_operation = operation;
}

module.exports.execute = execute;
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
module.exports.increaseForwardSpeed = increaseForwardSpeed;
module.exports.increaseBackwardSpeed = increaseBackwardSpeed;
