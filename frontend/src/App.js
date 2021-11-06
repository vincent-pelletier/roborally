import React, { useEffect } from 'react';
import './App.css';
import logo from './logo.svg';
const Constants = require('./util/constants');
const socket = require('./connections/socket').socket;

const App = () => {

  useEffect(() => {
    socket.on(Constants.SOCKET_POKEBACK, data => {
      console.log(data);
    });
  }, []);

  const poke = () => {
    socket.emit(Constants.SOCKET_POKE, { client: 'client-id' });
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button onClick={poke}>Poke</button>
      </header>
    </div>
  );
}

export default App;
