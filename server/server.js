// get command line args
if (process.argv.length > 2 && process.argv[2].toLowerCase() === 'drymode') {
    global.dryMode = true;
}
else{
    global.dryMode = false;
}

let express = require('express');
let async = require('async');
let app = express();

let logger = require('./lib/log');
let config = require('config');

let moduleManagementRouter = require('./lib/moduleManagement/moduleManagementRouter');

let carController = require('./lib/car/carController');
let carRouter = require('./lib/car/carRouter');

let carSimulatorRouter = require('./lib/car/carSimulatorRouter');

let audioController = require('./lib/audio/audioController');
let audioRouter = require('./lib/audio/audioRouter');

let videoController = require('./lib/video/videoController');
let videoRouter = require('./lib/video/videoRouter');

let active = false;

let startupTime;


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

app.use('/modules', moduleManagementRouter);
app.use('/car', carRouter);
app.use('/car-simulator', carSimulatorRouter);
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
    logger.info('setup: entered');

    let setupFunctions = [];

    if (config.modules.car) {
        logger.info('car is enabled. adding to setup functions');
        setupFunctions.push(carController.setup);
    }
    if (config.modules.video) {
        logger.info('video is enabled. adding to setup functions');
        setupFunctions.push(videoController.setup);
    }
    if (config.modules.audio) {
        logger.info('audio is enabled. adding to setup functions');
        setupFunctions.push(audioController.setup);
    }

    async.series(setupFunctions, (err, res) =>{
        if(err){
            logger.error('error while setting up: ' + err.message);
        }
        else{
            logger.info('setup completed successfully');
        }
        callback(err);
    });
}

function shutdown(callback) {
    let shutdownFunctions = [];

    if (config.modules.video) {
        logger.info('video is enabled. adding to shutdown functions');
        shutdownFunctions.push(videoController.shutdwon);
    }
    if (config.modules.audio) {
        logger.info('audio is enabled. adding to shutdown functions');
        shutdownFunctions.push(audioController.shutdown);
    }
    if (config.modules.car) {
        logger.info('car is enabled. adding to shutdown functions');
        shutdownFunctions.push(carController.shutdown);
    }

    async.series(shutdownFunctions, (err, res) =>{
        if(err){
            logger.error('error while shutting down: ' + err.message);
        }
        else{
            logger.info('shutdown completed successfully');
        }
        callback(err);
    });
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
