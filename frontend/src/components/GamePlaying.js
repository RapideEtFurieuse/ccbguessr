import React from 'react';
import styles from './GamePlaying.module.css';

const GamePlaying = ({
  currentQuestion,
  hasAnswered,
  playersAnswered,
  totalPlayersInGame,
  selectedMode,
  setSelectedMode,
  playerAnswer,
  setPlayerAnswer,
  onSubmitAnswer
}) => {

  console.log('GamePlaying reçoit:', { playersAnswered, totalPlayersInGame, hasAnswered });
  const modes = [
    { id: 'duo', label: 'DUO', points: 2, icon: '🤝', description: '2 choix' },
    { id: 'carre', label: 'CARRÉ', points: 5, icon: '🎯', description: '4 choix' },
    { id: 'cash', label: 'CASH', points: 10, icon: '💰', description: 'Réponse libre' }
  ];

  const duoOptions = ['Amélie', 'Le Fabuleux Destin d\'Amélie Poulain'];
  const carreOptions = ['Amélie', 'Inception', 'Le Fabuleux Destin d\'Amélie Poulain', 'Titanic'];

  return (

  
    <div className={styles.container}>
      <h2 className={styles.title}>
        🎬 Question {currentQuestion.questionNumber}/{currentQuestion.totalQuestions}
      </h2>

      {/* DEBUG VISUEL */}
<div style={{
  backgroundColor: 'red', 
  color: 'white', 
  padding: '10px', 
  margin: '10px',
  border: '2px solid yellow'
}}>
  <strong>DEBUG:</strong> playersAnswered={playersAnswered}, totalPlayersInGame={totalPlayersInGame}, hasAnswered={hasAnswered ? 'true' : 'false'}
</div>
      
      {/* Google Street View */}
      <div className={styles.streetViewContainer}>
        <iframe
          src="https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBf0tfsqfa_Mz0xlc2SZPYwtCBm8Wg64-8&location=48.8584,2.2945&heading=210&pitch=10&fov=75"
          className={styles.streetViewFrame}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

      <h3 className={styles.question}>{currentQuestion.message}</h3>

      {/* Compteur global - TOUJOURS visible quand il y a des réponses */}
{(playersAnswered > 0 || hasAnswered) && (
  <div className={`${styles.statusBar} ${hasAnswered ? styles.answered : styles.waiting}`}>
    <h4>{hasAnswered ? '⏳ Réponse envoyée !' : '⏳ Attente des réponses...'}</h4>
    <p className={styles.counter}>
      <strong>{playersAnswered}/{totalPlayersInGame}</strong> joueurs ont répondu
    </p>
    {hasAnswered && playerAnswer && (
      <p className={styles.userAnswer}>
        Ta réponse: <strong>{playerAnswer}</strong> (Mode: {selectedMode})
      </p>
    )}
  </div>
)}

      {/* Interface de jeu (seulement si pas encore répondu) */}
      {!hasAnswered && (
        <div className={styles.gameInterface}>
          <div className={styles.modeSelection}>
            <h4 className={styles.modeTitle}>Choisis ton mode de jeu :</h4>
            <div className={styles.modeButtons}>
              {modes.map((mode) => (
                <button 
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`${styles.modeButton} ${
                    selectedMode === mode.id ? styles.selected : ''
                  } ${styles[mode.id]}`}
                >
                  <span className={styles.modeIcon}>{mode.icon}</span>
                  <span className={styles.modeLabel}>{mode.label}</span>
                  <span className={styles.modePoints}>({mode.points} points)</span>
                  <small className={styles.modeDescription}>{mode.description}</small>
                </button>
              ))}
            </div>
          </div>

          {/* Interface de réponse selon le mode choisi */}
          {selectedMode && (
            <div className={styles.answerSection}>
              <h4 className={styles.answerTitle}>
                Mode {selectedMode.toUpperCase()} sélectionné
              </h4>
              
              {selectedMode === 'duo' && (
                <div className={styles.duoOptions}>
                  <h5>Choisis parmi ces 2 options :</h5>
                  <div className={styles.optionsGrid}>
                    {duoOptions.map((option, index) => (
                      <button 
                        key={index}
                        onClick={() => setPlayerAnswer(option)}
                        className={`${styles.optionButton} ${
                          playerAnswer === option ? styles.selectedOption : ''
                        }`}
                      >
                        {String.fromCharCode(65 + index)}) {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedMode === 'carre' && (
                <div className={styles.carreOptions}>
                  <h5>Choisis parmi ces 4 options :</h5>
                  <div className={styles.carreGrid}>
                    {carreOptions.map((option, index) => (
                      <button 
                        key={index}
                        onClick={() => setPlayerAnswer(option)}
                        className={`${styles.optionButton} ${
                          playerAnswer === option ? styles.selectedOption : ''
                        }`}
                      >
                        {String.fromCharCode(65 + index)}) {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedMode === 'cash' && (
                <div className={styles.cashInput}>
                  <h5>Tape ta réponse :</h5>
                  <input 
                    type="text"
                    value={playerAnswer}
                    onChange={(e) => setPlayerAnswer(e.target.value)}
                    placeholder="Nom du film..."
                    className={styles.textInput}
                  />
                </div>
              )}

              {/* Bouton valider */}
              {playerAnswer && (
                <div className={styles.submitSection}>
                  <button
                    onClick={onSubmitAnswer}
                    className={styles.submitButton}
                  >
                    ✅ Valider ma réponse
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GamePlaying;