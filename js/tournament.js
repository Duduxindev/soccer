/**
 * Tournament System for Penalty Shooters 2
 * Handles league setup, team groups, and knockout stages
 */

// Tournament data structure
class Tournament {
    constructor(league, playerTeam) {
        this.league = league;
        this.playerTeam = playerTeam;
        this.teams = [];
        this.groups = [];
        this.knockout = {
            roundOf16: [],
            quarterFinals: [],
            semiFinals: [],
            final: []
        };
        this.currentStage = 'group'; // 'group', 'round16', 'quarter', 'semi', 'final'
        this.currentMatchIndex = 0;
        this.winner = null;
    }
    
    // Initialize tournament with teams
    initialize() {
        // Generate teams for the tournament (32 teams for a full tournament)
        this.teams = this.generateTeams();
        
        // Make sure player's team is included
        let playerTeamIncluded = false;
        for (let i = 0; i < this.teams.length; i++) {
            if (this.teams[i].id === this.playerTeam.id) {
                playerTeamIncluded = true;
                break;
            }
        }
        
        if (!playerTeamIncluded) {
            // Replace a random team with the player's team
            const randomIndex = Math.floor(Math.random() * this.teams.length);
            this.teams[randomIndex] = this.playerTeam;
        }
        
        // Create groups (8 groups of 4 teams)
        this.createGroups();
    }
    
    // Generate teams for the tournament
    generateTeams() {
        // In a real implementation, we would select teams from the complete team database
        // For now, we'll use a simplified implementation with 32 teams
        const teams = [];
        const allTeams = TeamsDatabase.getTeams();
        
        // Randomly select 31 teams (plus player's team makes 32)
        const shuffledTeams = [...allTeams].sort(() => Math.random() - 0.5);
        
        // Take 31 teams (or fewer if database has fewer teams)
        const teamsNeeded = Math.min(31, shuffledTeams.length);
        for (let i = 0; i < teamsNeeded; i++) {
            teams.push(shuffledTeams[i]);
        }
        
        // If we don't have enough teams, generate some placeholder teams
        while (teams.length < 31) {
            teams.push(this.generatePlaceholderTeam(teams.length));
        }
        
        return teams;
    }
    
    // Generate a placeholder team
    generatePlaceholderTeam(index) {
        const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'White', 'Black'];
        const animals = ['Lions', 'Tigers', 'Eagles', 'Bears', 'Wolves', 'Panthers', 'Dragons', 'Knights'];
        
        const colorIndex = index % colors.length;
        const animalIndex = Math.floor(index / colors.length) % animals.length;
        
        return {
            id: `placeholder-${index}`,
            name: `${colors[colorIndex]} ${animals[animalIndex]}`,
            country: 'International',
            colors: {
                primary: this.getColorCode(colors[colorIndex]),
                secondary: '#FFFFFF'
            },
            logo: 'assets/images/placeholder-logo.png',
            strength: Math.random() * 0.4 + 0.6 // Random strength between 0.6 and 1.0
        };
    }
    
    // Get a color code from a color name
    getColorCode(colorName) {
        const colorMap = {
            'Red': '#FF0000',
            'Blue': '#0000FF',
            'Green': '#00FF00',
            'Yellow': '#FFFF00',
            'Purple': '#800080',
            'Orange': '#FFA500',
            'White': '#FFFFFF',
            'Black': '#000000'
        };
        
        return colorMap[colorName] || '#888888';
    }
    
    // Create tournament groups
    createGroups() {
        // Shuffle teams
        const shuffledTeams = [...this.teams].sort(() => Math.random() - 0.5);
        
        // Create 8 groups with 4 teams each
        this.groups = [];
        for (let i = 0; i < 8; i++) {
            this.groups.push({
                name: String.fromCharCode(65 + i), // Group A, B, C, etc.
                teams: shuffledTeams.slice(i * 4, (i + 1) * 4),
                matches: [],
                standings: []
            });
        }
        
        // Generate matches for each group
        this.generateGroupMatches();
    }
    
    // Generate all matches for the group stage
    generateGroupMatches() {
        this.groups.forEach(group => {
            // Round-robin tournament: each team plays against every other team once
            for (let i = 0; i < group.teams.length; i++) {
                for (let j = i + 1; j < group.teams.length; j++) {
                    group.matches.push({
                        team1: group.teams[i],
                        team2: group.teams[j],
                        score1: null,
                        score2: null,
                        played: false
                    });
                }
            }
            
            // Initialize standings
            group.teams.forEach(team => {
                group.standings.push({
                    team: team,
                    played: 0,
                    won: 0,
                    drawn: 0,
                    lost: 0,
                    goalsFor: 0,
                    goalsAgainst: 0,
                    points: 0
                });
            });
        });
    }
    
    // Update standings after a match
    updateStandings(groupIndex, match) {
        const group = this.groups[groupIndex];
        
        // Find team1 and team2 in the standings
        const standing1 = group.standings.find(s => s.team.id === match.team1.id);
        const standing2 = group.standings.find(s => s.team.id === match.team2.id);
        
        // Update played games
        standing1.played += 1;
        standing2.played += 1;
        
        // Update goals
        standing1.goalsFor += match.score1;
        standing1.goalsAgainst += match.score2;
        standing2.goalsFor += match.score2;
        standing2.goalsAgainst += match.score1;
        
        // Update wins, draws, losses and points
        if (match.score1 > match.score2) {
            // Team 1 won
            standing1.won += 1;
            standing2.lost += 1;
            standing1.points += 3;
        } else if (match.score1 < match.score2) {
            // Team 2 won
            standing2.won += 1;
            standing1.lost += 1;
            standing2.points += 3;
        } else {
            // Draw
            standing1.drawn += 1;
            standing2.drawn += 1;
            standing1.points += 1;
            standing2.points += 1;
        }
        
        // Sort standings
        group.standings.sort((a, b) => {
            // Sort by points
            if (a.points !== b.points) {
                return b.points - a.points;
            }
            // If points are equal, sort by goal difference
            const aDiff = a.goalsFor - a.goalsAgainst;
            const bDiff = b.goalsFor - b.goalsAgainst;
            if (aDiff !== bDiff) {
                return bDiff - aDiff;
            }
            // If goal difference is equal, sort by goals scored
            if (a.goalsFor !== b.goalsFor) {
                return b.goalsFor - a.goalsFor;
            }
            // If everything is equal, maintain original order
            return 0;
        });
    }
    
    // Check if group stage is complete
    isGroupStageComplete() {
        for (const group of this.groups) {
            for (const match of group.matches) {
                if (!match.played) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // Advance to knockout stage
    advanceToKnockout() {
        if (!this.isGroupStageComplete()) {
            console.error("Cannot advance to knockout: group stage not complete");
            return false;
        }
        
        // Get top 2 teams from each group
        const qualifiedTeams = [];
        this.groups.forEach(group => {
            qualifiedTeams.push(group.standings[0].team);
            qualifiedTeams.push(group.standings[1].team);
        });
        
        // Set up round of 16
        // Group winners play against runners-up from other groups
        this.knockout.roundOf16 = [
            { team1: this.groups[0].standings[0].team, team2: this.groups[1].standings[1].team, score1: null, score2: null, played: false },
            { team1: this.groups[2].standings[0].team, team2: this.groups[3].standings[1].team, score1: null, score2: null, played: false },
            { team1: this.groups[4].standings[0].team, team2: this.groups[5].standings[1].team, score1: null, score2: null, played: false },
            { team1: this.groups[6].standings[0].team, team2: this.groups[7].standings[1].team, score1: null, score2: null, played: false },
            { team1: this.groups[1].standings[0].team, team2: this.groups[0].standings[1].team, score1: null, score2: null, played: false },
            { team1: this.groups[3].standings[0].team, team2: this.groups[2].standings[1].team, score1: null, score2: null, played: false },
            { team1: this.groups[5].standings[0].team, team2: this.groups[4].standings[1].team, score1: null, score2: null, played: false },
            { team1: this.groups[7].standings[0].team, team2: this.groups[6].standings[1].team, score1: null, score2: null, played: false }
        ];
        
        this.currentStage = 'round16';
        this.currentMatchIndex = 0;
        return true;
    }
    
    // Advance to quarter finals
    advanceToQuarterFinals() {
        if (this.currentStage !== 'round16' || !this.areAllMatchesPlayed(this.knockout.roundOf16)) {
            console.error("Cannot advance to quarter finals: round of 16 not complete");
            return false;
        }
        
        // Get winners from round of 16
        this.knockout.quarterFinals = [
            { 
                team1: this.getWinner(this.knockout.roundOf16[0]), 
                team2: this.getWinner(this.knockout.roundOf16[1]),
                score1: null, score2: null, played: false 
            },
            { 
                team1: this.getWinner(this.knockout.roundOf16[2]), 
                team2: this.getWinner(this.knockout.roundOf16[3]),
                score1: null, score2: null, played: false 
            },
            { 
                team1: this.getWinner(this.knockout.roundOf16[4]), 
                team2: this.getWinner(this.knockout.roundOf16[5]),
                score1: null, score2: null, played: false 
            },
            { 
                team1: this.getWinner(this.knockout.roundOf16[6]), 
                team2: this.getWinner(this.knockout.roundOf16[7]),
                score1: null, score2: null, played: false 
            }
        ];
        
        this.currentStage = 'quarter';
        this.currentMatchIndex = 0;
        return true;
    }
    
    // Advance to semi finals
    advanceToSemiFinals() {
        if (this.currentStage !== 'quarter' || !this.areAllMatchesPlayed(this.knockout.quarterFinals)) {
            console.error("Cannot advance to semi finals: quarter finals not complete");
            return false;
        }
        
        // Get winners from quarter finals
        this.knockout.semiFinals = [
            { 
                team1: this.getWinner(this.knockout.quarterFinals[0]), 
                team2: this.getWinner(this.knockout.quarterFinals[1]),
                score1: null, score2: null, played: false 
            },
            { 
                team1: this.getWinner(this.knockout.quarterFinals[2]), 
                team2: this.getWinner(this.knockout.quarterFinals[3]),
                score1: null, score2: null, played: false 
            }
        ];
        
        this.currentStage = 'semi';
        this.currentMatchIndex = 0;
        return true;
    }
    
    // Advance to final
    advanceToFinal() {
        if (this.currentStage !== 'semi' || !this.areAllMatchesPlayed(this.knockout.semiFinals)) {
            console.error("Cannot advance to final: semi finals not complete");
            return false;
        }
        
        // Get winners from semi finals
        this.knockout.final = [
            { 
                team1: this.getWinner(this.knockout.semiFinals[0]), 
                team2: this.getWinner(this.knockout.semiFinals[1]),
                score1: null, score2: null, played: false 
            }
        ];
        
        this.currentStage = 'final';
        this.currentMatchIndex = 0;
        return true;
    }
    
    // Complete tournament
    completeTournament() {
        if (this.currentStage !== 'final' || !this.areAllMatchesPlayed(this.knockout.final)) {
            console.error("Cannot complete tournament: final not played");
            return false;
        }
        
        this.winner = this.getWinner(this.knockout.final[0]);
        return true;
    }
    
    // Check if all matches in a round are played
    areAllMatchesPlayed(matches) {
        return matches.every(match => match.played);
    }
    
    // Get winner of a match
    getWinner(match) {
        if (!match.played) {
            return null;
        }
        
        if (match.score1 > match.score2) {
            return match.team1;
        } else if (match.score2 > match.score1) {
            return match.team2;
        }
        
        // In case of a tie, we'll pick a winner randomly
        // In a real match, this would be decided by extra time penalties
        return Math.random() < 0.5 ? match.team1 : match.team2;
    }
    
    // Get the next match to be played
    getNextMatch() {
        let match = null;
        
        switch (this.currentStage) {
            case 'group':
                // Find the next unplayed match in the current group
                for (let groupIndex = 0; groupIndex < this.groups.length; groupIndex++) {
                    const group = this.groups[groupIndex];
                    for (let matchIndex = 0; matchIndex < group.matches.length; matchIndex++) {
                        if (!group.matches[matchIndex].played) {
                            match = {
                                ...group.matches[matchIndex],
                                groupIndex,
                                matchIndex
                            };
                            return match;
                        }
                    }
                }
                break;
                
            case 'round16':
                if (this.currentMatchIndex < this.knockout.roundOf16.length) {
                    match = this.knockout.roundOf16[this.currentMatchIndex];
                }
                break;
                
            case 'quarter':
                if (this.currentMatchIndex < this.knockout.quarterFinals.length) {
                    match = this.knockout.quarterFinals[this.currentMatchIndex];
                }
                break;
                
            case 'semi':
                if (this.currentMatchIndex < this.knockout.semiFinals.length) {
                    match = this.knockout.semiFinals[this.currentMatchIndex];
                }
                break;
                
            case 'final':
                if (this.currentMatchIndex < this.knockout.final.length) {
                    match = this.knockout.final[this.currentMatchIndex];
                }
                break;
        }
        
        return match;
    }
    
    // Record the result of a match
    recordMatchResult(match, score1, score2) {
        if (match.played) {
            console.error("Match already played");
            return false;
        }
        
        match.score1 = score1;
        match.score2 = score2;
        match.played = true;
        
        // If it's a group match, update the standings
        if (this.currentStage === 'group' && match.groupIndex !== undefined) {
            this.updateStandings(match.groupIndex, match);
        }
        
        // Increment match index for knockout stages
        if (this.currentStage !== 'group') {
            this.currentMatchIndex++;
        }
        
        // Check if current stage is complete
        if (this.isCurrentStageComplete()) {
            this.advanceToNextStage();
        }
        
        return true;
    }
    
    // Check if current stage is complete
    isCurrentStageComplete() {
        switch (this.currentStage) {
            case 'group':
                return this.isGroupStageComplete();
                
            case 'round16':
                return this.areAllMatchesPlayed(this.knockout.roundOf16);
                
            case 'quarter':
                return this.areAllMatchesPlayed(this.knockout.quarterFinals);
                
            case 'semi':
                return this.areAllMatchesPlayed(this.knockout.semiFinals);
                
            case 'final':
                return this.areAllMatchesPlayed(this.knockout.final);
                
            default:
                return false;
        }
    }
    
    // Advance to the next stage
    advanceToNextStage() {
        switch (this.currentStage) {
            case 'group':
                this.advanceToKnockout();
                break;
                
            case 'round16':
                this.advanceToQuarterFinals();
                break;
                
            case 'quarter':
                this.advanceToSemiFinals();
                break;
                
            case 'semi':
                this.advanceToFinal();
                break;
                
            case 'final':
                this.completeTournament();
                break;
        }
    }
    
    // Get a string representation of the current stage
    getCurrentStageDisplay() {
        switch (this.currentStage) {
            case 'group': return 'Group Stage';
            case 'round16': return 'Round of 16';
            case 'quarter': return 'Quarter Finals';
            case 'semi': return 'Semi Finals';
            case 'final': return 'Final';
            default: return 'Tournament';
        }
    }
    
    // Get a team's progress in the tournament
    getTeamProgress(teamId) {
        // Check if the team is in the groups
        for (const group of this.groups) {
            const standing = group.standings.find(s => s.team.id === teamId);
            if (standing) {
                // Check team's position
                const position = group.standings.findIndex(s => s.team.id === teamId) + 1;
                if (position > 2) {
                    return 'Eliminated in Group Stage';
                }
            }
        }
        
        // Check knock-out stages
        // Check if eliminated in Round of 16
        for (const match of this.knockout.roundOf16) {
            if (match.played) {
                if ((match.team1.id === teamId && match.score1 < match.score2) ||
                    (match.team2.id === teamId && match.score2 < match.score1)) {
                    return 'Eliminated in Round of 16';
                }
            }
        }
        
        // Check if eliminated in Quarter Finals
        for (const match of this.knockout.quarterFinals) {
            if (match.played) {
                if ((match.team1.id === teamId && match.score1 < match.score2) ||
                    (match.team2.id === teamId && match.score2 < match.score1)) {
                    return 'Eliminated in Quarter Finals';
                }
            }
        }
        
        // Check if eliminated in Semi Finals
        for (const match of this.knockout.semiFinals) {
            if (match.played) {
                if ((match.team1.id === teamId && match.score1 < match.score2) ||
                    (match.team2.id === teamId && match.score2 < match.score1)) {
                    return 'Eliminated in Semi Finals';
                }
            }
        }
        
        // Check if lost in Final
        if (this.knockout.final.length > 0 && this.knockout.final[0].played) {
            const finalMatch = this.knockout.final[0];
            if ((finalMatch.team1.id === teamId && finalMatch.score1 < finalMatch.score2) ||
                (finalMatch.team2.id === teamId && finalMatch.score2 < finalMatch.score1)) {
                return 'Runner-up';
            }
        }
        
        // If team is the winner
        if (this.winner && this.winner.id === teamId) {
            return 'Tournament Winner';
        }
        
        // If team is still in the tournament
        return 'Still in Tournament';
    }
    
    // Check if a team is the player's team
    isPlayerTeam(team) {
        return team.id === this.playerTeam.id;
    }
    
    // Simulate match results for AI vs AI matches
    simulateMatch(match) {
        // Calculate team strengths
        const team1Strength = match.team1.strength || 0.8;
        const team2Strength = match.team2.strength || 0.8;
        
        // Adjust score probability based on team strength
        const team1ScoreProbability = team1Strength / (team1Strength + team2Strength);
        
        // Generate random scores (between 0-5 for penalties)
        let score1 = 0;
        let score2 = 0;
        
        // Generate 5 penalties for each team
        for (let i = 0; i < 5; i++) {
            // Team 1 penalty
            if (Math.random() < team1ScoreProbability * 0.8 + 0.1) {
                score1++;
            }
            
            // Team 2 penalty
            if (Math.random() < (1 - team1ScoreProbability) * 0.8 + 0.1) {
                score2++;
            }
        }
        
        // If scores are tied, add sudden death penalties until there's a winner
        if (score1 === score2) {
            while (score1 === score2) {
                // One more round of penalties
                if (Math.random() < team1ScoreProbability * 0.8 + 0.1) {
                    score1++;
                }
                
                if (Math.random() < (1 - team1ScoreProbability) * 0.8 + 0.1) {
                    score2++;
                }
            }
        }
        
        return { score1, score2 };
    }
}