import React, { useState, useEffect } from 'react';


function InHouseGuests() {
  // BACKEND-READY STATES
  const [guests, setGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // DATA FETCHING
  useEffect(() => {
    const fetchGuests = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/guests/in-house');
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        // Normalize MongoDB field names to match UI field names
        const normalized = data.map(g => ({
          id: g._id,
          guestName: g.guest?.full_name || '',
          roomNumber: g.room_number || '',
          roomType: g.room_number || '',
          checkIn: g.dates?.check_in || '',
          expectedDeparture: g.dates?.check_out || '',
          balance: parseFloat((g.billing?.balance_due || '0').replace(/,/g, '')) || 0,
          housekeeping: 'Unknown',
          _id: g._id,
        }));
        setGuests(normalized);
      } catch (error) {
        console.error('Failed to fetch in-house guests:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGuests();
  }, []);

  // ASYNC CHECKOUT
  const handleCheckOut = async (id) => {
    const guest = guests.find(g => g.id === id);
    if (!guest) return;
    setProcessingId(id);
    try {
      const res = await fetch(`http://localhost:5000/api/guests/${guest._id}/checkout`, { method: 'POST' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      // Remove guest from the in-house list after successful checkout
      setGuests(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Guest checkout failed. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="admin-tab-content active employee-module inhouse-module">
      <div className="page-header employee-page-header" style={{ marginBottom: '24px' }}>
        <div className="left">
          <h2>In-House Guests</h2>
          <p>Manage currently occupied rooms, post charges, and process check-outs.</p>
        </div>
      </div>

      <div className="panel manifest-panel guest-directory-panel" style={{ borderRadius: '12px', border: '1px solid #eaeaea' }}>
        <div className="panel-header" style={{ padding: '20px', borderBottom: '1px solid #eaeaea' }}>
          <h3 style={{ margin: 0 }}>Guest Directory</h3>
        </div>

        <div className="table-wrap manifest-table" style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eaeaea', textAlign: 'left' }}>
                <th style={{ padding: '16px 20px' }}>Room</th>
                <th style={{ padding: '16px 20px' }}>Guest Information</th>
                <th style={{ padding: '16px 20px' }}>Balance</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Loading guests...</td></tr>
              ) : guests.map((guest) => (
                <tr key={guest.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px 20px' }}><strong>{guest.roomNumber}</strong></td>
                  <td style={{ padding: '16px 20px' }}>{guest.guestName}</td>
                  <td style={{ padding: '16px 20px', color: guest.balance > 0 ? 'red' : 'green' }}>₱{guest.balance}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleCheckOut(guest.id)} 
                      disabled={processingId === guest.id}
                      className="btn" style={{ background: '#dc3545', color: '#fff', borderRadius: '6px' }}
                    >
                      {processingId === guest.id ? 'Processing...' : 'Check-Out'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default InHouseGuests;
