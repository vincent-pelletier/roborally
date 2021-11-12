import React, { useEffect, useRef, useState } from 'react';
import useSound from 'use-sound'; // https://www.joshwcomeau.com/react/announcing-use-sound-react-hook/
import audioJoin from '../assets/audio/join.mp3';
import logo from '../logo.svg';
import './mainpanel.css';
const Constants = require('../util/constants');
const socket = require('../connections/socket').socket;

const MainPanel = ({updateName}) => {

    const maxPlayers = 6;

    const [name, setName] = useState('');
    const [status, setStatus] = useState('');
    const [players, setPlayers] = useState({});
    const [prevPlayerCount, setPrevPlayerCount] = useState(0);
    const [canStart, setCanStart] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const stateRef = useRef();
    stateRef.current = prevPlayerCount; // hack to get latest value in useEffect

    const [playAudioJoin] = useSound(audioJoin);

    useEffect(() => {
      socket.on(Constants.SOCKET_STATUS, data => {
        setStatus(data.message);
      });

      socket.on(Constants.SOCKET_PLAYERS, data => {
        var localPlayers = {};
        for(var p of JSON.parse(data.players)) {
          localPlayers[p[0]] = {
            id: p[0],
            name: p[1],
            self: p[0] === socket.id
          };
        }
        console.log('Players : ' + Object.values(localPlayers).map(p => p.name));
        setPlayers({...localPlayers});

        const playerValues = Object.values(localPlayers);
        setCanStart(playerValues.length === maxPlayers && playerValues[0]['self']);

        const prev = stateRef.current;
        if(playerValues.length > prev) {
            // sound
            console.log('++');
        } else if (playerValues.length < prev) {
            // sound
            console.log('--');
        }
        setPrevPlayerCount(playerValues.length);
      });

      socket.on(Constants.SOCKET_STARTED, data => {
        setGameStarted(true);
      });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const poke = () => {
      socket.emit(Constants.SOCKET_POKE, { id: socket.id });
    };

    const join = () => {
        playAudioJoin();
        updateName(name);
      socket.emit(Constants.SOCKET_JOIN, { name : name });
    };

    const start = () => {
        socket.emit(Constants.SOCKET_START, { id: socket.id });
    }

    const nameChange = (event) => {
      setName(event.target.value);
    };

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
                        <button onClick={poke}>Poke</button>
                        <br/>
                        Name: <input type="text" value={name} onChange={nameChange}></input>
                        <button onClick={join}>Join</button>
                        {canStart ? (
                            <button onClick={start}>Start game!</button>
                        ) : (null) }
                        <br/>
                        <span>Status: {status}</span>
                        <br/>
                        Players:
                        <ul>
                            {Object.values(players).map(p => (
                            <li key={p.id}>{p.name} {p.self ? '(me)' : ''}</li>
                            ))}
                        </ul>
                    </div>
                )
            }
        </div>
    );
};

export default MainPanel;

