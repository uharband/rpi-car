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
        success: function (data) {
            let cameraOk = true;
            let cameraStatus = 'camera connected!';
            if (!data.result.supported) {
                cameraStatus = 'camera not enabled';
                cameraOk = false;
            }
            if (data.result.supported && !data.result.detected) {
                cameraStatus = 'camera not connected';
                cameraOk = false;
            }
            $("#video-status").text(cameraStatus);
            if (cameraOk) {
                $("#video-card-header").addClass("bg-success").removeClass("bg-danger");
            }
            else {
                $("#video-card-header").removeClass("bg-success").addClass("bg-danger");
            }
        },
        error: function (xhr, status, err) {
            $("#video-updater").text(err.message);
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
        success: function (data) {
            let micOk = true;
            let micStatus = 'mic connected!';

            $("#audio-status").text(micStatus);
            $("#audio-card-header").addClass("bg-success").removeClass("bg-danger");
        },
        error: function (xhr, status, err) {
            $("#audio-updater").text(err.message);
            $("#audio-card-header").addClass("bg-success").removeClass("bg-danger");
        },
        complete: function () {
            $("#audio-status-check-btn").removeClass('disabled');
        }
    })
}