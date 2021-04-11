import React, { useEffect, useState } from 'react';
import fetch from 'node-fetch';
import TextField from '@material-ui/core/TextField';
import './App.scss';

const App = () => {
  const [cards, setCards] = useState([]);
  useEffect(() => {
    fetch('/random-pool')
      .then((res) => res.json())
      .then((json) => setCards(json.cards));
  }, []);

  return (
    <div className="App">
      {cards && (
        <>
          <div>
            <TextField
              className="cards-text"
              label="Cards"
              multiline
              rows={10}
              value={cards.map((card) => card.name).join('\n')}
              variant="outlined"
              onFocus={(event) => event.target.select()} // Highlight whole textarea on select
            />
          </div>
          {cards.map((card) => (
            <img className="card-pic" alt={card.name} src={card.imgURI} />
            // TODO: Image should link to scryfall page in new tab
          ))}
        </>
      )}
    </div>
  );
};

export default App;
