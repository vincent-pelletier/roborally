import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import laserX from '../assets/LaserX.png';
import laserY from '../assets/LaserY.png';
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
import Card from './card';
import Deck from './deck';
import './mainpanel.css';
import RobotDetail from './robotdetail';
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

    const [lastCardPlayed, setLastCardPlayed] = useState({id: 0, type: '', color: 'neutral'});

    const [robots, setRobots] = useState([]);
    const robotSrcs = useMemo(() => [robo1, robo2, robo3, robo4, robo5, robo6], []);

    const [robotsFire, setRobotsFire] = useState(false);
    const [laser, setLaser] = useState({active: false, x: 0, y: 0, length: 0, direction: 0, targetPx: 0});

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
                flags: 0,
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

    const fire = useEffect(() => {
        if(robotsFire) {
            setRobotsFire(false);
            const robot = robots.filter(r => r.player.self)[0];
            let length = 0;
            switch(robot.direction) {
                case 0:
                    length = robot.y;
                    break;
                case 90:
                    length = positionX.length - robot.x;
                    break;
                case 180:
                    length = positionY.length - robot.y;
                    break;
                case 270:
                    length = robot.x;
                    break;
                default:
                    alert('Unexpected direction ' + robot.direction);
                    break;
            }
            // adjust length and set targetPx (to 20) if it hits.. walls will have a higher z-index than lasers
            for(let i = 0; i <= length; i++) {
                setTimeout(() => setLaser({active: true, x: robot.x, y: robot.y, length: i, direction: robot.direction, targetPx: 0}), i * 35);
            }
            setTimeout(() => setLaser({active: false, x: 0, y: 0, length: 0, direction: 0, targetPx: 0}), 1000);
        }
    }, [positionX, positionY, robots, robotsFire]);

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

        socket.on(Constants.SOCKET_TURN_END, () => {
            // TODO why is this invoked multiple times?
            setLastCardPlayed({id: 0, type: '', color: 'neutral'});
            // discard previous register?
        });

        socket.on(Constants.SOCKET_ROBOTS_FIRE, () => {
            // TODO why is this invoked multiple times?
            setRobotsFire(true);
        });

        return () => {
            socket.off(Constants.SOCKET_STARTED);
        };
    }, [gameStartHandle, nextTurn, fire]);

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
        setDiscardHand(true);
        setCardsVisible(0);
        //setTempReg([...reg]); // should we keep a copy, or hide the cards and re-open per register? :P probably keep+hide + reveal on turn start.
        socket.emit(Constants.SOCKET_SEND_REGISTER, {'register': reg});
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
        while(!(robot.x === finalX && robot.y === finalY) && !robot.rebooting) {
            const moveX = x === 0 ? 0 : x / Math.abs(x);
            const moveY = y === 0 ? 0 : y / Math.abs(y);
            robot.x += moveX;
            robot.y += moveY;
            validatePosition(robot);
            if(!robot.rebooting && otherRobots.length > 0) {
                // push others
                for(const otherRobot of otherRobots) {
                    if(robot.x === otherRobot.x && robot.y === otherRobot.y && !otherRobot.rebooting) {
                        moveRobot(otherRobot, moveX, moveY, otherRobots.filter(r => r.name !== otherRobot.name));
                    }
                }
            }
        }
    }, [validatePosition]);

    useEffect(() => {
        if(nextCard.id && tempMove) {
            setTempMove(false);
            console.log(nextCard);
            setLastCardPlayed({id: nextCard.id, type: nextCard.type, color: getPlayerColor(nextCard.player)});
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
                            moveRobot(robot, x, y, localRobots.filter(r => r.name !== robot.name));

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
                                {robots.map((r, i) => <img key={i} src={r.src} alt={r.name} className={'robo direction' + r.direction + (r.rebooting ? ' rebooting' : '')} style={{top: positionY[r.y] + "px", left: positionX[r.x] + "px"}} draggable="false"/>)}
                                <img src={laser.direction % 180 === 0 ? laserY : laserX} alt="laser" draggable="false"
                                    className={'laser direction' + (laser.direction % 270 === 0 ? 180 : 0) + (laser.active ? ' active' : '')}
                                    style={{
                                        top: (laser.direction === 0 ? positionY[laser.y] - 910 : positionY[laser.y]) + "px",
                                        left: (laser.direction === 270 ? positionX[laser.x] - 910 : positionX[laser.x]) + "px",
                                        clipPath: "inset(0px " + (laser.direction % 180 === 0 ?
                                            ("0px " + (positionX[positionX.length - laser.length - (laser.direction === 0 ? 1 : 0)] - (laser.direction === 0 ? positionY[0] : positionX[0]) + laser.targetPx) + "px") :
                                            ((positionX[positionX.length - laser.length - (laser.direction === 270 ? 1 : 0)] - positionX[0] + laser.targetPx) + "px 0px")
                                        ) + " 0px)"
                                    }}/>
                                {positionX.map((x, i) => positionY.map((y, j) => <span className="grid-loc" key={i*positionX.length + j} style={{top: y + 38 + "px", left: x - 11 + "px"}}>{x + "," + y}</span>))}
                            </div>
                            <div className="side">

                            </div>
                        </div>
                        <div>
                            <Deck color={color} drawHand={drawHand} onDrawHandComplete={handleOnDrawHandComplete}
                                discardHand={discardHand} onDiscardHandComplete={handleOnDiscardHandComplete}
                                assignRandom={assignRandom} onAssignRandomComplete={handleAssignRandomComplete}
                                confirmRegister={confirmRegister} onConfirmRegisterComplete={handleConfirmRegisterComplete}
                                cardsVisible={cardsVisible} />
                        </div>
                        <div>
                            <button onClick={draw}>Draw 9</button>
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

