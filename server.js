// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 6800;
 
//If you are using RedisToGo with Heroku
if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis1 = require("redis").createClient(rtg.port, rtg.hostname);
  var redis2 = require("redis").createClient(rtg.port, rtg.hostname);
  var redis3 = require("redis").createClient(rtg.port, rtg.hostname);
 
  redis1.auth(rtg.auth.split(":")[1]);
  redis2.auth(rtg.auth.split(":")[1]);
  redis3.auth(rtg.auth.split(":")[1]);
} else {
  //If you are using your own Redis server
  var pub = require("redis").createClient();
  var sub = require("redis").createClient();
  var client = require("redis").createClient();
}
         
server.listen(process.argv[2], function () {
  console.log('Server listening at port %d', process.argv[2]);
});          
 
// Routing
app.use(express.static(__dirname + '/public')); 

// Chatroom 
// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;
    
io.sockets.on('connection', function (socket) {
  var addedUser = false;
 
  pub.subscribe("emrchat");
 
  pub.on("message", function(channel, message) {
    socket.send(message);
 
    //socket.broadcast.emit('message', {
    //  username: socket.username,
    //  message: message
    //});
  });
 
  // when the client emits 'new message', this listens and executes
  socket.on('message', function (msg) {
    sub.publish("emrchat", msg);
 
    // we tell the client to execute 'new message'
    //socket.broadcast.emit('message', {
    //  username: socket.username,
    //  message: msg
    //});
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
 
    sub.publish("emrchat", "A New User is connected : " + username);
    client.sadd("onlineUsers", username);
 
    // we store the username in the socket session for this client
    socket.username = username;
 
    // add the client's username to the global list
    usernames[username] = username;
    ++numUsers;
    addedUser = true;
 
    socket.emit('login', {
      numUsers: numUsers
    });
 
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });
 
  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });
 
  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;
 
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
 
      pub.quit();
      sub.publish("emrchat","User is disconnected : " + socket.username);
    }
  });
});




  