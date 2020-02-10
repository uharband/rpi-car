let express = require('express');
let carRouter = express.Router();
let logger = require('../log');
let carController = require('./carController');
let routerUtils = require('../routerUtils');
let config = require('config');


carRouter.use((req, res, next) => {
    logger.info(req.originalUrl);
    next()
});

carRouter.use((req, res, next) => {
    if(req.path.startsWith('/status')){
        next();
    }
    else {
        if (!config.modules.car) {
            return routerUtils.handleModuleNotConfigured('car', res);
        }
        if (!carController.isActive()) {
            return routerUtils.handleModuleNotActive('car', res);
        }
        next();
    }

});


/* -------------------------------------------------------

                       CAR

 ------------------------------------------------------ */

carRouter.get('/forward', function (req, res) {
    res.send('going forward');
    car.execute('forward');
});


carRouter.get('/increaseForwardSpeed', function (req, res) {
    res.send('increasing forward speed');
    car.execute('increaseForwardSpeed');
});

carRouter.get('/increaseBackwardSpeed', function (req, res) {
    res.send('increasing backward speed');
    car.execute('increaseBackwardSpeed');
});


carRouter.get('/backward', function (req, res) {
    res.send('going backwards');
    car.execute('backwards');
});

carRouter.get('/increaseBackwardsSpeed', function (req, res) {
    res.send('increasing backwards speed');
    car.execute('forward');
});

carRouter.get('/decreaseBackwardsSpeed', function (req, res) {
    res.send('decreasing backwards speed');
    car.execute('forward');
});

carRouter.get('/moderateRight', function (req, res) {
    res.send('moderate right');
    car.execute('startModerateRight');
});

carRouter.get('/moderateLeft', function (req, res) {
    res.send('moderate left');
    car.execute('startModerateLeft');
});

carRouter.get('/sharpRight', function (req, res) {
    res.send('sharp right');
    car.execute('startSharpRight');
});

carRouter.get('/sharpLeft', function (req, res) {
    res.send('sharp left');
    car.execute('startSharpLeft');
});

carRouter.get('/stopTurning', function (req, res) {
    res.send('stopped turning');
    car.execute('stopTurning');
});

carRouter.get('/stop', function (req, res) {
    res.send('stop');
    car.execute('stop');
});

carRouter.get('/state', function (req, res) {
    let direction = req.query.direction;
    let speed = req.query.speed;
    let eventId = req.query.eventId;
    logger.info('direction=' + direction + ', speed=' + speed + ', eventId=' + eventId);
    if (!config.modules.car) {
        return handleModuleNotConfigured('car', res);
    } else {
        car.addCommand(speed, direction, eventId, (state) => {
            res.send({direction: state.direction, speed: state.speed, eventId: state.eventId});
        });
    }
});

module.exports = carRouter;