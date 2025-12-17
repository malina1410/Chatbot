import { useState, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';
import MessageContent from './MessageContent';
import Sidebar from './Sidebar';

const Chat = () => {
  const { user, logout } = useAuth();
  
  // Chat State
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

  // --- 1. Fetch Session List on Load ---
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions/', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  // --- 2. Load Old Messages ---
  const handleSelectSession = async (id) => {
    setActiveSessionId(id);
    setSessionId(id); 
    
    try {
      const response = await fetch(`/api/sessions/${id}/messages/`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        // UPDATE: Set animate: false so history loads instantly
        const formattedMessages = data.map(msg => ({
          content: msg.content,
          isUser: msg.is_user,
          animate: false 
        }));
        setMessageHistory(formattedMessages);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  // --- 3. Delete Session ---
  const handleDeleteSession = async (id, e) => {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    try {
      const csrfToken = document.cookie.split('csrftoken=')[1]?.split(';')[0];
      const response = await fetch(`/api/sessions/${id}/`, {
        method: 'DELETE',
        headers: { 'X-CSRFToken': csrfToken },
        credentials: 'include'
      });

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== id));
        if (sessionId === id) handleNewChat();
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  // --- 4. Rename Session ---
  const handleRenameSession = async (id, newTitle) => {
    try {
      const csrfToken = document.cookie.split('csrftoken=')[1]?.split(';')[0];
      const response = await fetch(`/api/sessions/${id}/rename/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ title: newTitle }),
        credentials: 'include'
      });

      if (response.ok) {
        setSessions(sessions.map(s => s.id === id ? { ...s, title: newTitle } : s));
      }
    } catch (error) {
      console.error("Failed to rename session:", error);
    }
  };

  // --- WebSocket Message Handling ---
  useEffect(() => {
    if (lastJsonMessage !== null) {
      if (lastJsonMessage.type === 'error') {
        alert(lastJsonMessage.message);
        return;
      }
      
      // If the backend says "this is for session X", update our tracking ID
      // BUT only if we don't have one, or if it matches the current active one.
      if (lastJsonMessage.session_id) {
        // Only update the ID if we are creating a NEW session (sessionId is null)
        // OR if the response matches what we expect.
        setSessionId((prev) => prev === null ? lastJsonMessage.session_id : prev);

        if (!activeSessionId) {
            setTimeout(fetchSessions, 1000);
        }
      }

      if (lastJsonMessage.message) {
         setMessageHistory((prev) => prev.concat({ 
           content: lastJsonMessage.message, 
           isUser: false,
           animate: true 
         }));
      }
    }
    // CRITICAL FIX: Removed 'activeSessionId' from dependencies
  }, [lastJsonMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageHistory]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // UPDATE: User messages don't need animation
    setMessageHistory((prev) => prev.concat({ 
      content: inputMessage, 
      isUser: true,
      animate: false 
    }));
    
    sendJsonMessage({ message: inputMessage, session_id: sessionId });
    setInputMessage('');
  };

  const handleNewChat = () => {
    setMessageHistory([]);
    setSessionId(null);
    setActiveSessionId(null);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      
      {/* Sidebar with Logout Prop */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onNewChat={handleNewChat}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onLogout={logout} 
      />

      <div className="flex-1 flex flex-col h-screen relative bg-gray-900 w-full transition-all duration-300">
        
        {/* === HEADER REDESIGN === */}
        <header className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 z-10">
          
          {/* Left: Sidebar Toggle + Status */}
          <div className="flex items-center gap-4 w-1/4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div className={`w-2 h-2 rounded-full ${readyState === ReadyState.OPEN ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
          </div>

          {/* Center: Title */}
          <div className="flex-1 flex justify-center">
             <h1 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
               OdinX
             </h1>
          </div>
          
          {/* Right: User PFP */}
          <div className="flex items-center justify-end gap-3 w-1/4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.username || 'User'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg border border-gray-700">
              {user?.username ? user.username[0].toUpperCase() : 'U'}
            </div>
          </div>

        </header>

        {/* Chat Messages */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {messageHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-6 opacity-50">
              <div className="w-20 h-20 bg-gray-800/50 rounded-3xl flex items-center justify-center shadow-xl backdrop-blur-sm border border-gray-700">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="text-lg font-medium text-gray-400">System Ready. Awaiting Input.</p>
            </div>
          )}
          
          {messageHistory.map((msg, idx) => (
            <div key={idx} className={clsx("flex w-full", msg.isUser ? "justify-end" : "justify-start")}>
              <div className={clsx(
                "max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm",
                msg.isUser 
                  ? "bg-blue-600 text-white rounded-br-none" 
                  : "bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700"
              )}>
                {/* UPDATE: Pass the animate prop here */}
                <MessageContent content={msg.content} animate={msg.animate} />
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </main>

        {/* Input Footer */}
        <footer className="p-4 bg-gray-900 border-t border-gray-800">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Message OdinX..."
              className="w-full bg-gray-800 text-white rounded-xl pl-5 pr-14 py-4 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-gray-800 transition-all placeholder-gray-600 border border-gray-700 shadow-sm"
              disabled={readyState !== ReadyState.OPEN}
            />
            <button
              type="submit"
              disabled={readyState !== ReadyState.OPEN || !inputMessage.trim()}
              className="absolute right-3 p-2 bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-blue-500 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </form>
          <div className="text-center mt-3">
             <p className="text-[10px] text-gray-600 uppercase tracking-widest">Powered by Gemini 2.0</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Chat;