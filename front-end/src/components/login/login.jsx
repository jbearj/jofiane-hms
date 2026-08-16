import React, { useState } from 'react';
import logo from '../../assets/Jofiane-logo.png';
import bgImage from '../../assets/login-bg.jpg';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLoginSuccess) {
      const detectedRole = formData.username.includes('@admin') ? 'admin' : 'employee';
      onLoginSuccess(detectedRole, formData);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Brand logo top-left */}
      <header style={styles.brandHeader}>
        <img src={logo} alt="Jofiane Hotel" style={styles.logo} />
      </header>

      {/* Glassmorphism card */}
      <main style={styles.card}>
        <div style={styles.content}>
          <div style={styles.titleBlock}>
            <h1 style={styles.title}>Welcome Back</h1>
            <p style={styles.subtitle}>Please enter your credentials to sign in</p>
          </div>

          {/* Direct Login Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username / Email</label>
              <input
                type="text"
                name="username"
                placeholder="Enter your username or email"
                value={formData.username}
                onChange={handleChange}
                required
                style={styles.input}
                className="glass-input"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                style={styles.input}
                className="glass-input"
              />
            </div>

            <div style={styles.optionsRow}>
              <label style={styles.remember}>
                <input type="checkbox" style={styles.checkbox} />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                style={styles.forgotBtn}
                onClick={() => alert('Contact System Administrator to reset password.')}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" style={styles.submitBtn} className="submit-btn-hover">
              Sign In
            </button>
          </form>
        </div>
      </main>

      {/* Styling para sa hover at inputs */}
      <style>{`
        .glass-input {
          transition: all 0.2s ease !important;
        }
        .glass-input:focus {
          border-color: #C9A84C !important;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.2) !important;
          background: rgba(255,255,255,0.12) !important;
        }
        .glass-input::placeholder {
          color: rgba(255,255,255,0.3);
        }
        .submit-btn-hover {
          transition: all 0.3s ease !important;
        }
        .submit-btn-hover:hover {
          background: #C9A84C !important;
          color: #1a100c !important;
          box-shadow: 0 8px 24px rgba(201,168,76,0.35) !important;
          border-color: #C9A84C !important;
        }
      `}</style>
    </div>
  );
};

const styles = {
  wrapper: {
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: `
      radial-gradient(circle at center, rgba(30, 18, 12, 0.5) 0%, rgba(12, 7, 4, 0.85) 100%),
      url(${bgImage}) center/cover no-repeat fixed
    `,
    overflow: 'hidden',
  },
  brandHeader: {
    position: 'absolute',
    top: '28px',
    left: '48px',
    zIndex: 10,
  },
  logo: {
    height: '55px',
    width: 'auto',
    objectFit: 'contain',
    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '42px 36px',
    borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.07)',
    backdropFilter: 'blur(16px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: `
      0 32px 64px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1)
    `,
    zIndex: 5,
  },
  content: {
    width: '100%',
  },
  titleBlock: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#FFFFFF',
    margin: '0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    margin: '8px 0 0 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'rgba(232, 213, 163, 0.85)',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
  },
  input: {
    padding: '12px 16px',
    fontSize: '14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)',
    color: '#FFFFFF',
    outline: 'none',
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remember: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: '#C9A84C',
    width: '14px',
    height: '14px',
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: '#C9A84C',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '0',
  },
  submitBtn: {
    padding: '14px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #2C1B14, #1a100c)',
    color: '#E8D5A3',
    border: '1px solid rgba(201,168,76,0.3)',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    marginTop: '6px',
    letterSpacing: '0.5px',
  },
};

export default Login;