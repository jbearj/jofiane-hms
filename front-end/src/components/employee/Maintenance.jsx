import React, { useState } from 'react';

const Maintenance = () => {
  const [showForm, setShowForm] = useState(false);

  const [requests, setRequests] = useState([
    {
      id: 1,
      room: '101',
      issue: 'Air conditioner not working',
      priority: 'High',
      reportedBy: 'Liza Fernandez',
      status: 'Pending',
      date: 'Aug 18, 2026'
    },
    {
      id: 2,
      room: '205',
      issue: 'Bathroom light is broken',
      priority: 'Medium',
      reportedBy: 'Maria Santos',
      status: 'In Progress',
      date: 'Aug 18, 2026'
    },
    {
      id: 3,
      room: '310',
      issue: 'Leaking faucet',
      priority: 'High',
      reportedBy: 'Liza Fernandez',
      status: 'Completed',
      date: 'Aug 17, 2026'
    }
  ]);

  const [formData, setFormData] = useState({
    room: '',
    issue: '',
    priority: 'Medium',
    description: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newRequest = {
      id: requests.length + 1,
      room: formData.room,
      issue: formData.issue,
      priority: formData.priority,
      reportedBy: 'Current Employee',
      status: 'Pending',
      date: new Date().toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }
      )
    };

    setRequests([...requests, newRequest]);

    setFormData({
      room: '',
      issue: '',
      priority: 'Medium',
      description: ''
    });

    setShowForm(false);
  };

  const getPriorityClass = (priority) => {
    if (priority === 'High') {
      return 'status-tag tag-danger';
    }

    if (priority === 'Medium') {
      return 'status-tag tag-warning';
    }

    return 'status-tag tag-success';
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

  const totalRequests = requests.length;

  const pendingRequests = requests.filter(
    (item) => item.status === 'Pending'
  ).length;

  const inProgressRequests = requests.filter(
    (item) => item.status === 'In Progress'
  ).length;

  const completedRequests = requests.filter(
    (item) => item.status === 'Completed'
  ).length;

  return (
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
            Maintenance Requests
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}
          >
            Report and monitor room maintenance issues.
          </p>
        </div>

        <button
          className="btn btn-gold"
          onClick={() => setShowForm(true)}
        >
          + Report Maintenance
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
            {totalRequests}
          </span>

          <span
            className="sub"
            style={{ color: 'var(--text-secondary)' }}
          >
            Maintenance reports
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
            {pendingRequests}
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
            {inProgressRequests}
          </span>

          <span
            className="sub"
            style={{ color: 'var(--text-secondary)' }}
          >
            Currently being repaired
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
            {completedRequests}
          </span>

          <span
            className="sub"
            style={{ color: 'var(--text-secondary)' }}
          >
            Resolved requests
          </span>
        </div>
      </div>

      <div
        className="panel"
        style={{
          padding: 0,
          overflow: 'hidden'
        }}
      >
        <div
          className="panel-header"
          style={{
            padding: '20px 24px',
            margin: 0,
            borderBottom: '1px solid var(--border-light)'
          }}
        >
          <h3
            style={{
              margin: 0,
              color: 'var(--text-primary)'
            }}
          >
            Maintenance Requests
          </h3>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Room</th>
                <th>Issue</th>
                <th>Priority</th>
                <th>Reported By</th>
                <th>Status</th>
                <th>Date</th>
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
                      Room {request.room}
                    </strong>
                  </td>

                  <td
                    style={{
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {request.issue}
                  </td>

                  <td>
                    <span
                      className={getPriorityClass(request.priority)}
                    >
                      {request.priority}
                    </span>
                  </td>

                  <td
                    style={{
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {request.reportedBy}
                  </td>

                  <td>
                    <span
                      className={getStatusClass(request.status)}
                    >
                      {request.status}
                    </span>
                  </td>

                  <td
                    style={{
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {request.date}
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
                marginBottom: '6px',
                color: 'var(--text-primary)'
              }}
            >
              Report Maintenance
            </h3>

            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginBottom: '20px'
              }}
            >
              Record a room maintenance issue.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Room Number</label>

                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  placeholder="Example: 205"
                  required
                />
              </div>

              <div className="form-group">
                <label>Issue</label>

                <input
                  type="text"
                  name="issue"
                  value={formData.issue}
                  onChange={handleChange}
                  placeholder="Example: Aircon not working"
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
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the problem..."
                  style={{ minHeight: '90px' }}
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
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};

export default Maintenance;