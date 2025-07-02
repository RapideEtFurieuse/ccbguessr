const axios = require('axios');
const cheerio = require('cheerio');

class MovieLocationsScraper {
  constructor() {
    this.baseUrl = 'https://movie-locations.com';
  }

  // Configuration des headers qui fonctionnent
  getHeaders() {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://movie-locations.com/',
      'Connection': 'keep-alive'
    };
  }

  // Scraper une page de film spécifique
  async getMovieLocations(movieUrl) {
    try {
      console.log(`📍 Récupération: ${movieUrl}`);
      
      const response = await axios.get(movieUrl, {
        headers: this.getHeaders(),
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const locations = [];
      
      // Extraire le texte principal
      const content = $('body').text();
      console.log(`📝 Contenu récupéré: ${content.length} caractères`);
      
      // Patterns améliorés pour les adresses
      const addressPatterns = [
        // Pattern 1: Numéro + Nom de rue + type de rue
        /\b\d+[\s-]+[A-Za-z\s.'&-]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd|Lane|Ln|Way|Place|Pl|Court|Ct|Circle|Cir)\b/gi,
        
        // Pattern 2: Nom + adresse avec numéro
        /\b[A-Za-z\s&.'()-]+(?:Hotel|Restaurant|Grill|Bar|Studio|Ranch|Theater|Theatre|Museum|Gallery|Center|Centre|Building|House|Club|Cafe|Coffee)\s*[,\s]*\d+[^.!?\n]*/gi,
        
        // Pattern 3: Adresses complètes avec ville
        /\b\d+[^,\n]+,\s*[A-Za-z\s]+(?:,\s*[A-Z]{2})?\b/gi,
        
        // Pattern 4: Noms de lieux célèbres
        /\b[A-Za-z\s&.'()-]+(?:Ranch|Studio|Theater|Theatre|Hotel|Restaurant|Grill|Bar|Museum|Gallery|Center|Building)\b/gi
      ];

      let allMatches = [];
      
      addressPatterns.forEach((pattern, index) => {
        const matches = content.match(pattern) || [];
        console.log(`🎯 Pattern ${index + 1}: ${matches.length} correspondances`);
        
        matches.forEach(match => {
          const cleaned = this.cleanAddress(match);
          if (this.isValidAddress(cleaned)) {
            allMatches.push(cleaned);
          }
        });
      });

      // Dédupliquer et trier
      const uniqueAddresses = [...new Set(allMatches)];
      
      // Convertir en objets location
      uniqueAddresses.forEach(address => {
        locations.push({
          address: address,
          description: this.getLocationContext($, address),
          confidence: this.calculateConfidence(address)
        });
      });

      // Trier par confiance
      locations.sort((a, b) => b.confidence - a.confidence);

      console.log(`✅ ${locations.length} lieux trouvés`);
      
      // Afficher les premiers résultats
      locations.slice(0, 5).forEach((loc, i) => {
        console.log(`  ${i + 1}. ${loc.address} (confiance: ${loc.confidence})`);
      });

      return locations;

    } catch (error) {
      console.error(`❌ Erreur: ${error.message}`);
      return [];
    }
  }

  // Nettoyer une adresse
  cleanAddress(address) {
    return address
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[""'']/g, '"')
      .replace(/^\W+|\W+$/g, ''); // Enlever la ponctuation au début/fin
  }

  // Vérifier si une adresse est valide
  isValidAddress(address) {
    // Filtres de base
    if (address.length < 10 || address.length > 200) return false;
    if (/^\d+$/.test(address)) return false; // Que des chiffres
    if (!/[a-zA-Z]/.test(address)) return false; // Pas de lettres
    
    // Mots-clés positifs
    const positiveKeywords = ['street', 'avenue', 'boulevard', 'drive', 'road', 'hotel', 'restaurant', 'studio', 'theater', 'museum'];
    const hasPositiveKeyword = positiveKeywords.some(keyword => 
      address.toLowerCase().includes(keyword)
    );
    
    // Mots-clés négatifs (à éviter)
    const negativeKeywords = ['phone', 'email', 'website', 'copyright', 'reserved', 'click', 'menu'];
    const hasNegativeKeyword = negativeKeywords.some(keyword => 
      address.toLowerCase().includes(keyword)
    );
    
    return hasPositiveKeyword && !hasNegativeKeyword;
  }

  // Calculer un score de confiance
  calculateConfidence(address) {
    let score = 50; // Score de base
    
    // Bonus pour les patterns d'adresse
    if (/^\d+\s/.test(address)) score += 20; // Commence par un numéro
    if (/\d+/.test(address)) score += 10; // Contient un numéro
    if (/,/.test(address)) score += 15; // Contient une virgule
    
    // Bonus pour les mots-clés
    const highValueKeywords = ['hotel', 'restaurant', 'studio', 'theater', 'museum'];
    highValueKeywords.forEach(keyword => {
      if (address.toLowerCase().includes(keyword)) score += 15;
    });
    
    // Malus pour les adresses trop longues ou suspectes
    if (address.length > 100) score -= 20;
    if (address.split(' ').length > 15) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  // Obtenir le contexte d'un lieu
  getLocationContext($, address) {
    let context = '';
    const shortAddress = address.substring(0, 50);
    
    $('p').each((i, element) => {
      const text = $(element).text();
      if (text.includes(shortAddress)) {
        context = text.substring(0, 150) + '...';
        return false; // break
      }
    });
    
    return context;
  }

  // Test avec une URL connue
  async testWithKnownUrl() {
    const testUrl = 'https://movie-locations.com/movies/o/Once-Upon-A-Time-In-Hollywood.php';
    console.log(`🧪 Test avec URL connue: Once Upon a Time in Hollywood`);
    
    const locations = await this.getMovieLocations(testUrl);
    
    return {
      movie: 'Once Upon a Time in Hollywood',
      url: testUrl,
      locations: locations,
      found: locations.length > 0
    };
  }

  // Obtenir des lieux pour plusieurs films (avec URLs connues)
  async getKnownMovieLocations() {
    const knownMovies = [
      {
        title: 'Once Upon a Time in Hollywood',
        url: 'https://movie-locations.com/movies/o/Once-Upon-A-Time-In-Hollywood.php'
      },
      {
        title: 'Pulp Fiction', 
        url: 'https://movie-locations.com/movies/p/Pulp-Fiction.php'
      },
      {
        title: 'The Dark Knight',
        url: 'https://movie-locations.com/movies/d/Dark-Knight.php'
      }
    ];

    const results = [];
    
    for (const movie of knownMovies) {
      console.log(`\n🎬 Traitement: ${movie.title}`);
      
      const locations = await this.getMovieLocations(movie.url);
      
      results.push({
        movie: movie.title,
        url: movie.url,
        locations: locations,
        found: locations.length > 0
      });
      
      // Pause entre les films
      await this.sleep(3000);
    }

    return results;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Test principal
async function testMovieLocationsScraper() {
  const scraper = new MovieLocationsScraper();
  
  try {
    console.log('🚀 Test du scraper movie-locations.com\n');
    
    // Test 1: Film unique
    const singleResult = await scraper.testWithKnownUrl();
    
    console.log(`\n📊 RÉSULTAT pour ${singleResult.movie}:`);
    console.log(`✅ ${singleResult.locations.length} lieux trouvés`);
    
    if (singleResult.locations.length > 0) {
      console.log('\n🏆 TOP 5 des lieux:');
      singleResult.locations.slice(0, 5).forEach((loc, i) => {
        console.log(`${i + 1}. ${loc.address}`);
        if (loc.description) {
          console.log(`   Context: ${loc.description.substring(0, 100)}...`);
        }
      });
    }

    return singleResult;

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

module.exports = MovieLocationsScraper;

if (require.main === module) {
  testMovieLocationsScraper();
}