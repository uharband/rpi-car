let express = require('express');
let audioRouter = express.Router();
let logger = require('../log');
let audioController = require('./audioController');
let audioHealth = require('./healthController');
let routerUtils = require('../routerUtils');
let config = require('config');


audioRouter.use((req, res, next) => {
    logger.info(req.originalUrl);
    next();
});

audioRouter.use((req, res, next) => {
    if(req.path.startsWith('/status')){
        next();
    }
    else {
        if (!config.modules.audio) {
            return routerUtils.handleModuleNotConfigured('audio', res);
        }
        if (!audioController.isActive()) {
            return routerUtils.handleModuleNotActive('audio', res);
        }
        next();
    }

});



/* -------------------------------------------------------

                       AUDIO

 ------------------------------------------------------ */
audioRouter.get('/on', function (req, res) {
    audioController.turnOn(function (error) {
            if (error !== "") {
                res.send("started audio");
            } else {
                res.send(error);
            }
        });
});


audioRouter.get('/off', function (req, res) {
    audioController.turnOff(function (error) {
            if (error !== "") {
                res.send("stopped audio");
            } else {
                res.send(error);
            }
        });
});

audioRouter.get('/status/connection', function (req, res) {
    audioHealth.isConnected((err, result) => {
        if (err) {
            res.status = 500;
            res.send({error: err.message});
        } else {
            res.send(result);
        }
    });
});

audioRouter.get('/status/test-recording', function (req, res) {
    logger.info('/audio/taketestrecording entered');

    audioHealth.takeTestRecording(function (err, snapshot) {
        if (err) {
            res.status = 500;
            res.send({error: err.message});
        } else {
            res.set('Location', snapshot);
            res.send("recording taken successfully: " + snapshot);
        }
    });
});

module.exports = audioRouter;