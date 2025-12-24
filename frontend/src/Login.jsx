import { useState } from 'react';
import { login, register } from './api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await register(form);
        toast.success('Account created! Please login.');
        setIsRegister(false);
      } else {
        const { data } = await login(form);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success(`Welcome back, ${data.user.name}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Authentication Failed');
    }
  };

  return (
    <div>
      {/* 1. TOP NAVBAR */}
      <nav className="navbar">
        <div className="logo">Split<span>Smart</span></div>
      </nav>

      <div className="split-screen">
        
        {/* LEFT SIDE: Big Text */}
        <div className="hero-text">
          <h1 className="hero-title">Master Your <br/> Shared Expenses.</h1>
          <p className="hero-desc">
            Stop arguing about money. SplitSmart helps you track, split, and settle debts with friends and roommates instantly. The smartest way to manage group finances.
          </p>
          
          <div className="hero-stats">
            <div className="stat-item">
              <h3>100%</h3>
              <p>Free to use</p>
            </div>
            <div className="stat-item">
              <h3>0%</h3>
              <p>Math errors</p>
            </div>
            <div className="stat-item">
              <h3>24/7</h3>
              <p>Real-time sync</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: The BIG Login Box */}
        <div className="login-container">
          <div className="glass-card">
            <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: '800' }}>
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
              {isRegister ? 'Join the smart way to split bills.' : 'Enter your details to access your dashboard.'}
            </p>

            <form onSubmit={handleSubmit}>
              {isRegister && (
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input className="input-field" placeholder="ex. Alice Smith" 
                    onChange={(e) => setForm({...form, name: e.target.value})} />
                </div>
              )}
              
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input className="input-field" type="email" placeholder="ex. alice@example.com" 
                  onChange={(e) => setForm({...form, email: e.target.value})} />
              </div>
              
              <div className="input-group">
                <label className="input-label">Password</label>
                <input className="input-field" type="password" placeholder="••••••••" 
                  onChange={(e) => setForm({...form, password: e.target.value})} />
              </div>
              
              <button className="btn-primary">
                {isRegister ? 'Get Started' : 'Sign In'}
              </button>
            </form>

            <p className="toggle-text" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Already have an account? ' : "New here? "}
              <span>{isRegister ? 'Login' : 'Create an account'}</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;