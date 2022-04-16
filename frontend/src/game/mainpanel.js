import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import map from '../assets/Map.png';
import robo1 from '../assets/Robo1.png';
import robo2 from '../assets/Robo2.png';
import robo3 from '../assets/Robo3.png';
import robo4 from '../assets/Robo4.png';
import robo5 from '../assets/Robo5.png';
import robo6 from '../assets/Robo6.png';
import startingMap from '../assets/StartingMap.png';
import PlayerContext from '../context/PlayerContext';
import logo from '../logo.svg';
import Deck from './deck';
import './mainpanel.css';
const Constants = require('../util/constants');
const Type = require('./type');
const socket = require('../connections/socket').socket;

const MainPanel = () => {

    const players = useContext(PlayerContext);

    const minPlayers = 1; // 1 for test, 2 for prod
    const maxPlayers = 6;
    const [gameStarted, setGameStarted] = useState(false);

    const [color, setColor] = useState('neutral');
    const [drawHand, setDrawHand] = useState(0);
    const [discardHand, setDiscardHand] = useState(false);
    const [assignRandom, setAssignRandom] = useState(false);
    const [confirmRegister, setConfirmRegister] = useState(false);
    const [nextCard, setNextCard] = useState({});
    const [cardsVisible, setCardsVisible] = useState(0);

    const [robots, setRobots] = useState([]);
    const robotSrcs = useMemo(() => [robo1, robo2, robo3, robo4, robo5, robo6], []);

    const positionX = Array.from(Array(16), (_,i) => 11 + 60 * i);
    const positionY = Array.from(Array(12), (_,i) => 10 + 60 * i);

    const validatePosition = useCallback((robot) => {
        if(robot.x < 0 || robot.x >= positionX.length || robot.y < 0 || robot.y >= positionY.length) {
            robot.rebooting = true;
            robot.x = robot.respawnX;
            robot.y = robot.respawnY;
            robot.direction = robot.respawnDirection; // player can choose
        }
    }, [positionX, positionY]);

    useEffect(() => {
        for(const p of players) {
            if(p.self) {
                setColor(p.color);
            }
        }
    }, [players]);

    //const [gameTurn, setGameTurn] = useState(1); //this should be in backend
    //const phases = ['Programming', 'Activation'];
    //const registers = [1, 2, 3, 4, 5];
    // https://www.fgbradleys.com/rules/rules4/Robo%20Rally%20-%20rules.pdf
    // game turn
    // phase
    // 1 - programming phase                [x]
    // 1.1. draw 9(-) cards                 [x]
    // 1.2. pick 5, discard others          [x]
    // 2 - activation phase
    // for each of the 5 registers...
    // 2.1. reveal programming card (add display on the left regarding which robot + which move is sent by server)
    // 2.2. move robot (based on priority)  [x]
    // 2.3. board elements activate
    // - 2x (blue) conveyor belts
    // - 1x (green) conveyor belts
    // - push panels
    // - gears
    // - board lasers
    // 2.4. robots fire
    // be on checkpoint!

    // Flow
    // client keeps state of game
    // - manages cards / card locks
    //  - send register to server
    //  - server broadcasts first register received signal
    //  - also a broadcast to mark a player ready (maybe first is ^?)
    //   - updates players as ready and/or puts in chat?
    //  - starts timer countdown on clients
    //  - timer end on client = randomise > send register
    //
    // - server broadcasts all received, register cards are flipped
    // - server orders cards [x], broadcasts one at a time [x]
    // - client receives move, displays it on the left, then executes it 1s later?

    // - each client updates each robot's location
    // - server broadcasts board element activation
    //  - each client updates their map
    //  - for board lasers, they are displayed, each client computes
    //    hp loss of each robot
    //  - same for robot lasers? data doesn't have to go through server...
    // - each client tracks each robot's hp to display (bottom left, with flags)
    // - includes the 1-5 cards of the actual register?
    // timer will be in the top-right
    // reboot zone in the bottom right (have position fct to move there if outside of [][], triggers reboot)
    // rebooting robot can send signal to server which can broadcast in chat
    // clients can know others reboot if they fall off, but not when a player decides to

    // [move] [    |           ] [time]
    // [ r1 ] [    |           ]
    // [ r2 ] [    |           ] [ re ]
    // [ r3 ] [    |           ] [ bo ]
    // [ .. ] [    |           ] [ ot ]
    //          [][][][][]

    // map notes:
    // - pits
    // - walls
    // - priority antenna (not in this version?)

    const gameStartHandle = useCallback(() => {
        // compute valid starting positions, shuffle them, assign to each robot
        const localRobots = [];
        for(let i = 0; i < players.length; i++) {
            const robot = {
                name: 'robo' + (i+1),
                src: robotSrcs[i],
                x: 0,
                y: i,
                direction: 90, // N: 0, E: 90, S: 180, W: 270
                hp: 10,
                rebooting: false,
                respawnX: 0,
                respawnY: i,
                respawnDirection: 90,
                player: players[i]
            };
            localRobots.push(robot);
        }
        setRobots(localRobots);

        setGameStarted(true);
    }, [players, robotSrcs]);

    const nextTurn = useCallback((turn) => {
        if(turn > 0) {
            const localRobots = robots;
            for(const robot of localRobots) {
                if(robot.rebooting) {
                    robot.rebooting = false;
                }
            }
            setRobots(localRobots);
        }
    }, [robots]);

    useEffect(() => {
        socket.on(Constants.SOCKET_STARTED, () => {
            gameStartHandle();
        });

        socket.on(Constants.SOCKET_NEXT_CARD, card => {
            setNextCard(card);
        });

        socket.on(Constants.SOCKET_NEXT_REGISTER, data => {
            setCardsVisible(data.register);
        });

        socket.on(Constants.SOCKET_NEXT_TURN, data => {
            nextTurn(data.turn);
        });

        return () => {
            socket.off(Constants.SOCKET_STARTED);
        };
    }, [gameStartHandle, nextTurn]);

    const start = () => {
        socket.emit(Constants.SOCKET_START);
    };

    const draw = () => {
        setDrawHand(9); // control how many to draw
        setCardsVisible(5);
    };

    const handleOnDrawHandComplete = useCallback(() => {
        setDrawHand(0);
    }, []);

    const discard = () => {
        setDiscardHand(true);
    };

    const handleOnDiscardHandComplete = useCallback(() => {
        setDiscardHand(false);
    }, []);

    const assignRandomTrigger = () => {
        setAssignRandom(true);
    };

    const handleAssignRandomComplete = useCallback(() => {
        setAssignRandom(false);
    }, []);

    const confirmRegisterTrigger = () => {
        setConfirmRegister(true);
    };

    //const [tempReg, setTempReg] = useState([]);
    const handleConfirmRegisterComplete = (reg) => {
        setConfirmRegister(false);
        discard();
        setCardsVisible(0);
        //setTempReg([...reg]); // should we keep a copy, or hide the cards and re-open per register? :P probably keep+hide + reveal on turn start.
        socket.emit(Constants.SOCKET_SEND_REGISTER, {'register': reg});
    }

    const [tempMove, setTempMove] = useState(false);
    // Combine these two useEffect to trigger the moves only once... not great.
    useEffect(() => {
        setTempMove(true);
    }, [nextCard]);

    useEffect(() => {
        if(tempMove) {
            setTempMove(false);
            console.log(nextCard);
            const localRobots = robots;
            for(const robot of localRobots) {
                if(robot.player.id === nextCard.player && !robot.rebooting) {
                    switch(nextCard.type) {
                        case(Type.MOVE_1):
                        case(Type.MOVE_2):
                        case(Type.MOVE_3):
                        case(Type.BACK_UP):
                            // validate no wall in path, else reduce distance
                            // validate if pushing another robot
                            const distance = nextCard.type === Type.MOVE_1 ? 1 :
                                            nextCard.type === Type.MOVE_2 ? 2 :
                                            nextCard.type === Type.MOVE_3 ? 3 : -1;
                            let x = 0;
                            let y = 0;
                            switch(robot.direction) {
                                case 0:
                                    y -= distance;
                                    break;
                                case 90:
                                    x += distance;
                                    break;
                                case 180:
                                    y += distance;
                                    break;
                                case 270:
                                    x -= distance;
                                    break;
                                default:
                                    alert('Unexpected direction: ' + robot.direction);
                                    break;
                            }
                            robot.x += x;
                            robot.y += y;
                            validatePosition(robot);
                            break;
                        case(Type.ROTATE_RIGHT):
                            robot.direction = (robot.direction + 90) % 360;
                            break;
                        case(Type.ROTATE_LEFT):
                            robot.direction = (robot.direction + 270) % 360;
                            break;
                        case(Type.U_TURN):
                            robot.direction = (robot.direction + 180) % 360;
                            break;
                        default:
                            alert('Unexpected card type: ' + nextCard.type);
                            break;
                    }
                    setRobots(localRobots);
                    break;
                }
            }
        }
    }, [nextCard, tempMove, robots, players, validatePosition]);

    return (
        <div className="main">
            {
                gameStarted ? (
                    <div className="game">
                        <div className="board">
                            <img src={startingMap} alt="starting-map" draggable="false"/>
                            <img src={map} alt="map" draggable="false"/>
                            {robots.map((r, i) => <img key={i} src={r.src} alt={r.name} className={'robo direction' + r.direction + (r.rebooting ? ' rebooting' : '')} style={{top: positionY[r.y] + "px", left: positionX[r.x] + "px"}} draggable="false"/>)}
                            {positionX.map((x, i) => positionY.map((y, j) => <span className="grid-loc" key={i*positionX.length + j} style={{top: y + 38 + "px", left: x - 11 + "px"}}>{x + "," + y}</span>))}
                        </div>
                        <div className="inventory">
                            <Deck color={color} drawHand={drawHand} onDrawHandComplete={handleOnDrawHandComplete}
                                discardHand={discardHand} onDiscardHandComplete={handleOnDiscardHandComplete}
                                assignRandom={assignRandom} onAssignRandomComplete={handleAssignRandomComplete}
                                confirmRegister={confirmRegister} onConfirmRegisterComplete={handleConfirmRegisterComplete}
                                cardsVisible={cardsVisible} />
                        </div>
                        <div>
                            <button onClick={draw}>Draw 9</button>
                            <button onClick={discard}>Discard hand</button>
                            <button onClick={assignRandomTrigger}>Assign random</button>
                            <button onClick={confirmRegisterTrigger}>Confirm register</button>
                        </div>
                    </div>
                ) : (
                    <div className="lobby">
                        <img src={logo} className="logo" alt="logo" />
                        {players.length >= minPlayers && players.length <= maxPlayers && players[0]['self'] ? (
                            <button onClick={start}>Start game!</button>
                        ) : (null) }
                    </div>
                )
            }
        </div>
    );
};

export default MainPanel;

