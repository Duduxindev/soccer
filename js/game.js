/**
 * Penalty Shooters 2 - Main Game Logic
 */

// Global game state
const gameState = {
    isLoading: true,
    currentScreen: 'loading',
    tournament: null,
    currentMatch: null,
    player: {
        team: null,
        score: 0
    },
    opponent: {
        team: null,
        score: 0
    },
    penaltyPhase: 'shoot', // 'shoot' or 'save'
    penaltiesLeft: {
        player: 5,
        opponent: 5
    },
    currentPenalty: {
        power: 0,
        direction: 0,
        height: 0,
        isCharging: false
    },
    animationInProgress: false,
    gameSettings: {
        sound: true,
        music: true,
        difficulty: 'normal',
        tutorialShown: false
    },
    statistics: {
        shots: 0,
        goals: 0,
        saves: 0,
        perfectShots: 0,
        diveLength: 0
    },
    canvas: null,
    ctx: null,
    assets: {
        images: {},
        audio: {},
        loaded: 0,
        total: 0
    }
};

// Game initialization
window.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});

function initializeGame() {
    console.log("Initializing Penalty Shooters 2...");
    
    // Set up canvas
    gameState.canvas = document.getElementById('game-canvas');
    gameState.ctx = gameState.canvas.getContext('2d');
    
    // Ensure canvas is full screen
    resizeCanvas();
    
    // Load game assets
    loadAssets();
    
    // Set up event listeners
    setupEventListeners();
}

function resizeCanvas() {
    gameState.canvas.width = window.innerWidth;
    gameState.canvas.height = window.innerHeight;
}

function loadAssets() {
    // Define assets to load
    const assetsToLoad = {
        images: {
            'stadium': 'assets/images/stadium.jpg',
            'goal': 'assets/images/goal.png',
            'ball': 'assets/images/ball.png',
            'goalkeeper': 'assets/images/goalkeeper.png',
            'crowd': 'assets/images/crowd.png',
            'trophy': 'assets/images/trophy.png',
            'tutorial-shooting': 'assets/images/tutorial-shooting.png',
            'tutorial-saving': 'assets/images/tutorial-saving.png'
        },
        audio: {
            'whistle': 'assets/audio/whistle.mp3',
            'crowd-cheer': 'assets/audio/crowd-cheer.mp3',
            'ball-kick': 'assets/audio/ball-kick.mp3',
            'goal': 'assets/audio/goal.mp3',
            'save': 'assets/audio/save.mp3',
            'miss': 'assets/audio/miss.mp3',
            'menu-music': 'assets/audio/menu-music.mp3',
            'match-music': 'assets/audio/match-music.mp3',
            'victory-music': 'assets/audio/victory-music.mp3'
        }
    };
    
    // Count total assets for loading progress
    gameState.assets.total = Object.keys(assetsToLoad.images).length + Object.keys(assetsToLoad.audio).length;
    
    // Load images
    Object.entries(assetsToLoad.images).forEach(([key, src]) => {
        const img = new Image();
        img.src = src;
        img.onload = () => assetLoaded(key, img, 'images');
        img.onerror = () => console.error(`Failed to load image: ${src}`);
    });
    
    // Load audio
    Object.entries(assetsToLoad.audio).forEach(([key, src]) => {
        const audio = new Audio();
        audio.src = src;
        audio.addEventListener('canplaythrough', () => assetLoaded(key, audio, 'audio'));
        audio.addEventListener('error', () => console.error(`Failed to load audio: ${src}`));
    });

    // Simulate loading for development (remove in production)
    simulateLoading();
}

function simulateLoading() {
    const loadingBar = document.getElementById('loading-bar');
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        loadingBar.style.width = `${progress}%`;
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                completeLoading();
            }, 500);
        }
    }, 100);
}

function assetLoaded(key, asset, type) {
    gameState.assets[type][key] = asset;
    gameState.assets.loaded++;
    
    // Update loading progress
    const loadingBar = document.getElementById('loading-bar');
    const progress = Math.floor((gameState.assets.loaded / gameState.assets.total) * 100);
    loadingBar.style.width = `${progress}%`;
    
    // Check if all assets are loaded
    if (gameState.assets.loaded === gameState.assets.total) {
        completeLoading();
    }
}

function completeLoading() {
    console.log("All assets loaded!");
    
    // Transition to main menu
    switchScreen('loading', 'main-menu');
    
    // Initialize game loop
    requestAnimationFrame(gameLoop);
}

function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Button click events
    document.getElementById('start-tournament').addEventListener('click', () => switchScreen('main-menu', 'tournament-setup'));
    document.getElementById('quick-match').addEventListener('click', setupQuickMatch);
    document.getElementById('customize').addEventListener('click', () => console.log('Customize option clicked - feature to be implemented'));
    document.getElementById('options').addEventListener('click', () => console.log('Options clicked - feature to be implemented'));
    document.getElementById('tutorial').addEventListener('click', () => switchScreen('main-menu', 'tutorial-screen'));
    
    document.getElementById('tutorial-done').addEventListener('click', () => switchScreen('tutorial-screen', 'main-menu'));
    
    document.getElementById('back-to-menu').addEventListener('click', () => switchScreen('tournament-setup', 'main-menu'));
    document.getElementById('start-game').addEventListener('click', startTournament);
    
    document.getElementById('pause-button').addEventListener('click', togglePause);
    document.getElementById('resume').addEventListener('click', resumeGame);
    document.getElementById('restart').addEventListener('click', restartMatch);
    document.getElementById('quit-to-menu').addEventListener('click', quitToMenu);
    
    document.getElementById('continue-tournament').addEventListener('click', continueToNextMatch);
    document.getElementById('exit-tournament').addEventListener('click', quitToMenu);
    
    document.getElementById('next-match').addEventListener('click', goToNextMatch);
    document.getElementById('view-groups').addEventListener('click', toggleGroupsView);
    document.getElementById('exit-to-menu').addEventListener('click', quitToMenu);
    
    document.getElementById('trophy-continue').addEventListener('click', quitToMenu);
    
    // Game canvas event listeners for gameplay
    gameState.canvas.addEventListener('mousedown', handleMouseDown);
    gameState.canvas.addEventListener('mousemove', handleMouseMove);
    gameState.canvas.addEventListener('mouseup', handleMouseUp);
    
    // Touch events for mobile
    gameState.canvas.addEventListener('touchstart', handleTouchStart);
    gameState.canvas.addEventListener('touchmove', handleTouchMove);
    gameState.canvas.addEventListener('touchend', handleTouchEnd);
}

function switchScreen(from, to) {
    console.log(`Switching screen from ${from} to ${to}`);
    
    // Hide current screen
    const currentScreen = document.getElementById(from);
    if (currentScreen) {
        currentScreen.classList.add('hidden');
    }
    
    // Show new screen
    const newScreen = document.getElementById(to);
    if (newScreen) {
        newScreen.classList.remove('hidden');
    }
    
    // Update game state
    gameState.currentScreen = to;
    
    // Special handling for certain screens
    if (to === 'tournament-setup') {
        populateLeaguesAndTeams();
    } else if (to === 'game-container') {
        resetGameView();
    }
}

function gameLoop() {
    // Clear canvas
    gameState.ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    // Only render game if we're on the game screen
    if (gameState.currentScreen === 'game-container' && !gameState.isLoading) {
        renderGame();
        updateGameLogic();
    }
    
    // Continue the loop
    requestAnimationFrame(gameLoop);
}

function renderGame() {
    // Draw stadium background
    if (gameState.assets.images['stadium']) {
        gameState.ctx.drawImage(
            gameState.assets.images['stadium'], 
            0, 0, 
            gameState.canvas.width, 
            gameState.canvas.height
        );
    }
    
    // Draw goal
    if (gameState.assets.images['goal']) {
        const goalWidth = gameState.canvas.width * 0.8;
        const goalHeight = goalWidth * 0.4; // Maintain aspect ratio
        const goalX = (gameState.canvas.width - goalWidth) / 2;
        const goalY = gameState.canvas.height * 0.15;
        
        gameState.ctx.drawImage(
            gameState.assets.images['goal'],
            goalX, goalY,
            goalWidth, goalHeight
        );
    }
    
    // Draw goalkeeper
    if (gameState.assets.images['goalkeeper']) {
        const keeperWidth = gameState.canvas.width * 0.15;
        const keeperHeight = keeperWidth * 1.5; // Maintain aspect ratio
        const keeperX = (gameState.canvas.width - keeperWidth) / 2;
        const keeperY = gameState.canvas.height * 0.25;
        
        gameState.ctx.drawImage(
            gameState.assets.images['goalkeeper'],
            keeperX, keeperY,
            keeperWidth, keeperHeight
        );
    }
    
    // Draw ball
    if (gameState.assets.images['ball']) {
        const ballSize = gameState.canvas.width * 0.05;
        const ballX = (gameState.canvas.width - ballSize) / 2;
        const ballY = gameState.canvas.height * 0.75;
        
        gameState.ctx.drawImage(
            gameState.assets.images['ball'],
            ballX, ballY,
            ballSize, ballSize
        );
    }
    
    // Draw penalty direction indicator (red dot) if in shooting phase
    if (gameState.penaltyPhase === 'shoot' && gameState.currentPenalty.isCharging) {
        const indicatorRadius = 10;
        const indicatorY = gameState.canvas.height * 0.2;
        const maxWidth = gameState.canvas.width * 0.6;
        
        // Calculate x position based on direction
        const indicatorX = (gameState.canvas.width / 2) + (gameState.currentPenalty.direction * maxWidth / 2);
        
        gameState.ctx.fillStyle = 'red';
        gameState.ctx.beginPath();
        gameState.ctx.arc(indicatorX, indicatorY, indicatorRadius, 0, Math.PI * 2);
        gameState.ctx.fill();
    }
    
    // Draw goalkeeper target circle if in save phase
    if (gameState.penaltyPhase === 'save') {
        const circleRadius = 20;
        
        gameState.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        gameState.ctx.lineWidth = 2;
        gameState.ctx.beginPath();
        gameState.ctx.arc(
            gameState.currentPenalty.direction, 
            gameState.currentPenalty.height, 
            circleRadius, 
            0, Math.PI * 2
        );
        gameState.ctx.stroke();
    }
}

function updateGameLogic() {
    // Update penalty charge if in progress
    if (gameState.currentPenalty.isCharging) {
        gameState.currentPenalty.power += 0.5;
        
        // Oscillate direction for shooting phase
        if (gameState.penaltyPhase === 'shoot') {
            gameState.currentPenalty.direction = Math.sin(Date.now() / 200) * 0.8; // Value between -0.8 and 0.8
        }
    }
}

// Input handlers
function handleMouseDown(e) {
    if (gameState.currentScreen !== 'game-container' || gameState.animationInProgress) return;
    
    gameState.currentPenalty.isCharging = true;
    
    if (gameState.penaltyPhase === 'save') {
        // Store initial position for goalkeeper target
        const rect = gameState.canvas.getBoundingClientRect();
        gameState.currentPenalty.direction = e.clientX - rect.left;
        gameState.currentPenalty.height = e.clientY - rect.top;
    }
}

function handleMouseMove(e) {
    if (gameState.currentScreen !== 'game-container' || !gameState.currentPenalty.isCharging) return;
    
    if (gameState.penaltyPhase === 'save') {
        // Update goalkeeper target position
        const rect = gameState.canvas.getBoundingClientRect();
        gameState.currentPenalty.direction = e.clientX - rect.left;
        gameState.currentPenalty.height = e.clientY - rect.top;
    }
}

function handleMouseUp(e) {
    if (gameState.currentScreen !== 'game-container' || !gameState.currentPenalty.isCharging) return;
    
    gameState.currentPenalty.isCharging = false;
    
    if (gameState.penaltyPhase === 'shoot') {
        executeShot();
    } else if (gameState.penaltyPhase === 'save') {
        executeSave();
    }
}

// Touch event handlers for mobile
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    handleMouseDown(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    handleMouseMove(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    handleMouseUp(mouseEvent);
}

function executeShot() {
    if (gameState.animationInProgress) return;
    
    gameState.animationInProgress = true;
    document.getElementById('instruction-overlay').classList.add('hidden');
    
    console.log(`Executing shot with power: ${gameState.currentPenalty.power}, direction: ${gameState.currentPenalty.direction}`);
    
    // Play kick sound
    if (gameState.gameSettings.sound && gameState.assets.audio['ball-kick']) {
        gameState.assets.audio['ball-kick'].play();
    }
    
    // Determine outcome (goal or miss)
    const isGoal = determineGoalOutcome(gameState.currentPenalty.power, gameState.currentPenalty.direction);
    
    // Update statistics
    gameState.statistics.shots++;
    
    // Animate the outcome
    setTimeout(() => {
        if (isGoal) {
            // It's a goal!
            gameState.player.score++;
            gameState.statistics.goals++;
            
            // Play goal sound
            if (gameState.gameSettings.sound && gameState.assets.audio['goal']) {
                gameState.assets.audio['goal'].play();
            }
            
            // Show goal text animation
            const goalText = document.createElement('div');
            goalText.className = 'goal-text';
            goalText.textContent = 'GOAL!';
            document.getElementById('game-container').appendChild(goalText);
            
            setTimeout(() => {
                goalText.remove();
            }, 2000);
            
        } else {
            // It's a miss!
            // Play miss sound
            if (gameState.gameSettings.sound && gameState.assets.audio['miss']) {
                gameState.assets.audio['miss'].play();
            }
            
            // Show miss text animation
            const missText = document.createElement('div');
            missText.className = 'miss-text';
            missText.textContent = 'MISS!';
            document.getElementById('game-container').appendChild(missText);
            
            setTimeout(() => {
                missText.remove();
            }, 1500);
        }
        
        // Update HUD
        updateMatchHUD();
        
        // Move to next phase
        gameState.penaltiesLeft.player--;
        
        // Check if the match is over
        if (checkMatchOver()) {
            endMatch();
        } else {
            // Switch to saving phase
            setTimeout(() => {
                gameState.animationInProgress = false;
                switchPenaltyPhase('save');
            }, 2000);
        }
    }, 1000);
}

function executeSave() {
    if (gameState.animationInProgress) return;
    
    gameState.animationInProgress = true;
    document.getElementById('instruction-overlay').classList.add('hidden');
    
    console.log(`Executing save at position: (${gameState.currentPenalty.direction}, ${gameState.currentPenalty.height})`);
    
    // Determine outcome (save or goal)
    const isSave = determineSaveOutcome(gameState.currentPenalty.direction, gameState.currentPenalty.height);
    
    // Animate the outcome
    setTimeout(() => {
        if (isSave) {
            // It's a save!
            gameState.statistics.saves++;
            
            // Play save sound
            if (gameState.gameSettings.sound && gameState.assets.audio['save']) {
                gameState.assets.audio['save'].play();
            }
            
            // Show save text animation
            const saveText = document.createElement('div');
            saveText.className = 'miss-text';
            saveText.textContent = 'SAVED!';
            document.getElementById('game-container').appendChild(saveText);
            
            setTimeout(() => {
                saveText.remove();
            }, 1500);
        } else {
            // It's a goal for the opponent
            gameState.opponent.score++;
            
            // Play goal sound
            if (gameState.gameSettings.sound && gameState.assets.audio['goal']) {
                gameState.assets.audio['goal'].play();
            }
            
            // Show goal text animation
            const goalText = document.createElement('div');
            goalText.className = 'goal-text';
            goalText.textContent = 'GOAL!';
            document.getElementById('game-container').appendChild(goalText);
            
            setTimeout(() => {
                goalText.remove();
            }, 2000);
        }
        
        // Update HUD
        updateMatchHUD();
        
        // Move to next phase
        gameState.penaltiesLeft.opponent--;
        
        // Check if the match is over
        if (checkMatchOver()) {
            endMatch();
        } else {
            // Switch back to shooting phase
            setTimeout(() => {
                gameState.animationInProgress = false;
                switchPenaltyPhase('shoot');
            }, 2000);
        }
    }, 1000);
}

function switchPenaltyPhase(phase) {
    gameState.penaltyPhase = phase;
    
    // Reset penalty properties
    gameState.currentPenalty = {
        power: 0,
        direction: 0,
        height: 0,
        isCharging: false
    };
    
    // Show appropriate instruction
    const instructionOverlay = document.getElementById('instruction-overlay');
    const instructionTitle = document.getElementById('instruction-title');
    const instructionText = document.getElementById('instruction-text');
    
    instructionOverlay.classList.remove('hidden');
    
    if (phase === 'shoot') {
        instructionTitle.textContent = 'Your turn to shoot!';
        instructionText.textContent = 'Click and hold to charge your shot. Release to shoot. The red dot controls direction.';
    } else {
        instructionTitle.textContent = 'Your turn to save!';
        instructionText.textContent = 'Move your cursor to position the goalkeeper. Click and hold to prepare, then release to dive.';
    }
}

function determineGoalOutcome(power, direction) {
    // Simple logic for now - can be made more sophisticated
    // Power should be between 20-80 for optimal shot
    const powerFactor = (power > 80) ? 0.5 : (power < 20 ? 0.6 : 0.9);
    
    // Direction should be between -0.8 and 0.8 to be on target
    const directionFactor = (Math.abs(direction) > 0.8) ? 0.5 : 0.9;
    
    // Calculate success probability
    const goalProbability = powerFactor * directionFactor;
    
    // Add some randomness
    return Math.random() < goalProbability;
}

function determineSaveOutcome(direction, height) {
    // Calculate where the AI shot will go
    const goalWidth = gameState.canvas.width * 0.8;
    const goalHeight = goalWidth * 0.4;
    const goalX = (gameState.canvas.width - goalWidth) / 2;
    const goalY = gameState.canvas.height * 0.15;
    
    const shotX = goalX + Math.random() * goalWidth;
    const shotY = goalY + Math.random() * goalHeight;
    
    // Calculate distance between save attempt and actual shot
    const distance = Math.sqrt(Math.pow(shotX - direction, 2) + Math.pow(shotY - height, 2));
    
    // Determine save threshold based on difficulty
    let saveThreshold;
    switch (gameState.gameSettings.difficulty) {
        case 'easy':
            saveThreshold = 150;
            break;
        case 'hard':
            saveThreshold = 80;
            break;
        default: // normal
            saveThreshold = 120;
    }
    
    return distance < saveThreshold;
}

function checkMatchOver() {
    // Regular penalties (5 each)
    if (gameState.penaltiesLeft.player > 0 && gameState.penaltiesLeft.opponent > 0) {
        return false;
    }
    
    // Check if one team cannot catch up
    const remainingPlayer = gameState.penaltiesLeft.player;
    const remainingOpponent = gameState.penaltiesLeft.opponent;
    
    if (gameState.player.score > gameState.opponent.score + remainingOpponent) {
        return true; // Player wins, opponent can't catch up
    }
    
    if (gameState.opponent.score > gameState.player.score + remainingPlayer) {
        return true; // Opponent wins, player can't catch up
    }
    
    // If both teams have taken all 5 penalties and no winner
    if (gameState.penaltiesLeft.player === 0 && gameState.penaltiesLeft.opponent === 0) {
        // Check for a tie - go to sudden death
        if (gameState.player.score === gameState.opponent.score) {
            // Extend by 1 penalty each for sudden death
            gameState.penaltiesLeft.player = 1;
            gameState.penaltiesLeft.opponent = 1;
            return false;
        } else {
            return true; // We have a winner
        }
    }
    
    return false;
}

function updateMatchHUD() {
    // Update scores
    document.getElementById('team1-score').textContent = gameState.player.score;
    document.getElementById('team2-score').textContent = gameState.opponent.score;
    
    // Update penalties remaining text
    let penaltiesText;
    if (gameState.penaltiesLeft.player === gameState.penaltiesLeft.opponent) {
        penaltiesText = `${gameState.penaltiesLeft.player} penalties each`;
    } else {
        penaltiesText = `P: ${gameState.penaltiesLeft.player} | O: ${gameState.penaltiesLeft.opponent}`;
    }
    document.getElementById('penalties-remaining').textContent = penaltiesText;
}

function endMatch() {
    console.log('Match ended!');
    
    // Determine the winner
    let winner;
    if (gameState.player.score > gameState.opponent.score) {
        winner = 'player';
    } else if (gameState.opponent.score > gameState.player.score) {
        winner = 'opponent';
    } else {
        winner = 'draw'; // Shouldn't happen with sudden death implemented
    }
    
    // Update tournament data if in tournament mode
    if (gameState.tournament) {
        updateTournamentProgress(winner);
    }
    
    // Show match result screen after a delay
    setTimeout(() => {
        showMatchResults(winner);
    }, 2000);
}

function showMatchResults(winner) {
    // Populate result screen
    document.getElementById('result-team1-name').textContent = gameState.player.team.name;
    document.getElementById('result-team2-name').textContent = gameState.opponent.team.name;
    document.getElementById('result-team1-score').textContent = gameState.player.score;
    document.getElementById('result-team2-score').textContent = gameState.opponent.score;
    
    // Set result title based on outcome
    let resultTitle;
    if (winner === 'player') {
        resultTitle = 'VICTORY!';
    } else if (winner === 'opponent') {
        resultTitle = 'DEFEAT!';
    } else {
        resultTitle = 'DRAW!';
    }
    document.getElementById('result-title').textContent = resultTitle;
    
    // Display match statistics
    displayMatchStatistics();
    
    // Award medals based on performance
    awardMedals();
    
    // Switch to result screen
    switchScreen('game-container', 'match-result');
}

function displayMatchStatistics() {
    const statsContainer = document.getElementById('match-stats');
    statsContainer.innerHTML = '';
    
    // Calculate stats
    const shotAccuracy = gameState.statistics.shots > 0 ? 
        Math.round((gameState.statistics.goals / gameState.statistics.shots) * 100) : 0;
    
    const saveAccuracy = gameState.penaltiesLeft.opponent < 5 ?
        Math.round((gameState.statistics.saves / (5 - gameState.penaltiesLeft.opponent)) * 100) : 0;
    
    const stats = [
        { label: 'Shot Accuracy', value: `${shotAccuracy}%` },
        { label: 'Goals Scored', value: gameState.statistics.goals },
        { label: 'Saves Made', value: gameState.statistics.saves },
        { label: 'Perfect Shots', value: gameState.statistics.perfectShots }
    ];
    
    // Create stat elements
    stats.forEach(stat => {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        
        const statValue = document.createElement('div');
        statValue.className = 'stat-value';
        statValue.textContent = stat.value;
        
        const statLabel = document.createElement('div');
        statLabel.className = 'stat-label';
        statLabel.textContent = stat.label;
        
        statItem.appendChild(statValue);
        statItem.appendChild(statLabel);
        statsContainer.appendChild(statItem);
    });
}

function awardMedals() {
    const medalsContainer = document.getElementById('medals-container');
    medalsContainer.innerHTML = '';
    
    const medals = [];
    
    // Shot accuracy medal
    const shotAccuracy = gameState.statistics.shots > 0 ? 
        (gameState.statistics.goals / gameState.statistics.shots) * 100 : 0;
    
    if (shotAccuracy === 100) {
        medals.push({ name: 'Perfect Shooter', type: 'gold' });
    } else if (shotAccuracy >= 80) {
        medals.push({ name: 'Sharp Shooter', type: 'silver' });
    } else if (shotAccuracy >= 60) {
        medals.push({ name: 'Good Shooter', type: 'bronze' });
    }
    
    // Save medal
    const saveAccuracy = gameState.penaltiesLeft.opponent < 5 ?
        (gameState.statistics.saves / (5 - gameState.penaltiesLeft.opponent)) * 100 : 0;
    
    if (saveAccuracy === 100) {
        medals.push({ name: 'Brick Wall', type: 'gold' });
    } else if (saveAccuracy >= 60) {
        medals.push({ name: 'Solid Keeper', type: 'silver' });
    } else if (saveAccuracy >= 40) {
        medals.push({ name: 'Good Keeper', type: 'bronze' });
    }
    
    // Create medal elements
    medals.forEach(medal => {
        const medalElement = document.createElement('div');
        medalElement.className = 'medal';
        
        const medalIcon = document.createElement('div');
        medalIcon.className = `medal-icon medal-${medal.type}`;
        
        const medalName = document.createElement('div');
        medalName.className = 'medal-name';
        medalName.textContent = medal.name;
        
        medalElement.appendChild(medalIcon);
        medalElement.appendChild(medalName);
        medalsContainer.appendChild(medalElement);
    });
}

function setupQuickMatch() {
    // Select two random teams
    const allTeams = generateTeams();
    const randomTeams = shuffleArray(allTeams).slice(0, 2);
    
    gameState.player.team = randomTeams[0];
    gameState.opponent.team = randomTeams[1];
    
    // Reset game state
    resetMatch();
    
    // Switch to game screen
    switchScreen('main-menu', 'game-container');
    
    // Start the match
    startMatch();
}

function resetMatch() {
    // Reset scores
    gameState.player.score = 0;
    gameState.opponent.score = 0;
    
    // Reset penalties
    gameState.penaltiesLeft = {
        player: 5,
        opponent: 5
    };
    
    // Reset current penalty
    gameState.currentPenalty = {
        power: 0,
        direction: 0,
        height: 0,
        isCharging: false
    };
    
    // Reset phase
    gameState.penaltyPhase = 'shoot';
    
    // Reset animation flag
    gameState.animationInProgress = false;
    
    // Reset statistics
    gameState.statistics = {
        shots: 0,
        goals: 0,
        saves: 0,
        perfectShots: 0,
        diveLength: 0
    };
}

function startMatch() {
    // Update HUD with team information
    document.getElementById('team1-name').textContent = gameState.player.team.name;
    document.getElementById('team2-name').textContent = gameState.opponent.team.name;
    updateMatchHUD();
    
    // Play whistle sound
    if (gameState.gameSettings.sound && gameState.assets.audio['whistle']) {
        gameState.assets.audio['whistle'].play();
    }
    
    // Show instruction for first penalty
    switchPenaltyPhase('shoot');
}

function resetGameView() {
    // Make sure game canvas is visible and properly sized
    resizeCanvas();
    
    // Hide instruction overlay initially
    document.getElementById('instruction-overlay').classList.add('hidden');
}

function populateLeaguesAndTeams() {
    // Generate leagues
    const leagues = generateLeagues();
    const leaguesGrid = document.getElementById('leagues-grid');
    leaguesGrid.innerHTML = '';
    
    leagues.forEach((league, index) => {
        const leagueElement = document.createElement('div');
        leagueElement.className = 'league-item';
        leagueElement.dataset.leagueId = index;
        
        const leagueName = document.createElement('div');
        leagueName.textContent = league.name;
        
        leagueElement.appendChild(leagueName);
        leagueElement.addEventListener('click', () => selectLeague(index));
        
        leaguesGrid.appendChild(leagueElement);
    });
    
    // Select the first league by default
    if (leagues.length > 0) {
        selectLeague(0);
    }
}

function selectLeague(leagueId) {
    // Highlight the selected league
    const leagueItems = document.querySelectorAll('.league-item');
    leagueItems.forEach(item => {
        if (parseInt(item.dataset.leagueId) === leagueId) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    // Get the teams for this league
    const leagues = generateLeagues();
    const selectedLeague = leagues[leagueId];
    
    // Populate teams grid
    const teamsGrid = document.getElementById('teams-grid');
    teamsGrid.innerHTML = '';
    
    // Generate team objects for the selected league
    const teams = generateTeamsForLeague(selectedLeague);
    
    teams.forEach((team, index) => {
        const teamElement = document.createElement('div');
        teamElement.className = 'team-item';
        teamElement.dataset.teamId = index;
        
        const teamName = document.createElement('div');
        teamName.textContent = team.name;
        
        teamElement.appendChild(teamName);
        teamElement.addEventListener('click', () => selectTeam(index, teams));
        
        teamsGrid.appendChild(teamElement);
    });
}

function selectTeam(teamId, teams) {
    // Highlight the selected team
    const teamItems = document.querySelectorAll('.team-item');
    teamItems.forEach(item => {
        if (parseInt(item.dataset.teamId) === teamId) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    // Store the selected team
    gameState.player.team = teams[teamId];
    
    // Enable the start button
    document.getElementById('start-game').disabled = false;
}

function startTournament() {
    // Check if player has selected a team
    if (!gameState.player.team) {
        alert('Please select a team first!');
        return;
    }
    
    // Create tournament structure
    gameState.tournament = createTournament();
    
    // Get first match
    const firstMatch = getNextTournamentMatch();
    
    if (firstMatch) {
        gameState.opponent.team = firstMatch.opponent;
        
        // Reset match
        resetMatch();
        
        // Switch to game screen
        switchScreen('tournament-setup', 'game-container');
        
        // Start the match
        startMatch();
    } else {
        alert('Failed to set up tournament!');
    }
}

function continueToNextMatch() {
    // Go to tournament progress screen
    switchScreen('match-result', 'tournament-progress');
    
    // Update tournament bracket display
    updateTournamentBracketDisplay();
}

function goToNextMatch() {
    // Get next match
    const nextMatch = getNextTournamentMatch();
    
    if (nextMatch) {
        gameState.opponent.team = nextMatch.opponent;
        
        // Reset match
        resetMatch();
        
        // Switch to game screen
        switchScreen('tournament-progress', 'game-container');
        
        // Start the match
        startMatch();
    } else {
        // Tournament is over, player has won
        showTrophyScreen();
    }
}

function showTrophyScreen() {
    // Set champion info
    document.getElementById('champion-team-name').textContent = gameState.player.team.name;
    document.getElementById('champion-league-name').textContent = gameState.tournament.league.name + ' Champion';
    
    // Play victory music
    if (gameState.gameSettings.sound && gameState.assets.audio['victory-music']) {
        gameState.assets.audio['victory-music'].play();
    }
    
    // Switch to trophy screen
    switchScreen('tournament-progress', 'trophy-screen');
}

function togglePause() {
    if (gameState.currentScreen === 'game-container') {
        document.getElementById('pause-menu').classList.remove('hidden');
    }
}

function resumeGame() {
    document.getElementById('pause-menu').classList.add('hidden');
}

function restartMatch() {
    // Reset match
    resetMatch();
    
    // Hide pause menu
    document.getElementById('pause-menu').classList.add('hidden');
    
    // Start match
    startMatch();
}

function quitToMenu() {
    // Reset game state
    resetMatch();
    gameState.tournament = null;
    
    // Switch to main menu
    switchScreen(gameState.currentScreen, 'main-menu');
    
    // Hide pause menu if visible
    document.getElementById('pause-menu').classList.add('hidden');
}

function toggleGroupsView() {
    // Toggle between group view and knockout stage view
    // Implementation depends on tournament structure visualization
    console.log('Toggle groups view - to be implemented');
}

// Utility functions
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}