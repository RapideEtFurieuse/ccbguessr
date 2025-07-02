import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import ProfileStep from './components/ProfileStep';
import GlobalLobby from './components/GlobalLobby';
import GamePlaying from './components/GamePlaying';
import ResultsStep from './components/ResultsStep';
import AdminPanel from './components/AdminPanel';

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentStep, setCurrentStep] = useState('profile'); // 'profile', 'lobby', 'playing', 'results'
  
  // Données du joueur
  const [pseudo, setPseudo] = useState('');
  const [photo, setPhoto] = useState(null);
  
  // Données du lobby global
  const [players, setPlayers] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [questionCount, setQuestionCount] = useState('');
  
  // Données du jeu
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [playerAnswer, setPlayerAnswer] = useState('');
  
  // États pour les résultats
  const [hasAnswered, setHasAnswered] = useState(false);
  const [playersAnswered, setPlayersAnswered] = useState(0);
  const [totalPlayersInGame, setTotalPlayersInGame] = useState(0);
  const [results, setResults] = useState(null);

  // Admin
  const [showAdmin, setShowAdmin] = useState(false);

  // Connexion au serveur - UNE SEULE FOIS
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connecté au serveur !');
    });

    // Événements du lobby global
    newSocket.on('lobby-joined', ({ players, isCreator }) => {
      setPlayers(players);
      setIsCreator(isCreator);
      setCurrentStep('lobby');
      console.log(`Lobby rejoint. ${players.length} joueurs. Créateur: ${isCreator}`);
    });

    newSocket.on('player-joined', ({ players, newPlayer }) => {
      setPlayers(players);
      console.log(`${newPlayer} a rejoint le lobby`);
    });

    newSocket.on('player-left', ({ players, leftPlayer }) => {
      setPlayers(players);
      console.log(`${leftPlayer} a quitté le lobby`);
    });

    // Événements jeu
    newSocket.on('game-started', ({ questionCount, message }) => {
      console.log(message);
    });

    newSocket.on('new-question', (questionData) => {
      console.log('=== QUESTION REÇUE ===');
      console.log('Data complète:', questionData);
      setCurrentQuestion(questionData);
      setCurrentStep('playing');
      // Reset pour nouvelle question
      setSelectedMode(null);
      setPlayerAnswer('');
      setHasAnswered(false);
      setResults(null);
      setPlayersAnswered(0);
      setTotalPlayersInGame(0);
    });

    // Événement crucial pour le compteur
    newSocket.on('answer-received', ({ player, totalAnswers, totalPlayers }) => {
      console.log(`Update reçu: ${player} - ${totalAnswers}/${totalPlayers}`);
      setPlayersAnswered(Number(totalAnswers));
      setTotalPlayersInGame(Number(totalPlayers));
    });

    newSocket.on('show-results', ({ answers, correctAnswer }) => {
      setResults({ answers, correctAnswer });
      setCurrentStep('results');
    });

    // Nettoyage à la déconnexion
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fonctions handlers
  const joinGlobalLobby = () => {
    if (pseudo && socket) {
      const playerData = { 
        pseudo, 
        photo: photo || null // Photo optionnelle
      };
      socket.emit('join-global-lobby', playerData);
    }
  };

  const startGame = () => {
    if (socket && questionCount && isCreator) {
      socket.emit('start-game', { questionCount: parseInt(questionCount) });
    }
  };

  const submitAnswer = () => {
    if (socket && playerAnswer) {
      socket.emit('player-answer', {
        playerData: { pseudo, photo },
        answer: playerAnswer,
        mode: selectedMode,
        points: selectedMode === 'duo' ? 2 : selectedMode === 'carre' ? 5 : 10
      });
      
      setHasAnswered(true);
      console.log('Réponse envoyée au serveur');
    }
  };

return (
  <div className="App">
    <header className="App-header">
      <h1>🎬 Street View Movie Game</h1>
      
      {/* Bouton pour basculer entre admin et jeu */}
      <button 
        onClick={() => setShowAdmin(!showAdmin)}
        className="admin-toggle"
      >
        {showAdmin ? '🎮 Retour au jeu' : '⚙️ Admin'}
      </button>
      
      {/* Interface Admin */}
      {showAdmin && (
        <AdminPanel onFilmsGenerated={(films) => console.log('Films générés:', films)} />
      )}

      {/* Interface de Jeu */}
      {!showAdmin && (
        <>
          {isConnected ? (
            <p className="connection-status connected">✅ Connecté au serveur</p>
          ) : (
            <p className="connection-status disconnected">❌ Connexion en cours...</p>
          )}

          {/* Tes étapes existantes */}
          {currentStep === 'profile' && (
            <ProfileStep
              pseudo={pseudo}
              setPseudo={setPseudo}
              photo={photo}
              setPhoto={setPhoto}
              onContinue={joinGlobalLobby}
            />
          )}

          {currentStep === 'lobby' && (
            <GlobalLobby
              players={players}
              isCreator={isCreator}
              questionCount={questionCount}
              setQuestionCount={setQuestionCount}
              onStartGame={startGame}
            />
          )}

          {currentStep === 'playing' && currentQuestion && (
            <GamePlaying
              currentQuestion={currentQuestion}
              hasAnswered={hasAnswered}
              playersAnswered={playersAnswered}
              totalPlayersInGame={totalPlayersInGame}
              selectedMode={selectedMode}
              setSelectedMode={setSelectedMode}
              playerAnswer={playerAnswer}
              setPlayerAnswer={setPlayerAnswer}
              onSubmitAnswer={submitAnswer}
            />
          )}

          {currentStep === 'results' && results && (
            <ResultsStep
              results={results}
              onNextQuestion={() => {
                console.log('Question suivante - À implémenter');
              }}
            />
          )}
        </>
      )}
    </header>
  </div>
);
}

export default App;