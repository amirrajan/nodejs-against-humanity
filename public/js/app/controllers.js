'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
    .controller('HomeCtrl', function($scope, $location, GameService) {
        console.info('HomeCtrl loaded');

        var handleError = function(err) {
            console.error(err);
        };

        $scope.gameSvc = GameService;
        $scope.inLobby = true;

        $scope.joinGame = function(gameId) {
            console.info('joinGame called for gameId ' + gameId);
            GameService.initName();
            $location.url("/game/"+ gameId + "/pId/" + GameService.playerId + "/name/" + GameService.playerName);
        };

        $scope.$on('enterLobby', function() {
            $scope.inLobby = true;
        });

        $scope.$on('enterGame', function() {
            $scope.inLobby = false;
        });

    })
    .controller('GameCtrl', function($scope, $routeParams, GameService){
        console.info('GameCtrl loaded');

        var socket;

        $scope.game = {};
        $scope.currentPlayer = {};
        $scope.progStyle = {width: '0%'};
        $scope.gameId = $routeParams.gameId;
        $scope.playerId = $routeParams.playerId;
        $scope.gameError;

        GameService.playerName = $routeParams.playerName;

        //ng-show helper functions
        $scope.showNotificationSelectCard = function() {
            return !$scope.currentPlayer.isCzar &&
                $scope.currentPlayer.selectedWhiteCardIds.length < $scope.game.whiteCardsRequired &&
                $scope.game.isStarted &&
                !$scope.game.isReadyForScoring
        };

        $scope.showNotificationWaitingOnCzar = function() {
            return !$scope.currentPlayer.isCzar &&
                $scope.game.isReadyForScoring &&
                !$scope.game.isReadyForReview
        };

        $scope.showNotificationWaitingOnCards = function() {
            return ($scope.currentPlayer.isCzar || $scope.currentPlayer.selectedWhiteCardIds.length === $scope.game.whiteCardsRequired) &&
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

      $scope.getCardRequiredCount = function() {
        return $scope.game.whiteCardsRequired - $scope.currentPlayer.selectedWhiteCardIds.length;
      };

        $scope.buildWinningText = function(history) {
            var text = history.black;

            if(text.indexOf("_") != -1) {
                text = text.replace("_", "<b>" + history.white + "</b>");
            } else {
                text = text + " <b>" + history.white + "</b>"
            }
            return text
        };

        $scope.whiteCardNonNull = function(item) {
            return item.selectedWhiteCardIds.length > 0;
        };

        $scope.getPlayerStatus = function(player) {
            var status ='';
            if(!$scope.game.isStarted) {
                status = "waiting";
            }
            else if(!$scope.game.isReadyForReview && !$scope.game.isReadyForScoring) {
                if(player.isCzar) {
                    status = "card czar";
                } else if(player.selectedWhiteCardIds.length < $scope.game.whiteCardsRequired) {
                    status = "selecting cards";
                } else if(player.selectedWhiteCardIds.length === $scope.game.whiteCardsRequired) {
                    status = "cards selected";
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

        $scope.selectCard = function(card, index) {
            GameService.selectCard($scope.gameId, $scope.playerId, card, index);
        };

        $scope.getButtonDisabled = function(card, index) {
            //If it's used in another index we need to disable it here
            let disabled = false;
            $scope.currentPlayer.selectedWhiteCardIds.forEach((selectedCard, selectedIndex) => {
                if (selectedIndex !== index && selectedCard === card) {
                    disabled = true;
                }
            });
            return disabled;
        };

        $scope.getButtonClass = function(card, index) {
            if($scope.currentPlayer.selectedWhiteCardIds[index] !== undefined && card === $scope.currentPlayer.selectedWhiteCardIds[index]) {
                return 'btn btn-primary'
            } else {
                return 'btn btn-default'
            }
        };

        $scope.getButtonText = function(card, index) {
            if($scope.currentPlayer.selectedWhiteCardIds[index] !== undefined && card === $scope.currentPlayer.selectedWhiteCardIds[index]) {
                return 'selected'
            } else {
                return 'select'
            }
        };

        $scope.selectWinner = function(playerId) {
            GameService.selectWinner($scope.gameId, playerId);
        };

        $scope.getWinningCardClass = function(playerId) {
            if(playerId === $scope.game.winningPlayerId){
                return 'alert alert-success'
            } else {
                return ''
            }
        };

        $scope.readyForNextRound = function() {
            GameService.readyForNextRound($scope.gameId, $scope.playerId);
        };

        $scope.getWhiteCardCount = function() {
            return _.range($scope.game.whiteCardsRequired);
        };

        $scope.getBlackCardHtml = function(blackCard, whiteCards) {
            //If there's no underscores to replace, tack the answers onto the end
            if (blackCard.indexOf('_') === -1) {
                let returnString = blackCard;
                whiteCards.forEach(x => returnString = returnString + '<span class="blackCardAnswer">' + x + '</span>');
                return returnString;
            }
            let z = -1;
            return blackCard.replace(/_/g, function() {
                z++;
                if (whiteCards[z] !== undefined) {
                    //Trim punctuation from white card
                    const whiteCardAnswer = whiteCards[z].replace(/\./g, '');
                    return '<span class="blackCardAnswer">' + whiteCardAnswer + '</span>';
                } else {
                    return "_";
                }
            });
        };

        function setProgStyle() {
            if($scope.game){
                var playersWaiting = _.reduce($scope.game.players, function(total, player) {
                    if(player.selectedWhiteCardIds.length === $scope.game.whiteCardsRequired){return total + 1}
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
            GameService.joinGame($routeParams.gameId, $routeParams.playerId, $routeParams.playerName)
                .then(function(success) {
                    renderGame(success.data);
                    initSocket();
                },
              function(error) {
                $scope.gameError = error.data.error;
              });
        };

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
    .controller('LobbyCtrl', function($scope, $location, GameService) {
        console.info('LobbyCtrl loaded');
        var socket;

        $scope.availableGames = [];
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

        function initSocket() {
            socket = io.connect('/lobby');
            if(socket.socket.connected){
                $scope.getGames();
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
        }
        initSocket();
        $scope.$emit('enterLobby');
    })
    .controller('CreateGameCtrl', function ($scope, $http, $location, GameService) {
        $scope.name = null;
        $scope.submitted = false;

        $scope.createGame = function (form) {
            $scope.submitted = true;
            if (!form.$valid) {
                return false;
            }
            //Validate that at least one set has been chosen
            if ($scope.sets.filter(set => set.enabled).length == 0 && $scope.expansions.filter(set => set.enabled).length == 0) {
                $scope.error = "You must select at least one deck.";
                return false;
            }
            //Create the game
            GameService.createGame($scope.name, $scope.sets.filter(set => set.enabled).map(set => set.id), $scope.expansions.filter(expansion => expansion.enabled).map(expansion => expansion.id))
                .then(function (success) {
                    GameService.initName();
                    $location.url("/game/" + success.data.id + "/pId/" + GameService.playerId + "/name/" + GameService.playerName);
                });
        };

        function initGameName() {
            if (GameService.playerName.length > 0) {
                $scope.name = GameService.playerName + "'s game";
            }
        }

        initGameName();
        //Initialise card sets
        $http.get('/cardSets').then(function(response) {
            $scope.sets = response.data;
            //Enable base
            $scope.sets.map(set => set.enabled = set.id == "Base");
        });
        //Initialise expansions
        $http.get('/expansions').then(function(response) {
           $scope.expansions = response.data;
        });
    });
