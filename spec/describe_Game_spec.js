var _ = require('underscore');
var Game = require('../game.js');
var cards = require('../cards.js');

describe('multi-libs', function() {
  var playerList = [
    "Player1",
    "Player2",
    "Player3",
    "Player4"
  ];
  var gameId = "ANewGame";
  var currentGame;

  function createGame() {
    Game.addGame({ id: gameId, name: "some game", sets: ["Base"] });
    currentGame = Game.getGame(gameId);
  };

  function joinCurrentGame(playerId) {
    Game.joinGame(currentGame, { id: playerId, name: playerId });
  };

  function playCard(playerId) {
    var player = _.findWhere(currentGame.players, { id: playerId });
    expect(player.isCzar).toBe(false);
    Game.selectCard(currentGame.id, playerId, player.cards[0]);
    currentGame = Game.getGame(gameId);
  };

  function allPlayersButCzarPlayCard() {
      _.map(playerList, function(p) {
          var player = _.findWhere(currentGame.players, { id: p });
          if(!player.isCzar) {
              playCard(p);
          }
      });
  };

  function getFirstNonCzar(game) {
      return _.find(currentGame.players, function(p) {
          return p.isCzar === false;
      })
  };

  function startGame() {
    createGame();
    _.map(playerList, function(p) {
      joinCurrentGame(p);
    });
    currentGame = Game.getGame(gameId);
  };

  beforeEach(Game.reset);

  describe('creating a game', function() {
    beforeEach(createGame);

    it('the game isn\'t considered started', function() {
      expect(currentGame.isStarted).toBe(false);
    });

    it('a deck is created', function() {
      expect(currentGame.deck.black.length).toBe(cards.getDeckFromSets(["Base"]).black.length);
      expect(currentGame.deck.white.length).toBe(cards.getDeckFromSets(["Base"]).white.length);
    });

    it('the game is listed for joining', function() {
      expect(Game.list()[0].id).toBe(gameId);
    });
  });

  describe('4 people join a game', function() {
    beforeEach(startGame);

    it('the game is started with', function() {
      expect(currentGame.isStarted).toBe(true);
    });

    it('the black card is selected for play', function() {
      expect(currentGame.currentBlackCard).toBeTruthy();
    });

    it('player one is selected as the Card Czar', function() {
      expect(currentGame.players[0].isCzar).toBe(true);
    });

    it('each player has 7 cards drawn', function() {
      expect(currentGame.players[0].cards.length).toBe(7);
      expect(currentGame.players[1].cards.length).toBe(7);
      expect(currentGame.players[2].cards.length).toBe(7);
      expect(currentGame.players[3].cards.length).toBe(7);
    });
  });

  describe('round', function() {
    beforeEach(startGame);

    describe('each player except the czar plays a card', function() {
      beforeEach(function() {
          allPlayersButCzarPlayCard();
      });

      it('the round is ready for scoring', function() {
        expect(currentGame.isReadyForScoring).toBe(true);
      });

      describe('card czar selects winner', function() {
        var cardId;

        beforeEach(function() {
          var playerToPick = getFirstNonCzar(currentGame);
          cardId = playerToPick.cards[0];
          Game.selectWinner(gameId, cardId);
          currentGame = Game.getGame(gameId);
        });

        it('sets the winning card for the round', function() {
          expect(currentGame.winningCardId).toBe(cardId);
        });

        it('the round is ready for review', function() {
          expect(currentGame.isReadyForReview).toBe(true);
        });

        it('player is given awesome points', function() {
          expect(currentGame.players[1].awesomePoints).toBe(1);
        });

        describe('everyone has reviewed the cards', function() {
          var whiteCardCount;
          var blackCardCount
          var blackCard;

          beforeEach(function() {
            whiteCardCount = currentGame.deck.white.length;
            blackCardCount = currentGame.deck.black.length;
            blackCard = currentGame.currentBlackCard;
            _.map(currentGame.players, function(p) {
              Game.readyForNextRound(gameId, p.id);
            });
            currentGame = Game.getGame(gameId);
          });

          it("the round is restarted with new czar", function() {
            expect(currentGame.isReadyForScoring).toBe(false);
            expect(currentGame.isReadyForReview).toBe(false);
            expect(currentGame.winningCardId).toBe(null);
            expect(currentGame.players[1].isCzar).toBe(true);
          });

          it("a new black card is selected", function() {
            expect(currentGame.deck.black.length).toBe(blackCardCount - 1);
            expect(currentGame.currentBlackCard).toNotBe(blackCard);
          });

          it("each player (except the czar) is given a new white card", function() {
            expect(currentGame.deck.white.length).toBe(whiteCardCount - 3);
            expect(currentGame.players[0].cards.length).toBe(7);
            expect(currentGame.players[1].cards.length).toBe(7);
            expect(currentGame.players[2].cards.length).toBe(7);
            expect(currentGame.players[3].cards.length).toBe(7);
          });
        });
      });
    });
  });


  describe('fullGame', function() {
      beforeEach(startGame);
      describe('play enough rounds to reach the pointsToWin', function() {

          beforeEach(function() {
              var maxScore = 0;
              while(maxScore < currentGame.pointsToWin) {
                  allPlayersButCzarPlayCard();
                  var playerToPick = getFirstNonCzar(currentGame);
                  var cardId = playerToPick.cards[0];
                  Game.selectWinner(gameId, cardId);
                  maxScore = _.max(currentGame.players, function(p) {
                      return p.awesomePoints;
                  }).awesomePoints;
                  if(maxScore < currentGame.pointsToWin){
                      //everyone ready for next round
                      _.map(currentGame.players, function(p) {
                          Game.readyForNextRound(gameId, p.id);
                      });
                  }
              }
          });

          it('game is over after last round is played', function() {
              expect(currentGame.isOver).toBe(true);
          });

          describe('all players ready after winning round', function() {
              beforeEach(function() {
                  _.map(currentGame.players, function(p) {
                      Game.readyForNextRound(gameId, p.id);
                  });
              });

              it('game isOver should be false and all player points should be zero', function() {
                  expect(currentGame.isOver).toBe(false);
                  expect(currentGame.isStarted).toBe(true);
                  _.map(currentGame.players, function(p) {
                      expect(p.awesomePoints).toBe(0);
                  })
              });
          })

      });
  });
});
