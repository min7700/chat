var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs');

var port = process.env.PORT || 5000;
console.log("Listening on " + port);
 
app.listen(port);

function handler (req, res) {
  fs.readFile(__dirname + '/public/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

var pub = require("redis").createClient();
var sub = require("redis").createClient();
var client = require("redis").createClient();


io.sockets.on('connection', function (socket) {
  
  pub.subscribe("emrchat");
  
    pub.on("message", function(channel, message) {
        socket.send(message);
    });

    socket.on('message', function(msg) {
      console.log(msg);
      if(msg.type == "chat"){
        sub.publish("emrchat",msg.message);  
      }
      else if(msg.type == "setUsername"){
        sub.publish("emrchat", "A New User is connected : " + msg.user);
        client.sadd("onlineUsers",msg.user);
      }
    });

    client.on('disconnect', function() {
        pub.quit();
        sub.publish("emrchat","User is disconnected : " + client.id);
    });
});