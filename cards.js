"use strict";
var card_data = require('./cah_all.json');
var _ = require('underscore');

function getDeck() {
  return { black: black(), white: white() };
}

/**
 * @param {Array} selected Array of set IDs
 * @return {Object} Filtered black and white cards
 */
function getDeckFromSets(selected) {
    //Build arrays of the indices that we want to use
    let blackIndices = [], whiteIndices = [];
    let blackCards = [], whiteCards = [];
    selected.forEach(setId => {
        blackIndices = _.union(blackIndices, card_data[setId].black);
        whiteIndices = _.union(whiteIndices, card_data[setId].white);
    });
    blackIndices.forEach(i => blackCards.push(card_data.blackCards[i]));
    whiteIndices.forEach(i => whiteCards.push(card_data.whiteCards[i]));
    //Filter black cards to only show pick 1
    blackCards = blackCards.filter(card => card.pick == 1);
    return {
        black: blackCards,
        white: whiteCards
    };
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

function getSets() {
  var sets = [];
  card_data.order.forEach(function(id) {
      sets.push({
          id: id,
          name: card_data[id].name,
          size: card_data[id].black.length
      });
  });
  return sets;
}

exports.getDeck = getDeck;
exports.getSets = getSets;
exports.getDeckFromSets = getDeckFromSets;