let peer;
let conn; // The connection object for sending/receiving data

// UI Elements
const generateIdBtn = document.getElementById('generateIdBtn');
const peerIdDisplay = document.getElementById('peerIdDisplay');
const copyIdBtn = document.getElementById('copyIdBtn');
const connectionIdInput = document.getElementById('connectionIdInput');
const connectBtn = document.getElementById('connectBtn');
const statusEl = document.getElementById('status');
const outgoingTextarea = document.getElementById('outgoingText');
const receivedTextarea = document.getElementById('receivedText');
const sendTextBtn = document.getElementById('sendTextBtn');
const copyReceivedBtn = document.getElementById('copyReceivedBtn');

// Set current year in footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

// --- Utility Functions ---

// Generates a random alphanumeric ID of a specified length
function generateRandomId(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// Update status message with appropriate styling
function updateStatus(message, type = '') {
    statusEl.textContent = message;
    statusEl.className = 'status-message'; // Reset classes
    if (type) {
        statusEl.classList.add(type);
    }
}

// Copy Peer ID to clipboard
copyIdBtn.addEventListener('click', async () => {
    const id = peerIdDisplay.textContent;
    if (id && id !== 'Not generated yet.') {
        try {
            await navigator.clipboard.writeText(id);
            alert('Connection ID copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy ID: ', err);
            alert('Failed to copy ID. Please copy it manually.');
        }
    }
});

// Copy Received Text to clipboard
copyReceivedBtn.addEventListener('click', async () => {
    const text = receivedTextarea.value;
    if (text) {
        try {
            await navigator.clipboard.writeText(text);
            alert('Received text copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy received text: ', err);
            alert('Failed to copy received text. Please copy it manually.');
        }
    } else {
        alert('No text to copy.');
    }
});

// --- PeerJS Initialization & Connection Logic ---

// Function to initialize PeerJS with a custom ID
function initializePeerWithId(id) {
    if (peer && !peer.destroyed) {
        peer.destroy(); // Destroy previous Peer instance if it exists
    }
    
    updateStatus(`Status: Attempting to generate ID: ${id}...`, 'connecting');
    peerIdDisplay.textContent = id; // Show the ID we are trying to use
    
    peer = new Peer(id); // Initialize PeerJS with our custom ID

    peer.on('open', (assignedId) => {
        // PeerJS might re-assign if our ID was taken, but usually not if we specified it.
        // We trust our specified ID here.
        peerIdDisplay.textContent = assignedId;
        updateStatus(`Status: Your ID is ${assignedId}. Ready to connect or be connected to.`, 'connected');
        console.log('My Peer ID:', assignedId);
    });

    peer.on('connection', (newConn) => {
        console.log('Incoming connection from:', newConn.peer);
        updateStatus(`Status: Incoming connection from ${newConn.peer}.`, 'connecting');
        
        if (conn && conn.open) {
            console.warn('Closing existing connection to accept new one.');
            conn.close();
        }
        conn = newConn; // Assign the new connection
        setupConnectionEvents(conn);
    });

    peer.on('error', (err) => {
        console.error('PeerJS Error:', err);
        if (err.type === 'unavailable-id') {
            updateStatus(`Status: ID "${id}" is already taken. Please click "Generate My ID" again.`, 'error');
            peerIdDisplay.textContent = 'ID taken.'; // Indicate ID is taken
            generateIdBtn.disabled = false; // Re-enable generate button to try again
        } else if (err.type === 'browser-incompatible') {
            updateStatus('Status: Your browser does not support WebRTC.', 'error');
            alert('Your browser does not support WebRTC. Please use a modern browser like Chrome, Firefox, or Edge.');
        } else if (err.type === 'peer-unavailable') {
            // This error is typically handled by the connection logic, not the peer itself
            // but good to keep it in mind if needed for more complex error handling
            updateStatus(`Status: Could not connect. Peer might be offline or ID is incorrect.`, 'error');
        } else {
            updateStatus(`Status: Error - ${err.message}`, 'error');
        }
    });
}


// Generate Peer ID Button Click
generateIdBtn.addEventListener('click', () => {
    // Generate a 6-character random ID
    const customId = generateRandomId(6);
    initializePeerWithId(customId);
    generateIdBtn.disabled = true; // Disable until success or error
});


// Connect to another peer
connectBtn.addEventListener('click', () => {
    const remoteId = connectionIdInput.value.trim();
    if (!remoteId) {
        alert('Please enter the other person\'s ID.');
        return;
    }
    // If peer is not initialized yet, initialize it first with no specific ID,
    // as it will only be connecting to someone else.
    if (!peer || peer.destroyed) {
        updateStatus('Status: Initializing peer connection...', 'connecting');
        // If we don't have our own ID, create a peer instance without one for connecting.
        // PeerJS will generate one internally if needed for the connection.
        peer = new Peer(); 
        
        peer.on('open', () => {
            console.log('Peer initialized for connecting.');
            // Once opened, proceed to connect
            attemptConnection(remoteId);
        });
        peer.on('error', (err) => {
            console.error('PeerJS Initialization Error:', err);
            updateStatus(`Status: Error initializing connection - ${err.message}`, 'error');
        });
    } else {
        // If peer is already initialized, just attempt connection directly
        attemptConnection(remoteId);
    }
});

// Helper function to attempt connection
function attemptConnection(remoteId) {
    updateStatus(`Status: Attempting to connect to ${remoteId}...`, 'connecting');
    
    // If we already have an active connection, close the old one
    if (conn && conn.open) {
        console.warn('Closing existing connection to initiate new one.');
        conn.close();
    }
    conn = peer.connect(remoteId); // Initiate connection to remote ID
    setupConnectionEvents(conn);
}


// --- Data Channel and Text Sharing Logic ---

// Set up event listeners for the data connection
function setupConnectionEvents(connection) {
    connection.on('open', () => {
        console.log('Connection opened!');
        updateStatus(`Status: Connected to ${connection.peer}!`, 'connected');
        sendTextBtn.disabled = false; // Enable send button
        outgoingTextarea.focus(); // Focus on outgoing text area
    });

    connection.on('data', (data) => {
        console.log('Received data:', data);
        receivedTextarea.value += data + '\n'; // Append received text
        receivedTextarea.scrollTop = receivedTextarea.scrollHeight; // Scroll to bottom
    });

    connection.on('close', () => {
        console.log('Connection closed!');
        updateStatus('Status: Disconnected.', 'disconnected');
        sendTextBtn.disabled = true;
        conn = null; // Clear connection
    });

    connection.on('error', (err) => {
        console.error('Connection Error:', err);
        updateStatus(`Status: Connection Error - ${err.message}`, 'error');
    });
}

// Send text
sendTextBtn.addEventListener('click', () => {
    const text = outgoingTextarea.value.trim();
    if (!text) {
        alert('Please type some text to send.');
        return;
    }
    if (conn && conn.open) {
        conn.send(text);
        outgoingTextarea.value = ''; // Clear input after sending
        console.log('Text sent:', text);
    } else {
        updateStatus('Status: Not connected to a peer yet!', 'error');
    }
});


// Initial state
sendTextBtn.disabled = true;