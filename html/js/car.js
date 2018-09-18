var joystickR = nipplejs.create({
    zone: document.getElementById('remoteControl'),
    mode: 'static',
    position: { left: '50%', top: '50%' },
    color: 'red',
    size: 200
});

joystickR[0].on('start end dir plain move', function (evt, data) {
    switch(evt.type){
        case 'move':
            if(data.direction === undefined || data.distance === undefined){
                return;
            }
            setState(data.direction.angle, Math.floor(data.distance/2 + 50));
            break;
        case 'end':
            stopCar();
            break;
    }
    // DO EVERYTHING
});

function setStatus(status){
    console.log(status);
}

// ---  Car  ---- //
function setState(direction, speed) {
    setStatus("setState entered");
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4){ //done with the request
            if(this.status == 200) {
                setStatus('setState ok')
            }
            else{
                setStatus('setState not ok');
            }
        }
    };
    xhttp.open("GET", "/state?direction=" + direction + "&speed=" + speed, true);
    xhttp.send();
}

function stopCar() {
    setStatus("stopCar entered");
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4){ //done with the request
            if(this.status == 200) {
                setStatus('stop ok')
            }
            else{
                setStatus('stop not ok');
            }
        }
    };
    xhttp.open("GET", "/stop", true);
    xhttp.send();
}