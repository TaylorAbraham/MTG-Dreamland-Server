import React, { useEffect, useState } from 'react';
import fetch from 'node-fetch';
import { TextField, Snackbar, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import './App.scss';

const App = () => {
  const [cards, setCards] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

  useEffect(() => {
    fetch('/random-pool')
      .then((res) => res.json())
      .then((json) => setCards(json.cards));
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

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
              onFocus={(e) => {
                e.target.select(); // Highlight whole textarea on select
                document.execCommand('copy');
                setSnackbarOpen(true);
              }}
            />
          </div>
          {cards.map((card) => (
            <img className="card-pic" alt={card.name} src={card.imgURI} />
            // TODO: Image should link to scryfall page in new tab
          ))}
          <Snackbar
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            open={snackbarOpen}
            autoHideDuration={4000}
            onClose={handleClose}
            message="List copied to clipboard!"
            action={
              <>
                <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            }
          />
        </>
      )}
    </div>
  );
};

export default App;
