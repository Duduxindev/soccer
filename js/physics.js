/**
 * Physics and ball movement logic for Penalty Shooters 2
 */

const GamePhysics = (function() {
    // Constants
    const GOAL_WIDTH = 0.8;       // As percentage of canvas width
    const GOAL_HEIGHT = 0.3;      // As percentage of canvas height
    const GOAL_Y_POSITION = 0.15; // As percentage of canvas height
    const MAX_SHOT_POWER = 100;   // Maximum power for a shot
    const POWER_FACTOR = 0.1;     // Conversion factor for power to speed
    const GRAVITY = 0.005;        // Gravity effect on ball trajectory
    
    // Private variables
    let canvasWidth = 0;
    let canvasHeight = 0;
    
    // Convert normalized coordinates (-1 to 1) to absolute goal coordinates
    function normalizedToGoalCoords(xNorm, yNorm) {
        // Get goal dimensions
        const goalWidth = canvasWidth * GOAL_WIDTH;
        const goalHeight = canvasHeight * GOAL_HEIGHT;
        const goalLeft = (canvasWidth - goalWidth) / 2;
        const goalTop = canvasHeight * GOAL_Y_POSITION;
        
        // Convert to goal coordinates
        // xNorm: -1 (left) to 1 (right)
        // yNorm: 0 (bottom) to 1 (top)
        const x = goalLeft + (xNorm + 1) / 2 * goalWidth;
        const y = goalTop + goalHeight - yNorm * goalHeight;
        
        return { x, y };
    }
    
    // Calculate ball trajectory from player position to target
    function calculateBallTrajectory(power, direction, height) {
        const startX = canvasWidth / 2;
        const startY = canvasHeight * 0.75;
        
        const target = normalizedToGoalCoords(direction, height);
        
        // Calculate distance and angle
        const dx = target.x - startX;
        const dy = target.y - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate initial velocity components
        const speed = Math.min(power, MAX_SHOT_POWER) * POWER_FACTOR;
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;
        
        return {
            startX,
            startY,
            vx,
            vy,
            targetX: target.x,
            targetY: target.y
        };
    }
    
    // Calculate goalkeeper dive trajectory
    function calculateGoalkeeperDive(startX, startY, targetX, targetY, diveSpeed) {
        // Calculate direction vector
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize and scale by dive speed
        const vx = (dx / distance) * diveSpeed;
        const vy = (dy / distance) * diveSpeed;
        
        return { startX, startY, vx, vy, targetX, targetY };
    }
    
    // Check if the ball is inside the goal
    function isBallInGoal(x, y) {
        const goalLeft = (canvasWidth - canvasWidth * GOAL_WIDTH) / 2;
        const goalRight = goalLeft + canvasWidth * GOAL_WIDTH;
        const goalTop = canvasHeight * GOAL_Y_POSITION;
        const goalBottom = goalTop + canvasHeight * GOAL_HEIGHT;
        
        return x >= goalLeft && x <= goalRight && y >= goalTop && y <= goalBottom;
    }
    
    // Check if the goalkeeper can save the ball
    function canGoalkeeperSave(ballX, ballY, keeperX, keeperY, keeperReach) {
        const dx = ballX - keeperX;
        const dy = ballY - keeperY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= keeperReach;
    }
    
    // Public methods
    return {
        initialize: function(width, height) {
            canvasWidth = width;
            canvasHeight = height;
        },
        
        getGoalDimensions: function() {
            return {
                width: canvasWidth * GOAL_WIDTH,
                height: canvasHeight * GOAL_HEIGHT,
                x: (canvasWidth - canvasWidth * GOAL_WIDTH) / 2,
                y: canvasHeight * GOAL_Y_POSITION
            };
        },
        
        simulateShot: function(power, direction, height) {
            // direction: -1 to 1 (left to right)
            // height: 0 to 1 (bottom to top of goal)
            return calculateBallTrajectory(power, direction, height);
        },
        
        simulateGoalkeeperDive: function(keeperX, keeperY, targetX, targetY) {
            const diveSpeed = 10; // Can be adjusted based on difficulty
            return calculateGoalkeeperDive(keeperX, keeperY, targetX, targetY, diveSpeed);
        },
        
        checkGoal: function(ballX, ballY) {
            return isBallInGoal(ballX, ballY);
        },
        
        checkSave: function(ballX, ballY, keeperX, keeperY) {
            const keeperReach = canvasHeight * 0.1; // Goalkeeper reach radius
            return canGoalkeeperSave(ballX, ballY, keeperX, keeperY, keeperReach);
        },
        
        getPenaltySpotPosition: function() {
            return {
                x: canvasWidth / 2,
                y: canvasHeight * 0.75
            };
        },
        
        getDefaultGoalkeeperPosition: function() {
            return {
                x: canvasWidth / 2,
                y: canvasHeight * 0.25
            };
        },
        
        // For calculating penalty difficulty score
        calculateShotDifficulty: function(direction, height) {
            // Shots to the corners are harder to save
            // Direction -1 or 1 (corners) are harder than 0 (center)
            // Height 0 or 1 (low or high) are harder than 0.5 (middle height)
            const directionDifficulty = Math.abs(direction);
            const heightDifficulty = Math.abs(height - 0.5) * 2; // 0 at middle, 1 at top/bottom
            
            return (directionDifficulty + heightDifficulty) / 2;
        }
    };
})();