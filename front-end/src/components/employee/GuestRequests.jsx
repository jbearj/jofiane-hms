import React, { useState } from 'react';

function GuestRequests() {
  const [requests, setRequests] = useState([
    {
      id: 'REQ-001',
      room: '203',
      request: 'Extra Towels',
      requestedBy: 'Guest',
      time: '10:35 AM',
      priority: 'High',
      assignedTo: 'Maria Santos',
      status: 'Pending'
    },
    {
      id: 'REQ-002',
      room: '304',
      request: 'Extra Pillows',
      requestedBy: 'Front Desk',
      time: '10:10 AM',
      priority: 'Normal',
      assignedTo: 'Rosa Villanueva',
      status: 'In Progress'
    },
    {
      id: 'REQ-003',
      room: '401',
      request: 'Make Up Room',
      requestedBy: 'Guest',
      time: '09:45 AM',
      priority: 'High',
      assignedTo: 'Elena Cruz',
      status: 'Completed'
    },
    {
      id: 'REQ-004',
      room: '115',
      request: 'Toiletries Refill',
      requestedBy: 'Front Desk',
      time: '09:20 AM',
      priority: 'Normal',
      assignedTo: '',
      status: 'Pending'
    }
  ]);

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    room: '',
    request: '',
    priority: 'Normal',
    assignedTo: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const addRequest = (e) => {
    e.preventDefault();

    const newRequest = {
      id: `REQ-${String(requests.length + 1).padStart(3, '0')}`,
      room: formData.room,
      request: formData.request,
      requestedBy: 'Front Desk',
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      priority: formData.priority,
      assignedTo: formData.assignedTo,
      status: 'Pending'
    };

    setRequests([
      newRequest,
      ...requests
    ]);

    setFormData({
      room: '',
      request: '',
      priority: 'Normal',
      assignedTo: ''
    });

    setShowForm(false);
  };

  const updateStatus = (id, newStatus) => {
    setRequests(
      requests.map((request) =>
        request.id === id
          ? {
              ...request,
              status: newStatus
            }
          : request
      )
    );
  };

  const assignStaff = (id, staffName) => {
    setRequests(
      requests.map((request) =>
        request.id === id
          ? {
              ...request,
              assignedTo: staffName
            }
          : request
      )
    );
  };

  const getStatusClass = (status) => {
    if (status === 'Completed') {
      return 'status-tag tag-success';
    }

    if (status === 'In Progress') {
      return 'status-tag tag-gold';
    }

    return 'status-tag tag-warning';
  };

  const pendingCount = requests.filter(
    (request) => request.status === 'Pending'
  ).length;

  const inProgressCount = requests.filter(
    (request) => request.status === 'In Progress'
  ).length;

  const completedCount = requests.filter(
    (request) => request.status === 'Completed'
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
              Guest Requests
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--text-secondary)'
              }}
            >
              Manage housekeeping requests from guests and the front desk.
            </p>
          </div>

          <button
            className="btn btn-gold"
            onClick={() => setShowForm(true)}
          >
            + New Request
          </button>
        </div>

        <div
          className="kpi-grid"
          style={{
            gridTemplateColumns: 'repeat(4, 1fr)',
            marginBottom: '22px'
          }}
        >
          <div className="kpi-card">
            <span
              className="lbl"
              style={{ color: 'var(--text-muted)' }}
            >
              TOTAL REQUESTS
            </span>

            <span
              className="val"
              style={{ color: 'var(--text-primary)' }}
            >
              {requests.length}
            </span>

            <span
              className="sub"
              style={{ color: 'var(--text-secondary)' }}
            >
              Today's requests
            </span>
          </div>

          <div className="kpi-card">
            <span
              className="lbl"
              style={{ color: 'var(--text-muted)' }}
            >
              PENDING
            </span>

            <span
              className="val"
              style={{ color: 'var(--text-primary)' }}
            >
              {pendingCount}
            </span>

            <span
              className="sub"
              style={{ color: 'var(--text-secondary)' }}
            >
              Waiting for action
            </span>
          </div>

          <div className="kpi-card">
            <span
              className="lbl"
              style={{ color: 'var(--text-muted)' }}
            >
              IN PROGRESS
            </span>

            <span
              className="val"
              style={{ color: 'var(--text-primary)' }}
            >
              {inProgressCount}
            </span>

            <span
              className="sub"
              style={{ color: 'var(--text-secondary)' }}
            >
              Currently being handled
            </span>
          </div>

          <div className="kpi-card">
            <span
              className="lbl"
              style={{ color: 'var(--text-muted)' }}
            >
              COMPLETED
            </span>

            <span
              className="val"
              style={{ color: 'var(--text-primary)' }}
            >
              {completedCount}
            </span>

            <span
              className="sub"
              style={{ color: 'var(--text-secondary)' }}
            >
              Finished requests
            </span>
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
              Request Queue
            </h3>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Room</th>
                  <th>Request</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="table-row-hover"
                  >
                    <td>
                      <strong
                        style={{
                          color: 'var(--text-primary)'
                        }}
                      >
                        {request.id}
                      </strong>
                    </td>

                    <td
                      style={{
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Room {request.room}
                    </td>

                    <td>
                      <strong
                        style={{
                          color: 'var(--text-primary)'
                        }}
                      >
                        {request.request}
                      </strong>

                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          marginTop: '3px'
                        }}
                      >
                        From: {request.requestedBy}
                      </div>
                    </td>

                    <td>
                      <span
                        className={
                          request.priority === 'High'
                            ? 'status-tag tag-danger'
                            : 'status-tag tag-neutral'
                        }
                      >
                        {request.priority}
                      </span>
                    </td>

                    <td>
                      <select
                        className="floor-dropdown"
                        value={request.assignedTo}
                        onChange={(e) =>
                          assignStaff(
                            request.id,
                            e.target.value
                          )
                        }
                        style={{
                          color: 'var(--text-primary)'
                        }}
                      >
                        <option value="">
                          Unassigned
                        </option>

                        <option>
                          Maria Santos
                        </option>

                        <option>
                          Rosa Villanueva
                        </option>

                        <option>
                          Elena Cruz
                        </option>

                        <option>
                          Carmen Diaz
                        </option>
                      </select>
                    </td>

                    <td
                      style={{
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {request.time}
                    </td>

                    <td>
                      <span
                        className={getStatusClass(request.status)}
                      >
                        {request.status}
                      </span>
                    </td>

                    <td>
                      {request.status === 'Pending' && (
                        <button
                          className="btn btn-xs btn-gold"
                          onClick={() =>
                            updateStatus(
                              request.id,
                              'In Progress'
                            )
                          }
                        >
                          Start
                        </button>
                      )}

                      {request.status === 'In Progress' && (
                        <button
                          className="btn btn-xs"
                          onClick={() =>
                            updateStatus(
                              request.id,
                              'Completed'
                            )
                          }
                        >
                          Complete
                        </button>
                      )}

                      {request.status === 'Completed' && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#79c996',
                            fontWeight: '700'
                          }}
                        >
                          Done
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                New Guest Request
              </h3>

              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '12px'
                }}
              >
                Record a new housekeeping request.
              </p>

              <form onSubmit={addRequest}>

                <div className="form-group">
                  <label>Room Number</label>

                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleChange}
                    placeholder="Example: 203"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Request</label>

                  <input
                    type="text"
                    name="request"
                    value={formData.request}
                    onChange={handleChange}
                    placeholder="Example: Extra towels"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>

                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option>Normal</option>
                    <option>High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Assign To</label>

                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                  >
                    <option value="">
                      Unassigned
                    </option>

                    <option>Maria Santos</option>
                    <option>Rosa Villanueva</option>
                    <option>Elena Cruz</option>
                    <option>Carmen Diaz</option>
                  </select>
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
                    Create Request
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

export default GuestRequests;