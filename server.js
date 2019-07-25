const express = require('express');
const path = require('path');
const mysql = require('mysql');
const fs = require('fs');
const util = require('util');
var bodyParser = require('body-parser');

const app = express();
const router = express.Router();
const viewdir = path.join(__dirname + '/views');
// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function propName(prop, value){
   for(var i in prop) {
       if (prop[i] == value){
            return i;
       }
   }
   return false;
}

var original_texts = {
    raffles_place: '',
    bueno_vista: '',
    bugis: ''
};

function encode_base64(file) {
    var bitmap = fs.readFileSync(file);
    return new Buffer.from(bitmap).toString('base64');
}

async function ConvertSpeechText(reqbody) {
    var usertext = reqbody.usertext;
    var loc = reqbody.location;
    var fname;
    if (loc == 'raffles_place') {
        fname = 'output.mp3';
    } 
    else if (loc == 'bueno_vista') {
        fname = 'output2.mp3';
    } 
    else if (loc == 'bugis') {
        fname = 'output3.mp3';
    } 
        
    try {
        if (fs.existsSync(fname)) {
            fs.unlinkSync(fname, function(err) {});        
        }

        // Creates a client
        const client = new textToSpeech.TextToSpeechClient(
        {
            keyFilename: './Dahkota Train-f57c1a0ddb93.json',
        });

        // Construct the request
        const request = {
            input: {text: usertext},
            // Select the language and SSML Voice Gender (optional)
            voice: {languageCode: 'en-US', ssmlGender: 'FEMALE'},
            // Select the type of audio encoding
            audioConfig: {audioEncoding: 'MP3'},
        };

        // Performs the Text-to-Speech request
        const [response] = await client.synthesizeSpeech(request);
        // Write the binary audio content to a local file
        const writeFile = util.promisify(fs.writeFile);
        await writeFile(fname, response.audioContent, 'binary');
        console.log('finished writefile');
        original_texts[loc] = usertext;
        return 0;
    } catch (error) {
        console.log('ConvertSpeechText exception: ' + error);
        return -1;
    }
};

// database layer
var conn = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'cad_db'
});

app.get('/db/announcements', function(req, res) {
	conn.query('SELECT * FROM announcement', function(err, result, fields) {
    res.send(result);
	});
});

app.get('/text', function(req, res) {
    text = res.text();
});

// routing layer
router.get('/',function(req,res){
    res.sendFile(path.join(viewdir +'/index.html'));
});

router.get('/raffles_place',function(req,res){
    res.sendFile(path.join(viewdir +'/raffles_place.html'));
});

router.get('/bueno_vista',function(req,res){
    res.sendFile(path.join(viewdir +'/bueno_vista.html'));
});

router.get('/bugis',function(req,res){
    res.sendFile(path.join(viewdir +'/bugis.html'));
});

app.use(express.static('public'));
app.use('/', router);

var server = require('http').Server(app);
var io = require('socket.io')(server);
server.listen(8080);
var ss = require('socket.io-stream');

console.log('Running at port 8080...');

io.on('connection', function (socket) {
    socket.emit('initialconn', { data: '' });

    socket.on('clientping', function (data) {
        var loc = data.station;
        var fname;
        if (loc == 'raffles_place') {
            fname = 'output.mp3';
        } 
        else if (loc == 'bueno_vista') {
            fname = 'output2.mp3';
        } 
        else if (loc == 'bugis') {
            fname = 'output3.mp3';
        } 

        if (data.stat == 'idle' && fs.existsSync(fname)) {
            var stats = fs.statSync(fname);
            var mtime = stats.mtime;
            socket.emit('audiochunk', { mtime: mtime, station: data.station}, function(data) {
            });
            console.log('notify audiochunk ' + fname);
        }
    });

    socket.on('getchunk1', function (fn) {
        console.log('get chunk1');
        if (fs.existsSync('output.mp3')) {
            fn(null, { original_text: original_texts['raffles_place'], str_base64: encode_base64('output.mp3') });
            console.log('sent chunk1');
        }
    });

    socket.on('getchunk2', function (fn) {
        console.log('get chunk2');
        if (fs.existsSync('output2.mp3')) {
            fn(null, { original_text: original_texts['bueno_vista'], str_base64: encode_base64('output2.mp3') });
            console.log('sent chunk2');
        }
    });

    socket.on('getchunk3', function (fn) {
        console.log('get chunk3');
        if (fs.existsSync('output3.mp3')) {
            fn(null, { original_text: original_texts['bugis'], str_base64: encode_base64('output3.mp3') });
            console.log('sent chunk3');
        }
    });
});

app.post('/audio', function(req, res) {
    console.log(req.body.usertext);
    ConvertSpeechText(req.body)
        .then(x => {
            /*
            io.sockets.emit('audiochunk', {}, function(data) {
            });
            console.log('notify audiochunk');
            res.setHeader('Content-Type', 'application/json');
            res.send({ str_base64: encode_base64('output.mp3') });
            console.log("post reply completed");
            */
        })
        .catch(x => console.log('error:' + x));
    console.log("finished post");
});

