
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

//server side using socket.io
io = require('socket.io').listen(server);

var id = 0;
io.sockets.on('connection',function(socket){
  if(id==4){
    socket.emit('full');
    return;
  }
  var seed = Math.random();
  socket.emit('id assignment', { 'id': id,'seed':seed });
  socket.broadcast.emit('reset',{'id':id,'seed':seed});
  var deadPlayers = [];
  var deadCount=0;
  id++;

  socket.on('player move', function (data) {
    socket.broadcast.emit('player move',data);
  });

  socket.on('player stop', function (data) {
    socket.broadcast.emit('player stop',data);
  });

  socket.on('player bomb', function (data) {
    socket.broadcast.emit('player bomb',data);
  });

  socket.on('player die', function (data) {
    socket.broadcast.emit('player die',data);
    if(!(data.id in deadPlayers)){
        deadCount++;
        deadPlayers[data.id] = true;
        if(deadCount < id-1) return;
        for(var i=0;i<id;i++){
            if(!(i in deadPlayers)){
                var seed = Math.random();
                socket.broadcast.emit('message',"<b>Player "+(i+1)+" wins!</b>");
                socket.emit('message',"<b>Player "+(i+1)+" wins!</b>");
                socket.broadcast.emit('reset',{'id':id-1,'seed':seed});
                socket.emit('reset',{'id':id-1,'seed':seed});
                console.log("game ended",deadCount,deadPlayers);
                deadCount=0;
                deadPlayers=[];
            }
        }
    }
  });

  socket.on('message', function (data) {
    socket.broadcast.emit('message', data);
  });
});
