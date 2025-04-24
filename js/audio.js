/**
 * Audio Management for Penalty Shooters 2
 */

const AudioManager = (function() {
    // Private variables
    let isMusicEnabled = true;
    let isSoundEnabled = true;
    let currentMusic = null;
    let sounds = {};
    let music = {};
    
    // Sound loading and initialization
    function loadSound(key, url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.src = url;
            
            audio.addEventListener('canplaythrough', () => {
                sounds[key] = audio;
                resolve(audio);
            });
            
            audio.addEventListener('error', () => {
                reject(`Error loading sound: ${url}`);
            });
        });
    }
    
    function loadMusic(key, url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.src = url;
            audio.loop = true;
            
            audio.addEventListener('canplaythrough', () => {
                music[key] = audio;
                resolve(audio);
            });
            
            audio.addEventListener('error', () => {
                reject(`Error loading music: ${url}`);
            });
        });
    }
    
    // Public methods
    return {
        initialize: async function() {
            try {
                // Load sound effects
                await loadSound('whistle', 'assets/audio/whistle.mp3');
                await loadSound('crowd-cheer', 'assets/audio/crowd-cheer.mp3');
                await loadSound('ball-kick', 'assets/audio/ball-kick.mp3');
                await loadSound('goal', 'assets/audio/goal.mp3');
                await loadSound('save', 'assets/audio/save.mp3');
                await loadSound('miss', 'assets/audio/miss.mp3');
                await loadSound('click', 'assets/audio/click.mp3');
                await loadSound('whistle-start', 'assets/audio/whistle-start.mp3');
                await loadSound('whistle-end', 'assets/audio/whistle-end.mp3');
                
                // Load music
                await loadMusic('menu-music', 'assets/audio/menu-music.mp3');
                await loadMusic('match-music', 'assets/audio/match-music.mp3');
                await loadMusic('victory-music', 'assets/audio/victory-music.mp3');
                await loadMusic('group-stage', 'assets/audio/group-stage.mp3');
                await loadMusic('knockout', 'assets/audio/knockout.mp3');
                await loadMusic('final', 'assets/audio/final.mp3');
                
                console.log('Audio loaded successfully');
                return true;
            } catch (error) {
                console.error(error);
                return false;
            }
        },
        
        playSound: function(key, volume = 1.0) {
            if (!isSoundEnabled || !sounds[key]) return;
            
            // Create a new instance to allow overlapping sounds
            const sound = sounds[key].cloneNode();
            sound.volume = volume;
            sound.play().catch(e => console.error('Error playing sound:', e));
            
            return sound;
        },
        
        playMusic: function(key, volume = 0.5) {
            if (!isMusicEnabled || !music[key]) return;
            
            // Stop current music if playing
            if (currentMusic) {
                currentMusic.pause();
                currentMusic.currentTime = 0;
            }
            
            // Play new music
            currentMusic = music[key];
            currentMusic.volume = volume;
            currentMusic.loop = true;
            currentMusic.play().catch(e => console.error('Error playing music:', e));
        },
        
        stopMusic: function() {
            if (currentMusic) {
                currentMusic.pause();
                currentMusic.currentTime = 0;
                currentMusic = null;
            }
        },
        
        fadeOutMusic: function(duration = 2000) {
            if (!currentMusic) return;
            
            const originalVolume = currentMusic.volume;
            const decreaseStep = originalVolume / (duration / 100);
            
            const fadeInterval = setInterval(() => {
                if (currentMusic.volume <= decreaseStep) {
                    currentMusic.pause();
                    currentMusic.currentTime = 0;
                    currentMusic.volume = originalVolume;
                    currentMusic = null;
                    clearInterval(fadeInterval);
                } else {
                    currentMusic.volume -= decreaseStep;
                }
            }, 100);
        },
        
        fadeInMusic: function(key, duration = 2000, targetVolume = 0.5) {
            if (!isMusicEnabled || !music[key]) return;
            
            // Stop current music
            this.stopMusic();
            
            // Start new music at volume 0
            currentMusic = music[key];
            currentMusic.volume = 0;
            currentMusic.loop = true;
            currentMusic.play().catch(e => console.error('Error playing music:', e));
            
            // Fade in
            const increaseStep = targetVolume / (duration / 100);
            
            const fadeInterval = setInterval(() => {
                if (currentMusic.volume >= targetVolume) {
                    currentMusic.volume = targetVolume;
                    clearInterval(fadeInterval);
                } else {
                    currentMusic.volume += increaseStep;
                }
            }, 100);
        },
        
        toggleMusic: function() {
            isMusicEnabled = !isMusicEnabled;
            
            if (!isMusicEnabled && currentMusic) {
                currentMusic.pause();
            } else if (isMusicEnabled && currentMusic) {
                currentMusic.play().catch(e => console.error('Error playing music:', e));
            }
            
            return isMusicEnabled;
        },
        
        toggleSound: function() {
            isSoundEnabled = !isSoundEnabled;
            return isSoundEnabled;
        },
        
        setMusicVolume: function(volume) {
            if (currentMusic) {
                currentMusic.volume = volume;
            }
        },
        
        isMusicEnabled: function() {
            return isMusicEnabled;
        },
        
        isSoundEnabled: function() {
            return isSoundEnabled;
        }
    };
})();