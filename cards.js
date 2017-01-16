"use strict";
var card_data = require('./cah_all.json');
var _ = require('underscore');
var fs = require('fs');

function getDeck() {
  return { black: black(), white: white() };
}

/**
 * @param {Array} selected Array of set IDs
 * @return {Object} Filtered black and white cards
 */
function getDeckFromSets(selected, expansions) {
    //Build arrays of the indices that we want to use
    let blackIndices = [], whiteIndices = [];
    let blackCards = [], whiteCards = [];
    selected.forEach(setId => {
        blackIndices = _.union(blackIndices, card_data[setId].black);
        whiteIndices = _.union(whiteIndices, card_data[setId].white);
    });
    blackIndices.forEach(i => blackCards.push(card_data.blackCards[i]));
    whiteIndices.forEach(i => whiteCards.push(card_data.whiteCards[i]));
    //Get expansions
    expansions.forEach(function (expansionId) {
      let match = _.findWhere(openExpansions(), {id: expansionId});
      if (match !== undefined) {
        blackCards = blackCards.concat(match.black);
        whiteCards = whiteCards.concat(match.white);
      }
    });
    console.log(whiteCards);
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

function openExpansions() {
  let expansions = [];
  fs.readdirSync('expansions').forEach(function (path) {
    if (path.indexOf(".json") !== -1) {
      try {
        let file = JSON.parse(fs.readFileSync('expansions/' + path));
        expansions.push({
          id: file.id,
          name: file.name,
          size: file.black.length,
          black: file.black,
          white: file.white
        });
      } catch (jsonError) {
        console.log(jsonError);
      }
    }
  });
  return expansions;
}

function getExpansions() {
  return openExpansions().map(expansion => {return {id: expansion.id, name: expansion.name, size: expansion.size}});
}

exports.getDeck = getDeck;
exports.getSets = getSets;
exports.getDeckFromSets = getDeckFromSets;
exports.getExpansions = getExpansions;