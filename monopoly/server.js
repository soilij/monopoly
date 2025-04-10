const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let gameRooms = {}; // To store game rooms

// Serve static files
app.use(express.static(path.join(__dirname)));

function createGameState() {
    return {
        players: [],
        currentTurn: 0,
        squares: initializeSquares(),
        lastUpdateTime: Date.now(),
    };
}

function initializeSquares() {
    // Initialize the squares array based on the Monopoly board
    // This is a simplified version, you'll need to add all properties
    return [
        { name: "Go", type: "corner" },
        { name: "Mediterranean Avenue", type: "property", price: 60, owner: null },
        // ... add all other squares
    ];
}

function handleCreateGame(ws, data) {
    const { name, gameId } = data;
    if (!gameRooms[gameId]) {
        gameRooms[gameId] = createGameState();
        gameRooms[gameId].players.push({ name, money: 1500, position: 0 });
        ws.gameId = gameId;
        ws.playerName = name;
        ws.send(JSON.stringify({ type: 'gameCreated', gameId, playerIndex: 0 }));
        broadcastGameState(gameId);
    } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Game ID already exists' }));
    }
}

function handleJoinGame(ws, data) {
    const { name, gameId } = data;
    if (gameRooms[gameId]) {
        if (gameRooms[gameId].players.length < 8) {
            const playerIndex = gameRooms[gameId].players.length;
            gameRooms[gameId].players.push({ name, money: 1500, position: 0 });
            ws.gameId = gameId;
            ws.playerName = name;
            ws.send(JSON.stringify({ type: 'gameJoined', gameId, playerIndex }));
            broadcastGameState(gameId);
        } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Game is full' }));
        }
    } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
    }
}

function handleStartGame(ws, data) {
    const { gameId } = data;
    if (gameRooms[gameId]) {
        gameRooms[gameId].started = true;
        broadcastGameState(gameId);
    }
}

function broadcastGameState(gameId) {
    const gameState = gameRooms[gameId];
    gameState.lastUpdateTime = Date.now();
    const message = JSON.stringify({ type: 'gameState', gameState });
    wss.clients.forEach((client) => {
        if (client.gameId === gameId && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        const data = JSON.parse(message);

        switch (data.action) {
            case 'createGame':
                handleCreateGame(ws, data);
                break;
            case 'joinGame':
                handleJoinGame(ws, data);
                break;
            case 'startGame':
                handleStartGame(ws, data);
                break;
            case 'syncRequest':
                if (ws.gameId && gameRooms[ws.gameId]) {
                    ws.send(JSON.stringify({ type: 'gameState', gameState: gameRooms[ws.gameId] }));
                }
                break;
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (ws.gameId && ws.playerName) {
            const gameRoom = gameRooms[ws.gameId];
            if (gameRoom) {
                gameRoom.players = gameRoom.players.filter(p => p.name !== ws.playerName);
                if (gameRoom.players.length === 0) {
                    delete gameRooms[ws.gameId];
                } else {
                    broadcastGameState(ws.gameId);
                }
            }
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(1611, '0.0.0.0', () => {
    console.log('Server is listening on all network interfaces on port 1611');
});