let shell = require('shelljs');
let logger = require('../log');
let config = require('config');

let snapshotsDirectory = 'snapshots';
let snapshotsFullPath = path.join(__dirname, '..', '..','app', snapshotsDirectory);


function isConnected(cb){
    shell.exec('/opt/vc/bin/vcgencmd get_camera', function(code, stdout, stderr) {
        logger.info('after executing get_camera. code=' + code + ', stdout=' + stdout + ', stdrr=' + stderr);

        if(code !== 0){
            return cb(new Error('error checking if camera is connected' + stderr ? '. error: ' + stderr : ''));
        }
        if(!stdout){
            return cb(new Error('get_camera unexpectedly did not return any value' + stderr ? '. error: ' + stderr : ''));
        }

        try{
            let result = stdout.split(' ');
            let supportedSplit = result[0].split('=');
            let supported = (supportedSplit[1] === '1');
            let detectedSplit = result[1].split('=');
            let detected = (detectedSplit[1] === '1');
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
    let snapshotLocation = path.join(snapshotsFullPath, snapshotLabel);

    shell.exec('raspistill -o ' + snapshotLocation, function(code, stdout, stderr) {
        logger.info('after executing raspistill. code=' + code + ', stdout=' + stdout + ', stdrr=' + stderr);

        if(code !== 0){
            return cb(new Error('error checking if camera is connected' + stderr ? '. error: ' + stderr : ''));
        }

        return cb(null, path.join(snapshotsDirectory, snapshotLabel));
    });

}

module.exports.isConnected = isConnected;
module.exports.takeTestSnapshot = takeTestSnapshot;