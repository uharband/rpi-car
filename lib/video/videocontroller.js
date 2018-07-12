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

var shell = require('shelljs');
var config = require('config');
var path = require('path');
var fs = require('fs');
var logger = require('../log');
var child_process = require('child_process');

var userConfigFile = path.join(__dirname, '..', 'config', 'user.json');
var mjpg_streamer_process = null;
var playing = false;
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

	var command = mjpgStreamerPath + ' -o "output_http.so -w ' + wwwPath + '" -i "input_raspicam.so'
        + (verticalFlip ? ' -vf' : '')
        + ' -x ' + width + ' -y ' + height
        + ' -quality ' + jpgQuality
        + ' -fps ' + fps
        + '"';

    logger.info('launch mjpg_streamer command: ' + command);

    playing = true;

    if(dryMode){
        return callback('');
    }

    mjpg_streamer_process = child_process.exec(command, {
        env: {
            LD_LIBRARY_PATH: "/home/pi/rpi-mjpg-streamer/mjpg-streamer/mjpg-streamer-experimental"
        },
		detached: true
    });

    setTimeout(function () {
    	logger.info('after launching video. pid: ' + mjpg_streamer_process.pid);
		callback('');
    }, 1000);

    mjpg_streamer_process.stdout.on('data', function(data) {
        logger.info('data from stdout: ' + data);
	});

    mjpg_streamer_process.stderr.on('data', function(data) {
        logger.info('data from stderr: ' + data);
    });

    mjpg_streamer_process.on('close', function(code, signal) {
        logger.info('child process exited with code ' + code + ', with signal ' + signal + ', is video playing? ' + playing);
        if(playing){
        	logger.warn('mjpg_streamer exited unexpectedly while streaming. recovering...');
        	setTimeout(function(){turnOn(function (){});} , 2000);
		}
	});
}

function turnOff(callback){
	logger.info('turnOff entered');

	playing = false;

    if(dryMode){
        return callback('');
    }

    logger.info('sending SIGKILL to the child sh process. pid is ' + mjpg_streamer_process.pid);
    mjpg_streamer_process.kill('SIGKILL');

    logger.info('sending SIGINT to mjpg_streamer');
    shell.exec('killall -SIGINT mjpg_streamer', function(code, stdout, stderr) {
        logger.info('mjpg_streamer stop: Exit code:', code);
        logger.info('mjpg_streamer stop: Program output:', stdout);
        logger.info('mjpg_streamer stop: Program stderr:', stderr);
        logger.info('mjpg_streamer stop: complete. sleeping for 2 sec');
        setTimeout(function(){
            logger.info('mjpg_streamer stop: after sleeping');
            if(stderr !== ''){
                callback('error while stopping video! ' + stderr);
            }
            else{
                callback('');
            }
        }, 2000);
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
    logger.info('setup video entered. dryMode: ' + _dryMode);
	dryMode = _dryMode;

	// turn on upon startup
    turnOn(function () {})
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

