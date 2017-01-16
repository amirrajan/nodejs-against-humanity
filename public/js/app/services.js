'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', [])
  .factory('GameService', function($http) {
        var s4 = function() {
            return Math.floor(Math.random() * 0x10000).toString();
        };
        var guid = function(){
            return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
        };
        var pId = guid();

        return {
            playerName: '',
            playerId : pId,
            newGameId : guid(),
            currentGameId: undefined,
            initName: function() {
                if(this.playerName.length === 0) {
                    this.playerName = 'anonymous ' + s4();
                }
            },
            getGames: function() {
                return $http.get('/list');
            },
            createGame: function(name, sets, expansions) {
                return $http.post('/add', { id: guid(), name: name, sets: sets, expansions: expansions});
            },
            joinGame: function(gameId, playerId, name) {
                return $http.post("/joingame", { gameId: gameId, playerId: playerId, playerName: name });
            },
            departGame: function(gameId, playerId) {
                $http.post('/departgame', { gameId: gameId, playerId: playerId});
            },
            selectCard: function(gameId, playerId, selectedCard, index){
                $http.post("/selectCard", { gameId: gameId, playerId: playerId, whiteCardId: selectedCard, index: index });
            },
            selectWinner: function(gameId, selectedPlayer) {
                $http.post("/selectWinner", { gameId: gameId, playerId: selectedPlayer });
            },
            readyForNextRound: function(gameId, playerId) {
                $http.post("readyForNextRound",  { playerId: playerId, gameId: gameId });
            }
        };
    });
