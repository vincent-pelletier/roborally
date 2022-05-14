import React, { useCallback, useContext, useEffect, useState } from 'react';
import flag1 from '../assets/Flag1.png';
import flag2 from '../assets/Flag2.png';
import flag3 from '../assets/Flag3.png';
import map from '../assets/Map.png';
import startingMap from '../assets/StartingMap.png';
import PlayerContext from '../context/PlayerContext';
import logo from '../logo.svg';
import Card from './card';
import Deck from './deck';
import Flag from './flag';
import Laser from './laser';
import './mainpanel.css';
import Robot from './robot';
import RobotDetail from './robotdetail';
import Wall from './wall';

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
    const [canDraw, setCanDraw] = useState(true);
    const [canChooseCards, setCanChooseCards] = useState(false);

    const [lastCardPlayed, setLastCardPlayed] = useState({id: 0, type: '', color: 'neutral'});

    const [robots, setRobots] = useState([]);

    const [robotsFire, setRobotsFire] = useState(false);
    const [lasers, setLasers] = useState([]);

    const [flags, setFlags] = useState([]);
    const [walls, setWalls] = useState([]); // for display
    const [allWalls, setAllWalls] = useState([]); // includes mirrors, for collisions

    const positionX = Array.from(Array(16), (_,i) => 11 + 60 * i);
    const positionY = Array.from(Array(12), (_,i) => 10 + 60 * i);

    const validateRobot = useCallback((robot) => {
        if(robot.x < 0 || robot.x >= positionX.length || robot.y < 0 || robot.y >= positionY.length || robot.hp === 0) {
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

    // https://www.fgbradleys.com/rules/rules4/Robo%20Rally%20-%20rules.pdf
    // game turn
    // phase
    // 1 - programming phase                [x]
    // 1.1. draw 9(-) cards                 [x]
    // 1.2. pick 5, discard others          [x]
    // 2 - activation phase
    // for each of the 5 registers...
    // 2.1. reveal programming card         [x]
    // 2.2. move robot (based on priority)  [x]
    // 2.3. board elements activate
    // - 2x (blue) conveyor belts
    // - 1x (green) conveyor belts
    // - push panels
    // - gears
    // - board lasers
    // 2.4. robots fire                     [x]
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
    // - server broadcasts all received [x], register cards are flipped [x]
    // - server orders cards [x], broadcasts one at a time [x]
    // - client receives move [x], displays it on the left [x], then executes it [x] 1s later?

    // - each client updates each robot's location
    // - server broadcasts board element activation
    //  - each client updates their map
    //  - for board lasers, they are displayed, each client computes
    //    hp loss of each robot
    //  - same for robot lasers? data doesn't have to go through server... [x]
    // - each client tracks each robot's hp to display (bottom left, with flags) [x]
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
        const startingPositions = [
            {x: 1, y: 5},
            {x: 1, y: 6},
            {x: 1, y: 3},
            {x: 1, y: 8},
            {x: 1, y: 1},
            {x: 1, y: 10},
            {x: 1, y: 0},
            {x: 1, y: 11}
        ];
        const playerRandomOrder = players.map(p => p.id).sort();

        const localRobots = [];
        const localLasers = [];
        for(let i = 0; i < players.length; i++) {
            const robot = {
                id: i,
                x: startingPositions[playerRandomOrder.indexOf(players[i].id)].x,
                y: startingPositions[playerRandomOrder.indexOf(players[i].id)].y,
                direction: 90, // N: 0, E: 90, S: 180, W: 270
                hp: 10,
                flags: 0,
                rebooting: false,
                respawnX: 0,
                respawnY: i,
                respawnDirection: 90,
                player: players[i]
            };
            localRobots.push(robot);
            localLasers.push({id: i, active: false, x: 0, y: 0, length: 0, direction: 0, targetPx: 0});
        }
        setRobots(localRobots);
        setLasers(localLasers);

        const localFlags = [];
        localFlags.push({id: 1, src: flag1, x: 14, y: 7});
        localFlags.push({id: 2, src: flag2, x: 8, y: 9});
        localFlags.push({id: 3, src: flag3, x: 11, y: 1});
        setFlags(localFlags);

        const localWalls = [];
        localWalls.push({x: 1, y: 1, direction: 0});
        localWalls.push({x: 1, y: 3, direction: 0});
        localWalls.push({x: 1, y: 5, direction: 0});
        localWalls.push({x: 1, y: 6, direction: 0});
        localWalls.push({x: 1, y: 7, direction: 0});
        localWalls.push({x: 1, y: 9, direction: 0});
        localWalls.push({x: 1, y: 11, direction: 0});

        localWalls.push({x: 0, y: 2, direction: 270});
        localWalls.push({x: 0, y: 4, direction: 270});
        localWalls.push({x: 0, y: 7, direction: 270});
        localWalls.push({x: 0, y: 9, direction: 270});

        localWalls.push({x: 3, y: 2, direction: 90});
        localWalls.push({x: 3, y: 4, direction: 90});
        localWalls.push({x: 3, y: 7, direction: 90});
        localWalls.push({x: 3, y: 9, direction: 90});

        /*localWalls.push({x: 1, y: 6, direction: 270});
        localWalls.push({x: 3, y: 6, direction: 270});
        localWalls.push({x: 9, y: 6, direction: 90});
        localWalls.push({x: 11, y: 6, direction: 90});
        localWalls.push({x: 6, y: 1, direction: 0});
        localWalls.push({x: 6, y: 3, direction: 0});
        localWalls.push({x: 6, y: 8, direction: 180});
        localWalls.push({x: 6, y: 10, direction: 180});*/

        setWalls(localWalls);

        const mirrorWalls = [];
        for(const wall of localWalls) {
            let mirror = {x: wall.x, y: wall.y, direction: (wall.direction + 180) % 360};
            switch(wall.direction) {
                case 0:
                    mirror.y--;
                    break;
                case 90:
                    mirror.x++;
                    break;
                case 180:
                    mirror.y++;
                    break;
                case 270:
                    mirror.x--;
                    break;
                default:
                    break;
            }
            if(mirror.x >= 0 && mirror.y >= 0) {
                mirrorWalls.push(mirror);
            }
        }
        setAllWalls([...localWalls, ...mirrorWalls]);

        setGameStarted(true);
    }, [players]);

    const nextTurn = useCallback((turn) => {
        if(turn > 0) {
            for(const robot of robots) {
                if(robot.rebooting) {
                    robot.rebooting = false;
                }
            }
        }
    }, [robots]);

    const fire = useEffect(() => {
        if(robotsFire) {
            setRobotsFire(false);
            for(const robot of robots) {
                if(robot.rebooting) {
                    continue;
                }

                let length = 0;
                const wallsInFront = allWalls.filter(w => w.direction === robot.direction && (
                    (robot.direction === 0 && w.x === robot.x && w.y <= robot.y) ||
                    (robot.direction === 180 && w.x === robot.x && w.y >= robot.y) ||
                    (robot.direction === 90 && w.y === robot.y && w.x >= robot.x) ||
                    (robot.direction === 270 && w.y === robot.y && w.x <= robot.x)));
                switch(robot.direction) {
                    case 0:
                        if(wallsInFront.length > 0) {
                            length = robot.y - Math.max(...wallsInFront.map(w => w.y));
                        } else {
                            length = robot.y;
                        }
                        break;
                    case 90:
                        if(wallsInFront.length > 0) {
                            length = Math.min(...wallsInFront.map(w => w.x)) - robot.x;
                        } else {
                            length = positionX.length - robot.x;
                        }
                        break;
                    case 180:
                        if(wallsInFront.length > 0) {
                            length = Math.min(...wallsInFront.map(w => w.y)) - robot.y;
                        } else {
                            length = positionY.length - robot.y;
                        }
                        break;
                    case 270:
                        if(wallsInFront.length > 0) {
                            length = robot.x - Math.max(...wallsInFront.map(w => w.x));
                        } else {
                            length = robot.x;
                        }
                        break;
                    default:
                        alert('Unexpected direction ' + robot.direction);
                        break;
                }

                // adjust length to the first robot it might hit
                const otherRobots = robots.filter(r => r.id !== robot.id);
                let hit = false;
                for(let i = 1; i <= length; i++) {
                    if(hit) {
                        break;
                    }
                    let targetX;
                    let targetY;
                    switch(robot.direction) {
                        case 0:
                            targetX = robot.x;
                            targetY = robot.y - i;
                            break;
                        case 90:
                            targetX = robot.x + i;
                            targetY = robot.y;
                            break;
                        case 180:
                            targetX = robot.x;
                            targetY = robot.y + i;
                            break;
                        case 270:
                            targetX = robot.x - i;
                            targetY = robot.y;
                            break;
                        default:
                            break;
                    }
                    for(const otherRobot of otherRobots) {
                        if(otherRobot.x === targetX && otherRobot.y === targetY) {
                            hit = true;
                            length = (robot.direction === 90 || robot.direction === 180) ? i + 1 : i;
                            if(otherRobot.hp > 0) {
                                otherRobot.hp--; // triggers multiple times ;_;
                            }
                            validateRobot(otherRobot);
                            break;
                        }
                    }
                }

                if(!hit && wallsInFront.length > 0) {
                    length = (robot.direction === 90 || robot.direction === 180) ? length + 1 : length;
                }

                for(let i = 0; i <= length; i++) {
                    setTimeout(() => setLasers(ls => ls.map(l => l.id !== robot.id ? l : {id: robot.id, active: true, x: robot.x, y: robot.y, length: i, direction: robot.direction, targetPx: hit ? 20 : 0})), i * 35);
                }
                setTimeout(() => setLasers(ls => ls.map(l => l.id !== robot.id ? l : {id: robot.id, active: false, x: 0, y: 0, length: 0, direction: 0, targetPx: 0})), 1000);
            }
        }
    }, [positionX, positionY, robots, allWalls, robotsFire, validateRobot]);

    const verifyCheckpoints = useCallback(() => {
        for(const robot of robots) {
            if(robot.rebooting) continue; // validate if this is the rule
            for(const flag of flags) {
                if(robot.x === flag.x && robot.y === flag.y && robot.flags === flag.id - 1) {
                    robot.flags++; // only updates ui with next register...
                    robot.respawnX = flag.x;
                    robot.respawnY = flag.y;
                    // Write in chatbox?
                    if(flag.id === 3) {
                        console.log(robot.player.name + ' wins!');
                    }
                }
            }
        }
    }, [robots, flags]);

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

        socket.on(Constants.SOCKET_ROBOTS_FIRE, () => {
            // TODO why is this invoked multiple times?
            setRobotsFire(true);
        });

        socket.on(Constants.SOCKET_VERIFY_CHECKPOINTS, () => {
            verifyCheckpoints();
        });

        socket.on(Constants.SOCKET_TURN_END, () => {
            // TODO why is this invoked multiple times?
            setLastCardPlayed({id: 0, type: '', color: 'neutral'});
            // discard previous register?
            setCanDraw(true);
        });

        return () => {
            socket.off(Constants.SOCKET_STARTED);
        };
    }, [gameStartHandle, nextTurn, verifyCheckpoints, fire]);

    const start = () => {
        socket.emit(Constants.SOCKET_START);
    };

    const draw = () => {
        setDrawHand(true);
        setCardsVisible(5);
    };

    const handleOnDrawHandComplete = useCallback(() => {
        setDrawHand(false);
        setCanDraw(false);
        setCanChooseCards(true);
    }, []);

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

    const handleConfirmRegisterComplete = (reg) => {
        setConfirmRegister(false);
        if(reg) {
            setCanChooseCards(false);
            setDiscardHand(true);
            setCardsVisible(0);
            socket.emit(Constants.SOCKET_SEND_REGISTER, {'register': reg});
        }
    }

    const [tempMove, setTempMove] = useState(false);
    // Combine these two useEffect to trigger the moves only once... not great.
    useEffect(() => {
        setTempMove(true);
    }, [nextCard]);

    const getPlayerColor = useCallback((name) => {
        for(const p of players) {
            if(p.id === name) {
                return p.color;
            }
        }
        return 'neutral';
    }, [players]);

    const moveRobot = useCallback((robot, x, y, otherRobots) => {
        const finalX = robot.x + x;
        const finalY = robot.y + y;
        const moveDir = x > 0 ? 90 : x < 0 ? 270 : y > 0 ? 180 : 0;
        while(!(robot.x === finalX && robot.y === finalY) && !robot.rebooting) {
            const moveX = x === 0 ? 0 : x / Math.abs(x);
            const moveY = y === 0 ? 0 : y / Math.abs(y);
            const targetX = robot.x + moveX;
            const targetY = robot.y + moveY;
            let canMove = allWalls.filter(w => w.direction === moveDir && w.x === robot.x && w.y === robot.y).length === 0;
            if(canMove && !robot.rebooting && otherRobots.length > 0) {
                // push others
                for(const otherRobot of otherRobots) {
                    if(targetX === otherRobot.x && targetY === otherRobot.y && !otherRobot.rebooting) {
                        canMove = moveRobot(otherRobot, moveX, moveY, otherRobots.filter(r => r.id !== otherRobot.id));
                    }
                }
            }
            if(canMove) {
                robot.x += moveX;
                robot.y += moveY;
                validateRobot(robot);
            } else {
                return false;
            }
        }
        return true;
    }, [validateRobot, allWalls]);

    useEffect(() => {
        if(nextCard.id && tempMove) {
            setTempMove(false);
            console.log(nextCard);
            setLastCardPlayed({id: nextCard.id, type: nextCard.type, color: getPlayerColor(nextCard.player)});
            for(const robot of robots) {
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
                            moveRobot(robot, x, y, robots.filter(r => r.id !== robot.id));

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
                    break;
                }
            }
        }
    }, [nextCard, tempMove, robots, moveRobot, getPlayerColor]);

    return (
        <div className="main">
            {
                gameStarted ? (
                    <div className="game">
                        <div className="row">
                            <div className="side">
                                <div className={'card-played' + (lastCardPlayed.id === 0 ? ' ghost' : '')}>
                                    <span>Last card played</span>
                                    <div className={'last-played-card ' + lastCardPlayed.color}>
                                        <Card card={lastCardPlayed} selected={0} inRegister={() => false} isLocked={() => false} clicked={() => {}} visible={true}/>
                                    </div>
                                </div>
                                <div>
                                    {robots.map((r, i) => <RobotDetail key={i} robot={r}/>)}
                                </div>
                            </div>
                            <div className="board">
                                <img src={startingMap} alt="starting-map" draggable="false"/>
                                <img src={map} alt="map" draggable="false"/>
                                {robots.map((r, i) => <Robot key={i} robot={r} positionX={positionX} positionY={positionY}/>)}
                                {lasers.map((l, i) => <Laser key={i} laser={l} positionX={positionX} positionY={positionY}/>)}
                                {flags.map((f, i) => <Flag key={i} flag={f} positionX={positionX} positionY={positionY}/>)}
                                {walls.map((w, i) => <Wall key={i} wall={w} positionX={positionX} positionY={positionY}/>)}
                                {positionX.map((x, i) => positionY.map((y, j) => <span className="grid-loc hidden" key={i*positionX.length + j} style={{top: y + 38 + "px", left: x - 11 + "px"}}>{x + "," + y}</span>))}
                            </div>
                            <div className="side">

                            </div>
                        </div>
                        <div>
                            <Deck color={color} drawHand={drawHand} onDrawHandComplete={handleOnDrawHandComplete}
                                discardHand={discardHand} onDiscardHandComplete={handleOnDiscardHandComplete}
                                assignRandom={assignRandom} onAssignRandomComplete={handleAssignRandomComplete}
                                confirmRegister={confirmRegister} onConfirmRegisterComplete={handleConfirmRegisterComplete}
                                cardsVisible={cardsVisible} hp={robots.filter(r => r.player.self)[0].hp} />
                        </div>
                        <div className="buttons">
                            <button onClick={draw} className={canDraw ? '' : 'hidden'}>Draw {robots.filter(r => r.player.self)[0].hp - 1}</button>
                            <button onClick={assignRandomTrigger} className={canChooseCards ? '' : 'hidden'}>Assign random</button>
                            <button onClick={confirmRegisterTrigger} className={canChooseCards ? '' : 'hidden'}>Confirm register</button>
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

