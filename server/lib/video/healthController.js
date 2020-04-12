let shell = require('shelljs');
let logger = require('../log');
let config = require('config');
let path = require('path');
let utils = require('../utils');

let snapshotsDirectory = 'snapshots';
let snapshotsFullPath = path.join(__dirname, '..', '..','app', snapshotsDirectory);


function isConnected(cb){
    logger.info('isConnected entered');

    if(dryMode){
        return setTimeout(() =>{
            return cb(null, {supported: 1, detected: 0});
        }, 1000);
    }

    utils.execute('/opt/vc/bin/vcgencmd get_camera', function(err, res) {
        if(err){
            return cb(new Error('error checking if rpi-camera is connected. internal error: ' + err.message));
        }

        try{
            let result = res.stdout.split(' ');
            let supportedSplit = result[0].split('=');
            let supported = (parseInt(supportedSplit[1]) === 1);
            let detectedSplit = result[1].split('=');
            let detected = (parseInt(detectedSplit[1]) === 1);
            return cb(null, {supported: supported, detected: detected})
        }
        catch (e) {
            return cb(new Error('error parsing get_camera result. err: ' + e.message));
        }
    });
}

function takeTestSnapshot(cb){
    logger.info('takeTestSnapshot entered');

    let snapshotLabel = 'testsnapshot.jpg';
    if(dryMode){
        snapshotLabel = 'drymode_' + snapshotLabel;
    }
    let snapshotLocation = path.join(snapshotsFullPath, snapshotLabel);

    if(dryMode){
        return cb(null, path.join(snapshotsDirectory, snapshotLabel));
    }

    utils.execute('raspistill -o ' + snapshotLocation, function(err, res) {
        if(err){
            return cb(new Error('error taking snapshot from rpi-camera. internal error: ' + err.message));
        }

        return cb(null, path.join(snapshotsDirectory, snapshotLabel));
    });
}

module.exports.isConnected = isConnected;
module.exports.takeTestSnapshot = takeTestSnapshot;