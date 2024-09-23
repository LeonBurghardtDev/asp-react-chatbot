// App.jsx
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { marked } from 'marked';
import DOMPurify from 'dompurify'; 
import './App.css';

function App() {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatBoxRef = useRef(null); 
    
    const createMessage = (sender, text) => ({
        sender,
        text,
        id: uuidv4(),
    });
    
    const updateMessages = (message) => {
        setMessages(prevMessages => [...prevMessages, message]);
    };
    
    const updateMessage = (id, newText) => {
        setMessages(prevMessages =>
            prevMessages.map(msg =>
                msg.id === id ? { ...msg, text: newText } : msg
            )
        );
    };
    
    const handleSendMessage = async () => {
        if (!inputText.trim() || isLoading) return; 

        setIsLoading(true); 
        
        const userMessage = createMessage('You', inputText);
        updateMessages(userMessage);
        
        const placeholderMessage = createMessage('Bot', 'Bot is thinking...');
        updateMessages(placeholderMessage);

        const placeholderId = placeholderMessage.id;

        try {
            const query = inputText;
            clearInputField();
            const response = await fetchBotResponse(query);
            const botResponseText = await processBotResponse(response);
            updateMessage(placeholderId, botResponseText);
        } catch (error) {
            console.error("Error fetching bot response:", error);
            const errorMessage = 'Error fetching response.';
            updateMessage(placeholderId, errorMessage);
        } finally {
            setIsLoading(false); 
        }
    };
    
    const fetchBotResponse = async (query) => {
        const url = `/api/ai/ask?query=${encodeURIComponent(query)}`;
        return await fetch(url);
    };
    
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    };
    
    const processBotResponse = async (response) => {
        const contentType = response.headers.get('content-type');

        if (!response.ok) {
            if (contentType && contentType.includes('application/json')) {
                try {
                    const errorData = await response.json();
                    const statusCode = response.status;
                    const error = errorData.error || 'Unknown error';
                    const details = errorData.details || '';
                    return `Unexpected Error (Code ${statusCode}). Try again!\n${error}: ${details}`;
                } catch (parseError) {
                    const errorText = await response.text();
                    return `Unexpected Error (Code ${response.status}). Try again!\n${errorText}`;
                }
            } else {
                const errorText = await response.text();
                return `Unexpected Error (Code ${response.status}). Try again!\n${errorText}`;
            }
        }
        
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data.response;
        } else {
            const errorText = await response.text();
            return `Unexpected response format: ${errorText}`;
        }
    };

    
    const clearInputField = () => {
        setInputText('');
    };
    
    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="chat-container">
            <div className="chat-box" ref={chatBoxRef}>
                {messages.map((message) => (
                    <div key={message.id} className={`chat-message ${message.sender === 'You' ? 'user-message' : 'bot-message'}`}>
                        <strong>{message.sender}: </strong>
                        {message.sender === 'Bot' && message.text !== 'Bot is thinking...' ? (
                            <span
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(marked(message.text))
                                }}
                            />
                        ) : (
                            message.text === 'Bot is thinking...' ? (
                                <span className="loading">Bot is thinking...</span>
                            ) : (
                                message.text
                            )
                        )}
                    </div>
                ))}
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    value={inputText}
                    onKeyDown={handleKeyDown}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    autoFocus
                />
                <button onClick={handleSendMessage} disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    );
}

export default App;
