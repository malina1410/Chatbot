import { useState, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';
import MessageContent from './MessageContent';
import Sidebar from './Sidebar';

const Chat = () => {
  const { user, logout } = useAuth();
  const [messageHistory, setMessageHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState([]); 
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const bottomRef = useRef(null);
  const WS_URL = `ws://${window.location.host}/ws/chat/`;
  
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(WS_URL, {
    onOpen: () => console.log('Connected to Brain'),
    shouldReconnect: () => true,
  });

  // --- 1. NEW: Fetch Session List on Load ---
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions/', {
        // This is CRITICAL: it sends the "sessionid" cookie to the backend
        credentials: 'include' 
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  // --- 2. NEW: Load Old Messages when Clicking Sidebar ---
  const handleSelectSession = async (id) => {
    setActiveSessionId(id);
    setSessionId(id); // Tell WebSocket to use this ID for future messages
    
    try {
      const response = await fetch(`/api/sessions/${id}/messages/`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        // Convert API format to our Frontend format
        const formattedMessages = data.map(msg => ({
          content: msg.content,
          isUser: msg.is_user
        }));
        setMessageHistory(formattedMessages);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  // Handle Incoming WebSocket Messages
  useEffect(() => {
    if (lastJsonMessage !== null) {
      if (lastJsonMessage.type === 'error') {
        alert(lastJsonMessage.message);
        return;
      }
      
      // If the backend sends a session_id (start of new chat), save it
      if (lastJsonMessage.session_id) {
        setSessionId(lastJsonMessage.session_id);
        
        // OPTIONAL: Refresh sidebar to show the new title immediately
        if (!activeSessionId) {
            fetchSessions();
        }
      }

      if (lastJsonMessage.message) {
         setMessageHistory((prev) => prev.concat({
           content: lastJsonMessage.message,
           isUser: false
         }));
      }
    }
  }, [lastJsonMessage]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageHistory]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setMessageHistory((prev) => prev.concat({
      content: inputMessage,
      isUser: true
    }));

    sendJsonMessage({
      message: inputMessage,
      session_id: sessionId
    });

    setInputMessage('');
  };

  const handleNewChat = () => {
    setMessageHistory([]);
    setSessionId(null);
    setActiveSessionId(null);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      
      <Sidebar 
        isOpen={isSidebarOpen}
        onNewChat={handleNewChat}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
      />

      <div className="flex-1 flex flex-col h-screen relative bg-gray-900 w-full transition-all duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-gray-800/50 backdrop-blur-md border-b border-gray-700 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px] ${readyState === ReadyState.OPEN ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'}`}></div>
            <h1 className="text-lg font-semibold tracking-wide text-gray-100 hidden sm:block">AI Assistant</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400 hidden sm:inline-block">User: <span className="text-gray-200">{user?.username}</span></span>
            <button onClick={logout} className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-500 hover:text-white transition-all duration-200">
              Logout
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {messageHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-2 animate-pulse">
                <span className="text-3xl">✨</span>
              </div>
              <div className="text-center">
                <p className="text-xl font-medium text-white">How can I help you today?</p>
                <p className="text-sm mt-2 text-gray-400">Ask me anything about code, writing, or analysis.</p>
              </div>
            </div>
          )}
          
          {messageHistory.map((msg, idx) => (
            <div key={idx} className={clsx("flex w-full", msg.isUser ? "justify-end" : "justify-start")}>
              <div className={clsx(
                "max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 shadow-md",
                msg.isUser 
                  ? "bg-blue-600 text-white rounded-br-none" 
                  : "bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700/50"
              )}>
                <MessageContent content={msg.content} />
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </main>

        <footer className="p-4 bg-gray-900 border-t border-gray-800">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Message AI..."
              className="w-full bg-gray-800 text-white rounded-xl pl-5 pr-24 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-750 transition-all placeholder-gray-500 border border-gray-700 shadow-sm"
              disabled={readyState !== ReadyState.OPEN}
            />
            <button
              type="submit"
              disabled={readyState !== ReadyState.OPEN || !inputMessage.trim()}
              className="absolute right-2 bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-lg shadow-blue-900/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px] text-gray-500">AI can make mistakes. Consider checking important information.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Chat;