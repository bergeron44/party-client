import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import styled, { keyframes } from 'styled-components';

// Socket Connection
const socket = io('https://party-server-x0jn.onrender.com');
//const socket = io('https://party-server-8ibk.onrender.com/');
 //const socket = io('http://localhost:3001');

// CSS Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: radial-gradient(circle, rgba(20, 20, 30, 1) 0%, rgba(0, 0, 0, 1) 100%);
  font-family: 'Roboto', sans-serif;
  padding: 20px;
`;

const CardContainer = styled.div`
  animation: ${fadeIn} 0.8s ease;
  background: rgba(25, 25, 35, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 450px;
  text-align: center;
  transition: transform 0.2s;

  @media (max-width: 768px) {
    padding: 20px;
  }

  &:hover {
    transform: scale(1.03);
  }
`;

const Title = styled.h2`
  color: #fd726d;
  font-size: 2.5rem;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Input = styled.input`
  padding: 15px;
  border-radius: 10px;
  border: 2px solid transparent;
  margin: 10px 0;
  width: 100%;
  font-size: 1.2rem;
  transition: border 0.3s ease;

  &:focus {
    border: 2px solid #fd726d;
    outline: none;
  }
`;

const Button = styled.button`
  padding: 15px 25px;
  background: linear-gradient(90deg, #fd726d, #fc4a5d);
  color: white;
  border: none;
  border-radius: 10px;
  margin: 10px 0;
  font-size: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.3s;

  &:hover {
    transform: scale(1.05);
    background: linear-gradient(90deg, #fc4a5d, #fd726d);
  }

  @media (max-width: 768px) {
    font-size: 1.2rem;
    padding: 12px 20px;
  }
`;

const PlayersList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 10px 0;
`;

const PlayerItem = styled.li`
  margin: 10px 0;
  background: #fd726d;
  padding: 15px;
  border-radius: 10px;
  transition: transform 0.2s;
  color: white;
  text-align: center;
  font-size: 1.2rem;

  &:hover {
    transform: scale(1.05);
  }
`;

const App = () => {
  const [playerName, setPlayerName] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [allQuestion, setAllQuestion] = useState([]);
  const [question, setQuestion] = useState('');
  const [appState, setAppState] = useState('connection');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGameCreator, setIsGameCreator] = useState(false);

  useEffect(() => {
    socket.on('players-updated', (game) => {
      setPlayers(game.players); // עדכון רשימת השחקנים
      if (allQuestion.length === 0) { // בדיקה אם מערך השאלות ריק
        setAllQuestion(game.questions); // עדכון השאלות מהמשחק
      }
    });

    socket.on('new-question', ({ question, selectedPlayer }) => {
      setQuestion(question);
      console.log(question);
      setSelectedPlayer(selectedPlayer);
    });

    socket.on('game-started', () => {
      setAppState('game');
    });

    socket.on('game-ended', () => {
      setAppState('end');
    });

    socket.on('invalid-game-code', (message) => {
      setErrorMessage(message);
    });
    socket.on('creator-first-update', (newGame) => {
      setGameCode(newGame.code);
      setPlayers(newGame.players);
    });

    return () => {
      socket.off('players-updated');
      socket.off('new-question');
      socket.off('game-started');
      socket.off('invalid-game-code');
      socket.off('creator-first-update');
    };
  }, []);

  const handleLogin = () => {
    if (playerName && gameCode) {
      socket.emit('join-game', { gameCode, playerName }, (response) => {
        if (response.success) {
          setGameCode(gameCode);
          setAppState('lobby');
          setErrorMessage('');
        } else {
          setErrorMessage(response.message || 'Invalid game code. Please try again.');
        }
      });
    } else {
      setErrorMessage('Please enter your name and game code.');
    }
  };

  const handleCreateGame = () => {
    console.log(playerName);
    if (playerName) {
      setIsGameCreator(true);
      console.log(isGameCreator);
      socket.emit('create-game', playerName, (newGameCode) => {
        setGameCode(newGameCode);
        setAppState('lobby');
      });
      console.log(appState);
    }
  };

  const handleStartGame = () => {
    socket.emit('start-game', gameCode);
  };

  const handlePlayerAction = async () => {
    const isPlayerValid = await new Promise((resolve) => {
      socket.emit('check-player-status', gameCode, (response) => {
        resolve(response.isValid);
      });
    });
  
    if (!isPlayerValid) {
      alert("You are no longer part of the game!");
      setAppState('end');
      return;
    }
  
    // אם הכל תקין
    socket.emit('next-question', gameCode);
  };

  return (
    <AppContainer>
      {appState === 'connection' && (
        <CardContainer>
          <Title>🍺 כנס או צור משחק 🍺</Title>
          <Input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <Button onClick={handleCreateGame}>Create Game</Button>
          <Input
            type="text"
            placeholder="Enter game code"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value)}
          />
          <Button onClick={handleLogin}>Join Game</Button>
          {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </CardContainer>
      )}
      {appState === 'lobby' && (
        <CardContainer>
          <Title>Lobby</Title>
          <div style={{ color: 'white', marginBottom: '10px' }}>
            <strong>Game Code:</strong> {gameCode}
          </div>
          <h3 style={{ color: '#fd726d' }}>Players:</h3>
          <PlayersList>
            {players.map((player) => (
              <PlayerItem key={player._id}>
                <div>Name: {player.name}</div>
                <div>Score: {player.score}</div>
                {player.isGameCreator && <div style={{ color: 'gold', fontWeight: 'bold' }}>Game Creator</div>}
              </PlayerItem>
            ))}
          </PlayersList>
          {isGameCreator && (
            <Button onClick={handleStartGame}>Start Game</Button>
          )}
        </CardContainer>
      )}
      {appState === 'game' && (
        <CardContainer>
          <Title> חושבים שאתם אמיצים </Title>
          <h3 style={{ color: '#fd726d' }}>🍺 השאלה 🍺</h3>
          <p style={{ color: 'white', fontSize: '1.5rem' }}>{question.question}</p>
          <h4 style={{ color: '#fd726d' }}>🍺 תורו של 🍺 <br /> {selectedPlayer}</h4>
          {playerName === selectedPlayer && (
            <Button onClick={handlePlayerAction}>עשיתי</Button>
          )}
        </CardContainer>
      )}
      {appState === 'end' && (
        <CardContainer style={{ textAlign: 'center', padding: '50px', color: '#fff', background: 'rgba(25, 25, 35, 0.9)', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)' }}>
          <h1 style={{ color: '#fd726d', fontSize: '3rem', marginBottom: '20px' }}>{playerName}</h1>
          <p style={{ fontSize: '1.5rem' }}>תודה ששתפתם פעולה!</p>
          <Button onClick={() => setAppState('connection')}>חזור לדף הכניסה</Button>
        </CardContainer>
      )}
    </AppContainer>
  );
};

export default App;

/*
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import styled, { keyframes } from 'styled-components';

// Socket Connection
// const socket = io('https://party-server-8ibk.onrender.com/');
const socket =io('http://localhost:3001');
// CSS Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: radial-gradient(circle, rgba(20, 20, 30, 1) 0%, rgba(0, 0, 0, 1) 100%);
  font-family: 'Roboto', sans-serif;
  padding: 20px;
`;

const CardContainer = styled.div`
  animation: ${fadeIn} 0.8s ease;
  background: rgba(25, 25, 35, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 450px;
  text-align: center;
  transition: transform 0.2s;

  @media (max-width: 768px) {
    padding: 20px;
  }

  &:hover {
    transform: scale(1.03);
  }
`;

const Title = styled.h2`
  color: #fd726d;
  font-size: 2.5rem;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Input = styled.input`
  padding: 15px;
  border-radius: 10px;
  border: 2px solid transparent;
  margin: 10px 0;
  width: 100%;
  font-size: 1.2rem;
  transition: border 0.3s ease;

  &:focus {
    border: 2px solid #fd726d;
    outline: none;
  }
`;

const Button = styled.button`
  padding: 15px 25px;
  background: linear-gradient(90deg, #fd726d, #fc4a5d);
  color: white;
  border: none;
  border-radius: 10px;
  margin: 10px 0;
  font-size: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.3s;

  &:hover {
    transform: scale(1.05);
    background: linear-gradient(90deg, #fc4a5d, #fd726d);
  }

  @media (max-width: 768px) {
    font-size: 1.2rem;
    padding: 12px 20px;
  }
`;

const PlayersList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 10px 0;
`;

const PlayerItem = styled.li`
  margin: 10px 0;
  background: #fd726d;
  padding: 15px;
  border-radius: 10px;
  transition: transform 0.2s;
  color: white;
  text-align: center;
  font-size: 1.2rem;

  &:hover {
    transform: scale(1.05);
  }
`;

const App = () => {
  const [playerName, setPlayerName] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState('');
  const [appState, setAppState] = useState('connection');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGameCreator, setIsGameCreator] = useState(false);

  useEffect(() => {
    socket.on('players-updated', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('new-question', ({ question, selectedPlayer }) => {
      setQuestion(question);
      setSelectedPlayer(selectedPlayer);
    });

    socket.on('game-started', () => {
      setAppState('game');
    });

    socket.on('game-ended', () => {
      setAppState('end');
    });

    socket.on('invalid-game-code', (message) => {
      setErrorMessage(message);
    });

    return () => {
      socket.off('players-updated');
      socket.off('new-question');
      socket.off('game-started');
      socket.off('invalid-game-code');
    };
  }, []);

  const handleLogin = () => {
    if (playerName && gameCode) {
      socket.emit('join-game', { gameCode, playerName }, (response) => {
        if (response.success) {
          setGameCode(gameCode);
          setAppState('lobby');
          setErrorMessage('');
        } else {
          setErrorMessage(response.message || 'Invalid game code. Please try again.');
        }
      });
    } else {
      setErrorMessage('Please enter your name and game code.');
    }
  };

  const handleCreateGame = (gameType) => {
    console.log(gameType);
    if (playerName) {
      setIsGameCreator(true);
      socket.emit('create-game', playerName, gameType, (newGameCode) => {
        setGameCode(newGameCode);
        setAppState('lobby');
      });
    }
  };

  const handleStartGame = () => {
    socket.emit('start-game', gameCode);
  };

  const handlePlayerAction = () => {
    socket.emit('next-question', gameCode);
  };

  return (
    <AppContainer>
      {appState === 'connection' && (
        <CardContainer>
          <Title>🍺 כנס או צור משחק 🍺</Title>
          <Input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <Button onClick={() => setIsGameCreator(true)}>Create Game</Button>
          <Input
            type="text"
            placeholder="Enter game code"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value)}
          />
          <Button onClick={handleLogin}>Join Game</Button>
          {isGameCreator && (
            <div>
              <h4 style={{ color: '#fd726d' }}>Creating Game...</h4>
              <Button onClick={() => handleCreateGame("friends")}>שולחן חברים</Button>&nbsp;&nbsp;&nbsp;
              <Button onClick={() => handleCreateGame("random")}>אנשים רנדומלים</Button>
            </div>
          )}
          {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </CardContainer>
      )}
      {appState === 'lobby' && (
        <CardContainer>
          <Title>Lobby</Title>
          <div style={{ color: 'white', marginBottom: '10px' }}>
            <strong>Game Code:</strong> {gameCode}
          </div>
          <h3 style={{ color: '#fd726d' }}>Players:</h3>
          <PlayersList>
            {players.map((player) => (
              <PlayerItem key={player._id}>
                <div>Name: {player.name}</div>
                <div>Score: {player.score}</div>
                {player.isGameCreator && <div style={{ color: 'gold', fontWeight: 'bold' }}>Game Creator</div>}
              </PlayerItem>
            ))}
          </PlayersList>
          {isGameCreator && (
            <Button onClick={handleStartGame}>Start Game</Button>
          )}
        </CardContainer>
      )}
      {appState === 'game' && (
        <CardContainer>
          <Title> חושבים שאתם אמיצים </Title>
          <h3 style={{ color: '#fd726d' }}>🍺 השאלה 🍺</h3>
          <p style={{ color: 'white', fontSize: '1.5rem' }}>{question.question}</p>
          <h4 style={{ color: '#fd726d' }}>🍺 תורו של 🍺 <br /> {selectedPlayer}</h4>
          {playerName === selectedPlayer && (
            <Button onClick={handlePlayerAction}>עשיתי</Button>
          )}
        </CardContainer>
      )}
     {appState === 'end' && (
  <CardContainer style={{ textAlign: 'center', padding: '50px', color: '#fff', background: 'rgba(25, 25, 35, 0.9)', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)' }}>
    <h1 style={{ color: '#fd726d', fontSize: '3rem', marginBottom: '20px' }}>{playerName}</h1>
    <p style={{ fontSize: '1.5rem', marginBottom: '40px', color: '#fff' }}>היה כיף לשחק איתך</p>
    
    <div style={{ margin: '50px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <h2 style={{ color: '#fd726d', fontSize: '2.5rem', marginBottom: '20px', animation: 'fadeIn 1s' }}>ניפגש שוב בקרוב</h2>
      <h4 style={{ marginTop: '20px', color: '#fd726d', fontSize: '1.5rem', animation: 'slideIn 1s' }}>החיים הם משחק - שחק בו טוב</h4>
    </div>

    <Button onClick={() => setAppState('connection')} style={{ marginTop: '30px', padding: '15px 30px', fontSize: '1.5rem', background: 'linear-gradient(90deg, #fd726d, #fc4a5d)', borderRadius: '10px', transition: 'background 0.3s ease' }}>
      חזרה הביתה
    </Button>

    <style>
      {`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}
    </style>
  </CardContainer>
)}
    </AppContainer>
  );
};

export default App;
*/