import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import employee1 from '../../../assets/employee1.jpeg';

function StaffList() {
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const departments = ['Front Desk', 'Housekeeping', 'Maintenance', 'F&B', 'Admin'];

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { applyFilters(); }, [employees, searchQuery, filterDept, filterStatus]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);

      // Fetch employees and today's shift assignments in parallel
      const [empRes, shiftsRes, assignRes] = await Promise.all([
        fetch('http://localhost:5000/api/employees'),
        fetch('http://localhost:5000/api/shifts'),
        fetch(`http://localhost:5000/api/shift-assignments?startDate=${today}&endDate=${today}`),
      ]);
      if (!empRes.ok) throw new Error(`Server error: ${empRes.status}`);
      const [empData, shiftsData, assignData] = await Promise.all([
        empRes.json(),
        shiftsRes.ok ? shiftsRes.json() : [],
        assignRes.ok ? assignRes.json() : [],
      ]);

      // Build a map of employee_id → shift schedule string for today
      const shiftNameMap = {};
      shiftsData.forEach(s => { shiftNameMap[s.shift_id] = s.schedule || s.shift_name; });

      const todayShiftByEmpId = {};
      assignData.forEach(a => {
        todayShiftByEmpId[a.employee_id] = shiftNameMap[a.shift_id] || '';
      });

      const normalized = empData.map(e => ({
        id: e._id,
        employeeId: e.employee_id || '',
        name: e.full_name || '',
        email: e.contact?.email || '',
        phone: e.contact?.phone || '',
        role: e.employment_details?.role?.title || '',
        department: e.employment_details?.department || '',
        salary: e.employment_details?.role?.base_salary || 0,
        // Pull today's assigned shift schedule (e.g. "06:00 - 14:00") if exists
        shift: todayShiftByEmpId[e.employee_id] || '',
        status: e.employment_details?.status === 'ACTIVE'     ? 'Active'
              : e.employment_details?.status === 'ON LEAVE'   ? 'On Leave'
              : e.employment_details?.status === 'TERMINATED' ? 'Terminated'
              : e.employment_details?.status || '',
        hireDate: e.employment_details?.hire_date || '',
        photo: employee1,
        portalAccess: e.portal_access?.has_access ?? false,
        username: e.portal_access?.username || '',
        password: e.portal_access?.password || '',
        _id: e._id,
      }));
      setEmployees(normalized);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...employees];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
    }
    if (filterDept !== 'all') result = result.filter(e => e.department === filterDept);
    if (filterStatus !== 'all') result = result.filter(e => e.status === filterStatus);
    setFilteredEmployees(result);
  };

  const handleAdd = () => { setEditingEmployee(null); setShowAddEdit(true); };
  const handleEdit = (emp) => { setEditingEmployee(emp); setShowAddEdit(true); setSelectedEmployee(null); };

  const handleDelete = async (emp) => {
    if (!window.confirm(`Delete ${emp.name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/employees/${emp._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setEmployees(prev => prev.filter(e => e.id !== emp.id));
      setSelectedEmployee(null);
    } catch (err) {
      console.error('Failed to delete employee:', err);
      alert('Failed to delete employee. Please try again.');
    }
  };

  const handleSave = async (empData) => {
    try {
      // Use $set with proper nested dot-notation paths so MongoDB updates subdocuments correctly
      const payload = {
        $set: {
          full_name: empData.name,
          'contact.email': empData.email,
          'contact.phone': empData.phone,
          'portal_access.username': empData.username,
          'portal_access.has_access': empData.portalAccess,
          'employment_details.hire_date': empData.hireDate,
          'employment_details.status':
            empData.status === 'Active'     ? 'ACTIVE'
            : empData.status === 'On Leave' ? 'ON LEAVE'
            : empData.status === 'Terminated' ? 'TERMINATED'
            : empData.status,
          'employment_details.department': empData.department,
          'employment_details.role.title': empData.role,
          'employment_details.role.base_salary': parseFloat(empData.salary) || 0,
          ...(empData.password ? { 'portal_access.password': empData.password } : {}),
        },
      };

      if (editingEmployee) {
        const res = await fetch(`http://localhost:5000/api/employees/${editingEmployee._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
      } else {
        // For new employees send a clean object without $set wrapper
        const newPayload = {
          employee_id: Date.now(),
          full_name: empData.name,
          contact: { email: empData.email, phone: empData.phone },
          portal_access: {
            username: empData.username,
            has_access: empData.portalAccess,
            ...(empData.password ? { password: empData.password } : {}),
          },
          employment_details: {
            hire_date: empData.hireDate,
            status:
              empData.status === 'Active'     ? 'ACTIVE'
              : empData.status === 'On Leave' ? 'ON LEAVE'
              : empData.status === 'Terminated' ? 'TERMINATED'
              : empData.status,
            department: empData.department,
            role: {
              title: empData.role,
              base_salary: parseFloat(empData.salary) || 0,
            },
          },
        };
        const res = await fetch('http://localhost:5000/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPayload),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
      }
      await fetchEmployees();
    } catch (err) {
      console.error('Failed to save employee:', err);
      alert('Failed to save employee. Please try again.');
    }
    setShowAddEdit(false);
    setEditingEmployee(null);
  };

  const handleStatusChange = async (empId, newStatus) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    try {
      const dbStatus =
        newStatus === 'Active'      ? 'ACTIVE'
        : newStatus === 'On Leave'  ? 'ON LEAVE'
        : newStatus === 'Terminated'? 'TERMINATED'
        : newStatus;
      const res = await fetch(`http://localhost:5000/api/employees/${emp._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          $set: {
            'employment_details.status': dbStatus,
            'portal_access.has_access': newStatus === 'Active',
          },
        }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const portalAccess = newStatus === 'Active';
      setEmployees(prev => prev.map(e =>
        e.id === empId ? { ...e, status: newStatus, portalAccess } : e
      ));
      if (selectedEmployee?.id === empId) {
        setSelectedEmployee(prev => ({ ...prev, status: newStatus, portalAccess }));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  // Stats
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const onLeaveCount = employees.filter(e => e.status === 'On Leave').length;
  const terminatedCount = employees.filter(e => e.status === 'Terminated').length;

  const getStatusTag = (status) => {
    switch (status) {
      case 'Active': return <span className="status-tag tag-success">Active</span>;
      case 'On Leave': return <span className="status-tag tag-warning">On Leave</span>;
      case 'Terminated': return <span className="status-tag tag-danger">Terminated</span>;
      default: return <span className="status-tag tag-neutral">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <section className="admin-tab-content active">
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>Loading staff list...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-tab-content active">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Staff List</h2>
          <p>Employee directory and HR management</p>
        </div>
        {/* Button removed from here and moved to the panel-toolbar below */}
      </div>

      {/* SUMMARY BAR */}
      <div className="panel" style={{ padding: '20px 28px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)' }}>{employees.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total<br/>Staff</div>
          </div>
          <div style={{ width: '1px', height: '36px', background: 'var(--border-light)' }}></div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--status-vac)' }}>{activeCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Active</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>{onLeaveCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>On Leave</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--status-occ)' }}>{terminatedCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Terminated</div>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {departments.map(dept => {
              const count = employees.filter(e => e.department === dept).length;
              return (
                <button
                  key={dept}
                  onClick={() => setFilterDept(filterDept === dept ? 'all' : dept)}
                  style={{
                    padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                    background: filterDept === dept ? 'rgba(201,168,76,0.1)' : 'var(--bg-input)',
                    border: filterDept === dept ? '1px solid var(--gold)' : '1px solid var(--border-light)',
                    color: filterDept === dept ? 'var(--gold-dark)' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {dept} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* EMPLOYEE TABLE */}
      <div className="panel">
        <div className="panel-header">
          <h3>Employees ({filteredEmployees.length})</h3>

          {/* SEARCH + FILTERS + ADD BUTTON */}
          <div className="panel-toolbar">
            <div className="panel-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                type="text"
                placeholder="Search by name, role, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select className="floor-dropdown" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>
            
            {/* Added button right here */}
            <button className="btn btn-sm btn-gold" onClick={handleAdd}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Employee
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Department</th>
                <th>Phone</th>
                <th>Shift (Today)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No employees found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="table-row-hover" onClick={() => setSelectedEmployee(emp)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={emp.photo} alt={emp.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <span className="guest-name">{emp.name}</span>
                          <span className="guest-sub">{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="std-text">{emp.role}</span></td>
                    <td><span className="std-text">{emp.department}</span></td>
                    <td><span className="std-text">{emp.phone}</span></td>
                    <td><span className="std-text">{emp.shift || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>}</span></td>
                    <td>{getStatusTag(emp.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMPLOYEE PROFILE MODAL */}
      {selectedEmployee && createPortal(
        <ProfileModal
          employee={selectedEmployee}
          getStatusTag={getStatusTag}
          onEdit={() => handleEdit(selectedEmployee)}
          onDelete={() => handleDelete(selectedEmployee)}
          onStatusChange={(status) => handleStatusChange(selectedEmployee.id, status)}
          onClose={() => setSelectedEmployee(null)}
        />,
        document.body
      )}

      {/* ADD/EDIT MODAL */}
      {showAddEdit && createPortal(
        <EmployeeFormModal
          employee={editingEmployee}
          departments={departments}
          existingEmployees={employees}
          onClose={() => { setShowAddEdit(false); setEditingEmployee(null); }}
          onSave={handleSave}
        />,
        document.body
      )}
    </section>
  );
}

/* ============================================================
   EMPLOYEE PROFILE MODAL
   ============================================================ */
function ProfileModal({ employee, getStatusTag, onEdit, onDelete, onStatusChange, onClose }) {
  const [showCredentials, setShowCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const empIdDisplay = employee.employeeId
    ? `EMP-${String(employee.employeeId).padStart(4, '0')}`
    : employee._id?.toString().slice(-6).toUpperCase();

  return (
    <div className="modal-overlay open">
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <img src={employee.photo} alt={employee.name} style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-light)' }} />
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 4px 0' }}>{employee.name}</h3>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{employee.role} · {employee.department}</div>
            <div style={{ marginTop: '6px' }}>{getStatusTag(employee.status)}</div>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <DetailItem label="Email" value={employee.email || '—'} />
          <DetailItem label="Phone" value={employee.phone || '—'} />
          <DetailItem label="Shift (Today)" value={employee.shift || 'Not scheduled today'} />
          <DetailItem label="Salary" value={employee.salary ? `₱${employee.salary.toLocaleString()} /mo` : '—'} />
          <DetailItem label="Hire Date" value={employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} />
          <DetailItem label="Employee ID" value={empIdDisplay || '—'} />
          <DetailItem label="Department" value={employee.department || '—'} />
        </div>

        {/* Portal Access */}
        <div style={{ background: 'var(--bg-input)', borderRadius: '8px', padding: '16px', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCredentials ? '12px' : '0' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Portal Access</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: employee.portalAccess ? 'var(--status-vac)' : 'var(--status-occ)' }}>
                {employee.portalAccess ? '✓ Granted' : '✗ Revoked'}
              </div>
            </div>
            <button className="btn btn-xs" onClick={() => setShowCredentials(!showCredentials)}>
              {showCredentials ? 'Hide' : 'Show'} Credentials
            </button>
          </div>
          {showCredentials && (
            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Username</div>
                  <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                    {employee.username || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Not set</span>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Password</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                      {employee.password
                        ? (showPassword ? employee.password : '••••••••')
                        : <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Not set</span>
                      }
                    </span>
                    {employee.password && (
                      <button
                        className="btn btn-xs"
                        style={{ padding: '2px 7px', fontSize: '10px' }}
                        onClick={() => setShowPassword(p => !p)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                To change credentials, use Edit Profile.
              </div>
            </div>
          )}
        </div>

        {/* Status Management */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Change Status</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Active', 'On Leave', 'Terminated'].map(status => (
              <button
                key={status}
                className={`btn btn-xs ${employee.status === status ? 'btn-gold' : ''}`}
                onClick={() => onStatusChange(status)}
                disabled={employee.status === status}
                style={{ opacity: employee.status === status ? 0.6 : 1 }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <hr className="modal-divider" />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
          <button className="btn btn-sm" style={{ color: 'var(--status-occ)' }} onClick={onDelete}>Delete Employee</button>
          <button className="btn btn-sm btn-gold" onClick={onEdit}>Edit Profile</button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

/* ============================================================
   ADD / EDIT EMPLOYEE MODAL
   ============================================================ */
function EmployeeFormModal({ employee, departments, existingEmployees = [], onClose, onSave }) {
  const isEdit = !!employee;

  const [formData, setFormData] = useState({
    name:         employee?.name        || '',
    email:        employee?.email       || '',
    phone:        employee?.phone       || '',
    role:         employee?.role        || '',
    department:   employee?.department  || departments[0],
    salary:       employee?.salary      || '',
    status:       employee?.status      || 'Active',
    hireDate:     employee?.hireDate    || new Date().toISOString().split('T')[0],
    portalAccess: employee?.portalAccess ?? true,
    password:     '',
  });

  const [showPassword, setShowPassword] = useState(false);

  // ── USERNAME — purely derived, never stored in formData ──
  // Format: firstname@jofiane-department.com  (e.g. jennifer@jofiane-frontdesk.com)
  // If that's taken, append 2, 3, ...  → jennifer2@jofiane-frontdesk.com
  const computeUsername = (name, department) => {
    const firstName = name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const deptSlug  = department.trim().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    if (!firstName) return '';
    const domain = deptSlug ? `jofiane-${deptSlug}.com` : 'jofiane.com';
    const base   = firstName;

    // Collect taken usernames, excluding the employee currently being edited
    const taken = new Set(
      existingEmployees
        .filter(e => e._id !== employee?._id)
        .map(e => (e.username || '').toLowerCase())
    );

    if (!taken.has(`${base}@${domain}`)) return `${base}@${domain}`;
    let n = 2;
    while (taken.has(`${base}${n}@${domain}`)) n++;
    return `${base}${n}@${domain}`;
  };

  // Compute live — updates instantly as name/department fields change
  const generatedUsername = isEdit
    ? (employee?.username || '')
    : computeUsername(formData.name, formData.department);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim())  { alert('Full name is required.'); return; }
    if (!formData.email.trim()) { alert('Email is required.'); return; }
    if (!formData.role.trim())  { alert('Role / Position is required.'); return; }
    if (!isEdit && formData.portalAccess && !formData.password) {
      alert('Please set a password for the portal account.'); return;
    }
    onSave({
      ...formData,
      username: generatedUsername,          // always pass the computed username
      salary: parseFloat(formData.salary) || 0,
    });
  };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));
  const setVal = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

  return (
    <div className="modal-overlay open">
      <div className="modal-content" style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>
          {isEdit ? `Edit — ${employee.name}` : 'Add New Employee'}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          {isEdit ? 'Update employee information and portal credentials' : 'Add a new employee to the directory'}
        </p>

        <form onSubmit={handleSubmit}>

          {/* ── PERSONAL INFO ── */}
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--gold-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Personal Information</div>
          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input type="text" value={formData.name} onChange={set('name')} placeholder="e.g. Juan Dela Cruz" />
            </div>
            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input type="email" value={formData.email} onChange={set('email')} placeholder="juan@jofiane.com" />
            </div>
          </div>
          <div className="form-grid" style={{ marginBottom: '22px' }}>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" value={formData.phone} onChange={set('phone')} placeholder="+63 9xx xxx xxxx" />
            </div>
            <div className="form-group">
              <label>Hire Date</label>
              <input type="date" value={formData.hireDate} onChange={set('hireDate')} />
            </div>
          </div>

          {/* ── EMPLOYMENT ── */}
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--gold-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Employment Details</div>
          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Role / Position <span className="required">*</span></label>
              <input type="text" value={formData.role} onChange={set('role')} placeholder="e.g. Front Desk Concierge" />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select value={formData.department} onChange={set('department')}>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid" style={{ marginBottom: '22px' }}>
            <div className="form-group">
              <label>Monthly Salary (₱)</label>
              <input type="number" value={formData.salary} onChange={set('salary')} placeholder="0" min="0" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={formData.status} onChange={set('status')}>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          {/* ── PORTAL ACCOUNT ── */}
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--gold-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Portal Account</div>
          <div style={{ background: 'var(--bg-input)', borderRadius: '8px', padding: '16px', border: '1px solid var(--border-light)', marginBottom: '22px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                <input
                  type="checkbox"
                  checked={formData.portalAccess}
                  onChange={(e) => setVal('portalAccess', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--gold)' }}
                />
                Grant Employee Portal access
              </label>
            </div>

            {/* USERNAME — read-only, auto-generated */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Username
                <span style={{ fontSize: '10px', fontWeight: '600', background: 'rgba(201,168,76,0.12)', color: 'var(--gold-dark)', padding: '2px 7px', borderRadius: '10px' }}>
                  Auto-generated
                </span>
              </label>
              <input
                type="text"
                value={generatedUsername}
                readOnly
                style={{
                  background: 'var(--bg-body)',
                  cursor: 'default',
                  color: generatedUsername ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontStyle: generatedUsername ? 'normal' : 'italic',
                  opacity: formData.portalAccess ? 1 : 0.45,
                }}
                placeholder="Fill in name and department above"
              />
            </div>

            {/* PASSWORD */}
            <div className="form-group">
              <label>
                {isEdit ? 'New Password' : 'Password'}
                {!isEdit && <span className="required"> *</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={set('password')}
                  placeholder={isEdit ? 'Leave blank to keep current' : 'Set a password'}
                  disabled={!formData.portalAccess}
                  style={{ opacity: formData.portalAccess ? 1 : 0.45, paddingRight: '60px', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {isEdit && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                  Leave blank to keep the existing password unchanged.
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-gold">{isEdit ? 'Save Changes' : 'Add Employee'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StaffList;
