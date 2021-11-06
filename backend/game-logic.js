const Constants = require('../frontend/src/util/constants');
var io;
var gameSocket;

const clientConnected = (sio, client) => {
    io = sio;
    gameSocket = client;

    // bind functions to the socket that just connected
    gameSocket.on(Constants.SOCKET_POKE, poke);
};

function poke(data) {
    console.log(data);
    io.sockets.emit(Constants.SOCKET_POKEBACK, {'by': 'io.sockets.emit'}); // all sockets
    gameSocket.emit(Constants.SOCKET_POKEBACK, {'by': 'gameSocket.emit'}); // last socket to have connected...
    this.emit(Constants.SOCKET_POKEBACK, {'by': 'this.emit'}); // caller socket
}

exports.clientConnected = clientConnected;