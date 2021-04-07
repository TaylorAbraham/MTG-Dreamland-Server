import React, { useEffect, useState } from 'react';
import fetch from 'node-fetch';

const App = () => {
  const [cards, setCards] = useState([]);
  useEffect(() => {
    fetch("/random-pool").then(res => res.json()).then(json => setCards(json.cards));
  }, []);
  
  return (
    <div className="App">
      {cards.map((card) => (
        <div>{card.name}</div>
      ))}
      {cards.map((card) => (
        <img style={{"max-width": 300}} src={card.img_uri} />
      ))}
    </div>
  );
}

export default App;
