var ps = require('ps-node');
 
// A simple pid lookup
ps.lookup({
    command: 'node',
    //arguments: 'server.js',
    }, function(err, resultList ) {
    if (err) {
        throw new Error( err );
    }
 
    resultList.forEach(function( process ){
        if( process ){
 
            console.log( 'PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );
        }
    });
});