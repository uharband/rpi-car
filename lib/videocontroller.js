var logger = require('./log');
var shell = require('shelljs');

function turnOn(callback){
	
	logger.info('turning video ON');
	

	// video sizes 
        // usb web cam: 352x288
        // raspberry camera 640x480: 50% cpu, 1280x720: 100% cpu
	shell.exec('/usr/local/bin/mjpg_streamer -i "/usr/local/lib/input_uvc.so -y -r 640x480" -o "/usr/local/lib/output_http.so -w /usr/local/www" ', function(code, stdout, stderr) {
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
	shell.exec('killall -SIGINT mjpg_streamer', function(code, stdout, stderr) {
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
