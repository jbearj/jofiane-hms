import React, { useEffect, useRef, useState } from 'react';
import logoFull from '../../assets/Jofiane-logo.png'; 
import logoMini from '../../assets/Jofiane-logo 2.png'; 
import employee1 from '../../assets/employee1.jpeg';

function Sidebar({ isCollapsed, setIsCollapsed, activeTab, setActiveTab, isDarkMode, setIsDarkMode }) {
  const navMenuRef = useRef(null);
  const navScrollPositionRef = useRef(0);
  const transitionTimerRef = useRef(null);
  const [transitionPhase, setTransitionPhase] = useState('');
  const [expandedSections, setExpandedSections] = useState(() => {
    const defaults = {
      frontdesk: true,
      reservations: false,
      rooms: false,
      finance: false
    };

    try {
      const saved = window.localStorage.getItem('employee-sidebar-accordions');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  useEffect(() => {
    try {
      window.localStorage.setItem('employee-sidebar-accordions', JSON.stringify(expandedSections));
    } catch {
      // Navigation still works when browser storage is unavailable.
    }
  }, [expandedSections]);

  useEffect(() => {
    if (navMenuRef.current) navMenuRef.current.scrollTop = navScrollPositionRef.current;
  }, [isCollapsed]);

  useEffect(() => () => {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
  }, []);

  const handleSidebarToggle = () => {
    if (transitionPhase) return;
    if (navMenuRef.current) navScrollPositionRef.current = navMenuRef.current.scrollTop;
    setTransitionPhase(isCollapsed ? 'is-expanding' : 'is-collapsing');
    setIsCollapsed((current) => !current);
    transitionTimerRef.current = window.setTimeout(() => {
      setTransitionPhase('');
      transitionTimerRef.current = null;
    }, 320);
  };

  // Hierarchical menu structure 
  const menuItems = [
    { 
      id: 'dashboard', 
      group: 'Workspace',
      label: 'Overview', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
    },
    {
      id: 'frontdesk',
      label: 'Front Desk',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
      subItems: [
        { id: 'arrivals', label: 'Arrivals' },
        { id: 'inhouse', label: 'In-House Guests' },
        { id: 'departures', label: 'Departures' },
        { id: 'logbook', label: 'Front Desk Log' }
      ]
    },
    {
      id: 'reservations',
      group: 'Hotel operations',
      label: 'Reservations',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
      subItems: [
        { id: 'bookings', label: 'Booking Management' },
        { id: 'walkin', label: 'Walk-In' }
      ]
    },
    {
      id: 'rooms',
      label: 'Rooms',
      /* UPDATED: Door Icon */
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16"></path><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"></path><path d="M14 12v.01" strokeWidth="3"></path></svg>,
      subItems: [
        { id: 'roomrack', label: 'Room Rack / Plan' },
        { id: 'housekeeping', label: 'Housekeeping' }
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      /* UPDATED: Ledger/Journal Icon */
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><path d="M9 7h6"></path><path d="M9 11h6"></path></svg>,
      subItems: [
        { id: 'transactions', label: 'Transactions' },
        { id: 'nightaudit', label: 'Audit' }
      ]
    }
  ];

  return (
    <>
      <style>{`
        /* Hide scrollbar structurally */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .nav-parent-btn {
          width: 100%;
          /* CSS styling removed here so inline React logic can center it dynamically */
        }
        
        /* The structural vertical line container */
        .nav-submenu-container {
          display: flex;
          flex-direction: column;
          margin-left: 24px; /* Aligns with center of parent icon */
          padding-left: 12px;
          border-left: 1px solid var(--border-light, #ccc); 
          margin-top: 4px;
          margin-bottom: 8px;
          gap: 4px;
        }

        /* Active dot on the vertical line */
        .active-dot {
          position: absolute;
          left: -14.5px; 
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background-color: var(--gold, #c5a059); 
          border-radius: 50%;
        }
      `}</style>

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${transitionPhase}`}>
        
        {/* MENU TOGGLE */}
        <div className="menu-toggle-container">
          <button 
            className={`menu-toggle-btn sidebar-menu-button ${!isCollapsed ? 'opened' : ''}`}
            onClick={handleSidebarToggle}
            title={isCollapsed ? "Expand Menu" : "Minimize Menu"}
            aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
            aria-expanded={!isCollapsed}
          >
            <span className="sidebar-toggle-glyph" aria-hidden="true">
              <span className="sidebar-toggle-line sidebar-toggle-line-top" />
              <span className="sidebar-toggle-line sidebar-toggle-line-middle" />
              <span className="sidebar-toggle-line sidebar-toggle-line-bottom" />
            </span>
          </button>
        </div>

        {}
        <div className="sidebar-brand">
          <img src={logoFull} alt="Jofiane Logo" className="sidebar-logo sidebar-logo-full" />
          <img src={logoMini} alt="" aria-hidden="true" className="sidebar-logo sidebar-logo-mini" />
          <div className="brand-sub">Employee Portal</div>
        </div>

        {}
        <nav
          ref={navMenuRef}
          className="nav-menu no-scrollbar"
          onScroll={(event) => { navScrollPositionRef.current = event.currentTarget.scrollTop; }}
        >
          {menuItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedSections[item.id];
            
            
            const isChildActive = hasSubItems && item.subItems.some(sub => sub.id === activeTab);
            const isParentActive = !hasSubItems && activeTab === item.id;
            const isActive = isChildActive || isParentActive;

            return (
              <div className="nav-item-group" key={item.id}>
                {item.group && <div className="nav-section-label">{item.group}</div>}
                
                {}
                <button
                  className={`nav-link nav-parent-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (hasSubItems) {
                      if (isCollapsed) {
                        setIsCollapsed(false);
                        setExpandedSections(prev => ({ ...prev, [item.id]: true }));
                      } else {
                        toggleSection(item.id);
                      }
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  title={isCollapsed ? item.label : ""}
                  aria-expanded={hasSubItems ? isExpanded : undefined}
                >
                  <div className="nav-link-main">
                    <div className="nav-icon-wrapper">{item.icon}</div>
                    <span className="nav-label">{item.label}</span>
                  </div>
                  {hasSubItems && (
                    <svg className={`nav-chevron ${isExpanded ? 'expanded' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </button>

                {}
                {hasSubItems && (
                  <div className={`nav-submenu-container ${isExpanded && !isCollapsed ? 'expanded' : ''}`} aria-hidden={!isCollapsed && !isExpanded}>
                    {item.subItems.map((sub) => {
                      const isSubActive = activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          className={`nav-link ${isSubActive ? 'active' : ''}`}
                          onClick={() => setActiveTab(sub.id)}
                          tabIndex={isCollapsed || isExpanded ? 0 : -1}
                          style={{
                            position: 'relative',
                            padding: '6px 12px',
                            minHeight: 'auto',
                            fontSize: '0.9em',
                            background: 'transparent',
                            boxShadow: 'none'
                          }}
                        >
                          {isSubActive && <div className="active-dot" />}
                          <span style={{ fontWeight: isSubActive ? '600' : 'normal' }}>
                            {sub.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {}
        <div className="sidebar-utilities">
          <button
            type="button"
            className="nav-link nav-parent-btn theme-toggle-btn"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isCollapsed ? (isDarkMode ? 'Use light mode' : 'Use dark mode') : ''}
            aria-label={isDarkMode ? 'Use light mode' : 'Use dark mode'}
            aria-pressed={isDarkMode}
          >
            <div className="nav-link-main nav-utility-content">
              <div className="nav-icon-wrapper">
                {isDarkMode ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
              </div>
              <span className="nav-label">{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
            </div>
            <span className={`theme-switch ${isDarkMode ? 'on' : ''}`} aria-hidden="true"><span /></span>
          </button>
          <button
            className={`nav-link nav-parent-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            title={isCollapsed ? "Settings" : ""}
          >
            <div className="nav-link-main">
              <div className="nav-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </div>
              <span className="nav-label">Settings</span>
            </div>
          </button>
        </div>

        {/* USER PROFILE FOOTER */}
        <div className="sidebar-footer">
          <div className="user-badge">
            <img src={employee1} alt="Ana Buenaflor" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            <div className="user-info">
              <div className="name">Ana Buenaflor</div>
              <div className="role">Front Desk Officer</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
