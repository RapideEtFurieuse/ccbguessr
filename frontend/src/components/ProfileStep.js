import React from 'react';
import styles from './ProfileStep.module.css';

const ProfileStep = ({ 
  pseudo, 
  setPseudo, 
  photo, 
  setPhoto, 
  onContinue 
}) => {
  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Créer ton profil</h2>
      
      <input 
        type="text" 
        placeholder="Ton pseudo"
        value={pseudo}
        onChange={(e) => setPseudo(e.target.value)}
        className={styles.input}
      />
      
      <div className={styles.photoSection}>
        <input 
          type="file" 
          accept="image/*"
          onChange={handlePhotoUpload}
          className={styles.fileInput}
        />
        {photo && (
          <img 
            src={photo} 
            alt="Profil" 
            className={styles.profilePhoto}
          />
        )}
      </div>
      
      {pseudo && (
        <button 
          onClick={onContinue}
          className={styles.continueButton}
        >
          Continuer vers les lobbies
        </button>
      )}
    </div>
  );
};

export default ProfileStep;