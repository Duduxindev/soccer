/**
 * Utility functions for Penalty Shooters 2
 */

// Random number utilities
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// DOM utilities
function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
}

function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

// Animation utilities
function animateElement(element, animationClass, duration) {
    return new Promise(resolve => {
        element.classList.add(animationClass);
        
        setTimeout(() => {
            element.classList.remove(animationClass);
            resolve();
        }, duration);
    });
}

// Screen transition helper
function transitionScreen(fromId, toId, duration = 500) {
    return new Promise(resolve => {
        const fromScreen = document.getElementById(fromId);
        const toScreen = document.getElementById(toId);
        
        // Create transition overlay
        const overlay = createElement('div', 'screen-transition');
        document.body.appendChild(overlay);
        
        // Start transition
        setTimeout(() => {
            overlay.classList.add('active');
        }, 50);
        
        // Switch screens
        setTimeout(() => {
            if (fromScreen) fromScreen.classList.add('hidden');
            if (toScreen) toScreen.classList.remove('hidden');
            
            // Remove overlay
            setTimeout(() => {
                overlay.classList.remove('active');
                
                setTimeout(() => {
                    overlay.remove();
                    resolve();
                }, duration);
            }, 100);
        }, duration);
    });
}

// Local storage helpers
const Storage = {
    save: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    },
    
    load: function(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Error loading from localStorage:', e);
            return defaultValue;
        }
    },
    
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    },
    
    clear: function() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Error clearing localStorage:', e);
            return false;
        }
    }
};

// Game settings manager
const SettingsManager = {
    defaults: {
        sound: true,
        music: true,
        difficulty: 'normal',
        tutorialShown: false,
        username: ''
    },
    
    current: {},
    
    initialize: function() {
        this.current = Storage.load('penaltyShooters2Settings', this.defaults);
    },
    
    save: function() {
        return Storage.save('penaltyShooters2Settings', this.current);
    },
    
    reset: function() {
        this.current = {...this.defaults};
        return this.save();
    },
    
    get: function(key) {
        return this.current[key] !== undefined ? this.current[key] : this.defaults[key];
    },
    
    set: function(key, value) {
        this.current[key] = value;
        return this.save();
    }
};

// Achievement system
const Achievements = {
    list: [
        {
            id: 'first_goal',
            name: 'First Strike',
            description: 'Score your first goal',
            icon: 'assets/images/achievements/first-goal.png',
            unlocked: false
        },
        {
            id: 'perfect_game',
            name: 'Perfect Game',
            description: 'Score 5 out of 5 penalties in a match',
            icon: 'assets/images/achievements/perfect-game.png',
            unlocked: false
        },
        {
            id: 'wall',
            name: 'The Wall',
            description: 'Save 3 penalties in a row',
            icon: 'assets/images/achievements/wall.png',
            unlocked: false
        },
        {
            id: 'champion',
            name: 'Tournament Champion',
            description: 'Win a complete tournament',
            icon: 'assets/images/achievements/champion.png',
            unlocked: false
        },
        {
            id: 'all_star',
            name: 'All-Star',
            description: 'Score 50 goals total',
            icon: 'assets/images/achievements/all-star.png',
            unlocked: false,
            progress: 0,
            target: 50
        }
    ],
    
    initialize: function() {
        const saved = Storage.load('penaltyShooters2Achievements');
        if (saved) {
            this.list = saved;
        }
    },
    
    save: function() {
        return Storage.save('penaltyShooters2Achievements', this.list);
    },
    
    unlock: function(id) {
        const achievement = this.list.find(a => a.id === id);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            achievement.dateUnlocked = new Date().toISOString();
            this.save();
            return achievement;
        }
        return null;
    },
    
    updateProgress: function(id, progress) {
        const achievement = this.list.find(a => a.id === id);
        if (achievement) {
            achievement.progress = progress;
            if (achievement.target && progress >= achievement.target) {
                achievement.unlocked = true;
                achievement.dateUnlocked = new Date().toISOString();
            }
            this.save();
            return achievement.unlocked;
        }
        return false;
    },
    
    getUnlocked: function() {
        return this.list.filter(a => a.unlocked);
    },
    
    getLocked: function() {
        return this.list.filter(a => !a.unlocked);
    }
};

// Medal system for match results
const MedalSystem = {
    evaluate: function(stats) {
        const medals = [];
        
        // Accuracy medal
        if (stats.goals / stats.shots >= 1) {
            medals.push({
                type: 'gold',
                name: 'Perfect Accuracy',
                icon: 'accuracy-gold'
            });
        } else if (stats.goals / stats.shots >= 0.8) {
            medals.push({
                type: 'silver',
                name: 'High Accuracy',
                icon: 'accuracy-silver'
            });
        } else if (stats.goals / stats.shots >= 0.6) {
            medals.push({
                type: 'bronze',
                name: 'Good Accuracy',
                icon: 'accuracy-bronze'
            });
        }
        
        // Saves medal
        if (stats.saves >= 5) {
            medals.push({
                type: 'gold',
                name: 'Unbeatable',
                icon: 'saves-gold'
            });
        } else if (stats.saves >= 3) {
            medals.push({
                type: 'silver',
                name: 'Great Goalkeeper',
                icon: 'saves-silver'
            });
        } else if (stats.saves >= 2) {
            medals.push({
                type: 'bronze',
                name: 'Solid Keeper',
                icon: 'saves-bronze'
            });
        }
        
        // Power medal (based on average shot power)
        if (stats.avgPower >= 90) {
            medals.push({
                type: 'gold',
                name: 'Power Striker',
                icon: 'power-gold'
            });
        } else if (stats.avgPower >= 75) {
            medals.push({
                type: 'silver',
                name: 'Strong Shots',
                icon: 'power-silver'
            });
        } else if (stats.avgPower >= 60) {
            medals.push({
                type: 'bronze',
                name: 'Firm Shots',
                icon: 'power-bronze'
            });
        }
        
        return medals;
    }
};

// Formatter for time displays
const TimeFormatter = {
    formatSeconds: function(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    },
    
    formatMilliseconds: function(ms) {
        const seconds = ms / 1000;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = (seconds % 60).toFixed(1);
        return minutes > 0 
            ? `${minutes}m ${remainingSeconds}s` 
            : `${remainingSeconds}s`;
    }
};