const express = require('express');
//const favicon = require('express-favicon');
const path = require('path');
const mdb = require('./DatabaseUtility');
const port = process.env.PORT || 8080;
const app = express();

//app.use(favicon(__dirname + '/build/favicon.ico'));
// the __dirname is the current directory from where the script is running
console.log('port: ' + port);
mdb.init(function(){
  console.log('Initialized mongodb...');
  app.use(express.static(__dirname));
  app.use(express.static(path.join(__dirname, 'build')));
  app.use(express.json()) // for parsing application/json
  app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

  app.get('/ping', function (req, res) {
    return res.send('pong');
  });
  app.get('/index.html', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
  app.get('/getdata', function(request, response){
    mdb.retrieveTodoListsRequest(request, function(result){
      response.send(result);
    });  
  });
  app.post('/postdata', function(request, response){
    const command = request.body.command;
    switch(command){
      case 'CREATE_USER':
        mdb.createUserRequest(request, function(result){
          response.send(result);
        });
        break;     
      case 'VALIDATE_TOKEN':
        mdb.validateToken(request, function(result){
          response.send(result);
        });
        break;   
      case 'LOGIN':
        mdb.loginRequest(request, function(result){
          response.send(result);
        });          
        break;
      case 'SAVE_LIST':
        mdb.upsertTodoListRequest(request, function(result){
          response.send(result);
        });
        break;
      case 'DELETE_LIST':
        mdb.deleteTodoListRequest(request, function(result){
          response.send(result);
        });          
        break;
      default:
        response.send({isSuccess: false, error: 'Invalid request.'});
        break;
    }
  });
  app.listen(port);
});