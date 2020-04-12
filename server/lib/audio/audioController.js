let logger = require('../log');
let utils = require('../utils');

let active = false;

function setup(callback) {
    logger.info('setup audio entered');

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

    logger.info('deleting old audio session if exists..');
    utils.execute('screen -ls | grep \'stream\\|capture\' | cut -d. -f1 | awk \'{print $1}\' | xargs -r kill',  (err) => {
		if (err) {
			return callback(new Error('error while attempting to delete old audio session. internal error: ' + err.message));
		}

		logger.info('launching audio capture');
		utils.execute('screen -d -m -S capture bash -c \'arecord -B 0 -D plughw:1,0 -r 44100 -c 2 -f S16_LE | ffmpeg -i - -acodec mp2 -ab 128k -ac 2 -f rtp rtp://127.0.0.1:1234\' ',  (err) => {
			if (err) {
				return callback(new Error('error while launching audio session. internal error: ' + err.message));
			}

			setTimeout(() =>{
				logger.info('launching vlc');
				utils.execute('sudo -u pi screen -d -m -S stream bash -c "vlc --live-caching 100 --intf dummy rtp://127.0.0.1:1234 :sout=\'#transcode{vcodec=none,acodec=mp3,ab=128,channels=2,samplerate=44100}:http{mux=mp3,dst=:8081/}\' :sout-keep"',  (err) => {
					if (err) {
						return callback(new Error('error while attempting to delete old audio session. internal error: ' + err.message));
					}
					callback(null);
				});
			}, 5000);
		});
	});
}

function turnOff(callback){
	logger.info('turning audio OFF');

	if(dryMode){
		return callback(null);
	}

	logger.info('deleting audio sessions');
	utils.execute('screen -ls | grep \'stream\\|capture\' | cut -d. -f1 | awk \'{print $1}\' | xargs -r kill',  (err) => {
		if (err) {
			return callback(new Error('error while attempting to delete audio session. internal error: ' + err.message));
		}
		callback(null);
	});
}

function shutdown(callback){
    if(dryMode){
        return callback();
    }
    if(!active){
		logger.warn('audio shutdown called while not active');
        return callback();
    }

    turnOff((err) =>{
        logger.info('audio shutdown complete' + (err ? 'error while turning off audio: ' + err.message : ''));
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