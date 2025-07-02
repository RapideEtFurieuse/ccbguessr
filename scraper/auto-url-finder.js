const axios = require('axios');
const LetterboxdScraper = require('./letterboxd');

class AutoUrlFinder {
  constructor() {
    this.baseUrl = 'https://movie-locations.com';
  }

  getHeaders() {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://movie-locations.com/',
      'Connection': 'keep-alive'
    };
  }

  // Générer plusieurs variations d'URL pour un film
  generateUrlVariations(title) {
    const cleanTitle = title
      .replace(/\s*\(\d{4}\)$/, '') // Enlever l'année
      .replace(/[^\w\s]/g, ' ') // Remplacer ponctuation par espaces
      .replace(/\s+/g, ' ')
      .trim();

    // Variations possibles
    const variations = [];
    
    // Format 1: Titre simple avec tirets
    const simple = cleanTitle.replace(/\s+/g, '-');
    
    // Format 2: Sans articles
    const noArticles = cleanTitle.replace(/^(The|A|An)\s+/i, '').replace(/\s+/g, '-');
    
    // Format 3: Première lettre en majuscule pour chaque mot
    const titleCase = cleanTitle.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-');
    
    // Format 4: Tout en minuscules
    const lowercase = cleanTitle.toLowerCase().replace(/\s+/g, '-');
    
    [simple, noArticles, titleCase, lowercase].forEach(variant => {
      if (variant && variant !== '-') {
        const firstLetter = variant.charAt(0).toLowerCase();
        variations.push(`${this.baseUrl}/movies/${firstLetter}/${variant}.php`);
      }
    });

    return [...new Set(variations)]; // Dédupliquer
  }

  // Tester si une URL existe
  async testUrl(url) {
    try {
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 10000
      });
      
      if (response.status === 200 && response.data.length > 1000) {
        // Vérifier que c'est une vraie page de film
        const content = response.data.toLowerCase();
        if (content.includes('filming location') || 
            content.includes('movie location') || 
            content.includes('filmed at') ||
            content.includes('location')) {
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Trouver l'URL qui marche pour un film
  async findWorkingUrl(title) {
    console.log(`🔍 Recherche URL pour: "${title}"`);
    
    const variations = this.generateUrlVariations(title);
    console.log(`  📝 ${variations.length} variations à tester`);
    
    for (const url of variations) {
      console.log(`    Test: ${url}`);
      const works = await this.testUrl(url);
      
      if (works) {
        console.log(`    ✅ TROUVÉ!`);
        return url;
      } else {
        console.log(`    ❌ Non`);
      }
      
      // Pause pour ne pas surcharger le serveur
      await this.sleep(1000);
    }
    
    console.log(`  ❌ Aucune URL trouvée pour "${title}"`);
    return null;
  }

  // Créer la base de données d'URLs pour une liste de films
  async createUrlDatabase(films) {
    console.log(`🚀 Création de la base d'URLs pour ${films.length} films\n`);
    
    const urlDatabase = {};
    const found = [];
    const notFound = [];
    
    for (let i = 0; i < films.length; i++) {
      const film = films[i];
      console.log(`\n[${i + 1}/${films.length}] ${film.title}`);
      
      const url = await this.findWorkingUrl(film.title);
      
      if (url) {
        const key = film.title.toLowerCase()
          .replace(/\s*\(\d{4}\)$/, '')
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        urlDatabase[key] = url;
        found.push({ title: film.title, url });
      } else {
        notFound.push(film.title);
      }
      
      // Pause entre les films
      await this.sleep(2000);
    }
    
    console.log(`\n📊 RÉSULTATS:`);
    console.log(`✅ Trouvés: ${found.length}`);
    console.log(`❌ Non trouvés: ${notFound.length}`);
    
    if (found.length > 0) {
      console.log(`\n🎬 FILMS TROUVÉS:`);
      found.forEach((item, i) => {
        console.log(`${i + 1}. ${item.title}`);
        console.log(`   ${item.url}`);
      });
    }
    
    if (notFound.length > 0) {
      console.log(`\n❌ FILMS NON TROUVÉS:`);
      notFound.forEach(title => console.log(`  - ${title}`));
    }
    
    return { urlDatabase, found, notFound };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Script principal
async function findUrlsForCommonFilms() {
  console.log('🎯 RECHERCHE AUTOMATIQUE D\'URLs\n');
  
  try {
    // 1. Récupérer les films communs
    const letterboxdScraper = new LetterboxdScraper();
    const usernames = ['Potatoze', 'diegobrando7'];
    const letterboxdData = await letterboxdScraper.getMultipleUsersFilms(usernames, 2);
    
    console.log(`📚 ${letterboxdData.commonFilms.length} films communs trouvés`);
    
    // 2. Chercher les URLs (limiter à 10 pour le test)
    const filmsToTest = letterboxdData.commonFilms.slice(0, 10);
    console.log(`🧪 Test sur les ${filmsToTest.length} premiers films`);
    
    const finder = new AutoUrlFinder();
    const result = await finder.createUrlDatabase(filmsToTest);
    
    // 3. Générer le code à copier
    if (result.found.length > 0) {
      console.log(`\n📝 CODE À AJOUTER DANS LE COMBINED-SCRAPER:`);
      console.log(`// URLs trouvées automatiquement:`);
      result.found.forEach(item => {
        const key = item.title.toLowerCase()
          .replace(/\s*\(\d{4}\)$/, '')
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        console.log(`'${key}': '${item.url}',`);
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

if (require.main === module) {
  findUrlsForCommonFilms();
}