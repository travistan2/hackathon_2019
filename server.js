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

// The text to synthesize

function encode_base64(file) {
    var bitmap = fs.readFileSync(file);
    return new Buffer.from(bitmap).toString('base64');
}

async function ConvertSpeechText(usertext) {
    try {

        if (fs.existsSync('output.mp3')) {
            fs.unlinkSync('output.mp3', function(err) {});        
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
        await writeFile('output.mp3', response.audioContent, 'binary');
        console.log('finished writefile');
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

app.post('/audio', function(req, res) {
    console.log(req.body.usertext);
    ConvertSpeechText(req.body.usertext)
        .then(x => {
            res.setHeader('Content-Type', 'application/json');
            res.send({ str_base64: encode_base64('output.mp3') });
            console.log("post reply completed");
        })
        .catch(x => console.log('error:' + x));
    console.log("finished post");
});

app.get('/text', function(req, res) {
    text = res.text();
});

// routing layer
router.get('/',function(req,res){
    res.sendFile(path.join(viewdir +'/index.html'));
});

app.use(express.static('public'));
app.use('/', router);

app.listen(8080);

console.log('Running at port 8080...');
