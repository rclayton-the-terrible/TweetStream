
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , amqp = require('amqp')
  , MemoryStore = express.session.MemoryStore
  , sessionStore = new MemoryStore()
  , parseCookie = require('connect').utils.parseCookie
  , app = module.exports = express.createServer()
  , io = require('socket.io').listen(app)
  , connection = amqp.createConnection(
    { host: "localhost", port: 5672, username: "guest", password: "guest", vhost: "/" });

// Configure Express
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session(
       {store: sessionStore, secret: 'secret', key: 'express.sid'}));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});


io.set('authorization', function (data, accept) {
    if (data.headers.cookie) {
        data.cookie = parseCookie(data.headers.cookie);
        data.sessionID = data.cookie['express.sid'];
        // (literally) get the session data from the session store
        sessionStore.get(data.sessionID, function (err, session) {
            if (err || !session) {
                // if we cannot grab a session, turn down the connection
                accept('Error', false);
            } else {
                // save the session data and accept the connection
                data.session = session;
                accept(null, true);
            }
        });
    } else {
       return accept('No cookie transmitted.', false);
    }
});

// Routes

app.get('/', routes.index);

app.listen(3000, function(){

    console.log("Started Express");

    connection.on('ready', function(){

        console.log("AQMP Connection Ready");

        io.sockets.on('connection',
            function (socket) {

                var sessionID = socket.handshake.sessionID;

                bind_queue_and_socket(socket, sessionID, "pegasus", "com.berico.tweetstream.Tweet", "tweets");

                bind_queue_and_socket(socket, sessionID, "pegasus", "com.berico.tweetstream.wordcount.TopNWords", "topnwords");

        });
    });

});

function bind_queue_and_socket(socket, sessionID, exchange, event_type, ref_type){

    var queue_name = ref_type + "_" + sessionID;

    console.log("Registering " + ref_type + " Queue: " + queue_name);

    var q = connection.queue(queue_name, { exclusive: true }, function(){

    q.bind(exchange, event_type);

    q.subscribe(
        {ack:true},
        function(message){
            socket.emit(ref_type, message.data.toString());
            q.shift();
        });
    });
}