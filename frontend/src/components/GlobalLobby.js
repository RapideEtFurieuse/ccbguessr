import React from 'react';
import styles from './GlobalLobby.module.css';

const GlobalLobby = ({
  players,
  isCreator,
  questionCount,
  setQuestionCount,
  onStartGame
}) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🎮 Lobby Global</h2>
      <p className={styles.subtitle}>
        {isCreator ? '👑 Tu es le créateur de cette partie' : '👤 En attente du créateur'}
      </p>
      
      <h4 className={styles.playersTitle}>Joueurs connectés ({players.length}) :</h4>
      <div className={styles.playersGrid}>
        {players.map((player, index) => (
          <div key={index} className={styles.playerCard}>
            {player.photo && (
              <img 
                src={player.photo} 
                alt={player.pseudo}
                className={styles.playerPhoto}
              />
            )}
            <p className={styles.playerName}>{player.pseudo}</p>
            {index === 0 && <span className={styles.creatorBadge}>👑 Créateur</span>}
          </div>
        ))}
      </div>

      {/* Options du créateur */}
      {isCreator && (
        <div className={styles.creatorPanel}>
          <h4 className={styles.configTitle}>⚙️ Configuration de la partie</h4>
          <div className={styles.configSection}>
            <label className={styles.configLabel}>Nombre de questions :</label>
            <select 
              onChange={(e) => setQuestionCount(e.target.value)}
              className={styles.configSelect}
            >
              <option value="">Choisir...</option>
              <option value="5">5 questions</option>
              <option value="10">10 questions</option>
              <option value="15">15 questions</option>
              <option value="20">20 questions</option>
            </select>
          </div>
          
          {questionCount && (
            <button 
              onClick={onStartGame}
              className={styles.startButton}
            >
              🚀 Lancer la partie !
            </button>
          )}
        </div>
      )}

      {!isCreator && (
        <div className={styles.waitingMessage}>
          <p>⏳ En attente que le créateur lance la partie...</p>
        </div>
      )}
    </div>
  );
};

export default GlobalLobby;