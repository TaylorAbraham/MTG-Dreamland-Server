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
    WU: [],
    WB: [],
    WR: [],
    WG: [],
    UB: [],
    UR: [],
    UG: [],
    BR: [],
    BG: [],
    RG: [],
    other: [],
  },
  land: [],
};

const filterLegalCards = (card) => {
  if (card.legalities.vintage === 'not_legal') {
    return false;
  }
  return true;
};

const sortCards = (card) => {
  if (/^Land.*/.test(card.type_line)) {
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
        // TODO: this
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
  }

  const cards = [
    ...getRandomCards(sortedCardDB.W, 10),
    ...getRandomCards(sortedCardDB.U, 10),
    ...getRandomCards(sortedCardDB.B, 10),
    ...getRandomCards(sortedCardDB.R, 10),
    ...getRandomCards(sortedCardDB.G, 10),
    ...getRandomCards(sortedCardDB.colorless, 10),
    ...getRandomCards(sortedCardDB.land, 10),
  ].map(formatCardsAsJSON);
  res.send({ cards });
});

app.get('/test', (req, res) => {
  fetch(`${scryfallBase}/cards/search?q=vindicate`)
    .then((scryRes) => scryRes.json())
    .then((json) => res.send(json));
});

app.get('/ping', (req, res) => res.send('pong'));

app.listen(process.env.PORT || 8080);
