let shell = require('shelljs');
let logger = require('../log');
let config = require('config');
let path = require('path');
let utils = require('../utils');
let fs = require('fs');

let recordingsDirectory = 'recordings';
let recordingsFullPath = path.join(__dirname, '..', '..', 'app', recordingsDirectory);


function isConnected(cb) {
    logger.info('isConnected entered');

    if(dryMode){
        return setTimeout(() =>{
            return cb(null, {connected: true, status: 'mic connected', details: 'a mic was detected on card 1, device 0'});
        }, 1000);
    }

    utils.execute('arecord -l | grep -i "sound device"', function (err, res) {
        if (err) {
            if(!err.stderr || err.stderr === ''){
                return cb(null, {connected: false, status: 'mic not connected', details: 'no microphone device was detected. please make sure the mic is connected to the board'});
            }
            else{
                return cb(null, {connected: false, status: 'mic not connected', details: 'error checking if audio device is connected. internal error: ' + err.message});
            }

        }

        try{
            let cardSegmentStartIdx = res.stdout.indexOf('card ') + 5;
            let cardSegmentEndIdx = res.stdout.indexOf(':', cardSegmentStartIdx);
            let card = parseInt(res.stdout.substring(cardSegmentStartIdx, cardSegmentEndIdx));

            let deviceSegmentStartIdx = res.stdout.indexOf('device ') + 7;
            let deviceSegmentEndIdx = res.stdout.indexOf(':', deviceSegmentStartIdx);
            let device = parseInt(res.stdout.substring(deviceSegmentStartIdx, deviceSegmentEndIdx));
            return cb(null, {connected: true, status: 'mic connected', details: 'a mic was detected on card ' +  card + ', device ' + device});
        }
        catch (e) {
            return cb(null, {connected: false, status: 'mic not connected', details: 'error parsing arecord command response. internal error: ' + e.message});
        }
    });
}

function takeTestRecording(cb) {
    logger.info('takeTestRecording entered');

    isConnected((err, result) =>{
        if(err){
            return cb(new Error('error attempting to take test recording. internal error is: ' + err.message));
        }

        let recordingLabel = 'testrecording.wav';
        let recordingLocation = path.join(recordingsFullPath, recordingLabel);

        utils.execute('arecord -D hw:' + result.card + ',' + result.device + ' -d 5 -f cd ' + recordingLocation + ' -c 1', function (err, res) {
            if (err) {
                return cb(new Error('error taking test audio recording. internal error: ' + err.message));
            }

            return cb(null, path.join(recordingsDirectory, recordingLabel));
        });
    });
}

function setup(){
    if (!fs.existsSync(recordingsFullPath)){
        fs.mkdirSync(recordingsFullPath);
    }
}

setup();

module.exports.isConnected = isConnected;
module.exports.takeTestRecording = takeTestRecording;