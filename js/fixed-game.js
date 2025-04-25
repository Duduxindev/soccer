/**
 * Penalty Shooters 2 - Advanced Version
 * Features:
 * - Front view perspective
 * - Keyboard controls (A/D for horizontal, W/S for vertical)
 * - Shot prediction indicators
 * - Evolutionary AI system
 * - Character models for players and goalkeepers
 */

// Global game state
const gameState = {
  isLoading: true,
  currentScreen: 'loading',
  tournament: null,
  currentMatch: null,
  player: {
      team: null,
      score: 0,
      character: {
          model: 'default',
          position: { x: 0, y: 0, z: 0 },
          rotation: 0,
          animation: 'idle'
      }
  },
  opponent: {
      team: null,
      score: 0,
      character: {
          model: 'default',
          position: { x: 0, y: 0, z: 0 },
          rotation: 0,
          animation: 'idle'
      }
  },
  goalkeeper: {
      position: { x: 0, y: 0 },
      targetPosition: { x: 0, y: 0 },
      diving: false,
      animation: 'ready'
  },
  penaltyPhase: 'shoot', // 'shoot' or 'save'
  penaltiesLeft: {
      player: 5,
      opponent: 5
  },
  currentPenalty: {
      power: 0,
      direction: { x: 0, y: 0.5 },  // Normalized coordinates (-1 to 1 for x, 0 to 1 for y)
      arrow: {
          visible: true,
          position: { x: 0, y: 0 },
          angle: 0
      },
      prediction: {
          visible: false,
          position: { x: 0, y: 0 }
      },
      isCharging: false
  },
  camera: {
      view: 'front', // 'front' for new perspective
      position: { x: 0, y: 1.7, z: 5 },  // Camera positioning in 3D space
      target: { x: 0, y: 1.2, z: 0 }     // Where camera is looking
  },
  controls: {
      keyboard: {
          left: false,      // A key
          right: false,     // D key
          up: false,        // W key
          down: false,      // S key
          space: false,     // Spacebar (shoot/dive)
          shift: false      // Shift (power modifier)
      },
      mouse: {
          x: 0,
          y: 0,
          down: false
      },
      touch: {
          x: 0,
          y: 0,
          active: false
      }
  },
  animationInProgress: false,
  gameSettings: {
      sound: true,
      music: true,
      difficulty: 'normal',
      tutorialShown: false,
      aiLearningRate: 0.05  // How quickly AI adapts
  },
  statistics: {
      shots: 0,
      goals: 0,
      saves: 0,
      perfectShots: 0,
      diveLength: 0,
      avgPower: 0,
      totalPower: 0,
      playerPatterns: [],   // Records player shooting patterns
      aiSuccess: 0,         // Tracks AI success rate for learning
      aiAttempts: 0
  },
  evolutionaryAI: {
      initialized: false,
      weights: {
          cornerPreference: 0.5,    // AI tendency to aim for corners
          heightVariation: 0.5,     // AI variation in shot height
          patternRecognition: 0.3,  // How much AI recognizes player patterns
          randomFactor: 0.2         // Unpredictability factor
      },
      playerModel: {
          topLeft: 0,      // Frequency counts of player's shot locations
          topCenter: 0,
          topRight: 0,
          middleLeft: 0,
          middleCenter: 0,
          middleRight: 0,
          bottomLeft: 0,
          bottomCenter: 0,
          bottomRight: 0
      },
      lastDecisions: []    // Record of recent AI decisions
  },
  canvas: null,
  ctx: null,
  assets: {
      images: {},
      audio: {},
      models: {},          // 3D models for characters
      loaded: 0,
      total: 0
  },
  debug: {
      enabled: false,
      showHitboxes: false,
      showAIStats: false
  }
};

// ================ INITIALIZATION FUNCTIONS ================

// Game initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded. Initializing game...');
  initializeGame();
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
  
  // Initialize evolutionary AI
  initializeEvolutionaryAI();
  
  // Load game assets
  loadAssets();
  
  // Set up event listeners
  setupEventListeners();
  
  // Log init completion
  console.log('Game initialization completed');
}

function initializeEvolutionaryAI() {
  // Initialize AI with saved weights if available
  try {
      const savedAI = localStorage.getItem('penaltyShootersAI');
      if (savedAI) {
          const parsedAI = JSON.parse(savedAI);
          gameState.evolutionaryAI.weights = parsedAI.weights || gameState.evolutionaryAI.weights;
          gameState.evolutionaryAI.playerModel = parsedAI.playerModel || gameState.evolutionaryAI.playerModel;
          console.log('Loaded evolutionary AI data from storage');
      }
  } catch (error) {
      console.warn('Could not load AI data from storage:', error);
  }
  
  gameState.evolutionaryAI.initialized = true;
  console.log('Evolutionary AI system initialized');
}

function resizeCanvas() {
  if (!gameState.canvas) return;
  
  gameState.canvas.width = window.innerWidth;
  gameState.canvas.height = window.innerHeight;
  
  // Calculate field dimensions based on canvas size
  gameState.fieldDimensions = {
      width: gameState.canvas.width * 0.8,
      height: gameState.canvas.height * 0.8,
      x: (gameState.canvas.width - gameState.canvas.width * 0.8) / 2,
      y: (gameState.canvas.height - gameState.canvas.height * 0.8) / 2
  };
  
  // Calculate goal dimensions
  gameState.goalDimensions = {
      width: gameState.canvas.width * 0.4,
      height: gameState.canvas.width * 0.15,
      x: (gameState.canvas.width - gameState.canvas.width * 0.4) / 2,
      y: gameState.canvas.height * 0.2
  };
  
  console.log(`Canvas resized to ${gameState.canvas.width}x${gameState.canvas.height}`);
}

function loadAssets() {
  // Define assets to load
  const assetsToLoad = {
      images: {
          'stadium': 'assets/images/stadium-front.jpg',
          'goal': 'assets/images/goal-front.png',
          'ball': 'assets/images/ball.png',
          'goalkeeper-ready': 'assets/images/goalkeeper-ready.png',
          'goalkeeper-dive-left': 'assets/images/goalkeeper-dive-left.png',
          'goalkeeper-dive-right': 'assets/images/goalkeeper-dive-right.png',
          'goalkeeper-dive-center': 'assets/images/goalkeeper-dive-center.png',
          'player-ready': 'assets/images/player-ready.png',
          'player-kick': 'assets/images/player-kick.png',
          'arrow-indicator': 'assets/images/arrow-indicator.png',
          'prediction-marker': 'assets/images/prediction-marker.png',
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

// ================ EVENT LISTENERS ================

function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Window resize
  window.addEventListener('resize', resizeCanvas);
  
  // Button click events - Adding error handling
  safeAddClickListener('start-tournament', () => switchScreen('main-menu', 'tournament-setup'));
  safeAddClickListener('quick-match', setupQuickMatch);
  safeAddClickListener('customize', () => switchScreen('main-menu', 'customize-screen'));
  safeAddClickListener('options', () => switchScreen('main-menu', 'options-screen'));
  safeAddClickListener('tutorial', () => switchScreen('main-menu', 'tutorial-screen'));
  
  safeAddClickListener('tutorial-done', () => switchScreen('tutorial-screen', 'main-menu'));
  
  safeAddClickListener('back-to-menu', () => switchScreen('tournament-setup', 'main-menu'));
  safeAddClickListener('start-game', startTournament);
  
  // Fixed pause button logic
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
  
  // Keyboard controls
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  
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

function handleKeyDown(e) {
  if (gameState.currentScreen !== 'game-container' || gameState.animationInProgress) return;
  
  switch(e.key.toLowerCase()) {
      case 'a':
          gameState.controls.keyboard.left = true;
          break;
      case 'd':
          gameState.controls.keyboard.right = true;
          break;
      case 'w':
          gameState.controls.keyboard.up = true;
          break;
      case 's':
          gameState.controls.keyboard.down = true;
          break;
      case ' ':
          gameState.controls.keyboard.space = true;
          if (!gameState.currentPenalty.isCharging) {
              gameState.currentPenalty.isCharging = true;
              startPenaltyCharge();
          }
          break;
      case 'shift':
          gameState.controls.keyboard.shift = true;
          break;
  }
  
  updateDirectionFromKeyboard();
}

function handleKeyUp(e) {
  if (gameState.currentScreen !== 'game-container') return;
  
  switch(e.key.toLowerCase()) {
      case 'a':
          gameState.controls.keyboard.left = false;
          break;
      case 'd':
          gameState.controls.keyboard.right = false;
          break;
      case 'w':
          gameState.controls.keyboard.up = false;
          break;
      case 's':
          gameState.controls.keyboard.down = false;
          break;
      case ' ':
          gameState.controls.keyboard.space = false;
          if (gameState.currentPenalty.isCharging) {
              gameState.currentPenalty.isCharging = false;
              if (gameState.penaltyPhase === 'shoot') {
                  executeShot();
              } else {
                  executeSave();
              }
          }
          break;
      case 'shift':
          gameState.controls.keyboard.shift = false;
          break;
  }
  
  updateDirectionFromKeyboard();
}

function updateDirectionFromKeyboard() {
  // Only update if using keyboard controls
  if (!gameState.controls.keyboard.left && 
      !gameState.controls.keyboard.right && 
      !gameState.controls.keyboard.up && 
      !gameState.controls.keyboard.down) return;
  
  // Calculate direction based on keyboard input
  let dirX = 0;
  let dirY = 0.5; // Default to middle height
  
  if (gameState.controls.keyboard.left) dirX -= 0.02;
  if (gameState.controls.keyboard.right) dirX += 0.02;
  if (gameState.controls.keyboard.up) dirY -= 0.02;
  if (gameState.controls.keyboard.down) dirY += 0.02;
  
  // Ensure values stay within bounds (-1 to 1 for x, 0 to 1 for y)
  gameState.currentPenalty.direction.x = Math.max(-1, Math.min(1, gameState.currentPenalty.direction.x + dirX));
  gameState.currentPenalty.direction.y = Math.max(0, Math.min(1, gameState.currentPenalty.direction.y + dirY));
  
  // Update arrow indicator
  updateShotArrow();
}

function handleMouseDown(e) {
  if (gameState.currentScreen !== 'game-container' || gameState.animationInProgress) return;
  
  const rect = gameState.canvas.getBoundingClientRect();
  gameState.controls.mouse.x = e.clientX - rect.left;
  gameState.controls.mouse.y = e.clientY - rect.top;
  gameState.controls.mouse.down = true;
  
  // Convert mouse position to normalized goal coordinates
  const normalizedPos = convertToNormalizedPosition(
      gameState.controls.mouse.x, 
      gameState.controls.mouse.y
  );
  
  // Update shot or save direction
  gameState.currentPenalty.direction.x = normalizedPos.x;
  gameState.currentPenalty.direction.y = normalizedPos.y;
  
  if (!gameState.currentPenalty.isCharging) {
      gameState.currentPenalty.isCharging = true;
      startPenaltyCharge();
  }
  
  // Update arrow indicator
  updateShotArrow();
}

function handleMouseMove(e) {
  if (gameState.currentScreen !== 'game-container') return;
  
  const rect = gameState.canvas.getBoundingClientRect();
  gameState.controls.mouse.x = e.clientX - rect.left;
  gameState.controls.mouse.y = e.clientY - rect.top;
  
  if (gameState.controls.mouse.down) {
      // Convert mouse position to normalized goal coordinates
      const normalizedPos = convertToNormalizedPosition(
          gameState.controls.mouse.x, 
          gameState.controls.mouse.y
      );
      
      // Update shot or save direction
      gameState.currentPenalty.direction.x = normalizedPos.x;
      gameState.currentPenalty.direction.y = normalizedPos.y;
      
      // Update arrow indicator
      updateShotArrow();
  }
}

function handleMouseUp(e) {
  if (gameState.currentScreen !== 'game-container' || !gameState.controls.mouse.down) return;
  
  gameState.controls.mouse.down = false;
  
  if (gameState.currentPenalty.isCharging) {
      gameState.currentPenalty.isCharging = false;
      
      if (gameState.penaltyPhase === 'shoot') {
          executeShot();
      } else if (gameState.penaltyPhase === 'save') {
          executeSave();
      }
  }
}

// Touch event handlers for mobile
function handleTouchStart(e) {
  e.preventDefault();
  
  if (gameState.currentScreen !== 'game-container' || gameState.animationInProgress) return;
  
  const touch = e.touches[0];
  const rect = gameState.canvas.getBoundingClientRect();
  
  gameState.controls.touch.x = touch.clientX - rect.left;
  gameState.controls.touch.y = touch.clientY - rect.top;
  gameState.controls.touch.active = true;
  
  // Convert touch position to normalized goal coordinates
  const normalizedPos = convertToNormalizedPosition(
      gameState.controls.touch.x, 
      gameState.controls.touch.y
  );
  
  // Update shot or save direction
  gameState.currentPenalty.direction.x = normalizedPos.x;
  gameState.currentPenalty.direction.y = normalizedPos.y;
  
  if (!gameState.currentPenalty.isCharging) {
      gameState.currentPenalty.isCharging = true;
      startPenaltyCharge();
  }
  
  // Update arrow indicator
  updateShotArrow();
}

function handleTouchMove(e) {
  e.preventDefault();
  
  if (gameState.currentScreen !== 'game-container' || !gameState.controls.touch.active) return;
  
  const touch = e.touches[0];
  const rect = gameState.canvas.getBoundingClientRect();
  
  gameState.controls.touch.x = touch.clientX - rect.left;
  gameState.controls.touch.y = touch.clientY - rect.top;
  
  // Convert touch position to normalized goal coordinates
  const normalizedPos = convertToNormalizedPosition(
      gameState.controls.touch.x, 
      gameState.controls.touch.y
  );
  
  // Update shot or save direction
  gameState.currentPenalty.direction.x = normalizedPos.x;
  gameState.currentPenalty.direction.y = normalizedPos.y;
  
  // Update arrow indicator
  updateShotArrow();
}

function handleTouchEnd(e) {
  e.preventDefault();
  
  if (gameState.currentScreen !== 'game-container' || !gameState.controls.touch.active) return;
  
  gameState.controls.touch.active = false;
  
  if (gameState.currentPenalty.isCharging) {
      gameState.currentPenalty.isCharging = false;
      
      if (gameState.penaltyPhase === 'shoot') {
          executeShot();
      } else if (gameState.penaltyPhase === 'save') {
          executeSave();
      }
  }
}

function convertToNormalizedPosition(x, y) {
  // Convert canvas coordinates to normalized goal coordinates
  // Goal area is defined as a rectangle within the canvas
  const goal = gameState.goalDimensions;
  
  // Check if point is within goal bounds
  let normalizedX, normalizedY;
  
  if (x < goal.x) {
      normalizedX = -1; // Left of goal
  } else if (x > goal.x + goal.width) {
      normalizedX = 1;  // Right of goal
  } else {
      // Convert to range -1 to 1
      normalizedX = (2 * (x - goal.x) / goal.width) - 1;
  }
  
  if (y < goal.y) {
      normalizedY = 0; // Above goal (top of goal)
  } else if (y > goal.y + goal.height) {
      normalizedY = 1;  // Below goal (bottom of goal)
  } else {
      // Convert to range 0 to 1 (0 = top, 1 = bottom)
      normalizedY = (y - goal.y) / goal.height;
  }
  
  return { x: normalizedX, y: normalizedY };
}

// ================ GAME LOOP & RENDERING ================

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
      const goal = gameState.goalDimensions;
      
      gameState.ctx.drawImage(
          gameState.assets.images['goal'],
          goal.x, goal.y,
          goal.width, goal.height
      );
  }
  
  // Draw goalkeeper
  renderGoalkeeper();
  
  // Draw player
  if (gameState.penaltyPhase === 'shoot') {
      renderPlayer();
  }
  
  // Draw ball
  renderBall();
  
  // Draw shot arrow indicator if in shooting phase and charging
  if (gameState.penaltyPhase === 'shoot' && gameState.currentPenalty.isCharging) {
      renderShotArrow();
  }
  
  // Draw goalkeeper prediction indicator if in save phase
  if (gameState.penaltyPhase === 'save' && gameState.currentPenalty.prediction.visible) {
      renderPredictionMarker();
  }
  
  // Draw power meter if charging
  if (gameState.currentPenalty.isCharging) {
      renderPowerMeter();
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
  
  // Draw controls help
  renderControlsHelp();
  
  // Draw debug info if enabled
  if (gameState.debug.enabled) {
      drawDebugInfo();
  }
}

function renderGoalkeeper() {
  const goal = gameState.goalDimensions;
  const keeperWidth = goal.width * 0.3;
  const keeperHeight = goal.height * 1.2;
  
  // Calculate keeper position based on normalized coordinates
  let keeperX = goal.x + goal.width/2 - keeperWidth/2; // Default center
  let keeperImage = gameState.assets.images['goalkeeper-ready'];
  
  if (gameState.goalkeeper.diving) {
      const normalizedX = gameState.currentPenalty.direction.x;
      
      // Choose appropriate diving image based on direction
      if (normalizedX < -0.3) {
          keeperImage = gameState.assets.images['goalkeeper-dive-left'];
          keeperX = goal.x + (goal.width * 0.2) - keeperWidth/2;
      } else if (normalizedX > 0.3) {
          keeperImage = gameState.assets.images['goalkeeper-dive-right'];
          keeperX = goal.x + (goal.width * 0.8) - keeperWidth/2;
      } else {
          keeperImage = gameState.assets.images['goalkeeper-dive-center'];
      }
  }
  
  const keeperY = goal.y + goal.height - keeperHeight + (goal.height * 0.2);
  
  if (keeperImage) {
      gameState.ctx.drawImage(
          keeperImage,
          keeperX, keeperY,
          keeperWidth, keeperHeight
      );
  }
}

function renderPlayer() {
  const goal = gameState.goalDimensions;
  const playerWidth = goal.width * 0.2;
  const playerHeight = goal.height * 1.5;
  
  // Position player at bottom center of screen, in front of goal
  const playerX = gameState.canvas.width/2 - playerWidth/2;
  const playerY = gameState.canvas.height * 0.7 - playerHeight;
  
  let playerImage;
  if (gameState.currentPenalty.isCharging) {
      playerImage = gameState.assets.images['player-ready'];
  } else {
      playerImage = gameState.assets.images['player-kick'];
  }
  
  if (playerImage) {
      gameState.ctx.drawImage(
          playerImage,
          playerX, playerY,
          playerWidth, playerHeight
      );
  }
}

function renderBall() {
  if (!gameState.assets.images['ball']) return;
  
  const goal = gameState.goalDimensions;
  const ballSize = goal.width * 0.08;
  
  // Default ball position (at player's feet)
  let ballX, ballY;
  
  if (gameState.penaltyPhase === 'shoot') {
      ballX = gameState.canvas.width/2 - ballSize/2;
      ballY = gameState.canvas.height * 0.7 - ballSize * 1.2;
  } else {
      // During save phase, position ball at penalty spot
      ballX = gameState.canvas.width/2 - ballSize/2;
      ballY = gameState.canvas.height * 0.6;
  }
  
  // If ball is in motion, use the ball animation position
  if (gameState.ballAnimation) {
      ballX = gameState.ballAnimation.x - ballSize/2;
      ballY = gameState.ballAnimation.y - ballSize/2;
  }
  
  gameState.ctx.drawImage(
      gameState.assets.images['ball'],
      ballX, ballY,
      ballSize, ballSize
  );
}

function renderShotArrow() {
  if (!gameState.assets.images['arrow-indicator'] || !gameState.currentPenalty.arrow.visible) return;
  
  const goal = gameState.goalDimensions;
  const arrowWidth = goal.width * 0.2;
  const arrowHeight = arrowWidth * 0.5;
  
  // Calculate arrow position at player's feet
  const arrowX = gameState.canvas.width/2 - arrowWidth/2;
  const arrowY = gameState.canvas.height * 0.65;
  
  // Calculate arrow angle based on direction
  const angle = Math.atan2(
      goal.y + (goal.height * gameState.currentPenalty.direction.y) - arrowY,
      goal.x + (goal.width * (gameState.currentPenalty.direction.x + 1) / 2) - arrowX
  );
  
  // Save context state
  gameState.ctx.save();
  
  // Translate to arrow center point for rotation
  gameState.ctx.translate(
      arrowX + arrowWidth/2,
      arrowY + arrowHeight/2
  );
  
  // Rotate context
  gameState.ctx.rotate(angle);
  
  // Draw arrow (adjusted for rotation around center)
  gameState.ctx.drawImage(
      gameState.assets.images['arrow-indicator'],
      -arrowWidth/2, -arrowHeight/2,
      arrowWidth, arrowHeight
  );
  
  // Restore context
  gameState.ctx.restore();
  
  // Store arrow data for other functions
  gameState.currentPenalty.arrow.position = { x: arrowX, y: arrowY };
  gameState.currentPenalty.arrow.angle = angle;
}

function renderPredictionMarker() {
  if (!gameState.assets.images['prediction-marker']) return;
  
  const goal = gameState.goalDimensions;
  const markerSize = goal.width * 0.08;
  
  // Calculate position based on AI prediction
  const markerX = goal.x + (goal.width * (gameState.currentPenalty.prediction.position.x + 1) / 2) - markerSize/2;
  const markerY = goal.y + (goal.height * gameState.currentPenalty.prediction.position.y) - markerSize/2;
  
  // Draw prediction marker with pulsing effect
  const opacity = 0.5 + 0.5 * Math.sin(Date.now() / 200);
  gameState.ctx.globalAlpha = opacity;
  
  gameState.ctx.drawImage(
      gameState.assets.images['prediction-marker'],
      markerX, markerY,
      markerSize, markerSize
  );
  
  // Reset global alpha
  gameState.ctx.globalAlpha = 1.0;
}

function renderPowerMeter() {
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
  
  // Optimal power indicator
  const optimalMin = meterHeight * 0.4;
  const optimalMax = meterHeight * 0.8;
  gameState.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  gameState.ctx.setLineDash([5, 5]);
  
  // Minimum optimal line
  gameState.ctx.beginPath();
  gameState.ctx.moveTo(meterX, meterY + meterHeight - optimalMin);
  gameState.ctx.lineTo(meterX + meterWidth, meterY + meterHeight - optimalMin);
  gameState.ctx.stroke();
  
  // Maximum optimal line
  gameState.ctx.beginPath();
  gameState.ctx.moveTo(meterX, meterY + meterHeight - optimalMax);
  gameState.ctx.lineTo(meterX + meterWidth, meterY + meterHeight - optimalMax);
  gameState.ctx.stroke();
  
  // Reset line dash
  gameState.ctx.setLineDash([]);
}

function renderControlsHelp() {
  const instructions = gameState.penaltyPhase === 'shoot' ?
      "A/D - Move Left/Right | W/S - Adjust Height | SPACE - Charge/Shoot" :
      "A/D - Move Left/Right | W/S - Jump Height | SPACE - Dive";
  
  gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  gameState.ctx.fillRect(0, gameState.canvas.height - 30, gameState.canvas.width, 30);
  
  gameState.ctx.font = '14px Arial';
  gameState.ctx.fillStyle = 'white';
  gameState.ctx.textAlign = 'center';
  gameState.ctx.fillText(
      instructions,
      gameState.canvas.width / 2,
      gameState.canvas.height - 10
  );
}

function drawDebugInfo() {
  const panelWidth = 300;
  const panelHeight = 210;
  const padding = 10;
  
  // Background for debug info
  gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  gameState.ctx.fillRect(10, 10, panelWidth, panelHeight);
  gameState.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  gameState.ctx.strokeRect(10, 10, panelWidth, panelHeight);
  
  // Text settings
  gameState.ctx.font = '12px Courier New';
  gameState.ctx.fillStyle = 'white';
  gameState.ctx.textAlign = 'left';
  
  // Display debug information
  const debugInfo = [
      `Current Screen: ${gameState.currentScreen}`,
      `Penalty Phase: ${gameState.penaltyPhase}`,
      `Player Score: ${gameState.player.score}`,
      `Opponent Score: ${gameState.opponent.score}`,
      `Penalties Left: ${gameState.penaltiesLeft.player}-${gameState.penaltiesLeft.opponent}`,
      `Direction X: ${gameState.currentPenalty.direction.x.toFixed(2)}`,
      `Direction Y: ${gameState.currentPenalty.direction.y.toFixed(2)}`,
      `Power: ${Math.round(gameState.currentPenalty.power)}`,
      `Charging: ${gameState.currentPenalty.isCharging}`,
      `Animation: ${gameState.animationInProgress}`,
      `KeyLeft: ${gameState.controls.keyboard.left}`,
      `KeyRight: ${gameState.controls.keyboard.right}`,
      `KeyUp: ${gameState.controls.keyboard.up}`,
      `KeyDown: ${gameState.controls.keyboard.down}`,
      `Mouse: ${Math.round(gameState.controls.mouse.x)}, ${Math.round(gameState.controls.mouse.y)}`,
  ];
  
  debugInfo.forEach((info, index) => {
      gameState.ctx.fillText(info, 20, 30 + (index * 12));
  });
  
  // Display AI stats if enabled
  if (gameState.debug.showAIStats) {
      const aiPanel = {
          x: gameState.canvas.width - panelWidth - 10,
          y: 10,
          width: panelWidth,
          height: 170
      };
      
      // AI info background
      gameState.ctx.fillStyle = 'rgba(0, 0, 70, 0.7)';
      gameState.ctx.fillRect(aiPanel.x, aiPanel.y, aiPanel.width, aiPanel.height);
      gameState.ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)';
      gameState.ctx.strokeRect(aiPanel.x, aiPanel.y, aiPanel.width, aiPanel.height);
      
      // AI stats
      const aiStats = [
          "AI EVOLUTIONARY STATS:",
          `Corner Preference: ${gameState.evolutionaryAI.weights.cornerPreference.toFixed(2)}`,
          `Height Variation: ${gameState.evolutionaryAI.weights.heightVariation.toFixed(2)}`,
          `Pattern Recognition: ${gameState.evolutionaryAI.weights.patternRecognition.toFixed(2)}`,
          `Random Factor: ${gameState.evolutionaryAI.weights.randomFactor.toFixed(2)}`,
          `Success Rate: ${gameState.statistics.aiSuccess}/${gameState.statistics.aiAttempts}`,
          `Learning Rate: ${gameState.gameSettings.aiLearningRate}`,
          `Top Player Zone: ${getPlayerPreferredZone()}`
      ];
      
      aiStats.forEach((stat, index) => {
          if (index === 0) {
              gameState.ctx.fillStyle = '#64b5f6';
              gameState.ctx.font = 'bold 14px Courier New';
          } else {
              gameState.ctx.fillStyle = 'white';
              gameState.ctx.font = '12px Courier New';
          }
          gameState.ctx.fillText(stat, aiPanel.x + padding, aiPanel.y + 20 + (index * 18));
      });
  }
  
  // Draw goal zones debug overlay
  if (gameState.debug.showHitboxes) {
      drawGoalZonesDebug();
  }
}

function drawGoalZonesDebug() {
  const goal = gameState.goalDimensions;
  const zoneWidth = goal.width / 3;
  const zoneHeight = goal.height / 3;
  
  // Draw zones
  gameState.ctx.lineWidth = 1;
  gameState.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  
  // Horizontal dividers
  for (let i = 1; i < 3; i++) {
      gameState.ctx.beginPath();
      gameState.ctx.moveTo(goal.x, goal.y + i * zoneHeight);
      gameState.ctx.lineTo(goal.x + goal.width, goal.y + i * zoneHeight);
      gameState.ctx.stroke();
  }
  
  // Vertical dividers
  for (let i = 1; i < 3; i++) {
      gameState.ctx.beginPath();
      gameState.ctx.moveTo(goal.x + i * zoneWidth, goal.y);
      gameState.ctx.lineTo(goal.x + i * zoneWidth, goal.y + goal.height);
      gameState.ctx.stroke();
  }
  
  // Label zones with counts from player model
  if (gameState.evolutionaryAI.initialized) {
      const zones = [
          'topLeft', 'topCenter', 'topRight',
          'middleLeft', 'middleCenter', 'middleRight',
          'bottomLeft', 'bottomCenter', 'bottomRight'
      ];
      
      const model = gameState.evolutionaryAI.playerModel;
      
      let index = 0;
      for (let y = 0; y < 3; y++) {
          for (let x = 0; x < 3; x++) {
              const zoneName = zones[index];
              const zoneCount = model[zoneName] || 0;
              
              const zoneX = goal.x + x * zoneWidth;
              const zoneY = goal.y + y * zoneHeight;
              
              // Draw counts
              gameState.ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
              gameState.ctx.font = 'bold 16px Arial';
              gameState.ctx.fillText(
                  zoneCount,
                  zoneX + zoneWidth / 2,
                  zoneY + zoneHeight / 2
              );
              
              index++;
          }
      }
  }
}

function updateGameLogic() {
  // Update penalty charge if in progress
  if (gameState.currentPenalty.isCharging) {
      gameState.currentPenalty.power += gameState.controls.keyboard.shift ? 1.5 : 0.8;
      
      // Cap power at 100
      if (gameState.currentPenalty.power > 100) {
          gameState.currentPenalty.power = 100;
      }
      
      // Update arrow if keyboard controls are being used
      if (gameState.controls.keyboard.left || gameState.controls.keyboard.right || 
          gameState.controls.keyboard.up || gameState.controls.keyboard.down) {
          updateDirectionFromKeyboard();
      }
      
      // AI prediction in save phase
      if (gameState.penaltyPhase === 'save' && !gameState.currentPenalty.prediction.visible) {
          // Chance for AI prediction to appear based on difficulty
          let predictionChance;
          switch (gameState.gameSettings.difficulty) {
              case 'easy': predictionChance = 0.7; break;
              case 'normal': predictionChance = 0.4; break;
              case 'hard': predictionChance = 0.15; break;
              default: predictionChance = 0.4;
          }
          
          if (Math.random() < predictionChance) {
              // Show a prediction marker based on AI behavior
              const predictedShot = predictAIShot();
              gameState.currentPenalty.prediction = {
                  visible: true,
                  position: { 
                      x: predictedShot.x,
                      y: predictedShot.y
                  }
              };
          }
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
  
  // Update ball animation if active
  if (gameState.ballAnimation) {
      updateBallAnimation();
  }
}

function updateShotArrow() {
  // Ensure arrow is visible
  gameState.currentPenalty.arrow.visible = true;
  
  // Position is updated in renderShotArrow function
}

function startPenaltyCharge() {
  // Reset power
  gameState.currentPenalty.power = 0;
  
  // Show instruction overlay
  hideInstructionOverlay();
  
  // Play charging sound
  playSound('whistle', 0.3);
}

function updateBallAnimation() {
  if (!gameState.ballAnimation) return;
  
  const animation = gameState.ballAnimation;
  
  // Update position
  animation.x += animation.vx;
  animation.y += animation.vy;
  
  // Apply gravity
  animation.vy += animation.gravity;
  
  // Check if animation is complete
  if (animation.frame >= animation.duration) {
      gameState.ballAnimation = null;
      
      // Handle shot completion
      completeShotAnimation(animation.isGoal);
      return;
  }
  
  // Increment frame
  animation.frame++;
}

// ================ PENALTY KICK LOGIC ================

function executeShot() {
  if (gameState.animationInProgress) return;
  
  gameState.animationInProgress = true;
  
  // Hide instruction overlay
  hideInstructionOverlay();
  
  console.log(`Executing shot with power: ${gameState.currentPenalty.power}, direction: (${gameState.currentPenalty.direction.x.toFixed(2)}, ${gameState.currentPenalty.direction.y.toFixed(2)})`);
  
  // Play kick sound
  playSound('ball-kick');
  
  // Record shot direction in player model for AI learning
  recordPlayerShot(gameState.currentPenalty.direction.x, gameState.currentPenalty.direction.y);
  
  // Determine outcome (goal or miss)
  const isGoal = determineGoalOutcome(
      gameState.currentPenalty.power, 
      gameState.currentPenalty.direction.x,
      gameState.currentPenalty.direction.y
  );
  
  // Update statistics
  gameState.statistics.shots++;
  gameState.statistics.totalPower += gameState.currentPenalty.power;
  gameState.statistics.avgPower = gameState.statistics.totalPower / gameState.statistics.shots;
  
  // Start ball animation
  startBallAnimation(isGoal);
}

function executeSave() {
  if (gameState.animationInProgress) return;
  
  gameState.animationInProgress = true;
  
  // Hide instruction overlay
  hideInstructionOverlay();
  
  console.log(`Executing save at position: (${gameState.currentPenalty.direction.x.toFixed(2)}, ${gameState.currentPenalty.direction.y.toFixed(2)})`);
  
  // Set goalkeeper to diving state
  gameState.goalkeeper.diving = true;
  
  // Generate AI shot based on evolutionary algorithm
  const aiShot = generateAIShot();
  console.log(`AI shot targeting: (${aiShot.x.toFixed(2)}, ${aiShot.y.toFixed(2)})`);
  
  // Determine if save is successful based on keeper position vs AI shot
  const isSave = determineSaveOutcome(
      gameState.currentPenalty.direction.x,
      gameState.currentPenalty.direction.y,
      aiShot.x,
      aiShot.y
  );
  
  // Update AI statistics
  gameState.statistics.aiAttempts++;
  if (!isSave) {
      gameState.statistics.aiSuccess++;
  }
  
  // Trigger AI learning based on save outcome
  evolveAI(isSave, aiShot);
  
  // Start ball animation for AI shot
  startAIBallAnimation(aiShot.x, aiShot.y, isSave);
  
  // Play animation sound
  playSound('ball-kick');
  
  // Process outcome after animation delay
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
              gameState.goalkeeper.diving = false;
              switchPenaltyPhase('shoot');
          }, 2000);
      }
  }, 1000);
}

function startBallAnimation(isGoal) {
  const goal = gameState.goalDimensions;
  const startX = gameState.canvas.width / 2;
  const startY = gameState.canvas.height * 0.7;
  
  // Calculate target coordinates within the goal
  const targetX = goal.x + (goal.width * (gameState.currentPenalty.direction.x + 1) / 2);
  const targetY = goal.y + (goal.height * gameState.currentPenalty.direction.y);
  
  // Calculate velocity components
  const distance = Math.sqrt(
      Math.pow(targetX - startX, 2) + 
      Math.pow(targetY - startY, 2)
  );
  
  // Scale velocity based on power
  const powerFactor = gameState.currentPenalty.power / 50;
  const speed = 15 * powerFactor;
  
  const vx = (targetX - startX) / distance * speed;
  const vy = (targetY - startY) / distance * speed;
  
  // Add slight curve based on power and direction
  const curve = (Math.random() - 0.5) * 0.2 * powerFactor;
  
  gameState.ballAnimation = {
      x: startX,
      y: startY,
      vx: vx + curve,
      vy: vy,
      gravity: 0.1,
      frame: 0,
      duration: 60,  // Animation length in frames
      isGoal: isGoal
  };
}

function startAIBallAnimation(targetX, targetY, isSave) {
  const goal = gameState.goalDimensions;
  const startX = gameState.canvas.width / 2;
  const startY = gameState.canvas.height * 0.6;  // Penalty spot
  
  // Calculate absolute target coordinates
  const absTargetX = goal.x + (goal.width * (targetX + 1) / 2);
  const absTargetY = goal.y + (goal.height * targetY);
  
  // Calculate velocity components
  const distance = Math.sqrt(
      Math.pow(absTargetX - startX, 2) + 
      Math.pow(absTargetY - startY, 2)
  );
  
  // Random power factor for AI shots
  const powerFactor = 0.8 + Math.random() * 0.4;
  const speed = 15 * powerFactor;
  
  const vx = (absTargetX - startX) / distance * speed;
  const vy = (absTargetY - startY) / distance * speed;
  
  // Add slight curve
  const curve = (Math.random() - 0.5) * 0.3;
  
  gameState.ballAnimation = {
      x: startX,
      y: startY,
      vx: vx + curve,
      vy: vy,
      gravity: 0.1,
      frame: 0,
      duration: 60,
      isGoal: !isSave
  };
}

function completeShotAnimation(isGoal) {
  if (gameState.penaltyPhase === 'shoot') {
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
  }
}

function determineGoalOutcome(power, directionX, directionY) {
  // Factor in:
  // - Power (optimal range is 40-80)
  // - Direction (corners are harder but also harder to save)
  // - Difficulty setting
  
  const powerFactor = (power >= 40 && power <= 80) ? 0.85 : 0.6; // Optimal power range
  
  // Direction difficulty modifier - corners are harder to hit accurately
  const distanceFromCenter = Math.sqrt(directionX * directionX + (directionY - 0.5) * (directionY - 0.5));
  const directionDifficulty = 0.2 + (distanceFromCenter * 0.6); // Higher for corners
  
  // Calculate base probability
  let goalProbability = 0.75; // Base 75% chance
  
  // Adjust based on power
  goalProbability *= powerFactor;
  
  // Adjust based on direction (corners are harder)
  goalProbability *= (1 - directionDifficulty);
  
  // Adjust for game difficulty
  switch (gameState.gameSettings.difficulty) {
      case 'easy':
          goalProbability += 0.15;
          break;
      case 'hard':
          goalProbability -= 0.15;
          break;
  }
  
  // Ensure probability is within bounds
  goalProbability = Math.max(0.1, Math.min(0.95, goalProbability));
  
  return Math.random() < goalProbability;
}

function determineSaveOutcome(keeperX, keeperY, shotX, shotY) {
  // Calculate distance between keeper's dive position and shot target
  const distance = Math.sqrt(
      Math.pow(keeperX - shotX, 2) + 
      Math.pow(keeperY - shotY, 2)
  );
  
  // Save radius based on difficulty
  let saveRadius;
  switch (gameState.gameSettings.difficulty) {
      case 'easy': saveRadius = 1.4; break;
      case 'normal': saveRadius = 1.0; break;
      case 'hard': saveRadius = 0.7; break;
      default: saveRadius = 1.0;
  }
  
  // Convert to normalized space
  const normalizedDistance = distance * 0.5;
  
  // Return true if keeper is close enough to save
  return normalizedDistance < saveRadius;
}

function switchPenaltyPhase(phase) {
  gameState.penaltyPhase = phase;
  gameState.currentPenalty = {
      power: 0,
      direction: { x: 0, y: 0.5 }, // Default to center of goal
      arrow: {
          visible: true,
          position: { x: 0, y: 0 },
          angle: 0
      },
      prediction: {
          visible: false,
          position: { x: 0, y: 0 }
      },
      isCharging: false
  };
  
  // Reset goalkeeper state
  gameState.goalkeeper.diving = false;
  
  // Update instructions
  showInstructionOverlay(phase);
  
  // Start countdown timer
  startPenaltyCountdown(10); // 10 seconds to take the penalty
}

function showInstructionOverlay(phase) {
  const instructionTitle = document.getElementById('instruction-title');
  const instructionText = document.getElementById('instruction-text');
  const instructionOverlay = document.getElementById('instruction-overlay');
  
  if (!instructionTitle || !instructionText || !instructionOverlay) {
      console.warn('Instruction elements not found');
      return;
  }
  
  if (phase === 'shoot') {
      instructionTitle.textContent = 'Your turn to shoot!';
      instructionText.textContent = 'Use A/D to aim left/right, W/S to control height. Hold SPACE to charge, release to shoot.';
  } else {
      instructionTitle.textContent = 'Your turn to save!';
      instructionText.textContent = 'Use A/D to position left/right, W/S to adjust height. Press SPACE to dive.';
  }
  
  instructionOverlay.classList.remove('hidden');
}

function hideInstructionOverlay() {
  const instructionOverlay = document.getElementById('instruction-overlay');
  if (instructionOverlay) {
      instructionOverlay.classList.add('hidden');
  }
}

function startPenaltyCountdown(seconds) {
  gameState.countdownTimer = true;
  gameState.countdownEnd = Date.now() + seconds * 1000;
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

// ================ AI EVOLUTIONARY LOGIC ================

function recordPlayerShot(dirX, dirY) {
  // Record shot direction in zones for AI learning
  // Goal is divided into 9 zones (3x3 grid)
  
  let zoneX, zoneY;
  
  // Determine horizontal zone (left, center, right)
  if (dirX < -0.33) {
      zoneX = 'Left';
  } else if (dirX > 0.33) {
      zoneX = 'Right';
  } else {
      zoneX = 'Center';
  }
  
  // Determine vertical zone (top, middle, bottom)
  if (dirY < 0.33) {
      zoneY = 'top';
  } else if (dirY > 0.66) {
      zoneY = 'bottom';
  } else {
      zoneY = 'middle';
  }
  
  // Combine for zone name (e.g., "topLeft")
  const zone = zoneY + zoneX;
  
  // Increment zone count in player model
  if (!gameState.evolutionaryAI.playerModel[zone]) {
      gameState.evolutionaryAI.playerModel[zone] = 1;
  } else {
      gameState.evolutionaryAI.playerModel[zone]++;
  }
  
  // Add to player patterns
  gameState.statistics.playerPatterns.push({
      x: dirX,
      y: dirY,
      zone: zone,
      power: gameState.currentPenalty.power,
      timestamp: Date.now()
  });
  
  // Keep pattern history manageable
  if (gameState.statistics.playerPatterns.length > 20) {
      gameState.statistics.playerPatterns.shift();
  }
  
  // Save AI data
  saveAIData();
}

function saveAIData() {
  try {
      const aiData = {
          weights: gameState.evolutionaryAI.weights,
          playerModel: gameState.evolutionaryAI.playerModel
      };
      
      localStorage.setItem('penaltyShootersAI', JSON.stringify(aiData));
  } catch (error) {
      console.warn('Could not save AI data:', error);
  }
}

function predictAIShot() {
  // Generate a prediction that may or may not be accurate
  // The accuracy depends on the difficulty level
  
  const actualShot = generateAIShot();
  
  // Introduce prediction error based on difficulty
  let errorFactor;
  switch (gameState.gameSettings.difficulty) {
      case 'easy': errorFactor = 0.1; break;  // Small error - predictions are quite accurate
      case 'normal': errorFactor = 0.3; break; // Medium error
      case 'hard': errorFactor = 0.6; break;   // Large error - predictions often misleading
      default: errorFactor = 0.3;
  }
  
  // Sometimes show completely wrong prediction on hard
  if (gameState.gameSettings.difficulty === 'hard' && Math.random() < 0.4) {
      return {
          x: -actualShot.x, // Opposite side
          y: Math.min(1, Math.max(0, 1 - actualShot.y)) // Different height
      };
  }
  
  // Otherwise, add some noise to the actual target
  const noisyX = actualShot.x + (Math.random() - 0.5) * errorFactor * 2;
  const noisyY = actualShot.y + (Math.random() - 0.5) * errorFactor;
  
  return {
      x: Math.min(1, Math.max(-1, noisyX)), // Ensure values stay in range
      y: Math.min(1, Math.max(0, noisyY))
  };
}

function generateAIShot() {
  // Generate AI shot based on:
  // - Player's historical shot patterns
  // - AI evolution weights
  // - Current game situation
  
  const weights = gameState.evolutionaryAI.weights;
  const playerModel = gameState.evolutionaryAI.playerModel;
  
  // Base positioning preferences
  let shotX = 0; // Default to center
  let shotY = 0.5;
  
  // Decide whether to use pattern recognition or shoot based on weights
  const usePatternRecognition = Math.random() < weights.patternRecognition;
  
  if (usePatternRecognition && Object.values(playerModel).some(v => v > 0)) {
      // Find player's preferred zones to AVOID shooting there (assuming player tends to dive to same areas)
      const preferredZone = getPlayerPreferredZone();
      
      // Get coordinates from the opposite zone
      const oppositeZone = getOppositeZone(preferredZone);
      const zoneCoords = getCoordinatesForZone(oppositeZone);
      
      shotX = zoneCoords.x;
      shotY = zoneCoords.y;
  } else {
      // Use general AI shooting preferences
      
      // Corner preference
      const useCorner = Math.random() < weights.cornerPreference;
      if (useCorner) {
          // Shoot to corners
          shotX = Math.random() < 0.5 ? -0.8 : 0.8; // Left or right
          shotY = Math.random() < 0.5 ? 0.2 : 0.8; // Top or bottom
      } else {
          // More central shot
          shotX = (Math.random() * 1.2 - 0.6); // -0.6 to 0.6
          shotY = 0.3 + Math.random() * 0.4; // 0.3 to 0.7
      }
      
      // Add height variation
      shotY = shotY + (Math.random() - 0.5) * weights.heightVariation;
  }
  
  // Add random factor for unpredictability
  shotX += (Math.random() - 0.5) * weights.randomFactor;
  shotY += (Math.random() - 0.5) * weights.randomFactor;
  
  // Ensure values stay within bounds
  shotX = Math.min(1, Math.max(-1, shotX));
  shotY = Math.min(1, Math.max(0, shotY));
  
  // Record this decision
  gameState.evolutionaryAI.lastDecisions.push({ x: shotX, y: shotY });
  if (gameState.evolutionaryAI.lastDecisions.length > 10) {
      gameState.evolutionaryAI.lastDecisions.shift();
  }
  
  return { x: shotX, y: shotY };
}

function evolveAI(wasSuccessful, decision) {
  // Adjust AI weights based on outcome of the last decision
  const weights = gameState.evolutionaryAI.weights;
  const learningRate = gameState.gameSettings.aiLearningRate;
  
  // If successful, reinforce the current strategy
  // If not successful, adjust the strategy
  if (wasSuccessful) {
      // The decision was successful (the AI scored), so reinforce those weights
      
      // Was it a corner shot?
      const wasCornerShot = Math.abs(decision.x) > 0.7 || decision.y < 0.2 || decision.y > 0.8;
      if (wasCornerShot) {
          // Increase corner preference slightly
          weights.cornerPreference = Math.min(0.95, weights.cornerPreference + learningRate * 0.2);
      } else {
          // Decrease corner preference slightly
          weights.cornerPreference = Math.max(0.05, weights.cornerPreference - learningRate * 0.1);
      }
      
      // Was it a varied height?
      const wasVariedHeight = decision.y < 0.3 || decision.y > 0.7;
      if (wasVariedHeight) {
          // Increase height variation preference
          weights.heightVariation = Math.min(0.95, weights.heightVariation + learningRate * 0.2);
      }
      
      // If we used pattern recognition successfully, reinforce it
      if (Math.random() < weights.patternRecognition) {
          weights.patternRecognition = Math.min(0.95, weights.patternRecognition + learningRate * 0.1);
      }
  } else {
      // The decision was unsuccessful (the keeper saved it), so adjust weights
      
      // Adjust corner preference - try different approach
      weights.cornerPreference += (Math.random() < 0.5 ? 1 : -1) * learningRate * 0.3;
      weights.cornerPreference = Math.min(0.95, Math.max(0.05, weights.cornerPreference));
      
      // Adjust height variation
      weights.heightVariation += (Math.random() < 0.5 ? 1 : -1) * learningRate * 0.2;
      weights.heightVariation = Math.min(0.95, Math.max(0.05, weights.heightVariation));
      
      // Adjust randomness
      weights.randomFactor = Math.min(0.8, weights.randomFactor + learningRate * 0.1);
      
      // Adjust pattern recognition slightly
      weights.patternRecognition += (Math.random() < 0.7 ? -1 : 1) * learningRate * 0.05;
      weights.patternRecognition = Math.min(0.9, Math.max(0.1, weights.patternRecognition));
  }
  
  // Save AI data after evolution
  saveAIData();
}

function getPlayerPreferredZone() {
  // Find the zone with the highest count
  const model = gameState.evolutionaryAI.playerModel;
  let maxCount = 0;
  let preferredZone = 'middleCenter'; // Default
  
  for (const [zone, count] of Object.entries(model)) {
      if (count > maxCount) {
          maxCount = count;
          preferredZone = zone;
      }
  }
  
  return preferredZone;
}

function getOppositeZone(zone) {
  // Return the opposite zone of the goal
  const opposites = {
      'topLeft': 'bottomRight',
      'topCenter': 'bottomCenter',
      'topRight': 'bottomLeft',
      'middleLeft': 'middleRight',
      'middleCenter': 'topLeft', // Special case: go to corner
      'middleRight': 'middleLeft',
      'bottomLeft': 'topRight',
      'bottomCenter': 'topCenter',
      'bottomRight': 'topLeft'
  };
  
  return opposites[zone] || 'middleCenter';
}

function getCoordinatesForZone(zone) {
  // Return x, y coordinates (in normalized space) for a zone
  const coordinates = {
      'topLeft': { x: -0.8, y: 0.2 },
      'topCenter': { x: 0, y: 0.2 },
      'topRight': { x: 0.8, y: 0.2 },
      'middleLeft': { x: -0.8, y: 0.5 },
      'middleCenter': { x: 0, y: 0.5 },
      'middleRight': { x: 0.8, y: 0.5 },
      'bottomLeft': { x: -0.8, y: 0.8 },
      'bottomCenter': { x: 0, y: 0.8 },
      'bottomRight': { x: 0.8, y: 0.8 }
  };
  
  // Add slight randomization within the zone
  const coords = coordinates[zone] || coordinates.middleCenter;
  return {
      x: coords.x + (Math.random() * 0.2 - 0.1),
      y: coords.y + (Math.random() * 0.2 - 0.1)
  };
}

// ================ MATCH LOGIC ================

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
                  
  const aiAccuracy = gameState.statistics.aiAttempts > 0 ?
                   Math.round((gameState.statistics.aiSuccess / gameState.statistics.aiAttempts) * 100) : 0;
  
  // Create stats items
  const stats = [
      { label: 'Goals Scored', value: gameState.statistics.goals },
      { label: 'Shots Taken', value: gameState.statistics.shots },
      { label: 'Shot Accuracy', value: `${accuracy}%` },
      { label: 'Saves Made', value: gameState.statistics.saves },
      { label: 'Avg Shot Power', value: `${avgPower}%` },
      { label: 'AI Shot Accuracy', value: `${aiAccuracy}%` }
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

// ================ SCREEN NAVIGATION ================

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
  } else if (to === 'customize-screen') {
      initializeCustomizeScreen();
  } else if (to === 'options-screen') {
      initializeOptionsScreen();
  }
  
  console.log(`Screen switched to: ${to}`);
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

// ================ GAME SETUP FUNCTIONS ================

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
      direction: { x: 0, y: 0.5 },  // Default to center
      arrow: {
          visible: true,
          position: { x: 0, y: 0 },
          angle: 0
      },
      prediction: {
          visible: false,
          position: { x: 0, y: 0 }
      },
      isCharging: false
  };
  gameState.animationInProgress = false;
  gameState.goalkeeper.diving = false;
  gameState.ballAnimation = null;
  
  // Reset statistics for current match
  gameState.statistics = {
      ...gameState.statistics,
      shots: 0,
      goals: 0,
      saves: 0,
      avgPower: 0,
      totalPower: 0,
      aiSuccess: 0,
      aiAttempts: 0
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
      // Update field dimensions after resize
      gameState.fieldDimensions = {
          width: gameState.canvas.width * 0.8,
          height: gameState.canvas.height * 0.8,
          x: (gameState.canvas.width - gameState.canvas.width * 0.8) / 2,
          y: (gameState.canvas.height - gameState.canvas.height * 0.8) / 2
      };
      
      // Update goal dimensions
      gameState.goalDimensions = {
          width: gameState.canvas.width * 0.4,
          height: gameState.canvas.width * 0.15,
          x: (gameState.canvas.width - gameState.canvas.width * 0.4) / 2,
          y: gameState.canvas.height * 0.2
      };
  }
}

// ================ TOURNAMENT FUNCTIONS ================

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
  if (gameState.tournament.isPlayerTeam && gameState.tournament.isPlayerTeam(winner)) {
      // If achievement system exists
      if (typeof Achievements !== 'undefined' && Achievements.unlock) {
          Achievements.unlock('champion');
      }
  }
  
  console.log('Trophy screen displayed for winner:', winner.name);
}

// ================ CHARACTER CUSTOMIZATION ================

function initializeCustomizeScreen() {
  console.log('Initializing character customization screen');
  
  // This function would set up character customization UI
  // You could add player models, colors, accessories, etc.
  
  // For now we'll use a placeholder implementation
  const customizeContainer = document.getElementById('customize-container');
  if (!customizeContainer) {
      console.warn('Customize container not found');
      return;
  }
  
  // Clear container
  clearElement(customizeContainer);
  
  // Add customization options
  const options = [
      { name: 'Model Type', values: ['Default', 'Tall', 'Fast', 'Strong'] },
      { name: 'Hair Style', values: ['Short', 'Long', 'Bald', 'Curly'] },
      { name: 'Kit Color', values: ['Red', 'Blue', 'Green', 'Black', 'White'] }
  ];
  
  options.forEach(option => {
      const optionGroup = createElement('div', 'customize-option-group');
      
      const label = createElement('label', 'customize-label', option.name);
      optionGroup.appendChild(label);
      
      const select = document.createElement('select');
      select.className = 'customize-select';
      select.id = `customize-${option.name.toLowerCase().replace(' ', '-')}`;
      
      option.values.forEach(value => {
          const optionEl = document.createElement('option');
          optionEl.value = value.toLowerCase();
          optionEl.textContent = value;
          select.appendChild(optionEl);
      });
      
      optionGroup.appendChild(select);
      customizeContainer.appendChild(optionGroup);
  });
  
  // Add save button
  const saveButton = createElement('button', 'btn btn-primary', 'Save Character');
  saveButton.addEventListener('click', () => {
      // Save customization options
      const modelType = document.getElementById('customize-model-type')?.value || 'default';
      const hairStyle = document.getElementById('customize-hair-style')?.value || 'short';
      const kitColor = document.getElementById('customize-kit-color')?.value || 'red';
      
      // Update player character model
      gameState.player.character.model = modelType;
      console.log(`Character customized: Model=${modelType}, Hair=${hairStyle}, Kit=${kitColor}`);
      
      // Return to main menu
      switchScreen('customize-screen', 'main-menu');
  });
  
  customizeContainer.appendChild(saveButton);
  
  // Add back button
  const backButton = createElement('button', 'btn btn-secondary', 'Back to Menu');
  backButton.addEventListener('click', () => {
      switchScreen('customize-screen', 'main-menu');
  });
  
  customizeContainer.appendChild(backButton);
}

// ================ OPTIONS SCREEN ================

function initializeOptionsScreen() {
  console.log('Initializing options screen');
  
  // This function would set up the options UI
  const optionsContainer = document.getElementById('options-container');
  if (!optionsContainer) {
      console.warn('Options container not found');
      return;
  }
  
  // Clear container
  clearElement(optionsContainer);
  
  // Sound toggle
  const soundToggle = createToggleOption(
      'Sound Effects', 
      gameState.gameSettings.sound,
      (value) => {
          gameState.gameSettings.sound = value;
          saveGameSettings();
      }
  );
  optionsContainer.appendChild(soundToggle);
  
  // Music toggle
  const musicToggle = createToggleOption(
      'Music', 
      gameState.gameSettings.music,
      (value) => {
          gameState.gameSettings.music = value;
          saveGameSettings();
          
          // Update current music state
          if (value) {
              playMenuMusic();
          } else {
              const menuMusic = gameState.assets.audio['menu-music'];
              if (menuMusic) {
                  menuMusic.pause();
                  menuMusic.currentTime = 0;
              }
          }
      }
  );
  optionsContainer.appendChild(musicToggle);
  
  // Difficulty selection
  const difficultyContainer = createElement('div', 'options-group');
  const difficultyLabel = createElement('label', 'options-label', 'Difficulty');
  difficultyContainer.appendChild(difficultyLabel);
  
  const difficulties = ['Easy', 'Normal', 'Hard'];
  const difficultyButtons = createElement('div', 'difficulty-buttons');
  
  difficulties.forEach(diff => {
      const button = createElement('button', 'difficulty-button', diff);
      if (gameState.gameSettings.difficulty.toLowerCase() === diff.toLowerCase()) {
          button.classList.add('active');
      }
      
      button.addEventListener('click', () => {
          // Remove active class from all buttons
          document.querySelectorAll('.difficulty-button').forEach(btn => {
              btn.classList.remove('active');
          });
          
          // Add active class to clicked button
          button.classList.add('active');
          
          // Update game setting
          gameState.gameSettings.difficulty = diff.toLowerCase();
          saveGameSettings();
      });
      
      difficultyButtons.appendChild(button);
  });
  
  difficultyContainer.appendChild(difficultyButtons);
  optionsContainer.appendChild(difficultyContainer);
  
  // AI Learning Rate slider
  const aiContainer = createElement('div', 'options-group');
  const aiLabel = createElement('label', 'options-label', 'AI Learning Rate');
  aiContainer.appendChild(aiLabel);
  
  const aiSliderContainer = createElement('div', 'slider-container');
  
  const aiSlider = document.createElement('input');
  aiSlider.type = 'range';
  aiSlider.min = '1';
  aiSlider.max = '10';
  aiSlider.value = Math.round(gameState.gameSettings.aiLearningRate * 100);
  aiSlider.className = 'options-slider';
  
  const aiValue = createElement('span', 'slider-value', `${aiSlider.value}%`);
  
  aiSlider.addEventListener('input', () => {
      gameState.gameSettings.aiLearningRate = Number(aiSlider.value) / 100;
      aiValue.textContent = `${aiSlider.value}%`;
      saveGameSettings();
  });
  
  aiSliderContainer.appendChild(aiSlider);
  aiSliderContainer.appendChild(aiValue);
  aiContainer.appendChild(aiSliderContainer);
  optionsContainer.appendChild(aiContainer);
  
  // Reset AI button
  const resetAIButton = createElement('button', 'options-button', 'Reset AI Learning');
  resetAIButton.addEventListener('click', () => {
      // Reset AI learning data
      gameState.evolutionaryAI = {
          initialized: true,
          weights: {
              cornerPreference: 0.5,
              heightVariation: 0.5,
              patternRecognition: 0.3,
              randomFactor: 0.2
          },
          playerModel: {
              topLeft: 0,
              topCenter: 0,
              topRight: 0,
              middleLeft: 0,
              middleCenter: 0,
              middleRight: 0,
              bottomLeft: 0,
              bottomCenter: 0,
              bottomRight: 0
          },
          lastDecisions: []
      };
      
      // Save reset AI data
      saveAIData();
      
      alert('AI learning data has been reset.');
  });
  optionsContainer.appendChild(resetAIButton);
  
  // Debug mode toggle (hidden feature)
  const debugToggle = createToggleOption(
      'Debug Mode', 
      gameState.debug.enabled,
      (value) => {
          gameState.debug.enabled = value;
          if (value) {
              console.log('Debug mode enabled');
          } else {
              console.log('Debug mode disabled');
          }
      }
  );
  debugToggle.style.opacity = "0.5";
  optionsContainer.appendChild(debugToggle);
  
  // Back button
  const backButton = createElement('button', 'btn btn-primary options-back', 'Back to Menu');
  backButton.addEventListener('click', () => {
      switchScreen('options-screen', 'main-menu');
  });
  
  optionsContainer.appendChild(backButton);
}

function createToggleOption(label, initialValue, onChange) {
  const container = createElement('div', 'options-group');
  
  const labelElement = createElement('label', 'options-label', label);
  container.appendChild(labelElement);
  
  const toggle = createElement('div', 'toggle-switch');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = initialValue;
  
  const slider = createElement('div', 'slider');
  
  input.addEventListener('change', () => {
      if (onChange) {
          onChange(input.checked);
      }
  });
  
  toggle.appendChild(input);
  toggle.appendChild(slider);
  container.appendChild(toggle);
  
  return container;
}

function saveGameSettings() {
  try {
      localStorage.setItem('penaltyShootersSettings', JSON.stringify(gameState.gameSettings));
  } catch (error) {
      console.warn('Could not save game settings:', error);
  }
}

// ================ TEAM SELECTION ================

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
              
              // Update selection indicator
              const indicator = document.getElementById('league-selection-indicator');
              if (indicator) {
                  indicator.innerHTML = '<i class="fas fa-check-circle"></i><span>' + league.name + '</span>';
                  indicator.classList.add('selected');
              }
              
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

// Enable debug mode with keyboard shortcut Ctrl+Shift+D
document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.shiftKey && event.key === 'D') {
      gameState.debug.enabled = !gameState.debug.enabled;
      console.log('Debug mode:', gameState.debug.enabled ? 'enabled' : 'disabled');
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
      gameState.debug.enabled = !gameState.debug.enabled;
      return gameState.debug.enabled;
  }
};

console.log('Penalty Shooters 2 - Enhanced game engine initialized');