// bueno_vista.js

var timerFunc;
var curr_status = 'idle';
var last_ts = moment();
const station = 'bueno_vista';

$(document).ready(function() {

    var socket = io(window.location.hostname);

    socket.on('initialconn', function (data) {
        console.log(data);
        timerFunc = setInterval(function() {
              socket.emit('clientping', { stat: curr_status, station: station, last_ts: last_ts})
              $('.led').removeClass('led-red').addClass('led-green');  
        }, 1000);
    });

    socket.on('audiochunk', function (data) {
        var nw = moment(data.mtime);
        var prev = moment(last_ts);
        if (data.station == station && nw.isAfter(prev)) {
            curr_status = 'busy';
            $('.led').removeClass('led-green').addClass('led-green-blink');  
            last_ts = data.mtime;
            socket.emit('getchunk2', function(err, payload) {
                console.log(payload);
                $('.scrolltext').text(payload.original_text);                
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
        // $('.scrolltext').text('');              
        $('.led').removeClass('led-green-blink').addClass('led-green');  
        curr_status = 'idle';
    });
});

window.addEventListener('beforeunload', function(event) {
    clearInterval(timerFunc);
});

function startTime() {
  var today = new Date();
  var h = today.getHours();
  var m = today.getMinutes();
  var s = today.getSeconds();
  m = checkTime(m);
  s = checkTime(s);
  document.getElementById('clockToday').innerHTML = h + ":" + m + ":" + s;
  var t = setTimeout(startTime, 500);
}

function checkTime(i) {
  if (i < 10) {i = "0" + i};
  return i;
}
