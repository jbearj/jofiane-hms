import React, { useState } from 'react';

function HousekeepingDashboard({ employee, setActiveTab }) {
  const [todayDate] = useState(
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  );

  const [rooms] = useState([
    {
      id: 1,
      room: '102',
      type: 'Standard',
      status: 'Dirty',
      assignedTo: 'Maria Santos',
      priority: true,
      note: 'Checkout at 11 AM - Arrival at 2 PM'
    },
    {
      id: 2,
      room: '103',
      type: 'Deluxe',
      status: 'In Progress',
      assignedTo: 'Rosa Villanueva',
      priority: false,
      note: ''
    },
    {
      id: 3,
      room: '104',
      type: 'Standard',
      status: 'Inspected',
      assignedTo: 'Maria Santos',
      priority: false,
      note: ''
    },
    {
      id: 4,
      room: '201',
      type: 'Deluxe',
      status: 'Dirty',
      assignedTo: 'Rosa Villanueva',
      priority: true,
      note: 'VIP arrival at 1 PM'
    },
    {
      id: 5,
      room: '202',
      type: 'Deluxe',
      status: 'Clean',
      assignedTo: 'Rosa Villanueva',
      priority: false,
      note: ''
    },
    {
      id: 6,
      room: '203',
      type: 'Premium',
      status: 'Dirty',
      assignedTo: 'Elena Cruz',
      priority: false,
      note: 'Guest requested no cleaning today'
    },
    {
      id: 7,
      room: '204',
      type: 'Premium',
      status: 'In Progress',
      assignedTo: 'Elena Cruz',
      priority: true,
      note: 'Express turnover needed'
    },
    {
      id: 8,
      room: '301',
      type: 'Suite',
      status: 'Clean',
      assignedTo: 'Carmen Diaz',
      priority: false,
      note: ''
    },
    {
      id: 9,
      room: '302',
      type: 'Suite',
      status: 'Dirty',
      assignedTo: 'Carmen Diaz',
      priority: false,
      note: ''
    },
    {
      id: 10,
      room: '303',
      type: 'Premium',
      status: 'Inspected',
      assignedTo: 'Elena Cruz',
      priority: false,
      note: ''
    },
    {
      id: 11,
      room: '304',
      type: 'Suite',
      status: 'Dirty',
      assignedTo: 'Carmen Diaz',
      priority: true,
      note: 'Checkout + VIP check-in at 3 PM'
    },
    {
      id: 12,
      room: '401',
      type: 'Presidential',
      status: 'Clean',
      assignedTo: 'Carmen Diaz',
      priority: false,
      note: ''
    },
    {
      id: 13,
      room: '402',
      type: 'Presidential',
      status: 'In Progress',
      assignedTo: 'Rosa Villanueva',
      priority: false,
      note: 'Deep clean scheduled'
    }
  ]);

  const [tasks] = useState([
    {
      id: 1,
      room: '102',
      task: 'Room Cleaning',
      assignedTo: 'Maria Santos',
      status: 'Pending'
    },
    {
      id: 2,
      room: '204',
      task: 'Express Turnover',
      assignedTo: 'Elena Cruz',
      status: 'In Progress'
    },
    {
      id: 3,
      room: '402',
      task: 'Deep Cleaning',
      assignedTo: 'Rosa Villanueva',
      status: 'In Progress'
    }
  ]);

  const [requests] = useState([
    {
      id: 'REQ-001',
      room: '203',
      request: 'Extra Towels',
      status: 'Pending'
    },
    {
      id: 'REQ-002',
      room: '304',
      request: 'Extra Pillows',
      status: 'In Progress'
    },
    {
      id: 'REQ-003',
      room: '115',
      request: 'Toiletries Refill',
      status: 'Pending'
    }
  ]);

  const [activities] = useState([
    {
      id: 1,
      text: 'Room 103 cleaning started',
      time: '10:30 AM'
    },
    {
      id: 2,
      text: 'Room 104 marked as inspected',
      time: '10:10 AM'
    },
    {
      id: 3,
      text: 'Maintenance request submitted for Room 201',
      time: '09:45 AM'
    },
    {
      id: 4,
      text: 'Room 202 marked clean',
      time: '09:20 AM'
    }
  ]);

  const dirtyRooms = rooms.filter(
    (room) => room.status === 'Dirty'
  ).length;

  const inProgressRooms = rooms.filter(
    (room) => room.status === 'In Progress'
  ).length;

  const readyRooms = rooms.filter(
    (room) =>
      room.status === 'Clean' ||
      room.status === 'Inspected'
  ).length;

  const priorityRooms = rooms.filter(
    (room) => room.priority
  );

  const completedRooms = readyRooms;

  const progress =
    rooms.length > 0
      ? Math.round((completedRooms / rooms.length) * 100)
      : 0;

  const pendingRequests = requests.filter(
    (request) => request.status !== 'Completed'
  ).length;

  const getStatusStyle = (status) => {
    if (status === 'Clean') {
      return {
        background: '#d1fae5',
        color: '#065f46'
      };
    }

    if (status === 'Inspected') {
      return {
        background: '#dbeafe',
        color: '#1e40af'
      };
    }

    if (status === 'Dirty') {
      return {
        background: '#fee2e2',
        color: '#991b1b'
      };
    }

    return {
      background: '#fef3c7',
      color: '#92400e'
    };
  };

  return (
    <main className="main-content employee-content">
      <section className="admin-tab-content active">

        {/* Page Header */}
        <div className="employee-dashboard-header" style={{ marginBottom: '32px' }}>
          <div>
            <span className="eyebrow">Housekeeping Operations</span>

            <h2
              style={{
                fontSize: '30px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: '0 0 6px 0'
              }}
            >
              Good day, {employee?.name?.split(' ')[0] || 'there'}
            </h2>

            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
              {todayDate}
            </p>
          </div>

          <div className="shift-status" aria-label="Current shift status">
            <span className="shift-status-dot" />
            <span>
              <strong>Morning shift</strong>
              <small>06:00 – 14:00</small>
            </span>
          </div>
        </div>

        <div
          className="kpi-grid"
          style={{
            gridTemplateColumns: 'repeat(4, 1fr)',
            marginBottom: '22px'
          }}
        >

          <div
            className="kpi-card"
            onClick={() => setActiveTab('housekeeping')}
            style={{ cursor: 'pointer' }}
          >
            <span className="lbl" style={{ color: 'var(--text-muted)' }}>
              DIRTY ROOMS
            </span>

            <span className="val" style={{ color: 'var(--text-primary)' }}>
              {dirtyRooms}
            </span>

            <span className="sub" style={{ color: 'var(--text-secondary)' }}>
              Waiting for cleaning
            </span>
          </div>

          <div
            className="kpi-card"
            onClick={() => setActiveTab('housekeeping')}
            style={{ cursor: 'pointer' }}
          >
            <span className="lbl" style={{ color: 'var(--text-muted)' }}>
              IN PROGRESS
            </span>

            <span className="val" style={{ color: 'var(--text-primary)' }}>
              {inProgressRooms}
            </span>

            <span className="sub" style={{ color: 'var(--text-secondary)' }}>
              Currently being cleaned
            </span>
          </div>

          <div
            className="kpi-card"
            onClick={() => setActiveTab('housekeeping')}
            style={{ cursor: 'pointer' }}
          >
            <span className="lbl" style={{ color: 'var(--text-muted)' }}>
              READY / CLEAN
            </span>

            <span className="val" style={{ color: 'var(--text-primary)' }}>
              {readyRooms}
            </span>

            <span className="sub" style={{ color: 'var(--text-secondary)' }}>
              Clean or inspected rooms
            </span>
          </div>

          <div
            className="kpi-card"
            onClick={() => setActiveTab('guest-requests')}
            style={{ cursor: 'pointer' }}
          >
            <span className="lbl" style={{ color: 'var(--text-muted)' }}>
              GUEST REQUESTS
            </span>

            <span className="val" style={{ color: 'var(--text-primary)' }}>
              {pendingRequests}
            </span>

            <span className="sub" style={{ color: 'var(--text-secondary)' }}>
              Pending requests
            </span>
          </div>

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
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}
          >
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                Today's Progress
              </h3>

              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '4px'
                }}
              >
                Rooms ready for guests
              </p>
            </div>

            <strong
              style={{
                fontSize: '22px',
                color: 'var(--gold-light)'
              }}
            >
              {progress}%
            </strong>
          </div>

          <div
            style={{
              width: '100%',
              height: '10px',
              background: 'var(--bg-input)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--gold)',
                borderRadius: '10px'
              }}
            />
          </div>

          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginTop: '8px'
            }}
          >
            {completedRooms} of {rooms.length} rooms ready
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '22px',
            marginBottom: '22px'
          }}
        >

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3 style={{ color: 'var(--text-primary)' }}>Priority Rooms</h3>
                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)'
                  }}
                >
                  Rooms that require immediate attention
                </p>
              </div>

              <button
                className="btn btn-sm"
                onClick={() => setActiveTab('housekeeping')}
              >
                View Rooms
              </button>
            </div>

            <div>
              {priorityRooms.map((room) => (
                <div
                  key={room.id}
                  style={{
                    padding: '14px 0',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '15px'
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      Room {room.room}
                    </strong>

                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginTop: '4px'
                      }}
                    >
                      {room.note}
                    </div>
                  </div>

                  <span
                    style={{
                      ...getStatusStyle(room.status),
                      padding: '4px 9px',
                      fontSize: '10px',
                      fontWeight: '700',
                      borderRadius: '20px',
                      height: 'fit-content'
                    }}
                  >
                    {room.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3 style={{ color: 'var(--text-primary)' }}>Cleaning Tasks</h3>

                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)'
                  }}
                >
                  Current housekeeping assignments
                </p>
              </div>

              <button
                className="btn btn-sm"
                onClick={() => setActiveTab('cleaning-tasks')}
              >
                View Tasks
              </button>
            </div>

            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '14px 0',
                  borderBottom: '1px solid var(--border-light)'
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    Room {task.room}
                  </strong>

                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: '3px'
                    }}
                  >
                    {task.task}
                  </div>

                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      marginTop: '3px'
                    }}
                  >
                    {task.assignedTo}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color:
                      task.status === 'Pending'
                        ? '#e7be58'
                        : '#7fa8ff'
                  }}
                >
                  {task.status}
                </span>
              </div>
            ))}
          </div>

        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '22px'
          }}
        >

          <div className="panel">
            <div className="panel-header">
              <h3 style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px'
              }}
            >
              <button
                className="btn"
                onClick={() => setActiveTab('housekeeping')}
              >
                Room Status
              </button>

              <button
                className="btn"
                onClick={() => setActiveTab('cleaning-tasks')}
              >
                Cleaning Tasks
              </button>

              <button
                className="btn"
                onClick={() => setActiveTab('guest-requests')}
              >
                Guest Requests
              </button>

              <button
                className="btn"
                onClick={() => setActiveTab('maintenance')}
              >
                Maintenance
              </button>

              <button
                className="btn"
                onClick={() => setActiveTab('lost-found')}
              >
                Lost & Found
              </button>

              <button
                className="btn"
                onClick={() => setActiveTab('housekeeping-logs')}
              >
                Shift Log
              </button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3 style={{ color: 'var(--text-primary)' }}>Recent Housekeeping Activity</h3>

              <button
                className="btn btn-sm"
                onClick={() => setActiveTab('housekeeping-logs')}
              >
                Open Log
              </button>
            </div>

            {activities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border-light)'
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}
                >
                  {activity.text}
                </div>

                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginTop: '4px'
                  }}
                >
                  {activity.time}
                </div>
              </div>
            ))}
          </div>

        </div>

      </section>
    </main>
  );
}

export default HousekeepingDashboard;