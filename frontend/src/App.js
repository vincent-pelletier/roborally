import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import './App.css';
import ChatRoom from './game/chatroom';
import MainPanel from './game/mainpanel';
import useSoundLibrary from './game/useSoundLibrary';
const Constants = require('./util/constants');
const socket = require('./connections/socket').socket;

const App = () => {

    const [players, setPlayers] = useState([]);
    const [playersData, setPlayersData] = useState(null);
    const {playAudioJoin, playAudioLeave} = useSoundLibrary();

    useEffect(() => {
        socket.on(Constants.SOCKET_PLAYERS, data => setPlayersData(JSON.parse(data.players)));

        return () => {
            socket.off(Constants.SOCKET_PLAYERS);
        };
    }, []);

    useEffect(() => {
        if(playersData) {
            const colors = ['blue', 'red', 'green', 'cyan', 'purple', 'yellow'];

            const localPlayers = playersData.map((p, idx) => ({
                id: p[0],
                name: p[1],
                self: p[0] === socket.id,
                color: colors[idx]
            }));
            console.log('Players : ' + localPlayers.map(p => p.name));

            setPlayers(currentPlayers => {
                if(localPlayers.length > currentPlayers.length) {
                    // sound
                    playAudioJoin();
                    console.log('++');
                } else if (localPlayers.length < currentPlayers.length) {
                    // sound
                    playAudioLeave();
                    console.log('--');
                }
                return localPlayers;
            });
        }
    }, [playersData, playAudioJoin, playAudioLeave]);

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
