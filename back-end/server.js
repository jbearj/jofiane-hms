

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();


const Room = require('./models/Room');
const RoomType = require('./models/RoomType');
const Booking = require('./models/Booking');
const Employee = require('./models/Employee');
const Shift = require('./models/Shift');
const ShiftAssignment = require('./models/ShiftAssignment');
const Audit = require('./models/Audit');


const app = express();
app.use(cors());
app.use(express.json());


// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────




app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }




    if (/^.+@admin$/.test(username.toLowerCase())) {
      return res.json({ role: 'admin', employee: null });
    }


 
    const employee = await Employee.findOne({
      'portal_access.username': { $regex: `^${username}$`, $options: 'i' },
      'portal_access.has_access': true,
    });


    if (!employee) {
      return res.status(401).json({ error: 'Invalid credentials or portal access not granted' });
    }


    if (employee.portal_access.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }


    // Determine department for routing to correct module
    const dept = (employee.employment_details?.department || '').toLowerCase();
    let module = 'frontdesk'; // default
    if (dept.includes('housekeeping'))  module = 'housekeeping';
    else if (dept.includes('maintenance')) module = 'maintenance';
    else if (dept.includes('admin'))    module = 'admin';


    res.json({
      role: 'employee',
      module,
      employee: {
        _id:        employee._id,
        name:       employee.full_name,
        email:      employee.contact?.email,
        department: employee.employment_details?.department,
        role:       employee.employment_details?.role?.title,
        username:   employee.portal_access.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', detail: error.message });
  }
});


// ─────────────────────────────────────────────
// ROOMS
// ─────────────────────────────────────────────


app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});


app.get('/api/room-types', async (req, res) => {
  try {
    const types = await RoomType.find();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room types' });
  }
});

// ─────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────




app.get('/api/bookings', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.source) filter.source = req.query.source;
    if (req.query.date)   filter['dates.check_in'] = req.query.date;
    const bookings = await Booking.find(filter).sort({ 'dates.check_in': -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});




app.get('/api/arrivals', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const arrivals = await Booking.find({ 'dates.check_in': date }).sort({ booking_id: 1 });
    res.json(arrivals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch arrivals' });
  }
});




app.get('/api/departures', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const departures = await Booking.find({
      'dates.check_out': date,
      status: { $in: ['Checked In', 'Confirmed'] }
    }).sort({ booking_id: 1 });
    res.json(departures);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departures' });
  }
});




app.get('/api/guests/in-house', async (req, res) => {
  try {
    const guests = await Booking.find({ status: 'Checked In' }).sort({ 'dates.check_in': 1 });
    res.json(guests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch in-house guests' });
  }
});




app.get('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});




app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });


   
    const activeTxns = (booking.transactions || []).filter(
      t => t && t.status !== 'VOIDED'
    );
    if (activeTxns.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete a booking that has transactions. Void all transactions first.'
      });
    }


    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: 'Failed to delete booking', detail: error.message });
  }
});




app.post('/api/bookings/:id/cancel', async (req, res) => {
  try {
    const { reason, cancelled_by, penalty_applied, penalty_amount } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }
    if (booking.status === 'Checked Out') {
      return res.status(400).json({ error: 'Cannot cancel a booking that is already checked out' });
    }


    const fmtAmount = (n) =>
      parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });


    const updateData = {
      status: 'Cancelled',
      cancellation: {
        cancelled_by: cancelled_by || 'Staff',
        cancelled_at: new Date().toLocaleString('en-CA', { hour12: false }).replace(',', ''),
        reason: reason || 'Guest request',
        penalty_applied: !!penalty_applied,
        penalty_amount: penalty_applied ? fmtAmount(penalty_amount) : '0.00',
      },
    };


 
    if (penalty_applied && parseFloat(penalty_amount) > 0) {
      updateData.$push = {
        transactions: {
          txn_id: `TXN-${Date.now()}`,
          datetime: new Date().toLocaleString('en-CA', { hour12: false }).replace(',', ''),
          description: `Cancellation Penalty - ${reason || 'Guest request'}`,
          amount: fmtAmount(penalty_amount),
          payment_method: 'Penalty',
          payment_details: `Cancelled by ${cancelled_by || 'Staff'}`,
          status: 'COMPLETED',
        },
      };
    }


    const updated = await Booking.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking', detail: error.message });
  }
});




app.post('/api/bookings', async (req, res) => {
  try {
    const booking = new Booking(req.body);
    const saved = await booking.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});




app.put('/api/bookings/:id', async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Booking not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});




app.post('/api/bookings/:id/checkin', async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'Checked In' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Booking not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check in' });
  }
});


// POST check-out: set status to "Checked Out"
app.post('/api/bookings/:id/checkout', async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'Checked Out' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Booking not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check out' });
  }
});




app.post('/api/bookings/:id/transactions', async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { $push: { transactions: req.body } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Booking not found' });
    res.status(201).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});


app.patch('/api/bookings/:id/transactions/:txnId/void', async (req, res) => {
  try {
    const updated = await Booking.findOneAndUpdate(
      { _id: req.params.id, 'transactions.txn_id': req.params.txnId },
      { $set: { 'transactions.$.status': 'VOIDED' } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Booking or transaction not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to void transaction' });
  }
});


// ─────────────────────────────────────────────
// TRANSACTIONS  (read across all bookings)
// ─────────────────────────────────────────────


app.get('/api/transactions', async (req, res) => {
  try {
    const period = req.query.period || 'today';
    const now = new Date();
    let startDate;
    switch (period) {
      case 'today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'week':  startDate = new Date(now); startDate.setDate(now.getDate() - 7); break;
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'year':  startDate = new Date(now.getFullYear(), 0, 1); break;
      default:      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }


    const result = await Booking.aggregate([
      { $unwind: '$transactions' },
      {
        $project: {
          _id: 0,
          booking_object_id: '$_id',
          txn_id:          '$transactions.txn_id',
          datetime:        '$transactions.datetime',
          description:     '$transactions.description',
          amount:          '$transactions.amount',
          payment_method:  '$transactions.payment_method',
          payment_details: '$transactions.payment_details',
          status:          '$transactions.status',
          booking_id:      '$booking_id',
          guest_name:      '$guest.full_name',
          room_number:     '$room_number',
        }
      }
    ]);


    const parse = (str) => parseFloat((str || '0').replace(/,/g, '')) || 0;


    const totalIncome = result
      .filter(t => t.status === 'COMPLETED' && parse(t.amount) > 0)
      .reduce((sum, t) => sum + parse(t.amount), 0);


    const totalExpenses = result
      .filter(t => t.status === 'COMPLETED' && parse(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(parse(t.amount)), 0);


    const outstanding = result
      .filter(t => t.status === 'PENDING')
      .reduce((sum, t) => sum + parse(t.amount), 0);


    res.json({
      transactions: result,
      kpis: {
        totalIncome,
        totalExpenses,
        netRevenue: totalIncome - totalExpenses,
        outstanding
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});


// ─────────────────────────────────────────────
// EMPLOYEES
// ─────────────────────────────────────────────




app.get('/api/employees', async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter['employment_details.department'] = req.query.department;
    if (req.query.status)     filter['employment_details.status'] = req.query.status;
    const employees = await Employee.find(filter).sort({ full_name: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});




app.post('/api/employees', async (req, res) => {
  try {
    const employee = new Employee(req.body);
    const saved = await employee.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create employee' });
  }
});




app.put('/api/employees/:id', async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Employee not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});




app.delete('/api/employees/:id', async (req, res) => {
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Employee not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});


// ─────────────────────────────────────────────
// SHIFTS
// ─────────────────────────────────────────────




app.get('/api/shifts', async (req, res) => {
  try {
    const shifts = await Shift.find().sort({ shift_id: 1 });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});


// ─────────────────────────────────────────────
// SHIFT ASSIGNMENTS
// ─────────────────────────────────────────────




app.get('/api/shift-assignments', async (req, res) => {
  try {
    const filter = {};
    if (req.query.startDate && req.query.endDate) {
      filter.shift_date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }
    const assignments = await ShiftAssignment.find(filter).sort({ shift_date: 1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shift assignments' });
  }
});




app.patch('/api/shift-assignments/upsert', async (req, res) => {
  try {
    const { employee_id, shift_date, shift_id, status } = req.body;
    const dateObj = new Date(shift_date);


    const existing = await ShiftAssignment.findOne({
      employee_id,
      shift_date: {
        $gte: new Date(dateObj.toISOString().slice(0, 10)),
        $lt:  new Date(new Date(dateObj.getTime() + 86400000).toISOString().slice(0, 10)),
      },
    });


    let result;
    if (existing) {
      existing.shift_id = shift_id;
      existing.status   = status || 'PUBLISHED';
      result = await existing.save();
    } else {
      const maxDoc = await ShiftAssignment.findOne().sort({ assignment_id: -1 });
      const nextId = (maxDoc?.assignment_id || 0) + 1;
      result = await ShiftAssignment.create({
        assignment_id: nextId,
        employee_id,
        shift_date: dateObj,
        shift_id,
        status: status || 'PUBLISHED',
      });
    }
    res.json(result);
  } catch (error) {
    console.error('Upsert assignment error:', error);
    res.status(500).json({ error: 'Failed to upsert assignment', detail: error.message });
  }
});




app.put('/api/shift-assignments/:id', async (req, res) => {
  try {
    const updated = await ShiftAssignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Assignment not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});




app.delete('/api/shift-assignments/:id', async (req, res) => {
  try {
    const deleted = await ShiftAssignment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});




app.post('/api/shift-assignments', async (req, res) => {
  try {
    const assignment = new ShiftAssignment(req.body);
    const saved = await assignment.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});


// ─────────────────────────────────────────────
// AUDITS
// ─────────────────────────────────────────────




app.get('/api/audits', async (req, res) => {
  try {
    const audits = await Audit.find().sort({ datetime: -1 });
    res.json(audits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});


app.post('/api/audits', async (req, res) => {
  try {
    const audit = new Audit(req.body);
    const saved = await audit.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create audit entry' });
  }
});


// ─────────────────────────────────────────────
// DASHBOARD OVERVIEW
// ─────────────────────────────────────────────


app.get('/api/dashboard/overview', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);


    const [
      totalArrivals,
      checkedInArrivals,
      totalDepartures,
      checkedOutDepartures,
      inHouseTotal,
      inHouseWithBalance,
      totalBookings,
      confirmedBookings,
      checkedInBookings,
      totalRooms,
      occupiedRooms,
      vacantRooms,
      maintenanceRooms,
      recentAudits,
    ] = await Promise.all([
      Booking.countDocuments({ 'dates.check_in': today }),
      Booking.countDocuments({ 'dates.check_in': today, status: 'Checked In' }),
      Booking.countDocuments({ 'dates.check_out': today, status: { $in: ['Checked In', 'Confirmed'] } }),
      Booking.countDocuments({ 'dates.check_out': today, status: 'Checked Out' }),
      Booking.countDocuments({ status: 'Checked In' }),
      Booking.countDocuments({ status: 'Checked In', 'billing.balance_due': { $nin: ['0.00', '0', null, ''] } }),
      Booking.countDocuments({}),
      Booking.countDocuments({ status: 'Confirmed' }),
      Booking.countDocuments({ status: 'Checked In' }),
      Room.countDocuments({}),
      Room.countDocuments({ status: 'Occupied' }),
      Room.countDocuments({ status: 'Vacant' }),
      Room.countDocuments({ status: 'Maintenance' }),
      Audit.find({}).sort({ datetime: -1 }).limit(5),
    ]);


    const pendingArrivals = totalArrivals - checkedInArrivals;
    const pendingDepartures = totalDepartures - checkedOutDepartures;


    const recentActivity = recentAudits.map(a => ({
      id: a._id,
      type: a.action_type,
      text: a.description,
      time: a.datetime,
      icon: 'fa-circle-info',
    }));


    res.json({
      arrivals:   { total: totalArrivals, pending: pendingArrivals, checkedIn: checkedInArrivals, vip: 0 },
      departures: { total: totalDepartures, pending: pendingDepartures, checkedOut: checkedOutDepartures, balanceDue: 0 },
      inHouse:    { total: inHouseTotal, balanceOutstanding: inHouseWithBalance },
      bookings:   { total: totalBookings, confirmed: confirmedBookings, checkedIn: checkedInBookings },
      rooms:      { total: totalRooms, occupied: occupiedRooms, vacant: vacantRooms, maintenance: maintenanceRooms },
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});


// ─────────────────────────────────────────────
// START SERVER (only after MongoDB connects)
// ─────────────────────────────────────────────


const PORT = process.env.PORT || 5000;


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully!');
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

