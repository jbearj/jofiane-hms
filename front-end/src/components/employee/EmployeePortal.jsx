import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import BookingManagement from './BookingManagement';
import Arrivals from './Arrivals';
import InHouseGuests from './InHouseGuests'; 
import Departures from './Departures';
import FrontDeskLog from './FrontDeskLog'
import HousekeepingStatus from '../admin/rooms/HousekeepingStatus';
import CleaningTasks from './CleaningTasks';
import Maintenance from './Maintenance';
import EmployeeSettings from './Settings';
import WalkIn from './WalkIn';
import RoomRack from './RoomRack';
import Transactions from '../admin/finance/Transactions';
import AuditTrail from '../admin/finance/AuditTrail';

function EmployeePortal({employeeRole, employee}) {
  const frontDeskTabs = [
  'dashboard',
  'bookings',
  'arrivals',
  'inhouse',
  'departures',
  'logbook',
  'walkin',
  'roomrack',
  'transactions',
  'nightaudit',
  'settings'
  ];

  const housekeepingTabs = [
    'dashboard',
    'housekeeping',
    'cleaning-tasks',
    'maintenance',
    'settings'
  ];

  const allowedTabs =
    employeeRole === 'housekeeping'
      ? housekeepingTabs
      : frontDeskTabs;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [displayedTab, setDisplayedTab] = useState('dashboard');
  const [transitionPhase, setTransitionPhase] = useState('idle');
  const pageTransitionTimerRef = useRef(null);
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

  useEffect(() => () => {
    if (pageTransitionTimerRef.current) {
      window.clearTimeout(pageTransitionTimerRef.current);
    }
  }, []);

  const navigateToTab = (nextTab) => {
    if (nextTab === activeTab) return;

    const prefersReducedMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setActiveTab(nextTab);

    if (pageTransitionTimerRef.current) {
      window.clearTimeout(pageTransitionTimerRef.current);
    }

    if (prefersReducedMotion) {
      setDisplayedTab(nextTab);
      setTransitionPhase('idle');
      return;
    }

    setTransitionPhase('leaving');
    pageTransitionTimerRef.current = window.setTimeout(() => {
      setDisplayedTab(nextTab);
      setTransitionPhase('entering');

      pageTransitionTimerRef.current = window.setTimeout(() => {
        setTransitionPhase('idle');
        pageTransitionTimerRef.current = null;
      }, 300);
    }, 140);
  };

  const renderContent = () => {

  if (!allowedTabs.includes(displayedTab)) {
    return <Dashboard activeTab="dashboard" employee={employee} setActiveTab={navigateToTab} />;
  }

  switch (displayedTab) {
    case 'dashboard':
      return <Dashboard activeTab={displayedTab} employee={employee} setActiveTab={navigateToTab} />;

    case 'bookings':
      return (
        <main className="main-content employee-content">
          <BookingManagement />
        </main>
      );

    case 'arrivals':
      return (
        <main className="main-content employee-content">
          <Arrivals />
        </main>
      );

    case 'inhouse':
      return (
        <main className="main-content employee-content">
          <InHouseGuests />
        </main>
      );

    case 'departures':
      return (
        <main className="main-content employee-content">
          <Departures />
        </main>
      );

    case 'logbook':
      return (
        <main className="main-content employee-content">
          <FrontDeskLog />
        </main>
      );

    case 'walkin':
      return (
        <main className="main-content employee-content">
          <WalkIn onViewBooking={() => navigateToTab('bookings')} />
        </main>
      );

    case 'roomrack':
      return (
        <main className="main-content employee-content">
          <RoomRack />
        </main>
      );

    case 'transactions':
      return (
        <main className="main-content employee-content">
          <Transactions />
        </main>
      );

    case 'nightaudit':
      return (
        <main className="main-content employee-content">
          <AuditTrail />
        </main>
      );

    case 'housekeeping':
      return (
        <main className="main-content employee-content">
          <HousekeepingStatus />
        </main>
      );

    case 'cleaning-tasks':
      return (
        <main className="main-content employee-content">
          <CleaningTasks />
        </main>
      );

    case 'maintenance':
      return (
        <main className="main-content employee-content">
          <Maintenance />
        </main>
      );

    case 'settings':
      return <EmployeeSettings isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} employee={employee} />;

    default:
      return <Dashboard activeTab="dashboard" employee={employee} setActiveTab={navigateToTab} />;
  }
};

  return (
    <div className={`portal-shell employee-portal-shell page-transition-${transitionPhase} ${isCollapsed ? 'nav-collapsed' : ''} ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      <Sidebar 
        employeeRole={employeeRole}
        employee={employee}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        activeTab={activeTab}
        setActiveTab={navigateToTab}
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
