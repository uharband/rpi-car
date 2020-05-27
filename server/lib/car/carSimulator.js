const Motor = require("./Motor");
const leftMotor = new Motor();
const rightMotor = new Motor();

function initMotor(motor, mode, pin1, pin2) {

    let theMotor = resolveMotor(motor);
    theMotor.setup(mode, pin1, pin2);
}

function forward(motor, speed) {
    let theMotor = resolveMotor(motor);
    theMotor.forward(speed);
}

function backwards(motor, speed) {
    let theMotor = resolveMotor(motor);
    theMotor.backwards(speed);
}

function stop(motor) {
    let theMotor = resolveMotor(motor);
    theMotor.stop();
}

function resolveMotor(motor) {
    return (motor === right ? rightMotor : leftMotor)
}

module.exports.initMotor = initMotor;
module.exports.forward = forward;
module.exports.backwards = backwards;
module.exports.stop = stop;