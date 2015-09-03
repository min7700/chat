var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io')(server);

var port = process.env.PORT || 5000;
console.log("Listening on " + port);
 
server.listen(port);

app.use(express.static(__dirname + '/public')); 

var pub = require("redis").createClient();
var sub = require("redis").createClient();
var client = require("redis").createClient();

io.sockets.on('connection', function (socket) {
  
  pub.subscribe("emrchat");
  
  pub.on("message", function(channel, message) {
    socket.send(message);
  });

  socket.on('message', function(msg) {
    if(msg.type == "chat"){
      sub.publish("emrchat",msg.message);  
    }
    else if(msg.type == "setUsername"){
      client.sadd("onlineUsers",msg.user);
      var tot = client.SMEMBERS("onlineUsers").length;
      sub.publish("emrchat", JSON.stringify({type:"user joined", username:msg.user, numUsers:tot}));
    }
  });

  client.on('disconnect', function() {
      pub.quit();
      sub.publish("emrchat","User is disconnected : " + client.id);
  });
});