import React from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import './App.css';
import ChatRoom from './game/chatroom';
import MainPanel from './game/mainpanel';

const App = () => {
  return (
    <div className="app">
      <Router>
        <Switch>
          <Route path="/" exact>
            <ChatRoom/>
            <MainPanel/>
          </Route>
          <Redirect to="/"/>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
