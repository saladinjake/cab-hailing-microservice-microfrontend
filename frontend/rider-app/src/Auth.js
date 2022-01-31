import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5201/api/users/auth';

const Auth = ({ role, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/login' : '/register';
      const payload = isLogin ? { email, password } : { name, email, password, role };
      const res = await axios.post(`${API_BASE}${endpoint}`, payload);
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f7f8fa', fontFamily: "'Segoe UI', sans-serif"
    }}>
      <div style={{
        background: 'white', padding: '2.5rem', borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px'
      }}>
        <h2 style={{ textAlign: 'center', color: '#1a1a2e', marginBottom: '1.5rem' }}>
          {role === 'driver' ? '🚗 Driver Portal' : '📱 Rider Portal'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isLogin && (
            <input
              type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)}
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
          )}
          <input
            type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
          />
          <input
            type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
          />
          {error && <div style={{ color: '#dc3545', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
          <button
            type="submit" disabled={loading}
            style={{
              padding: '12px', background: '#1a1a2e', color: 'white', border: 'none',
              borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold'
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '14px' }}>
          <span style={{ color: '#666' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#1a73e8', fontWeight: 'bold', cursor: 'pointer', marginLeft: '5px' }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
