/**
 * Input handling for Penalty Shooters 2
 */

const InputManager = (function() {
    // Private variables
    let canvas = null;
    let mouseX = 0;
    let mouseY = 0;
    let isMouseDown = false;
    let isMouseDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragEndX = 0;
    let dragEndY = 0;
    let touchStartTime = 0;
    let touchDuration = 0;
    let clickHandlers = [];
    let dragHandlers = [];
    let releaseHandlers = [];
    
    // Check if touch is supported
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Helper functions
    function getCanvasCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        if (e.type.startsWith('touch')) {
            const touch = e.touches[0] || e.changedTouches[0];
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        } else {
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    }
    
    // Event handlers
    function handleMouseDown(e) {
        const coords = getCanvasCoordinates(e);
        mouseX = coords.x;
        mouseY = coords.y;
        dragStartX = mouseX;
        dragStartY = mouseY;
        isMouseDown = true;
        isMouseDragging = false;
        touchStartTime = Date.now();
        
        // Trigger click handlers
        clickHandlers.forEach(handler => handler(coords.x, coords.y));
    }
    
    function handleMouseMove(e) {
        if (!isMouseDown) return;
        
        const coords = getCanvasCoordinates(e);
        mouseX = coords.x;
        mouseY = coords.y;
        
        const dragDistance = Math.sqrt(
            Math.pow(mouseX - dragStartX, 2) + 
            Math.pow(mouseY - dragStartY, 2)
        );
        
        if (dragDistance > 5) {
            isMouseDragging = true;
        }
        
        dragEndX = mouseX;
        dragEndY = mouseY;
        
        // Trigger drag handlers
        dragHandlers.forEach(handler => {
            handler(dragStartX, dragStartY, dragEndX, dragEndY, mouseX, mouseY);
        });
    }
    
    function handleMouseUp(e) {
        if (!isMouseDown) return;
        
        const coords = getCanvasCoordinates(e);
        mouseX = coords.x;
        mouseY = coords.y;
        dragEndX = mouseX;
        dragEndY = mouseY;
        
        touchDuration = Date.now() - touchStartTime;
        
        const dragVector = {
            x: dragEndX - dragStartX,
            y: dragEndY - dragStartY,
            magnitude: Math.sqrt(
                Math.pow(dragEndX - dragStartX, 2) + 
                Math.pow(dragEndY - dragStartY, 2)
            )
        };
        
        // Trigger release handlers
        releaseHandlers.forEach(handler => {
            handler(dragStartX, dragStartY, dragEndX, dragEndY, dragVector, touchDuration);
        });
        
        isMouseDown = false;
        isMouseDragging = false;
    }
    
    function handleTouch(e) {
        e.preventDefault(); // Prevent default behavior like scrolling
        
        if (e.type === 'touchstart') {
            handleMouseDown(e);
        } else if (e.type === 'touchmove') {
            handleMouseMove(e);
        } else if (e.type === 'touchend' || e.type === 'touchcancel') {
            handleMouseUp(e);
        }
    }
    
    // Public methods
    return {
        initialize: function(gameCanvas) {
            canvas = gameCanvas;
            
            // Set up event listeners
            if (isTouchDevice) {
                canvas.addEventListener('touchstart', handleTouch, { passive: false });
                canvas.addEventListener('touchmove', handleTouch, { passive: false });
                canvas.addEventListener('touchend', handleTouch, { passive: false });
                canvas.addEventListener('touchcancel', handleTouch, { passive: false });
            } else {
                canvas.addEventListener('mousedown', handleMouseDown);
                canvas.addEventListener('mousemove', handleMouseMove);
                canvas.addEventListener('mouseup', handleMouseUp);
                canvas.addEventListener('mouseleave', handleMouseUp);
            }
            
            // Prevent default right-click menu
            canvas.addEventListener('contextmenu', e => e.preventDefault());
        },
        
        onPress: function(handler) {
            clickHandlers.push(handler);
        },
        
        onDrag: function(handler) {
            dragHandlers.push(handler);
        },
        
        onRelease: function(handler) {
            releaseHandlers.push(handler);
        },
        
        removeHandler: function(handler) {
            clickHandlers = clickHandlers.filter(h => h !== handler);
            dragHandlers = dragHandlers.filter(h => h !== handler);
            releaseHandlers = releaseHandlers.filter(h => h !== handler);
        },
        
        clearHandlers: function() {
            clickHandlers = [];
            dragHandlers = [];
            releaseHandlers = [];
        },
        
        getMousePosition: function() {
            return { x: mouseX, y: mouseY };
        },
        
        isDown: function() {
            return isMouseDown;
        },
        
        isDragging: function() {
            return isMouseDragging;
        },
        
        isTouchSupported: function() {
            return isTouchDevice;
        },
        
        getDragVector: function() {
            return {
                x: dragEndX - dragStartX,
                y: dragEndY - dragStartY,
                magnitude: Math.sqrt(
                    Math.pow(dragEndX - dragStartX, 2) + 
                    Math.pow(dragEndY - dragStartY, 2)
                )
            };
        }
    };
})();