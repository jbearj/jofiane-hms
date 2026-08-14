import React, { useState, useEffect } from 'react';


// Mock data 
const initialBookings = [
  { id: 'BKG-8001', guestName: 'Marisol Reyes', roomType: 'Veranda Suite', status: 'Checked-In', arrivalDate: '2026-08-13' },
  { id: 'BKG-8002', guestName: 'Juan Santos', roomType: 'Deluxe Room', status: 'Confirmed', arrivalDate: '2026-08-15' }
];

function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // FETCH DATA ON MOUNT
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        // const res = await fetch('http://localhost:8080/api/bookings');
        // const data = await res.json();
        await new Promise(resolve => setTimeout(resolve, 800));
        setBookings(initialBookings);
        setSelectedBookingId(initialBookings[0]?.id);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const activeBooking = bookings.find((b) => b.id === selectedBookingId);
  const filteredBookings = bookings.filter((booking) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesQuery = !query || booking.guestName.toLowerCase().includes(query) || booking.id.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'All' || booking.status === statusFilter;
    const matchesFrom = !dateFrom || booking.arrivalDate >= dateFrom;
    const matchesTo = !dateTo || booking.arrivalDate <= dateTo;
    return matchesQuery && matchesStatus && matchesFrom && matchesTo;
  });

  return (
    <section className="admin-tab-content active employee-module booking-module">
      <div className="page-header employee-page-header">
        <div className="left">
          <h2>Booking Management</h2>
          <p>Review reservations and keep guest booking details current.</p>
        </div>
      </div>

      <div className="booking-control-bar" aria-label="Reservation filters">
        <label className="booking-search-control">
          <i className="fas fa-search" aria-hidden="true" />
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search guest or booking ID" aria-label="Search guest or booking ID" />
        </label>
        <label>
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All</option>
            <option>Checked-In</option>
            <option>Confirmed</option>
            <option>Cancelled</option>
          </select>
        </label>
        <label>
          <span>From</span>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label>
          <span>To</span>
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
      </div>

      <div className="dashboard-split dashboard-split-13 booking-workspace">
        
        {/* LIST PANEL */}
        <div className="panel booking-list-panel">
          <div className="panel-header" style={{ marginBottom: 15 }}><h3>All Reservations</h3></div>
          <div className="table-wrap">
            {isLoading ? (
               <div style={{ padding: '40px', textAlign: 'center' }}>Loading Database...</div>
            ) : (
              <table>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr className={selectedBookingId === booking.id ? 'selected-row' : ''} key={booking.id} onClick={() => setSelectedBookingId(booking.id)} style={{ cursor: 'pointer', background: selectedBookingId === booking.id ? '#fdfbf7' : 'transparent' }}>
                      <td><strong>{booking.guestName}</strong><br/><small>{booking.id}</small></td>
                      <td><span className="booking-status-pill">{booking.status}</span><br/><small>{booking.arrivalDate}</small></td>
                    </tr>
                  ))}
                  {filteredBookings.length === 0 && (
                    <tr><td colSpan="2" className="booking-empty-state">No reservations match these filters.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* DETAILS PANEL */}
        <div className="panel booking-detail-panel">
          <div className="panel-header"><h3>Booking Details</h3></div>
          {activeBooking ? (
            <div className="booking-detail-content" style={{ marginTop: '20px' }}>
              <h4>{activeBooking.guestName}</h4>
              <p>Status: {activeBooking.status}</p>
              <p>Booking ID: {activeBooking.id}</p>
              <p>Room: {activeBooking.roomType}</p>
              <p>Arrival: {activeBooking.arrivalDate}</p>
              <button className="btn btn-gold" style={{ width: '100%', marginTop: '20px' }}>Edit Booking via API</button>
            </div>
          ) : (
            <p>Select a booking to view details.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default BookingManagement;
