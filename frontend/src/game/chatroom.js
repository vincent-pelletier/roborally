import React, { useEffect, useState } from 'react';
import './chatroom.css';
const Constants = require('../util/constants');
const socket = require('../connections/socket').socket;

const ChatRoom = ({myName}) => {

    const [chats, setChats] = useState([]);

    useEffect(() => {
        socket.on(Constants.SOCKET_STATUS, data => {
            setChats(chats => [...chats, data.message]);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

    return (
        <div className="chat">
            <div className="chat-header">
                Robo Rally
            </div>
            <div className="chatbox">
                {chats.map(function(chat, index) {
                    return <span key={index}>{chat}</span>;
                })}
            </div>
            <div className="chat-input">
                {myName}
            </div>
        </div>
    );
};

export default ChatRoom;