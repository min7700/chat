var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io')(server);

var port = process.env.PORT || process.argv[2];
console.log("Listening on " + port);
 
server.listen(port);

app.use(express.static(__dirname + '/public')); 

var redis = require("redis");
var pub = redis.createClient();
var sub = redis.createClient();
var client = redis.createClient();

var numUsers = 0;
pub.subscribe("emrchat");

io.sockets.on('connection', function (socket) {
 
  pub.on("message", function(channel, message) {
    socket.send(message);
  });

  socket.on('message', function(msg) {
    if(msg.type == "chat"){
      sub.publish("emrchat",msg.message);  
    }
    else if(msg.type == "setUsername"){
      client.sadd("onlineUsers", msg.user);

      var returnNames = [];
      client.smembers('onlineUsers',function(err,obj){
        returnNames = returnNames.concat(obj);
        console.log("|" + returnNames);
      });
      numUsers = returnNames.length;
      console.log(numUsers);

      //var tot = client.scard("onlineUsers");
      sub.publish("emrchat", JSON.stringify({type:"user joined", numUsers:returnNames, username:msg.user}));
    }
  });

  client.on('disconnect', function() {
      pub.quit();
      sub.publish("emrchat","User is disconnected : " + client.id);
  });

});