class GameManager {
    constructor(playerBroadcast, serverBroadcast, sendMove) {
        this.playerBroadcast = playerBroadcast;
        this.serverBroadcast = serverBroadcast;
        this.sendMove = sendMove;
        this.turn = 1;
        this.lastTurnSent = 0;
        this.lastRegisterSent = 0;
        this.players = [];
        this.registers = [];
        this.gameInterval = undefined;
        this.sleep = 0; // set this to wait longer than default game interval
    }

    start(players) {
        this.players = [...players.keys()];
        this.gameInterval = setInterval(this.gameloop.bind(this), 1000);
    }

    finish() {
        if(this.gameInterval) {
            clearInterval(this.gameInterval);
            console.log('Ended');
        }
    }

    addRegister(player, reg) {
        this.registers.push({player: player, register: reg});
    }

    gameloop() {
        if(this.sleep > 0) {
            this.sleep--;
            return;
        }

        if(this.registers.length === this.players.length) {
            if(this.turn > this.lastTurnSent) {
                this.serverBroadcast('Turn ' + this.turn);
                this.lastTurnSent = this.turn;
                return;
            }

            let most = 0;
            for(const reg of this.registers) {
                if(reg.register.length >= most) {
                    most = reg.register.length;
                }
            }
            if(most > 0) {
                const possibleCards = [];
                let first = true;
                for(const reg of this.registers) {
                    if(reg.register.length === most) {
                        if(first) {
                            const regNum = 6 - most;
                            if(this.lastRegisterSent !== regNum) {
                                this.serverBroadcast('Register ' + regNum);
                                this.lastRegisterSent = regNum;
                                return;
                            }
                        }
                        possibleCards.push(reg.register[0]);
                    }
                    first = false;
                }
                // sort first card of each register by speed
                possibleCards.sort((a, b) => a.id > b.id ? 1 : -1);

                for(const reg of this.registers) {
                    if(reg.register.length === most) {
                        if(possibleCards[0] === reg.register[0]) {
                            const card = reg.register.shift();
                            this.playerBroadcast(reg.player, card.type);
                            this.sendMove({player: reg.player, type: card.type, id: card.id});
                            break;
                        }
                    }
                }
            } else {
                this.registers = [];
                this.turn++;
            }
        }
    }
}

module.exports = GameManager;