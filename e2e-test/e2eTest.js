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
    })
  });
});