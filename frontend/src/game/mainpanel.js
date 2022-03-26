import React, { useCallback, useContext, useEffect, useState } from 'react';
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
const socket = require('../connections/socket').socket;

const MainPanel = () => {

    const test = true; // Test game with this

    const players = useContext(PlayerContext);

    const maxPlayers = 6;
    const [gameStarted, setGameStarted] = useState(false);

    const [color] = useState('blue'); // use players[self=true] color when test=false
    const [drawHand, setDrawHand] = useState(0);
    const [discardHand, setDiscardHand] = useState(false);
    const [assignRandom, setAssignRandom] = useState(false);
    const [confirmRegister, setConfirmRegister] = useState(false);

    const [robots, setRobots] = useState([]);
    const robotSrcs = useCallback(() => [robo1, robo2, robo3, robo4, robo5, robo6], []); // ew

    const positionX = [];
    const positionY = [];
    for(let col = 0; col < 16; col++) {
        positionX.push(11 + 60 * col);
    }
    for(let row = 0; row < 12; row++) {
        positionY.push(10 + 60 * row);
    }

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
    // 2.1. reveal programming card
    // 2.2. move robot (based on priority)
    // 2.3. board elements activate
    // - 2x (blue) conveyor belts
    // - 1x (green) conveyor belts
    // - push panels
    // - gears
    // - board lasers
    // 2.4. robots fire
    // be on checkpoint!

    // map notes:
    // - pits
    // - walls
    // - priority antenna

    const gameStartHandle = useCallback(() => {
        // compute valid starting positions, shuffle them, assign to each robot
        const localRobots = [];
        for(let i = 0; i < players.length; i++) {
            const robot = {
                name: 'robo' + (i+1),
                src: robotSrcs()[i],
                x: 0,
                y: i,
                direction: (90 * i) % 360, // N: 0, E: 90, S: 180, W: 270
                hp: 10
            };
            players[i].robot = robot;
            localRobots.push(robot);
        }
        setRobots(localRobots);

        setGameStarted(true);
    }, [players, robotSrcs]);

    useEffect(() => {
        socket.on(Constants.SOCKET_STARTED, data => {
            gameStartHandle();
        });

        return () => {
            socket.off(Constants.SOCKET_STARTED);
        };
    }, [gameStartHandle]);



    const start = () => {
        socket.emit(Constants.SOCKET_START, { id: socket.id });
    };

    const draw = () => {
        setDrawHand(9); // control how many to draw
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

    const handleConfirmRegisterComplete = (reg) => {
        setConfirmRegister(false);
        discard();
        console.log(reg); // send to server
    }

    return (
        <div className="main">
            {
                test || gameStarted ? (
                    <div className="game">
                        <div className="board">
                            <img src={startingMap} alt="starting-map" draggable="false"/>
                            <img src={map} alt="map" draggable="false"/>
                            {robots.map((r, i) => <img key={i} src={r.src} alt={r.name} className={'robo direction' + r.direction} style={{top: positionY[r.y] + "px", left: positionX[r.x] + "px"}} draggable="false"/>)}
                            {positionX.map((x, i) => positionY.map((y, j) => <span className="grid-loc" key={i*positionX.length + j} style={{top: y + 38 + "px", left: x - 11 + "px"}}>{x + "," + y}</span>))}
                        </div>
                        <div className="inventory">
                            <Deck color={color} drawHand={drawHand} onDrawHandComplete={handleOnDrawHandComplete}
                                discardHand={discardHand} onDiscardHandComplete={handleOnDiscardHandComplete}
                                assignRandom={assignRandom} onAssignRandomComplete={handleAssignRandomComplete}
                                confirmRegister={confirmRegister} onConfirmRegisterComplete={handleConfirmRegisterComplete} />
                        </div>
                        <div>
                            <button onClick={start}>Start game!</button>&nbsp;|&nbsp;
                            <button onClick={draw}>Draw 9</button>
                            <button onClick={discard}>Discard hand</button>
                            <button onClick={assignRandomTrigger}>Assign random</button>
                            <button onClick={confirmRegisterTrigger}>Confirm register</button>
                        </div>
                    </div>
                ) : (
                    <div className="lobby">
                        <img src={logo} className="logo" alt="logo" />
                        {players.length === maxPlayers && players[0]['self'] ? (
                            <button onClick={start}>Start game!</button>
                        ) : (null) }
                    </div>
                )
            }
        </div>
    );
};

export default MainPanel;

