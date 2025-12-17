import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false); 

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch('/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.cookie.split('csrftoken=')[1]?.split(';')[0]
        },
        body: JSON.stringify({ username, password, confirm_password: confirmPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(async () => {
            await login(data.username, password);
            navigate('/'); 
        }, 1500);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    // 1. BACKGROUND: Same Deep Radial Gradient as Login
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-950 to-black px-4 relative overflow-hidden text-gray-100">
      
      {/* 2. DECORATION: Subtle ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* --- SUCCESS POPUP --- */}
      {showSuccess && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-emerald-500/90 backdrop-blur-md text-white px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] z-50 animate-bounce flex items-center gap-3 border border-emerald-400/50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <span className="font-bold text-lg">Identity Created: {username}</span>
        </div>
      )}

      {/* 3. CARD: Glassmorphism Effect */}
      <div className="max-w-md w-full p-10 bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800 relative z-10 space-y-8">
        
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            OdinX
          </h1>
          <p className="text-gray-400 text-sm">
            Create a secure neural identity
          </p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full px-4 py-3 bg-gray-950/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder="Ex: WebMaster1410"
              required
              disabled={showSuccess}
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-3 bg-gray-950/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder="••••••••"
              required
              disabled={showSuccess}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-4 py-3 bg-gray-950/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder="••••••••"
              required
              disabled={showSuccess}
            />
          </div>

          <button
            type="submit"
            disabled={showSuccess}
            className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white shadow-lg transition-all 
              ${showSuccess 
                ? 'bg-emerald-600 cursor-default' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/25'
              }`}
          >
            {showSuccess ? 'Redirecting...' : 'Establish Link'}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            Already have an identity?{' '}
            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors">
              Login Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;