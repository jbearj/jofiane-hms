import React, { useState } from 'react';

function Rooms() {
  const [amenities, setAmenities] = useState([
    'High-Speed Wi-Fi',
    'Mini Bar',
    'Private Balcony',
    'King Size Bed',
    'Smart TV',
  ]);
  const [newAmenity, setNewAmenity] = useState('');

  const addAmenity = (e) => {
    if (e.key === 'Enter' && newAmenity.trim()) {
      e.preventDefault();
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity('');
    }
  };

  const removeAmenity = (index) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  return (
    <section className="admin-tab-content active">
      {/* UPDATED HEADER */}
      <div className="page-header">
        <div className="left">
          <h2>Room Operation</h2>
        </div>
        <div className="right">
          <button className="btn btn-sm btn-gold"><i className="fas fa-plus"></i> Add Room</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi-card">
          <span className="lbl"><i className="fas fa-hotel"></i> Total Units</span>
          <span className="val">48</span>
          <span className="sub">Across 4 room types</span>
        </div>
        <div className="kpi-card">
          <span className="lbl"><i className="fas fa-check-circle"></i> Available Units</span>
          <span className="val">9</span>
          <span className="sub">Ready for check-in</span>
        </div>
        <div className="kpi-card">
          <span className="lbl"><i className="fas fa-tools"></i> Out of Order</span>
          <span className="val">2</span>
          <span className="sub"><i className="fas fa-arrow-down trend-down"></i> Maintenance required</span>
        </div>
      </div>

      <div className="dashboard-split dashboard-split-13">
        <div className="panel">
          <div className="panel-header">
            <h3>Inventory Management</h3>
            <div className="panel-actions">
              <button className="btn btn-sm"><i className="fas fa-filter"></i> Filter</button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 0 }}>Room / Type</th>
                  <th>Rate / Services</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="table-row-hover">
                  <td style={{ paddingLeft: 0 }}>
                    <span className="guest-name">101</span>
                    <span className="guest-sub">Veranda Suite</span>
                  </td>
                  <td>
                    <span className="std-text">₱4,900/nt</span>
                    <span className="guest-sub">4 services</span>
                  </td>
                  <td><span className="status-tag tag-danger">Occupied</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-links" style={{ justifyContent: 'flex-end' }}>
                      <span className="action-link link-edit">Edit</span>
                      <span className="action-link link-delete">Del</span>
                    </div>
                  </td>
                </tr>
                <tr className="table-row-hover">
                  <td style={{ paddingLeft: 0 }}>
                    <span className="guest-name">102</span>
                    <span className="guest-sub">Garden Room</span>
                  </td>
                  <td>
                    <span className="std-text">₱3,200/nt</span>
                    <span className="guest-sub">2 services</span>
                  </td>
                  <td><span className="status-tag tag-success">Vacant</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-links" style={{ justifyContent: 'flex-end' }}>
                      <span className="action-link link-edit">Edit</span>
                      <span className="action-link link-delete">Del</span>
                    </div>
                  </td>
                </tr>
                <tr className="table-row-hover">
                  <td style={{ paddingLeft: 0 }}>
                    <span className="guest-name">106</span>
                    <span className="guest-sub">Amber Loft</span>
                  </td>
                  <td>
                    <span className="std-text">₱6,300/nt</span>
                    <span className="guest-sub">All services</span>
                  </td>
                  <td><span className="status-tag tag-neutral">Maintenance</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-links" style={{ justifyContent: 'flex-end' }}>
                      <span className="action-link link-edit">Edit</span>
                      <span className="action-link link-delete">Del</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header" style={{ marginBottom: 12 }}>
            <h3>Room Details</h3>
            <span className="text-muted" style={{ fontSize: 11 }}>#101</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>
            Update unit information, amenities, and services.
          </p>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-grid" style={{ marginTop: 0 }}>
              <div className="form-group" style={{ marginTop: 0 }}>
                <label>Room Number</label>
                <input type="text" defaultValue="101" />
              </div>
              <div className="form-group" style={{ marginTop: 0 }}>
                <label>Room Type</label>
                <select>
                  <option>Garden Room</option>
                  <option selected>Veranda Suite</option>
                  <option>Amber Loft</option>
                  <option>Presidential Suite</option>
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group" style={{ marginTop: 0 }}>
                <label>Current Status</label>
                <select>
                  <option>Vacant</option>
                  <option selected>Occupied</option>
                  <option>Cleaning</option>
                  <option>Maintenance</option>
                </select>
              </div>
              <div className="form-group" style={{ marginTop: 0 }}>
                <label>Base Rate (₱)</label>
                <input type="number" defaultValue="4900" />
              </div>
            </div>

            <div className="form-group">
              <label>Room Amenities</label>
              <div className="tag-input-container">
                {amenities.map((item, index) => (
                  <span key={index} className="amenity-tag">
                    {item} <span className="remove" onClick={() => removeAmenity(index)}>×</span>
                  </span>
                ))}
                <input
                  type="text"
                  className="amenity-input"
                  placeholder="+ Add amenity…"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={addAmenity}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Included Services</label>
              <div className="service-list">
                <label className="service-item"><input type="checkbox" defaultChecked /> Daily Housekeeping</label>
                <label className="service-item"><input type="checkbox" defaultChecked /> 24/7 Room Service</label>
                <label className="service-item"><input type="checkbox" defaultChecked /> Wake-up Call</label>
                <label className="service-item"><input type="checkbox" /> Laundry &amp; Pressing</label>
                <label className="service-item"><input type="checkbox" defaultChecked /> Free Breakfast</label>
                <label className="service-item"><input type="checkbox" /> Airport Shuttle</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" className="btn" style={{ flex: 1 }}>Cancel</button>
              <button type="button" className="btn btn-gold" style={{ flex: 2 }}><i className="fas fa-save"></i> Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Rooms;