let shell = require('shelljs');
let logger = require('./log');
let child_process = require('child_process');

function spawn(command, cb) {
    logger.info('execute entered. command: ' + command);
    let child = child_process.spawn(command);
    cb(null, child);
}

function execute(command, cb) {
    logger.info('execute entered. command: ' + command);

    shell.exec(command, (code, stdout, stderr) => {
        logger.info('after executing ' + command + ' code=' + code + ', stdout=' + stdout + ', stdrr=' + stderr);
        if (code === 0) {
            return cb(null, {code: code, stdout: stdout, stderr: stderr})
        }
        if (code !== 0) {
            let err = new Error('error executing command ' + command + '. exit code was ' + code + (stderr && stderr !== '') ? '. stderr: ' + stderr : '');
            err.stderr = stderr;
            return cb(err);
        }
    });
}



module.exports.execute = execute;
