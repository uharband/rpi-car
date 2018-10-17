var eventId = 0;

var joystickR = nipplejs.create({
    zone: document.getElementById('remote_container'),
    mode: 'static',
    position: { left: '50%', top: '50%' },
    color: 'red',
    size: 200
});

joystickR[0].on('start end dir plain move', function (evt, data) {
    eventId++;
    switch(evt.type){
        case 'move':
            if(data.direction === undefined || data.distance === undefined){
                return;
            }
            let speed = Math.floor(data.force * 100);
            if((speed % 5)){
                return;
            }
            setState(data.direction.angle, Math.floor(data.force * 100), eventId);
            break;
        case 'end':
            setState('none', 0, eventId);
            break;
    }
    // DO EVERYTHING
});

function setStatus(status){
    console.log(status);
}

// ---  Car  ---- //
function setState(direction, speed, eventId) {
    setStatus("setState entered. direction=" + direction + ', speed=' + speed + ', eventId=' + eventId);
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4){ //done with the request
            if(this.status == 200) {
                setStatus(this.response)
            }
            else{
                setStatus('setState not ok');
            }
        }
    };
    xhttp.open("GET", "/state?direction=" + direction + "&speed=" + speed + "&eventId=" + eventId, true);
    xhttp.send();
}
