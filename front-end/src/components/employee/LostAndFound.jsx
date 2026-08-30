import React, { useState } from 'react';

function LostAndFound() {
  const [items, setItems] = useState([
    {
      id: 'LF-001',
      room: '304',
      item: 'Black Wallet',
      location: 'Under the bed',
      foundBy: 'Maria Santos',
      date: 'Aug 30, 2026',
      status: 'Stored',
      notes: 'Contains several cards.'
    },
    {
      id: 'LF-002',
      room: '201',
      item: 'Phone Charger',
      location: 'Beside the television',
      foundBy: 'Rosa Villanueva',
      date: 'Aug 30, 2026',
      status: 'Returned',
      notes: 'Returned to guest at front desk.'
    },
    {
      id: 'LF-003',
      room: '402',
      item: 'Silver Watch',
      location: 'Bathroom counter',
      foundBy: 'Elena Cruz',
      date: 'Aug 29, 2026',
      status: 'Unclaimed',
      notes: ''
    }
  ]);

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    room: '',
    item: '',
    location: '',
    foundBy: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const addItem = (e) => {
    e.preventDefault();

    const newItem = {
      id: `LF-${String(items.length + 1).padStart(3, '0')}`,
      room: formData.room,
      item: formData.item,
      location: formData.location,
      foundBy: formData.foundBy,
      date: new Date().toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }
      ),
      status: 'Found',
      notes: formData.notes
    };

    setItems([
      newItem,
      ...items
    ]);

    setFormData({
      room: '',
      item: '',
      location: '',
      foundBy: '',
      notes: ''
    });

    setShowForm(false);
  };

  const updateStatus = (id, newStatus) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              status: newStatus
            }
          : item
      )
    );
  };

  const deleteItem = (id) => {
    const confirmed = window.confirm(
      'Delete this Lost & Found record?'
    );

    if (!confirmed) {
      return;
    }

    setItems(
      items.filter((item) => item.id !== id)
    );
  };

  const getStatusClass = (status) => {
    if (status === 'Returned') {
      return 'status-tag tag-success';
    }

    if (status === 'Stored') {
      return 'status-tag tag-gold';
    }

    if (status === 'Unclaimed') {
      return 'status-tag tag-warning';
    }

    return 'status-tag tag-neutral';
  };

  const storedCount = items.filter(
    (item) => item.status === 'Stored'
  ).length;

  const returnedCount = items.filter(
    (item) => item.status === 'Returned'
  ).length;

  const unclaimedCount = items.filter(
    (item) =>
      item.status === 'Unclaimed' ||
      item.status === 'Found'
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
              Lost & Found
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--text-secondary)'
              }}
            >
              Record and track items found inside hotel rooms.
            </p>
          </div>

          <button
            className="btn btn-gold"
            onClick={() => setShowForm(true)}
          >
            + Report Found Item
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
              TOTAL ITEMS
            </span>

            <span
              className="val"
              style={{ color: 'var(--text-primary)' }}
            >
              {items.length}
            </span>

            <span
              className="sub"
              style={{ color: 'var(--text-secondary)' }}
            >
              Recorded items
            </span>
          </div>

          <div className="kpi-card">
            <span
              className="lbl"
              style={{ color: 'var(--text-muted)' }}
            >
              STORED
            </span>

            <span
              className="val"
              style={{ color: 'var(--text-primary)' }}
            >
              {storedCount}
            </span>

            <span
              className="sub"
              style={{ color: 'var(--text-secondary)' }}
            >
              In hotel storage
            </span>
          </div>

          <div className="kpi-card">
            <span
              className="lbl"
              style={{ color: 'var(--text-muted)' }}
            >
              UNCLAIMED
            </span>

            <span
              className="val"
              style={{ color: 'var(--text-primary)' }}
            >
              {unclaimedCount}
            </span>

            <span
              className="sub"
              style={{ color: 'var(--text-secondary)' }}
            >
              Waiting for owner
            </span>
          </div>

          <div className="kpi-card">
            <span
              className="lbl"
              style={{ color: 'var(--text-muted)' }}
            >
              RETURNED
            </span>

            <span
              className="val"
              style={{ color: 'var(--text-primary)' }}
            >
              {returnedCount}
            </span>

            <span
              className="sub"
              style={{ color: 'var(--text-secondary)' }}
            >
              Returned to guests
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
              Lost & Found Records
            </h3>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Room</th>
                  <th>Item</th>
                  <th>Found Location</th>
                  <th>Found By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="table-row-hover"
                  >
                    <td>
                      <strong
                        style={{
                          color: 'var(--text-primary)'
                        }}
                      >
                        {item.id}
                      </strong>
                    </td>

                    <td
                      style={{
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Room {item.room}
                    </td>

                    <td>
                      <strong
                        style={{
                          color: 'var(--text-primary)'
                        }}
                      >
                        {item.item}
                      </strong>

                      {item.notes && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginTop: '3px'
                          }}
                        >
                          {item.notes}
                        </div>
                      )}
                    </td>

                    <td
                      style={{
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {item.location}
                    </td>

                    <td
                      style={{
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {item.foundBy}
                    </td>

                    <td
                      style={{
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {item.date}
                    </td>

                    <td>
                      <span
                        className={getStatusClass(item.status)}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td>
                      <div
                        style={{
                          display: 'flex',
                          gap: '6px',
                          flexWrap: 'wrap'
                        }}
                      >
                        {item.status === 'Found' && (
                          <button
                            className="btn btn-xs"
                            onClick={() =>
                              updateStatus(
                                item.id,
                                'Stored'
                              )
                            }
                          >
                            Store
                          </button>
                        )}

                        {item.status !== 'Returned' && (
                          <button
                            className="btn btn-xs btn-gold"
                            onClick={() =>
                              updateStatus(
                                item.id,
                                'Returned'
                              )
                            }
                          >
                            Return
                          </button>
                        )}

                        <button
                          className="btn btn-xs"
                          onClick={() =>
                            deleteItem(item.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
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
                Report Found Item
              </h3>

              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)'
                }}
              >
                Record an item found during room cleaning.
              </p>

              <form onSubmit={addItem}>

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
                  <label>Item</label>

                  <input
                    type="text"
                    name="item"
                    value={formData.item}
                    onChange={handleChange}
                    placeholder="Example: Wallet"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Location Found</label>

                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Example: Under the bed"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Found By</label>

                  <select
                    name="foundBy"
                    value={formData.foundBy}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select Employee
                    </option>

                    <option>Maria Santos</option>
                    <option>Rosa Villanueva</option>
                    <option>Elena Cruz</option>
                    <option>Carmen Diaz</option>
                    <option>Liza Fernandez</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Notes</label>

                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Optional notes..."
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
                    Save Item
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

export default LostAndFound;
