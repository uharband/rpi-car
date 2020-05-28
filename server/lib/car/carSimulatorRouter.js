let express = require('express');
let carSimulatorRouter = express.Router();

let carSimulator = require("./carSimulator");

carSimulatorRouter.get('/init-motor', function (req, res) {
    carSimulator.initMotor(req.query.motor, req.query.mode, req.query.pin1, req.query.pin2);
    res.send();
});

carSimulatorRouter.get('/forward', function (req, res) {
    carSimulator.forward(req.query.motor, req.query.speed);
    res.send();
});

carSimulatorRouter.get('/backwards', function (req, res) {
    carSimulator.backwards(req.query.motor, req.query.speed);
    res.send();
});

carSimulatorRouter.get('/forward', function (req, res) {
    carSimulator.stop(req.query.motor, req.query.speed);
    res.send();
});

module.exports = carSimulatorRouter;