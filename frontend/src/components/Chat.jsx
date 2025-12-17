import { useState, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';
import MessageContent from './MessageContent';

const Chat = () => {
  const { user, logout } = useAuth();
  const [messageHistory, setMessageHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const bottomRef = useRef(null);

  // 1. WebSocket Configuration
  // We use window.location.host to automatically use the Vite Proxy
  const WS_URL = `ws://${window.location.host}/ws/chat/`;
  
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(WS_URL, {
    onOpen: () => console.log('Connected to Brain'),
    shouldReconnect: () => true, // Auto-reconnect if server dies
  });

  // 2. Handle Incoming Messages
  useEffect(() => {
    if (lastJsonMessage !== null) {
      // If backend sends an error (like rate limit)
      if (lastJsonMessage.type === 'error') {
        alert(lastJsonMessage.message);
        return;
      }

      // Capture Session ID to maintain context
      if (lastJsonMessage.session_id && !sessionId) {
        setSessionId(lastJsonMessage.session_id);
      }

      // Append new message to UI
      // We only append if it's a real chat message
      if (lastJsonMessage.message) {
         setMessageHistory((prev) => prev.concat({
           content: lastJsonMessage.message,
           isUser: false // Incoming messages are always from AI
         }));
      }
    }
  }, [lastJsonMessage, sessionId]);

  // 3. Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageHistory]);

  // 4. Send Message Handler
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message to UI immediately (Optimistic UI)
    setMessageHistory((prev) => prev.concat({
      content: inputMessage,
      isUser: true
    }));

    // Send to Backend
    sendJsonMessage({
      message: inputMessage,
      session_id: sessionId // Send ID so AI knows the context
    });

    setInputMessage('');
  };

  // Connection Status Helper
  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting...',
    [ReadyState.OPEN]: 'Online',
    [ReadyState.CLOSING]: 'Closing...',
    [ReadyState.CLOSED]: 'Offline',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* --- Header --- */}
      <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700 shadow-md">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${readyState === ReadyState.OPEN ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <h1 className="text-xl font-bold">AI Assistant <span className="text-sm font-normal text-gray-400">({connectionStatus})</span></h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">User: {user?.username}</span>
          <button onClick={logout} className="px-3 py-1 text-sm bg-red-600/20 text-red-400 border border-red-600/50 rounded hover:bg-red-600 hover:text-white transition">
            Logout
          </button>
        </div>
      </header>

      {/* --- Chat Area --- */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {messageHistory.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg">No messages yet.</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        )}
        
        {messageHistory.map((msg, idx) => (
          <div 
            key={idx} 
            className={clsx(
              "flex w-full",
              msg.isUser ? "justify-end" : "justify-start"
            )}
          >
            <div className={clsx(
              "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm overflow-hidden", // Added overflow-hidden
              msg.isUser 
                ? "bg-blue-600 text-white rounded-br-none" 
                : "bg-gray-700 text-gray-100 rounded-bl-none"
            )}>
              {/* If it's the user, use plain text (cheaper). If it's AI, use Markdown. */}
              {msg.isUser ? (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              ) : (
                <MessageContent content={msg.content} />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </main>

      {/* --- Input Area --- */}
      <footer className="p-4 bg-gray-800 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex space-x-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            disabled={readyState !== ReadyState.OPEN}
          />
          <button
            type="submit"
            disabled={readyState !== ReadyState.OPEN || !inputMessage.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
};

export default Chat;