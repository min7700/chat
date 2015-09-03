var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io')(server);
 
var port = process.env.PORT || process.argv[2];
console.log("Listening on " + port);
 
server.listen(port);
 
app.use(express.static(__dirname + '/public')); 
 
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
  var redis1 = require("redis").createClient();
  var redis2 = require("redis").createClient();
  var redis3 = require("redis").createClient();
}

io.sockets.on('connection', function (client) {
  redis1.subscribe("emrchat");

  redis1.on("message", function(channel, message) {
      console.log(channel + " || " + message);
      client.send(message);
  });

  client.on('message', function(msg) {
    redis2.publish("emrchat",message);
  });

  client.on('add user', function(user) {
    redis2.publish("emrchat", "A New User is connected : " + user);
    redis3.sadd("onlineUsers",user);
  });

  client.on('disconnect', function() {
    redis1.quit();
    redis2.publish("emrchat","User is disconnected : " + client.id);
  });
});