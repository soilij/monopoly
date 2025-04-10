let isWebSocketOpen = false;
let playerIndex = -1;
let lastUpdateTime = 0;

const ws = new WebSocket(`ws://${window.location.hostname}:1611`);

ws.onopen = () => {
    console.log('Connected to the server');
    isWebSocketOpen = true;
    document.getElementById('joinGameButton').disabled = false;
    document.getElementById('createGameButton').disabled = false;
};

ws.onclose = () => {
    console.log('Disconnected from the server');
    isWebSocketOpen = false;
    document.getElementById('joinGameButton').disabled = true;
    document.getElementById('createGameButton').disabled = true;
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'gameState') {
        if (data.gameState.lastUpdateTime > lastUpdateTime) {
            updateGameState(data.gameState);
            lastUpdateTime = data.gameState.lastUpdateTime;
        }
    } else if (data.type === 'gameCreated') {
        displayGameId(data.gameId);
        playerIndex = data.playerIndex;
    } else if (data.type === 'gameJoined') {
        playerIndex = data.playerIndex;
    } else if (data.type === 'error') {
        alert(data.message);
    }
};

function updateGameBoard(gameState) {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';

    gameState.squares.forEach((square) => {
        const squareDiv = document.createElement('div');
        squareDiv.className = 'square';
        squareDiv.style.backgroundColor = square.color;
        squareDiv.innerHTML = `
            <h3>${square.name}</h3>
            <p>Price: ${square.pricetext}</p>
            <p>Owner: ${square.owner === 0 ? 'Bank' : `Player ${square.owner}`}</p>
        `;
        gameBoard.appendChild(squareDiv);
    });

    updatePlayerInfo(gameState.players);
}

function updatePlayerInfo(players) {
    const playerInfoDiv = document.getElementById('moneybar');
    playerInfoDiv.innerHTML = '';

    players.forEach((player, index) => {
        const playerRow = document.createElement('tr');
        playerRow.innerHTML = `
            <td class="moneybararrowcell"><img src="images/arrow.png" id="p${index + 1}arrow" class="money-bar-arrow" alt=">" /></td>
            <td id="p${index + 1}moneybar" class="moneybarcell">
                <div><span id="p${index + 1}moneyname">${player.name}</span>:</div>
                <div>$<span id="p${index + 1}money">${player.money}</span></div>
            </td>
        `;
        playerInfoDiv.appendChild(playerRow);
    });
}

function sendMessage(message) {
    if (isWebSocketOpen) {
        ws.send(message);
    } else {
        console.error("WebSocket is not open. Current state: " + ws.readyState);
    }
}

function joinGame() {
    if (!isWebSocketOpen) {
        alert("Please wait for the connection to be established.");
        return;
    }

    const gameId = document.getElementById('gameIdInput').value;
    const playerName = prompt("Enter your name:");
    if (playerName && gameId) {
        sendMessage(JSON.stringify({ action: 'joinGame', name: playerName, gameId: gameId }));
    } else {
        alert("Please enter both your name and Game ID.");
    }
}

function createGame() {
    if (!isWebSocketOpen) {
        alert("Please wait for the connection to be established.");
        return;
    }

    const gameId = generateGameId();
    const playerName = prompt("Enter your name:");
    if (playerName) {
        sendMessage(JSON.stringify({ action: 'createGame', name: playerName, gameId: gameId }));
    } else {
        alert("Please enter your name.");
    }
}

function generateGameId() {
    return Math.random().toString(36).substring(2, 8);
}

function displayGameId(gameId) {
    document.getElementById('generatedGameId').innerText = gameId;
    document.getElementById('gameIdDisplay').style.display = 'block';
}

function updateGameState(gameState) {
    updatePlayerInfo(gameState.players);
    updateBoardState(gameState.squares);
}

function updateBoardState(squares) {
    squares.forEach((square, index) => {
        const cellElement = document.getElementById(`cell${index}`);
        if (cellElement) {
            // Update the cell's appearance based on its state
        }
    });
}

function startGame() {
    const gameId = document.getElementById('generatedGameId').innerText;
    sendMessage(JSON.stringify({ action: 'startGame', gameId: gameId }));
}

// Add a function to request sync from the server
function requestSync() {
    if (isWebSocketOpen) {
        sendMessage(JSON.stringify({ action: 'syncRequest' }));
    }
}

// Call requestSync every 5 seconds
setInterval(requestSync, 5000);