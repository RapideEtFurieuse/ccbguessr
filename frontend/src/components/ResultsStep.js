import React from 'react';
import styles from './ResultsStep.module.css';

const ResultsStep = ({ results, onNextQuestion }) => {
  if (!results) return null;

  const getModeColor = (mode) => {
    switch (mode) {
      case 'duo': return '#4CAF50';
      case 'carre': return '#FF9800';
      case 'cash': return '#F44336';
      default: return '#2196F3';
    }
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'duo': return '🤝';
      case 'carre': return '🎯';
      case 'cash': return '💰';
      default: return '🎮';
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>📊 Résultats de la question</h2>
      
      <div className={styles.correctAnswerSection}>
        <h3 className={styles.correctAnswerTitle}>✅ Bonne réponse</h3>
        <div className={styles.correctAnswer}>
          {results.correctAnswer}
        </div>
      </div>
      
      <div className={styles.answersSection}>
        <h4 className={styles.answersTitle}>Réponses des joueurs :</h4>
        <div className={styles.answersGrid}>
          {results.answers.map((answer, index) => {
            const isCorrect = answer.answer === results.correctAnswer;
            return (
              <div 
                key={index} 
                className={`${styles.answerCard} ${
                  isCorrect ? styles.correctCard : styles.incorrectCard
                }`}
              >
                <div className={styles.playerInfo}>
                  <span className={styles.playerName}>{answer.player}</span>
                  <div className={styles.modeInfo}>
                    <span 
                      className={styles.modeChip}
                      style={{ backgroundColor: getModeColor(answer.mode) }}
                    >
                      {getModeIcon(answer.mode)} {answer.mode.toUpperCase()}
                    </span>
                    <span className={styles.points}>+{answer.points} pts</span>
                  </div>
                </div>
                
                <div className={styles.answerContent}>
                  <div className={styles.answerText}>
                    <strong>"{answer.answer}"</strong>
                  </div>
                  <div className={styles.resultIcon}>
                    {isCorrect ? (
                      <span className={styles.successIcon}>✅</span>
                    ) : (
                      <span className={styles.errorIcon}>❌</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className={styles.actionSection}>
        <button 
          onClick={onNextQuestion}
          className={styles.nextButton}
        >
          ➡️ Question suivante
        </button>
      </div>
    </div>
  );
};

export default ResultsStep;