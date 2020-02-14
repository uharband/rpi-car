let express = require('express');
let videoRouter = express.Router();
let logger = require('../log');
let videoController = require('./videoController');
let videoHealth = require('./healthController');
let routerUtils = require('../routerUtils');
let config = require('config');


videoRouter.use((req, res, next) => {
    logger.info(req.originalUrl);
    next();
});

videoRouter.use((req, res, next) => {
    if (req.path.startsWith('/status')) {
        next();
    } else {
        if (!config.modules.video) {
            return routerUtils.handleModuleNotConfigured('video', res);
        }
        if (!videoController.isActive()) {
            return routerUtils.handleModuleNotActive('video', res);
        }
        next();
    }
});


/* -------------------------------------------------------

                       VIDEO

 ------------------------------------------------------ */

videoRouter.get('/on', function (req, res) {
    videoController.turnOn(function (err) {
        if (err) {
            res.status = 500;
            res.send({action: "video turn on", result: "error", message: err.message});
        } else {
            res.send({action: "video turn on", result: "success"});
        }
    });
});

videoRouter.get('/off', function (req, res) {
    videoController.turnOff(function (err) {
        if (err) {
            res.status = 500;
            res.send({action: "video turn off", result: "error", message: err.message});
        } else {
            res.send({action: "video turn off", result: "success"});
        }
    });

});

videoRouter.post('/snapshots', function (req, res) {
    videoController.takeSnapshot(function (err, snapshot) {
        if (err) {
            res.status = 500;
            res.send({action: "video take snapshot", result: "error", message: err.message});
        } else {
            res.set('Location', snapshot);
            res.send({action: "video take snapshot", result: "success"});
        }
    });

});

videoRouter.get('/take-snapshot', function (req, res) {
    videoController.takeSnapshot(function (err, snapshot) {
        if (err) {
            res.status = 500;
            res.send({action: "video take snapshot", result: "error", message: err.message});
        } else {
            res.set('Location', snapshot);
            res.send({action: "video take snapshot", result: "success"});
        }
    });

});

videoRouter.delete('/snapshots/:snapshot', function (req, res) {
    let snapshotName = req.params.snapshot;

    videoController.deleteSnapshot(snapshotName, function (err) {
        if (err) {
            res.status = 500;
            res.send({action: "video delete snapshot", result: "error", message: err.message});
        } else {
            res.send({action: "video delete snapshot", result: "success"});
        }
    });
});

videoRouter.get('/configure', function (req, res) {
    let width = (isNaN(parseInt(req.query.width)) ? null : parseInt(req.query.width));
    let height = (isNaN(parseInt(req.query.height)) ? null : parseInt(req.query.height));
    let jpgQuality = (isNaN(parseInt(req.query.jpgQuality)) ? null : parseInt(req.query.jpgQuality));
    let fps = (isNaN(parseInt(req.query.fps)) ? null : parseInt(req.query.fps));
    let verticalFlip = null;
    if (req.query.verticalFlip === undefined) {
        verticalFlip = null;
    } else if (req.query.verticalFlip !== 'true' && req.query.verticalFlip !== 'false') {
        // return error
        res.send('error: verticalFlip must be true or false');
    } else {
        verticalFlip = (req.query.verticalFlip === 'true');
    }

    videoController.configure(width, height, verticalFlip, jpgQuality, fps, function (error) {
        if (error !== "") {
            res.send("configured successfully");
        } else {
            res.send(error);
        }
    });
});

videoRouter.get('/status/connection', function (req, res) {
    videoHealth.isConnected((err, result) => {
        if (err) {
            res.status = 500;
            res.send({error: err.message});
        } else {
            res.send(result);
        }
    });
});

videoRouter.get('/status/test-snapshot', function (req, res) {
    videoHealth.takeTestSnapshot(function (err, snapshot) {
        if (err) {
            res.status = 500;
            res.send({error: err.message});
        } else {
            res.set('Location', snapshot);
            res.send("snapshot taken successfully: " + snapshot);
        }
    });
});

module.exports = videoRouter;