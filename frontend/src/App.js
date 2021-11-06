import React, { useEffect, useState } from 'react';
import './App.css';
import logo from './logo.svg';
const Constants = require('./util/constants');
const socket = require('./connections/socket').socket;

const App = () => {

  const [name, setName] = useState('');

  useEffect(() => {
    socket.on(Constants.SOCKET_POKEBACK, data => {
      console.log(data);
    });
  }, []);

  const poke = () => {
    socket.emit(Constants.SOCKET_POKE, { client: 'client-id' });
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
      </header>
    </div>
  );
}

export default App;
