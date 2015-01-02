'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', [])
  .factory('GameService', function($http) {
        var s4 = function() {
            return Math.floor(Math.random() * 0x10000).toString();
        }
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
            getJoinedGames: function() {
                return $http.get('/joinedgames', { params: { playerId: this.playerId }});
            },
            getGame: function(gameId) {
                return $http.get('/gamebyid', { params: { id: gameId }});
            },
            createGame: function() {
                return $http.post('/add', { id: guid(), name: this.playerName + "'s game" });
            },
            joinGame: function(gameId, playerId, name) {
                return $http.post("/joingame", { gameId: gameId, playerId: playerId, playerName: name });
            },
            departGame: function(gameId, playerId) {
                $http.post('/departgame', { gameId: gameId, playerId: playerId}, {unique: true, requestId: 'depart-game'});
            },
            selectCard: function(gameId, playerId, selectedCard){
                $http.post("/selectCard", { gameId: gameId, playerId: playerId, whiteCardId: selectedCard });
            },
            selectWinner: function(gameId, selectedCard) {
                $http.post("/selectWinner", { gameId: gameId, cardId: selectedCard });
            },
            readyForNextRound: function(gameId, playerId) {
                $http.post("readyForNextRound",  { playerId: playerId, gameId: gameId });
            }
        }
    });
