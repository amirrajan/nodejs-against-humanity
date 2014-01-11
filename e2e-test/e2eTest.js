/**
 * Created by chriss on 1/10/14.
 */
describe('node against humanity lobby', function() {
  it('should initialize with no active games', function() {
    browser.get('http://localhost:3000');

    var gameList = element.all(by.repeater('game in availableGames'));

    gameList.then(function(arr) {
      expect(arr.length).toEqual(0);
    })
  });
});