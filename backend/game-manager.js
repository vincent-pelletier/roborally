class GameManager {
    stages = {
        A_CHOOSING_CARDS: 'A. Waiting for players to choose cards',
        B_BEGIN_REGISTER: 'B. Begin register', // loop B-G 5 times
        C_ROBOTS_MOVE: 'C. Robots move',
        D_BOARD_ELEMENTS_MOVE: 'D. Board elements move',
        E_BOARD_ELEMENTS_FIRE: 'E. Board elements fire',
        F_ROBOTS_FIRE: 'F. Robots fire',
        G_VERIFY_CHECKPOINTS: 'G. Verify checkpoints',
        H_END_TURN: 'H. End turn'
    };

    constructor(playerBroadcast, serverBroadcast, sendMove, sendNextRegister, sendNextTurn, sendTurnEnd, sendRobotsFire) {
        this.playerBroadcast = playerBroadcast;
        this.serverBroadcast = serverBroadcast;
        this.sendMove = sendMove;
        this.sendNextRegister = sendNextRegister;
        this.sendNextTurn = sendNextTurn;
        this.sendTurnEnd = sendTurnEnd;
        this.sendRobotsFire = sendRobotsFire;
        this.setDefaults();
    }

    setDefaults() {
        this.turn = 1;
        this.register = 1;
        this.players = [];
        this.registers = [];
        this.stage = this.stages.A_CHOOSING_CARDS;
        this.gameInterval = undefined;
        this.sleep = 0; // set this to wait longer than default game interval
    }

    start(players) {
        this.finish();
        this.players = [...players.keys()];
        this.gameInterval = setInterval(this.gameloop.bind(this), 1000);
    }

    finish() {
        if(this.gameInterval) {
            clearInterval(this.gameInterval);
            this.setDefaults();
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

        switch(this.stage) {
            case this.stages.A_CHOOSING_CARDS:
                if(this.registers.length === this.players.length) {
                    this.serverBroadcast('Turn ' + this.turn);
                    this.sendNextTurn({turn: this.turn});
                    this.stage = this.stages.B_BEGIN_REGISTER;
                    this.register = 1;
                }
                break;
            case this.stages.B_BEGIN_REGISTER:
                this.serverBroadcast('Register ' + this.register);
                this.sendNextRegister({turn: this.turn, register: this.register});
                this.stage = this.stages.C_ROBOTS_MOVE;
                break;
            case this.stages.C_ROBOTS_MOVE:
                let most = 0;
                for(const reg of this.registers) {
                    if(reg.register.length >= most) {
                        most = reg.register.length;
                    }
                }
                const possibleCards = [];
                for(const reg of this.registers) {
                    if(reg.register.length === most) {
                        possibleCards.push(reg.register[0]);
                    }
                }
                // sort first card of each register by speed
                possibleCards.sort((a, b) => a.id > b.id ? 1 : -1);

                for(const reg of this.registers) {
                    if(reg.register.length === most) {
                        if(possibleCards[0] === reg.register[0]) {
                            const card = reg.register.shift();
                            this.playerBroadcast(reg.player, card.type);
                            this.sendMove({player: reg.player, type: card.type, id: card.id});

                            if(possibleCards.length == 1) {
                                // played last possible card, all robots moved this register
                                this.stage = this.stages.F_ROBOTS_FIRE; // D, E or F, based on map config. Hardcode F for now.
                            }
                            break;
                        }
                    }
                }
                break;
            case this.stages.D_BOARD_ELEMENTS_MOVE:
                this.serverBroadcast('Board elements move');
                this.stage = this.stages.E_BOARD_ELEMENTS_FIRE;
                break;
            case this.stages.E_BOARD_ELEMENTS_FIRE:
                this.serverBroadcast('Board elements fire');
                this.stage = this.stages.F_ROBOTS_FIRE;
                break;
            case this.stages.F_ROBOTS_FIRE:
                this.serverBroadcast('Robots fire!');
                this.sendRobotsFire();
                this.stage = this.stages.G_VERIFY_CHECKPOINTS;
                this.sleep = 1;
                break;
            case this.stages.G_VERIFY_CHECKPOINTS:
                this.serverBroadcast('Verify checkpoints');
                this.sleep = 1;
                if(this.register < 5) {
                    this.register++;
                    this.stage = this.stages.B_BEGIN_REGISTER;
                } else {
                    this.stage = this.stages.H_END_TURN;
                }
                break;
            case this.stages.H_END_TURN:
                this.serverBroadcast('Finished Turn ' + this.turn);
                this.registers = [];
                this.turn++;
                this.sendTurnEnd();
                this.stage = this.stages.A_CHOOSING_CARDS;
                break;
            default:
                console.log('Unexpected stage: ' + this.stage);
                break;
        }
    }
}

module.exports = GameManager;