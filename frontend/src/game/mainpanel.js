import React, { useEffect, useState } from 'react';
import logo from '../logo.svg';
import './mainpanel.css';
const Constants = require('../util/constants');
const socket = require('../connections/socket').socket;

const MainPanel = ({players}) => {

    const test = false;

    const maxPlayers = 6;
    const [gameStarted, setGameStarted] = useState(false);

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

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const start = () => {
        socket.emit(Constants.SOCKET_START, { id: socket.id });
    }

    return (
        <div className="main">
            {
                test || gameStarted ? (
                    <div className="game">
                        Game window
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

