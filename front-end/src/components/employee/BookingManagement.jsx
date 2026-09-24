import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePolling } from '../../hooks/usePolling';
import { authFetch } from '../../utils/api';
import { todayISO } from '../../utils/dateUtils';
import ConfirmModal from '../common/ConfirmModal';

// ─── Accent colour adapts to dark/light mode
// Dark mode: amber/gold (matches the overall dark theme warmth)
// Light mode: gold/amber (matches the sidebar logo and active menu items)
const getAccent = (dark) => dark
  ? { accent: '#f59e0b', accentLight: 'rgba(245,158,11,0.12)', accentDark: '#d97706' }
  : { accent: '#b8860b', accentLight: 'rgba(184,134,11,0.12)', accentDark: '#d97706' };

const parseAmount = (str) => parseFloat((str || '0').replace(/,/g, '')) || 0;

function BookingManagement({ employee }) {
  // Dark mode for the front-desk portal is signalled by the 'app-dark' class
  // that EmployeePortal toggles on <body>. Reading that (instead of the admin
  // localStorage key this used to read) keeps this view's accent in step with
  // the rest of the front-desk UI, including same-tab theme toggles.
  const [isDark, setIsDark] = useState(
    () => document.body.classList.contains('app-dark')
  );

  useEffect(() => {
    const sync = () => setIsDark(document.body.classList.contains('app-dark'));
    // Observe body class changes so a theme toggle updates the accent instantly.
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    sync();
    return () => observer.disconnect();
  }, []);

  const FD = getAccent(isDark);
  const [isLoading, setIsLoading]         = useState(true);
  const [bookings, setBookings]           = useState([]);
  const [filtered, setFiltered]           = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showWalkIn, setShowWalkIn]       = useState(false);
  const [processingId, setProcessingId]   = useState(null);
  const [error, setError]                 = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'checkin'|'checkout', booking }

  // Filters
  const [searchQuery, setSearchQuery]     = useState('');
  const [filterStatus, setFilterStatus]   = useState('all');
  // Default the date range to today so opening Booking Management shows
  // today's reservations without having to pick the date manually.
  const [dateFrom, setDateFrom]           = useState(todayISO());
  const [dateTo, setDateTo]               = useState(todayISO());

  // ── FETCH ────────────────────────────────────────
  // `background` = true for polling refreshes: don't flip the loading state,
  // so the table stays on screen instead of flashing "Loading…" every 10s.
  const fetchBookings = async ({ background = false } = {}) => {
    if (!background) setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/bookings');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const normalized = data.map(b => ({
        id:              b.booking_id || b._id,
        guest:           b.guest?.full_name || '',
        email:           b.guest?.email    || '',
        phone:           b.guest?.phone    || '',
        room:            b.room_number     || '',
        checkIn:         b.dates?.check_in  || '',
        checkOut:        b.dates?.check_out || '',
        nights:          parseInt(b.dates?.nights) || 0,
        source:          b.source          || '',
        status:          b.status          || '',
        amount:          parseAmount(b.billing?.expected_total),
        balanceDue:      parseAmount(b.billing?.balance_due),
        totalPaid:       parseAmount(b.billing?.total_paid),
        paymentStatus:   parseAmount(b.billing?.balance_due) === 0 ? 'Paid' : 'Balance Due',
        transactions:    b.transactions    || [],
        _id:             b._id,
      }));
      setBookings(normalized);
      if (!selectedBooking && normalized.length > 0) setSelectedBooking(normalized[0]);
    } catch (err) {
      console.error(err);
      setError('Failed to connect to server.');
    } finally {
      if (!background) setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let r = [...bookings];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(b => b.guest.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.room.includes(q));
    }
    if (filterStatus !== 'all') r = r.filter(b => b.status === filterStatus);
    if (dateFrom) r = r.filter(b => b.checkIn >= dateFrom);
    if (dateTo)   r = r.filter(b => b.checkIn <= dateTo);
    setFiltered(r);
  };

  // Initial foreground load (shows the "Loading…" placeholder once)
  useEffect(() => { fetchBookings(); }, []);
  // Background polling refreshes (silent — no loading flash)
  usePolling(() => fetchBookings({ background: true }), 10000);
  useEffect(() => { applyFilters(); }, [bookings, searchQuery, filterStatus, dateFrom, dateTo]);

  // ── CHECK-IN ─────────────────────────────────────
  // Clicking Check In / Check Out opens a styled confirmation modal; the
  // request runs only after the user confirms (see runConfirmedAction).
  const handleCheckIn = (booking) => setConfirmAction({ type: 'checkin', booking });
  const handleCheckOut = (booking) => setConfirmAction({ type: 'checkout', booking });

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    const { type, booking } = confirmAction;
    const isCheckin = type === 'checkin';
    const endpoint = isCheckin ? 'checkin' : 'checkout';
    const nextStatus = isCheckin ? 'Checked In' : 'Checked Out';
    setProcessingId(booking._id);
    try {
      const res = await authFetch(`/api/bookings/${booking._id}/${endpoint}`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setBookings(prev => prev.map(b => b._id === booking._id ? { ...b, status: nextStatus } : b));
      if (selectedBooking?._id === booking._id) setSelectedBooking(prev => ({ ...prev, status: nextStatus }));
      setConfirmAction(null);
    } catch { alert(`${isCheckin ? 'Check-in' : 'Check-out'} failed. Please try again.`); }
    finally { setProcessingId(null); }
  };

  // ── WALK-IN SAVE ─────────────────────────────────
  const handleWalkIn = async (formData) => {
    try {
      const fmtAmt = (n) => parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
      const hasPayment = parseFloat(formData.amount) > 0;
      const payload = {
        booking_id:  `BKG-${Date.now()}`,
        room_number:  formData.room,
        source:       'Walk-in',
        status:       'Confirmed',
        dates: { check_in: formData.checkIn, check_out: formData.checkOut, nights: String(formData.nights) },
        guest: { guest_id: String(Date.now()), full_name: formData.guest, email: formData.email || '', phone: formData.phone || '' },
        billing: {
          expected_total: fmtAmt(formData.amount),
          total_paid:     hasPayment ? fmtAmt(formData.amount) : '0.00',
          balance_due:    hasPayment ? '0.00' : fmtAmt(formData.amount),
        },
        transactions: hasPayment ? [{
          txn_id:         `TXN-${Date.now()}`,
          datetime:       new Date().toLocaleString('en-CA', { hour12: false }).replace(',', ''),
          description:    `Walk-in Room Charge (Rm ${formData.room})`,
          amount:         fmtAmt(formData.amount),
          payment_method: formData.paymentMethod || 'Cash',
          payment_details:'Front Desk',
          status:         'COMPLETED',
        }] : [],
      };
      const res = await authFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      await fetchBookings();
      setShowWalkIn(false);
    } catch { alert('Failed to save walk-in booking. Please try again.'); }
  };

  // ── HELPERS ──────────────────────────────────────
  const getStatusBadge = (status) => {
    const map = {
      'Confirmed':   { bg: '#dbeafe', color: '#1d4ed8' },
      'Checked In':  { bg: '#d1fae5', color: '#065f46' },
      'Checked Out': { bg: '#f3f4f6', color: '#374151' },
      'Cancelled':   { bg: '#fee2e2', color: '#991b1b' },
      'No Show':     { bg: '#fee2e2', color: '#991b1b' },
    };
    const s = map[status] || { bg: '#f3f4f6', color: '#6b7280' };
    return (
      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
        background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
        {status}
      </span>
    );
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  // Stats
  const confirmedCount  = bookings.filter(b => b.status === 'Confirmed').length;
  const checkedInCount  = bookings.filter(b => b.status === 'Checked In').length;
  const totalRevenue    = bookings.filter(b => b.status !== 'Cancelled').reduce((s, b) => s + b.amount, 0);

  return (
    <section className="admin-tab-content active employee-module booking-module">

      {/* ── PAGE HEADER ── */}
      <div className="page-header employee-page-header" style={{ marginBottom: '24px' }}>
        <div className="left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '700', margin: 0 }}>Booking Management</h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
            Review and action reservations for today's operations.
            {employee?.name && <> · <strong>{employee.name}</strong></>}
          </p>
        </div>
        <div className="right">
          <button
            className="btn btn-sm"
            style={{ background: FD.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowWalkIn(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Walk-In
          </button>
        </div>
      </div>

      {/* ── SUMMARY BAR ── */}
      <div className="panel" style={{ padding: '18px 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '700' }}>{bookings.length}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total</div>
          </div>
          <div style={{ width: '1px', height: '32px', background: 'var(--border-light)' }} />
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1d4ed8' }}>{confirmedCount}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Confirmed</div>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#065f46' }}>{checkedInCount}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Checked In</div>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
              ₱{totalRevenue.toLocaleString()}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total Revenue</div>
          </div>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
        <div className="panel-search" style={{ flex: '1 1 220px', maxWidth: '300px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search guest, booking ID, or room…" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '32px' }} />
        </div>
        <select className="floor-dropdown" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Checked In">Checked In</option>
          <option value="Checked Out">Checked Out</option>
          <option value="Cancelled">Cancelled</option>
          <option value="No Show">No Show</option>
        </select>
        {/* Quick date scope: Today (default) or All dates. */}
        {(() => {
          const isToday = dateFrom === todayISO() && dateTo === todayISO();
          const isAll = !dateFrom && !dateTo;
          return (
            <div style={{ display: 'inline-flex', border: '1px solid var(--border-light, #d1d5db)', borderRadius: '8px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => { setDateFrom(todayISO()); setDateTo(todayISO()); }}
                style={{ padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  background: isToday ? 'var(--gold, #c5a059)' : 'transparent', color: isToday ? '#fff' : 'var(--text-secondary, #4b5563)' }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                style={{ padding: '8px 14px', border: 'none', borderLeft: '1px solid var(--border-light, #d1d5db)', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  background: isAll ? 'var(--gold, #c5a059)' : 'transparent', color: isAll ? '#fff' : 'var(--text-secondary, #4b5563)' }}
              >
                All Dates
              </button>
            </div>
          );
        })()}
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="floor-dropdown" title="Check-in from" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="floor-dropdown" title="Check-in to" />
        {(searchQuery || filterStatus !== 'all') && (
          <button className="btn btn-xs" onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}>
            Clear
          </button>
        )}
      </div>

      {/* ── MAIN TABLE ── */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="panel-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <h3 style={{ margin: 0 }}>Reservations ({filtered.length})</h3>
          {/* Teal top-border accent strip */}
          <div style={{ height: '3px', background: FD.accent, borderRadius: '2px', width: '48px' }} />
        </div>

        <div className="table-wrap">
          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading reservations…</div>
          ) : error ? (
            <div style={{ padding: '20px', color: '#dc2626' }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No reservations match the current filters.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Nights</th>
                  <th>Source</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr
                    key={b._id}
                    className={`table-row-hover${selectedBooking?._id === b._id ? ' selected-booking-row' : ''}`}
                    onClick={() => setSelectedBooking(b)}
                    style={{
                      cursor: 'pointer',
                      background: selectedBooking?._id === b._id ? FD.accentLight : 'transparent',
                    }}
                  >
                    <td><span className="guest-name">{b.id}</span></td>
                    <td>
                      <span className="guest-name">{b.guest}</span>
                      {b.phone && <span className="guest-sub">{b.phone}</span>}
                    </td>
                    <td><span className="std-text">Rm {b.room}</span></td>
                    <td><span className="std-text">{fmtDate(b.checkIn)}</span></td>
                    <td><span className="std-text">{fmtDate(b.checkOut)}</span></td>
                    <td><span className="std-text">{b.nights}</span></td>
                    <td><span className="std-text">{b.source}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>₱{b.amount.toLocaleString()}</td>
                    <td>
                      {b.balanceDue > 0
                        ? <span style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626' }}>₱{b.balanceDue.toLocaleString()}</span>
                        : <span style={{ fontSize: '12px', fontWeight: '700', color: '#059669' }}>Paid</span>
                      }
                    </td>
                    <td>{getStatusBadge(b.status)}</td>
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      {processingId === b._id ? (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>processing…</span>
                      ) : b.status === 'Confirmed' ? (
                        <button
                          className="btn btn-xs"
                          style={{ background: FD.accent, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', padding: '4px 12px' }}
                          onClick={() => handleCheckIn(b)}
                        >
                          Check In
                        </button>
                      ) : b.status === 'Checked In' ? (
                        <button
                          className="btn btn-xs"
                          style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', padding: '4px 12px' }}
                          onClick={() => handleCheckOut(b)}
                        >
                          Check Out
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── BOOKING DETAIL DRAWER ── */}
      {selectedBooking && (
        <div className="panel" style={{ marginTop: '16px', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>{selectedBooking.id}</h3>
              {getStatusBadge(selectedBooking.status)}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {selectedBooking.status === 'Confirmed' && (
                <button
                  className="btn btn-sm"
                  style={{ background: FD.accent, color: '#fff', border: 'none', fontWeight: '700' }}
                  disabled={processingId === selectedBooking._id}
                  onClick={() => handleCheckIn(selectedBooking)}
                >
                  {processingId === selectedBooking._id ? 'Processing…' : 'Check In Guest'}
                </button>
              )}
              {selectedBooking.status === 'Checked In' && (
                <button
                  className="btn btn-sm"
                  style={{ background: '#dc2626', color: '#fff', border: 'none', fontWeight: '700' }}
                  disabled={processingId === selectedBooking._id}
                  onClick={() => handleCheckOut(selectedBooking)}
                >
                  {processingId === selectedBooking._id ? 'Processing…' : 'Check Out Guest'}
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {[
              ['Guest',        selectedBooking.guest],
              ['Email',        selectedBooking.email || '—'],
              ['Phone',        selectedBooking.phone || '—'],
              ['Room',         `Room ${selectedBooking.room}`],
              ['Check-In',     fmtDate(selectedBooking.checkIn)],
              ['Check-Out',    fmtDate(selectedBooking.checkOut)],
              ['Nights',       selectedBooking.nights],
              ['Source',       selectedBooking.source],
              ['Total Amount', `₱${selectedBooking.amount.toLocaleString()}`],
              ['Total Paid',   `₱${selectedBooking.totalPaid.toLocaleString()}`],
              ['Balance Due',  selectedBooking.balanceDue > 0 ? `₱${selectedBooking.balanceDue.toLocaleString()}` : 'None'],
              ['Payment',      selectedBooking.paymentStatus],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Transaction ledger */}
          {selectedBooking.transactions.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Transaction Ledger ({selectedBooking.transactions.length})
              </div>
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
                {selectedBooking.transactions.map((t, i) => {
                  const amt = parseAmount(t.amount);
                  const voided = t.status === 'VOIDED';
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 14px',
                      borderBottom: i < selectedBooking.transactions.length - 1 ? '1px solid var(--border-light)' : 'none',
                      opacity: voided ? 0.45 : 1,
                      background: voided ? 'var(--bg-input)' : 'transparent',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', textDecoration: voided ? 'line-through' : 'none' }}>{t.description}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {t.txn_id} · {t.payment_method}{t.payment_details ? ` · ${t.payment_details}` : ''} · {t.datetime}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: amt < 0 ? '#dc2626' : 'var(--text-primary)' }}>
                          {amt < 0 ? '−' : ''}₱{Math.abs(amt).toLocaleString()}
                        </div>
                        <span style={{
                          fontSize: '10px', padding: '2px 7px', borderRadius: '10px', fontWeight: '600',
                          background: t.status === 'COMPLETED' ? '#d1fae5' : t.status === 'VOIDED' ? '#f3f4f6' : '#fef3c7',
                          color:      t.status === 'COMPLETED' ? '#065f46' : t.status === 'VOIDED' ? '#6b7280' : '#92400e',
                        }}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WALK-IN MODAL ── */}
      {showWalkIn && createPortal(
        <WalkInModal onClose={() => setShowWalkIn(false)} onSave={handleWalkIn} accentColor={FD.accent} />,
        document.body
      )}

      {/* ── CHECK-IN / CHECK-OUT CONFIRMATION ── */}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === 'checkin' ? 'Confirm Check-In' : 'Confirm Check-Out'}
          message={
            confirmAction.type === 'checkin'
              ? <>Check in <strong>{confirmAction.booking.guest}</strong> to Room <strong>{confirmAction.booking.room}</strong>?</>
              : <>Check out <strong>{confirmAction.booking.guest}</strong> from Room <strong>{confirmAction.booking.room}</strong>?</>
          }
          confirmLabel={confirmAction.type === 'checkin' ? 'Check In' : 'Check Out'}
          tone={confirmAction.type === 'checkin' ? 'primary' : 'danger'}
          busy={processingId === confirmAction.booking._id}
          onConfirm={runConfirmedAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </section>
  );
}

/* ================================================================
   WALK-IN MODAL — streamlined for speed at the front desk
   ================================================================ */
function WalkInModal({ onClose, onSave, accentColor }) {
  const calcNights = (ci, co) => {
    if (!ci || !co) return 0;
    const diff = (new Date(co) - new Date(ci)) / 86400000;
    return diff > 0 ? diff : 0;
  };

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    guest: '', phone: '', email: '',
    room: '', checkIn: today, checkOut: '', nights: 0,
    amount: '', paymentMethod: 'Cash',
  });

  const set = (k) => (e) => {
    const updated = { ...form, [k]: e.target.value };
    if (k === 'checkIn' || k === 'checkOut') updated.nights = calcNights(updated.checkIn, updated.checkOut);
    setForm(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.guest.trim())   { alert('Guest name is required.'); return; }
    if (!form.room.trim())    { alert('Room number is required.'); return; }
    if (!form.checkIn)        { alert('Check-in date is required.'); return; }
    if (!form.checkOut)       { alert('Check-out date is required.'); return; }
    if (form.nights <= 0)     { alert('Check-out must be after check-in.'); return; }
    onSave({ ...form, nights: String(form.nights) });
  };

  return (
    <div className="modal-overlay open">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        {/* Teal header strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '4px', height: '28px', borderRadius: '2px', background: accentColor }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>New Walk-In</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Quick registration for walk-in guests</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Guest Info */}
          <div style={{ fontSize: '10px', fontWeight: '700', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Guest</div>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input type="text" value={form.guest} onChange={set('guest')} placeholder="e.g. Juan Dela Cruz" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" value={form.phone} onChange={set('phone')} placeholder="+63 9xx xxx xxxx" />
            </div>
          </div>

          {/* Stay */}
          <div style={{ fontSize: '10px', fontWeight: '700', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Stay</div>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label>Room # <span className="required">*</span></label>
              <input type="text" value={form.room} onChange={set('room')} placeholder="e.g. 304" />
            </div>
            <div className="form-group">
              <label>Nights</label>
              <input type="number" value={form.nights} readOnly style={{ background: 'var(--bg-body)', cursor: 'not-allowed' }} />
            </div>
          </div>
          <div className="form-grid" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label>Check-In <span className="required">*</span></label>
              <input type="date" value={form.checkIn} onChange={set('checkIn')} />
            </div>
            <div className="form-group">
              <label>Check-Out <span className="required">*</span></label>
              <input type="date" value={form.checkOut} onChange={set('checkOut')} />
            </div>
          </div>

          {/* Payment */}
          <div style={{ fontSize: '10px', fontWeight: '700', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Payment</div>
          <div className="form-grid" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label>Total Amount (₱)</label>
              <input type="number" value={form.amount} onChange={set('amount')} placeholder="0" min="0" />
            </div>
            <div className="form-group">
              <label>Method</label>
              <select value={form.paymentMethod} onChange={set('paymentMethod')}>
                <option>Cash</option>
                <option>Credit Card</option>
                <option>GCash</option>
                <option>Maya</option>
                <option>Bank Transfer</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn"
              style={{ background: accentColor, color: '#fff', border: 'none', fontWeight: '700' }}>
              Register Walk-In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingManagement;
