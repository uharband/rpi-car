var express = require('express');
var app = express();
var fs = require('fs');
var shell = require('shelljs');
var Enum = require('enum');
var logger = require('./lib/log');
var car;
var audio = require('./lib/audiocontroller');
var video = require('./lib/videocontroller');
var config = require('config');

logger.info('enabled mudules:');
logger.info(config.modules);

var dryMode = false;

// get command line args
if(process.argv.length > 2 && process.argv[2].toLowerCase() === 'drymode'){
    dryMode = true;
}
logger.info('dryMode = ' + dryMode);
// initialize
if (config.modules.car) {
    car = require('./lib/carcontroller');
    car.setup(dryMode);
}

if (config.modules.audio) {
    audio.turnOn(function (error) {
        if (!error) {
            logger.info("started audio");
        }
        else {
            logger.info(error);
        }
    });
}

if (config.modules.video) {
    video.turnOn(function (error) {
        if (!error) {
            logger.info("started video");
        }
        else {
            logger.info(error);
        }
    });
}

// html static service
app.use(express.static(__dirname + '/html'));


// ----------------      VIDEO    ----------------------- //
app.get('/video/on', function (req, res) {
    logger.info('/video/on entered');
    video.turnOn(function (error) {
        if (error !== "") {
            res.send("started video");
        }
        else {
            res.send(error);
        }
    });
});

app.get('/video/off', function (req, res) {
    logger.info('/video/off entered');
    video.turnOff(function (error) {
        if (error !== "") {
            res.send("stopped video");
        }
        else {
            res.send(error);
        }
    });
});


// ----------------      AUDIO    ----------------------- //
app.get('/audio/on', function (req, res) {
    logger.info('starting audio at ' + __dirname + '/startAudioStreaming.sh');
    audio.turnOn(function (error) {
        if (error !== "") {
            res.send("started audio");
        }
        else {
            res.send(error);
        }
    });
});


app.get('/audio/off', function (req, res) {
    logger.info('stopping audio');
    audio.turnOff(function (error) {
        if (error !== "") {
            res.send("stopped audio");
        }
        else {
            res.send(error);
        }
    });
});


// car controller
app.get('/forward', function (req, res) {
    logger.info('entered /forward');
    res.send('going forward');
    car.execute('forward');

});


app.get('/increaseForwardSpeed', function (req, res) {
    logger.info('entered /increaseForwardSpeed');
    res.send('increasing forward speed');
    car.execute('increaseForwardSpeed');
});

app.get('/increaseBackwardSpeed', function (req, res) {
    logger.info('entered /increaseBackwardSpeed');
    res.send('increasing backward speed');
    car.execute('increaseBackwardSpeed');
});



app.get('/backward', function (req, res) {
    logger.info('entered /backward');
    res.send('going backwards');
    car.execute('backwards');
});

app.get('/increaseBackwardsSpeed', function (req, res) {
    logger.info('entered /increaseBackwardsSpeed');
    res.send('increasing backwards speed');
    car.execute('forward');
});

app.get('/decreaseBackwardsSpeed', function (req, res) {
    logger.info('entered /decreaseBackwardsSpeed');
    res.send('decreasing backwards speed');
    car.execute('forward');

});

app.get('/moderateRight', function (req, res) {
    logger.info('entered /moderateRight');
    res.send('moderate right');
    car.execute('startModerateRight');
});

app.get('/moderateLeft', function (req, res) {
    logger.info('entered /moderateLeft');
    res.send('moderate left');
    car.execute('startModerateLeft');
});

app.get('/sharpRight', function (req, res) {
    logger.info('entered /sharpRight');
    res.send('sharp right');
    car.execute('startSharpRight');
});

app.get('/sharpLeft', function (req, res) {
    logger.info('entered /sharpLeft');
    res.send('sharp left');
    car.execute('startSharpLeft');
});

app.get('/stopTurning', function (req, res) {

    logger.info('entered /stopTurning');
    res.send('stopped turning');
    car.execute('stopTurning');
});

app.get('/stop', function (req, res) {
    logger.info('entered /stop');
    res.send('stop');
    car.execute('stop');
});


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
        audio.turnOff();
    }

    if (config.modules.video) {
        video.turnOff();
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
