import React, { useState } from 'react';

function HousekeepingLogs() {
  const [logs, setLogs] = useState([
    {
      id: 1,
      time: '07:10 AM',
      room: '203',
      category: 'DND',
      description: 'Guest requested Do Not Disturb until 12 PM.',
      employee: 'Maria Santos'
    },
    {
      id: 2,
      time: '08:32 AM',
      room: '204',
      category: 'Priority',
      description: 'Express turnover required before incoming guest arrival.',
      employee: 'Liza Fernandez'
    },
    {
      id: 3,
      time: '09:15 AM',
      room: '401',
      category: 'Maintenance',
      description: 'Water heater issue reported to maintenance.',
      employee: 'Rosa Villanueva'
    },
    {
      id: 4,
      time: '11:20 AM',
      room: '304',
      category: 'Room Status',
      description: 'Room cleaned and waiting for inspection.',
      employee: 'Maria Santos'
    }
  ]);

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    room: '',
    category: 'Room Note',
    description: '',
    employee: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const addLog = (e) => {
    e.preventDefault();

    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      room: formData.room,
      category: formData.category,
      description: formData.description,
      employee: formData.employee
    };

    setLogs([
      newLog,
      ...logs
    ]);

    setFormData({
      room: '',
      category: 'Room Note',
      description: '',
      employee: ''
    });

    setShowForm(false);
  };

  const getCategoryClass = (category) => {
    if (category === 'Maintenance') {
      return 'status-tag tag-danger';
    }

    if (category === 'Priority') {
      return 'status-tag tag-warning';
    }

    if (category === 'DND') {
      return 'status-tag tag-neutral';
    }

    if (category === 'Lost & Found') {
      return 'status-tag tag-gold';
    }

    return 'status-tag tag-success';
  };

  const priorityCount = logs.filter(
    (log) => log.category === 'Priority'
  ).length;

  const maintenanceCount = logs.filter(
    (log) => log.category === 'Maintenance'
  ).length;

  const dndCount = logs.filter(
    (log) => log.category === 'DND'
  ).length;

  return (
    <main className="main-content employee-content">
      <section className="admin-tab-content active housekeeping-module">

        <div
          className="employee-dashboard-header"
          style={{ marginBottom: '28px' }}
        >
          <div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: '0 0 6px 0'
              }}
            >
              Housekeeping Log
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--text-secondary)'
              }}
            >
              Daily housekeeping notes and shift handover records.
            </p>
          </div>

          <button
            className="btn btn-gold"
            onClick={() => setShowForm(true)}
          >
            + Add Log
          </button>
        </div>

        <div
          className="panel"
          style={{
            padding: '22px 26px',
            marginBottom: '22px'
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '42px',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'var(--text-primary)'
                }}
              >
                {logs.length}
              </div>

              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)'
                }}
              >
                TODAY'S LOGS
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'var(--text-primary)'
                }}
              >
                {priorityCount}
              </div>

              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)'
                }}
              >
                PRIORITY
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'var(--text-primary)'
                }}
              >
                {maintenanceCount}
              </div>

              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)'
                }}
              >
                MAINTENANCE
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'var(--text-primary)'
                }}
              >
                {dndCount}
              </div>

              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)'
                }}
              >
                DND
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div
            className="panel-header"
            style={{
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '18px'
            }}
          >
            <h3
              style={{
                color: 'var(--text-primary)'
              }}
            >
              Shift Activity
            </h3>
          </div>

          <div style={{ padding: '0 10px' }}>
            {logs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 100px 130px 1fr 150px',
                  gap: '15px',
                  alignItems: 'center',
                  padding: '17px 10px',
                  borderBottom: '1px solid var(--border-light)'
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)'
                  }}
                >
                  {log.time}
                </div>

                <div>
                  <strong
                    style={{
                      color: 'var(--text-primary)'
                    }}
                  >
                    Room {log.room}
                  </strong>
                </div>

                <div>
                  <span
                    className={getCategoryClass(log.category)}
                  >
                    {log.category}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {log.description}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)'
                  }}
                >
                  {log.employee}
                </div>
              </div>
            ))}
          </div>
        </div>

        {showForm && (
          <div
            className="modal-overlay open"
            onClick={() => setShowForm(false)}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '440px' }}
            >
              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>

              <h3
                style={{
                  color: 'var(--text-primary)'
                }}
              >
                New Housekeeping Log
              </h3>

              <form onSubmit={addLog}>

                <div className="form-group">
                  <label>Room Number</label>

                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option>Room Note</option>
                    <option>Room Status</option>
                    <option>Priority</option>
                    <option>DND</option>
                    <option>Maintenance</option>
                    <option>Lost & Found</option>
                    <option>Shift Handover</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Employee</label>

                  <select
                    name="employee"
                    value={formData.employee}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select Employee
                    </option>

                    <option>Liza Fernandez</option>
                    <option>Maria Santos</option>
                    <option>Rosa Villanueva</option>
                    <option>Elena Cruz</option>
                    <option>Carmen Diaz</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Description</label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter housekeeping note..."
                    required
                    style={{
                      minHeight: '100px'
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    marginTop: '20px'
                  }}
                >
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-gold"
                  >
                    Save Log
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}

export default HousekeepingLogs;
