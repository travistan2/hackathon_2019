const express = require('express');
const path = require('path');
const mysql = require('mysql');

const app = express();
const router = express.Router();

const viewdir = path.join(__dirname + '/views');

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



// routing layer
router.get('/',function(req,res){
  res.sendFile(path.join(viewdir +'/index.html'));
});

app.use(express.static('public'));
app.use('/', router);

app.listen(8080);

console.log('Running at port 8080...');
