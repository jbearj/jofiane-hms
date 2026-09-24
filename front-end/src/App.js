import React, { useEffect, useState } from 'react';
import './App.css';
import Login from './components/login/login';
import Sidebar from './components/admin/Sidebar';
import Overview from './components/admin/Overview';
import Transactions from './components/admin/finance/Transactions';
import AuditTrail from './components/admin/finance/AuditTrail';
import RoomInventory from './components/admin/rooms/RoomInventory';
import HousekeepingStatus from './components/admin/rooms/HousekeepingStatus';
import Maintenance from './components/admin/rooms/Maintenance';
import StaffList from './components/admin/employee-management/StaffList';
import ShiftSchedules from './components/admin/employee-management/ShiftSchedules';
import AllBookings from './components/admin/reservations/AllBookings';
import Cancellations from './components/admin/reservations/Cancellations';
import OtaChannels from './components/admin/reservations/OtaChannels';
import OccupancyReports from './components/admin/reports/OccupancyReports';
import FinancialReports from './components/admin/reports/FinancialReports';
import GuestReports from './components/admin/reports/GuestReports';
import Settings from './components/admin/Settings';
import Rooms from './components/admin/rooms/Rooms';
import EmployeePortal from './components/employee/EmployeePortal';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('admin'); // 'admin' or 'employee'
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = window.localStorage.getItem('jofiane-sidebar-collapsed');
    if (saved !== null) return JSON.parse(saved);
    return typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 900px)').matches;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employeeRole, setEmployeeRole] = useState(null); // Store the role of the logged-in employee
  const [loggedInEmployee, setLoggedInEmployee] = useState(null); // Store the logged-in employee object

  // Shared admin profile — edited in Settings, reflected in Sidebar + Dashboard.
  // Persisted to localStorage so it survives refresh.
  const [adminProfile, setAdminProfile] = useState(() => {
    if (typeof window === 'undefined') {
      return { fullName: 'Administrator', email: 'admin@jofiane.com', role: 'Super Admin', photo: null };
    }
    const saved = window.localStorage.getItem('jofiane-admin-profile');
    return saved
      ? JSON.parse(saved)
      : { fullName: 'Administrator', email: 'admin@jofiane.com', role: 'Super Admin', photo: null };
  });

  const updateAdminProfile = (next) => {
    setAdminProfile(next);
    window.localStorage.setItem('jofiane-admin-profile', JSON.stringify(next));
  };
  const [isAdminDarkMode, setIsAdminDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const savedTheme = window.localStorage.getItem('jofiane-admin-theme');
    if (savedTheme) return savedTheme === 'dark';
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    window.localStorage.setItem('jofiane-admin-theme', isAdminDarkMode ? 'dark' : 'light');
    // Flag on <body> so portaled modals (rendered outside the app shell) can
    // pick up dark-mode styling too. Only applies while the admin view is shown.
    if (viewMode === 'admin') {
      document.body.classList.toggle('app-dark', isAdminDarkMode);
    }
  }, [isAdminDarkMode, viewMode]);

  useEffect(() => {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 900px)').matches) {
      const saved = window.localStorage.getItem('jofiane-sidebar-collapsed');
      if (saved === null) setIsCollapsed(true);
    }
  }, []);

  const handleLoginSuccess = (role, employee, module) => {
    if (role === 'admin' || module === 'admin') {
      setViewMode('admin');
      setEmployeeRole(null);
      // If a DB admin employee logged in, store their info for display purposes
      setLoggedInEmployee(employee || null);
      // Seed the shared admin profile from the DB employee record (if any)
      if (employee) {
        const seeded = {
          fullName: employee.name || 'Administrator',
          email:    employee.email || 'admin@jofiane.com',
          role:     employee.role || 'Admin',
          photo:    employee.photo || null,
          _id:      employee._id || null,   // MongoDB id → lets us persist password/profile changes
        };
        setAdminProfile(seeded);
        window.localStorage.setItem('jofiane-admin-profile', JSON.stringify(seeded));
      }
    } else {
      setEmployeeRole(module || 'frontdesk');
      setLoggedInEmployee(employee);
      setViewMode('employee');
    }
    setIsLoggedIn(true);
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview setActiveTab={setActiveTab} adminProfile={adminProfile} />;
      case 'transactions':
      case 'payments':
        return <Transactions />;
      case 'audit-trail':
        return <AuditTrail />;
      case 'rooms':
        return <Rooms />;
      case 'room-inventory':
        return <RoomInventory />;
      case 'housekeeping':
        return <HousekeepingStatus />;
      case 'maintenance':
        return <Maintenance />;
      case 'staff-list':
        return <StaffList />;
      case 'shifts':
        return <ShiftSchedules />;
      case 'all-bookings':
        return <AllBookings />;
      case 'cancellations':
        return <Cancellations />;
      case 'ota-channels':
        return <OtaChannels />;
      case 'occupancy-reports':
        return <OccupancyReports />;
      case 'financial-reports':
        return <FinancialReports />;
      case 'guest-reports':
        return <GuestReports />;
      case 'settings':
        return <Settings isDarkMode={isAdminDarkMode} setIsDarkMode={setIsAdminDarkMode} sidebarCollapsed={isCollapsed} setSidebarCollapsed={setIsCollapsed} adminProfile={adminProfile} onUpdateProfile={updateAdminProfile} />;
      default:
        return <Overview setActiveTab={setActiveTab} adminProfile={adminProfile} />;
    }
  };

  // Render Login page 
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Render Employee Portal 
  if (viewMode === 'employee') {
    return (
      <div className="employee-view">
        <button 
          onClick={() => setViewMode('admin')} 
          className="portal-mode-switch"
        >
          ← Switch to Admin View
        </button>
        <EmployeePortal employeeRole={employeeRole} employee={loggedInEmployee} />
      </div>
    );
  }

  // Render Admin Console view by default
  return (
    <div className={`portal-shell employee-portal-shell admin-portal-shell admin-view ${isCollapsed ? 'nav-collapsed' : ''} ${isAdminDarkMode ? 'theme-dark' : 'theme-light'}`}>
      <button 
        onClick={() => setViewMode('employee')} 
        className="portal-mode-switch"
      >
        Switch to Employee Portal →
      </button>

      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isAdminDarkMode}
        setIsDarkMode={setIsAdminDarkMode}
        adminProfile={adminProfile}
      />
      <button type="button" className="mobile-nav-trigger" onClick={() => setIsCollapsed(false)} aria-label="Open admin navigation">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      {!isCollapsed && <button type="button" className="mobile-nav-backdrop" onClick={() => setIsCollapsed(true)} aria-label="Close admin navigation" />}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
