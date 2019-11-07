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

let shell = require('shelljs');
let config = require('config');
let path = require('path');
let fs = require('fs');
let logger = require('../log');
let child_process = require('child_process');

let userConfigFile = path.join(__dirname, '..', 'config', 'user.json');
let mjpg_streamer_process = null;
let playing = false;
let dryMode = false;
let root = config.video.root;
let width;
let height;
let verticalFlip;
let jpgQuality;
let fps;
let timestamp;
let port;
let inputCommand;

const InputType = {
    raspberry_camera: 'input_raspicam.so',
    usb_camera: 'input_uvc.so',
    unknown: 'unknown'
};
let inputType = InputType.unknown;

function turnOn(callback){
	logger.info('video turnOn entered');

    resolveConfiguration();

    let command = generateCommand();

	if(dryMode){
	    playing = true;
	    return callback(null);
    }

	isRunning((err, running) => {
	    // error while checking if running
	    if(err){
	        return callback(err);
        }
	    logger.info('is running returned ' + running);

	    //already running, nothing to do
	    if(running){
	        callback(null);
        }
        else{
            turnOnInternal(command, (err)=>{
                callback(err);
            });
        }
    });
}

function turnOnInternal(command, callback){
    logger.info('turnOnInternal entered');

    playing = true;

    if(dryMode){
        return callback(null);
    }

    mjpg_streamer_process = child_process.exec(command, {
        env: {
            LD_LIBRARY_PATH: config.video.root
        },
        detached: true
    });

    setTimeout(function () {
        logger.info('after launching video. pid: ' + mjpg_streamer_process.pid);
        isRunning((err, running) =>{
            if(err){
                return callback(err);
            }
            else if(running === false){
                callback(new Error('still NOT running after launching mjpg_streamer...'));
            }
            else{
                callback(null);
            }
        });
    }, 2000);

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

function isRunning(callback){
    logger.info('isRunning - entered');
    if(dryMode){
        return callback('dryMode');
    }
    shell.exec('ps -ef|grep mjpg_streamer|wc -l', function(code, stdout, stderr) {
        if(stdout){
            logger.info('after running ps -ef|grep mjpg_streamer|wc -l stdout is ' + stdout);
            return callback(null, (parseInt(stdout)>2));
        }
        logger.error('stdout is empty. stderr is: ' + stderr);
        callback(new Error(stderr));
    });
}

function turnOff(callback){
	logger.info('turnOff entered');

    if(dryMode){
        playing = false;
        return callback(null);
    }

    logger.info('sending SIGKILL to the child sh process' + (mjpg_streamer_process !== null ? ' pid is ' + mjpg_streamer_process.pid : ''));
    if(mjpg_streamer_process !== null){
        try{
            mjpg_streamer_process.kill('SIGKILL');
        }
        catch (err) {
            logger.error('error while attempting to send SIGKILL to mjpg_streamer_process');
        }
    }


    logger.info('sending SIGINT to mjpg_streamer');
    shell.exec('killall -SIGINT mjpg_streamer', function(code, stdout, stderr) {
        logger.info('after executing killall -SIGINT mjpg_streamer ---');
        logger.info('mjpg_streamer stop: Exit code:', code);
        logger.info('mjpg_streamer stop: Program output:', stdout);
        logger.info('mjpg_streamer stop: Program stderr:', stderr);
        logger.info('mjpg_streamer stop: complete. sleeping for 2 sec');
        setTimeout(function(){
            logger.info('mjpg_streamer stop: after sleeping');
            isRunning((err, running) => {
                if(err){
                    callback(err);
                }
                else if(running === true){
                   callback(new Error('still running after trying to kill mjpg_streamer...'));
                }
                else{
                    playing = false;
                    callback(null);
                }
            });
        }, 2000);
    });
}

function restart(cb) {
	logger.info('restart entered');
	turnOff((err) => {
	    if(err){
	        return cb(err);
        }
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

    let userConfig = {};
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
    timestamp = config.video.timestamp;
    port = config.video.port;

    // look for overrides
	let userConfig = null;
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
            if(userConfig.video.timestamp !== undefined){
                timestamp = userConfig.video.timestamp;
            }
        }
    }

    // camera type
    switch(config.video.cameraType){
        case 'raspberry':
        case 'raspberry-camera':
        case 'raspberry-cam':
        case 'raspi-cam':
        case 'raspicam':
            inputType = InputType.raspberry_camera;
            break;
        case 'usb-camera':
        case 'usb-cam':
            inputType = InputType.usb_camera;
            break;
        default:
            inputType = InputType.unknown;
    }
}

function generateCommand(){
    let inputCommand = generateInputCommand();
    let outputCommand = generateOutputCommand();
    let command = 'mjpg_streamer ' + inputCommand + outputCommand
    logger.info('launch mjpg_streamer command: ' + command);
    return command;
}

function generateOutputCommand(){
    let wwwPath = path.join(root, 'www');
    let listeningPort = port ? '--port ' + port : '';
    return ' -o "output_http.so ' + listeningPort + ' -w ' + wwwPath + '"';
}

function generateInputCommand() {
    return inputType === InputType.raspberry_camera ? generateInputCommandRpiCam() : generateInputCommandUvc();
}

function generateInputCommandRpiCam(){
    inputCommand = ' -i "input_uvc.so ';
    if(width && height){
        inputCommand += ' --resolution ' + width + 'x' + height;
    }
    if(fps){
        inputCommand += ' --fps ' + fps;
    }
    if(jpgQuality){
        inputCommand += ' --quality ' + jpgQuality;
    }
    if(verticalFlip){
        inputCommand += ' --vf';
    }
    if(timestamp){
        inputCommand += ' --timestamp';
    }
    inputCommand += '"';
    return inputCommand;
}

function generateInputCommandUvc(){
    inputCommand = ' -i "input_raspicam.so ';
    if(width && height){
        inputCommand += ' --width ' + width + ' --height ' + height;
    }
    if(fps){
        inputCommand += ' --framerate ' + fps;
    }
    if(jpgQuality){
        inputCommand += ' --quality ' + jpgQuality;
    }
    if(timestamp){
        inputCommand += ' --timestamp';
    }
    inputCommand += '"';
    return inputCommand;
}




module.exports.setup = setup;
module.exports.turnOn = turnOn;
module.exports.turnOff = turnOff;
module.exports.configure = configure;

