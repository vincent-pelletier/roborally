import React, { useEffect, useState } from 'react';
import './App.css';
import logo from './logo.svg';
const Constants = require('./util/constants');
const socket = require('./connections/socket').socket;

const App = () => {

  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [players, setPlayers] = useState({});

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
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const poke = () => {
    socket.emit(Constants.SOCKET_POKE, { id: socket.id });
  };

  const join = () => {
    socket.emit(Constants.SOCKET_JOIN, { name : name });
  };

  const nameChange = (event) => {
    setName(event.target.value);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button onClick={poke}>Poke</button>
        <br/>
        Name: <input type="text" value={name} onChange={nameChange}></input>
        <button onClick={join}>Join</button>
        <br/>
        <span>Status: {status}</span>
        <br/>
        Players:
        <ul>
          {Object.values(players).map(p => (
            <li key={p.id}>{p.name} {p.self ? '(me)' : ''}</li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
