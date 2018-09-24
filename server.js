var express = require('express');
var app = express();
var fs = require('fs');
var shell = require('shelljs');
var Enum = require('enum');
var logger = require('./lib/log');
var config = require('config');

var dryMode = false;

// get command line args
if(process.argv.length > 2 && process.argv[2].toLowerCase() === 'drymode'){
    dryMode = true;
}
logger.info('dryMode = ' + dryMode);

// enabled modules
logger.info('enabled mudules:');
logger.info(config.modules);

var car;
var audio;
var video;

if(config.modules.video) {
    video = require('./lib/video/videocontroller');
    video.setup(dryMode);
}

if(config.modules.audio) {
    audio = require('./lib/audio/audiocontroller');
    audio.setup(dryMode);
}

if(config.modules.car) {
    car = require('./lib/car/carcontroller');
    car.setup(dryMode);
}

// html static service
app.use(express.static(__dirname + '/html'));

/* -------------------------------------------------------

                       VIDEO

 ------------------------------------------------------ */

app.get('/video/on', function (req, res) {
    logger.info('/video/on entered');

    if(!config.modules.video){
        return handleModuleNotConfigured('video', res);
    }
    else{
        video.turnOn(function (error) {
            if (error === "") {
                res.send("started video");
            }
            else {
                res.send(error);
            }
        });
    }
});

app.get('/video/off', function (req, res) {
    logger.info('/video/off entered');

    if(!config.modules.video){
        return handleModuleNotConfigured('video', res);
    }
    else {
        video.turnOff(function (error) {
            if (error !== "") {
                res.send("stopped video");
            }
            else {
                res.send(error);
            }
        });
    }
});

app.get('/video/configure', function (req, res) {
    logger.info('/video/configure entered');

    if(!config.modules.video){
        return handleModuleNotConfigured('video', res);
    }
    else {
        var width = (isNaN(parseInt(req.query.width)) ? null : parseInt(req.query.width));
        var height = (isNaN(parseInt(req.query.height)) ? null : parseInt(req.query.height));
        var jpgQuality = (isNaN(parseInt(req.query.jpgQuality)) ? null : parseInt(req.query.jpgQuality));
        var fps = (isNaN(parseInt(req.query.fps)) ? null : parseInt(req.query.fps));
        var verticalFlip = null;
        if (req.query.verticalFlip === undefined) {
            verticalFlip = null;
        }
        else if (req.query.verticalFlip !== 'true' && req.query.verticalFlip !== 'false') {
            // return error
            res.send('error: verticalFlip must be true or false');
        }
        else {
            verticalFlip = (req.query.verticalFlip === 'true');
        }


        video.configure(width, height, verticalFlip, jpgQuality, fps, function (error) {
            if (error !== "") {
                res.send("configured successfully");
            }
            else {
                res.send(error);
            }
        });
    }
});


/* -------------------------------------------------------

                       AUDIO

 ------------------------------------------------------ */
app.get('/audio/on', function (req, res) {
    logger.info('/audio/on entered');

    if(!config.modules.audio){
        return handleModuleNotConfigured('audio', res);
    }
    else {
        audio.turnOn(function (error) {
            if (error !== "") {
                res.send("started audio");
            }
            else {
                res.send(error);
            }
        });
    }
});


app.get('/audio/off', function (req, res) {
    logger.info('/audio/off entered');

    if(!config.modules.audio){
        return handleModuleNotConfigured('audio', res);
    }
    else {
        audio.turnOff(function (error) {
            if (error !== "") {
                res.send("stopped audio");
            }
            else {
                res.send(error);
            }
        });
    }
});


/* -------------------------------------------------------

                       CAR

 ------------------------------------------------------ */

app.get('/forward', function (req, res) {
    logger.info('entered /forward');

    if(!config.modules.car){
        return handleModuleNotConfigured('car', res);
    }
    else {
        res.send('going forward');
        car.execute('forward');
    }

});


app.get('/increaseForwardSpeed', function (req, res) {
    logger.info('entered /increaseForwardSpeed');

    if(!config.modules.car){
        return handleModuleNotConfigured('car', res);
    }
    else {
        res.send('increasing forward speed');
        car.execute('increaseForwardSpeed');
    }
});

app.get('/increaseBackwardSpeed', function (req, res) {
    logger.info('entered /increaseBackwardSpeed');

    if(!config.modules.car){
        return handleModuleNotConfigured('car', res);
    }
    else {
        res.send('increasing backward speed');
        car.execute('increaseBackwardSpeed');
    }
});



app.get('/backward', function (req, res) {
    logger.info('entered /backward');

    if(!config.modules.car){
        return handleModuleNotConfigured('car', res);
    }
    else {
        res.send('going backwards');
        car.execute('backwards');
    }
});

app.get('/increaseBackwardsSpeed', function (req, res) {
    logger.info('entered /increaseBackwardsSpeed');

    if(!config.modules.car){
        return handleModuleNotConfigured('car', res);
    }
    else {
        res.send('increasing backwards speed');
        car.execute('forward');
    }
});

app.get('/decreaseBackwardsSpeed', function (req, res) {
    logger.info('entered /decreaseBackwardsSpeed');

    if(!config.modules.car){
        return handleModuleNotConfigured('car', res);
    }
    else {
        res.send('decreasing backwards speed');
        car.execute('forward');
    }

});

app.get('/moderateRight', function (req, res) {
    logger.info('entered /moderateRight');

    if(!config.modules.car){
        return handleModuleNotConfigured('car', res);
    }
    else {
        res.send('moderate right');
        car.execute('startModerateRight');
    }
});

app.get('/moderateLeft', function (req, res) {
    logger.info('entered /moderateLeft');

    if(!config.modules.car){
        return handleModuleNotConfigured('car', res);
    }
    else {
        res.send('moderate left');
        car.execute('startModerateLeft');
    }
});

app.get('/sharpRight', function (req, res) {
    logger.info('entered /sharpRight');

    if(!config.modules.car){
        return handleModuleNotConfigured('car', res);
    }
    else {
        res.send('sharp right');
        car.execute('startSharpRight');
    }
});

app.get('/sharpLeft', function (req, res) {
    logger.info('entered /sharpLeft');

    if(!config.modules.car){
        return handleModuleNotConfigured('car', res);
    }
    else {
        res.send('sharp left');
        car.execute('startSharpLeft');
    }
});

app.get('/stopTurning', function (req, res) {
    logger.info('entered /stopTurning');

    if(!config.modules.car){
        return handleModuleNotConfigured('car', res);
    }
    else {
        res.send('stopped turning');
        car.execute('stopTurning');
    }
});

app.get('/stop', function (req, res) {
    logger.info('entered /stop');

    if(!config.modules.car){
        return handleModuleNotConfigured('car', res);
    }
    else {
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
    if(!config.modules.car){
        return handleModuleNotConfigured('car', res);
    }
    else {
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


var server = app.listen(8083, function () {
    var host = server.address().address;
    var port = server.address().port;
    logger.info("raspberry car listening at http://%s:%s", host, port)
});

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    console.log("exiting");
    if (config.modules.car) {
        car.teardown();
    }
    if (config.modules.audio) {
        audio.turnOff(function () {
            
        });
    }

    if (config.modules.video) {
        video.turnOff(function () {
            
        });
    }
    if (options.cleanup) console.log('clean');
    if (err) console.log('error: ' + err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));
