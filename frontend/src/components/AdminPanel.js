import React, { useState, useEffect } from 'react';
import styles from './AdminPanel.module.css';

const AdminPanel = ({ onFilmsGenerated }) => {
  // État pour la liste des films
  const [films, setFilms] = useState([]);
  const [nextId, setNextId] = useState(1);
  
  // État pour la recherche Letterboxd
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Ajouter un film vide au tableau
  const addEmptyFilm = () => {
    const newFilm = {
      id: nextId,
      titre: '',
      location: '',
      lieuFilm: '',
      iframe: '',
      difficulty: '',
      theme: 'test',
      letterboxd: ''
    };
    
    setFilms(prev => [...prev, newFilm]);
    setNextId(prev => prev + 1);
  };

  // Mettre à jour un champ de film
  const updateFilm = (filmId, field, value) => {
    setFilms(prev => prev.map(film => 
      film.id === filmId ? { ...film, [field]: value } : film
    ));
  };

  // Supprimer un film
  const deleteFilm = (filmId) => {
    setFilms(prev => prev.filter(film => film.id !== filmId));
  };

  // Recherche sur Letterboxd (simulation pour l'instant)
  const searchLetterboxd = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowSearchResults(false);

    try {
      // Simulation d'appel API (tu devras remplacer par ton scraper)
      // Pour l'instant on simule avec des données factices
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simule le délai
      
      const mockResults = [
        {
          title: `${searchQuery} - Film 1`,
          year: '2020',
          letterboxdUrl: `https://letterboxd.com/film/${searchQuery.toLowerCase().replace(/\s+/g, '-')}-1/`
        },
        {
          title: `${searchQuery} - Film 2`, 
          year: '2019',
          letterboxdUrl: `https://letterboxd.com/film/${searchQuery.toLowerCase().replace(/\s+/g, '-')}-2/`
        },
        {
          title: `${searchQuery} - Film 3`,
          year: '2021', 
          letterboxdUrl: `https://letterboxd.com/film/${searchQuery.toLowerCase().replace(/\s+/g, '-')}-3/`
        }
      ];
      
      setSearchResults(mockResults);
      setShowSearchResults(true);
      
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      alert('Erreur lors de la recherche Letterboxd');
    } finally {
      setIsSearching(false);
    }
  };

  // Ajouter un film depuis les résultats de recherche
  const addFilmFromSearch = (result) => {
    const newFilm = {
      id: nextId,
      titre: result.title,
      location: '',
      lieuFilm: '',
      iframe: '',
      difficulty: '',
      theme: 'test',
      letterboxd: result.letterboxdUrl
    };
    
    setFilms(prev => [...prev, newFilm]);
    setNextId(prev => prev + 1);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // Sauvegarder la base de données
  const saveDatabase = () => {
    const validFilms = films.filter(film => 
      film.titre.trim() !== '' || 
      film.location.trim() !== '' || 
      film.iframe.trim() !== ''
    );

    if (validFilms.length === 0) {
      alert('Aucun film à sauvegarder !');
      return;
    }

    const database = {
      films: validFilms,
      createdAt: new Date().toISOString(),
      totalFilms: validFilms.length
    };

    // Créer un fichier JSON téléchargeable
    const dataStr = JSON.stringify(database, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `films-database-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log('Base de données sauvegardée:', database);
  };

  // Calculer le statut d'un film
  const getFilmStatus = (film) => {
    const hasBasicInfo = film.titre.trim() !== '' && film.location.trim() !== '';
    const hasIframe = film.iframe.trim() !== '';
    const hasDifficulty = film.difficulty !== '';
    
    if (hasBasicInfo && hasIframe && hasDifficulty) {
      return 'ready';
    } else if (hasBasicInfo || hasIframe || hasDifficulty) {
      return 'partial';
    } else {
      return 'empty';
    }
  };

  // Statistiques
  const getStats = () => {
    const total = films.length;
    const ready = films.filter(film => getFilmStatus(film) === 'ready').length;
    const partial = films.filter(film => getFilmStatus(film) === 'partial').length;
    const empty = films.filter(film => getFilmStatus(film) === 'empty').length;
    
    return { total, ready, partial, empty };
  };

  const stats = getStats();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🎬 Base de Données des Films</h1>
        <p className={styles.subtitle}>Gestion des films et lieux de tournage</p>
      </div>

      {/* Section de recherche Letterboxd */}
      <div className={styles.searchSection}>
        <h2 className={styles.sectionTitle}>🔍 Ajouter un Film depuis Letterboxd</h2>
        
        <div className={styles.searchBox}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tapez le nom d'un film à chercher..."
            className={styles.searchInput}
            onKeyPress={(e) => e.key === 'Enter' && searchLetterboxd()}
          />
          <button 
            onClick={searchLetterboxd}
            disabled={isSearching || !searchQuery.trim()}
            className={styles.searchButton}
          >
            {isSearching ? '🔍 Recherche...' : '🔍 Chercher'}
          </button>
        </div>

        {showSearchResults && searchResults.length > 0 && (
          <div className={styles.searchResults}>
            <h3>Résultats de recherche :</h3>
            {searchResults.map((result, index) => (
              <div key={index} className={styles.searchResultItem}>
                <div className={styles.resultInfo}>
                  <strong>{result.title}</strong>
                  <small>({result.year})</small>
                </div>
                <button
                  onClick={() => addFilmFromSearch(result)}
                  className={styles.addResultButton}
                >
                  ➕ Ajouter
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section tableau */}
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2 className={styles.sectionTitle}>📋 Liste des Films</h2>
          <div className={styles.stats}>
            <span className={styles.stat}>Total: {stats.total}</span>
            <span className={styles.stat}>Prêts: {stats.ready}</span>
            <span className={styles.stat}>Partiels: {stats.partial}</span>
            <span className={styles.stat}>Vides: {stats.empty}</span>
          </div>
          <button onClick={addEmptyFilm} className={styles.addButton}>
            ➕ Ajouter Film Vide
          </button>
        </div>

        {films.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucun film dans la base. Utilisez la recherche ou ajoutez un film vide.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Titre</th>
                  <th className={styles.th}>Location<br/><small>(lieu de tournage)</small></th>
                  <th className={styles.th}>Lieu-Film<br/><small>(correspond dans le film)</small></th>
                  <th className={styles.th}>Iframe<br/><small>(lien Google Street View)</small></th>
                  <th className={styles.th}>Difficulté</th>
                  <th className={styles.th}>Thème</th>
                  <th className={styles.th}>Letterboxd<br/><small>(lien page film)</small></th>
                  <th className={styles.th}>Statut</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {films.map((film) => {
                  const status = getFilmStatus(film);
                  return (
                    <tr key={film.id} className={styles.tr}>
                      <td className={styles.td}>
                        <input
                          type="text"
                          value={film.titre}
                          onChange={(e) => updateFilm(film.id, 'titre', e.target.value)}
                          placeholder="Titre du film"
                          className={styles.input}
                        />
                      </td>
                      
                      <td className={styles.td}>
                        <input
                          type="text"
                          value={film.location}
                          onChange={(e) => updateFilm(film.id, 'location', e.target.value)}
                          placeholder="ex: Paris, France"
                          className={styles.input}
                        />
                      </td>
                      
                      <td className={styles.td}>
                        <input
                          type="text"
                          value={film.lieuFilm}
                          onChange={(e) => updateFilm(film.id, 'lieuFilm', e.target.value)}
                          placeholder="ex: Maison de Julie"
                          className={styles.input}
                        />
                      </td>
                      
                      <td className={styles.td}>
                        <textarea
                          value={film.iframe}
                          onChange={(e) => updateFilm(film.id, 'iframe', e.target.value)}
                          placeholder="Lien iframe Google Street View..."
                          className={styles.textarea}
                          rows="3"
                        />
                      </td>
                      
                      <td className={styles.td}>
                        <select
                          value={film.difficulty}
                          onChange={(e) => updateFilm(film.id, 'difficulty', e.target.value)}
                          className={styles.select}
                        >
                          <option value="">-- Choisir --</option>
                          <option value="bebe-cadum">Bébé Cadum</option>
                          <option value="calmaaa">Calmaaa</option>
                          <option value="difficulte-terroriste">Difficulté Terroriste</option>
                        </select>
                      </td>
                      
                      <td className={styles.td}>
                        <input
                          type="text"
                          value={film.theme}
                          onChange={(e) => updateFilm(film.id, 'theme', e.target.value)}
                          placeholder="test"
                          className={styles.input}
                        />
                      </td>
                      
                      <td className={styles.td}>
                        <input
                          type="url"
                          value={film.letterboxd}
                          onChange={(e) => updateFilm(film.id, 'letterboxd', e.target.value)}
                          placeholder="https://letterboxd.com/film/..."
                          className={styles.input}
                        />
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
        )}

        <div className={styles.actions}>
          <button 
            onClick={saveDatabase}
            className={styles.saveButton}
            disabled={stats.total === 0}
          >
            💾 Télécharger la Base de Données ({stats.total} films)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;