var card_data = require('./cah_all.json');

function getDeck() {
  return { black: black(), white: white() };
}

function black() {
  //  Get the cards from the json database and filter them to work out.
  console.log(card_data.blackCards.length);
  function filter(v) {
    return v.pick == 1;
  }
  return card_data.blackCards.filter(filter);
}

function white() {
  console.log(card_data.whiteCards.length);
  return card_data.whiteCards;
}

exports.getDeck = getDeck;
