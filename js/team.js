/**
 * Penalty Shooters 2 - Teams & Leagues Management
 */

// Generate 12 fictional leagues
function generateLeagues() {
    return [
        { name: 'Premier League', country: 'England', color: '#3D195B' },
        { name: 'La Liga', country: 'Spain', color: '#FF7E00' },
        { name: 'Bundesliga', country: 'Germany', color: '#D20515' },
        { name: 'Serie A', country: 'Italy', color: '#008FD7' },
        { name: 'Ligue 1', country: 'France', color: '#091C3E' },
        { name: 'Eredivisie', country: 'Netherlands', color: '#FF6600' },
        { name: 'Primeira Liga', country: 'Portugal', color: '#00923F' },
        { name: 'Super League', country: 'Turkey', color: '#E30613' },
        { name: 'Pro League', country: 'Belgium', color: '#000000' },
        { name: 'Super League', country: 'Switzerland', color: '#CF0000' },
        { name: 'Premier League', country: 'Scotland', color: '#0066B3' },
        { name: 'Eliteserien', country: 'Norway', color: '#003399' }
    ];
}

// Generate 30 teams per league (total 360 teams)
function generateTeamsForLeague(league) {
    const teams = [];
    const citiesCount = 30;
    
    // Generate city names based on the league's country
    const cities = generateCitiesForCountry(league.country, citiesCount);
    
    // Create a team for each city
    cities.forEach(city => {
        const teamName = generateTeamName(city, league.country);
        const teamColors = generateTeamColors();
        
        teams.push({
            name: teamName,
            city: city,
            country: league.country,
            league: league.name,
            primaryColor: teamColors.primary,
            secondaryColor: teamColors.secondary,
            logo: generateLogoPath(teamName) // This would link to actual logo files in production
        });
    });
    
    return teams;
}

function generateCitiesForCountry(country, count) {
    // This would be replaced with actual city lists for each country
    // For now, generate fictional city names
    const citySuffixes = ['town', 'city', 'burg', 'ville', 'haven', 'port', 'field', 'wood', 'ford', 'bridge'];
    const cityPrefixes = ['north', 'south', 'east', 'west', 'new', 'old', 'upper', 'lower', 'great', 'little'];
    const rootNames = ['brook', 'river', 'lake', 'hill', 'mount', 'vale', 'dale', 'green', 'red', 'blue', 
                       'black', 'white', 'gold', 'silver', 'iron', 'stone', 'rock', 'oak', 'elm', 'pine'];
    
    const cities = [];
    
    // Generate unique city names
    while (cities.length < count) {
        let cityName;
        
        // 33% chance of prefix + root + suffix
        // 33% chance of root + suffix
        // 33% chance of prefix + root
        const nameType = Math.floor(Math.random() * 3);
        
        switch (nameType) {
            case 0:
                cityName = capitalize(getRandomElement(cityPrefixes)) + ' ' + 
                          capitalize(getRandomElement(rootNames)) + 
                          getRandomElement(citySuffixes);
                break;
            case 1:
                cityName = capitalize(getRandomElement(rootNames)) + 
                          getRandomElement(citySuffixes);
                break;
            case 2:
                cityName = capitalize(getRandomElement(cityPrefixes)) + ' ' + 
                          capitalize(getRandomElement(rootNames));
                break;
        }
        
        // Ensure uniqueness
        if (!cities.includes(cityName)) {
            cities.push(cityName);
        }
    }
    
    return cities;
}

function generateTeamName(city, country) {
    // Different naming patterns based on country
    switch (country) {
        case 'England':
            return `${city} FC`;
        case 'Spain':
            return `${city} CF`;
        case 'Germany':
            return `${city} SV`;
        case 'Italy':
            return `${city} AC`;
        case 'France':
            return `${city} AS`;
        default:
            return `${city} FC`;
    }
}

function generateTeamColors() {
    const colors = [
        '#FF0000', // Red
        '#0000FF', // Blue
        '#008000', // Green
        '#FFFF00', // Yellow
        '#FFA500', // Orange
        '#800080', // Purple
        '#000000', // Black
        '#FFFFFF', // White
        '#00FFFF', // Cyan
        '#FF00FF', // Magenta
        '#A52A2A', // Brown
        '#808080', // Gray
        '#FFD700', // Gold
        '#C0C0C0', // Silver
        '#800000', // Maroon
        '#008080'  // Teal
    ];
    
    // Select two different colors
    const primary = getRandomElement(colors);
    let secondary;
    
    do {
        secondary = getRandomElement(colors);
    } while (secondary === primary);
    
    return {
        primary: primary,
        secondary: secondary
    };
}

function generateLogoPath(teamName) {
    // In a real app, this would link to actual logo files
    // For now, just return a placeholder
    return 'assets/images/team-logo-placeholder.png';
}

// Generate all teams for all leagues
function generateTeams() {
    const leagues = generateLeagues();
    let allTeams = [];
    
    leagues.forEach(league => {
        const leagueTeams = generateTeamsForLeague(league);
        allTeams = [...allTeams, ...leagueTeams];
    });
    
    return allTeams;
}

// Utility functions
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}