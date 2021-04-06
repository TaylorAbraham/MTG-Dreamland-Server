const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
app.use(express.static(path.join(__dirname, 'client/build/')));

const scryfallBase = "https://api.scryfall.com";

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/test', (req, res) => {
  fetch(`${scryfallBase}/cards/search?q=vindicate`)
    .then(scryRes => scryRes.json())
    .then(json => res.send(json));
})

app.get('/ping', (req, res) => res.send('pong'));

app.listen(process.env.PORT || 8080);
