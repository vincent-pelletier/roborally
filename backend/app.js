const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Constants = require('../frontend/src/util/constants');
const gameLogic = require('./game-logic');

const app = express();

const server = http.createServer(app);
const io = socketio(server);

io.on(Constants.CONNECTION, client => {
    gameLogic.clientConnected(io, client);
});

server.listen(process.env.PORT || 8000);
console.log('Backend listening...');