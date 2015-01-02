'use strict';

/* Controllers */

angular.module('myApp.controllers', ['webStorageModule'])
    .controller('HomeCtrl', function($scope, $location, GameService, webStorage) {
        console.info('HomeCtrl loaded');

        var handleError = function(err) {
            console.error(err);
        };
		
		var sessionPlayerId = webStorage.get('playerId');
		var sessionPlayerName = webStorage.get('playerName');
		
		if(!sessionPlayerId){
			webStorage.add('playerId', GameService.playerId);
		}else{
			GameService.playerId = webStorage.get('playerId');
		}
			
		if(!sessionPlayerName){
			webStorage.add('playerName', GameService.playerName);
		}else{
			GameService.playerName = webStorage.get('playerName');
		}
		
        $scope.gameSvc = GameService;
		
        $scope.inLobby = true;

        $scope.createGame = function() {
            console.info('createGame called');
            GameService.initName();
            GameService.createGame()
                .then(function(success) {
                    //navigate to the new game
                    console.info(success);
                    $scope.joinGame(success.data.id);
                }, handleError);
        };
		
		$scope.joinGame = function(gameId) {
            console.info('joinGame called for gameId ' + gameId);
            GameService.initName();
			webStorage.add('playerName', GameService.playerName);
            $location.url("/game/"+ gameId + "/pId/" + GameService.playerId + "/name/" + GameService.playerName);
        };

        $scope.$on('enterLobby', function() {
            $scope.inLobby = true;
        });

        $scope.$on('enterGame', function() {
            $scope.inLobby = false;
        })

    })
    .controller('GameCtrl', function($scope, $routeParams, GameService){
        console.info('GameCtrl loaded');

        var socket;

        $scope.game = {};
        $scope.currentPlayer = {};
        $scope.progStyle = {width: '0%'};
        $scope.gameId = $routeParams.gameId;
        $scope.playerId = $routeParams.playerId;
		$scope.gameSvc.playerName = $routeParams.playerName;
        $scope.gameError;

        //ng-show helper functions
        $scope.showNotificationSelectCard = function() {
            return !$scope.currentPlayer.isCzar &&
                !$scope.currentPlayer.selectedWhiteCardId &&
                $scope.game.isStarted &&
                !$scope.game.isReadyForScoring
        };

        $scope.showNotificationWaitingOnCzar = function() {
            return !$scope.currentPlayer.isCzar &&
                $scope.game.isReadyForScoring &&
                !$scope.game.isReadyForReview
        };

        $scope.showNotificationWaitingOnCards = function() {
            return ($scope.currentPlayer.isCzar || $scope.currentPlayer.selectedWhiteCardId) &&
                !$scope.game.isReadyForScoring
        };

        $scope.showNotificationSelectWinner = function() {
            return $scope.currentPlayer.isCzar &&
                $scope.game.isReadyForScoring &&
                !$scope.game.isReadyForReview
        };

        $scope.showWhiteCardList = function() {
            return !$scope.currentPlayer.isCzar && $scope.game.isStarted && !$scope.game.isReadyForScoring
        };

        $scope.showSelectedWhiteCardList = function() {
            return ($scope.currentPlayer.isCzar && $scope.game.isStarted && $scope.game.isReadyForScoring) ||
                $scope.game.isReadyForReview
        };
        //end ng-show helper functions

        $scope.buildWinningText = function(history) {
            var text = history.black;

            if(text.indexOf("__________") != -1) {
                text = text.replace("__________", "<b>" + history.white + "</b>");
            } else {
                text = text + " <b>" + history.white + "</b>"
            }
            return text
        };

        $scope.whiteCardNonNull = function(item) {
            return item.selectedWhiteCardId != undefined;
        }

        $scope.getPlayerStatus = function(player) {
            var status ='';
            if(!$scope.game.isStarted) {
                status = "waiting";
            }
            else if(!$scope.game.isReadyForReview && !$scope.game.isReadyForScoring) {
                if(player.isCzar) {
                    status = "card czar";
                } else if(!player.selectedWhiteCardId) {
                    status = "selecting card";
                } else if(player.selectedWhiteCardId) {
                    status = "card selected";
                }
            }
            else if($scope.game.isReadyForReview) {
                if(player.isReady) {
                    status = "ready for next round";
                } else {
                    status = "reviewing results";
                }
            }
            else if($scope.game.isReadyForScoring) {
                if(player.isCzar) {
                    status = "selecting winner";
                } else {
                    status = "card selected"
                }
            }
            if($scope.game.isOver) {
                status = player.awesomePoints == $scope.game.pointsToWin ? "WINNER!" : "loser :(";
            }

            return status;
        }

        $scope.selectCard = function(card) {
            GameService.selectCard($scope.gameId, $scope.playerId, card);
        };

        $scope.getButtonClass = function(card) {
            if(card === $scope.currentPlayer.selectedWhiteCardId) {
                return 'btn btn-primary'
            } else {
                return 'btn btn-default'
            }
        };

        $scope.getButtonText = function(card) {
            if(card === $scope.currentPlayer.selectedWhiteCardId) {
                return 'selected'
            } else {
                return 'select'
            }
        };

        $scope.selectWinner = function(card) {
            GameService.selectWinner($scope.gameId, card);
        };

        $scope.getWinningCardClass = function(card) {
            if(card === $scope.game.winningCardId){
                return 'alert alert-success'
            } else {
                return ''
            }
        };

        $scope.readyForNextRound = function() {
            GameService.readyForNextRound($scope.gameId, $scope.playerId);
        };

        function setProgStyle() {
            if($scope.game){
                var playersWaiting = _.reduce($scope.game.players, function(total, player) {
                    if(player.selectedWhiteCardId){return total + 1}
                    else{ return total}
                }, 0);
                //this extra addition brings the progress bar to 100% when the game is ready for review
                if($scope.game.isReadyForReview){
                    playersWaiting += 1;
                }
                $scope.progStyle = {width: ((playersWaiting / $scope.game.players.length) * 100)  + '%'};
            }
        };

        function renderGame(game) {
            $scope.game = game;
            $scope.currentPlayer = _.find(game.players, function(p) {
                return p.id === $scope.playerId;
            });
            setProgStyle();
        };

        function initSocket() {
            socket = io.connect('/', {query: 'playerId=' + $routeParams.playerId});
            if(socket.socket.connected){
                socket.emit('connectToGame', { gameId: $routeParams.gameId, playerId: $routeParams.playerId, playerName: GameService.playerName });
            }
            socket.on('connect', function() {
                console.info('game socket connect');
                socket.emit('connectToGame', { gameId: $routeParams.gameId, playerId: $routeParams.playerId, playerName: GameService.playerName });
            });

            socket.on('updateGame', function(game) {
                console.info('updateGame');
                console.info(game);
                renderGame(game);
                $scope.$apply();
            });

            socket.on('gameError', function(errorMsg) {
                $scope.gameError = errorMsg;
                $scope.$apply();
            });
        }

        function joinGame() {
			GameService.getGame($scope.gameId)
                .then(function(success) {
                    var game = success.data;
					var playerExists = false;
                    var playerExists = game.players.length > 0 ? _.find(game.players, function(p) {
						return p.id === $scope.playerId;
					}) : false;
					if(playerExists){
						init(game);
					}else{
						GameService.joinGame($scope.gameId, $scope.playerId, GameService.playerName)
							.then(function(success) {
								init(success.data);
							},
						  function(error) {
							$scope.gameError = error.data.error;
						  });
					  }
				});
        
			
        };
		
		function init(game){
			renderGame(game);
			initSocket();
			$scope.game.disconnected = false;
		}

        joinGame();
        //initSocket();
        $scope.$emit('enterGame');

        $scope.$on('$destroy', function(event) {
            console.info('leaving GameCtrl');
            if($scope.game){
				GameService.departGame($scope.game.id, $scope.playerId);
            }
        });
    })
    .controller('LobbyCtrl', function($scope, $location, GameService, webStorage) {
        console.info('LobbyCtrl loaded');
        var socket;

        $scope.availableGames = [];
		$scope.joinedGames = [];
        $scope.creatingGame = false;
        $scope.gameSvc = GameService;

        $scope.getGames = function() {
            GameService.getGames()
                .then(function(success) {
                    var games = success.data;
                    console.info('getGames returned ' + games.length + ' items');
                    $scope.availableGames = games;
            });
        };
		
		$scope.getJoinedGames = function() {
            GameService.getJoinedGames()
                .then(function(success) {
                    var games = success.data;
                    console.info('getJoinedGames returned ' + games.length + ' items');
                    $scope.joinedGames = games;
            });
        };
		
        function initSocket() {
            socket = io.connect('/lobby');
            if(socket.socket.connected){
                $scope.getGames();
				$scope.getJoinedGames();
            }
            socket.on('connect', function() {
                console.info('lobby socket connect');
            });

            socket.on('lobbyJoin', function(gameList) {
                console.info('lobbySocket: lobbyJoin');
                $scope.availableGames = gameList;
                $scope.$apply();
            });

            socket.on('gameAdded', function(gameList) {
                console.info('gameAdded');
                console.info(gameList);
                $scope.availableGames = gameList;
                $scope.$apply();
            });
			
			socket.on('leftGame', function(gameList) {
                console.info('leftGame');
                console.info(gameList);
                $scope.joinedGames = gameList;
                $scope.$apply();
            });
        }
        initSocket();
        $scope.$emit('enterLobby');
    });
