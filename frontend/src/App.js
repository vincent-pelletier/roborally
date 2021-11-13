import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import './App.css';
import ChatRoom from './game/chatroom';
import MainPanel from './game/mainpanel';
const Constants = require('./util/constants');
const socket = require('./connections/socket').socket;

const App = () => {

    const colors = ['blue', 'red', 'cyan', 'green', 'purple', 'yellow'];

    const [players, setPlayers] = useState([]);
    const [prevPlayerCount, setPrevPlayerCount] = useState(0);
    const stateRef = useRef();
    stateRef.current = prevPlayerCount; // hack to get latest value in useEffect

    useEffect(() => {
        socket.on(Constants.SOCKET_PLAYERS, data => {
            var localPlayers = [];
            var i = 0;
            for(var p of JSON.parse(data.players)) {
                localPlayers.push({
                    id: p[0],
                    name: p[1],
                    self: p[0] === socket.id,
                    color: colors[i]
                });
                i++;
            }
            console.log('Players : ' + localPlayers.map(p => p.name));
            setPlayers(localPlayers);

            const prev = stateRef.current;
            if(localPlayers.length > prev) {
                // sound
                // console.log('++');
            } else if (localPlayers.length < prev) {
                // sound
                // console.log('--');
            }
            setPrevPlayerCount(localPlayers.length);
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="app">
            <Router>
            <Switch>
                <Route path="/" exact>
                <ChatRoom players={players}/>
                <MainPanel players={players}/>
                </Route>
                <Redirect to="/"/>
            </Switch>
            </Router>
        </div>
    );
}

export default App;
