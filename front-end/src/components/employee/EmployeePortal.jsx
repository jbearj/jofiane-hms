import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import BookingManagement from './BookingManagement';
import Arrivals from './Arrivals';
import InHouseGuests from './InHouseGuests'; 
import Departures from './Departures';
import FrontDeskLog from './FrontDeskLog';

function EmployeePortal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const savedTheme = window.localStorage.getItem('jofiane-employee-theme');
    if (savedTheme) return savedTheme === 'dark';
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 900px)').matches) {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('jofiane-employee-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard activeTab={activeTab} />;
      case 'bookings':
        return <main className="main-content employee-content"><BookingManagement /></main>;
      case 'arrivals':
        return <main className="main-content employee-content"><Arrivals /></main>;
        
      case 'inhouse': 
        return <main className="main-content employee-content"><InHouseGuests /></main>;

        case 'departures':
         return <main className="main-content employee-content"><Departures /></main>;

        case 'logbook':
          return <main className="main-content employee-content"><FrontDeskLog /></main>;



      default:
        return <Dashboard activeTab={activeTab} />;

    }
  };

  return (
    <div className={`portal-shell employee-portal-shell ${isCollapsed ? 'nav-collapsed' : ''} ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      <Sidebar 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
      <button
        type="button"
        className="mobile-nav-trigger"
        onClick={() => setIsCollapsed(false)}
        aria-label="Open employee navigation"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
      {!isCollapsed && (
        <button
          type="button"
          className="mobile-nav-backdrop"
          onClick={() => setIsCollapsed(true)}
          aria-label="Close employee navigation"
        />
      )}
      {renderContent()}
    </div>
  );
}

export default EmployeePortal;
