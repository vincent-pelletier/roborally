import React, { useContext, useEffect, useState } from 'react';
import PlayerContext from '../context/PlayerContext';
import './chatroom.css';
const Constants = require('../util/constants');
const socket = require('../connections/socket').socket;

const ChatRoom = () => {

    const players = useContext(PlayerContext);
    const [name, setName] = useState('');
    const [chats, setChats] = useState([]);
    const [text, setText] = useState('');

    useEffect(() => {
        socket.on(Constants.SOCKET_STATUS, data => {
            setChats(chats => [...chats, {from: data.from, text: data.message, time: new Date().toISOString().substr(14, 5)}]);
            if(data.message === 'Error game is full (6/6)') {
                setName('');
            }
        });

        return () => {
            socket.off(Constants.SOCKET_STATUS);
        };
    }, []);

    const getColor = (id) => {
        if(id === 'server') {
            return 'server';
        }
        for(let p of players) {
            if(p.id === id) {
                return p.color;
            }
        }
        return 'neutral';
    };

    const getName = (id) => {
        if(id === 'server') {
            return '';
        }
        for(let p of players) {
            if(p.id === id) {
                return p.name + ': ';
            }
        }
        return '???: ';
    }

    const updateText = (e) => {
        setText(e.target.value);
    };

    const keyDown = (e) => {
        if(e.key === 'Enter') {
            if(name) {
                send();
            } else {
                join();
            }
        }
    }

    const send = () => {
        if(text && text.trim()) {
            socket.emit(Constants.SOCKET_CHAT, { message : text.trim() });
        }
        setText('');
    };

    const join = () => {
        if(text && text.trim()) {
            const myName = text.trim();
            setName(myName);
            socket.emit(Constants.SOCKET_JOIN, { name : myName });
            setText('');
        }
    };

    const poke = () => {
        socket.emit(Constants.SOCKET_POKE);
    };

    return (
        <div className="chat">
            <div className="chat-header">
                Robo Rally by Vincent
            </div>
            <div className="players">
                {players.map((p, index) => <span key={index} className={p.color}>{p.name}{p.self ? '*' : ''}</span>)}
            </div>
            <div className="chatbox">
                {chats.map((chat, index) => <span key={index} className={getColor(chat.from)}>[{chat.time}] {getName(chat.from)}{chat.text}</span>)}
            </div>
            {name ? (
                <div className="chat-input">
                    {name}
                    <input type="text" className="textbox" value={text} onChange={updateText} onKeyDown={keyDown}></input>
                    <button onClick={send}>&gt;</button> <button onClick={poke}>Poke</button>
                </div>
            ) : (
                <div className="chat-input">
                    Name:
                    <input type="text" className="textbox" value={text} onChange={updateText} maxLength="12" onKeyDown={keyDown}></input>
                    <button onClick={join}>Join</button>
                </div>
            )}

        </div>
    );
};

export default ChatRoom;