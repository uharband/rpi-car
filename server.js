var express = require('express');
var app = express();
var rpio = require('rpio');
fs = require('fs');
var shell = require('shelljs');

var right_forward = 19;
var left_forward = 13;
var right_backward = 11;
var left_backward = 15;

var status = "stopped";


app.use(express.static('.'));

app.get('/forward', function (req, res) {
    stop();    
    rpio.write(right_forward, rpio.HIGH);
    rpio.write(left_forward, rpio.HIGH);
    status = "forward";
    res.send('forward');
})

app.get('/backward', function (req, res) {
    stop();
    rpio.write(left_backward, rpio.HIGH);
    rpio.write(right_backward, rpio.HIGH);
    status = "backward"
    res.send('backward');
})


//video on/off
app.get('/videoon', function (req, res) {
    console.log('starting motion');
	shell.exec('sudo service motion restart', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		console.log('started motion');
		res.send('started video');
	});
});

app.get('/videooff', function (req, res) {
    console.log('stopping motion');
    shell.exec('sudo service motion stop', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		console.log('started motion');
		res.send('stopped video');
	});
});


//audio on/off
app.get('/audioon', function (req, res) {
    console.log('starting audio');
    shell.exec('sudo ./startAudioStreaming.sh', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		console.log('started audio');
		res.send('started audio');
	});
});

app.get('/audiooff', function (req, res) {
    console.log('stopping audio');
    shell.exec('sudo ./stopAudioStreaming.sh', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		console.log('stopped audio');
		res.send('stopped audio');
	});
});


app.get('/left/:degrees', function (req, res) {    
    var deg = req.params['degrees'];
    console.log("turning left " + deg + " degrees");
    
    if(status == "stopped"){
		
	}
    else if(status == "forward"){
		rpio.write(left_forward, rpio.LOW);
		rpio.write(left_backward, rpio.HIGH);
		rpio.sleep(0.97);
		rpio.write(left_backward, rpio.LOW);
		rpio.write(left_forward, rpio.HIGH);
	}
	else if(status == "backward"){
		rpio.write(left_backward, rpio.LOW);
		rpio.write(left_forward, rpio.HIGH);
		rpio.sleep(0.97);
		rpio.write(left_backward, rpio.HIGH);
		rpio.write(left_forward, rpio.LOW);
	}
	else{
		console.log("got an unrecognized status" + status + ". stopping");	
		stop();
	}
   
    
    res.send('turned left ' + deg);
})

app.get('/right/:degrees', function (req, res) {
    var deg = req.params['degrees'];
    console.log("turning right " + deg + " degrees");
    
    if(status == "stopped"){
		
	}
    else if(status == "forward"){
		rpio.write(right_forward, rpio.LOW);
		rpio.write(right_backward, rpio.HIGH);
		rpio.sleep(0.97);
		rpio.write(right_backward, rpio.LOW);
		rpio.write(right_forward, rpio.HIGH);
	}
	else if(status == "backward"){
		rpio.write(right_backward, rpio.LOW);
		rpio.write(right_forward, rpio.HIGH);
		rpio.sleep(0.97);
		rpio.write(right_forward,rpio.LOW);
		rpio.write(right_backward,rpio.HIGH);
	}
	else{
		console.log("got an unrecognized status" + status + ". stopping");	
		stop();
	}
   
    
    res.send('turned right ' + deg);
    
    
})



app.get('/stop', function (req, res) {
    stop();
    res.send('stop');
})

function stop()
{
    rpio.write(right_forward, rpio.LOW);
    rpio.write(left_forward, rpio.LOW);
    rpio.write(right_backward, rpio.LOW);
    rpio.write(left_backward, rpio.LOW);
    status = "stopped";
}

// setup: open all pins and set them to LOW which is OFF
rpio.open(right_forward, rpio.OUTPUT, rpio.LOW);
rpio.open(right_backward, rpio.OUTPUT, rpio.LOW);
rpio.open(left_forward, rpio.OUTPUT, rpio.LOW);
rpio.open(left_backward, rpio.OUTPUT, rpio.LOW);



var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("car controller application listening at http://%s:%s", host, port)
}); 


process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    rpio.close(right_forward);
    rpio.close(right_backward);
    rpio.close(left_forward);
    rpio.close(left_backward);
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
