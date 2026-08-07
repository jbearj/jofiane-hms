import React, { useState } from 'react';

const floorData = {
  1: [
    { number: '101', status: 'Vacant', dotClass: 'dot-vac', tagText: 'VAC' },
    { number: '102', status: 'Occupied', dotClass: 'dot-occ', tagText: 'OCC' },
    { number: '103', status: 'Cleaning', dotClass: 'dot-cln', tagText: 'CLN' },
    { number: '104', status: 'Occupied', dotClass: 'dot-occ', tagText: 'OCC' },
    { number: '105', status: 'Vacant', dotClass: 'dot-vac', tagText: 'VAC' },
    { number: '106', status: 'Maintenance', dotClass: 'dot-mnt', tagText: 'MNT' },
    { number: '107', status: 'Occupied', dotClass: 'dot-occ', tagText: 'OCC' },
    { number: '108', status: 'Vacant', dotClass: 'dot-vac', tagText: 'VAC' },
  ],
  2: [
    { number: '201', status: 'Occupied', dotClass: 'dot-occ', tagText: 'OCC' },
    { number: '202', status: 'Occupied', dotClass: 'dot-occ', tagText: 'OCC' },
    { number: '203', status: 'Vacant', dotClass: 'dot-vac', tagText: 'VAC' },
    { number: '204', status: 'Occupied', dotClass: 'dot-occ', tagText: 'OCC' },
    { number: '205', status: 'Cleaning', dotClass: 'dot-cln', tagText: 'CLN' },
    { number: '206', status: 'Vacant', dotClass: 'dot-vac', tagText: 'VAC' },
    { number: '207', status: 'Maintenance', dotClass: 'dot-mnt', tagText: 'MNT' },
    { number: '208', status: 'Vacant', dotClass: 'dot-vac', tagText: 'VAC' },
  ],
  3: [
    { number: '301', status: 'Vacant', dotClass: 'dot-vac', tagText: 'VAC' },
    { number: '302', status: 'Vacant', dotClass: 'dot-vac', tagText: 'VAC' },
    { number: '303', status: 'Vacant', dotClass: 'dot-vac', tagText: 'VAC' },
    { number: '304', status: 'Cleaning', dotClass: 'dot-cln', tagText: 'CLN' },
    { number: '305', status: 'Occupied', dotClass: 'dot-occ', tagText: 'OCC' },
    { number: '306', status: 'Occupied', dotClass: 'dot-occ', tagText: 'OCC' },
    { number: '307', status: 'Occupied', dotClass: 'dot-occ', tagText: 'OCC' },
    { number: '308', status: 'Vacant', dotClass: 'dot-vac', tagText: 'VAC' },
  ]
};

function Overview({ setActiveTab }) {
  const [currentFloor, setCurrentFloor] = useState(1);
  const [calView, setCalView] = useState('Month');
  const [notes, setNotes] = useState("• Prepare VIP welcome basket for Fam. Villanueva (Rm 308) upon arrival.\n• Room 106 maintenance window is scheduled for 2:00 PM to 4:00 PM today.\n• Reminder: Shift handover meeting at 1:45 PM.");

  return (
    <section className="admin-tab-content active">
      <div className="page-header">
        <div className="left">
          <h2>Overview</h2>
        </div>
        <div className="right">
          <span className="date-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px', color: 'var(--gold)'}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Aug 7, 2026
          </span>
          <button className="btn btn-sm btn-outline-gold">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="overview-wrapper">
        
        {/* =======================================
            LEFT COLUMN (Fluid Width)
            ======================================= */}
        <div className="overview-main">
          
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="lbl">Occupancy</span>
              <span className="val">82%</span>
              <span className="sub"><span className="trend-up" style={{fontWeight: 'bold'}}>↑</span> 6% vs last week</span>
            </div>
            <div className="kpi-card">
              <span className="lbl">Revenue Today</span>
              <span className="val">₱96,400</span>
              <span className="sub"><span className="trend-up" style={{fontWeight: 'bold'}}>↑</span> 12% vs yesterday</span>
            </div>
            <div className="kpi-card">
              <span className="lbl">Rooms Available</span>
              <span className="val">9 / 48</span>
              <span className="sub"><span className="trend-down" style={{fontWeight: 'bold'}}>↓</span> 3 since 9am</span>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Recent Reservations</h3>
              <div className="panel-actions">
                <button className="btn btn-sm" onClick={() => setActiveTab('payments')}>View All</button>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 0 }}>Guest</th>
                    <th>Room</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="table-row-hover">
                    <td style={{ paddingLeft: 0 }}>
                      <span className="guest-name">Marisol Reyes</span>
                      <span className="guest-sub">Veranda Suite</span>
                    </td>
                    <td><span className="std-text">204</span></td>
                    <td><span className="std-text">Aug 6 – Aug 9</span></td>
                    <td><span className="status-tag tag-success">Checked In</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₱14,700</td>
                  </tr>
                  <tr className="table-row-hover">
                    <td style={{ paddingLeft: 0 }}>
                      <span className="guest-name">Daniel Kho</span>
                      <span className="guest-sub">Garden Room</span>
                    </td>
                    <td><span className="std-text">112</span></td>
                    <td><span className="std-text">Aug 6 – Aug 7</span></td>
                    <td><span className="status-tag tag-warning">Arriving</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₱4,200</td>
                  </tr>
                  <tr className="table-row-hover">
                    <td style={{ paddingLeft: 0 }}>
                      <span className="guest-name">Fam. Villanueva</span>
                      <span className="guest-sub">Amber Loft</span>
                    </td>
                    <td><span className="std-text">308</span></td>
                    <td><span className="std-text">Aug 5 – Aug 10</span></td>
                    <td><span className="status-tag tag-success">Checked In</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₱31,500</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h3>Floor Status</h3>
                <select value={currentFloor} onChange={(e) => setCurrentFloor(Number(e.target.value))} className="floor-dropdown">
                  {Object.keys(floorData).map(floorNum => (
                    <option key={floorNum} value={floorNum}>Floor {floorNum}</option>
                  ))}
                </select>
              </div>
              <span className="text-muted" style={{ fontSize: 11, fontWeight: 500 }}>{floorData[currentFloor].length} rooms</span>
            </div>
            
            <div className="room-grid">
              {floorData[currentFloor].map((room) => (
                <div className="room-box" key={room.number}>
                  <span className="r-num">{room.number}</span>
                  <div className="r-stat">
                    <span className={`dot ${room.dotClass}`}></span> {room.tagText}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =======================================
            RIGHT COLUMN (Adjustable / Resizable)
            ======================================= */}
        <div className="overview-sidebar resizer-wrapper">
          <div className="sidebar-content-reset">
            
            <div className="panel calendar-panel">
              <div className="panel-header cal-header-wrap" style={{ marginBottom: '15px', flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3>Booking Calendar</h3>
                  <div className="cal-view-toggles">
                    <button className={calView === 'Month' ? 'active' : ''} onClick={() => setCalView('Month')}>Month</button>
                    <button className={calView === 'Week' ? 'active' : ''} onClick={() => setCalView('Week')}>Week</button>
                    <button className={calView === 'Day' ? 'active' : ''} onClick={() => setCalView('Day')}>Day</button>
                  </div>
                </div>
                
                <div className="cal-nav">
                  <button className="cal-arrow-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <span className="cal-current-month">August 2026</span>
                  <button className="cal-arrow-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
              </div>

              <div className="calendar-wrapper">
                <div className="cal-days-header">
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>
                <div className={`cal-grid ${calView.toLowerCase()}-view`}>
                  <div className="cal-cell"><span className="cal-date">2</span></div>
                  <div className="cal-cell"><span className="cal-date">3</span></div>
                  <div className="cal-cell"><span className="cal-date">4</span></div>
                  <div className="cal-cell">
                    <span className="cal-date">5</span>
                    <div className="cal-booking tag-success">308</div>
                  </div>
                  <div className="cal-cell">
                    <span className="cal-date">6</span>
                    <div className="cal-booking tag-success">308</div>
                    <div className="cal-booking tag-success">204</div>
                  </div>
                  <div className="cal-cell today">
                    <span className="cal-date">7</span>
                    <div className="cal-booking tag-success">308</div>
                    <div className="cal-booking tag-success">204</div>
                    <div className="cal-booking tag-warning">112</div>
                  </div>
                  <div className="cal-cell">
                    <span className="cal-date">8</span>
                    <div className="cal-booking tag-success">308</div>
                  </div>
                  
                  <div className="cal-cell"><span className="cal-date">9</span></div>
                  <div className="cal-cell"><span className="cal-date">10</span></div>
                  <div className="cal-cell"><span className="cal-date">11</span></div>
                  <div className="cal-cell"><span className="cal-date">12</span></div>
                  <div className="cal-cell"><span className="cal-date">13</span></div>
                  <div className="cal-cell"><span className="cal-date">14</span></div>
                  <div className="cal-cell"><span className="cal-date">15</span></div>
                </div>
              </div>
            </div>

            <div className="panel notes-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="panel-header" style={{ marginBottom: '10px' }}>
                <h3>Front Desk Notes</h3>
                <button className="ledger-btn" style={{ padding: '4px 8px' }}>CLEAR</button>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Shared notes for current shift. Auto-saves when typing.
              </p>
              <textarea 
                className="notes-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type your notes here..."
              ></textarea>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default Overview;