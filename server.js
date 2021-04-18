const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const morgan = require('morgan');

const app = express();
app.use(morgan('tiny'));
app.use(express.static(path.join(__dirname, 'client/build/')));

const scryfallBase = 'https://api.scryfall.com';
const scryfallJSON = 'https://c2.scryfall.com/file/scryfall-bulk/oracle-cards/oracle-cards-20210406210457.json';

let startingUp = true;
let cardDB = [];
const sortedCardDB = {
  W: [],
  U: [],
  B: [],
  R: [],
  G: [],
  colorless: [],
  multicolor: {
    UW: [],
    BU: [],
    BR: [],
    GR: [],
    GW: [],
    BW: [],
    RU: [],
    BG: [],
    RW: [],
    GU: [],
    other: [],
  },
  land: [],
};

const filterLegalCards = (card) => {
  if (card.legalities.vintage === 'not_legal') {
    return false;
  }
  if (/^Basic Land.*/i.test(card.type_line)) {
    return false;
  }
  return true;
};

const sortCards = (card) => {
  if (/^Land.*/i.test(card.type_line)) {
    sortedCardDB.land.push(card);
  } else {
    switch (card.color_identity.length) {
      case 0:
        sortedCardDB.colorless.push(card);
        break;
      case 1:
        sortedCardDB[card.color_identity[0]].push(card);
        break;
      case 2:
        sortedCardDB.multicolor[card.color_identity.join('')].push(card);
        break;
      case 3:
      case 4:
      case 5:
        sortedCardDB.multicolor.other.push(card);
        break;
      default:
    }
  }
};

const formatCardsAsJSON = (card) => {
  let imgURI;
  if (!card.image_uris) {
    imgURI = card.card_faces[0].image_uris.normal;
  } else {
    imgURI = card.image_uris.normal;
  }
  return {
    name: card.name,
    scryfallURI: card.scryfall_uri,
    imgURI,
  };
};

const getRandomCards = (list, n) => {
  if (n > list.length) {
    throw new Error(`Attempting to pull ${n} random cards from a list of length ${list.length}`);
  }
  const randomNums = [];
  while (randomNums.length < n) {
    const r = Math.floor(Math.random() * list.length);
    if (randomNums.indexOf(r) === -1) randomNums.push(r);
  }
  return randomNums.map((randomNum) => list[randomNum]);
};

const getRandomMulticolorCards = (n) => [
  ...getRandomCards(sortedCardDB.multicolor.UW, n),
  ...getRandomCards(sortedCardDB.multicolor.BU, n),
  ...getRandomCards(sortedCardDB.multicolor.BR, n),
  ...getRandomCards(sortedCardDB.multicolor.GR, n),
  ...getRandomCards(sortedCardDB.multicolor.GW, n),
  ...getRandomCards(sortedCardDB.multicolor.BW, n),
  ...getRandomCards(sortedCardDB.multicolor.RU, n),
  ...getRandomCards(sortedCardDB.multicolor.BG, n),
  ...getRandomCards(sortedCardDB.multicolor.RW, n),
  ...getRandomCards(sortedCardDB.multicolor.GU, n),
];

fetch(scryfallJSON)
  .then((res) => res.json())
  .then((json) => {
    cardDB = json.filter(filterLegalCards);
    cardDB.forEach(sortCards);
    startingUp = false;
  });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/random-pool', (req, res) => {
  if (startingUp) {
    res.status(500).send({ error: { msg: 'Server has not finished started up.', type: 'SERVER_NOT_STARTED' } });
  } else {
    const cards = [
      ...getRandomCards(sortedCardDB.W, 20),
      ...getRandomCards(sortedCardDB.U, 20),
      ...getRandomCards(sortedCardDB.B, 20),
      ...getRandomCards(sortedCardDB.R, 20),
      ...getRandomCards(sortedCardDB.G, 20),
      ...getRandomCards(sortedCardDB.colorless, 10),
      ...getRandomMulticolorCards(2),
      ...getRandomCards(sortedCardDB.multicolor.other, 3),
      ...getRandomCards(sortedCardDB.land, 10),
    ].map(formatCardsAsJSON);
    res.send({ cards });
  }
});

app.get('/test', (req, res) => {
  fetch(`${scryfallBase}/cards/search?q=vindicate`)
    .then((scryRes) => scryRes.json())
    .then((json) => res.send(json));
});

app.get('/ping', (req, res) => res.send('pong'));

app.listen(process.env.PORT || 8080);
