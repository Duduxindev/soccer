/**
 * Fix for loading screen issue
 * This script ensures the loading screen transitions correctly to the main menu
 */

// Execute after a short delay to ensure DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Loading fix script initialized");
    
    // Force complete loading after 5 seconds if still on loading screen
    setTimeout(function() {
        const loadingScreen = document.getElementById('loading-screen');
        const mainMenu = document.getElementById('main-menu');
        
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            console.log("Force completing loading process...");
            
            // Update loading bar to 100%
            const loadingBar = document.getElementById('loading-bar');
            if (loadingBar) {
                loadingBar.style.width = '100%';
            }
            
            // Hide loading screen
            loadingScreen.classList.add('hidden');
            
            // Show main menu
            if (mainMenu) {
                mainMenu.classList.remove('hidden');
                
                // Update game state if available
                if (window.gameState) {
                    window.gameState.currentScreen = 'main-menu';
                    window.gameState.isLoading = false;
                }
                
                console.log("Loading complete and main menu displayed");
            } else {
                console.error("Main menu element not found!");
            }
            
            // Initialize game if not already done
            if (window.GamePhysics && window.gameState && window.gameState.canvas) {
                try {
                    window.GamePhysics.initialize(
                        window.gameState.canvas.width, 
                        window.gameState.canvas.height
                    );
                    
                    if (window.InputManager) {
                        window.InputManager.initialize(window.gameState.canvas);
                    }
                    
                    if (window.SettingsManager) {
                        window.SettingsManager.initialize();
                    }
                    
                    if (window.Achievements) {
                        window.Achievements.initialize();
                    }
                    
                    // Start game loop
                    if (typeof window.gameLoop === 'function') {
                        requestAnimationFrame(window.gameLoop);
                    }
                    
                    console.log("Game components initialized successfully");
                } catch (e) {
                    console.error("Error initializing game components:", e);
                }
            }
        } else {
            console.log("Loading screen already hidden or not found");
        }
    }, 5000); // 5 second timeout
});