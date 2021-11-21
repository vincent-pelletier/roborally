import React, { useCallback, useEffect, useState } from 'react';
import logo from '../logo.svg';
import Deck from './deck';
import './mainpanel.css';
const Constants = require('../util/constants');
const socket = require('../connections/socket').socket;

const MainPanel = ({players}) => {

    const test = true;

    const maxPlayers = 6;
    const [gameStarted, setGameStarted] = useState(false);

    const [color] = useState('blue'); // use players[self=true] color when test=false
    const [drawHand, setDrawHand] = useState(0);
    const [discardHand, setDiscardHand] = useState(false);

    //const [gameTurn, setGameTurn] = useState(1); //this should be in backend
    //const phases = ['Programming', 'Activation'];
    //const registers = [1, 2, 3, 4, 5];
    // https://www.fgbradleys.com/rules/rules4/Robo%20Rally%20-%20rules.pdf
    // game turn
    // phase
    // 1 - programming phase
    // 1.1. draw 9(-) cards
    // 1.2. pick 5, discard others
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

    useEffect(() => {
        socket.on(Constants.SOCKET_STARTED, data => {
            setGameStarted(true);
        });

        return () => {
            socket.off(Constants.SOCKET_STARTED);
        };
    }, []);

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

    return (
        <div className="main">
            {
                test || gameStarted ? (
                    <div className="game">
                        Game window
                        <Deck drawHand={drawHand} onDrawHandComplete={handleOnDrawHandComplete}
                            discardHand={discardHand} onDiscardHandComplete={handleOnDiscardHandComplete} color={color} />
                        <div>
                            <button onClick={draw}>Draw 9</button>
                            <button onClick={discard}>Discard hand</button>
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

