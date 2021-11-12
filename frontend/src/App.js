import React, { useState } from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import './App.css';
import ChatRoom from './game/chatroom';
import MainPanel from './game/mainpanel';

const App = () => {

  const [finalName, setFinalName] = useState('');

  return (
    <div className="app">
      <Router>
        <Switch>
          <Route path="/" exact>
            <ChatRoom myName={finalName}/>
            <MainPanel updateName={setFinalName}/>
          </Route>
          <Redirect to="/"/>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
