import React, { useEffect, useState, useCallback } from 'react';
import fetch from 'node-fetch';
import { TextField, Snackbar, IconButton } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import CloseIcon from '@material-ui/icons/Close';
import { useParams } from 'react-router-dom';
import './App.scss';

const App = () => {
  const [cards, setCards] = useState([]);
  const [poolUUID, setPoolUUID] = useState('');
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

  const { uuid: uuidParam } = useParams();

  const fetchPool = useCallback(() => {
    let fetchURL = '/random-pool';
    if (uuidParam) {
      setPoolUUID(uuidParam);
      fetchURL = `/random-pool/${uuidParam}`;
    }
    fetch(fetchURL)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          if (json.error.type === 'SERVER_NOT_STARTED') {
            setTimeout(() => {
              fetchPool();
            }, 2000);
          }
        } else {
          setCards(json.cards);
          if (json.uuid) {
            setPoolUUID(json.uuid);
          }
        }
      });
  }, [uuidParam]);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const selectAllAndCopy = (e) => {
    e.target.select(); // Highlight whole textarea on select
    document.execCommand('copy');
    setSnackbarOpen(true);
  };

  return (
    <div className="App">
      {cards && (
        <>
          {poolUUID && (
            <TextField
              className="pool-textbox"
              label="URL"
              variant="outlined"
              value={`${window.location.href}${poolUUID}`}
              onFocus={selectAllAndCopy}
            />
          )}
          <div>
            <TextField
              className="pool-textbox"
              label="Cards"
              multiline
              rows={10}
              value={cards.map((card) => card.name).join('\n')}
              variant="outlined"
              onFocus={selectAllAndCopy}
            />
          </div>
          {cards.map((card) => (
            <a key={card.name} href={card.scryfallURI} target="_blank" rel="noreferrer">
              <img className="card-pic" alt={card.name} src={card.imgURI} />
            </a>
          ))}
          <Snackbar
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            open={snackbarOpen}
            autoHideDuration={4000}
            onClose={handleClose}
          >
            <MuiAlert elevation={6} variant="filled" severity="success">
              Copied to clipboard!
              <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </MuiAlert>
          </Snackbar>
        </>
      )}
    </div>
  );
};

export default App;
