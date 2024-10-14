import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import styled, { keyframes } from 'styled-components';

// Socket Connection
const socket = io('https://party-server-8ibk.onrender.com/');

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

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const LoginContainer = styled.div`
  animation: ${fadeIn} 0.8s ease;
  background: rgba(25, 25, 35, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 400px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const Input = styled.input`
  padding: 15px;
  border-radius: 10px;
  border: 2px solid transparent;
  margin: 10px 0;
  width: 100%;
  font-size: 1rem;
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
  font-size: 1.2rem;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.3s;

  &:hover {
    transform: scale(1.05);
    background: linear-gradient(90deg, #fc4a5d, #fd726d);
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 12px 20px;
  }
`;

const LobbyContainer = styled.div`
  animation: ${fadeIn} 0.8s ease;
  background: rgba(25, 25, 35, 0.9);
  backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 400px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 20px;
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

  &:hover {
    transform: scale(1.05);
  }
`;

const GameContainer = styled.div`
  animation: ${fadeIn} 0.8s ease;
  background: rgba(25, 25, 35, 0.9);
  backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 400px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const App = () => {
  const [playerName, setPlayerName] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState('');
  const [appState, setAppState] = useState('connection'); // Track app state: 'connection', 'lobby', 'game'
  const [errorMessage, setErrorMessage] = useState('');
  const [isGameCreator, setIsGameCreator] = useState(false); // Track if the player is the creator

  useEffect(() => {
    socket.on('players-updated', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('new-question', ({ question, selectedPlayer }) => {
      console.log(question); // מציג את השאלה
      console.log(selectedPlayer); // מציג את השחקן הנבחר
      console.log(playerName); // מציג את שם השחקן הנוכחי
      setQuestion(question); // מעדכן את השאלה
      setSelectedPlayer(selectedPlayer); // מעדכן את השחקן הנבחר
  });

    socket.on('game-started', () => {
      setAppState('game');
    });
    socket.on('game-ended', () => {
      console.log("game endddddd");
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
      if (socket) {
        console.log('Attempting to join game:', gameCode);
        socket.emit('join-game', { gameCode, playerName }, (response) => {
          console.log('Join game response:', response);
          if (response.success) {
            setGameCode(gameCode);
            setAppState('lobby'); // Move to the game lobby
            setErrorMessage(''); // Clear error message
          } else {
            setErrorMessage(response.message || 'Invalid game code. Please try again.');
          }
        });
      } else {
        setErrorMessage('Socket connection is not established. Please try again.');
      }
    } else {
      setErrorMessage('Please enter your name and game code.');
    }
  };

  const handleCreateGame = () => {
    if (playerName) {
      setIsGameCreator(true);
      socket.emit('create-game', playerName, (newGameCode) => {
        setGameCode(newGameCode);
        setAppState('lobby'); // Move to the lobby after creating the game
      });
    }
  };

  const handleStartGame = () => {
    socket.emit('start-game', gameCode);
  };

  const handlePlayerAction = () => {
    // Send action to server
    socket.emit('next-question', gameCode);
  };

  return (
    <AppContainer>
      {appState === 'connection' && (
        <LoginContainer>
          <h2 style={{ color: '#fd726d' }}>🍺🍺 כנס או צור משחק 🍺🍺</h2>
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
              <Button onClick={handleCreateGame}>Confirm</Button>
              <Button onClick={() => setIsGameCreator(false)}>Cancel</Button>
            </div>
          )}
          {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </LoginContainer>
      )}
      {appState === 'lobby' && (
        <LobbyContainer>
          <h2 style={{ color: '#fd726d' }}>Lobby</h2>
          <div style={{ color: 'white', marginBottom: '10px' }}>
            <strong>Game Code:</strong> {gameCode}
          </div>
          <h3 style={{ color: '#fd726d' }}>Players:</h3>
          <PlayersList>
            {players.map((player) => (
              <PlayerItem key={player._id}>
                <div>Name: {player.name}</div>
                <div>Score: {player.score}</div>
                {/* Game creator indicator */}
                {player.isGameCreator && <div style={{ color: 'gold', fontWeight: 'bold' }}>Game Creator</div>}
                {/* Add other properties as needed */}
              </PlayerItem>
            ))}
          </PlayersList>
          {isGameCreator && (
            <Button onClick={handleStartGame}>Start Game</Button>
          )}
        </LobbyContainer>
      )}
     {appState === 'game' && (
  <GameContainer>
    <h2 style={{ color: '#fd726d' }}>? חושבים שאתם אמיצים ?</h2>
    <h3 style={{ color: '#fd726d' }}>🍺 השאלה 🍺</h3>
    <p style={{ color: 'white' }}>{question.question}</p>
    <h4 style={{ color: '#fd726d' }}>🍺 תורו של 🍺 <br/> {selectedPlayer}</h4>
    {playerName === selectedPlayer && ( // Show button only if it's the player's turn
      <Button onClick={handlePlayerAction}>עשיתי</Button>
    )}
  </GameContainer>
)}
 {appState === 'end' && (
  <GameContainer style={{ textAlign: 'center', padding: '50px', color: '#fff' }}>
    <h1 style={{ color: '#fd726d', fontSize: '2.5rem', marginBottom: '20px' }}>{playerName}</h1>
    <p style={{ fontSize: '1.2rem', marginBottom: '40px', color: '#fff' }}>We hope you had fun!</p>
    
    <div style={{ margin: '50px 0' }}>
      <div 
        className="animation" 
        style={{ 
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #fd726d, #ffab73)',
          animation: 'pulse 1.5s infinite',
          margin: '0 auto'
        }}>
      </div>
    </div>
    <style>
      {`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
      `}
    </style>
  </GameContainer>
)}
    </AppContainer>
  );
};

export default App;
