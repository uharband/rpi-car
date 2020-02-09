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
            return cb(new Error('error checking if rpi-camera is connected. internal error: ' + err.message));
        }

        try{
            let cardSegmentStartIdx = res.indexOf('card ') + 5;
            let cardSegmentEndIdx = res.indexOf(':', cardSegmentStartIdx);
            let card = parseInt(res.substring(cardSegmentStartIdx, cardSegmentEndIdx));

            let deviceSegmentStartIdx = res.indexOf('device ') + 7;
            let deviceSegmentEndIdx = res.indexOf(':', deviceSegmentStartIdx);
            let device = parseInt(res.substring(deviceSegmentStartIdx, deviceSegmentEndIdx));
            return cb(null, {card: card, device: device});
        }
        catch (e) {
            cb(new Error('error parsing arecord command response. internal error: ' + e.message));
        }
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