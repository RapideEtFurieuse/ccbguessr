const LetterboxdScraper = require('./letterboxd');
const MovieLocationsScraper = require('./movie-locations');
const fs = require('fs').promises;

class CombinedScraper {
  constructor() {
    this.letterboxdScraper = new LetterboxdScraper();
    this.movieLocationsScraper = new MovieLocationsScraper();
  }

  // Créer une base de données complète pour un groupe d'amis
  async createGameDatabase(usernames, options = {}) {
    const maxPages = options.maxPages || 5;
    const maxMovies = options.maxMovies || 20;
    
    console.log(`🚀 Création de la base de données pour: ${usernames.join(', ')}`);
    
    // Étape 1: Récupérer les films des utilisateurs
    console.log(`\n📚 ÉTAPE 1: Récupération des films Letterboxd`);
    const letterboxdData = await this.letterboxdScraper.getMultipleUsersFilms(usernames, maxPages);
    
    // Étape 2: Sélectionner les films à traiter
    console.log(`\n🎯 ÉTAPE 2: Sélection des films`);
    const selectedMovies = this.selectMoviesForGame(letterboxdData, maxMovies);
    
    console.log(`📽️ ${selectedMovies.length} films sélectionnés pour le jeu`);
    selectedMovies.forEach((movie, i) => {
      console.log(`  ${i + 1}. ${movie.title} (${movie.year})`);
    });

    // Étape 3: Récupérer les lieux de tournage
    console.log(`\n📍 ÉTAPE 3: Récupération des lieux de tournage`);
    const moviesWithLocations = await this.getLocationsForSelectedMovies(selectedMovies);
    
    // Étape 4: Filtrer et valider
    console.log(`\n✅ ÉTAPE 4: Filtrage et validation`);
    const gameReadyMovies = this.filterMoviesForGame(moviesWithLocations);
    
    // Étape 5: Sauvegarder
    console.log(`\n💾 ÉTAPE 5: Sauvegarde`);
    const database = {
      users: usernames,
      createdAt: new Date().toISOString(),
      stats: letterboxdData.stats,
      movies: gameReadyMovies,
      summary: {
        totalMoviesFound: selectedMovies.length,
        moviesWithLocations: moviesWithLocations.filter(m => m.locations.length > 0).length,
        gameReadyMovies: gameReadyMovies.length
      }
    };
    
    await this.saveDatabase(database);
    
    console.log(`\n🎉 BASE DE DONNÉES CRÉÉE !`);
    console.log(`📊 Résumé:`);
    console.log(`  • Utilisateurs: ${database.users.length}`);
    console.log(`  • Films traités: ${database.summary.totalMoviesFound}`);
    console.log(`  • Films avec lieux: ${database.summary.moviesWithLocations}`);
    console.log(`  • Films prêts pour le jeu: ${database.summary.gameReadyMovies}`);
    
    return database;
  }

  // Sélectionner les films pour le jeu
  selectMoviesForGame(letterboxdData, maxMovies) {
    // Prioriser les films communs, puis les plus populaires
    let selectedMovies = [];
    
    // 1. Films vus par tous (priorité maximale)
    if (letterboxdData.commonFilms.length > 0) {
      const commonCount = Math.min(letterboxdData.commonFilms.length, Math.floor(maxMovies * 0.7));
      selectedMovies = letterboxdData.commonFilms.slice(0, commonCount);
      console.log(`  📈 ${selectedMovies.length} films communs sélectionnés`);
    }
    
    // 2. Compléter avec des films populaires du groupe
    const remaining = maxMovies - selectedMovies.length;
    if (remaining > 0) {
      const allFilms = [];
      Object.values(letterboxdData.userFilms).forEach(userFilms => {
        allFilms.push(...userFilms);
      });
      
      // Compter la popularité
      const filmCounts = {};
      allFilms.forEach(film => {
        filmCounts[film.slug] = (filmCounts[film.slug] || 0) + 1;
      });
      
      // Trier par popularité
      const popularFilms = allFilms
        .filter(film => !selectedMovies.some(s => s.slug === film.slug))
        .sort((a, b) => (filmCounts[b.slug] || 0) - (filmCounts[a.slug] || 0))
        .slice(0, remaining);
      
      selectedMovies.push(...popularFilms);
      console.log(`  📊 ${popularFilms.length} films populaires ajoutés`);
    }
    
    return selectedMovies;
  }

  // Récupérer les lieux pour les films sélectionnés
  async getLocationsForSelectedMovies(movies) {
    const results = [];
    
    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      console.log(`\n🎬 [${i + 1}/${movies.length}] ${movie.title}`);
      
      try {
        // Chercher l'URL dans notre base de données
        const movieUrl = this.findMovieLocationUrl(movie.title);
        
        if (movieUrl) {
          const locations = await this.movieLocationsScraper.getMovieLocations(movieUrl);
          
          results.push({
            ...movie,
            locations: locations,
            movieLocationUrl: movieUrl
          });
          
          console.log(`  📍 ${locations.length} lieux trouvés`);
        } else {
          console.log(`  ❌ Film non supporté pour l'instant`);
          results.push({
            ...movie,
            locations: [],
            movieLocationUrl: null
          });
        }
        
      } catch (error) {
        console.log(`  ❌ Erreur: ${error.message}`);
        results.push({
          ...movie,
          locations: [],
          movieLocationUrl: null
        });
      }
      
      // Pause entre les films
      await this.sleep(2000);
    }
    
    return results;
  }

  // Base de données d'URLs connues pour movie-locations
  getKnownMovieUrls() {
    return {
      'once upon a time in hollywood': 'https://movie-locations.com/movies/o/Once-Upon-A-Time-In-Hollywood.php',
      'pulp fiction': 'https://movie-locations.com/movies/p/Pulp-Fiction.php',
      'the dark knight': 'https://movie-locations.com/movies/d/Dark-Knight.php',
      'kill bill': 'https://movie-locations.com/movies/k/Kill-Bill.php',
      'django unchained': 'https://movie-locations.com/movies/d/Django-Unchained.php',
      'inglourious basterds': 'https://movie-locations.com/movies/i/Inglourious-Basterds.php',
      'reservoir dogs': 'https://movie-locations.com/movies/r/Reservoir-Dogs.php',
      'batman begins': 'https://movie-locations.com/movies/b/Batman-Begins.php',
      'inception': 'https://movie-locations.com/movies/i/Inception.php',
      'interstellar': 'https://movie-locations.com/movies/i/Interstellar.php',
      'the godfather': 'https://movie-locations.com/movies/g/Godfather.php',
      'goodfellas': 'https://movie-locations.com/movies/g/Goodfellas.php',
      'scarface': 'https://movie-locations.com/movies/s/Scarface.php',
      'casino': 'https://movie-locations.com/movies/c/Casino.php',
      'taxi driver': 'https://movie-locations.com/movies/t/Taxi-Driver.php',
      'fight club': 'https://movie-locations.com/movies/f/Fight-Club.php',
      'the matrix': 'https://movie-locations.com/movies/m/Matrix.php',
      'blade runner': 'https://movie-locations.com/movies/b/Blade-Runner.php',
      'terminator': 'https://movie-locations.com/movies/t/Terminator.php',
      'back to the future': 'https://movie-locations.com/movies/b/Back-to-the-Future.php'
    };
  }

  // Trouver l'URL pour un film
  findMovieLocationUrl(title) {
    const knownUrls = this.getKnownMovieUrls();
    
    // Nettoyer le titre pour la recherche
    const cleanTitle = title
      .toLowerCase()
      .replace(/\s*\(\d{4}\)$/, '') // Enlever l'année
      .replace(/[^\w\s]/g, ' ') // Remplacer ponctuation par espaces
      .replace(/\s+/g, ' ') // Normaliser espaces
      .trim();
    
    // Recherche exacte
    if (knownUrls[cleanTitle]) {
      console.log(`  🎯 URL connue trouvée pour "${title}"`);
      return knownUrls[cleanTitle];
    }
    
    // Recherche partielle
    for (const [knownTitle, url] of Object.entries(knownUrls)) {
      if (cleanTitle.includes(knownTitle) || knownTitle.includes(cleanTitle)) {
        console.log(`  🎯 Correspondance partielle: "${title}" -> "${knownTitle}"`);
        return url;
      }
    }
    
    console.log(`  ❓ Film non trouvé dans la base: "${title}"`);
    return null;
  }

  // Filtrer les films prêts pour le jeu
  filterMoviesForGame(moviesWithLocations) {
    return moviesWithLocations
      .filter(movie => movie.locations.length > 0)
      .map(movie => ({
        title: movie.title,
        year: movie.year,
        slug: movie.slug,
        letterboxdUrl: movie.letterboxdUrl,
        movieLocationUrl: movie.movieLocationUrl,
        locations: movie.locations
          .filter(loc => loc.confidence > 60) // Garder seulement les lieux fiables
          .slice(0, 5) // Max 5 lieux par film
          .map(loc => ({
            address: loc.address,
            description: loc.description,
            confidence: loc.confidence
          }))
      }))
      .filter(movie => movie.locations.length > 0);
  }

  // Sauvegarder la base de données
  async saveDatabase(database) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `game-database-${timestamp}.json`;
    
    try {
      await fs.writeFile(filename, JSON.stringify(database, null, 2));
      console.log(`📁 Base de données sauvée: ${filename}`);
    } catch (error) {
      console.error(`❌ Erreur de sauvegarde: ${error.message}`);
    }
  }

  // Charger une base de données existante
  async loadDatabase(filename) {
    try {
      const data = await fs.readFile(filename, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ Erreur de chargement: ${error.message}`);
      return null;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Test du système complet
async function testCombinedScraper() {
  const scraper = new CombinedScraper();
  
  // Configuration
  const usernames = ['Potatoze', 'diegobrando7'];
  const options = {
    maxPages: 2, // Limiter pour le test
    maxMovies: 10 // Seulement 10 films pour le test
  };
  
  try {
    console.log('🎯 TEST DU SYSTÈME COMPLET\n');
    
    const database = await scraper.createGameDatabase(usernames, options);
    
    console.log('\n🎮 FILMS PRÊTS POUR LE JEU:');
    database.movies.forEach((movie, i) => {
      console.log(`\n${i + 1}. ${movie.title} (${movie.year})`);
      console.log(`   🔗 ${movie.letterboxdUrl}`);
      console.log(`   📍 ${movie.locations.length} lieux:`);
      movie.locations.slice(0, 2).forEach(loc => {
        console.log(`      - ${loc.address} (${loc.confidence}% confiance)`);
      });
    });
    
    return database;

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

module.exports = CombinedScraper;

if (require.main === module) {
  testCombinedScraper();
}