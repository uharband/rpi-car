/*


	initially used the original mjpg-streamer https://sourceforge.net/projects/mjpg-streamer/
	now, using https://github.com/jacksonliam/mjpg-streamer which is a fork based on the original mjpg-steamer with adoptions to the rpi camera
	followed these instructions:
	sudo apt-get install cmake libjpeg8-dev
	cd mjpg-streamer-experimental
	make
	sudo make install

	usage:
	From the mjpeg streamer experimental folder run:
	export LD_LIBRARY_PATH=.
	./mjpg_streamer -o "output_http.so -w ./www" -i "input_raspicam.so"

	since the camera module vertically flips the image i used the -vf switch with the raspicam input plugin to get:
	./mjpg_streamer -o "output_http.so -w ./www" -i "input_raspicam.so -vf"

 */

var logger = require('./log');
var shell = require('shelljs');
var config = require('config');
var path = require('path');

var root = config.video.root;

function turnOn(callback){

	logger.info('turning video ON');

	var mjpgStreamerPath = path.join(root, 'mjpg_streamer');
	var wwwPath = path.join(root, 'www');

	var command = 'export LD_LIBRARY_PATH=' + root + '; ' + mjpgStreamerPath + ' -o "output_http.so -w ' + wwwPath + '" -i "input_raspicam.so -vf"';
	logger.info('launch mjpg_streamer command: ' + command);

	// video sizes 
        // usb web cam: 352x288
        // raspberry camera 640x480: 50% cpu, 1280x720: 100% cpu
	shell.exec(command, function(code, stdout, stderr) {
		logger.info('mjpg_streamer start: Exit code:', code);
		logger.info('mjpg_streamer start: Program output:', stdout);
		logger.info('mjpg_streamer start: Program stderr:', stderr);
		logger.info('mjpg_streamer start:: complete');
		if(stderr !== ''){
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
		logger.info('mjpg_streamer stop: Exit code:', code);
		logger.info('mjpg_streamer stop: Program output:', stdout);
		logger.info('mjpg_streamer stop: Program stderr:', stderr);
		logger.info('mjpg_streamer stop: complete');

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

