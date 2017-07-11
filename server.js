var express = require('express');
var app = express();
var rpio = require('rpio');
fs = require('fs');
var shell = require('shelljs');
var Enum = require('enum');
var logger = require('./log');
var car = require('./carcontroller');
var audio = require('./audiocontroller');

car.setup();
audio.turnOn(function(error){
		if(!error){
			logger.info("started audio");
		}
		else{
			logger.info(error);
		}
});

app.use(express.static(__dirname));


// video on/off
app.get('/video/on', function (req, res) {
    console.log('starting motion');
	shell.exec('sudo service motion restart', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		console.log('started motion');
		res.send('started video');
	});
});

app.get('/video/off', function (req, res) {
    console.log('stopping motion');
    shell.exec('sudo service motion stop', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		console.log('stopped motion');
		res.send('stopped video');
	});
});


// audio on/off
app.get('/audio/on', function (req, res) {
    console.log('starting audio at ' + __dirname + '/startAudioStreaming.sh');    
	audio.turnOn(function(error){
		if(error != ""){
			res.send("started audio");
		}
		else{
			res.send(error);
		}
	});
});


app.get('/audio/off', function (req, res) {
    console.log('stopping audio');
	audio.turnOff(function(error){
		if(error != ""){
			res.send("stopped audio");
		}
		else{
			res.send(error);
		}
	});
});


// car controller

app.get('/forward', function (req, res) {
	logger.info('entered /forward');
    res.send('going forward');
    car.execute('forward');

})

app.get('/backward', function (req, res) {
	logger.info('entered /backward');
  res.send('going backwards');
  car.execute('backwards');
})

app.get('/moderateRight', function (req, res) {
	logger.info('entered /moderateRight');
  res.send('moderate right');
  car.execute('startModerateRight');
})

app.get('/moderateLeft', function (req, res) {
	logger.info('entered /moderateLeft');
  res.send('moderate left');
  car.execute('startModerateLeft');
})

app.get('/sharpRight', function (req, res) {
	logger.info('entered /sharpRight');
  res.send('sharp right');
  car.execute('startSharpRight');
})

app.get('/sharpLeft', function (req, res) {
	logger.info('entered /sharpLeft');
  res.send('sharp left');
  car.execute('startSharpLeft');
})

app.get('/stopTurning', function (req, res) {
	
	logger.info('entered /stopTurning');
  res.send('stopped turning');
  car.execute('stopTurning');
})

app.get('/stop', function (req, res) {
	logger.info('entered /stop');
  res.send('stop');
  car.execute('stop');
})







var server = app.listen(8080, function () {
   var host = server.address().address
   var port = server.address().port
   
   logger.info("raspberry car listening at http://%s:%s", host, port)
}); 


process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    car.teardown(); 
    console.log("exiting")
    if (options.cleanup) console.log('clean');
    if (err) console.log('error: ' + err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
