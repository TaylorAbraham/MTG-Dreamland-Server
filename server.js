const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const morgan = require('morgan');
const firebase = require('firebase/app');
const cors = require('cors');
require('firebase/firestore');

const allowedCORSDomains = [
  'http://localhost:3000',
  'https://mtg-dreamland.netlify.app',
];
const corsOptions = {
  origin(origin, callback) {
    if (allowedCORSDomains.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

// Non-secret firebase config for client
const firebaseConfig = {
  apiKey: 'AIzaSyCzN61HjMCG9zaGm3CsChrK-osbG0fgvxs',
  authDomain: 'mtg-dreamland.firebaseapp.com',
  projectId: 'mtg-dreamland',
  storageBucket: 'mtg-dreamland.appspot.com',
  messagingSenderId: '456002809510',
  appId: '1:456002809510:web:5ba77345a05adc82a20e67',
  measurementId: 'G-Q4KB78V40N',
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const app = express();
app.use(cors(corsOptions));
app.use(morgan('tiny'));

const scryfallBase = 'https://api.scryfall.com';
const scryfallJSON = 'https://data.scryfall.io/oracle-cards/oracle-cards-20250929090303.json';

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
  land: {
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
    if (card.color_identity.length === 2) {
      sortedCardDB.land[card.color_identity.join('')].push(card);
    } else {
      sortedCardDB.land.other.push(card);
    }
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

const getRandomMulticolorCards = (n, lands = false) => {
  const dbToUse = lands ? sortedCardDB.land : sortedCardDB.multicolor;
  return [
    ...getRandomCards(dbToUse.UW, n),
    ...getRandomCards(dbToUse.BU, n),
    ...getRandomCards(dbToUse.BR, n),
    ...getRandomCards(dbToUse.GR, n),
    ...getRandomCards(dbToUse.GW, n),
    ...getRandomCards(dbToUse.BW, n),
    ...getRandomCards(dbToUse.RU, n),
    ...getRandomCards(dbToUse.BG, n),
    ...getRandomCards(dbToUse.RW, n),
    ...getRandomCards(dbToUse.GU, n),
  ];
};

fetch(scryfallJSON)
  .then((res) => res.json())
  .then((json) => {
    cardDB = json.filter(filterLegalCards);
    cardDB.forEach(sortCards);
    startingUp = false;
  });

app.get('/random-pool', (req, res) => {
  if (startingUp) {
    res.status(500).send({ error: { msg: 'Server has not finished started up.', type: 'SERVER_NOT_STARTED' } });
  } else {
    const cards = [
      ...getRandomCards(sortedCardDB.W, 15),
      ...getRandomCards(sortedCardDB.U, 15),
      ...getRandomCards(sortedCardDB.B, 15),
      ...getRandomCards(sortedCardDB.R, 15),
      ...getRandomCards(sortedCardDB.G, 15),
      ...getRandomCards(sortedCardDB.colorless, 6),
      ...getRandomMulticolorCards(2),
      ...getRandomCards(sortedCardDB.multicolor.other, 3),
      ...getRandomMulticolorCards(2, true),
      ...getRandomCards(sortedCardDB.land.other, 5),
    ].map(formatCardsAsJSON);

    // Add this pool to firestore
    db.collection('pools')
      .add({
        cards: JSON.stringify(cards),
      })
      .then((docRef) => {
        console.log('Document written with ID: ', docRef.id);
        res.send({ uuid: docRef.id, cards }); // Send the cards and the pool id
      })
      .catch((error) => {
        console.error('Error adding document: ', error);
      });
  }
});

app.get('/random-pool/:uuid', (req, res) => {
  const docRef = db.collection('pools').doc(req.params.uuid);

  docRef
    .get()
    .then((doc) => {
      if (doc.exists) {
        res.send({ cards: JSON.parse(doc.data().cards) });
      } else {
        res.status(404).send({ error: { msg: `No such document with uuid ${req.params.uuid}`, type: 'NOT_FOUND' } });
      }
    })
    .catch((error) => {
      res.status(500).send({ error: { msg: `Error getting or parsing document: ${error}`, type: 'DOC_ERROR' } });
    });
});

app.get('/test', (req, res) => {
  fetch(`${scryfallBase}/cards/search?q=vindicate`)
    .then((scryRes) => scryRes.json())
    .then((json) => res.send(json));
});

app.get('/ping', (req, res) => res.send('pong'));

app.listen(process.env.PORT || 8080);
