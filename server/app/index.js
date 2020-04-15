$(function () {
    let appImplementations;
    $("#video-status-check-btn").on('click', function () { checkVideoStatus(); });
    $("#audio-status-check-btn").on('click', function () { checkAudioStatus(); });

    // checking video/audio conneciton requires the car to be in 'stop' state
    $.ajax({
        type: 'GET',
        url: '/stop',
        cache: false,

        // now that the car is stopped, run the audio/video checks
        success: function (implementations) {
            checkVideoStatus();
            checkAudioStatus();
        }
    });

    // get app implementations
    $.ajax({
        type: 'GET',
        url: '/modules/app/implementations',
        success: function (implementations) {
            appImplementations = implementations;
            $.each(implementations, function (i, implementation) {
                $("#app-implementations").append('<option value="1">' + implementation.name + ': ' + implementation.description + '</option>');
            });
        }
    });

    // start driving
    $("#start-driving").click(function () {
        let appImplementationIdx = document.getElementById("app-implementations").selectedIndex;

        $.ajax({
            type: 'GET',
            url: '/start',

            // now that the car is started, run the car app
            success: function () {
                window.location.href = appImplementations[appImplementationIdx].name;
            }
        });
    })
});

function initializeSubsystemCard(cardHeader, cardStatus) {
    $(cardHeader).removeClass("bg-success").removeClass("bg-danger");
    $(cardStatus).text("checking connection...");
}

function checkVideoStatus() {
    initializeSubsystemCard("#video-card-header", "#video-status");
    $("#video-status-check-btn").addClass('disabled');
    $.ajax({
        type: 'GET',
        url: '/video/status/connection',
        cache: false,
        success: function (videoConnection) {
            $("#video-status").text(videoConnection.status);
            if(videoConnection.connected){
                $("#video-card-header").addClass("bg-success").removeClass("bg-danger");
            }
            else{
                $("#video-card-header").removeClass("bg-success").addClass("bg-danger");
            }
        },
        error: function (xhr, status, err) {
            $("#video-status").text('internal error');
            $("#video-card-header").removeClass("bg-success").addClass("bg-danger");
        },
        complete: function () {
            $("#video-status-check-btn").removeClass('disabled');
        }
    })
}

function checkAudioStatus() {
    initializeSubsystemCard("#audio-card-header", "#audio-status");
    $("#audio-status-check-btn").addClass('disabled');
    $.ajax({
        type: 'GET',
        url: '/audio/status/connection',
        cache: false,
        success: function (audioConnection) {
            $("#audio-status").text(audioConnection.status);
            if(audioConnection.connected){
                $("#audio-card-header").addClass("bg-success").removeClass("bg-danger");
            }
            else{
                $("#audio-card-header").removeClass("bg-success").addClass("bg-danger");
            }

        },
        // unexpected error
        error: function (xhr, status, err) {
            $("#audio-status").text('internal error');
            $("#audio-card-header").removeClass("bg-success").addClass("bg-danger");
        },
        complete: function () {
            $("#audio-status-check-btn").removeClass('disabled');
        }
    })
}