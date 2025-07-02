const axios = require('axios');
const cheerio = require('cheerio');

class LetterboxdScraper {
  constructor() {
    this.baseUrl = 'https://letterboxd.com';
  }

  async getWatchedFilms(username, page = 1) {
    try {
      const url = `${this.baseUrl}/${username}/films/page/${page}/`;
      console.log(`Scraping: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const films = [];

      // Scraper les films de la page
      $('.poster-container').each((i, element) => {
        const $film = $(element);
        const filmSlug = $film.find('div[data-film-slug]').attr('data-film-slug');
        const posterImg = $film.find('img');
        const title = posterImg.attr('alt');
        const year = $film.find('.metadata').text().trim();

        if (filmSlug && title) {
          films.push({
            title: title,
            year: year,
            slug: filmSlug,
            letterboxdUrl: `${this.baseUrl}/film/${filmSlug}/`
          });
        }
      });

      // Vérifier s'il y a d'autres pages
      const hasNextPage = $('.paginate-nextprev .next').length > 0;

      return {
        films,
        hasNextPage,
        currentPage: page
      };

    } catch (error) {
      console.error(`Erreur lors du scraping de ${username}:`, error.message);
      return { films: [], hasNextPage: false, currentPage: page };
    }
  }

  async getAllWatchedFilms(username, maxPages = 10) {
    console.log(`🎬 Récupération des films de ${username}...`);
    
    let allFilms = [];
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage && currentPage <= maxPages) {
      const result = await this.getWatchedFilms(username, currentPage);
      
      allFilms = allFilms.concat(result.films);
      hasNextPage = result.hasNextPage;
      currentPage++;

      console.log(`Page ${result.currentPage}: ${result.films.length} films trouvés`);
      
      // Pause pour éviter de surcharger le serveur
      await this.sleep(1000);
    }

    console.log(`✅ Total: ${allFilms.length} films récupérés pour ${username}`);
    return allFilms;
  }

  async getMultipleUsersFilms(usernames, maxPages = 5) {
    console.log(`🎯 Récupération des films pour ${usernames.length} utilisateurs...`);
    
    const allUsersFilms = {};
    
    for (const username of usernames) {
      const films = await this.getAllWatchedFilms(username, maxPages);
      allUsersFilms[username] = films;
      
      // Pause entre les utilisateurs
      await this.sleep(2000);
    }

    // Trouver les films communs
    const commonFilms = this.findCommonFilms(allUsersFilms);
    
    return {
      userFilms: allUsersFilms,
      commonFilms: commonFilms,
      stats: this.generateStats(allUsersFilms)
    };
  }

  findCommonFilms(allUsersFilms) {
    const usernames = Object.keys(allUsersFilms);
    if (usernames.length === 0) return [];

    // Commencer avec les films du premier utilisateur
    let commonFilms = allUsersFilms[usernames[0]];

    // Filtrer pour ne garder que les films vus par TOUS
    for (let i = 1; i < usernames.length; i++) {
      const currentUserFilms = allUsersFilms[usernames[i]];
      const currentUserSlugs = currentUserFilms.map(f => f.slug);
      
      commonFilms = commonFilms.filter(film => 
        currentUserSlugs.includes(film.slug)
      );
    }

    console.log(`🎯 Films vus par tous: ${commonFilms.length}`);
    return commonFilms;
  }

  generateStats(allUsersFilms) {
    const usernames = Object.keys(allUsersFilms);
    const stats = {
      totalUsers: usernames.length,
      filmCounts: {},
      totalUniqueFilms: 0
    };

    // Compter les films par utilisateur
    usernames.forEach(username => {
      stats.filmCounts[username] = allUsersFilms[username].length;
    });

    // Compter les films uniques
    const allSlugs = new Set();
    usernames.forEach(username => {
      allUsersFilms[username].forEach(film => {
        allSlugs.add(film.slug);
      });
    });
    stats.totalUniqueFilms = allSlugs.size;

    return stats;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Test du scraper
async function testScraper() {
  const scraper = new LetterboxdScraper();
  
  // Test avec tes amis
  const usernames = ['Potatoze', 'diegobrando7'];
  
  try {
    const result = await scraper.getMultipleUsersFilms(usernames, 3); // 3 pages max pour le test
    
    console.log('\n📊 STATISTIQUES:');
    console.log(`Utilisateurs: ${result.stats.totalUsers}`);
    Object.entries(result.stats.filmCounts).forEach(([user, count]) => {
      console.log(`  ${user}: ${count} films`);
    });
    console.log(`Films uniques total: ${result.stats.totalUniqueFilms}`);
    console.log(`Films communs: ${result.commonFilms.length}`);
    
    // Afficher quelques films communs
    if (result.commonFilms.length > 0) {
      console.log('\n🎬 EXEMPLES DE FILMS COMMUNS:');
      result.commonFilms.slice(0, 5).forEach(film => {
        console.log(`  - ${film.title} (${film.year})`);
      });
    }

    return result;
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exporter pour utilisation dans d'autres fichiers
module.exports = LetterboxdScraper;

// Si le fichier est exécuté directement
if (require.main === module) {
  testScraper();
}