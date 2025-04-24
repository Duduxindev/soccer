/**
 * Improved Team and League Selection System
 * This resolves issues with team and country selection
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize improved selection system when the tournament setup screen is shown
    document.getElementById('start-tournament').addEventListener('click', function() {
      // Short delay to ensure the screen is shown
      setTimeout(initImprovedSelectionSystem, 100);
    });
  });
  
  function initImprovedSelectionSystem() {
    console.log("Initializing improved selection system...");
    
    // Element references
    const leaguesGrid = document.getElementById('leagues-grid');
    const teamsGrid = document.getElementById('teams-grid');
    const countryFilter = document.getElementById('country-filter');
    const colorFilter = document.getElementById('color-filter');
    const teamSearch = document.getElementById('team-search');
    const startButton = document.getElementById('start-game');
    const leagueIndicator = document.getElementById('league-selection-indicator');
    const teamIndicator = document.getElementById('team-selection-indicator');
    
    // Clear any existing content
    leaguesGrid.innerHTML = '';
    teamsGrid.innerHTML = '';
    
    // Get all teams and leagues
    const teams = window.TeamsDatabase ? window.TeamsDatabase.getTeams() : generateDummyTeams();
    const leagues = generateLeagues();
    
    // Populate leagues
    populateLeagues(leagues, leaguesGrid, leagueIndicator);
    
    // Populate all teams initially
    populateTeams(teams, teamsGrid, teamIndicator);
    
    // Populate country filter
    populateCountryFilter(teams, countryFilter);
    
    // Populate color filter
    populateColorFilter(colorFilter);
    
    // Add event listeners
    countryFilter.addEventListener('change', function() {
      filterTeams();
    });
    
    colorFilter.addEventListener('change', function() {
      filterTeams();
    });
    
    teamSearch.addEventListener('input', function() {
      filterTeams();
    });
    
    // Filtering function
    function filterTeams() {
      const country = countryFilter.value;
      const color = colorFilter.value;
      const searchTerm = teamSearch.value.toLowerCase();
      
      Array.from(teamsGrid.children).forEach(teamItem => {
        const teamCountry = teamItem.dataset.country;
        const teamColor = teamItem.dataset.color;
        const teamName = teamItem.dataset.name.toLowerCase();
        
        const countryMatch = country === 'all' || teamCountry === country;
        const colorMatch = color === 'all' || teamColor === color;
        const searchMatch = searchTerm === '' || teamName.includes(searchTerm);
        
        if (countryMatch && colorMatch && searchMatch) {
          teamItem.style.display = 'flex';
        } else {
          teamItem.style.display = 'none';
        }
      });
    }
    
    // Update start button state based on selections
    function updateStartButtonState() {
      const hasLeagueSelected = document.querySelector('.league-item.selected');
      const hasTeamSelected = document.querySelector('.team-item.selected');
      
      if (hasLeagueSelected && hasTeamSelected) {
        startButton.disabled = false;
      } else {
        startButton.disabled = true;
      }
    }
    
    // Allow league selection
    function populateLeagues(leagues, container, indicator) {
      leagues.forEach((league, index) => {
        const leagueItem = document.createElement('div');
        leagueItem.className = 'league-item fadeIn';
        leagueItem.dataset.id = league.id;
        leagueItem.style.animationDelay = `${index * 0.05}s`;
        
        // League logo
        const leagueLogo = document.createElement('img');
        leagueLogo.src = league.logo || 'assets/images/placeholder-logo.png';
        leagueLogo.alt = league.name;
        leagueLogo.className = 'league-logo';
        
        // League name and country
        const leagueName = document.createElement('div');
        leagueName.className = 'league-name';
        leagueName.textContent = league.name;
        
        const leagueCountry = document.createElement('div');
        leagueCountry.className = 'league-country';
        leagueCountry.textContent = league.country;
        
        leagueItem.appendChild(leagueLogo);
        leagueItem.appendChild(leagueName);
        leagueItem.appendChild(leagueCountry);
        
        leagueItem.addEventListener('click', () => {
          // Deselect all leagues
          document.querySelectorAll('.league-item').forEach(item => {
            item.classList.remove('selected');
          });
          
          // Select this league
          leagueItem.classList.add('selected');
          
          // Update indicator
          indicator.textContent = league.name;
          indicator.style.display = 'inline-block';
          indicator.className = 'badge badge-success';
          
          // Update start button
          updateStartButtonState();
        });
        
        container.appendChild(leagueItem);
      });
    }
    
    // Allow team selection
    function populateTeams(teams, container, indicator) {
      teams.forEach((team, index) => {
        const teamItem = document.createElement('div');
        teamItem.className = 'team-item fadeIn';
        teamItem.dataset.id = team.id;
        teamItem.dataset.country = team.country;
        teamItem.dataset.color = getMainColorName(team.colors?.primary || '#FFFFFF');
        teamItem.dataset.name = team.name;
        teamItem.style.animationDelay = `${index * 0.02}s`;
        
        // Team badge container
        const badgeContainer = document.createElement('div');
        badgeContainer.className = 'team-badge-container';
        
        // Team logo
        const teamLogo = document.createElement('img');
        teamLogo.src = team.logo || 'assets/images/placeholder-logo.png';
        teamLogo.alt = team.name;
        teamLogo.className = 'team-logo';
        badgeContainer.appendChild(teamLogo);
        
        // Team name
        const teamName = document.createElement('div');
        teamName.className = 'team-name';
        teamName.textContent = team.name;
        
        // Team country
        const teamCountry = document.createElement('div');
        teamCountry.className = 'team-country';
        teamCountry.textContent = team.country;
        
        // Team strength
        const teamStrength = document.createElement('div');
        teamStrength.className = 'team-strength';
        
        const strengthValue = team.strength || Math.random() * 0.4 + 0.6; // Random between 0.6-1.0
        const starCount = Math.round(strengthValue * 5);
        
        for (let i = 0; i < 5; i++) {
          const star = document.createElement('i');
          star.className = i < starCount ? 'fas fa-star strength-star' : 'far fa-star strength-star';
          teamStrength.appendChild(star);
        }
        
        teamItem.appendChild(badgeContainer);
        teamItem.appendChild(teamName);
        teamItem.appendChild(teamCountry);
        teamItem.appendChild(teamStrength);
        
        teamItem.addEventListener('click', () => {
          // Deselect all teams
          document.querySelectorAll('.team-item').forEach(item => {
            item.classList.remove('selected');
          });
          
          // Select this team
          teamItem.classList.add('selected');
          
          // Store selected team in game state
          if (window.gameState) {
            window.gameState.player.team = team;
          }
          
          // Update indicator
          indicator.textContent = team.name;
          indicator.style.display = 'inline-block';
          indicator.className = 'badge badge-success';
          
          // Update start button
          updateStartButtonState();
        });
        
        container.appendChild(teamItem);
      });
    }
    
    // Populate country filter dropdown
    function populateCountryFilter(teams, selectElement) {
      // Get unique countries
      const countries = [...new Set(teams.map(team => team.country))].sort();
      
      // Clear existing options except "All Countries"
      while (selectElement.options.length > 1) {
        selectElement.remove(1);
      }
      
      // Add country options
      countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        selectElement.appendChild(option);
      });
    }
    
    // Populate color filter dropdown
    function populateColorFilter(selectElement) {
      const colors = [
        { name: 'Red', value: 'red' },
        { name: 'Blue', value: 'blue' },
        { name: 'Green', value: 'green' },
        { name: 'Yellow', value: 'yellow' },
        { name: 'Orange', value: 'orange' },
        { name: 'Purple', value: 'purple' },
        { name: 'White', value: 'white' },
        { name: 'Black', value: 'black' }
      ];
      
      // Clear existing options except "All Colors"
      while (selectElement.options.length > 1) {
        selectElement.remove(1);
      }
      
      // Add color options
      colors.forEach(color => {
        const option = document.createElement('option');
        option.value = color.value;
        option.textContent = color.name;
        selectElement.appendChild(option);
      });
    }
    
    // Generate dummy teams if TeamsDatabase is not available
    function generateDummyTeams() {
      const dummyTeams = [];
      const countries = ['England', 'Spain', 'Germany', 'Italy', 'France', 'Brazil', 'Argentina', 'USA', 'Japan'];
      const colors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FFA500', '#800080', '#FFFFFF', '#000000'];
      const animals = ['Lions', 'Tigers', 'Eagles', 'Bears', 'Wolves', 'Panthers', 'Dragons', 'Knights'];
      
      for (let i = 0; i < 32; i++) {
        dummyTeams.push({
          id: `team-${i}`,
          name: `${animals[i % animals.length]} FC`,
          country: countries[i % countries.length],
          colors: {
            primary: colors[i % colors.length],
            secondary: '#FFFFFF'
          },
          logo: 'assets/images/placeholder-logo.png',
          strength: 0.6 + Math.random() * 0.4
        });
      }
      
      return dummyTeams;
    }
    
    // Generate leagues
    function generateLeagues() {
      return [
        { id: 'league-1', name: 'Premier League', country: 'England', logo: 'assets/images/leagues/premier.png' },
        { id: 'league-2', name: 'La Liga', country: 'Spain', logo: 'assets/images/leagues/laliga.png' },
        { id: 'league-3', name: 'Bundesliga', country: 'Germany', logo: 'assets/images/leagues/bundesliga.png' },
        { id: 'league-4', name: 'Serie A', country: 'Italy', logo: 'assets/images/leagues/seriea.png' },
        { id: 'league-5', name: 'Ligue 1', country: 'France', logo: 'assets/images/leagues/ligue1.png' },
        { id: 'league-6', name: 'Champions League', country: 'Europe', logo: 'assets/images/leagues/champions.png' },
        { id: 'league-7', name: 'World Cup', country: 'International', logo: 'assets/images/leagues/worldcup.png' },
        { id: 'league-8', name: 'Copa América', country: 'South America', logo: 'assets/images/leagues/copa.png' },
        { id: 'league-9', name: 'MLS', country: 'USA', logo: 'assets/images/leagues/mls.png' },
        { id: 'league-10', name: 'J-League', country: 'Japan', logo: 'assets/images/leagues/jleague.png' },
        { id: 'league-11', name: 'Liga MX', country: 'Mexico', logo: 'assets/images/leagues/ligamx.png' },
        { id: 'league-12', name: 'Super League', country: 'China', logo: 'assets/images/leagues/superleague.png' }
      ];
    }
    
    // Get main color name from hex color
    function getMainColorName(hexColor) {
      // Simple color approximation
      const colorMap = {
        'red': ['#FF0000', '#FF5555', '#AA0000', '#FF3333'],
        'blue': ['#0000FF', '#5555FF', '#0000AA', '#3333FF'],
        'green': ['#00FF00', '#55FF55', '#00AA00', '#33FF33'],
        'yellow': ['#FFFF00', '#FFFF55', '#AAAA00', '#FFFF33'],
        'orange': ['#FFA500', '#FFAA55', '#AA5500', '#FFAA33'],
        'purple': ['#800080', '#AA55AA', '#550055', '#AA33AA'],
        'white': ['#FFFFFF', '#EEEEEE', '#DDDDDD', '#FAFAFA'],
        'black': ['#000000', '#333333', '#222222', '#111111']
      };
      
      // Normalize hex color
      hexColor = hexColor.toUpperCase();
      
      // Find the closest match
      for (const [colorName, variants] of Object.entries(colorMap)) {
        if (variants.includes(hexColor)) {
          return colorName;
        }
      }
      
      return 'other';
    }
  }