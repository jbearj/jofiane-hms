import React, { useState } from 'react';

const CleaningTasks = () => {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      room: '101',
      task: 'Room Cleaning',
      assignedTo: 'Maria Santos',
      priority: 'High',
      status: 'Pending'
    },
    {
      id: 2,
      room: '205',
      task: 'Change Bed Sheets',
      assignedTo: 'Ana Cruz',
      priority: 'Medium',
      status: 'In Progress'
    },
    {
      id: 3,
      room: '310',
      task: 'Bathroom Cleaning',
      assignedTo: 'Liza Fernandez',
      priority: 'Low',
      status: 'Completed'
    }
  ]);

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    room: '',
    task: '',
    assignedTo: '',
    priority: 'Medium'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newTask = {
      id: tasks.length + 1,
      room: formData.room,
      task: formData.task,
      assignedTo: formData.assignedTo,
      priority: formData.priority,
      status: 'Pending'
    };

    setTasks([...tasks, newTask]);

    setFormData({
      room: '',
      task: '',
      assignedTo: '',
      priority: 'Medium'
    });

    setShowForm(false);
  };

  const updateStatus = (id, status) => {
    setTasks(
      tasks.map((task) =>
        task.id === id
          ? { ...task, status: status }
          : task
      )
    );
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

  const totalTasks = tasks.length;

  const pendingTasks = tasks.filter(
    (task) => task.status === 'Pending'
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === 'In Progress'
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === 'Completed'
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
            Cleaning Tasks
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}
          >
            Manage and monitor housekeeping cleaning tasks.
          </p>
        </div>

        <button
          className="btn btn-gold"
          onClick={() => setShowForm(true)}
        >
          + Add Cleaning Task
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
            TOTAL TASKS
          </span>

          <span
            className="val"
            style={{ color: 'var(--text-primary)' }}
          >
            {totalTasks}
          </span>

          <span
            className="sub"
            style={{ color: 'var(--text-secondary)' }}
          >
            Housekeeping assignments
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
            {pendingTasks}
          </span>

          <span
            className="sub"
            style={{ color: 'var(--text-secondary)' }}
          >
            Waiting to be started
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
            {inProgressTasks}
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
            {completedTasks}
          </span>

          <span
            className="sub"
            style={{ color: 'var(--text-secondary)' }}
          >
            Finished cleaning tasks
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
            Cleaning Task List
          </h3>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Room</th>
                <th>Task</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="table-row-hover"
                >
                  <td>
                    <strong
                      style={{
                        color: 'var(--text-primary)'
                      }}
                    >
                      Room {task.room}
                    </strong>
                  </td>

                  <td
                    style={{
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {task.task}
                  </td>

                  <td
                    style={{
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {task.assignedTo}
                  </td>

                  <td>
                    <span
                      className={getPriorityClass(task.priority)}
                    >
                      {task.priority}
                    </span>
                  </td>

                  <td>
                    <span
                      className={getStatusClass(task.status)}
                    >
                      {task.status}
                    </span>
                  </td>

                  <td>
                    {task.status !== 'Completed' ? (
                      <button
                        className="btn btn-xs btn-gold"
                        onClick={() =>
                          updateStatus(
                            task.id,
                            'Completed'
                          )
                        }
                      >
                        Complete
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#79c996'
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
                marginBottom: '6px',
                color: 'var(--text-primary)'
              }}
            >
              Add Cleaning Task
            </h3>

            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginBottom: '20px'
              }}
            >
              Create a new housekeeping cleaning assignment.
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
                <label>Cleaning Task</label>

                <input
                  type="text"
                  name="task"
                  value={formData.task}
                  onChange={handleChange}
                  placeholder="Example: Room Cleaning"
                  required
                />
              </div>

              <div className="form-group">
                <label>Assigned To</label>

                <input
                  type="text"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  placeholder="Employee name"
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
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};

export default CleaningTasks;