import io from 'socket.io-client';
const Constants = require('../util/constants')

const socket = io(Constants.BACKEND_URL);

export { socket };

