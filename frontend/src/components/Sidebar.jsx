import { useState } from 'react';

const Sidebar = ({ isOpen, onNewChat, sessions = [], activeSessionId, onSelectSession }) => {
  return (
    <aside 
      className={`
        ${isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'} 
        bg-gray-900 border-r border-gray-800 flex flex-col h-screen flex-shrink-0 
        transition-all duration-300 ease-in-out overflow-hidden
      `}
    >
      {/* Inner Container: Fixed width prevents content from squishing during animation */}
      <div className="w-64 flex flex-col h-full">
        
        {/* Header / New Chat Button */}
        <div className="p-4">
          <button 
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg hover:shadow-blue-500/20 group"
          >
            <span className="text-xl font-light group-hover:rotate-90 transition-transform duration-300">+</span>
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        {/* Session List (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-800">
          <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Recent
          </div>
          
          {sessions.length === 0 ? (
            <div className="text-gray-500 text-sm px-4 py-2 italic">
              No history yet...
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors truncate ${
                  activeSessionId === session.id 
                    ? 'bg-gray-800 text-white shadow-sm border border-gray-700' 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }`}
              >
                {session.title || `Conversation ${session.id}`}
              </button>
            ))
          )}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
              US
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User Settings</p>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;