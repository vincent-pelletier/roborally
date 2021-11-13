import React, { useEffect, useState } from 'react';
import logo from '../logo.svg';
import './mainpanel.css';
const Constants = require('../util/constants');
const socket = require('../connections/socket').socket;

const MainPanel = ({players}) => {

    const maxPlayers = 6;
    const [gameStarted, setGameStarted] = useState(false);

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
                gameStarted ? (
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

