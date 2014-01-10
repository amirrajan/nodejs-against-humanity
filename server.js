var express = require('express');
var app = express();
var server = require('http').createServer(app);
var Game = require('./game.js');
var routes = require('./routes/routes.js');
var players = { };
var io = require('socket.io').listen(server);
var socketCount = 0;

server.listen(process.env.PORT || 3000);

app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(app.router);
app.use('/public', express.static('public'));

function returnGame(gameId, res) { res.json(gameViewModel(gameId)); }

function broadcastGame(gameId) {
  for(var player in players[gameId]) {
    players[gameId][player].emit("updateGame", gameViewModel(gameId));
  }
}

function gameViewModel(gameId) {
  var game = Game.getGame(gameId);
  var viewModel = JSON.parse(JSON.stringify(game));
  delete viewModel.deck;
  return viewModel;
}

var lobbySocket = io
    .of('/lobby')
    .on('connection', function(socket) {
        console.info('lobby socket connect');
        var gameList = Game.list();
        socket.emit('lobbyJoin', gameList);
    })

io.sockets.on('connection', function(socket) {
    socketCount+=1;
    console.info('*****SocketCount: ' + socketCount);
    socket.on('connectToGame', function(data) {
        console.info('server: connectToGame');
        var game = Game.getGame(data.gameId);
        if(game){
          if(!players[data.gameId]) {
              players[data.gameId] = { };
          }
          socket.gameId = data.gameId;
          socket.playerId = data.playerId;
          players[data.gameId][data.playerId] = socket;
          broadcastGame(data.gameId);
        } else {
            socket.emit('gameError', 'Invalid Game ID');
        }
  });

  socket.on('disconnect', function() {
    socketCount-=1;
    if(socket.playerId && socket.gameId){
        console.info('socket disconnect ' + socket.playerId);
        delete players[socket.gameId][socket.playerId];
        Game.departGame(socket.gameId, socket.playerId);
        lobbySocket.emit('gameAdded', Game.list());
    }
  });
});

app.get('/', routes.index);
app.get('/views/*', routes.partials);
app.get('/list', function (req, res) { res.json(Game.list()); });
app.get('/listall', function (req, res) { res.json(Game.listAll()); });
app.post('/add', function (req, res) {
    var newGame = Game.addGame(req.body);
    res.json(newGame);
    lobbySocket.emit('gameAdded', Game.list());
});
app.get('/gamebyid', function (req, res) { res.json(Game.getGame(req.query.id)); });

app.post('/joingame', function (req, res) {
  var game = Game.getGame(req.body.gameId);
  if(!game) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({ error: "invalid GameId" }));
    res.end();
    return null;
  }

  if(game.isStarted || game.players.length >= 4) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({ error: "too many players" }));
    res.end();
    return null;
  }

  game = Game.joinGame(game, { id: req.body.playerId, name: req.body.playerName });
  returnGame(req.body.gameId, res);
  lobbySocket.emit('gameAdded', Game.list());
});

app.post('/departgame', function(req, res) {
    Game.departGame(req.body.gameId, req.body.playerId);
    lobbySocket.emit('gameAdded', Game.list());
    broadcastGame(req.body.gameId);
});

app.post('/selectcard', function(req, res) {
  Game.selectCard(req.body.gameId, req.body.playerId, req.body.whiteCardId);
  broadcastGame(req.body.gameId);
  returnGame(req.body.gameId, res);
});

app.post('/selectWinner', function(req, res) {
  Game.selectWinner(req.body.gameId, req.body.cardId);
  broadcastGame(req.body.gameId);
  returnGame(req.body.gameId, res);
});

app.post('/readyForNextRound', function(req, res){
  Game.readyForNextRound(req.body.gameId, req.body.playerId);
  broadcastGame(req.body.gameId);
  returnGame(req.body.gameId, res);
});
