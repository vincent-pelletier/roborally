const Constants = require('../frontend/src/util/constants');

const gameId = '1';
const maxPlayers = 6;

var io;
var players = new Map(); // key: socketId, value: name

const clientConnected = (sio, client) => {
    io = sio;

    // bind functions to the socket that just connected
    client.on(Constants.DISCONNECT, playerDisconnected);
    client.on(Constants.SOCKET_JOIN, playerJoined);
    client.on(Constants.SOCKET_POKE, poked);
    client.on(Constants.SOCKET_START, startGame);
    sendStatus(client, 'Connected!');
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
        sendStatus(this, 'Created game: ' + gameId);
    } else {
        if(players.has(this.id)) {
            players.set(this.id, data.name);
            sendStatus(this, 'Updated name');
        } else {
            var room = io.sockets.adapter.rooms.get(gameId);
            if(room === undefined) {
                sendStatus(this, 'Error game does not exist');
                return;
            }
            if(room.size < maxPlayers) {
                this.join(gameId);
                players.set(this.id, data.name);
                sendStatus(this, 'Joined game: ' + gameId);
            } else {
                sendStatus(this, 'Error game is full (' + players.size + '/' + room.size + ')');
                return;
            }
        }
    }
    updatePlayers();
}

function poked(data) {
    broadcastStatus('Poked by ' + players.get(data.id));
}

function sendStatus(socket, message) {
    socket.emit(Constants.SOCKET_STATUS, { message : message });
}

function broadcastStatus(message) {
    // io.sockets.emit(Constants.SOCKET_STATUS, { message : message }); // all players
    io.sockets.in(gameId).emit(Constants.SOCKET_STATUS, { message : message }); // registered players
}

function updatePlayers() {
    io.sockets.in(gameId).emit(Constants.SOCKET_PLAYERS, { players: JSON.stringify(Array.from(players)) });
}

function startGame() {
    io.sockets.in(gameId).emit(Constants.SOCKET_STARTED, { data: 'tbd' });
    broadcastStatus('Game started!');
}

exports.clientConnected = clientConnected;