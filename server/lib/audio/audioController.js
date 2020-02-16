let logger = require('../log');
let shell = require('shelljs');
let utils = require('../utils');

let dryMode = false;

let shuttingDown = false;
let active = false;

function setup(_dryMode, callback) {
    logger.info('setup audio entered. dryMode: ' + _dryMode);
    dryMode = _dryMode;

    // turn on upon setup
    turnOn(function (err) {
    	active = true;
		callback(err);
    })
}

function turnOn(callback){
	logger.info('turning audio ON');

    if(dryMode){
        return callback(null);
    }

	utils.execute(__dirname + '/startAudioStreaming.sh', function (err, res) {
		if (err) {
			return callback(new Error('error checking if mjpg_streamer is running. internal error: ' + err.message));
		}
		callback();
	});
}

function turnOff(callback){
	logger.info('turning audio OFF');

	if(dryMode){
		return callback(null);
	}

	utils.execute(__dirname +  '/stopAudioStreaming.sh', function (err, res) {
		if (err) {
			return callback(new Error('error checking if mjpg_streamer is running. internal error: ' + err.message));
		}
		callback();
	});
}

function shutdown(callback){
    if(dryMode){
        return callback();
    }
    if(shuttingDown){
        return callback();
    }
    shuttingDown = true;
    turnOff(() =>{
        logger.info('video shutdown complete');
        active = false;
        callback();
    })
}

function isActive(){
	return active;
}

module.exports.turnOn = turnOn;
module.exports.turnOff = turnOff;
module.exports.setup = setup;
module.exports.shutdown = shutdown;
module.exports.isActive = isActive;