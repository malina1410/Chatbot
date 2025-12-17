import { useState, useEffect, useRef } from 'react';

const Sidebar = ({ isOpen, onNewChat, sessions = [], activeSessionId, onSelectSession, onDeleteSession, onRenameSession, onLogout }) => {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  
  // New State for Settings Menu
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  // Close menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const startEditing = (e, session) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const cancelEditing = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle("");
  };

  const saveTitle = (e, id) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle);
    }
    setEditingId(null);
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') saveTitle(e, id);
    if (e.key === 'Escape') cancelEditing(e);
  };

  return (
    <aside 
      className={`
        ${isOpen ? 'w-64 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full'} 
        bg-gray-900 border-r border-gray-800 flex flex-col h-screen flex-shrink-0 
        transition-all duration-300 ease-in-out overflow-hidden z-20 relative
      `}
    >
      <div className="w-64 flex flex-col h-full">
        {/* New Chat Button */}
        <div className="p-4">
          <button 
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-lg hover:shadow-blue-500/20 group"
          >
            <span className="text-xl font-light group-hover:rotate-90 transition-transform duration-300">+</span>
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-800">
          <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            History
          </div>
          
          {sessions.length === 0 ? (
            <div className="text-gray-500 text-sm px-4 py-2 italic text-center mt-10">
              No chats yet.
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-center w-full px-3 py-3 rounded-lg text-sm cursor-pointer transition-colors ${
                  activeSessionId === session.id 
                    ? 'bg-gray-800 text-white border border-gray-700' 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }`}
              >
                <svg className="w-4 h-4 mr-3 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>

                <div className="flex-1 min-w-0 pr-6">
                  {editingId === session.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="text" 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, session.id)}
                        autoFocus
                        className="w-full bg-black/50 text-white px-1 py-0.5 rounded border border-blue-500 focus:outline-none text-xs"
                      />
                      <button onClick={(e) => saveTitle(e, session.id)} className="text-green-400 hover:text-green-300"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                      <button onClick={cancelEditing} className="text-red-400 hover:text-red-300"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  ) : (
                    <p className="truncate">{session.title || "New Chat"}</p>
                  )}
                </div>

                {editingId !== session.id && (
                  <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800/90 rounded px-1">
                    <button onClick={(e) => startEditing(e, session)} className="p-1 text-gray-400 hover:text-blue-400 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={(e) => onDeleteSession(session.id, e)} className="p-1 text-gray-400 hover:text-red-400 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer with Settings & Popup Menu */}
        <div className="p-4 border-t border-gray-800 bg-gray-900 relative" ref={settingsRef}>
          
          {/* Popup Menu */}
          {isSettingsOpen && (
             <div className="absolute bottom-16 left-4 right-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden animate-fade-in-up">
               <button 
                 onClick={onLogout}
                 className="w-full text-left px-4 py-3 text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors flex items-center gap-2 text-sm"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                 Log out
               </button>
             </div>
          )}

          <div className="flex items-center justify-between text-gray-400 hover:text-white transition-colors select-none group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <p className="text-sm font-medium">Settings</p>
            </div>
            
            {/* The Ellipsis Button */}
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-1.5 rounded-md hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;