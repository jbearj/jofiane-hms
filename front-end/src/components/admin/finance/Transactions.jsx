import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function Transactions() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [kpis, setKpis] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('today');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Transaction detail modal (replaces inline row actions)
  const [viewingTxn, setViewingTxn] = useState(null);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Export Dropdown State
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [filterPeriod]);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchQuery, filterMethod, filterStatus, filterType]);

  const fetchTransactions = async () => {
    if (!kpis) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const res = await fetch(`http://localhost:5000/api/transactions?period=${filterPeriod}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      // Normalize aggregated transaction fields from embedded booking.transactions
      const normalized = data.transactions.map(t => ({
        id: t.txn_id || String(t.booking_object_id),
        date: t.datetime || new Date().toISOString(),
        guest: t.guest_name || '',
        room: t.room_number || '',
        description: t.description || '',
        amount: parseFloat((t.amount || '0').replace(/,/g, '')) || 0,
        method: t.payment_method || '',
        methodDetail: t.payment_details || '',
        type: parseFloat((t.amount || '0').replace(/,/g, '')) < 0 ? 'refund' : 'charge',
        status: (t.status || '').toLowerCase(),   // "COMPLETED" → "completed"
        _bookingObjectId: t.booking_object_id,    // MongoDB _id of the parent booking
        _bookingId: t.booking_id,
      }));

      setTransactions(normalized);
      setKpis(data.kpis);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const applyFilters = () => {
    let result = [...transactions];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.guest.toLowerCase().includes(q) ||
        t.room.includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }

    // Method filter
    if (filterMethod !== 'all') {
      result = result.filter(t => t.method.toLowerCase().replace(' ', '-') === filterMethod);
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    setFilteredTransactions(result);
  };

  const handleExport = (format) => {
    // TODO: Implement actual export
    alert(`Exporting ${filteredTransactions.length} transactions as ${format.toUpperCase()}`);
  };

  const handleRecordPayment = async (paymentData) => {
    try {
      // Find a checked-in booking matching the given room number
      const bookingsRes = await fetch(`http://localhost:5000/api/bookings?status=Checked In`);
      if (!bookingsRes.ok) throw new Error('Could not fetch bookings');
      const bookings = await bookingsRes.json();
      const match = bookings.find(b => b.room_number === paymentData.room);

      if (!match) {
        alert(`No checked-in booking found for room ${paymentData.room}. Please verify the room number.`);
        return;
      }

      const txn = {
        txn_id: `TXN-${Date.now()}`,
        datetime: new Date().toLocaleString('en-CA', { hour12: false }).replace(',', ''),
        description: paymentData.description,
        amount: parseFloat(paymentData.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }),
        payment_method: paymentData.method,
        payment_details: paymentData.methodDetail || '',
        status: 'COMPLETED',
      };

      const res = await fetch(`http://localhost:5000/api/bookings/${match._id}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txn),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      await fetchTransactions();
    } catch (err) {
      console.error('Failed to record payment:', err);
      alert('Failed to record payment. Please try again.');
    }
    setShowPaymentModal(false);
  };

  const handleRefund = async (refundData) => {
    if (!selectedTransaction?._bookingObjectId) {
      alert('Cannot find the booking for this transaction.');
      return;
    }
    try {
      const refundTxn = {
        txn_id: `TXN-${Date.now()}`,
        datetime: new Date().toLocaleString('en-CA', { hour12: false }).replace(',', ''),
        description: `Refund - ${refundData.reason}`,
        // Stored as negative string e.g. "-2,100.00"
        amount: `-${Math.abs(parseFloat(refundData.amount)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        payment_method: selectedTransaction.method,
        payment_details: selectedTransaction.methodDetail || '',
        status: 'COMPLETED',
      };

      const res = await fetch(
        `http://localhost:5000/api/bookings/${selectedTransaction._bookingObjectId}/transactions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(refundTxn),
        }
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      await fetchTransactions();
    } catch (err) {
      console.error('Failed to issue refund:', err);
      alert('Failed to issue refund. Please try again.');
    }
    setShowRefundModal(false);
    setSelectedTransaction(null);
  };

  const handleVoid = async (transaction) => {
    if (!window.confirm(`Void transaction ${transaction.id}? This cannot be undone.`)) return;
    if (!transaction._bookingObjectId) {
      alert('Cannot find the booking for this transaction.');
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:5000/api/bookings/${transaction._bookingObjectId}/transactions/${transaction.id}/void`,
        { method: 'PATCH' }
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      // Update UI immediately without a full refetch
      setTransactions(prev =>
        prev.map(t => t.id === transaction.id ? { ...t, status: 'voided' } : t)
      );
    } catch (err) {
      console.error('Failed to void transaction:', err);
      alert('Failed to void transaction. Please try again.');
    }
  };

  const toggleRow = (txnId) => {
    const txn = filteredTransactions.find(t => t.id === txnId);
    setViewingTxn(txn || null);
  };

  // Escape key closes the detail modal
  const handleRowKeyDown = (e) => {
    if (e.key === 'Escape' && viewingTxn) {
      setViewingTxn(null);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatAmount = (amount) => {
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString();
    if (amount < 0) return `(${formatted})`;
    return formatted;
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'completed': return <span className="status-tag tag-success">Completed</span>;
      case 'pending': return <span className="status-tag tag-warning">Pending</span>;
      case 'voided': return <span className="status-tag tag-neutral">Voided</span>;
      case 'refunded': return <span className="status-tag tag-danger">Refunded</span>;
      default: return <span className="status-tag tag-neutral">{status}</span>;
    }
  };

  if (isLoading || !kpis) {
    return (
      <section className="admin-tab-content active">
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>Loading transactions...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-tab-content active transaction-module">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Transactions</h2>
          <p>Daily operational ledger</p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid txn-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '22px', opacity: isRefreshing ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
        <div className="kpi-card txn-kpi income">
          <span className="lbl">TOTAL INCOME</span>
          <span className="val">{kpis.totalIncome.toLocaleString()}</span>
          <span className="sub">This {filterPeriod}</span>
        </div>
        <div className="kpi-card txn-kpi expenses">
          <span className="lbl">TOTAL EXPENSES</span>
          <span className="val">{kpis.totalExpenses.toLocaleString()}</span>
          <span className="sub">Refunds & adjustments</span>
        </div>
        <div className="kpi-card txn-kpi net">
          <span className="lbl">NET REVENUE</span>
          <span className="val" style={{ color: 'var(--status-vac)' }}>{kpis.netRevenue.toLocaleString()}</span>
          <span className="sub">After deductions</span>
        </div>
        <div className="kpi-card txn-kpi outstanding">
          <span className="lbl">OUTSTANDING</span>
          <span className="val" style={{ color: '#b45309' }}>{kpis.outstanding.toLocaleString()}</span>
          <span className="sub">Pending collection</span>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="panel txn-panel">
        
        {/* REDESIGNED HEADER TOOLBAR */}
        <div className="panel-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '10px', padding: '16px 24px', margin: 0, borderBottom: '1px solid var(--border-light)' }}>
          
          {/* ROW 1: Title */}
          <div style={{ textAlign: 'left', width: '100%' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Transaction History ({filteredTransactions.length})</h3>
          </div>

          {/* ROW 2: Tools (Search, Filters, Actions) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            
            {/* LEFT CLUSTER: Search Bar */}
            <div className="panel-search txn-search" style={{ flex: '1 1 260px', maxWidth: '340px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                type="text"
                placeholder="Search guest, room, or TXN ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px' }}
              />
            </div>

            {/* RIGHT CLUSTER: Filters + Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto' }}>
              
              <select className="floor-dropdown" value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>

              <select className="floor-dropdown" value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="credit-card">Credit Card</option>
                <option value="bank-transfer">Bank Transfer</option>
                <option value="room-charge">Room Charge</option>
              </select>

              <select className="floor-dropdown" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="voided">Voided</option>
              </select>

              <select className="floor-dropdown" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="charge">Charge</option>
                <option value="refund">Refund</option>
                <option value="void">Void</option>
              </select>

              <div style={{ width: '1px', height: '24px', background: 'var(--border-light)', margin: '0 4px' }}></div>

              {/* Dropdown Export Button */}
              <div style={{ position: 'relative' }}>
                <button className="btn btn-sm" onClick={() => setShowExportMenu(!showExportMenu)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Export
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>

                {showExportMenu && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                    background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)',
                    zIndex: 50, display: 'flex', flexDirection: 'column', minWidth: '130px',
                    overflow: 'hidden'
                  }}>
                    <button
                      style={{ padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-light)', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                      onClick={() => { handleExport('csv'); setShowExportMenu(false); }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(201, 168, 76, 0.1)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      Export as CSV
                    </button>
                    <button
                      style={{ padding: '10px 14px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                      onClick={() => { handleExport('pdf'); setShowExportMenu(false); }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(201, 168, 76, 0.1)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      Export as PDF
                    </button>
                  </div>
                )}
              </div>

              <button className="btn btn-sm btn-gold" onClick={() => setShowPaymentModal(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Record Payment
              </button>
            </div>
          </div>
        </div>
        
        <div className="table-wrap" style={{ opacity: isRefreshing ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
          <table className="txn-table">
            <colgroup>
              <col style={{ width: '104px' }} />
              <col style={{ width: '112px' }} />
              <col style={{ width: '152px' }} />
              <col style={{ width: '68px' }} />
              <col />
              <col style={{ width: '140px' }} />
              <col style={{ width: '104px' }} />
              <col style={{ width: '112px' }} />
            </colgroup>
            <thead>
              <tr>
                <th>TXN ID</th>
                <th>Date</th>
                <th>Guest</th>
                <th style={{ textAlign: 'center' }}>Room</th>
                <th>Description</th>
                <th>Method</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No transactions found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="table-row-hover txn-row"
                    onClick={() => setViewingTxn(txn)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span className="guest-name">{txn.id}</span>
                    </td>
                    <td>
                      <span className="std-text">{formatDate(txn.date)}</span>
                      <span className="guest-sub">{formatTime(txn.date)}</span>
                    </td>
                    <td>
                      <span className="guest-name">{txn.guest}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="std-text">{txn.room}</span>
                    </td>
                    <td>
                      <span className="std-text">{txn.description}</span>
                    </td>
                    <td>
                      <span className="std-text">{txn.method}</span>
                      <span className="guest-sub">{txn.methodDetail}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`txn-amount ${txn.amount < 0 ? 'negative' : 'positive'}`}>
                        {formatAmount(txn.amount)}
                      </span>
                    </td>
                    <td>{getStatusTag(txn.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && createPortal(
        <RecordPaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSave={handleRecordPayment}
        />,
        document.body
      )}

      {/* REFUND MODAL */}
      {showRefundModal && selectedTransaction && createPortal(
        <RefundModal
          transaction={selectedTransaction}
          onClose={() => { setShowRefundModal(false); setSelectedTransaction(null); }}
          onRefund={handleRefund}
        />,
        document.body
      )}

      {/* TRANSACTION DETAIL MODAL */}
      {viewingTxn && createPortal(
        <TransactionDetailModal
          transaction={viewingTxn}
          onClose={() => setViewingTxn(null)}
          onRefund={(txn) => { setViewingTxn(null); setSelectedTransaction(txn); setShowRefundModal(true); }}
          onVoid={(txn) => { setViewingTxn(null); handleVoid(txn); }}
          formatDate={formatDate}
          formatTime={formatTime}
          formatAmount={formatAmount}
          getStatusTag={getStatusTag}
        />,
        document.body
      )}
    </section>
  );
}

/* ============================================================
   RECORD PAYMENT MODAL
   ============================================================ */
function RecordPaymentModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    guest: '',
    room: '',
    description: '',
    amount: '',
    method: 'Cash',
    methodDetail: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.guest || !formData.amount || !formData.description) {
      alert('Please fill in required fields.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay open">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Record Payment</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Manually log a payment received</p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Guest Name <span className="required">*</span></label>
              <input type="text" value={formData.guest} onChange={(e) => setFormData({ ...formData, guest: e.target.value })} placeholder="e.g. Juan Dela Cruz" />
            </div>
            <div className="form-group">
              <label>Room Number</label>
              <input type="text" value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} placeholder="e.g. 304" />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label>Description <span className="required">*</span></label>
            <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Room Charge, F&B, Spa" />
          </div>

          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Amount <span className="required">*</span></label>
              <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value })}>
                <option>Cash</option>
                <option>Credit Card</option>
                <option>Bank Transfer</option>
                <option>Room Charge</option>
                <option>GCash</option>
                <option>Maya</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Reference / Detail</label>
            <input type="text" value={formData.methodDetail} onChange={(e) => setFormData({ ...formData, methodDetail: e.target.value })} placeholder="e.g. Visa ····4242, Receipt #123" />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-gold">Record Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   REFUND MODAL
   ============================================================ */
function RefundModal({ transaction, onClose, onRefund }) {
  const [formData, setFormData] = useState({
    amount: Math.abs(transaction.amount),
    reason: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.reason) {
      alert('Please provide a reason for the refund.');
      return;
    }
    if (parseFloat(formData.amount) > Math.abs(transaction.amount)) {
      alert('Refund amount cannot exceed original transaction amount.');
      return;
    }
    onRefund(formData);
  };

  return (
    <div className="modal-overlay open">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Issue Refund</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Refund for {transaction.id} — {transaction.guest}</p>

        <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Original Amount</span>
            <span style={{ fontWeight: '700' }}>{Math.abs(transaction.amount).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Method</span>
            <span>{transaction.method}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label>Refund Amount <span className="required">*</span></label>
            <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} max={Math.abs(transaction.amount)} min="0" step="0.01" />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Reason <span className="required">*</span></label>
            <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="e.g. Overcharge correction, Guest complaint resolution" style={{ minHeight: '80px' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn" style={{ background: 'var(--status-occ)', color: '#fff', borderColor: 'var(--status-occ)' }}>Issue Refund</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Transactions;

/* ============================================================
   TRANSACTION DETAIL MODAL
   Shows full info + Refund / Void actions when a row is clicked
   ============================================================ */
function TransactionDetailModal({ transaction: txn, onClose, onRefund, onVoid, formatDate, formatTime, formatAmount, getStatusTag }) {
  // Can only refund a completed positive charge
  const canRefund = txn.status === 'completed' && txn.amount > 0;
  // Can void anything that isn't already voided
  const canVoid = txn.status !== 'voided';

  return (
    <div className="modal-overlay open">
      <div className="modal-content txn-detail-modal">
        <button className="modal-close" onClick={onClose}>&times;</button>

        {/* Title */}
        <div className="txn-modal-header">
          <h3>Transaction Details</h3>
          {getStatusTag(txn.status)}
        </div>

        {/* Amount hero */}
        <div className={`txn-modal-amount ${txn.amount < 0 ? 'negative' : 'positive'}`}>
          {txn.amount < 0 ? '−' : ''}₱{Math.abs(txn.amount).toLocaleString()}
        </div>

        {/* Fact grid */}
        <div className="txn-modal-grid">
          <div className="txn-modal-field">
            <span className="txn-modal-label">Reference</span>
            <span className="txn-modal-value">{txn.id}</span>
          </div>
          <div className="txn-modal-field">
            <span className="txn-modal-label">Date & Time</span>
            <span className="txn-modal-value">{formatDate(txn.date)} · {formatTime(txn.date)}</span>
          </div>
          <div className="txn-modal-field">
            <span className="txn-modal-label">Guest</span>
            <span className="txn-modal-value">{txn.guest}</span>
          </div>
          <div className="txn-modal-field">
            <span className="txn-modal-label">Room</span>
            <span className="txn-modal-value">{txn.room}</span>
          </div>
          <div className="txn-modal-field full-width">
            <span className="txn-modal-label">Description</span>
            <span className="txn-modal-value">{txn.description}</span>
          </div>
          <div className="txn-modal-field">
            <span className="txn-modal-label">Payment Method</span>
            <span className="txn-modal-value">{txn.method}</span>
          </div>
          <div className="txn-modal-field">
            <span className="txn-modal-label">Detail</span>
            <span className="txn-modal-value">{txn.methodDetail || '—'}</span>
          </div>
          <div className="txn-modal-field">
            <span className="txn-modal-label">Type</span>
            <span className="txn-modal-value" style={{ textTransform: 'capitalize' }}>{txn.type}</span>
          </div>
          <div className="txn-modal-field">
            <span className="txn-modal-label">Status</span>
            <span className="txn-modal-value" style={{ textTransform: 'capitalize' }}>{txn.status}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="txn-modal-actions">
          {canRefund && (
            <button className="ledger-btn" onClick={() => onRefund(txn)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
              Issue Refund
            </button>
          )}
          {canVoid && (
            <button className="ledger-btn btn-danger" onClick={() => onVoid(txn)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
              Void Transaction
            </button>
          )}
          <button className="ledger-btn" style={{ marginLeft: 'auto' }} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
