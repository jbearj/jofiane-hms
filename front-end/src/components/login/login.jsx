import React, { useState } from 'react';
import logo from '../../assets/Jofiane-logo.png';
import bgImage from '../../assets/login-bg.jpg';

const Login = ({ onLoginSuccess }) => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLoginSuccess) {
      onLoginSuccess(selectedRole, formData);
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
        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div style={styles.content} key="step1">
            <div style={styles.titleBlock}>
              <h1 style={styles.brandTitle}>JOFIANE HMS</h1>
              <h2 style={styles.title}>Welcome Back</h2>
              <p style={styles.subtitle}>Select your portal to sign in</p>
            </div>

            <div style={styles.roleGrid}>
              {/* Employee Button */}
              <button
                type="button"
                style={styles.roleBtn}
                className="role-card-hover"
                onClick={() => handleSelectRole('employee')}
              >
                <div style={styles.roleIconWrap}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={styles.roleIcon}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span style={styles.roleLabel}>EMPLOYEE</span>
                <span style={styles.roleDesc}>Staff portal access</span>
              </button>

              {/* Admin Button */}
              <button
                type="button"
                style={styles.roleBtn}
                className="role-card-hover"
                onClick={() => handleSelectRole('admin')}
              >
                <div style={styles.roleIconWrap}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={styles.roleIcon}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <rect x="9" y="10" width="6" height="5" rx="1" />
                  </svg>
                </div>
                <span style={styles.roleLabel}>ADMIN</span>
                <span style={styles.roleDesc}>Management console</span>
              </button>
            </div>

            <p style={styles.footerText}>Jofiane Hotel Management System</p>
          </div>
        )}

        {/* Step 2: Login Form */}
        {step === 2 && (
          <div style={styles.content} key="step2">
            <div style={styles.formHeader}>
              <button
                type="button"
                style={styles.backBtn}
                className="back-btn-hover"
                onClick={() => setStep(1)}
                title="Back to role selection"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
            </div>

            <div style={styles.titleBlock}>
              <h1 style={styles.brandTitle}>JOFIANE HMS</h1>
              <h2 style={styles.title}>Sign In</h2>
              <p style={styles.subtitle}>
                Logging in as{' '}
                <span style={styles.roleBadge}>
                  {selectedRole === 'admin' ? 'Administrator' : 'Employee'}
                </span>
              </p>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="text"
                  name="username"
                  placeholder={selectedRole === 'admin' ? 'admin@jofiane.com' : 'employee@jofiane.com'}
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
                Login
              </button>

              <div style={styles.signUpRow}>
                Don't have an account?{' '}
                <button type="button" style={styles.signUpLink} onClick={() => alert(`Sign up as ${selectedRole === 'admin' ? 'Admin' : 'Employee'}`)}>
                  Sign up here
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Inline styles for hover states and animations */}
      <style>{`
        .role-card-hover {
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1) !important;
        }
        .role-card-hover:hover {
          transform: translateY(-5px) scale(1.02) !important;
          border-color: #C9A84C !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 25px rgba(201,168,76,0.15) !important;
          background: rgba(255,255,255,0.1) !important;
        }
        .role-card-hover:hover .role-icon-glow {
          background: rgba(201,168,76,0.25) !important;
          border-color: #C9A84C !important;
        }
        .back-btn-hover {
          transition: all 0.2s ease !important;
        }
        .back-btn-hover:hover {
          background: rgba(201,168,76,0.2) !important;
          border-color: rgba(201,168,76,0.5) !important;
        }
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
  signUpRow: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
  },
  signUpLink: {
    background: 'none',
    border: 'none',
    color: '#C9A84C',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '0',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
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
  // Glassmorphism card
  card: {
    width: '100%',
    maxWidth: '500px',
    minHeight: '480px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '50px 44px',
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
    marginBottom: '32px',
  },
  brandTitle: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '3px',
    color: '#C9A84C',
    margin: '0 0 12px 0',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '30px',
    fontWeight: '700',
    color: '#FFFFFF',
    margin: '0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    margin: '10px 0 0 0',
  },
  roleBadge: {
    display: 'inline-block',
    background: 'rgba(201,168,76,0.18)',
    color: '#E8D5A3',
    padding: '3px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid rgba(201,168,76,0.3)',
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '28px',
  },
  roleBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30px 16px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(201,168,76,0.25)',
    cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  roleIconWrap: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'rgba(201,168,76,0.1)',
    border: '1.5px solid rgba(201,168,76,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
  },
  roleIcon: {
    width: '26px',
    height: '26px',
    color: '#C9A84C',
  },
  roleLabel: {
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    color: '#FFFFFF',
    marginBottom: '4px',
  },
  roleDesc: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '400',
  },
  footerText: {
    textAlign: 'center',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: '0.5px',
    marginTop: '4px',
  },
  formHeader: {
    marginBottom: '8px',
  },
  backBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#FFFFFF',
    padding: '0',
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
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: '0.3px',
  },
  input: {
    padding: '14px 18px',
    fontSize: '14px',
    borderRadius: '12px',
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
    padding: '15px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #2C1B14, #1a100c)',
    color: '#E8D5A3',
    border: '1px solid rgba(201,168,76,0.3)',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    marginTop: '4px',
    letterSpacing: '0.5px',
  },
};

export default Login;
