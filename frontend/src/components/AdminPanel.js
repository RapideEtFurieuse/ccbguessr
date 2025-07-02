import React, { useState } from 'react';
import styles from './AdminPanel.module.css';

const AdminPanel = ({ onFilmsGenerated }) => {
  const [letterboxdUsers, setLetterboxdUsers] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [films, setFilms] = useState([]);
  const [error, setError] = useState('');

  // Films de test (simulant les films communs récupérés)
  const generateTestFilms = () => {
    return [
      { title: 'Oppenheimer', year: '2023', letterboxdUrl: 'https://letterboxd.com/film/oppenheimer/' },
      { title: 'Dune', year: '2021', letterboxdUrl: 'https://letterboxd.com/film/dune-2021/' },
      { title: 'The Batman', year: '2022', letterboxdUrl: 'https://letterboxd.com/film/the-batman/' },
      { title: 'Avatar: The Way of Water', year: '2022', letterboxdUrl: 'https://letterboxd.com/film/avatar-the-way-of-water/' },
      { title: 'Killers of the Flower Moon', year: '2023', letterboxdUrl: 'https://letterboxd.com/film/killers-of-the-flower-moon/' },
      { title: 'The Holdovers', year: '2023', letterboxdUrl: 'https://letterboxd.com/film/the-holdovers/' },
      { title: 'Perfect Days', year: '2023', letterboxdUrl: 'https://letterboxd.com/film/perfect-days-2023/' },
      { title: 'Anatomy of a Fall', year: '2023', letterboxdUrl: 'https://letterboxd.com/film/anatomy-of-a-fall/' },
      { title: 'The Iron Claw', year: '2023', letterboxdUrl: 'https://letterboxd.com/film/the-iron-claw/' },
      { title: 'Furiosa: A Mad Max Saga', year: '2024', letterboxdUrl: 'https://letterboxd.com/film/furiosa-a-mad-max-saga/' }
    ].map((film, index) => ({
      ...film,
      id: index + 1,
      iframe: '',
      difficulty: 'test',
      thematic: 'test'
    }));
  };

  const handleGenerateFilms = async () => {
    const usernames = letterboxdUsers.split(',').map(u => u.trim()).filter(u => u);
    
    if (usernames.length === 0) {
      setError('Veuillez entrer au moins un pseudo Letterboxd');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulation du scraping Letterboxd
      console.log('Génération des films pour:', usernames);
      
      // Simulation d'un délai
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedFilms = generateTestFilms();
      setFilms(generatedFilms);
      
      if (onFilmsGenerated) {
        onFilmsGenerated(generatedFilms);
      }
      
    } catch (err) {
      setError('Erreur lors de la génération des films: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilm = (filmId, field, value) => {
    setFilms(prev => prev.map(film => 
      film.id === filmId ? { ...film, [field]: value } : film
    ));
  };

  const saveDatabase = () => {
    const database = {
      users: letterboxdUsers.split(',').map(u => u.trim()).filter(u => u),
      films: films.filter(film => 
        film.iframe.trim() !== '' && 
        film.difficulty !== '' && 
        film.thematic !== ''
      ), // Tous les films avec tous les champs remplis
      createdAt: new Date().toISOString()
    };

    // Créer un fichier JSON téléchargeable
    const dataStr = JSON.stringify(database, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `game-database-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log('Base de données sauvegardée:', database);
  };

  const deleteFilm = (filmId) => {
    setFilms(prev => prev.filter(film => film.id !== filmId));
  };

  const getReadyFilmsCount = () => {
    return films.filter(film => 
      film.iframe.trim() !== '' && 
      film.difficulty !== '' && 
      film.thematic !== ''
    ).length;
  };

  const getFilmStatus = (film) => {
    const hasIframe = film.iframe.trim() !== '';
    const hasDifficulty = film.difficulty !== '';
    const hasThematic = film.thematic !== '';
    
    if (hasIframe && hasDifficulty && hasThematic) {
      return 'ready';
    } else if (hasIframe || hasDifficulty || hasThematic) {
      return 'partial';
    } else {
      return 'empty';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🎬 Administration du Jeu</h1>
        <p className={styles.subtitle}>Interface de gestion des films et questions</p>
      </div>

      {/* Section de génération */}
      <div className={styles.generationSection}>
        <h2 className={styles.sectionTitle}>📚 Génération des Films</h2>
        
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            Pseudos Letterboxd (séparés par des virgules) :
          </label>
          <input
            type="text"
            value={letterboxdUsers}
            onChange={(e) => setLetterboxdUsers(e.target.value)}
            placeholder="Potatoze, diegobrando7, autrepseudo..."
            className={styles.input}
            disabled={isLoading}
          />
        </div>

        <button 
          onClick={handleGenerateFilms}
          disabled={isLoading || !letterboxdUsers.trim()}
          className={styles.generateButton}
        >
          {isLoading ? '⏳ Génération en cours...' : '🚀 Générer la liste des films'}
        </button>

        {error && (
          <div className={styles.error}>
            ❌ {error}
          </div>
        )}
      </div>

      {/* Section du tableau */}
      {films.length > 0 && (
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h2 className={styles.sectionTitle}>🎯 Configuration des Questions</h2>
            <div className={styles.stats}>
              <span className={styles.stat}>Total: {films.length} films</span>
              <span className={styles.stat}>Prêts: {getReadyFilmsCount()}</span>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Film</th>
                  <th className={styles.th}>iframe Street View</th>
                  <th className={styles.th}>Difficulté</th>
                  <th className={styles.th}>Thématique</th>
                  <th className={styles.th}>Statut</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {films.map(film => {
                  const status = getFilmStatus(film);
                  return (
                    <tr key={film.id} className={styles.tr}>
                      <td className={styles.td}>
                        <div className={styles.filmInfo}>
                          <strong>{film.title}</strong>
                          <small>({film.year})</small>
                        </div>
                      </td>
                      
                      <td className={styles.td}>
                        <textarea
                          value={film.iframe}
                          onChange={(e) => updateFilm(film.id, 'iframe', e.target.value)}
                          placeholder="Coller l'iframe Google Street View ici..."
                          className={styles.textarea}
                          rows={3}
                        />
                      </td>
                      
                      <td className={styles.td}>
                        <select
                          value={film.difficulty}
                          onChange={(e) => updateFilm(film.id, 'difficulty', e.target.value)}
                          className={styles.select}
                        >
                          <option value="test">test</option>
                          <option value="bebe-cadum">Bébé cadum</option>
                          <option value="la-on-parle">Là on parle</option>
                          <option value="god-mode">God mode</option>
                        </select>
                      </td>
                      
                      <td className={styles.td}>
                        <select
                          value={film.thematic}
                          onChange={(e) => updateFilm(film.id, 'thematic', e.target.value)}
                          className={styles.select}
                        >
                          <option value="test">test</option>
                          <option value="ma-france">Ma France</option>
                          <option value="global">Global</option>
                        </select>
                      </td>
                      
                      <td className={styles.td}>
                        <span className={`${styles.status} ${
                          status === 'ready'
                            ? styles.statusReady
                            : status === 'partial'
                            ? styles.statusPartial
                            : styles.statusEmpty
                        }`}>
                          {status === 'ready'
                            ? '✅ Prêt'
                            : status === 'partial'
                            ? '🔄 Partiel'
                            : '⭕ Vide'
                          }
                        </span>
                      </td>
                      
                      <td className={styles.td}>
                        <button
                          onClick={() => deleteFilm(film.id)}
                          className={styles.deleteButton}
                          title="Supprimer ce film"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.actions}>
            <button 
              onClick={saveDatabase}
              className={styles.saveButton}
              disabled={getReadyFilmsCount() === 0}
            >
              💾 Télécharger la Base de Données ({getReadyFilmsCount()} films prêts)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;