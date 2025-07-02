const axios = require('axios');

async function testConnection() {
  const testUrl = 'https://movie-locations.com/movies/o/Once-Upon-A-Time-In-Hollywood.php';
  
  const configs = [
    {
      name: 'Basic',
      config: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    },
    {
      name: 'Complete Headers',
      config: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        timeout: 10000
      }
    },
    {
      name: 'With Referer',
      config: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://movie-locations.com/',
          'Connection': 'keep-alive'
        },
        timeout: 15000
      }
    }
  ];

  for (const test of configs) {
    console.log(`\n🧪 Test: ${test.name}`);
    console.log(`🔗 URL: ${testUrl}`);
    
    try {
      const response = await axios.get(testUrl, test.config);
      
      console.log(`✅ Succès!`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📏 Taille: ${response.data.length} caractères`);
      console.log(`📄 Début du contenu: "${response.data.substring(0, 100)}..."`);
      
      // Vérifier si c'est du HTML valide
      if (response.data.includes('<html') || response.data.includes('<!DOCTYPE')) {
        console.log(`✅ HTML valide détecté`);
        
        // Chercher des mots-clés spécifiques à cette page
        const keywords = ['Hollywood', 'Tarantino', 'DiCaprio', 'Musso', 'Frank'];
        keywords.forEach(keyword => {
          if (response.data.includes(keyword)) {
            console.log(`🎯 Mot-clé trouvé: "${keyword}"`);
          }
        });
        
        return response.data; // Retourner le premier succès
      } else {
        console.log(`❌ Contenu suspect (pas du HTML)`);
      }
      
    } catch (error) {
      console.log(`❌ Échec: ${error.message}`);
      
      if (error.response) {
        console.log(`📊 Status d'erreur: ${error.response.status}`);
        console.log(`📄 Headers de réponse:`, Object.keys(error.response.headers));
      }
    }
    
    // Pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return null;
}

// Test simple de la page d'accueil
async function testHomepage() {
  console.log('\n🏠 Test de la page d\'accueil:');
  
  try {
    const response = await axios.get('https://movie-locations.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });
    
    console.log(`✅ Page d'accueil accessible`);
    console.log(`📏 Taille: ${response.data.length} caractères`);
    return true;
    
  } catch (error) {
    console.log(`❌ Page d'accueil inaccessible: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Test de connexion à movie-locations.com\n');
  
  // Test 1: Page d'accueil
  const homepageOk = await testHomepage();
  
  if (!homepageOk) {
    console.log('\n❌ Le site semble inaccessible. Problème de réseau ou site en maintenance.');
    return;
  }
  
  // Test 2: Page spécifique
  const content = await testConnection();
  
  if (content) {
    console.log('\n🎉 Connexion réussie! Le site est accessible avec les bons headers.');
  } else {
    console.log('\n❌ Toutes les tentatives ont échoué. Le site bloque probablement les scrapers.');
    console.log('\n💡 Solutions alternatives:');
    console.log('1. Utiliser un proxy/VPN');
    console.log('2. Saisie manuelle des données');
    console.log('3. Utiliser une API alternative (TMDB + Google Places)');
  }
}

if (require.main === module) {
  runTests();
}
