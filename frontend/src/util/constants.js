module.exports = {
    BACKEND_URL: 'http://localhost:8000',
    // client -> server
    CONNECTION: 'connection',                       // player connected
    DISCONNECT: 'disconnect',                       // player disconnected :(
    SOCKET_POKE: 'poke',                            // send poke
    SOCKET_JOIN: 'join',                            // join game
    SOCKET_START: 'start',                          // start game
    SOCKET_CHAT: 'chat',                            // chat message
    SOCKET_SEND_REGISTER: 'send-register',          // send 5 register cards
    // server -> client
    SOCKET_PLAYERS: 'players',                      // players in game
    SOCKET_STARTED: 'started',                      // game starts
    SOCKET_STATUS: 'status',                        // chat message
    SOCKET_REGISTER_CONFIRMED: 'register-confirmed',// a player has confirmed its register (send this for ui, later also send chatbox status with timestamps)
    SOCKET_NEXT_CARD: 'next-card',                  // send next card to be played
    SOCKET_NEXT_REGISTER: 'next-register',          // notify next register starts
    SOCKET_NEXT_TURN: 'next-turn',                  // notify next turn starts
    SOCKET_TURN_END: 'turn-end',                    // notify turn ended
    SOCKET_ROBOTS_FIRE: 'robots-fire',              // notify robot to fire
    // board elements activation notification
    // robot laser fire notification
};