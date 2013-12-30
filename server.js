var express = require('express');
var app = express();
var server = require('http').createServer(app);
var Game = require('./game.js');
var players = { };
var io = require('socket.io').listen(server);

server.listen(process.env.PORT || 3000);

app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(app.router);
app.use('/public', express.static('public'));

function json(o, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.write(JSON.stringify(o));
  res.end();
}

function returnGame(gameId, res) { json(gameViewModel(gameId), res); }

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
        var gameList = Game.list();
        socket.emit('lobbyJoin', gameList);
    })

io.sockets.on('connection', function(socket) {
  socket.on('connectToGame', function(data) {
    if(!players[data.gameId[0]]) {
      players[data.gameId[0]] = { };
    }

    socket.gameId = data.gameId[0];
    socket.playerId = data.playerId[0];
    players[data.gameId][data.playerId[0]] = socket;
    broadcastGame(data.gameId[0]);
  });

  socket.on('disconnect', function() {
    if(socket.playerId && socket.gameId){
        delete players[socket.gameId][socket.playerId];
    }
  });
});

app.get('/', function (req, res) { res.render('index'); });
app.get('/game', function (req, res) { res.render('game'); });
app.get('/list', function (req, res) { json(Game.list(), res); });
app.get('/listall', function (req, res) { json(Game.listAll(), res); });
app.post('/add', function (req, res) {
    var newGame = Game.addGame(req.body);
    json(newGame, res);
    lobbySocket.emit('gameAdded', Game.list());
});
app.get('/gamebyid', function (req, res) { json(Game.getGame(req.query.id), res); });

app.post('/joingame', function (req, res) {
  var game = Game.getGame(req.body.gameId);

  if(game.isStarted) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({ error: "too many players" }));
    res.end();
    return null;
  }

  game = Game.joinGame(game, { id: req.body.playerId, name: req.body.playerName });
  returnGame(req.body.gameId, res);
  lobbySocket.emit('gameAdded', Game.list());
});

app.post('/selectcard', function(req, res) {
  Game.selectCard(req.body.gameId[0], req.body.playerId[0], req.body.whiteCardId);
  broadcastGame(req.body.gameId[0]);
  returnGame(req.body.gameId[0], res);
});

app.post('/selectWinner', function(req, res) {
  Game.selectWinner(req.body.gameId[0], req.body.cardId);
  broadcastGame(req.body.gameId[0]);
  returnGame(req.body.gameId[0], res);
});

app.post('/readyForNextRound', function(req, res){
  Game.readyForNextRound(req.body.gameId[0], req.body.playerId[0]);
  broadcastGame(req.body.gameId[0]);
  returnGame(req.body.gameId[0], res);
});
