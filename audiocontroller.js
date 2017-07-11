var logger = require('./log');
var shell = require('shelljs');

function turnOn(audioActionComplete){
	logger.info('turning audio ON');
	shell.exec(__dirname + '/startAudioStreaming.sh', function(code, stdout, stderr) {
		logger.info('startAudioStreaming Exit code:', code);
		logger.info('startAudioStreaming Program output:', stdout);
		logger.info('startAudioStreaming Program stderr:', stderr);
		logger.info('startAudioStreaming: complete');
		if(stderr != ''){
			return audioActionComplete('error while starting audio! ' + stderr);
		}
		else{
			audioActionComplete('');
		}
		
	});
}

function turnOff(callback){
	logger.info('turning audio OFF');
	shell.exec(__dirname +  '/stopAudioStreaming.sh', function(code, stdout, stderr) {
		logger.info('stopAudioStreaming Exit code:', code);
		logger.info('stopAudioStreaming Program output:', stdout);
		logger.info('stopAudioStreaming Program stderr:', stderr);
		logger.info('stopAudioStreaming complete');

		if(stderr != ''){
			callback('error while stopping audio! ' + stderr);
		}
		else{
			callback('');
		}
				
	});
}

module.exports.turnOn = turnOn;
module.exports.turnOff = turnOff;
