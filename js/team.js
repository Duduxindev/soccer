/**
 * Teams Database and Management for Penalty Shooters 2
 */

// Team database with sample teams
const TeamsDatabase = (function() {
    // Private team data
    const teams = [
        // Europe
        {
            id: 'team-001',
            name: 'Red Dragons',
            country: 'England',
            colors: {
                primary: '#FF0000',
                secondary: '#FFFFFF'
            },
            logo: 'assets/images/teams/red-dragons.png',
            strength: 0.9
        },
        {
            id: 'team-002',
            name: 'Blue Lions',
            country: 'France',
            colors: {
                primary: '#0000FF',
                secondary: '#FFFFFF'
            },
            logo: 'assets/images/teams/blue-lions.png',
            strength: 0.88
        },
        {
            id: 'team-003',
            name: 'Green Eagles',
            country: 'Germany',
            colors: {
                primary: '#008000',
                secondary: '#000000'
            },
            logo: 'assets/images/teams/green-eagles.png',
            strength: 0.92
        },
        {
            id: 'team-004',
            name: 'Yellow Hornets',
            country: 'Spain',
            colors: {
                primary: '#FFFF00',
                secondary: '#FF0000'
            },
            logo: 'assets/images/teams/yellow-hornets.png',
            strength: 0.91
        },
        {
            id: 'team-005',
            name: 'Blue Stars',
            country: 'Italy',
            colors: {
                primary: '#0000FF',
                secondary: '#FFFFFF'
            },
            logo: 'assets/images/teams/blue-stars.png',
            strength: 0.87
        },
        
        // South America
        {
            id: 'team-006',
            name: 'Green Canaries',
            country: 'Brazil',
            colors: {
                primary: '#008000',
                secondary: '#FFFF00'
            },
            logo: 'assets/images/teams/green-canaries.png',
            strength: 0.93
        },
        {
            id: 'team-007',
            name: 'White and Blue',
            country: 'Argentina',
            colors: {
                primary: '#FFFFFF',
                secondary: '#0000FF'
            },
            logo: 'assets/images/teams/white-and-blue.png',
            strength: 0.91
        },
        
        // North America
        {
            id: 'team-008',
            name: 'Red Wolves',
            country: 'USA',
            colors: {
                primary: '#FF0000',
                secondary: '#0000FF'
            },
            logo: 'assets/images/teams/red-wolves.png',
            strength: 0.85
        },
        
        // Asia
        {
            id: 'team-009',
            name: 'Red Samurai',
            country: 'Japan',
            colors: {
                primary: '#FF0000',
                secondary: '#FFFFFF'
            },
            logo: 'assets/images/teams/red-samurai.png',
            strength: 0.86
        },
        {
            id: 'team-010',
            name: 'Red Dragons FC',
            country: 'China',
            colors: {
                primary: '#FF0000',
                secondary: '#FFFF00'
            },
            logo: 'assets/images/teams/red-dragons-fc.png',
            strength: 0.84
        },
        
        // Africa
        {
            id: 'team-011',
            name: 'Green Lions',
            country: 'Nigeria',
            colors: {
                primary: '#008000',
                secondary: '#FFFFFF'
            },
            logo: 'assets/images/teams/green-lions.png',
            strength: 0.85
        },
        {
            id: 'team-012',
            name: 'Orange Eagles',
            country: 'Egypt',
            colors: {
                primary: '#FFA500',
                secondary: '#000000'
            },
            logo: 'assets/images/teams/orange-eagles.png',
            strength: 0.84
        }
    ];
    
    // Generate additional teams to have enough for the tournament
    for (let i = 0; i < 20; i++) {
        const colors = ['#FF0000', '#0000FF', '#008000', '#FFFF00', '#FFA500', '#800080'];
        const secondaryColors = ['#FFFFFF', '#000000', '#888888'];
        const animals = ['Bears', 'Wolves', 'Foxes', 'Sharks', 'Tigers', 'Panthers'];
        const countries = ['Netherlands', 'Portugal', 'Belgium', 'Switzerland', 'Sweden', 'Denmark', 'Uruguay', 'Colombia', 'Mexico', 'Australia'];
        
        teams.push({
            id: `team-${13 + i}`,
            name: `${animals[i % animals.length]} FC`,
            country: countries[i % countries.length],
            colors: {
                primary: colors[i % colors.length],
                secondary: secondaryColors[i % secondaryColors.length]
            },
            logo: `assets/images/teams/generic-team-${(i % 5) + 1}.png`,
            strength: 0.7 + Math.random() * 0.2
        });
    }
    
    // Public methods
    return {
        getTeams: function() {
            return teams;
        },
        
        getTeamById: function(id) {
            return teams.find(team => team.id === id) || null;
        },
        
        getTeamsByCountry: function(country) {
            return country === 'all' ? teams : teams.filter(team => team.country === country);
        },
        
        getTeamsByColor: function(colorName) {
            if (colorName === 'all') return teams;
            
            // Simple color matching - could be improved with color distance algorithms
            return teams.filter(team => {
                const primaryColor = team.colors.primary.toLowerCase();
                return primaryColor.includes(colorName.toLowerCase());
            });
        },
        
        getAvailableCountries: function() {
            const countries = new Set();
            teams.forEach(team => countries.add(team.country));
            return [...countries].sort();
        },
        
        getAvailableColors: function() {
            return ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'White', 'Black'];
        }
    };
})();

// Team customization manager
const TeamCustomizer = (function() {
    // Private variables
    let customizedTeams = {};
    
    // Public methods
    return {
        customizeTeam: function(teamId, customizations) {
            const team = TeamsDatabase.getTeamById(teamId);
            if (!team) return false;
            
            // Create a copy of the team
            const customTeam = JSON.parse(JSON.stringify(team));
            
            // Apply customizations
            if (customizations.name) customTeam.name = customizations.name;
            if (customizations.colors && customizations.colors.primary) customTeam.colors.primary = customizations.colors.primary;
            if (customizations.colors && customizations.colors.secondary) customTeam.colors.secondary = customizations.colors.secondary;
            if (customizations.logo) customTeam.logo = customizations.logo;
            
            // Save the customized team
            customizedTeams[teamId] = customTeam;
            
            return customTeam;
        },
        
        getCustomizedTeam: function(teamId) {
            return customizedTeams[teamId] || TeamsDatabase.getTeamById(teamId);
        },
        
        resetTeam: function(teamId) {
            if (customizedTeams[teamId]) {
                delete customizedTeams[teamId];
                return true;
            }
            return false;
        }
    };
})();