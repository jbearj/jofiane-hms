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

  return (
    <div style={styles.page}>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Cleaning Tasks</h1>
          <p style={styles.subtitle}>
            Manage and monitor housekeeping cleaning tasks.
          </p>
        </div>

        <button
          style={styles.addButton}
          onClick={() => setShowForm(true)}
        >
          + Add Cleaning Task
        </button>
      </div>

      <div style={styles.stats}>

        <div style={styles.statCard}>
          <div style={styles.statNumber}>
            {tasks.length}
          </div>
          <div style={styles.statLabel}>
            Total Tasks
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statNumber}>
            {tasks.filter((task) => task.status === 'Pending').length}
          </div>
          <div style={styles.statLabel}>
            Pending
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statNumber}>
            {tasks.filter((task) => task.status === 'In Progress').length}
          </div>
          <div style={styles.statLabel}>
            In Progress
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statNumber}>
            {tasks.filter((task) => task.status === 'Completed').length}
          </div>
          <div style={styles.statLabel}>
            Completed
          </div>
        </div>

      </div>

      <div style={styles.tableCard}>

        <div style={styles.tableHeader}>
          <h2 style={styles.sectionTitle}>
            Cleaning Task List
          </h2>
        </div>

        <div style={styles.tableWrapper}>

          <table style={styles.table}>

            <thead>
              <tr>
                <th style={styles.th}>Room</th>
                <th style={styles.th}>Task</th>
                <th style={styles.th}>Assigned To</th>
                <th style={styles.th}>Priority</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>

            <tbody>

              {tasks.map((task) => (

                <tr key={task.id}>

                  <td style={styles.td}>
                    <strong style={styles.roomText}>
                      Room {task.room}
                    </strong>
                  </td>

                  <td style={styles.td}>
                    {task.task}
                  </td>

                  <td style={styles.td}>
                    {task.assignedTo}
                  </td>

                  <td style={styles.td}>
                    <span style={getPriorityStyle(task.priority)}>
                      {task.priority}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <span style={getStatusStyle(task.status)}>
                      {task.status}
                    </span>
                  </td>

                  <td style={styles.td}>

                    {task.status !== 'Completed' && (
                      <button
                        style={styles.completeButton}
                        onClick={() =>
                          updateStatus(task.id, 'Completed')
                        }
                      >
                        Complete
                      </button>
                    )}

                    {task.status === 'Completed' && (
                      <span style={styles.doneText}>
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

        <div style={styles.modalOverlay}>

          <div style={styles.modal}>

            <h2 style={styles.modalTitle}>
              Add Cleaning Task
            </h2>

            <form onSubmit={handleSubmit}>

              <label style={styles.label}>
                Room Number
              </label>

              <input
                type="text"
                name="room"
                value={formData.room}
                onChange={handleChange}
                placeholder="Example: 205"
                required
                style={styles.input}
              />

              <label style={styles.label}>
                Cleaning Task
              </label>

              <input
                type="text"
                name="task"
                value={formData.task}
                onChange={handleChange}
                placeholder="Example: Room Cleaning"
                required
                style={styles.input}
              />

              <label style={styles.label}>
                Assigned To
              </label>

              <input
                type="text"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                placeholder="Employee name"
                required
                style={styles.input}
              />

              <label style={styles.label}>
                Priority
              </label>

              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>

              <div style={styles.modalButtons}>

                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={styles.submitButton}
                >
                  Add Task
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

const getPriorityStyle = (priority) => {

  if (priority === 'High') {
    return {
      ...styles.badge,
      background: '#fde4e4',
      color: '#c62828'
    };
  }

  if (priority === 'Medium') {
    return {
      ...styles.badge,
      background: '#fff1c9',
      color: '#9a7415'
    };
  }

  return {
    ...styles.badge,
    background: '#dff5e8',
    color: '#247a4b'
  };
};

const getStatusStyle = (status) => {

  if (status === 'Completed') {
    return {
      ...styles.badge,
      background: '#dff5e8',
      color: '#247a4b'
    };
  }

  if (status === 'In Progress') {
    return {
      ...styles.badge,
      background: '#e1ecff',
      color: '#3267b1'
    };
  }

  return {
    ...styles.badge,
    background: '#fff1c9',
    color: '#9a7415'
  };
};

const styles = {

  page: {
    padding: '30px',
    color: '#332720',
    minHeight: '100%',
    boxSizing: 'border-box'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px'
  },

  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: '#2f241e'
  },

  subtitle: {
    marginTop: '6px',
    color: '#766b63',
    fontSize: '14px'
  },

  addButton: {
    padding: '12px 18px',
    border: 'none',
    borderRadius: '9px',
    background: '#c9a84c',
    color: '#2f241e',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(80, 55, 25, 0.15)'
  },

  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '15px',
    marginBottom: '25px'
  },

  statCard: {
    background: 'rgba(255, 253, 249, 0.96)',
    border: '1px solid #e6dbce',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 5px 18px rgba(70, 45, 25, 0.08)'
  },

  statNumber: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#b38b2f'
  },

  statLabel: {
    marginTop: '5px',
    color: '#766b63',
    fontSize: '13px'
  },

  tableCard: {
    background: 'rgba(255, 253, 249, 0.97)',
    border: '1px solid #e6dbce',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 6px 20px rgba(70, 45, 25, 0.08)'
  },

  tableHeader: {
    padding: '20px',
    borderBottom: '1px solid #eadfd3',
    background: '#fffaf3'
  },

  sectionTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#332720',
    fontWeight: '700'
  },

  tableWrapper: {
    overflowX: 'auto'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },

  th: {
    textAlign: 'left',
    padding: '14px 20px',
    color: '#9b7625',
    background: '#f7f0e6',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  td: {
    padding: '16px 20px',
    borderTop: '1px solid #eee5db',
    fontSize: '13px',
    color: '#4b4039',
    background: 'rgba(255, 253, 249, 0.92)'
  },

  roomText: {
    color: '#332720'
  },

  badge: {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700'
  },

  completeButton: {
    padding: '8px 13px',
    border: 'none',
    borderRadius: '7px',
    background: '#c9a84c',
    color: '#2f241e',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer'
  },

  doneText: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#247a4b'
  },

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(35, 25, 18, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },

  modal: {
    width: '420px',
    background: '#fffaf4',
    borderRadius: '16px',
    padding: '25px',
    border: '1px solid #e5d6c5',
    boxShadow: '0 20px 50px rgba(40, 25, 15, 0.25)'
  },

  modalTitle: {
    marginTop: 0,
    marginBottom: '20px',
    color: '#332720',
    fontSize: '20px'
  },

  label: {
    display: 'block',
    marginBottom: '6px',
    marginTop: '14px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6f5a49'
  },

  input: {
    width: '100%',
    padding: '11px',
    boxSizing: 'border-box',
    borderRadius: '7px',
    border: '1px solid #d9cbbb',
    background: '#ffffff',
    color: '#332720',
    outline: 'none',
    fontSize: '13px'
  },

  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px'
  },

  cancelButton: {
    padding: '10px 15px',
    borderRadius: '7px',
    border: '1px solid #d8cbbb',
    background: '#ffffff',
    color: '#5d5148',
    cursor: 'pointer'
  },

  submitButton: {
    padding: '10px 15px',
    borderRadius: '7px',
    border: 'none',
    background: '#c9a84c',
    color: '#2f241e',
    fontWeight: '700',
    cursor: 'pointer'
  }
};

export default CleaningTasks;