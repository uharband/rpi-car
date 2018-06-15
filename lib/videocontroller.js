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
var fs = require('fs');
var userConfigFile = path.join(__dirname, '..', 'config', 'user.json');

var dryMode = false;

var root = config.video.root;
var width;
var height;
var verticalFlip;
var jpgQuality;
var fps;

function turnOn(callback){

	logger.info('turnOn entered');

	resolveConfiguration();

	var mjpgStreamerPath = path.join(root, 'mjpg_streamer');
	var wwwPath = path.join(root, 'www');

	var command = 'export LD_LIBRARY_PATH=' + root + '; ' + mjpgStreamerPath + ' -o "output_http.so -w ' + wwwPath + '" -i "input_raspicam.so'
		+ (verticalFlip ? ' -vf' : '')
		+ ' -x ' + width + ' -y ' + height
		+ ' -quality ' + jpgQuality
		+ ' -fps ' + fps
		+ '"';

	logger.info('launch mjpg_streamer command: ' + command);

	if(dryMode){
		return callback('');
	}

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
	logger.info('turnOff entered');

    if(dryMode){
        return callback('');
    }

	shell.exec('killall -SIGINT mjpg_streamer', function(code, stdout, stderr) {
		logger.info('mjpg_streamer stop: Exit code:', code);
		logger.info('mjpg_streamer stop: Program output:', stdout);
		logger.info('mjpg_streamer stop: Program stderr:', stderr);
		logger.info('mjpg_streamer stop: complete');

		if(stderr !== ''){
			callback('error while stopping video! ' + stderr);
		}
		else{
			callback('');
		}
				
	});
}

function restart(cb) {
	logger.info('restart entered');
	turnOff(function() {
		turnOn(function(err){
			cb(err);
		});
	});
}

function setup(_dryMode) {
	dryMode = _dryMode;
}

function configure(width, height, verticalFlip, jpgQuality, fps, callback){
	logger.info('configure entered. width: ' + width + ', height: ' + height + ', verticalFlip: ' + verticalFlip + ', jpgQuality: ' + jpgQuality + ', fps: ' + fps);

    var userConfig = {};
    if (fs.existsSync(userConfigFile)) {
        userConfig = JSON.parse(fs.readFileSync(userConfigFile));
    }
    if(userConfig.video === undefined){
    	userConfig.video = {};
	}
    if(Number.isInteger(width)){
    	userConfig.video.width = width;
	}
	if(Number.isInteger(height)){
    	userConfig.video.height = height;
	}
	if(typeof(verticalFlip) === 'boolean'){
    	userConfig.video.verticalFlip = verticalFlip;
	}
	if(Number.isInteger(jpgQuality)){
    	userConfig.video.jpgQuality = jpgQuality;
	}
	if(Number.isInteger(fps)){
    	userConfig.video.fps = fps;
	}

	fs.writeFileSync(userConfigFile, JSON.stringify(userConfig, null, 4));

    restart(function (err) {
		callback(err);
    });
}

function resolveConfiguration(){
	// initialize default config
    width = config.video.width;
    height = config.video.height;
    verticalFlip = config.video.verticalFlip;
    jpgQuality = config.video.jpgQuality;
    fps = config.video.fps;

    // look for overrides
	var userConfig = null;
    if (fs.existsSync(userConfigFile)) {
        userConfig = JSON.parse(fs.readFileSync(userConfigFile));
        logger.info('found a user config override. loading');

        if(userConfig.video !== undefined){ // the user config has an override for some of the video properties
            if(userConfig.video.width !== undefined){
                width = userConfig.video.width;
            }
            if(userConfig.video.height !== undefined){
                height = userConfig.video.height;
            }
            if(userConfig.video.verticalFlip !== undefined){
                verticalFlip = userConfig.video.verticalFlip;
            }
            if(userConfig.video.jpgQuality !== undefined){
                jpgQuality = userConfig.video.jpgQuality;
            }
            if(userConfig.video.fps !== undefined){
                fps = userConfig.video.fps;
            }
        }
    }
}


module.exports.setup = setup;
module.exports.turnOn = turnOn;
module.exports.turnOff = turnOff;
module.exports.configure = configure;

