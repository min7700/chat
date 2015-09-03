/*var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io')(server)
  , redis = require('redis');*/

var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var redis = require('redis');
var fs = require('fs');

var port = process.env.PORT || process.argv[2];
console.log("Listening on " + port);
 
app.listen(port);
 
//app.use(express.static(__dirname + '/public')); 

function handler(req,res){
    fs.readFile(__dirname + '/public', function(err,data){
        if(err){
            res.writeHead(500);
            return res.end('Error loading index.html');
        }
        res.writeHead(200);
        res.end(data);
    });
}

var store = redis.createClient();
var pub = redis.createClient();
var sub = redis.createClient();

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

io.sockets.on('connection', function (client) {
  var addedUser = false;

  sub.subscribe("chatting");

  sub.on("message", function (channel, message) {
      console.log("message received on server from publish");
      client.send(message);
  });

  client.on("message", function (msg) {
      if(msg.type == "chat"){
          pub.publish("chatting", msg.message);
      }
      else if(msg.type == "add user"){
      
          // add the client's username to the global list
          usernames[msg.user] = msg.user;
          ++numUsers;
          addedUser = true;

          client.emit('login', {
            numUsers: numUsers
          });

          pub.publish("chatting", "A new user in connected:" + msg.user);
          store.sadd("onlineUsers", msg.user);
      }
  });

  client.on('disconnect', function () {
      sub.quit();
      pub.publish("chatting", "User is disconnected :" + client.id);
  });
});