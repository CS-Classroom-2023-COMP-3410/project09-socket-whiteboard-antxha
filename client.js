document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const canvas = document.getElementById('whiteboard');
  const context = canvas.getContext('2d');
  const colorInput = document.getElementById('color-input');
  const brushSizeInput = document.getElementById('brush-size');
  const brushSizeDisplay = document.getElementById('brush-size-display');
  const clearButton = document.getElementById('clear-button');
  const connectionStatus = document.getElementById('connection-status');
  const userCount = document.getElementById('user-count');

  let currentBoardState = []; // To store the drawing commands for redrawing

  // Set canvas dimensions
  function resizeCanvas() {
    // TODO: Set the canvas width and height based on its parent element
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    
    // Redraw the canvas with the current board state when resized
    // TODO: Call redrawCanvas() function
    redrawCanvas(currentBoardState);
  }

  // Initialize canvas size
  // TODO: Call resizeCanvas()
  resizeCanvas();
  
  // Handle window resize
  // TODO: Add an event listener for the 'resize' event that calls resizeCanvas
  window.addEventListener('resize', resizeCanvas);

  // Drawing variables
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  // Connect to Socket.IO server
  // TODO: Create a socket connection to the server at 'http://localhost:3000'
  const socket = io('http://localhost:3000');

  // TODO: Set up Socket.IO event handlers
  socket.on('connect', () => {
    connectionStatus.textContent = 'Connected';
    connectionStatus.classList.add('connected');
    console.log('Connected to server with ID:', socket.id);
  });

  socket.on('disconnect', () => {
    connectionStatus.textContent = 'Disconnected';
    connectionStatus.classList.remove('connected');
    console.log('Disconnected from server');
  });

  socket.on('boardState', (board) => {
    console.log('Received initial board state');
    currentBoardState = board; // Store the initial state
    redrawCanvas(currentBoardState);
  });

  socket.on('draw', (data) => {
    // Add to local board state for potential redraws if implementing that way,
    // or rely on server sending full state if that's the strategy.
    // For this assignment, the server sends individual draw commands.
    currentBoardState.push(data); // Keep local state in sync
    drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size);
  });

  socket.on('clear', () => {
    console.log('Received clear event');
    currentBoardState = []; // Clear local board state
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the visual canvas
  });

  socket.on('currentUsers', (count) => {
    userCount.textContent = count;
  });

  // Canvas event handlers
  // TODO: Add event listeners for mouse events (mousedown, mousemove, mouseup, mouseout)
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing); // Stop drawing if mouse leaves canvas
  
  // Touch support (optional)
  // TODO: Add event listeners for touch events (touchstart, touchmove, touchend, touchcancel)
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);
  canvas.addEventListener('touchcancel', stopDrawing);
  
  // Clear button event handler
  // TODO: Add event listener for the clear button
  clearButton.addEventListener('click', clearCanvas);

  // Update brush size display
  // TODO: Add event listener for brush size input changes
  brushSizeInput.addEventListener('input', (e) => {
    brushSizeDisplay.textContent = e.target.value;
  });

  // Drawing functions
  function startDrawing(e) {
    // TODO: Set isDrawing to true and capture initial coordinates
    isDrawing = true;
    const coords = getCoordinates(e);
    if (coords) {
      [lastX, lastY] = [coords.x, coords.y];
    }
  }

  function draw(e) {
    // TODO: If not drawing, return
    if (!isDrawing) return;

    // TODO: Get current coordinates
    const coords = getCoordinates(e);
    if (!coords) return;

    const currentX = coords.x;
    const currentY = coords.y;
    
    // TODO: Emit 'draw' event to the server with drawing data
    const drawData = {
      x0: lastX,
      y0: lastY,
      x1: currentX,
      y1: currentY,
      color: colorInput.value,
      size: parseInt(brushSizeInput.value, 10)
    };
    socket.emit('draw', drawData);
    
    // TODO: Update last position
    // The actual drawing happens when the server broadcasts the event back
    // However, for responsiveness, you might draw locally too, but the assignment hints
    // to draw only on server events to ensure sync. We will follow that.
    // The server will broadcast this drawData back, and then drawLine will be called.
    lastX = currentX;
    lastY = currentY;
  }

  function drawLine(x0, y0, x1, y1, color, size) {
    // TODO: Draw a line on the canvas using the provided parameters
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = size;
    context.lineCap = 'round'; // Makes the line ends smoother
    context.lineJoin = 'round'; // Makes the line joins smoother
    context.stroke();
    context.closePath();
  }

  function stopDrawing() {
    // TODO: Set isDrawing to false
    isDrawing = false;
  }

  function clearCanvas() {
    // TODO: Emit 'clear' event to the server
    socket.emit('clear');
    // The actual clearing of the canvas and boardState will happen
    // when the server broadcasts the 'clear' event back.
  }

  function redrawCanvas(boardState = []) {
    // TODO: Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // TODO: Redraw all lines from the board state
    boardState.forEach(data => {
      drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size);
    });
  }

  // Helper function to get coordinates from mouse or touch event
  function getCoordinates(e) {
    // TODO: Extract coordinates from the event (for both mouse and touch events)
    // HINT: For touch events, use e.touches[0] or e.changedTouches[0]
    // HINT: For mouse events, use e.offsetX and e.offsetY
    let x, y;
    const rect = canvas.getBoundingClientRect(); // Get canvas position relative to viewport

    if (e.touches && e.touches.length > 0) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else if (e.changedTouches && e.changedTouches.length > 0) { // For touchend
      x = e.changedTouches[0].clientX - rect.left;
      y = e.changedTouches[0].clientY - rect.top;
    } else if (e.offsetX !== undefined && e.offsetY !== undefined) {
      x = e.offsetX;
      y = e.offsetY;
    } else { // Fallback if offsetX/Y are not available (e.g., older browsers or specific events)
        if (e.clientX !== undefined && e.clientY !== undefined) {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        } else {
            return null; // Cannot determine coordinates
        }
    }
    return { x, y };
  }

  // Handle touch events
  function handleTouchStart(e) {
    // TODO: Prevent default behavior and call startDrawing
    if (e.touches.length === 1) { // Handle single touch for drawing
        e.preventDefault(); // Prevent scrolling, etc.
        startDrawing(e);
    }
  }

  function handleTouchMove(e) {
    // TODO: Prevent default behavior and call draw
    if (e.touches.length === 1) { // Handle single touch for drawing
        e.preventDefault(); // Prevent scrolling, etc.
        draw(e);
    }
  }
});