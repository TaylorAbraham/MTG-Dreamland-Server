const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
app.use(express.static(path.join(__dirname, 'client/build/')));

const scryfallBase = 'https://api.scryfall.com';
const scryfallJSON = 'https://c2.scryfall.com/file/scryfall-bulk/oracle-cards/oracle-cards-20210406210457.json';

let cardDB = [];

fetch(scryfallJSON)
  .then((res) => res.json())
  .then((json) => {
    cardDB = json;
  });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/random-pool', (req, res) => {
  const cards = [];
  for (let i = 0; i < 10; i++) {
    const randomCard = cardDB[Math.floor(Math.random() * cardDB.length)];
    cards.push({
      name: randomCard.name,
      img_uri: randomCard.image_uris.normal,
    });
  }
  res.send({ cards });
});

app.get('/test', (req, res) => {
  fetch(`${scryfallBase}/cards/search?q=vindicate`)
    .then((scryRes) => scryRes.json())
    .then((json) => res.send(json));
});

app.get('/ping', (req, res) => res.send('pong'));

app.listen(process.env.PORT || 8080);
