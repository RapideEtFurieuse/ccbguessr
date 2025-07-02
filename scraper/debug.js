const LetterboxdScraper = require('./letterboxd');
const MovieLocationsScraper = require('./movie-locations');

async function debugComplete() {
  console.log('🔍 DEBUG COMPLET DU SYSTÈME\n');
  
  // Étape 1: Voir exactement quels films sont récupérés
  console.log('📚 ÉTAPE 1: Films Letterboxd');
  const letterboxdScraper = new LetterboxdScraper();
  
  try {
    const usernames = ['Potatoze', 'diegobrando7'];
    const letterboxdData = await letterboxdScraper.getMultipleUsersFilms(usernames, 2);
    
    console.log('\n🎬 FILMS RÉCUPÉRÉS:');
    
    // Afficher tous les films de chaque utilisateur
    Object.entries(letterboxdData.userFilms).forEach(([username, films]) => {
      console.log(`\n👤 ${username} (${films.length} films):`);
      films.slice(0, 10).forEach((film, i) => {
        console.log(`  ${i + 1}. "${film.title}" (${film.year})`);
      });
    });
    
    // Afficher les films communs
    console.log(`\n🎯 FILMS COMMUNS (${letterboxdData.commonFilms.length}):`);
    letterboxdData.commonFilms.slice(0, 10).forEach((film, i) => {
      console.log(`  ${i + 1}. "${film.title}" (${film.year})`);
    });
    
    // Étape 2: Tester la correspondance avec notre base de données
    console.log('\n🔗 ÉTAPE 2: Test de correspondance');
    
    const knownUrls = {
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
      'back to the future': 'https://movie-locations.com/movies/b/Back-to-the-Future.php',
      'joker': 'https://movie-locations.com/movies/j/Joker.php',
      'spider-man': 'https://movie-locations.com/movies/s/Spider-Man.php',
      'avengers': 'https://movie-locations.com/movies/a/Avengers.php',
      'iron man': 'https://movie-locations.com/movies/i/Iron-Man.php',
      'thor': 'https://movie-locations.com/movies/t/Thor.php',
      'captain america': 'https://movie-locations.com/movies/c/Captain-America.php',
      'star wars': 'https://movie-locations.com/movies/s/Star-Wars.php',
      'lord of the rings': 'https://movie-locations.com/movies/l/Lord-of-the-Rings.php',
      'harry potter': 'https://movie-locations.com/movies/h/Harry-Potter.php',
      'pirates of the caribbean': 'https://movie-locations.com/movies/p/Pirates-of-the-Caribbean.php'
    };
    
    function findMatchingUrl(filmTitle) {
      const cleanTitle = filmTitle
        .toLowerCase()
        .replace(/\s*\(\d{4}\)$/, '')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`🔍 Test: "${filmTitle}" -> "${cleanTitle}"`);
      
      // Test exact
      if (knownUrls[cleanTitle]) {
        console.log(`  ✅ MATCH EXACT: ${knownUrls[cleanTitle]}`);
        return knownUrls[cleanTitle];
      }
      
      // Test partiel
      for (const [knownTitle, url] of Object.entries(knownUrls)) {
        if (cleanTitle.includes(knownTitle) || knownTitle.includes(cleanTitle)) {
          console.log(`  ✅ MATCH PARTIEL: "${knownTitle}" -> ${url}`);
          return url;
        }
      }
      
      console.log(`  ❌ AUCUN MATCH`);
      return null;
    }
    
    // Tester tous les films communs
    console.log(`\n🎯 TEST DES FILMS COMMUNS:`);
    const matches = [];
    
    letterboxdData.commonFilms.forEach((film, i) => {
      const url = findMatchingUrl(film.title);
      if (url) {
        matches.push({ film, url });
      }
    });
    
    console.log(`\n📊 RÉSULTAT: ${matches.length} correspondances trouvées sur ${letterboxdData.commonFilms.length} films communs`);
    
    // Étape 3: Tester un film qui marche
    if (matches.length > 0) {
      console.log(`\n🧪 ÉTAPE 3: Test du scraping sur le premier match`);
      const firstMatch = matches[0];
      console.log(`Test avec: "${firstMatch.film.title}"`);
      console.log(`URL: ${firstMatch.url}`);
      
      const movieLocationsScraper = new MovieLocationsScraper();
      const locations = await movieLocationsScraper.getMovieLocations(firstMatch.url);
      
      console.log(`\n📍 RÉSULTAT: ${locations.length} lieux trouvés`);
      if (locations.length > 0) {
        console.log(`Top 3:`);
        locations.slice(0, 3).forEach((loc, i) => {
          console.log(`  ${i + 1}. ${loc.address}`);
        });
      }
    }
    
    return { letterboxdData, matches };
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

if (require.main === module) {
  debugComplete();
}