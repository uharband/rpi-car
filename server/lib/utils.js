let shell = require('shelljs');
let logger = require('./log');

function execute(command, cb) {
    logger.info('execute entered. command: ' + command);
    shell.exec(command, (code, stdout, stderr) => {
        logger.info('after executing ' + command + ' code=' + code + ', stdout=' + stdout + ', stdrr=' + stderr);
        if (code === 0) {
            return cb(null, {code: code, stdout: stdout, stderr: stderr})
        }
        if (code !== 0) {
            return cb(new Error('error executing command ' + command + '. exit code was ' + code + stderr ? '. stderr: ' + stderr : ''));
        }
    });
}



module.exports.execute = execute;
