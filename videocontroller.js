var logger = require('./log');
var shell = require('shelljs');

function turnOn(callback){
	logger.info('turning video ON');
	shell.exec('sudo service motion restart', function(code, stdout, stderr) {
		logger.info('service motion start: Exit code:', code);
		logger.info('service motion start: Program output:', stdout);
		logger.info('service motion start: Program stderr:', stderr);
		logger.info('service motion start:: complete');
		if(stderr != ''){
			return callback('error while starting video! ' + stderr);
		}
		else{
			callback('');
		}
		
	});
}

function turnOff(callback){
	logger.info('turning video OFF');
	shell.exec('sudo service motion stop', function(code, stdout, stderr) {
		logger.info('service motion stop: Exit code:', code);
		logger.info('service motion stop: Program output:', stdout);
		logger.info('service motion stop: Program stderr:', stderr);
		logger.info('service motion stop: complete');

		if(stderr != ''){
			callback('error while stopping video! ' + stderr);
		}
		else{
			callback('');
		}
				
	});
}


module.exports.turnOn = turnOn;
module.exports.turnOff = turnOff;