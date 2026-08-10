import React, { useState } from 'react';
import logoFull from '../../assets/Jofiane-logo.png'; 
import logoMini from '../../assets/Jofiane-logo 2.png'; 

function Sidebar({ isCollapsed, setIsCollapsed, activeTab, setActiveTab }) {

  const [expandedSections, setExpandedSections] = useState({
    'finance': false,
    'rooms': false,
    'employees': false,
    'reservations': false,
    'reports': false
  });

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Hierarchical menu structure
  const menuItems = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
    },
    {
      id: 'finance',
      label: 'Revenue & Finance',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><path d="M9 7h6"></path><path d="M9 11h6"></path></svg>,
      subItems: [
        { id: 'transactions', label: 'Transactions' },
        { id: 'revenue-reports', label: 'Revenue Reports' },
        { id: 'night-audit', label: 'Night Audit Logs' }
      ]
    },
    {
      id: 'rooms',
      label: 'Rooms Operation',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16"></path><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"></path><path d="M14 12v.01" strokeWidth="3"></path></svg>,
      subItems: [
        { id: 'room-inventory', label: 'Room Inventory' },
        { id: 'housekeeping', label: 'Housekeeping Status' },
        { id: 'maintenance', label: 'Maintenance' }
      ]
    },
    {
      id: 'employees',
      label: 'Employee Management',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
      subItems: [
        { id: 'staff-list', label: 'Staff List' },
        { id: 'shifts', label: 'Shift Schedules' },
        { id: 'performance', label: 'Performance' }
      ]
    },
    {
      id: 'reservations',
      label: 'Reservations',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
      subItems: [
        { id: 'all-bookings', label: 'All Bookings' },
        { id: 'cancellations', label: 'Cancellations' },
        { id: 'ota-channels', label: 'OTA Channels' }
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
      subItems: [
        { id: 'occupancy-reports', label: 'Occupancy Reports' },
        { id: 'financial-reports', label: 'Financial Reports' },
        { id: 'guest-reports', label: 'Guest Reports' }
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
        }
        
        /* The structural vertical line container */
        .nav-submenu-container {
          display: flex;
          flex-direction: column;
          margin-left: 24px;
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

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* MENU TOGGLE */}
        <div className="menu-toggle-container" style={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
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

        {/* BRAND / LOGO */}
        <div className="sidebar-brand" style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: isCollapsed ? 'center' : 'flex-start',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          paddingLeft: isCollapsed ? '0' : '24px',  
          paddingTop: isCollapsed ? '0' : '5px'   
        }}>
          <img src={isCollapsed ? logoMini : logoFull} alt="Jofiane Logo" className="sidebar-logo" />
          {!isCollapsed && <div className="brand-sub">Admin Console</div>}
        </div>

        {/* NAVIGATION */}
        <nav className="nav-menu no-scrollbar" style={{ overflowY: 'auto', flexGrow: 1 }}>
          {menuItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedSections[item.id];
            
            const isChildActive = hasSubItems && item.subItems.some(sub => sub.id === activeTab);
            const isParentActive = !hasSubItems && activeTab === item.id;
            const isActive = isChildActive || isParentActive;

            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
                
                {/* Parent button */}
                <button
                  className={`nav-link nav-parent-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (hasSubItems) {
                      if (!isCollapsed) toggleSection(item.id);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  title={isCollapsed ? item.label : ""}
                  style={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-start', paddingLeft: isCollapsed ? '0' : '16px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: '12px' }}>
                    <div className="nav-icon-wrapper">{item.icon}</div>
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                </button>

                {/* Sub-items */}
                {hasSubItems && isExpanded && !isCollapsed && (
                  <div className="nav-submenu-container">
                    {item.subItems.map((sub) => {
                      const isSubActive = activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          className={`nav-link ${isSubActive ? 'active' : ''}`}
                          onClick={() => setActiveTab(sub.id)}
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

        {/* SETTINGS (pinned above footer) */}
        <div style={{ padding: '0 12px', marginTop: 'auto', marginBottom: '8px' }}>
          <button
            className={`nav-link nav-parent-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            title={isCollapsed ? "Settings" : ""}
            style={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-start', paddingLeft: isCollapsed ? '0' : '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: '12px' }}>
              <div className="nav-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </div>
              {!isCollapsed && <span>Settings</span>}
            </div>
          </button>

          <button
            className="nav-link"
            title={isCollapsed ? "Log out" : ""}
            style={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-start', paddingLeft: isCollapsed ? '0' : '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: '12px' }}>
              <div className="nav-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </div>
              {!isCollapsed && <span>Log out</span>}
            </div>
          </button>
        </div>

        {/* USER PROFILE FOOTER */}
        <div className="sidebar-footer">
          <div className="user-badge" style={{ 
            marginBottom: 0, 
            padding: isCollapsed ? '10px 0' : '10px 12px',
            display: 'flex',
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}>
            <div className="avatar">A</div>
            {!isCollapsed && (
              <div className="user-info">
                <div className="name">Admin</div>
                <div className="role">General Manager</div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
