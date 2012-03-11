var sys = require('sys');
var amqp = require("amqp");
var express = require("express");
var app = express.createServer();
var connection = amqp.createConnection({ host: 'localhost' });

connection.addListener('ready', function(){
  var exchange = connection.exchange('pegasus');
  var queue = connection.queue('pushup_queue')
  queue.bind('pegasus', 'com.berico.tweetstream.Tweet')

  app.listen(3000, function(){
    console.log('listening for connections on port 3000')
    var socket = io.listen(app);

    socket.on('connection', function(client){
      //client.on('message', function(msg){
      //  exchange.publish("key.a.b", msg);
      //
      //})
      client.on('disconnect', function(){})

      queue.subscribe( {ack:true}, function(message){

        client.send(message.data.toString())

        queue.shift()
      })
    })

  });
});

