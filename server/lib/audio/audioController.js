let logger = require('../log');
let shell = require('shelljs');

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
        return callback('');
    }

	shell.exec(__dirname + '/startAudioStreaming.sh', function(code, stdout, stderr) {
		logger.info('startAudioStreaming Exit code:', code);
		logger.info('startAudioStreaming Program output:', stdout);
		logger.info('startAudioStreaming Program stderr:', stderr);
		logger.info('startAudioStreaming: complete');
		if(stderr !== ''){
			return callback(new Error('error while starting audio! ' + stderr));
		}
		else{
			callback();
		}
	});
}

function turnOff(callback){
	logger.info('turning audio OFF');

    if(dryMode){
        return callback('');
    }

	shell.exec(__dirname +  '/stopAudioStreaming.sh', function(code, stdout, stderr) {
		logger.info('stopAudioStreaming Exit code:', code);
		logger.info('stopAudioStreaming Program output:', stdout);
		logger.info('stopAudioStreaming Program stderr:', stderr);
		logger.info('stopAudioStreaming complete');

		if(stderr !== ''){
			callback('error while stopping audio! ' + stderr);
		}
		else{
			callback('');
		}
				
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