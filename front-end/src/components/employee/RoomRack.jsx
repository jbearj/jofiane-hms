import React, { useMemo, useState } from 'react';

const rooms = [
  { number: '101', type: 'Deluxe King', floor: '1', housekeeping: 'clean', stays: [{ guest: 'Amelia Cruz', start: 0, span: 2, status: 'inhouse' }, { guest: 'L. Mendoza', start: 3, span: 2, status: 'reserved' }] },
  { number: '102', type: 'Deluxe King', floor: '1', housekeeping: 'clean', stays: [{ guest: 'Available', start: 0, span: 5, status: 'available' }] },
  { number: '105', type: 'Veranda Suite', floor: '1', housekeeping: 'dirty', stays: [{ guest: 'Turnover', start: 0, span: 1, status: 'turnover' }, { guest: 'S. Villanueva', start: 1, span: 3, status: 'reserved' }] },
  { number: '118', type: 'Veranda Suite', floor: '1', housekeeping: 'clean', stays: [{ guest: 'Noah Tan', start: 0, span: 4, status: 'inhouse' }] },
  { number: '201', type: 'Executive Twin', floor: '2', housekeeping: 'inspection', stays: [{ guest: 'Inspection', start: 0, span: 1, status: 'turnover' }, { guest: 'Available', start: 1, span: 4, status: 'available' }] },
  { number: '205', type: 'Executive Twin', floor: '2', housekeeping: 'clean', stays: [{ guest: 'M. Santos', start: 0, span: 1, status: 'inhouse' }, { guest: 'Available', start: 1, span: 2, status: 'available' }, { guest: 'E. Lim', start: 3, span: 2, status: 'reserved' }] },
  { number: '304', type: 'Presidential Suite', floor: '3', housekeeping: 'maintenance', stays: [{ guest: 'AC maintenance', start: 0, span: 2, status: 'maintenance' }, { guest: 'Available', start: 2, span: 3, status: 'available' }] },
  { number: '310', type: 'Executive Suite', floor: '3', housekeeping: 'clean', stays: [{ guest: 'R. Garcia', start: 0, span: 3, status: 'inhouse' }, { guest: 'K. Sy', start: 3, span: 2, status: 'reserved' }] },
];

function RoomRack() {
  const [floor, setFloor] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedStay, setSelectedStay] = useState(null);
  const dates = useMemo(() => Array.from({ length: 5 }, (_, index) => { const date = new Date(Date.now() + index * 86400000); return { day: date.toLocaleDateString('en-US', { weekday: 'short' }), date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }; }), []);

  const visibleRooms = rooms.filter((room) => (floor === 'all' || room.floor === floor) && (status === 'all' || room.housekeeping === status) && (!query || `${room.number} ${room.type}`.toLowerCase().includes(query.toLowerCase())));
  const counts = rooms.reduce((acc, room) => ({ ...acc, [room.housekeeping]: (acc[room.housekeeping] || 0) + 1 }), {});
  const getStayPosition = (stay) => {
    const totalHalfDays = dates.length * 2;
    let startHalf = stay.start * 2;
    let halfDaySpan = stay.span * 2;

    if (stay.status === 'reserved') {
      startHalf += 1;
    } else if (stay.status === 'inhouse') {
      halfDaySpan = Math.max(1, halfDaySpan - 1);
    } else if (stay.status === 'turnover') {
      halfDaySpan = 1;
    }

    return {
      gridColumn: `${startHalf + 1} / span ${Math.min(halfDaySpan, totalHalfDays - startHalf)}`
    };
  };

  const openStayPeek = (event, room, stay) => {
    event.stopPropagation();
    if (stay.status === 'inhouse' || stay.status === 'reserved') {
      setSelectedStay({ room, stay });
    } else {
      setSelectedRoom(room);
    }
  };

  return (
    <section className="admin-tab-content active employee-module roomrack-module">
      <div className="page-header employee-page-header module-title-row">
        <div className="left"><span className="eyebrow">Rooms</span><h2>Room Rack / Plan</h2><p>See live room readiness and upcoming stays at a glance.</p></div>
        <button className="btn btn-gold" type="button">+ Block room</button>
      </div>

      <div className="roomrack-kpis">
        <div><span className="status-orb clean" /><p><strong>{counts.clean || 0}</strong><span>Clean & ready</span></p></div>
        <div><span className="status-orb dirty" /><p><strong>{counts.dirty || 0}</strong><span>Dirty / turnover</span></p></div>
        <div><span className="status-orb inspection" /><p><strong>{counts.inspection || 0}</strong><span>Needs inspection</span></p></div>
        <div><span className="status-orb maintenance" /><p><strong>{counts.maintenance || 0}</strong><span>Out of service</span></p></div>
      </div>

      <div className="panel roomrack-panel">
        <div className="roomrack-toolbar">
          <div><h3>5-day room plan</h3><p>{visibleRooms.length} rooms shown · Updated just now</p></div>
          <div className="roomrack-filters">
            <label className="module-search"><i className="fas fa-search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Room or type" /></label>
            <select value={floor} onChange={(event) => setFloor(event.target.value)}><option value="all">All floors</option><option value="1">Floor 1</option><option value="2">Floor 2</option><option value="3">Floor 3</option></select>
            <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All room status</option><option value="clean">Clean</option><option value="dirty">Dirty</option><option value="inspection">Inspection</option><option value="maintenance">Maintenance</option></select>
          </div>
        </div>

        <div className="room-plan-scroll">
          <div className="room-plan-grid room-plan-header">
            <div>Room / readiness</div>
            {dates.map((item, index) => <div className={index === 0 ? 'today' : ''} key={item.date}><strong>{item.day}</strong><span>{item.date}</span></div>)}
          </div>
          {visibleRooms.map((room) => (
            <div className="room-plan-grid room-plan-row" key={room.number} onClick={() => setSelectedRoom(room)}>
              <div className="room-identity"><p><span><strong>{room.number}</strong><em className={`housekeeping-pill ${room.housekeeping}`}>{room.housekeeping}</em></span><small>{room.type}</small></p></div>
              <div className="stay-track">
                {room.stays.map((stay, index) => <button type="button" key={`${stay.guest}-${index}`} className={`stay-block ${stay.status}`} style={getStayPosition(stay)} onClick={(event) => openStayPeek(event, room, stay)} title={`${stay.guest} · ${stay.span} day(s)`}><b>{stay.guest}</b><small>{stay.status === 'inhouse' ? 'In-house' : stay.status}</small></button>)}
              </div>
            </div>
          ))}
          {visibleRooms.length === 0 && <div className="roomrack-empty">No rooms match these filters.</div>}
        </div>

        <div className="roomrack-legend"><span><i className="inhouse" />In-house</span><span><i className="reserved" />Reserved</span><span><i className="available" />Available</span><span><i className="turnover" />Turnover</span><span><i className="maintenance" />Maintenance</span></div>
      </div>

      {selectedRoom && (
        <div className="room-detail-drawer" role="dialog" aria-modal="true" aria-label={`Room ${selectedRoom.number} details`}>
          <button className="drawer-backdrop" onClick={() => setSelectedRoom(null)} aria-label="Close room details" />
          <aside><button className="drawer-close" onClick={() => setSelectedRoom(null)}>×</button><span className="eyebrow">Room details</span><h3>Room {selectedRoom.number}</h3><p>{selectedRoom.type} · Floor {selectedRoom.floor}</p><div className={`drawer-readiness ${selectedRoom.housekeeping}`}><span className={`status-orb ${selectedRoom.housekeeping}`} />{selectedRoom.housekeeping}</div><h4>Upcoming plan</h4>{selectedRoom.stays.map((stay, index) => <div className="drawer-stay" key={index}><span className={stay.status} /><div><strong>{stay.guest}</strong><small>{stay.span} day{stay.span > 1 ? 's' : ''} · {stay.status}</small></div></div>)}<button className="btn btn-gold" type="button">Open room profile</button></aside>
        </div>
      )}

      {selectedStay && (
        <div className="stay-peek-overlay" role="dialog" aria-modal="true" aria-label={`${selectedStay.stay.guest} reservation quick actions`}>
          <button className="stay-peek-backdrop" onClick={() => setSelectedStay(null)} aria-label="Close reservation quick actions" />
          <div className="stay-peek-card">
            <div className="stay-peek-heading">
              <div><span className="eyebrow">Quick reservation peek</span><h3>{selectedStay.stay.guest}</h3></div>
              <button className="drawer-close" type="button" onClick={() => setSelectedStay(null)} aria-label="Close">×</button>
            </div>
            <div className="peek-status-row"><span className={`peek-status ${selectedStay.stay.status}`}>{selectedStay.stay.status === 'inhouse' ? 'In-house' : 'Confirmed'}</span><span>{selectedStay.stay.span} night{selectedStay.stay.span > 1 ? 's' : ''}</span></div>
            <div className="peek-room-summary"><span>Room</span><strong>{selectedStay.room.number}</strong><small>{selectedStay.room.type}</small></div>
            <dl className="peek-facts">
              <div><dt>Check-in</dt><dd>3:00 PM</dd></div>
              <div><dt>Check-out</dt><dd>12:00 PM</dd></div>
              <div><dt>Balance</dt><dd>₱0 · Settled</dd></div>
              <div><dt>Folio</dt><dd>FOL-{selectedStay.room.number}26</dd></div>
            </dl>
            <div className="peek-actions">
              <button className="btn" type="button"><i className="fas fa-pen" /> Edit stay</button>
              <button className="btn" type="button"><i className="fas fa-print" /> Print folio</button>
              <button className="btn btn-gold" type="button">View booking</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default RoomRack;
