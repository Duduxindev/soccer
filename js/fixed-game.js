/**
 * Penalty Shooters 2 - Fixed Game Logic
 * This version fixes transition and pause button issues
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
        height: 0.5,
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
        diveLength: 0,
        avgPower: 0,
        totalPower: 0
    },
    canvas: null,
    ctx: null,
    assets: {
        images: {},
        audio: {},
        loaded: 0,
        total: 0
    },
    debugMode: false
};

// Game initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded. Initializing game...');
    initializeGame();
    
    // Ensure the loading screen finishes even if there are asset loading issues
    setupLoadingScreenFallback();
});

function setupLoadingScreenFallback() {
    // Force transition after 8 seconds if loading is stuck
    setTimeout(() => {
        if (gameState.currentScreen === 'loading') {
            console.log('Forcing completion of loading screen after timeout');
            completeLoading();
        }
    }, 8000);
}

function initializeGame() {
    console.log("Initializing Penalty Shooters 2...");
    
    // Set up canvas
    gameState.canvas = document.getElementById('game-canvas');
    if (!gameState.canvas) {
        console.error('Game canvas element not found!');
        return;
    }
    
    gameState.ctx = gameState.canvas.getContext('2d');
    
    // Ensure canvas is full screen
    resizeCanvas();
    
    // Load game assets
    loadAssets();
    
    // Set up event listeners
    setupEventListeners();
    
    // Log init completion
    console.log('Game initialization completed');
}

function resizeCanvas() {
    if (!gameState.canvas) return;
    
    gameState.canvas.width = window.innerWidth;
    gameState.canvas.height = window.innerHeight;
    
    // If physics is initialized, update it with new canvas dimensions
    if (typeof GamePhysics !== 'undefined' && GamePhysics.initialize) {
        GamePhysics.initialize(gameState.canvas.width, gameState.canvas.height);
    }
    
    console.log(`Canvas resized to ${gameState.canvas.width}x${gameState.canvas.height}`);
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
    console.log(`Starting to load ${gameState.assets.total} assets`);
    
    // Load images
    Object.entries(assetsToLoad.images).forEach(([key, src]) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Handle CORS issues
        
        img.onload = () => {
            assetLoaded(key, img, 'images');
            console.log(`Loaded image: ${key}`);
        };
        
        img.onerror = (e) => {
            console.error(`Failed to load image: ${src}`, e);
            // Still count as loaded to avoid stuck loading screen
            assetLoaded(key, null, 'images');
        };
        
        img.src = src;
    });
    
    // Load audio
    Object.entries(assetsToLoad.audio).forEach(([key, src]) => {
        const audio = new Audio();
        
        // Some browsers don't fire canplaythrough, so we'll use a timeout as backup
        const audioTimeout = setTimeout(() => {
            if (!gameState.assets.audio[key]) {
                console.warn(`Audio loading timeout for: ${key}. Marking as loaded.`);
                assetLoaded(key, audio, 'audio');
            }
        }, 5000);
        
        audio.addEventListener('canplaythrough', () => {
            clearTimeout(audioTimeout);
            assetLoaded(key, audio, 'audio');
            console.log(`Loaded audio: ${key}`);
        });
        
        audio.addEventListener('error', (e) => {
            clearTimeout(audioTimeout);
            console.error(`Failed to load audio: ${src}`, e);
            // Still count as loaded to avoid stuck loading screen
            assetLoaded(key, null, 'audio');
        });
        
        audio.preload = 'auto';
        audio.src = src;
    });

    // Simulate loading for development (helps with visualizing the loading process)
    simulateLoading();
}

function simulateLoading() {
    const loadingBar = document.getElementById('loading-bar');
    if (!loadingBar) {
        console.error('Loading bar element not found');
        return;
    }
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        loadingBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // Give a slight delay before completing loading for visual effect
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
    if (loadingBar) {
        const progress = Math.floor((gameState.assets.loaded / gameState.assets.total) * 100);
        loadingBar.style.width = `${progress}%`;
        
        // Update loading text
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = `Loading... ${progress}%`;
        }
    }
    
    // Check if all assets are loaded
    if (gameState.assets.loaded >= gameState.assets.total) {
        console.log("All assets loaded successfully!");
        completeLoading();
    }
}

function completeLoading() {
    // Prevent multiple calls
    if (gameState.currentScreen !== 'loading') {
        return;
    }
    
    console.log("Completing loading process...");
    
    try {
        // Initialize other components if they exist
        if (typeof GamePhysics !== 'undefined' && GamePhysics.initialize) {
            GamePhysics.initialize(gameState.canvas.width, gameState.canvas.height);
        }
        
        if (typeof InputManager !== 'undefined' && InputManager.initialize) {
            InputManager.initialize(gameState.canvas);
        }
        
        if (typeof SettingsManager !== 'undefined' && SettingsManager.initialize) {
            SettingsManager.initialize();
            // Load settings
            gameState.gameSettings = SettingsManager.current || gameState.gameSettings;
        }
        
        if (typeof Achievements !== 'undefined' && Achievements.initialize) {
            Achievements.initialize();
        }
        
        // Transition to main menu
        switchScreen('loading', 'main-menu');
        
        // Play menu music
        playMenuMusic();
        
        // Initialize game loop
        requestAnimationFrame(gameLoop);
        
        // Set loading state to false
        gameState.isLoading = false;
        
        console.log("Loading complete, game is ready!");
    } catch (error) {
        console.error("Error during loading completion:", error);
        
        // Force transition to main menu even if there's an error
        gameState.isLoading = false;
        switchScreen('loading', 'main-menu');
    }
}

function playMenuMusic() {
    if (!gameState.gameSettings.music) return;
    
    try {
        const menuMusic = gameState.assets.audio['menu-music'];
        if (menuMusic) {
            menuMusic.loop = true;
            menuMusic.volume = 0.5;
            menuMusic.play().catch(e => console.warn('Could not play menu music:', e));
        }
    } catch (e) {
        console.warn('Error playing menu music:', e);
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Button click events - Adding error handling
    safeAddClickListener('start-tournament', () => switchScreen('main-menu', 'tournament-setup'));
    safeAddClickListener('quick-match', setupQuickMatch);
    safeAddClickListener('customize', () => console.log('Customize option clicked - feature to be implemented'));
    safeAddClickListener('options', () => console.log('Options clicked - feature to be implemented'));
    safeAddClickListener('tutorial', () => switchScreen('main-menu', 'tutorial-screen'));
    
    safeAddClickListener('tutorial-done', () => switchScreen('tutorial-screen', 'main-menu'));
    
    safeAddClickListener('back-to-menu', () => switchScreen('tournament-setup', 'main-menu'));
    safeAddClickListener('start-game', startTournament);
    
    // Fixed pause button logic - replaced old implementation
    const pauseBtn = document.getElementById('pause-button');
    if (pauseBtn) {
        pauseBtn.innerHTML = '<span>II</span>';
        pauseBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent any default behavior
            e.stopPropagation(); // Prevent event bubbling
            console.log('Pause button clicked');
            togglePause();
        });
    }
    
    safeAddClickListener('resume', resumeGame);
    safeAddClickListener('restart', restartMatch);
    safeAddClickListener('quit-to-menu', quitToMenu);
    
    safeAddClickListener('continue-tournament', continueToNextMatch);
    safeAddClickListener('exit-tournament', quitToMenu);
    
    safeAddClickListener('next-match', goToNextMatch);
    safeAddClickListener('view-groups', toggleGroupsView);
    safeAddClickListener('exit-to-menu', quitToMenu);
    
    safeAddClickListener('trophy-continue', quitToMenu);
    
    // Game canvas event listeners for gameplay
    if (gameState.canvas) {
        gameState.canvas.addEventListener('mousedown', handleMouseDown);
        gameState.canvas.addEventListener('mousemove', handleMouseMove);
        gameState.canvas.addEventListener('mouseup', handleMouseUp);
        
        // Touch events for mobile
        gameState.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        gameState.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        gameState.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
    
    console.log('Event listeners setup complete');
}

// Helper function to safely add click event listeners
function safeAddClickListener(elementId, callback) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener('click', callback);
    } else {
        console.warn(`Element with id "${elementId}" not found. Skipping event listener.`);
    }
}

function switchScreen(from, to) {
    console.log(`Switching screen from ${from} to ${to}`);
    
    // Hide current screen
    const currentScreen = document.getElementById(from);
    if (currentScreen) {
        currentScreen.classList.add('hidden');
    } else {
        console.warn(`Screen element "${from}" not found`);
    }
    
    // Show new screen
    const newScreen = document.getElementById(to);
    if (newScreen) {
        newScreen.classList.remove('hidden');
    } else {
        console.error(`Screen element "${to}" not found`);
        return; // Don't continue if target screen doesn't exist
    }
    
    // Update game state
    gameState.currentScreen = to;
    
    // Special handling for certain screens
    if (to === 'tournament-setup') {
        populateLeaguesAndTeams();
    } else if (to === 'game-container') {
        resetGameView();
    }
    
    console.log(`Screen switched to: ${to}`);
}

function gameLoop() {
    // Clear canvas
    if (gameState.ctx) {
        gameState.ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
        // Only render game if we're on the game screen
        if (gameState.currentScreen === 'game-container' && !gameState.isLoading) {
            renderGame();
            updateGameLogic();
        }
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
    
    // Draw power meter if in shooting phase and charging
    if (gameState.penaltyPhase === 'shoot' && gameState.currentPenalty.isCharging) {
        const meterWidth = 20;
        const meterHeight = gameState.canvas.height * 0.3;
        const meterX = 30;
        const meterY = (gameState.canvas.height - meterHeight) / 2;
        
        // Background
        gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        gameState.ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
        
        // Power level
        const powerPercentage = Math.min(gameState.currentPenalty.power / 100, 1);
        const powerHeight = meterHeight * powerPercentage;
        
        // Color gradient based on power
        let powerColor;
        if (powerPercentage < 0.33) {
            powerColor = '#4CAF50'; // Green for low power
        } else if (powerPercentage < 0.66) {
            powerColor = '#FFEB3B'; // Yellow for medium power
        } else {
            powerColor = '#F44336'; // Red for high power
        }
        
        gameState.ctx.fillStyle = powerColor;
        gameState.ctx.fillRect(
            meterX, 
            meterY + meterHeight - powerHeight, 
            meterWidth, 
            powerHeight
        );
        
        // Border
        gameState.ctx.strokeStyle = 'white';
        gameState.ctx.lineWidth = 2;
        gameState.ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
    }
    
    // Draw penalty countdown timer if applicable
    if (gameState.countdownTimer) {
        const timeLeft = Math.max(0, Math.ceil((gameState.countdownEnd - Date.now()) / 1000));
        
        gameState.ctx.font = 'bold 48px Arial';
        gameState.ctx.fillStyle = timeLeft <= 3 ? 'red' : 'white';
        gameState.ctx.textAlign = 'center';
        gameState.ctx.textBaseline = 'middle';
        gameState.ctx.fillText(
            timeLeft.toString(), 
            gameState.canvas.width / 2,
            gameState.canvas.height * 0.4
        );
    }
    
    // Draw debug info if debug mode is on
    if (gameState.debugMode) {
        drawDebugInfo();
    }
}

function drawDebugInfo() {
    // Background for debug info
    gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    gameState.ctx.fillRect(10, 10, 300, 150);
    
    // Text settings
    gameState.ctx.font = '12px Arial';
    gameState.ctx.fillStyle = 'white';
    gameState.ctx.textAlign = 'left';
    
    // Display debug information
    const debugInfo = [
        `Current Screen: ${gameState.currentScreen}`,
        `Penalty Phase: ${gameState.penaltyPhase}`,
        `Player Score: ${gameState.player.score}`,
        `Opponent Score: ${gameState.opponent.score}`,
        `Penalties Left: ${gameState.penaltiesLeft.player}-${gameState.penaltiesLeft.opponent}`,
        `Animation in Progress: ${gameState.animationInProgress}`,
        `Loading Complete: ${!gameState.isLoading}`,
        `Power: ${Math.round(gameState.currentPenalty.power)}`,
        `Direction: ${gameState.currentPenalty.direction.toFixed(2)}`,
        `Mouse Pos: ${gameState.lastMouseX || 0}, ${gameState.lastMouseY || 0}`
    ];
    
    debugInfo.forEach((info, index) => {
        gameState.ctx.fillText(info, 20, 30 + (index * 15));
    });
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
    
    // Handle countdown timer
    if (gameState.countdownTimer && Date.now() > gameState.countdownEnd) {
        gameState.countdownTimer = false;
        
        // Auto-execute penalty if time runs out
        if (gameState.currentPenalty.isCharging) {
            gameState.currentPenalty.isCharging = false;
            if (gameState.penaltyPhase === 'shoot') {
                executeShot();
            } else if (gameState.penaltyPhase === 'save') {
                executeSave();
            }
        }
    }
}

// Input handlers
function handleMouseDown(e) {
    if (gameState.currentScreen !== 'game-container' || gameState.animationInProgress) return;
    
    // Store mouse position for debug
    const rect = gameState.canvas.getBoundingClientRect();
    gameState.lastMouseX = e.clientX - rect.left;
    gameState.lastMouseY = e.clientY - rect.top;
    
    gameState.currentPenalty.isCharging = true;
    
    if (gameState.penaltyPhase === 'save') {
        // Store initial position for goalkeeper target
        gameState.currentPenalty.direction = gameState.lastMouseX;
        gameState.currentPenalty.height = gameState.lastMouseY;
    }
}

function handleMouseMove(e) {
    if (gameState.currentScreen !== 'game-container') return;
    
    // Store mouse position for debug
    const rect = gameState.canvas.getBoundingClientRect();
    gameState.lastMouseX = e.clientX - rect.left;
    gameState.lastMouseY = e.clientY - rect.top;
    
    if (!gameState.currentPenalty.isCharging) return;
    
    if (gameState.penaltyPhase === 'save') {
        // Update goalkeeper target position
        gameState.currentPenalty.direction = gameState.lastMouseX;
        gameState.currentPenalty.height = gameState.lastMouseY;
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
    
    if (gameState.currentScreen !== 'game-container' || gameState.animationInProgress) return;
    
    const touch = e.touches[0];
    const rect = gameState.canvas.getBoundingClientRect();
    
    gameState.lastMouseX = touch.clientX - rect.left;
    gameState.lastMouseY = touch.clientY - rect.top;
    
    gameState.currentPenalty.isCharging = true;
    
    if (gameState.penaltyPhase === 'save') {
        // Store initial position for goalkeeper target
        gameState.currentPenalty.direction = gameState.lastMouseX;
        gameState.currentPenalty.height = gameState.lastMouseY;
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    
    if (gameState.currentScreen !== 'game-container' || !gameState.currentPenalty.isCharging) return;
    
    const touch = e.touches[0];
    const rect = gameState.canvas.getBoundingClientRect();
    
    gameState.lastMouseX = touch.clientX - rect.left;
    gameState.lastMouseY = touch.clientY - rect.top;
    
    if (gameState.penaltyPhase === 'save') {
        // Update goalkeeper target position
        gameState.currentPenalty.direction = gameState.lastMouseX;
        gameState.currentPenalty.height = gameState.lastMouseY;
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    
    if (gameState.currentScreen !== 'game-container' || !gameState.currentPenalty.isCharging) return;
    
    gameState.currentPenalty.isCharging = false;
    
    if (gameState.penaltyPhase === 'shoot') {
        executeShot();
    } else if (gameState.penaltyPhase === 'save') {
        executeSave();
    }
}

function executeShot() {
    if (gameState.animationInProgress) return;
    
    gameState.animationInProgress = true;
    
    // Hide instruction overlay
    const instructionOverlay = document.getElementById('instruction-overlay');
    if (instructionOverlay) instructionOverlay.classList.add('hidden');
    
    console.log(`Executing shot with power: ${gameState.currentPenalty.power}, direction: ${gameState.currentPenalty.direction}`);
    
    // Play kick sound
    playSound('ball-kick');
    
    // Determine outcome (goal or miss)
    const isGoal = determineGoalOutcome(gameState.currentPenalty.power, gameState.currentPenalty.direction);
    
    // Update statistics
    gameState.statistics.shots++;
    gameState.statistics.totalPower += gameState.currentPenalty.power;
    gameState.statistics.avgPower = gameState.statistics.totalPower / gameState.statistics.shots;
    
    // Animate the outcome
    setTimeout(() => {
        if (isGoal) {
            // It's a goal!
            gameState.player.score++;
            gameState.statistics.goals++;
            
            // Play goal sound
            playSound('goal');
            
            // Show goal text animation
            showAnimatedText('GOAL!', 'goal-text');
        } else {
            // It's a miss!
            // Play miss sound
            playSound('miss');
            
            // Show miss text animation
            showAnimatedText('MISS!', 'miss-text');
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

// Helper function to show animated text
function showAnimatedText(text, className, duration = 2000) {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;
    
    const textElement = document.createElement('div');
    textElement.className = className;
    textElement.textContent = text;
    gameContainer.appendChild(textElement);
    
    setTimeout(() => {
        textElement.remove();
    }, duration);
}

// Helper function to play sound with error handling
function playSound(soundKey, volume = 1.0) {
    try {
        if (!gameState.gameSettings.sound) return;
        
        const sound = gameState.assets.audio[soundKey];
        if (sound) {
            const soundClone = sound.cloneNode();
            soundClone.volume = volume;
            soundClone.play().catch(e => console.warn(`Failed to play sound '${soundKey}':`, e));
        }
    } catch (e) {
        console.warn(`Error playing '${soundKey}' sound:`, e);
    }
}

function executeSave() {
    if (gameState.animationInProgress) return;
    
    gameState.animationInProgress = true;
    
    // Hide instruction overlay
    const instructionOverlay = document.getElementById('instruction-overlay');
    if (instructionOverlay) instructionOverlay.classList.add('hidden');
    
    console.log(`Executing save at position: (${gameState.currentPenalty.direction}, ${gameState.currentPenalty.height})`);
    
    // Determine outcome (save or goal)
    const isSave = determineSaveOutcome(gameState.currentPenalty.direction, gameState.currentPenalty.height);
    
    // Animate the outcome
    setTimeout(() => {
        // Play kick sound
        playSound('ball-kick');
        
        setTimeout(() => {
            if (isSave) {
                // It's a save!
                gameState.statistics.saves++;
                
                // Play save sound
                playSound('save');
                
                // Show save text animation
                showAnimatedText('SAVED!', 'miss-text', 1500);
                
            } else {
                // It's a goal for the opponent!
                gameState.opponent.score++;
                
                // Play goal sound
                playSound('goal');
                
                // Show goal text animation
                showAnimatedText('GOAL!', 'goal-text', 2000);
            }
            
            // Update HUD
            updateMatchHUD();
            
            // Move to next phase
            gameState.penaltiesLeft.opponent--;
            
            // Check if the match is over
            if (checkMatchOver()) {
                endMatch();
            } else {
                // Switch to shooting phase
                setTimeout(() => {
                    gameState.animationInProgress = false;
                    switchPenaltyPhase('shoot');
                }, 2000);
            }
        }, 1000);
    }, 500);
}

function switchPenaltyPhase(phase) {
    gameState.penaltyPhase = phase;
    gameState.currentPenalty = {
        power: 0,
        direction: 0,
        height: 0.5, // Default height at middle of goal
        isCharging: false
    };
    
    // Update instructions
    const instructionTitle = document.getElementById('instruction-title');
    const instructionText = document.getElementById('instruction-text');
    const instructionOverlay = document.getElementById('instruction-overlay');
    
    if (!instructionTitle || !instructionText || !instructionOverlay) {
        console.warn('Instruction elements not found');
        return;
    }
    
    if (phase === 'shoot') {
        instructionTitle.textContent = 'Your turn to shoot!';
        instructionText.textContent = 'Click and hold to charge your shot. Release to shoot. The red dot controls direction.';
    } else {
        instructionTitle.textContent = 'Your turn to save!';
        instructionText.textContent = 'Click and drag to position the goalkeeper. Release to dive.';
    }
    
    instructionOverlay.classList.remove('hidden');
    
    // Start countdown timer
    startPenaltyCountdown(10); // 10 seconds to take the penalty
}

function startPenaltyCountdown(seconds) {
    gameState.countdownTimer = true;
    gameState.countdownEnd = Date.now() + seconds * 1000;
}

function determineGoalOutcome(power, direction) {
    // For now, a simple random determination with some factors
    // - Power should be optimal around 60-80% (too low or too high reduces accuracy)
    // - Direction affects difficulty (corners are harder but also harder to save)
    
    const powerFactor = power >= 40 && power <= 90 ? 0.8 : 0.5; // Optimal power range
    const directionDifficulty = Math.abs(direction) * 0.8; // Higher for corners
    
    // Calculate base probability
    let goalProbability = 0.75; // Base 75% chance
    
    // Adjust based on power
    goalProbability *= powerFactor;
    
    // Adjust based on direction (corners are harder)
    goalProbability *= (1 - directionDifficulty * 0.2);
    
    // Adjust for game difficulty
    switch (gameState.gameSettings.difficulty) {
        case 'easy':
            goalProbability += 0.1;
            break;
        case 'hard':
            goalProbability -= 0.1;
            break;
    }
    
    return Math.random() < goalProbability;
}

function determineSaveOutcome(keeperX, keeperY) {
    // For goalkeeper save, we'll:
    // 1. Choose a random spot in the goal for the AI to shoot at
    // 2. Check if the goalkeeper's position is close enough to that spot
    
    // Get goal dimensions (using simple calculations if GamePhysics is not available)
    const goal = typeof GamePhysics !== 'undefined' && GamePhysics.getGoalDimensions ? 
        GamePhysics.getGoalDimensions() : 
        {
            width: gameState.canvas.width * 0.8,
            height: gameState.canvas.width * 0.8 * 0.4, // Maintain aspect ratio
            x: (gameState.canvas.width - gameState.canvas.width * 0.8) / 2,
            y: gameState.canvas.height * 0.15
        };
    
    // Generate AI shot position (with some randomness)
    let shotX, shotY;
    
    // AI tends to shoot towards corners based on difficulty
    const cornerBias = gameState.gameSettings.difficulty === 'easy' ? 0.2 :
                       gameState.gameSettings.difficulty === 'normal' ? 0.5 : 0.8;
    
    // Determine horizontal position (prefer corners with cornerBias probability)
    if (Math.random() < cornerBias) {
        // Shoot towards corners
        shotX = Math.random() < 0.5 ? 
                goal.x + goal.width * 0.1 + Math.random() * goal.width * 0.2 : // Left corner
                goal.x + goal.width * 0.7 + Math.random() * goal.width * 0.2;  // Right corner
    } else {
        // Shoot more centrally
        shotX = goal.x + goal.width * 0.3 + Math.random() * goal.width * 0.4;
    }
    
    // Determine vertical position (prefer lower or upper part)
    if (Math.random() < cornerBias) {
        // Upper or lower part
        shotY = Math.random() < 0.5 ?
                goal.y + goal.height * 0.1 + Math.random() * goal.height * 0.2 : // Upper
                goal.y + goal.height * 0.7 + Math.random() * goal.height * 0.2;  // Lower
    } else {
        // More central height
        shotY = goal.y + goal.height * 0.3 + Math.random() * goal.height * 0.4;
    }
    
    // Calculate distance between shot and keeper position
    const distance = Math.sqrt(Math.pow(keeperX - shotX, 2) + Math.pow(keeperY - shotY, 2));
    
    // Determine save radius based on difficulty
    let saveRadius;
    switch (gameState.gameSettings.difficulty) {
        case 'easy':
            saveRadius = goal.width * 0.2;
            break;
        case 'normal':
            saveRadius = goal.width * 0.15;
            break;
        case 'hard':
            saveRadius = goal.width * 0.12;
            break;
        default:
            saveRadius = goal.width * 0.15;
    }
    
    // Return true if keeper is close enough to save
    return distance <= saveRadius;
}

function updateMatchHUD() {
    // Update scores
    updateElementText('team1-score', gameState.player.score.toString());
    updateElementText('team2-score', gameState.opponent.score.toString());
    
    // Update penalties remaining
    const penaltiesText = `${gameState.penaltiesLeft.player} - ${gameState.penaltiesLeft.opponent} penalties remaining`;
    updateElementText('penalties-remaining', penaltiesText);
}

// Helper function to safely update element text
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

function checkMatchOver() {
    // Check if all penalties are taken
    if (gameState.penaltiesLeft.player <= 0 && gameState.penaltiesLeft.opponent <= 0) {
        return true;
    }
    
    // Check if one team has an insurmountable lead
    const remainingPlayer = gameState.penaltiesLeft.player;
    const remainingOpponent = gameState.penaltiesLeft.opponent;
    
    if (gameState.player.score > gameState.opponent.score + remainingOpponent) {
        // Player has won, opponent can't catch up
        return true;
    }
    
    if (gameState.opponent.score > gameState.player.score + remainingPlayer) {
        // Opponent has won, player can't catch up
        return true;
    }
    
    // Match continues
    return false;
}

function endMatch() {
    gameState.animationInProgress = true;
    
    // Determine winner
    let result = '';
    if (gameState.player.score > gameState.opponent.score) {
        result = 'You Win!';
        
        // Play victory sound
        playSound('crowd-cheer');
        
    } else if (gameState.player.score < gameState.opponent.score) {
        result = 'You Lose';
    } else {
        result = 'Draw';
    }
    
    // Update match result screen
    updateElementText('result-title', result);
    
    // Set team names and logos
    if (gameState.player.team && gameState.opponent.team) {
        updateElementText('result-team1-name', gameState.player.team.name);
        updateElementText('result-team2-name', gameState.opponent.team.name);
        
        // Set logos if available
        const team1Logo = document.getElementById('result-team1-logo');
        const team2Logo = document.getElementById('result-team2-logo');
        
        if (team1Logo && gameState.player.team.logo) {
            team1Logo.src = gameState.player.team.logo;
        }
        
        if (team2Logo && gameState.opponent.team.logo) {
            team2Logo.src = gameState.opponent.team.logo;
        }
    }
    
    // Set scores
    updateElementText('result-team1-score', gameState.player.score.toString());
    updateElementText('result-team2-score', gameState.opponent.score.toString());
    
    // Generate match statistics
    generateMatchStatistics();
    
    // Show match result screen after a delay
    setTimeout(() => {
        switchScreen('game-container', 'match-result');
        gameState.animationInProgress = false;
    }, 2000);
    
    // Record match result if in tournament
    if (gameState.tournament && gameState.currentMatch) {
        const score1 = gameState.player.score;
        const score2 = gameState.opponent.score;
        
        if (typeof gameState.tournament.recordMatchResult === 'function') {
            gameState.tournament.recordMatchResult(gameState.currentMatch, score1, score2);
        }
    }
}

function generateMatchStatistics() {
    const statsContainer = document.getElementById('match-stats');
    if (!statsContainer) {
        console.warn('Statistics container not found');
        return;
    }
    
    // Clear existing stats
    clearElement(statsContainer);
    
    // Calculate derived stats
    const accuracy = gameState.statistics.shots > 0 ? 
                    Math.round((gameState.statistics.goals / gameState.statistics.shots) * 100) : 0;
    
    const avgPower = gameState.statistics.shots > 0 ?
                    Math.round(gameState.statistics.avgPower) : 0;
    
    // Create stats items
    const stats = [
        { label: 'Goals Scored', value: gameState.statistics.goals },
        { label: 'Shots Taken', value: gameState.statistics.shots },
        { label: 'Shot Accuracy', value: `${accuracy}%` },
        { label: 'Saves Made', value: gameState.statistics.saves },
        { label: 'Avg Shot Power', value: `${avgPower}%` }
    ];
    
    stats.forEach(stat => {
        const statItem = createElement('div', 'stat-item');
        
        const statValue = createElement('div', 'stat-value', stat.value);
        const statLabel = createElement('div', 'stat-label', stat.label);
        
        statItem.appendChild(statValue);
        statItem.appendChild(statLabel);
        statsContainer.appendChild(statItem);
    });
    
    // Generate medals based on statistics
    if (typeof MedalSystem !== 'undefined' && MedalSystem.evaluate) {
        const medals = MedalSystem.evaluate({
            goals: gameState.statistics.goals,
            shots: gameState.statistics.shots,
            saves: gameState.statistics.saves,
            avgPower: avgPower
        });
        
        // Display medals
        displayMedals(medals);
    } else {
        console.warn('MedalSystem not available');
    }
}

function displayMedals(medals) {
    const medalsContainer = document.getElementById('medals-container');
    if (!medalsContainer) return;
    
    clearElement(medalsContainer);
    
    if (!medals || medals.length === 0) return;
    
    medals.forEach(medal => {
        const medalElement = createElement('div', 'medal');
        
        const medalIcon = createElement('div', `medal-icon medal-${medal.type}`);
        medalIcon.innerHTML = '<i class="fas fa-medal"></i>';
        
        const medalName = createElement('div', 'medal-name', medal.name);
        
        medalElement.appendChild(medalIcon);
        medalElement.appendChild(medalName);
        medalsContainer.appendChild(medalElement);
    });
}

// Helper function to clear an element
function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

// Helper function to create an element with class and text
function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function populateLeaguesAndTeams() {
    console.log('Populating leagues and teams...');
    try {
        // Sample leagues data
        const leagues = [
            { id: 'league-1', name: 'Premier League', country: 'England', logo: 'assets/images/leagues/premier.png' },
            { id: 'league-2', name: 'La Liga', country: 'Spain', logo: 'assets/images/leagues/laliga.png' },
            { id: 'league-3', name: 'Bundesliga', country: 'Germany', logo: 'assets/images/leagues/bundesliga.png' },
            { id: 'league-4', name: 'Serie A', country: 'Italy', logo: 'assets/images/leagues/seriea.png' },
            { id: 'league-5', name: 'Ligue 1', country: 'France', logo: 'assets/images/leagues/ligue1.png' },
            { id: 'league-6', name: 'Eredivisie', country: 'Netherlands', logo: 'assets/images/leagues/eredivisie.png' },
            { id: 'league-7', name: 'Primeira Liga', country: 'Portugal', logo: 'assets/images/leagues/primeiraliga.png' },
            { id: 'league-8', name: 'Championship', country: 'England', logo: 'assets/images/leagues/championship.png' },
            { id: 'league-9', name: 'MLS', country: 'USA', logo: 'assets/images/leagues/mls.png' },
            { id: 'league-10', name: 'J-League', country: 'Japan', logo: 'assets/images/leagues/jleague.png' },
            { id: 'league-11', name: 'Copa Libertadores', country: 'South America', logo: 'assets/images/leagues/libertadores.png' },
            { id: 'league-12', name: 'Champions League', country: 'Europe', logo: 'assets/images/leagues/championsleague.png' }
        ];
        
        // Populate leagues grid
        const leaguesGrid = document.getElementById('leagues-grid');
        if (!leaguesGrid) {
            console.warn('Leagues grid element not found');
            return;
        }
        
        clearElement(leaguesGrid);
        
        leagues.forEach(league => {
            const leagueItem = createElement('div', 'league-item');
            leagueItem.dataset.id = league.id;
            
            const leagueLogo = document.createElement('img');
            leagueLogo.src = league.logo || 'assets/images/placeholder-logo.png';
            leagueLogo.alt = league.name;
            leagueLogo.className = 'league-logo';
            
            const leagueName = createElement('div', 'league-name', league.name);
            
            leagueItem.appendChild(leagueLogo);
            leagueItem.appendChild(leagueName);
            
            leagueItem.addEventListener('click', () => {
                // Deselect all leagues
                document.querySelectorAll('.league-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // Select this league
                leagueItem.classList.add('selected');
                
                // Populate teams for this league
                populateTeamsForLeague(league);
            });
            
            leaguesGrid.appendChild(leagueItem);
        });
        
        // Populate teams grid with all teams initially
        populateTeamsForLeague(leagues[0]);
        
        // Setup filters
        setupTeamFilters();
        
        console.log('Leagues and teams populated successfully');
    } catch (error) {
        console.error('Error populating leagues and teams:', error);
    }
}

function populateTeamsForLeague(league) {
    // Get all teams
    const teams = typeof TeamsDatabase !== 'undefined' && TeamsDatabase.getTeams ? 
                  TeamsDatabase.getTeams() : 
                  generateFallbackTeams();
    
    // Populate teams grid
    const teamsGrid = document.getElementById('teams-grid');
    if (!teamsGrid) {
        console.warn('Teams grid element not found');
        return;
    }
    
    clearElement(teamsGrid);
    
    teams.forEach(team => {
        const teamItem = createElement('div', 'team-item');
        teamItem.dataset.id = team.id;
        teamItem.dataset.country = team.country;
        teamItem.dataset.color = getMainColorName(team.colors?.primary || '#FFFFFF');
        
        const teamLogo = document.createElement('img');
        teamLogo.src = team.logo || 'assets/images/placeholder-logo.png';
        teamLogo.alt = team.name;
        teamLogo.className = 'team-logo';
        
        const teamName = createElement('div', 'team-name', team.name);
        const teamCountry = createElement('div', 'team-country', team.country);
        
        teamItem.appendChild(teamLogo);
        teamItem.appendChild(teamName);
        teamItem.appendChild(teamCountry);
        
        teamItem.addEventListener('click', () => {
            // Deselect all teams
            document.querySelectorAll('.team-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Select this team
            teamItem.classList.add('selected');
            
            // Store selected team
            gameState.player.team = team;
            
            // Enable start button
            const startButton = document.getElementById('start-game');
            if (startButton) startButton.disabled = false;
        });
        
        teamsGrid.appendChild(teamItem);
    });
}

// Generate fallback teams if TeamsDatabase is not available
function generateFallbackTeams() {
    console.log('Generating fallback teams');
    const teamList = [];
    const countries = ['England', 'Spain', 'Germany', 'Italy', 'France', 'Brazil', 'Argentina'];
    const colors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FFA500', '#800080'];
    
    for (let i = 0; i < 20; i++) {
        teamList.push({
            id: `team-${i}`,
            name: `Team ${i+1}`,
            country: countries[i % countries.length],
            colors: { 
                primary: colors[i % colors.length],
                secondary: '#FFFFFF'
            },
            logo: 'assets/images/placeholder-logo.png',
            strength: 0.5 + (i / 40)
        });
    }
    
    return teamList;
}

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

function setupTeamFilters() {
    // Get all available countries and colors
    const countries = typeof TeamsDatabase !== 'undefined' && TeamsDatabase.getAvailableCountries ? 
                     TeamsDatabase.getAvailableCountries() :
                     ['England', 'Spain', 'Germany', 'Italy', 'France', 'Brazil', 'Argentina'];
    
    const colors = typeof TeamsDatabase !== 'undefined' && TeamsDatabase.getAvailableColors ?
                   TeamsDatabase.getAvailableColors() :
                   ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'White', 'Black'];
    
    // Populate country filter
    const countryFilter = document.getElementById('country-filter');
    if (!countryFilter) {
        console.warn('Country filter element not found');
        return;
    }
    
    clearElement(countryFilter);
    
    const allCountriesOption = document.createElement('option');
    allCountriesOption.value = 'all';
    allCountriesOption.textContent = 'All Countries';
    countryFilter.appendChild(allCountriesOption);
    
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });
    
    // Populate color filter
    const colorFilter = document.getElementById('color-filter');
    if (!colorFilter) {
        console.warn('Color filter element not found');
        return;
    }
    
    clearElement(colorFilter);
    
    const allColorsOption = document.createElement('option');
    allColorsOption.value = 'all';
    allColorsOption.textContent = 'All Colors';
    colorFilter.appendChild(allColorsOption);
    
    colors.forEach(color => {
        const option = document.createElement('option');
        option.value = color.toLowerCase();
        option.textContent = color;
        colorFilter.appendChild(option);
    });
    
    // Set up filter event handlers
    countryFilter.addEventListener('change', applyTeamFilters);
    colorFilter.addEventListener('change', applyTeamFilters);
}

function applyTeamFilters() {
    const countryFilter = document.getElementById('country-filter');
    const colorFilter = document.getElementById('color-filter');
    
    if (!countryFilter || !colorFilter) {
        console.warn('Filter elements not found');
        return;
    }
    
    const countryValue = countryFilter.value;
    const colorValue = colorFilter.value;
    
    document.querySelectorAll('.team-item').forEach(teamItem => {
        const teamCountry = teamItem.dataset.country;
        const teamColor = teamItem.dataset.color;
        
        const countryMatch = countryValue === 'all' || teamCountry === countryValue;
        const colorMatch = colorValue === 'all' || teamColor === colorValue;
        
        if (countryMatch && colorMatch) {
            teamItem.style.display = 'block';
        } else {
            teamItem.style.display = 'none';
        }
    });
}

function startTournament() {
    if (!gameState.player.team) {
        alert('Please select a team first!');
        return;
    }
    
    // Get selected league
    const selectedLeagueElement = document.querySelector('.league-item.selected');
    if (!selectedLeagueElement) {
        alert('Please select a league first!');
        return;
    }
    
    const leagueId = selectedLeagueElement.dataset.id;
    const leagueName = selectedLeagueElement.querySelector('.league-name')?.textContent || 'League';
    
    // Create tournament if Tournament class exists
    if (typeof Tournament === 'function') {
        try {
            gameState.tournament = new Tournament(
                { id: leagueId, name: leagueName },
                gameState.player.team
            );
            
            gameState.tournament.initialize();
            
            // Show tournament progress screen
            switchScreen('tournament-setup', 'tournament-progress');
            
            // Update tournament progress view
            updateTournamentView();
        } catch (error) {
            console.error('Error creating tournament:', error);
            alert('There was an error starting the tournament. Please try again.');
        }
    } else {
        console.warn('Tournament class not available, setting up quick match instead');
        setupQuickMatch();
    }
}

function setupQuickMatch() {
    console.log('Setting up quick match...');
    
    // Select random teams
    let teams;
    if (typeof TeamsDatabase !== 'undefined' && TeamsDatabase.getTeams) {
        teams = TeamsDatabase.getTeams();
    } else {
        teams = generateFallbackTeams();
    }
    
    const randomTeams = [...teams].sort(() => Math.random() - 0.5).slice(0, 2);
    
    gameState.player.team = randomTeams[0];
    gameState.opponent.team = randomTeams[1];
    
    // Reset match state
    resetMatchState();
    
    // Start the match
    switchScreen('main-menu', 'game-container');
    startMatch();
}

function resetMatchState() {
    gameState.player.score = 0;
    gameState.opponent.score = 0;
    gameState.penaltiesLeft = {
        player: 5,
        opponent: 5
    };
    gameState.currentPenalty = {
        power: 0,
        direction: 0,
        height: 0.5,
        isCharging: false
    };
    gameState.animationInProgress = false;
    gameState.statistics = {
        shots: 0,
        goals: 0,
        saves: 0,
        perfectShots: 0,
        diveLength: 0,
        avgPower: 0,
        totalPower: 0
    };
    
    console.log('Match state reset');
}

function startMatch() {
    // Update team info in HUD
    if (gameState.player.team && gameState.opponent.team) {
        updateElementText('team1-name', gameState.player.team.name);
        updateElementText('team2-name', gameState.opponent.team.name);
        
        // Update team logos if available
        const team1Logo = document.getElementById('team1-logo');
        const team2Logo = document.getElementById('team2-logo');
        
        if (team1Logo && gameState.player.team.logo) {
            team1Logo.src = gameState.player.team.logo;
        }
        
        if (team2Logo && gameState.opponent.team.logo) {
            team2Logo.src = gameState.opponent.team.logo;
        }
    }
    
    // Reset scores
    updateElementText('team1-score', '0');
    updateElementText('team2-score', '0');
    
    // Show tournament phase if applicable
    let phaseText = 'Friendly Match';
    if (gameState.tournament && typeof gameState.tournament.getCurrentStageDisplay === 'function') {
        phaseText = gameState.tournament.getCurrentStageDisplay();
    }
    updateElementText('tournament-phase', phaseText);
    
    // Set penalties remaining
    updateElementText('penalties-remaining', '5 - 5 penalties remaining');
    
    // Start with player shooting
    switchPenaltyPhase('shoot');
    
    // Play whistle sound
    playSound('whistle');
    
    console.log('Match started');
}

function resetGameView() {
    // Reset game canvas and prepare for new match
    if (gameState.canvas) {
        // Re-initialize physics with current canvas dimensions
        if (typeof GamePhysics !== 'undefined' && GamePhysics.initialize) {
            GamePhysics.initialize(gameState.canvas.width, gameState.canvas.height);
        }
    }
}

function togglePause() {
    console.log('Toggling pause menu');
    const pauseMenu = document.getElementById('pause-menu');
    if (!pauseMenu) {
        console.warn('Pause menu element not found');
        return;
    }
    
    if (pauseMenu.classList.contains('hidden')) {
        pauseMenu.classList.remove('hidden');
    } else {
        pauseMenu.classList.add('hidden');
    }
}

function resumeGame() {
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
        pauseMenu.classList.add('hidden');
    }
    console.log('Game resumed');
}

function restartMatch() {
    resetMatchState();
    
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
        pauseMenu.classList.add('hidden');
    }
    
    startMatch();
    console.log('Match restarted');
}

function quitToMenu() {
    console.log('Quitting to main menu');
    
    // Hide all game screens
    document.querySelectorAll('.screen').forEach(screen => {
        if (screen.id !== 'main-menu') {
            screen.classList.add('hidden');
        }
    });
    
    // Hide game container
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.classList.add('hidden');
    }
    
    // Hide pause menu if visible
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
        pauseMenu.classList.add('hidden');
    }
    
    // Show main menu
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
        mainMenu.classList.remove('hidden');
    }
    
    // Reset game state
    gameState.currentScreen = 'main-menu';
    gameState.tournament = null;
    resetMatchState();
    
    // Play menu music
    playMenuMusic();
}

function continueToNextMatch() {
    switchScreen('match-result', 'tournament-progress');
    updateTournamentView();
}

function updateTournamentView() {
    if (!gameState.tournament) {
        console.warn('Tournament not initialized');
        return;
    }
    
    // Update tournament stage title
    const tournamentTitle = gameState.tournament.getCurrentStageDisplay ? 
                          gameState.tournament.getCurrentStageDisplay() : 
                          'Tournament';
    updateElementText('tournament-stage-title', tournamentTitle);
        // Get bracket element
        const bracketElement = document.getElementById('tournament-bracket');
        if (!bracketElement) {
            console.warn('Tournament bracket element not found');
            return;
        }
        
        clearElement(bracketElement);
        
        // Show different views based on current stage
        if (gameState.tournament.currentStage === 'group') {
            renderGroupsView(bracketElement);
        } else {
            renderKnockoutView(bracketElement);
        }
        
        console.log('Tournament view updated');
    }
    
    function renderGroupsView(container) {
        if (!gameState.tournament || !gameState.tournament.groups) {
            console.warn('Tournament groups not available');
            return;
        }
        
        const groupContainer = createElement('div', 'group-container');
        
        gameState.tournament.groups.forEach((group, index) => {
            const groupElement = createElement('div', 'group');
            const groupHeader = createElement('div', 'group-header', `Group ${group.name}`);
            
            const table = document.createElement('table');
            table.className = 'group-table';
            
            // Headers
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'Pts'].forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Rows
            const tbody = document.createElement('tbody');
            group.standings.forEach(standing => {
                const row = document.createElement('tr');
                
                // Highlight player team
                if (gameState.tournament.isPlayerTeam && gameState.tournament.isPlayerTeam(standing.team)) {
                    row.classList.add('player-team');
                }
                
                // Team name
                const teamCell = document.createElement('td');
                teamCell.textContent = standing.team.name;
                row.appendChild(teamCell);
                
                // Stats
                [
                    standing.played,
                    standing.won,
                    standing.drawn,
                    standing.lost,
                    standing.goalsFor,
                    standing.goalsAgainst,
                    standing.points
                ].forEach(stat => {
                    const cell = document.createElement('td');
                    cell.textContent = stat;
                    row.appendChild(cell);
                });
                
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            
            groupElement.appendChild(groupHeader);
            groupElement.appendChild(table);
            groupContainer.appendChild(groupElement);
        });
        
        container.appendChild(groupContainer);
    }
    
    function renderKnockoutView(container) {
        if (!gameState.tournament || !gameState.tournament.knockout) {
            console.warn('Tournament knockout data not available');
            return;
        }
        
        const knockoutContainer = createElement('div', 'knockout-stage');
        
        // Create bracket based on current stage
        const bracketContainer = createElement('div', 'bracket-container');
        
        if (gameState.tournament.currentStage === 'round16') {
            renderBracketRound(bracketContainer, 'Round of 16', gameState.tournament.knockout.roundOf16);
        } else if (gameState.tournament.currentStage === 'quarter') {
            renderBracketRound(bracketContainer, 'Round of 16', gameState.tournament.knockout.roundOf16);
            renderBracketRound(bracketContainer, 'Quarter Finals', gameState.tournament.knockout.quarterFinals);
        } else if (gameState.tournament.currentStage === 'semi') {
            renderBracketRound(bracketContainer, 'Quarter Finals', gameState.tournament.knockout.quarterFinals);
            renderBracketRound(bracketContainer, 'Semi Finals', gameState.tournament.knockout.semiFinals);
        } else if (gameState.tournament.currentStage === 'final') {
            renderBracketRound(bracketContainer, 'Semi Finals', gameState.tournament.knockout.semiFinals);
            renderBracketRound(bracketContainer, 'Final', gameState.tournament.knockout.final);
        }
        
        knockoutContainer.appendChild(bracketContainer);
        container.appendChild(knockoutContainer);
    }
    
    function renderBracketRound(container, title, matches) {
        if (!matches) {
            console.warn(`Matches not available for ${title}`);
            return;
        }
        
        const roundContainer = createElement('div', 'bracket-round');
        const roundTitle = createElement('div', 'bracket-round-title', title);
        roundContainer.appendChild(roundTitle);
        
        matches.forEach(match => {
            const matchElement = createElement('div', 'bracket-match');
            
            // Team 1
            const team1Element = createElement('div', 'bracket-team');
            
            // Highlight player team
            if (gameState.tournament && gameState.tournament.isPlayerTeam && 
                gameState.tournament.isPlayerTeam(match.team1)) {
                team1Element.classList.add('player-team');
            }
            
            const team1Logo = document.createElement('img');
            team1Logo.src = match.team1.logo || 'assets/images/placeholder-logo.png';
            team1Logo.className = 'bracket-team-logo';
            team1Element.appendChild(team1Logo);
            
            const team1Name = createElement('div', 'bracket-team-name', match.team1.name);
            team1Element.appendChild(team1Name);
            
            if (match.played) {
                const team1Score = createElement('div', 'bracket-score', match.score1);
                team1Element.appendChild(team1Score);
                
                // Mark winner
                if (match.score1 > match.score2) {
                    team1Element.classList.add('bracket-winner');
                }
            }
            
            // Team 2
            const team2Element = createElement('div', 'bracket-team');
            
            // Highlight player team
            if (gameState.tournament && gameState.tournament.isPlayerTeam && 
                gameState.tournament.isPlayerTeam(match.team2)) {
                team2Element.classList.add('player-team');
            }
            
            const team2Logo = document.createElement('img');
            team2Logo.src = match.team2.logo || 'assets/images/placeholder-logo.png';
            team2Logo.className = 'bracket-team-logo';
            team2Element.appendChild(team2Logo);
            
            const team2Name = createElement('div', 'bracket-team-name', match.team2.name);
            team2Element.appendChild(team2Name);
            
            if (match.played) {
                const team2Score = createElement('div', 'bracket-score', match.score2);
                team2Element.appendChild(team2Score);
                
                // Mark winner
                if (match.score2 > match.score1) {
                    team2Element.classList.add('bracket-winner');
                }
            }
            
            matchElement.appendChild(team1Element);
            matchElement.appendChild(team2Element);
            
            roundContainer.appendChild(matchElement);
        });
        
        container.appendChild(roundContainer);
    }
    
    function goToNextMatch() {
        if (!gameState.tournament) {
            console.warn('Tournament not initialized');
            return;
        }
        
        // Get next match from tournament
        const nextMatch = gameState.tournament.getNextMatch ? gameState.tournament.getNextMatch() : null;
        if (!nextMatch) {
            // Tournament complete!
            if (gameState.tournament.winner) {
                showTrophyScreen();
            } else {
                alert('No more matches available!');
            }
            return;
        }
        
        // Set up teams for the match
        gameState.player.team = nextMatch.team1;
        gameState.opponent.team = nextMatch.team2;
        gameState.currentMatch = nextMatch;
        
        // Reset match state and start
        resetMatchState();
        switchScreen('tournament-progress', 'game-container');
        startMatch();
        
        console.log('Starting next tournament match');
    }
    
    function toggleGroupsView() {
        // Toggle between showing groups or knockout stage
        const bracketElement = document.getElementById('tournament-bracket');
        if (!bracketElement) {
            console.warn('Tournament bracket element not found');
            return;
        }
        
        clearElement(bracketElement);
        
        if (bracketElement.dataset.view === 'groups') {
            bracketElement.dataset.view = 'knockout';
            renderKnockoutView(bracketElement);
            
            const viewGroupsButton = document.getElementById('view-groups');
            if (viewGroupsButton) {
                viewGroupsButton.textContent = 'View Groups';
            }
        } else {
            bracketElement.dataset.view = 'groups';
            renderGroupsView(bracketElement);
            
            const viewGroupsButton = document.getElementById('view-groups');
            if (viewGroupsButton) {
                viewGroupsButton.textContent = 'View Bracket';
            }
        }
    }
    
    function showTrophyScreen() {
        if (!gameState.tournament || !gameState.tournament.winner) {
            console.warn('Tournament winner not available');
            return;
        }
        
        const winner = gameState.tournament.winner;
        
        // Update trophy screen with winner info
        updateElementText('champion-team-name', winner.name);
        updateElementText('champion-league-name', 
            `${gameState.tournament.league.name} Champion`);
        
        // Show trophy screen
        switchScreen('tournament-progress', 'trophy-screen');
        
        // Play victory music
        playSound('victory-music', 0.7);
        
        // Unlock achievement if player won
        if (gameState.tournament.isPlayerTeam && gameState.tournament.isPlayerTeam(winner) && 
            typeof Achievements !== 'undefined' && Achievements.unlock) {
            Achievements.unlock('champion');
        }
        
        console.log('Trophy screen displayed for winner:', winner.name);
    }
    
    // Enable debug mode with keyboard shortcut Ctrl+Shift+D
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.shiftKey && event.key === 'D') {
            gameState.debugMode = !gameState.debugMode;
            console.log('Debug mode:', gameState.debugMode ? 'enabled' : 'disabled');
        }
    });
    
    // Export any functions that need to be accessed globally
    window.PenaltyShooters = {
        resetGame: function() {
            resetMatchState();
            switchScreen(gameState.currentScreen, 'main-menu');
        },
        
        forceCompleteLoading: function() {
            completeLoading();
        },
        
        getGameState: function() {
            return {...gameState};
        },
        
        toggleDebug: function() {
            gameState.debugMode = !gameState.debugMode;
            return gameState.debugMode;
        }
    };
    
    console.log('Penalty Shooters 2 - Game engine initialized');