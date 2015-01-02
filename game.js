var _ = require('underscore');
var cards = require('./cards.js');

var gameList = [];

function getDeck() {
  return cards.getDeck();
}

function removeFromArray(array, item) {
  var index = array.indexOf(item);
  if(index !== -1) {
    array.splice(index, 1);
  }
}

function list() {
  return toInfo(_.filter(gameList, function(x) {
    return x.players.length < x.maxPlayers && !x.isStarted
  }));
}

function listJoinedGames(playerId) {
  return toInfo(_.filter(gameList, function(x) {
	var players = x.previousPlayers;
	var activePlayers = x.players;
	if(!players || players.length == 0) return false;
	for(var i = 0; i < players.length; i++) {
        if (players[i]['id'] === playerId){ 
			return !x.isOver;
		}
    }
    return false;
  }));
}

function listAll() {
  return toInfo(gameList);
}

function toInfo(fullGameList) {
  return _.map(fullGameList, function(game) {
    return { id: game.id, name: game.name, players: game.players.length };
  });
}
function addGame(game) {
  game.players = [];
  game.previousPlayers = [];
  game.maxPlayers = 4;
  game.history = [];
  game.isOver = false;
  game.winnerId = null;
  game.winningCardId = null;
  game.isStarted = false;
  game.deck = getDeck();
  game.currentBlackCard = "";
  game.isReadyForScoring = false;
  game.isReadyForReview = false;
  game.pointsToWin = 5;
  game.czarIterator = new Iterator(game.players);
  gameList.push(game);
  return game;
  
}

function getGame(gameId) {
    return _.find(gameList, function(x) { return x.id === gameId; }) || undefined;
}

function joinGame(game, player) {
	var existingPlayer = game.previousPlayers.length > 0 ? _.find(game.previousPlayers, function(p) {
						return p.id === player.id;
					}) : false;
    var joiningPlayer = existingPlayer || {
		id: player.id,
		name: player.name,
		isReady: false,
		cards : [],
		selectedWhiteCardId: null,
		awesomePoints: 0,
		isCzar: false
		};

	if(joiningPlayer.cards.length == 0 && !joiningPlayer.isCzar){
		for(var i = 0; i < 7; i++) {
			drawWhiteCard(game, joiningPlayer);
		}
	}
	
	if(!existingPlayer)
		joiningPlayer.position = game.players.length;
	
	if(joiningPlayer.position >= 0 && joiningPlayer.position <= game.players.length){
		game.players.splice(joiningPlayer.position, 0, joiningPlayer);
	}else{
		game.players.push(joiningPlayer);
	}

    if(game.players.length === game.maxPlayers) {
        if(!game.isStarted){
            startGame(game);
        }else{
			if(joiningPlayer.isCzar){
				var currentCzar = game.czarIterator.current();
				if(currentCzar) currentCzar.isCzar = false;
			}
			game.czarIterator.arr = game.players;
			game.czarIterator.index = joiningPlayer.position;
		}
    }
	removeFromArray(game.previousPlayers, existingPlayer);
    return game;
}

function departGame(game, playerId) {
    console.info('depart game: ' + game.name);
	var departingPlayer = _.find(game.players, function(p){
		return p.id === playerId;
	});
	var previouslyDeparted = _.find(game.previousPlayers, function(p){
		return p.id === playerId;
	}) || false;
	if(!departingPlayer) return;
	
	if(previouslyDeparted)
		previouslyDeparted = _(departingPlayer).clone();
	else
		game.previousPlayers.push(_(departingPlayer).clone());
		
	if(departingPlayer.isCzar)
		assignCzar(game);
		
	removeFromArray(game.players, departingPlayer);
			
	if(game.players.length === 0){
		//kill the game
		game.isOver = true;
		removeFromArray(gameList, game);
	}
	if(game.isStarted && game.players.length <= 2){
		// wait for opponents
	}
	
	return game;
}

function startGame(game) {
  game.isStarted = true;
  setCurrentBlackCard(game);
  assignCzar(game);
}

function roundEnded(game) {
	game.winnerId = null;
	game.winningCardId = null;
	game.isReadyForScoring = false;
	game.isReadyForReview = false;

	setCurrentBlackCard(game);

	_.each(game.players, function(player) {
	if(!player.isCzar) {
	  removeFromArray(player.cards, player.selectedWhiteCardId);
	  drawWhiteCard(game, player);
	}

	player.isReady = false;
	player.selectedWhiteCardId = null;
	});

	assignCzar(game);
	if(game.isOver){
		_.map(game.players, function(p) {
			p.awesomePoints = 0;
		});
		game.isOver = false;
	}
}

function assignCzar(game){
	var czar = game.czarIterator.current();
	if(game.players.length != game.czarIterator.arr.length)
		game.czarIterator.arr = game.players;
	var next = game.czarIterator.next();
	
	if(czar) czar.isCzar = false;
	if(next) next.isCzar = true;
}

function drawWhiteCard(game, player) {
  var whiteIndex = Math.floor(Math.random() * game.deck.white.length);
  player.cards.push(game.deck.white[whiteIndex]);
  game.deck.white.splice(whiteIndex, 1);
}

function setCurrentBlackCard(game) {
  var index = Math.floor(Math.random() * game.deck.black.length);
  game.currentBlackCard = game.deck.black[index];
  game.deck.black.splice(index, 1);
}

function getPlayer(gameId, playerId) {
  var game = getGame(gameId);
  return _.find(game.players, function(x) { return x.id === playerId; });
}

function getPlayerByCardId(gameId, cardId) {
  var game = getGame(gameId);
  return _.findWhere(game.players, { selectedWhiteCardId: cardId });
}

function readyForNextRound(gameId, playerId) {
  var player = getPlayer(gameId, playerId);
  player.isReady = true;

  var game = getGame(gameId);
  var allReady = _.every(game.players, function(x) {
    return x.isReady;
  });

  if(allReady) {
    roundEnded(game);
  }
}

function selectCard(gameId, playerId, whiteCardId) {
  var player = getPlayer(gameId, playerId);
  player.selectedWhiteCardId = whiteCardId;
  player.isReady = false;

  var game = getGame(gameId);

  var readyPlayers = _.filter(game.players, function (x) {
    return x.selectedWhiteCardId;
  });

  if(readyPlayers.length === game.players.length-1) {
    game.isReadyForScoring = true;
  }
}

function selectWinner(gameId, cardId) {
  var player = getPlayerByCardId(gameId, cardId);
  var game = getGame(gameId);
  game.winningCardId = cardId;
  game.isReadyForReview = true;
  player.awesomePoints = player.awesomePoints + 1;
  game.history.push({ black: game.currentBlackCard, white: cardId, winner: player.name });
  if(player.awesomePoints === game.pointsToWin) {
    game = getGame(gameId);
    game.isOver = true;
    game.winnerId = player.id;
  }
}

function reset(){
  gameList = [];
}


  
  function Iterator(arr){
		this.index = -1;
		this.arr = arr;
		this.isEmpty = function(){ return this.arr.length == 0; };
		this.hasNext = function(){ return this.index < this.arr.length; };
		this.hasPrevious = function(){ return this.index >= 0; };

		this.current = function(){ return this.arr[ this["index"] ]; };

		this.next = function(){
			this.index += 1; 
			if(this.hasNext()){       
				return this.current();
			}else if(!this.isEmpty()){
				this.index = 0;
				return this.current();
			}
			return false;
		};

		this.previous = function(){
			this.index -= 1;
			if(this.hasPrevious()){
				return this.current();
			}else if(!this.isEmpty()){
				this.index = this.arr.length-1;
				return this.current();
			}
			return false;
		};
	}

exports.list = list;
exports.listJoinedGames = listJoinedGames;
exports.listAll = listAll;
exports.addGame = addGame;
exports.getGame = getGame;
exports.getPlayer = getPlayer;
exports.joinGame = joinGame;
exports.departGame = departGame;
exports.readyForNextRound = readyForNextRound;
exports.reset = reset;
exports.roundEnded = roundEnded;
exports.selectCard = selectCard;
exports.selectWinner = selectWinner;
exports.removeFromArray = removeFromArray;
exports.getDeck = getDeck;
