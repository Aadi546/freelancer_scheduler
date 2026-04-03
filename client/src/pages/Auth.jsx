import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../api';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;500;600;700&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  .auth-root {
    min-height: 100vh;
    background: radial-gradient(circle at 10% 20%, rgba(108,143,255,0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(167,139,250,0.15) 0%, transparent 40%), #0d0e11;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    padding: 20px;
  }
  
  .auth-card {
    width: 100%;
    max-width: 420px;
    background: rgba(19, 21, 26, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(42, 46, 56, 0.6);
    box-shadow: 0 24px 64px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05) inset;
    border-radius: 20px;
    padding: 40px;
  }
  
  .auth-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 36px;
  }
  
  .auth-logo-icon {
    width: 32px;
    height: 32px;
    background: #6c8fff;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .auth-logo-text {
    font-size: 17px;
    font-weight: 600;
    color: #e8eaf0;
  }
  
  .auth-title {
    font-size: 22px;
    font-weight: 600;
    color: #e8eaf0;
    margin-bottom: 6px;
  }
  
  .auth-subtitle {
    font-size: 13px;
    color: #555b6e;
    margin-bottom: 28px;
  }
  
  .auth-tabs {
    display: flex;
    background: #1a1d24;
    border-radius: 8px;
    padding: 3px;
    margin-bottom: 24px;
  }
  
  .auth-tab {
    flex: 1;
    padding: 8px;
    border: none;
    background: transparent;
    border-radius: 6px;
    font-size: 13px;
    font-family: 'Syne', sans-serif;
    font-weight: 500;
    cursor: pointer;
    color: #555b6e;
    transition: all 0.15s;
  }
  
  .auth-tab.active {
    background: #21252e;
    color: #e8eaf0;
  }
  
  .field-group {
    margin-bottom: 14px;
  }
  
  .field-label {
    display: block;
    font-size: 12px;
    color: #8b90a0;
    margin-bottom: 6px;
    font-weight: 500;
    letter-spacing: 0.3px;
  }
  
  .field-input {
    width: 100%;
    padding: 12px 14px;
    background: rgba(26, 29, 36, 0.6);
    border: 1px solid rgba(42, 46, 56, 0.8);
    border-radius: 10px;
    color: #e8eaf0;
    font-size: 14px;
    font-family: 'Syne', sans-serif;
    outline: none;
    transition: all 0.2s;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .field-input:focus { border-color: #6c8fff; background: rgba(26, 29, 36, 0.9); box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 0 0 3px rgba(108,143,255,0.15); }
  .field-input::placeholder { color: #555b6e; }
  
  .field-select {
    width: 100%;
    padding: 12px 14px;
    background: rgba(26, 29, 36, 0.6);
    border: 1px solid rgba(42, 46, 56, 0.8);
    border-radius: 10px;
    color: #e8eaf0;
    font-size: 14px;
    font-family: 'Syne', sans-serif;
    outline: none;
    cursor: pointer;
    appearance: none;
    transition: all 0.2s;
  }
  
  .field-select:focus { border-color: #6c8fff; box-shadow: 0 0 0 3px rgba(108,143,255,0.15); }
  
  .submit-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #6c8fff, #8ba4ff);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Syne', sans-serif;
    cursor: pointer;
    margin-top: 12px;
    transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(108,143,255,0.25);
  }
  
  .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(108,143,255,0.35); }
  .submit-btn:active { transform: scale(0.98); }
  
  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0;
  }
  
  .divider-line { flex: 1; height: 1px; background: #2a2e38; }
  .divider-text { font-size: 12px; color: #555b6e; }
  
  .google-btn {
    width: 100%;
    padding: 10px;
    background: #1a1d24;
    border: 1px solid #2a2e38;
    border-radius: 8px;
    color: #e8eaf0;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Syne', sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: border-color 0.15s, background 0.15s;
  }
  
  .google-btn:hover { background: #21252e; border-color: #353a47; }
  
  .error-msg {
    background: rgba(240,96,96,0.1);
    border: 1px solid rgba(240,96,96,0.25);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 12px;
    color: #f06060;
    margin-bottom: 14px;
  }
  
  .success-msg {
    background: rgba(62,207,142,0.1);
    border: 1px solid rgba(62,207,142,0.25);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 12px;
    color: #3ecf8e;
    margin-bottom: 14px;
  }
`;

const Auth = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'freelancer'
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const userJson = params.get('user');
        const errorParam = params.get('error');

        if (errorParam) {
            setError('Google authentication failed. Please try again.');
            return;
        }

        if (token && userJson) {
            try {
                localStorage.setItem('token', token);
                localStorage.setItem('user', userJson);
                const user = JSON.parse(userJson);
                navigate(user.role === 'freelancer' ? '/freelancer' : '/client');
            } catch {
                setError('Failed to process login. Please try again.');
            }
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            if (isLogin) {
                const { data } = await loginUser({ email: formData.email, password: formData.password });
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate(data.user.role === 'freelancer' ? '/freelancer' : '/client');
            } else {
                await registerUser(formData);
                setSuccess('Account created! Please log in.');
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `http://localhost:5000/api/auth/google?role=${formData.role}`;
    };

    return (
        <>
            <style>{styles}</style>
            <div className="auth-root">
                <div className="auth-card">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white"/>
                                <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                                <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                                <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white"/>
                            </svg>
                        </div>
                        <span className="auth-logo-text">FreelanceOS</span>
                    </div>

                    <div className="auth-title">{isLogin ? 'Welcome back' : 'Create account'}</div>
                    <div className="auth-subtitle">
                        {isLogin ? 'Sign in to your workspace' : 'Get started with FreelanceOS'}
                    </div>

                    <div className="auth-tabs">
                        <button className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}>
                            Sign in
                        </button>
                        <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}>
                            Sign up
                        </button>
                    </div>

                    {error && <div className="error-msg">{error}</div>}
                    {success && <div className="success-msg">{success}</div>}

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <>
                                <div className="field-group">
                                    <label className="field-label">Full Name</label>
                                    <input
                                        className="field-input"
                                        type="text"
                                        placeholder="Your name"
                                        required
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="field-group">
                                    <label className="field-label">I am a</label>
                                    <select
                                        className="field-select"
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="freelancer">Freelancer</option>
                                        <option value="client">Client</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="field-group">
                            <label className="field-label">Email</label>
                            <input
                                className="field-input"
                                type="email"
                                placeholder="you@example.com"
                                required
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="field-group">
                            <label className="field-label">Password</label>
                            <input
                                className="field-input"
                                type="password"
                                placeholder="••••••••"
                                required
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <button className="submit-btn" type="submit" disabled={loading}>
                            {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
                        </button>
                    </form>

                    <div className="divider">
                        <div className="divider-line" />
                        <span className="divider-text">or</span>
                        <div className="divider-line" />
                    </div>

                    <button className="google-btn" onClick={handleGoogleLogin}>
                        <img
                            src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
                            alt="Google"
                            style={{ width: '16px', height: '16px' }}
                        />
                        Continue with Google
                    </button>
                </div>
            </div>
        </>
    );
};

export default Auth;
