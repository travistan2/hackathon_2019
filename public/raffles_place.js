// raffles_place.js

var timerFunc;
var curr_status = 'idle';
var last_ts = moment('0001-01-01');

$(document).ready(function() {

    var socket = io(window.location.hostname);

    socket.on('initialconn', function (data) {
        console.log(data);
        timerFunc = setInterval(function() {
              socket.emit('clientping', { stat: curr_status, station: 'raffles_place', last_ts: last_ts})
        }, 1000);
    });

    socket.on('audiochunk', function (data) {
        var nw = moment(data.mtime);
        var prev = moment(last_ts);
        if (nw.isAfter(prev)) {
            curr_status = 'busy';
            last_ts = data.mtime;
            socket.emit('getchunk', function(err, payload) {
                console.log(payload);
                
                var prefix = 'data:audio/mpeg;base64,';
                console.log(prefix + payload.str_base64);
                $('#synthesized_audio').attr('src', prefix + payload.str_base64);
                const promise = $('#synthesized_audio')[0].play();
                if (promise !== null) {
                    promise.catch(() => { console.log('play failed'); });
                }
            });
        }
    });

    $('#synthesized_audio').on('ended', function() {
        curr_status = 'idle';
    });
});

window.addEventListener('beforeunload', function(event) {
    clearInterval(timerFunc);
});
