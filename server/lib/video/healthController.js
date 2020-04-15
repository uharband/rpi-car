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
                return cb(null, {connected: true, status: 'camera connected'});
            }, 1000);
        }

    utils.execute('/opt/vc/bin/vcgencmd get_camera', function(err, res) {
        if(err){
            return cb(null, {connected: false, status: 'camera not connected', details: 'error checking if rpi-camera is connected. internal error: ' + err.message});
        }

        try{
            let result = res.stdout.split(' ');
            let supportedSplit = result[0].split('=');
            let supported = (parseInt(supportedSplit[1]) === 1);
            let detectedSplit = result[1].split('=');
            let detected = (parseInt(detectedSplit[1]) === 1);

            let response = {};

            if(supported && detected){
                response.connected = true;
                response.status = 'camera connected';
            }

            // raspberry pi camera is not enabled
            if(!supported){
                response.connected = false;
                response.status = 'camera not enabled';
                response.details = 'camera is not enabled. use raspi-config to enable';
            }
            // camera is enabled but not connected
            else{
                if(!detected){
                    response.connected = false;
                    response.status = 'camera not connected';
                    response.details = 'camera was not detected. make sure it is connected';
                }
            }

            return cb(null, response);
        }
        catch (e) {
            return cb(null, {connected: false, status: 'camera not connected', details: 'error parsing get_camera result. err: ' + e.message});
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