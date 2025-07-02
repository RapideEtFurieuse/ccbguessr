const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Un seul lobby global
const globalLobby = {
  players: [],
  creator: null,
  gameStarted: false,
  currentAnswers: []
};

io.on('connection', (socket) => {
  console.log('Joueur connecté:', socket.id);
  
  // Rejoindre le lobby global
  socket.on('join-global-lobby', (playerData) => {
    // Ajouter le joueur au lobby
    const player = { 
      ...playerData, 
      socketId: socket.id,
      joinedAt: Date.now()
    };
    
    globalLobby.players.push(player);
    
    // Le premier joueur devient créateur
    if (globalLobby.players.length === 1) {
      globalLobby.creator = socket.id;
    }
    
    console.log(`${playerData.pseudo} a rejoint le lobby global (${globalLobby.players.length} joueurs)`);
    
    // Notifier le joueur qui rejoint
    socket.emit('lobby-joined', {
      players: globalLobby.players,
      isCreator: socket.id === globalLobby.creator
    });
    
    // Notifier tous les autres joueurs
    socket.broadcast.emit('player-joined', {
      players: globalLobby.players,
      newPlayer: playerData.pseudo
    });
  });

  // Lancer la partie
  socket.on('start-game', ({ questionCount }) => {
    if (socket.id === globalLobby.creator) {
      globalLobby.gameStarted = true;
      globalLobby.questionCount = questionCount;
      globalLobby.currentQuestion = 0;
      
      io.emit('game-started', {
        questionCount: questionCount,
        message: 'Partie lancée !'
      });
      
      console.log(`Partie lancée par le créateur avec ${questionCount} questions`);
      
      // Envoyer la première question après 2 secondes
      setTimeout(() => {
        globalLobby.currentAnswers = [];
        
        const questionData = {
          questionNumber: 1,
          totalQuestions: parseInt(questionCount),
          message: "Dans quel film cette scène a-t-elle été tournée ?",
          streetViewUrl: "https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBf0tfsqfa_Mz0xlc2SZPYwtCBm8Wg64-8&location=48.8584,2.2945&heading=210&pitch=10&fov=75"
        };
        
        console.log('Envoi de la première question');
        io.emit('new-question', questionData);
      }, 2000);
    }
  });

  // Gérer les réponses
  socket.on('player-answer', ({ playerData, answer, mode, points }) => {
    if (globalLobby.gameStarted) {
      // Vérifier si ce joueur a déjà répondu
      const existingAnswerIndex = globalLobby.currentAnswers.findIndex(
        ans => ans.socketId === socket.id
      );
      
      const newAnswer = {
        player: playerData.pseudo,
        answer: answer,
        mode: mode,
        points: points,
        socketId: socket.id
      };
      
      if (existingAnswerIndex >= 0) {
        globalLobby.currentAnswers[existingAnswerIndex] = newAnswer;
        console.log(`${playerData.pseudo} a modifié sa réponse`);
      } else {
        globalLobby.currentAnswers.push(newAnswer);
        console.log(`${playerData.pseudo} a répondu pour la première fois`);
      }
      
      // Notifier tous les joueurs
      const updateData = {
        player: playerData.pseudo,
        totalAnswers: globalLobby.currentAnswers.length,
        totalPlayers: globalLobby.players.length
      };
      
      console.log(`Update: ${updateData.totalAnswers}/${updateData.totalPlayers}`);
      io.emit('answer-received', updateData);
      
      // Si tout le monde a répondu, afficher les résultats
      if (globalLobby.currentAnswers.length === globalLobby.players.length) {
        setTimeout(() => {
          io.emit('show-results', {
            answers: globalLobby.currentAnswers,
            correctAnswer: "Le Fabuleux Destin d'Amélie Poulain"
          });
        }, 1000);
      }
    }
  });
  
  // Gérer les déconnexions
  socket.on('disconnect', () => {
    const playerIndex = globalLobby.players.findIndex(p => p.socketId === socket.id);
    
    if (playerIndex >= 0) {
      const leftPlayer = globalLobby.players[playerIndex];
      globalLobby.players.splice(playerIndex, 1);
      
      console.log(`${leftPlayer.pseudo} a quitté le lobby (${globalLobby.players.length} joueurs restants)`);
      
      // Si le créateur part, le prochain devient créateur
      if (socket.id === globalLobby.creator && globalLobby.players.length > 0) {
        globalLobby.creator = globalLobby.players[0].socketId;
        console.log(`Nouveau créateur: ${globalLobby.players[0].pseudo}`);
      }
      
      // Notifier les autres joueurs
      socket.broadcast.emit('player-left', {
        players: globalLobby.players,
        leftPlayer: leftPlayer.pseudo
      });
      
      // Si plus personne, reset le lobby
      if (globalLobby.players.length === 0) {
        globalLobby.creator = null;
        globalLobby.gameStarted = false;
        globalLobby.currentAnswers = [];
        console.log('Lobby réinitialisé');
      }
    }
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log('📍 Un seul lobby global disponible');
});