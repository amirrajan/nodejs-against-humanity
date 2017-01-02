/**
 * Created by chriss on 1/10/14.
 */
describe('node against humanity lobby', function() {
  it('should display the noGames text only when no games are available', function() {
    browser.get('http://localhost:3000');

    var gameList = element.all(by.repeater('game in availableGames'));

    gameList.then(function(arr) {
      if(arr.length === 0){
        expect(element(by.id('noGames')).isDisplayed()).toBe(true);
      } else {
        expect(element(by.id('noGames')).isDisplayed()).toBe(false);
      }
    });


  });

  it('should start the game with the players name when Create Game is clicked and name is entered', function() {
    element(by.model('gameSvc.playerName')).sendKeys('Chris');
    element(by.id('aCreatGame')).click();

    setTimeout(function() {
      //give the page a second to return results and change the bindings. Not sure if there is a better way to do this
      expect(element(by.id('notificationCardCzar')).isDisplayed()).toBe(true);
      expect(element(by.id('notificationSelectCard')).isDisplayed()).toBe(false);
      expect(element(by.id('notificationWaitingOnCzar')).isDisplayed()).toBe(false);
      expect(element(by.id('notificationWaitingOnCards')).isDisplayed()).toBe(true);
      expect(element(by.id('notificationSelectWinner')).isDisplayed()).toBe(false);
      expect(element(by.id('notificationCardCzar')).isDisplayed()).toBe(false);
    }, 1000)

  });
});