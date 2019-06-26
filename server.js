const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();

const viewdir = path.join(__dirname + '/views');

router.get('/',function(req,res){
  res.sendFile(path.join(viewdir +'/index.html'));
});

app.use(express.static('public'));
app.use('/', router);

app.listen(8080);

console.log('Running at port 8080...');
