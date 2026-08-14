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
import Rooms from './components/admin/rooms/Rooms';
import Employees from './components/admin/employee-management/Employees';
import EmployeeModal from './components/admin/employee-management/EmployeeModal';
import employee1 from './assets/employee1.jpeg';
import EmployeePortal from './components/employee/EmployeePortal';

const initialEmployees = [
  {
    id: 1,
    name: 'Ana Buenaflor',
    email: 'ana@jofiane.com',
    role: 'Front Desk Concierge',
    salary: '18000',
    start: '06:00',
    end: '14:00',
    status: 'Active',
    password: 'ana2026secure',
    photo: employee1,
  },
  {
    id: 2,
    name: 'Marco Diaz',
    email: 'marco@jofiane.com',
    role: 'Night Auditor',
    salary: '22000',
    start: '14:00',
    end: '22:00',
    status: 'Active',
    password: 'marcoNight123',
    photo: employee1,
  },
  {
    id: 3,
    name: 'Liza Fernandez',
    email: 'liza@jofiane.com',
    role: 'Housekeeping Lead',
    salary: '19500',
    start: '07:00',
    end: '15:00',
    status: 'On Leave',
    password: 'lizaClean99',
    photo: employee1,
  },
  {
    id: 4,
    name: 'Ronnie Cruz',
    email: 'ronnie@jofiane.com',
    role: 'Maintenance Tech',
    salary: '20000',
    start: '09:00',
    end: '17:00',
    status: 'Active',
    password: 'wrench2026',
    photo: employee1,
  },
  {
    id: 5,
    name: 'David Reyes',
    email: 'david@jofiane.com',
    role: 'Bellhop',
    salary: '15000',
    start: '',
    end: '',
    status: 'Terminated',
    password: 'invalidPass',
    photo: employee1,
  },
];

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [employees, setEmployees] = useState(initialEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('admin'); // 'admin' or 'employee'
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminDarkMode, setIsAdminDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const savedTheme = window.localStorage.getItem('jofiane-admin-theme');
    if (savedTheme) return savedTheme === 'dark';
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    window.localStorage.setItem('jofiane-admin-theme', isAdminDarkMode ? 'dark' : 'light');
  }, [isAdminDarkMode]);

  useEffect(() => {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 900px)').matches) {
      setIsCollapsed(true);
    }
  }, []);

  const handleLoginSuccess = (role, formData) => {
    setViewMode(role);
    setIsLoggedIn(true);
  };
  
  const openModal = (employee = null) => {
    setSelectedEmployee(employee);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
  };

  const saveEmployee = (updatedEmployee) => {
    if (updatedEmployee.id) {
      // Edit existing
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === updatedEmployee.id ? updatedEmployee : emp))
      );
    } else {
      // Add new
      const newId = Math.max(...employees.map((e) => e.id), 0) + 1;
      setEmployees([...employees, { ...updatedEmployee, id: newId, photo: employee1 }]);
    }
    closeModal();
  };

  const deleteEmployee = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      closeModal();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview setActiveTab={setActiveTab} />;
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
      default:
        return <Overview setActiveTab={setActiveTab} />;
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
        <EmployeePortal />
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
      />
      <button type="button" className="mobile-nav-trigger" onClick={() => setIsCollapsed(false)} aria-label="Open admin navigation">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      {!isCollapsed && <button type="button" className="mobile-nav-backdrop" onClick={() => setIsCollapsed(true)} aria-label="Close admin navigation" />}
      <main className="main-content">
        {renderContent()}
      </main>
      {modalOpen && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={closeModal}
          onSave={saveEmployee}
          onDelete={deleteEmployee}
        />
      )}
    </div>
  );
}

export default App;
