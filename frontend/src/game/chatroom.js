import './chatroom.css';

const ChatRoom = () => {

    return (
        <div className="chat">
            <div className="chat-header">
                Robo Rally
            </div>
            <div className="chatbox">
                <div className="chatbox-inner">
                    <span>chatbox</span>
                    <span>yo</span>
                </div>
            </div>
            <div className="chat-input">
                input
            </div>
        </div>
    );
};

export default ChatRoom;