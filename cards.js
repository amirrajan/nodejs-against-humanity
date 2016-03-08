var card_data = require('./cah_all.json');

function getDeck() {
  return { black: black(), white: white() };
}

function black() {
  function filter(v) {
    return v.pick === 1;
  }
  return card_data.blackCards.filter(filter);
}

function white() {
  return card_data.whiteCards;
}

exports.getDeck = getDeck;
