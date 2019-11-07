// ---  Video  ---- //
function enableVideo(enable){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        console.log('video req returned. state =  ' + this.readyState + ' ' + this.status);
        if (this.readyState == 4){ //done with the request
            if(this.status == 200) {
                setStatus('video ' + enable + ' ok');
            }
            else{
                setStatus('video ' + enable + ' not ok');
            }
        }
    };
    if(enable){
        xhttp.open("GET", "/video/on", true);
    }
    else{
        xhttp.open("GET", "/video/off", true);
    }
    xhttp.send();
}

function videoAction(action){
    console.log('videoAction: entered. action: ' + action);
    var video = document.getElementById('video');
    switch(action){
        case 'play':
            video.src = 'http://' + window.location.hostname + ':8090/?action=stream';
            break;
        case 'stop':
            video.src = '';
            break;
    }
}