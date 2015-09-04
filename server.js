var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io')(server);

var port = process.env.PORT || process.argv[2];
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
      client.sadd("onlineUsers", msg.user);
 
      var getUser = function(callback){
        var users=[];

        client.smembers("onlineUsers", function(error, replies){
          if(!replies || replies.length==0){
            console.log("None");
            return;
          }

          var mutex = replies.length;

          for(var key in replies) {

            client.hgetall(replies[key], function(err, reply){
              users[user.length]=reply;

              if(mutex==0){
                return users;
              }

            });
          }
        });
      };

      //var tot = client.scard("onlineUsers");
      sub.publish("emrchat", JSON.stringify({type:"user joined", numUsers:getUser, username:msg.user}));
    }
  });

  client.on('disconnect', function() {
      pub.quit();
      sub.publish("emrchat","User is disconnected : " + client.id);
  });

});