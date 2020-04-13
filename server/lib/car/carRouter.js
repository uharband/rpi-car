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
    carController.execute('forward');
});


carRouter.get('/increaseForwardSpeed', function (req, res) {
    res.send('increasing forward speed');
    carController.execute('increaseForwardSpeed');
});

carRouter.get('/increaseBackwardSpeed', function (req, res) {
    res.send('increasing backward speed');
    carController.execute('increaseBackwardSpeed');
});


carRouter.get('/backward', function (req, res) {
    res.send('going backwards');
    carController.execute('backwards');
});

carRouter.get('/increaseBackwardsSpeed', function (req, res) {
    res.send('increasing backwards speed');
    carController.execute('forward');
});

carRouter.get('/decreaseBackwardsSpeed', function (req, res) {
    res.send('decreasing backwards speed');
    carController.execute('forward');
});

carRouter.get('/moderateRight', function (req, res) {
    res.send('moderate right');
    carController.execute('startModerateRight');
});

carRouter.get('/moderateLeft', function (req, res) {
    res.send('moderate left');
    carController.execute('startModerateLeft');
});

carRouter.get('/sharpRight', function (req, res) {
    res.send('sharp right');
    carController.execute('startSharpRight');
});

carRouter.get('/sharpLeft', function (req, res) {
    res.send('sharp left');
    carController.execute('startSharpLeft');
});

carRouter.get('/stopTurning', function (req, res) {
    res.send('stopped turning');
    carController.execute('stopTurning');
});

carRouter.get('/stop', function (req, res) {
    res.send('stop');
    carController.execute('stop');
});

carRouter.get('/state', function (req, res) {
    let direction = req.query.direction;
    let speed = req.query.speed;
    let eventId = req.query.eventId;
    logger.info('direction=' + direction + ', speed=' + speed + ', eventId=' + eventId);
    if (!config.modules.car) {
        return handleModuleNotConfigured('car', res);
    } else {
        carController.addCommand(speed, direction, eventId, (state) => {
            res.send({direction: state.direction, speed: state.speed, eventId: state.eventId});
        });
    }
});

module.exports = carRouter;