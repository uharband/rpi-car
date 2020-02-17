let shell = require('shelljs');
let logger = require('./log');
let child_process = require('child_process');

function execute(command, cb) {
    logger.info('execute entered. command: ' + command);

    try{
        let result = child_process.execSync(command);
        cb(null, {code: 0, stdout: result, stderr: ""});
    }
    catch (e) {
        return cb(new Error(e.message));
    }

    return;
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
