var redisInfo = {
    host: '127.0.01',
    port: 6379
};

var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io')(server);
 
var port = process.env.PORT || process.argv[2];
console.log("Listening on " + port);
 
server.listen(port);
 
app.use(express.static(__dirname + '/public')); 
 
//If you are using your own Redis server
var redis = require('redis');
var RedisStore = require('socket.io-redis');
var pub = redis.createClient(redisInfo.port, redisInfo.host);
var sub = redis.createClient(redisInfo.port, redisInfo.host);
var client = redis.createClient(redisInfo.port, redisInfo.host);

io.configure(function(){
    io.set('store', new RedisStore({
        redisPub: pub,
        redisSub : sub,
        redisClient : client
    }));
});

io.sockets.on('connection', function (sockets) {
  redis1.subscribe("emrchat");

  redis1.on("message", function(channel, message) {
      console.log(channel + " || " + message);
      sockets.send(message);
  });

  sockets.on('message', function(msg) {
    redis2.publish("emrchat",message);
  });

  sockets.on('add user', function(user) {
    redis2.publish("emrchat", "A New User is connected : " + user);
    redis3.sadd("onlineUsers",user);
  });

  sockets.on('disconnect', function() {
    redis1.quit();
    redis2.publish("emrchat","User is disconnected : " + sockets.id);
  });
});