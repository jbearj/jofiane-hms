import React, { useState, useEffect } from 'react';
import logoFull from '../../assets/Jofiane-logo.png'; 
import logoMini from '../../assets/Jofiane-logo 2.png'; 
import employee1 from '../../assets/employee1.jpeg';

function EmployeePortal() {
  const [activeTab, setActiveTab] = useState('myshift');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const tabs = [
    { 
      id: 'myshift', 
      label: 'My Shift', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ) 
    },
    { 
      id: 'tasks', 
      label: 'Assigned Tasks', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      ) 
    },
    { 
      id: 'schedule', 
      label: 'My Schedule', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ) 
    }
  ];

  return (
    <div className="portal-shell">
      
      {/* =======================================
          EMPLOYEE SIDEBAR
          ======================================= */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="menu-toggle-container">
          <button 
            className="menu-toggle-btn" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Menu" : "Minimize Menu"}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="9" x2="20" y2="9"></line>
              <line x1="4" y1="15" x2="20" y2="15"></line>
            </svg>
          </button>
        </div>

        <div className="sidebar-brand">
          <img 
            src={isCollapsed ? logoMini : logoFull} 
            alt="Jofiane Logo" 
            className="sidebar-logo" 
          />
          {!isCollapsed && <div className="brand-sub">Staff Portal</div>}
        </div>

        <nav className="nav-menu">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={isCollapsed ? tab.label : ""}
            >
              <div className="nav-icon-wrapper">
                {tab.icon}
              </div>
              {!isCollapsed && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
            <button className="nav-link" title={isCollapsed ? "Setting" : ""}>
              <div className="nav-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </div>
              {!isCollapsed && <span>Setting</span>}
            </button>
            <button className="nav-link" title={isCollapsed ? "Log out" : ""}>
              <div className="nav-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </div>
              {!isCollapsed && <span>Log out</span>}
            </button>
          </div>

          <div className="user-badge" style={{ marginBottom: 0, padding: isCollapsed ? '10px 0' : '10px 12px' }}>
            <img 
              src={employee1} 
              alt="Ana Buenaflor" 
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
            />
            {!isCollapsed && (
              <div className="user-info">
                <div className="name">Ana Buenaflor</div>
                <div className="role">Front Desk Concierge</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* =======================================
          EMPLOYEE MAIN CONTENT
          ======================================= */}
      <main className="main-content">
        <section className="admin-tab-content active">
          
          <div className="page-header">
            <div className="left">
              <h2>Good Morning, Ana.</h2>
              <p>Have a great shift today.</p>
            </div>
            <div className="right">
              <span className="date-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px', color: 'var(--gold)'}}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Aug 7, 2026
              </span>
            </div>
          </div>

          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="kpi-card">
              <span className="lbl">CURRENT STATUS</span>
              <span className="val">
                <span className={`status-tag ${isClockedIn ? 'tag-success' : 'tag-neutral'}`} style={{ fontSize: '14px', padding: '6px 16px' }}>
                  {isClockedIn ? 'CLOCKED IN' : 'OFF DUTY'}
                </span>
              </span>
              <span className="sub">Since 05:52 AM</span>
            </div>
            <div className="kpi-card">
              <span className="lbl">SHIFT SCHEDULE</span>
              <span className="val">06:00 - 14:00</span>
              <span className="sub">Standard Front Desk Shift</span>
            </div>
            <div className="kpi-card">
              <span className="lbl">HOURS WORKED (THIS WEEK)</span>
              <span className="val">32h 15m</span>
              <span className="sub">Target: 40h</span>
            </div>
          </div>

          <div className="dashboard-split">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div className="panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <h3 style={{ fontSize: '32px', fontFamily: "'Playfair Display', serif", margin: '0 0 10px 0' }}>
                  {formatTime(currentTime)}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '25px' }}>
                  Location verified: Front Desk Terminal 1
                </p>
                <button 
                  className={`btn ${isClockedIn ? 'btn-danger' : 'btn-gold'}`} 
                  style={{ padding: '14px 40px', fontSize: '14px', borderRadius: '8px' }}
                  onClick={() => setIsClockedIn(!isClockedIn)}
                >
                  {isClockedIn ? 'CLOCK OUT' : 'CLOCK IN'}
                </button>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h3>My Tasks for Today</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-light)', borderRadius: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--gold)' }} />
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>Process checkout for Room 204 (Marisol Reyes)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-light)', borderRadius: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--gold)' }} />
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>Prepare VIP keys for Fam. Villanueva (Room 308)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-light)', borderRadius: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--gold)' }} defaultChecked />
                    <span style={{ fontSize: '13px', fontWeight: '500', textDecoration: 'line-through', color: 'var(--text-muted)' }}>Morning register count & float verify</span>
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div className="panel" style={{ flex: 1 }}>
                <div className="panel-header" style={{ marginBottom: '15px' }}>
                  <h3>Front Desk Notes</h3>
                  <span className="status-tag tag-neutral">Shared</span>
                </div>
                <div style={{ 
                  background: '#FFFDF9', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: '6px', 
                  padding: '16px',
                  minHeight: '200px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: 'var(--text-primary)'
                }}>
                  • Prepare VIP welcome basket for Fam. Villanueva (Rm 308) upon arrival.<br/><br/>
                  • Room 106 maintenance window is scheduled for 2:00 PM to 4:00 PM today.<br/><br/>
                  • Reminder: Shift handover meeting at 1:45 PM. Please have the logbook ready.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default EmployeePortal;