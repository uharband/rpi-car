let express = require('express');
let app = express();
let fs = require('fs');
let shell = require('shelljs');
let Enum = require('enum');
let logger = require('./lib/log');
let config = require('config');

let videoHealth = require('./lib/video/health');
let audioHealth = require('./lib/audio/health');
let utils = require('./lib/utils');

let dryMode = false;
let exiting = false;

// get command line args
if (process.argv.length > 2 && process.argv[2].toLowerCase() === 'drymode') {
    dryMode = true;
}
logger.info('dryMode = ' + dryMode);

// enabled modules
logger.info('enabled mudules:');
logger.info(config.modules);

let car;
let audio;
let video;

let startupTime;


// app static service
app.use(express.static(__dirname + '/app'));

// static serving of snapshots
app.use(express.static(__dirname + '/snapshots'));

// static serving of recordings
app.use(express.static(__dirname + '/recordings'));


// don't automatically setup server
/*
setup(() =>{
    logger.info('setup complete')
});

 */

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

app.get('/shutdown', function (req, res) {
    logger.info('/shutdown entered');

    shutdown(() => {
        logger.info('after shutting down. exiting process');
        process.exit(0);
    });
});


/* -------------------------------------------------------

                       VIDEO

 ------------------------------------------------------ */

app.get('/video/on', function (req, res) {
    logger.info('/video/on entered');

    if (!config.modules.video) {
        return handleModuleNotConfigured('video', res);
    } else {
        video.turnOn(function (error) {
            if (error === "") {
                res.send("started video");
            } else {
                res.send(error);
            }
        });
    }
});

app.get('/video/off', function (req, res) {
    logger.info('/video/off entered');

    if (!config.modules.video) {
        return handleModuleNotConfigured('video', res);
    } else {
        video.turnOff(function (error) {
            if (error !== "") {
                res.send("stopped video");
            } else {
                res.send(error);
            }
        });
    }
});

app.post('/video/snapshots', function (req, res) {
    logger.info('/video/snapshots entered');

    if (!config.modules.video) {
        return handleModuleNotConfigured('video', res);
    } else {
        video.takeSnapshot(function (error, snapshot) {
            if (error !== "") {
                res.set('Location', snapshot);
                res.send("snapshot taken successfully: " + snapshot);
            } else {
                res.send(error);
            }
        });
    }
});

app.delete('/video/snapshots/:snapshot', function (req, res) {
    logger.info('DELETE /video/snapshots/snapshot entered');
    let snapshotName = req.params.snapshot;
    if (!config.modules.video) {
        return handleModuleNotConfigured('video', res);
    } else {
        video.deleteSnapshot(snapshotName, function (err) {
            if (err) {
                res.send("error deleting snapshot " + snapshotName + ": " + err.toString());
            } else {
                res.send('snapshot ' + snapshotName + ' deleted successfully');
            }
        });
    }
});

app.get('/video/configure', function (req, res) {
    logger.info('/video/configure entered');

    if (!config.modules.video) {
        return handleModuleNotConfigured('video', res);
    } else {
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


        video.configure(width, height, verticalFlip, jpgQuality, fps, function (error) {
            if (error !== "") {
                res.send("configured successfully");
            } else {
                res.send(error);
            }
        });
    }
});


app.get('/video/state', function (req, res) {
    logger.info('/video/state entered');

    videoHealth.isConnected((err, result) => {
        if (err) {
            res.status = 500;
            res.send({error: err.message});
        } else {
            res.send(result);
        }
    });
});

app.get('/video/testsnapshot', function (req, res) {
    logger.info('/video/testsnapshot entered');

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


/* -------------------------------------------------------

                       AUDIO

 ------------------------------------------------------ */
app.get('/audio/on', function (req, res) {
    logger.info('/audio/on entered');

    if (!config.modules.audio) {
        return handleModuleNotConfigured('audio', res);
    } else {
        audio.turnOn(function (error) {
            if (error !== "") {
                res.send("started audio");
            } else {
                res.send(error);
            }
        });
    }
});


app.get('/audio/off', function (req, res) {
    logger.info('/audio/off entered');

    if (!config.modules.audio) {
        return handleModuleNotConfigured('audio', res);
    } else {
        audio.turnOff(function (error) {
            if (error !== "") {
                res.send("stopped audio");
            } else {
                res.send(error);
            }
        });
    }
});

app.get('/audio/state', function (req, res) {
    logger.info('/audio/state entered');

    audioHealth.isConnected((err, result) => {
        if (err) {
            res.status = 500;
            res.send({error: err.message});
        } else {
            res.send(result);
        }
    });
});

app.get('/audio/taketestrecording', function (req, res) {
    logger.info('/audio/taketestrecording entered');

    audioHealth.isConnected((err, result) => {
        if (err) {
            res.status = 500;
            res.send({error: err.message});
        } else {
            audioHealth.takeTestRecording(result.card, result.device,function (err, snapshot) {
                if (err) {
                    res.status = 500;
                    res.send({error: err.message});
                } else {
                    res.set('Location', snapshot);
                    res.send("recording taken successfully: " + snapshot);
                }
            });
        }

    });
});


/* -------------------------------------------------------

                       CAR

 ------------------------------------------------------ */

app.get('/forward', function (req, res) {
    logger.info('entered /forward');

    if (!config.modules.car) {
        return handleModuleNotConfigured('car', res);
    } else {
        res.send('going forward');
        car.execute('forward');
    }

});


app.get('/increaseForwardSpeed', function (req, res) {
    logger.info('entered /increaseForwardSpeed');

    if (!config.modules.car) {
        return handleModuleNotConfigured('car', res);
    } else {
        res.send('increasing forward speed');
        car.execute('increaseForwardSpeed');
    }
});

app.get('/increaseBackwardSpeed', function (req, res) {
    logger.info('entered /increaseBackwardSpeed');

    if (!config.modules.car) {
        return handleModuleNotConfigured('car', res);
    } else {
        res.send('increasing backward speed');
        car.execute('increaseBackwardSpeed');
    }
});


app.get('/backward', function (req, res) {
    logger.info('entered /backward');

    if (!config.modules.car) {
        return handleModuleNotConfigured('car', res);
    } else {
        res.send('going backwards');
        car.execute('backwards');
    }
});

app.get('/increaseBackwardsSpeed', function (req, res) {
    logger.info('entered /increaseBackwardsSpeed');

    if (!config.modules.car) {
        return handleModuleNotConfigured('car', res);
    } else {
        res.send('increasing backwards speed');
        car.execute('forward');
    }
});

app.get('/decreaseBackwardsSpeed', function (req, res) {
    logger.info('entered /decreaseBackwardsSpeed');

    if (!config.modules.car) {
        return handleModuleNotConfigured('car', res);
    } else {
        res.send('decreasing backwards speed');
        car.execute('forward');
    }

});

app.get('/moderateRight', function (req, res) {
    logger.info('entered /moderateRight');

    if (!config.modules.car) {
        return handleModuleNotConfigured('car', res);
    } else {
        res.send('moderate right');
        car.execute('startModerateRight');
    }
});

app.get('/moderateLeft', function (req, res) {
    logger.info('entered /moderateLeft');

    if (!config.modules.car) {
        return handleModuleNotConfigured('car', res);
    } else {
        res.send('moderate left');
        car.execute('startModerateLeft');
    }
});

app.get('/sharpRight', function (req, res) {
    logger.info('entered /sharpRight');

    if (!config.modules.car) {
        return handleModuleNotConfigured('car', res);
    } else {
        res.send('sharp right');
        car.execute('startSharpRight');
    }
});

app.get('/sharpLeft', function (req, res) {
    logger.info('entered /sharpLeft');

    if (!config.modules.car) {
        return handleModuleNotConfigured('car', res);
    } else {
        res.send('sharp left');
        car.execute('startSharpLeft');
    }
});

app.get('/stopTurning', function (req, res) {
    logger.info('entered /stopTurning');

    if (!config.modules.car) {
        return handleModuleNotConfigured('car', res);
    } else {
        res.send('stopped turning');
        car.execute('stopTurning');
    }
});

app.get('/stop', function (req, res) {
    logger.info('entered /stop');

    if (!config.modules.car) {
        return handleModuleNotConfigured('car', res);
    } else {
        res.send('stop');
        car.execute('stop');
    }
});

app.get('/state', function (req, res) {
    logger.info('entered /state');
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


function handleModuleNotConfigured(module, res) {
    logger.warn(module + ' moduel is not enabled, returning service unavailable');
    res.status = 503;
    res.send({err: module + ' module is not enabled. enable it via configuration'});
}


function setup(callback) {
    let componentsRequiringSetup = getNumberOfActiveComponents();
    if (config.modules.video) {
        video = require('./lib/video/videocontroller');
        video.setup(dryMode, () => {
            componentsRequiringSetup--;
            if (componentsRequiringSetup === 0) {
                callback();
            }
        });
    }

    if (config.modules.audio) {
        audio = require('./lib/audio/audiocontroller');
        audio.setup(dryMode, () => {
            componentsRequiringSetup--;
            if (componentsRequiringSetup === 0) {
                callback();
            }
        });
    }

    if (config.modules.car) {
        car = require('./lib/car/carcontroller');
        car.setup(dryMode, () => {
            componentsRequiringSetup--;
            if (componentsRequiringSetup === 0) {
                callback();
            }
        });
    }
}

function shutdown(callback) {
    let componentsRequiringShutdown = getNumberOfActiveComponents();

    if (config.modules.car && car) {
        car.shutdown(() => {
            componentsRequiringShutdown--;
            if (componentsRequiringShutdown === 0) {
                callback();
            }
        });

    }
    if (config.modules.audio && audio) {
        audio.turnOff(() => {
            componentsRequiringShutdown--;
            if (componentsRequiringShutdown === 0) {
                callback();
            }
        });
    }

    if (config.modules.video && video) {
        video.turnOff(() => {
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
    shutdown(() => {
        if (options.cleanup) console.log('clean');
        if (err) console.log('error: ' + err.stack);
        if (options.exit) {
            shutdown(() => {
                process.exit();
            });

        }
    });
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
});
