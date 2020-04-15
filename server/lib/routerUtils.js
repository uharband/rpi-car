let logger = require('./log');

function handleModuleNotConfigured(module, res) {
    logger.warn(module + ' moduel is not enabled, returning service unavailable');
    res.status(503);
    res.send({err: module + ' module is not enabled. enable it via configuration'});
}

function handleModuleNotActive(module, res) {
    logger.warn(module + ' moduel is not active, returning service unavailable');
    res.status(503);
    res.send({err: module + ' module is not active'});
}

module.exports.handleModuleNotConfigured = handleModuleNotConfigured;
module.exports.handleModuleNotActive = handleModuleNotActive;