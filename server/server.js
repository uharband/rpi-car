let express = require('express');
let app = express();

let logger = require('./lib/log');
let config = require('config');

let carController = require('./lib/car/carController');
let carRouter = require('./lib/car/carRouter');

let audioController = require('./lib/audio/audioController');
let audioRouter = require('./lib/audio/audioRouter');

let videoController = require('./lib/video/videoController');
let videoRouter = require('./lib/video/videoRouter');

let dryMode = false;
let active = false;

let startupTime;

// get command line args
if (process.argv.length > 2 && process.argv[2].toLowerCase() === 'drymode') {
    dryMode = true;
}
logger.info('dryMode = ' + dryMode);

// enabled modules
logger.info('enabled mudules:');
logger.info(config.modules);


// app static service
app.use(express.static(__dirname + '/app'));

// static serving of snapshots
app.use(express.static(__dirname + '/snapshots'));

// static serving of recordings
app.use(express.static(__dirname + '/recordings'));

app.use('/car', carRouter);
app.use('/video', videoRouter);
app.use('/audio', audioRouter);

app.use((req, res, next) => {
    logger.info(req.originalUrl);
    next();
});

let server = app.listen(8080, function () {
    startupTime = new Date();
    let host = server.address().address;
    let port = server.address().port;
    logger.info("raspberry car listening at http://%s:%s", host, port);
});

process.stdin.resume();//so the program will not close instantly


/* -------------------------------------------------------

                       SERVER

 ------------------------------------------------------ */

app.get('/status', (req, res) => {
    response = {};
    response.startupTime = startupTime.toString();
    response.modules = config.modules;
    res.send(response);
});

app.get('/start', function (req, res) {
    if (active) {
        logger.info('already active');
        res.send('was already active');
    } else {
        setup(() => {
            active = true;
            logger.info('start completed');
            res.send('start completed');
        });
    }

});
app.get('/stop', function (req, res) {
    if (!active) {
        logger.info('already not active');
        res.send('was already stopped');
    } else {
        shutdown(() => {
            active = false;
            logger.info('shutdown complete');
            res.send('stop completed');
        });
    }
});

function setup(callback) {
    let componentsRequiringSetup = getNumberOfActiveComponents();
    if (config.modules.video) {
        videoController.setup(dryMode, () => {
            componentsRequiringSetup--;
            if (componentsRequiringSetup === 0) {
                callback();
            }
        });
    }

    if (config.modules.audio) {
        audioController.setup(dryMode, () => {
            componentsRequiringSetup--;
            if (componentsRequiringSetup === 0) {
                callback();
            }
        });
    }

    if (config.modules.car) {
        carController.setup(dryMode, () => {
            componentsRequiringSetup--;
            if (componentsRequiringSetup === 0) {
                callback();
            }
        });
    }
}

function shutdown(callback) {
    let componentsRequiringShutdown = getNumberOfActiveComponents();

    if (config.modules.car) {
        carController.shutdown(() => {
            componentsRequiringShutdown--;
            if (componentsRequiringShutdown === 0) {
                callback();
            }
        });

    }
    if (config.modules.audio) {
        audioController.turnOff(() => {
            componentsRequiringShutdown--;
            if (componentsRequiringShutdown === 0) {
                callback();
            }
        });
    }

    if (config.modules.video) {
        videoController.turnOff(() => {
            componentsRequiringShutdown--;
            if (componentsRequiringShutdown === 0) {
                callback();
            }
        });
    }
}

function getNumberOfActiveComponents() {
    let numberOfComponents = 0;
    if (config.modules.car) {
        numberOfComponents++;
    }
    if (config.modules.audio) {
        numberOfComponents++;
    }
    if (config.modules.video) {
        numberOfComponents++;
    }
    return numberOfComponents;
}

function exitHandler(options, err) {
    if (active) {
        shutdown(() => {
            if (options.cleanup) console.log('clean');
            if (err) console.log('error: ' + err.stack);
            if (options.exit) {
                process.exit();
            }
        });
    } else {
        if (options.exit) {
            process.exit();
        }
    }
}


//do something when app is closing	//do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

process.on('uncaughtException', (err) => {
    let message = 'got an unhandled exception. exiting the process';
    if (err) {
        message += ': ' + err.message + ', stack: ' + err.stack;
    }
    logger.error(message);
    exitHandler(null, {exit: true});
});
