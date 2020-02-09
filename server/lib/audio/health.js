let shell = require('shelljs');
let logger = require('../log');
let config = require('config');
let path = require('path');
let utils = require('../utils');

let snapshotsDirectory = 'snapshots';
let snapshotsFullPath = path.join(__dirname, '..', '..', 'app', snapshotsDirectory);


function isConnected(cb) {
    logger.info('isConnected entered');
    utils.execute('arecord -l | grep -i "sound device"', function (err, res) {
        if (err) {
            cb(new Error('error checking if rpi-camera is connected. internal error: ' + err.message));
        }

        let resultSplit = res.stdout.split(':');
        let cardSplit = resultSplit[0];
        let deviceSplit = resultSplit[1];
        let card = parseInt(cardSplit.split(' ')[1]);
        let device = parseInt(deviceSplit.split(' ')[1]);

        cb(null, {card: card, device: device});
    });
}

function takeTestRecording(card, device, cb) {
    logger.info('takeTestRecording entered');
    utils.execute('arecord -D hw:' + card + ',' + device + ' -d 5 -f cd testrecording.wav -c 1', function (err, res) {
        if (err) {
            cb(new Error('error taking test audio recording. internal error: ' + err.message));
        }

        cb(null, (parseInt(res.stdout) >= 1));
    });

}

module.exports.isConnected = isConnected;
module.exports.takeTestRecording = takeTestRecording;