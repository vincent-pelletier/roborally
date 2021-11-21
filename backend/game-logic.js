const Constants = require('../frontend/src/util/constants');

const gameId = '1';
const maxPlayers = 6;

let io;
const players = new Map(); // key: socketId, value: name

const clientConnected = (sio, client) => {
    io = sio;

    // bind functions to the socket that just connected
    client.on(Constants.DISCONNECT, playerDisconnected);
    client.on(Constants.SOCKET_JOIN, playerJoined);
    client.on(Constants.SOCKET_POKE, poked);
    client.on(Constants.SOCKET_START, startGame);
    client.on(Constants.SOCKET_CHAT, chat);
    sendStatusFromServer(client, 'Connected!');
};

function playerDisconnected(data) {
    // closing client means losing game progress... implement something to ask for confirmation client-side?
    if(players.has(this.id)) {
        players.delete(this.id);
    }
    if(players.size > 0) {
        updatePlayers();
    }
}

function playerJoined(data) {
    if(players.size == 0) {
        // create game
        this.join(gameId);
        players.set(this.id, data.name);
        sendStatus(this, 'Created game ' + gameId);
    } else {
        if(players.has(this.id)) {
            // client no longer allows updating name... keep this block in case we want to re-add it later
            const oldName = players.get(this.id);
            if(oldName === data.name) {
                return;
            }
            players.set(this.id, data.name);
            broadcastStatus(this.id, 'Updated name from ' + oldName);
        } else {
            const room = io.sockets.adapter.rooms.get(gameId);
            if(room === undefined) {
                sendStatus(this, 'Error game does not exist');
                return;
            }
            if(room.size < maxPlayers) {
                this.join(gameId);
                players.set(this.id, data.name);
                broadcastStatus(this.id, 'Joined game ' + gameId);
            } else {
                sendStatus(this, 'Error game is full (' + players.size + '/' + room.size + ')');
                return;
            }
        }
    }
    updatePlayers();
}

function sendStatusFromServer(socket, message) {
    socket.emit(Constants.SOCKET_STATUS, { from: 'server', message : message });
}

function sendStatus(socket, message) {
    socket.emit(Constants.SOCKET_STATUS, { from: socket.id, message : message });
}

function poked(data) {
    broadcastStatus(this.id, '*poke*');
}

function broadcastStatusFromServer(message) {
    broadcastStatus('server', message);
}

function broadcastStatus(from, message) {
    // io.sockets.emit(Constants.SOCKET_STATUS, { message : message }); // all players
    io.sockets.in(gameId).emit(Constants.SOCKET_STATUS, { from: from, message : message }); // registered players
}

function updatePlayers() {
    io.sockets.in(gameId).emit(Constants.SOCKET_PLAYERS, { players: JSON.stringify(Array.from(players)) });
}

function startGame() {
    io.sockets.in(gameId).emit(Constants.SOCKET_STARTED, { data: 'tbd' });
    broadcastStatusFromServer('Game started!');
}

function chat(data) {
    broadcastStatus(this.id, data.message);
}

exports.clientConnected = clientConnected;