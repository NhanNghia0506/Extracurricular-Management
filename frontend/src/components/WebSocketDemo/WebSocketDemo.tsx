import React, { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import './WebSocketDemo.css';

const WebSocketDemo: React.FC = () => {
    const { isConnected, lastMessage, sendMessage } = useSocket();
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState<any[]>([]);

    React.useEffect(() => {
        if (lastMessage) {
            setMessages(prev => [...prev, { ...lastMessage, type: 'received' }]);
        }
    }, [lastMessage]);

    const handleSend = () => {
        if (inputText.trim()) {
            sendMessage(inputText);
            setMessages(prev => [...prev, { text: inputText, timestamp: Date.now(), type: 'sent' }]);
            setInputText('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="websocket-demo">
            <div className="demo-header">
                <h3>WebSocket Demo</h3>
                <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    <span className="status-dot"></span>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </div>
            </div>

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="no-messages">No messages yet. Start by sending a message!</div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.type}`}>
                            <div className="message-text">{msg.text}</div>
                            <div className="message-time">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="input-container">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!isConnected}
                />
                <button
                    className="btn btn-primary"
                    onClick={handleSend}
                    disabled={!isConnected || !inputText.trim()}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default WebSocketDemo;
