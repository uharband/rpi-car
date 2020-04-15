let express = require('express');
let moduleManagementRouter = express.Router();
let logger = require('../log');
let moduleManagementController = require('./moduleManagerController');

let routerUtils = require('../routerUtils');
let config = require('config');


moduleManagementRouter.use((req, res, next) => {
    logger.info(req.originalUrl);
    next();
});


moduleManagementRouter.get('/:module/implementations', function (req, res) {
    try{
        let modules = moduleManagementController.getImplementations(req.params.module);
        res.send(modules);
    }
    catch (err) {
        res.status(500);
        res.send({error: err.message});
    }
});



module.exports = moduleManagementRouter;