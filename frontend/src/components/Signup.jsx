import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom'; // 1. Import useNavigate

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  // 2. New State for the Success Popup
  const [showSuccess, setShowSuccess] = useState(false); 

  const { login } = useAuth();
  const navigate = useNavigate(); // Hook for redirection

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
        // 3. Show Success Message
        setShowSuccess(true);
        
        // 4. Wait 1.5 seconds so user sees the popup, then login & redirect
        setTimeout(async () => {
            await login(data.username, password);
            navigate('/'); // Force redirect to Chat
        }, 1500);

      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100 relative">
      
      {/* --- SUCCESS POPUP --- */}
      {showSuccess && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-8 py-4 rounded-lg shadow-2xl z-50 animate-bounce flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <span className="font-bold text-lg">Success! {username} created.</span>
        </div>
      )}
      {/* --------------------- */}

      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
        <h2 className="text-3xl font-bold text-center text-blue-500">Create Account</h2>
        
        {error && (
          <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-500/50 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 mt-1 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white transition-all"
              required
              disabled={showSuccess} // Disable input during success animation
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white transition-all"
              required
              disabled={showSuccess}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white transition-all"
              required
              disabled={showSuccess}
            />
          </div>

          <button
            type="submit"
            disabled={showSuccess}
            className={`w-full py-3 font-semibold text-white rounded-lg transition-all shadow-lg ${
                showSuccess 
                ? 'bg-green-600 cursor-default' 
                : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/25'
            }`}
          >
            {showSuccess ? 'Redirecting...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;