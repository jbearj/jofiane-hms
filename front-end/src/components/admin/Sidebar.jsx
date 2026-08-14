import React, { useEffect, useRef, useState } from 'react';
import logoFull from '../../assets/Jofiane-logo.png';
import logoMini from '../../assets/Jofiane-logo 2.png';

const defaultAccordions = {
  finance: false,
  rooms: false,
  employees: false,
  reservations: false,
  reports: false
};

function Sidebar({ isCollapsed, setIsCollapsed, activeTab, setActiveTab, isDarkMode, setIsDarkMode }) {
  const navMenuRef = useRef(null);
  const navScrollPositionRef = useRef(0);
  const transitionTimerRef = useRef(null);
  const [transitionPhase, setTransitionPhase] = useState('');
  const [expandedSections, setExpandedSections] = useState(() => {
    try {
      const saved = window.localStorage.getItem('admin-sidebar-accordions');
      return saved ? { ...defaultAccordions, ...JSON.parse(saved) } : defaultAccordions;
    } catch {
      return defaultAccordions;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('admin-sidebar-accordions', JSON.stringify(expandedSections));
    } catch {
      // Navigation remains functional if browser storage is unavailable.
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

  const toggleSection = (sectionId) => {
    setExpandedSections((current) => ({ ...current, [sectionId]: !current[sectionId] }));
  };

  const menuItems = [
    {
      id: 'overview', group: 'Workspace', label: 'Overview',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    },
    {
      id: 'finance', group: 'Hotel management', label: 'Revenue & Finance',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h6M9 11h6"/></svg>,
      subItems: [{ id: 'transactions', label: 'Transactions' }, { id: 'audit-trail', label: 'Audit Trail' }]
    },
    {
      id: 'rooms', label: 'Rooms Operation',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16"/><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M14 12v.01" strokeWidth="3"/></svg>,
      subItems: [{ id: 'room-inventory', label: 'Room Inventory' }, { id: 'housekeeping', label: 'Housekeeping Status' }, { id: 'maintenance', label: 'Maintenance' }]
    },
    {
      id: 'employees', label: 'Employee Management',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      subItems: [{ id: 'staff-list', label: 'Staff List' }, { id: 'shifts', label: 'Shift Schedules' }]
    },
    {
      id: 'reservations', label: 'Reservations',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
      subItems: [{ id: 'all-bookings', label: 'All Bookings' }, { id: 'cancellations', label: 'Cancellations' }, { id: 'ota-channels', label: 'OTA Channels' }]
    },
    {
      id: 'reports', group: 'Business intelligence', label: 'Reports',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>,
      subItems: [{ id: 'occupancy-reports', label: 'Occupancy Reports' }, { id: 'financial-reports', label: 'Financial Reports' }, { id: 'guest-reports', label: 'Guest Reports' }]
    }
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${transitionPhase}`}>
      <div className="menu-toggle-container">
        <button className={`menu-toggle-btn sidebar-menu-button ${!isCollapsed ? 'opened' : ''}`} onClick={handleSidebarToggle} title={isCollapsed ? 'Expand Menu' : 'Minimize Menu'} aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={!isCollapsed}>
          <span className="sidebar-toggle-glyph" aria-hidden="true">
            <span className="sidebar-toggle-line sidebar-toggle-line-top" />
            <span className="sidebar-toggle-line sidebar-toggle-line-middle" />
            <span className="sidebar-toggle-line sidebar-toggle-line-bottom" />
          </span>
        </button>
      </div>

      <div className="sidebar-brand">
        <img src={logoFull} alt="Jofiane Logo" className="sidebar-logo sidebar-logo-full" />
        <img src={logoMini} alt="" aria-hidden="true" className="sidebar-logo sidebar-logo-mini" />
        <div className="brand-sub">Admin Console</div>
      </div>

      <nav ref={navMenuRef} className="nav-menu no-scrollbar" onScroll={(event) => { navScrollPositionRef.current = event.currentTarget.scrollTop; }}>
        {menuItems.map((item) => {
          const hasSubItems = Boolean(item.subItems?.length);
          const isExpanded = expandedSections[item.id];
          const isActive = hasSubItems ? item.subItems.some((sub) => sub.id === activeTab) : activeTab === item.id;
          return (
            <div className="nav-item-group" key={item.id}>
              {item.group && <div className="nav-section-label">{item.group}</div>}
              <button className={`nav-link nav-parent-btn ${isActive ? 'active' : ''}`} onClick={() => {
                if (!hasSubItems) return setActiveTab(item.id);
                if (isCollapsed) {
                  setIsCollapsed(false);
                  setExpandedSections((current) => ({ ...current, [item.id]: true }));
                } else toggleSection(item.id);
              }} title={isCollapsed ? item.label : ''} aria-expanded={hasSubItems ? isExpanded : undefined}>
                <div className="nav-link-main">
                  <div className="nav-icon-wrapper">{item.icon}</div>
                  <span className="nav-label">{item.label}</span>
                </div>
                {hasSubItems && <svg className={`nav-chevron ${isExpanded ? 'expanded' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25"><polyline points="9 18 15 12 9 6"/></svg>}
              </button>
              {hasSubItems && (
                <div className={`nav-submenu-container ${isExpanded && !isCollapsed ? 'expanded' : ''}`} aria-hidden={!isCollapsed && !isExpanded}>
                  {item.subItems.map((sub) => (
                    <button key={sub.id} className={`nav-link ${activeTab === sub.id ? 'active' : ''}`} onClick={() => setActiveTab(sub.id)} tabIndex={isCollapsed || isExpanded ? 0 : -1}>
                      {activeTab === sub.id && <span className="active-dot" />}
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-utilities">
        <button type="button" className="nav-link nav-parent-btn theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)} title={isCollapsed ? (isDarkMode ? 'Use light mode' : 'Use dark mode') : ''} aria-label={isDarkMode ? 'Use light mode' : 'Use dark mode'} aria-pressed={isDarkMode}>
          <div className="nav-link-main nav-utility-content">
            <div className="nav-icon-wrapper">
              {isDarkMode ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
            </div>
            <span className="nav-label">{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
          </div>
          <span className={`theme-switch ${isDarkMode ? 'on' : ''}`} aria-hidden="true"><span /></span>
        </button>
        <button className={`nav-link nav-parent-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} title={isCollapsed ? 'Settings' : ''}>
          <div className="nav-link-main"><div className="nav-icon-wrapper"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 7.18 19.7l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.17 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.3 7.18l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 16.82 4.3l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.83 10H21a2 2 0 0 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15z"/></svg></div><span className="nav-label">Settings</span></div>
        </button>
        <button className="nav-link nav-parent-btn" title={isCollapsed ? 'Log out' : ''}>
          <div className="nav-link-main"><div className="nav-icon-wrapper"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg></div><span className="nav-label">Log out</span></div>
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="avatar admin-avatar">A</div>
          <div className="user-info"><div className="name">Admin</div><div className="role">General Manager</div></div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
