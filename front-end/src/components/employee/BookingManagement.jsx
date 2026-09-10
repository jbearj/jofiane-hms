import React, { useState, useEffect } from 'react';


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
        const res = await fetch('http://localhost:5000/api/bookings');
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        // Normalize MongoDB field names to match UI field names
        const normalized = data.map(b => ({
          id: b.booking_id || b._id,
          guestName: b.guest?.full_name || '',
          roomType: b.room_number || '',
          status: b.status || '',
          arrivalDate: b.dates?.check_in || '',
          checkOut: b.dates?.check_out || '',
          room: b.room_number || '',
          amount: parseFloat((b.billing?.expected_total || '0').replace(/,/g, '')) || 0,
          specialRequests: '',
          paymentStatus: parseFloat((b.billing?.balance_due || '0').replace(/,/g, '')) === 0
            ? 'Paid' : 'Balance Due',
          _id: b._id,
        }));
        setBookings(normalized);
        setSelectedBookingId(normalized[0]?.id);
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
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
