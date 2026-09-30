

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// The JWT secret MUST be provided via the environment. In production we refuse
// to start without it — falling back to a hardcoded, publicly-known secret would
// let anyone forge admin tokens. In development we allow a clearly-labelled
// fallback but warn loudly so it's never mistaken for a real secret.
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (IS_PRODUCTION) {
    console.error('❌ JWT_SECRET is not set. Refusing to start in production without it.');
    process.exit(1);
  }
  console.warn('⚠️  JWT_SECRET is not set — using an INSECURE development fallback. Set JWT_SECRET before deploying.');
  JWT_SECRET = 'dev-fallback-secret-set-JWT_SECRET-in-env';
}
const TOKEN_TTL = '12h'; // tokens expire after a shift-length window


const Room = require('./models/Room');
const RoomType = require('./models/RoomType');
const Booking = require('./models/Booking');
const Employee = require('./models/Employee');
const Shift = require('./models/Shift');
const ShiftAssignment = require('./models/ShiftAssignment');
const Audit = require('./models/Audit');
const GuestRequest = require('./models/GuestRequest');
const CleaningTask = require('./models/CleaningTask');
const LostAndFound = require('./models/LostAndFound');
const MaintenanceRequest = require('./models/MaintenanceRequest');
const HousekeepingLog = require('./models/HousekeepingLog');


const app = express();

// Restrict CORS to known front-end origins instead of allowing any site to call
// the API. Set CORS_ORIGIN to a comma-separated list of allowed origins in
// production (e.g. "https://hms.jofiane.com"). Defaults to the CRA dev server.
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    // Allow non-browser clients (curl, server-to-server) that send no Origin.
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
}));
// Raised from the 100kb default so base64 profile photos (a 2MB image is
// ~2.7MB once base64-encoded) fit in the request body.
app.use(express.json({ limit: '5mb' }));


// ─────────────────────────────────────────────
// VALIDATION HELPERS
// Shared guards for update/delete routes so callers can't inject
// unexpected fields, MongoDB operators, or malformed ids.
// ─────────────────────────────────────────────

// True only for a well-formed Mongo ObjectId. Guards against CastErrors
// and lookups on attacker-controlled junk ids.
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Reject keys that start with "$" (update operators like $rename/$unset/$inc)
// or contain "." only where we explicitly allow it. Blocks operator injection.
const hasMongoOperators = (obj) =>
  obj && typeof obj === 'object' &&
  Object.keys(obj).some(k => k.startsWith('$'));

// Build a $set object from an incoming payload, keeping only allowed dot-paths.
// Accepts either a raw flat object or an already-{$set:{...}} wrapped body.
// Anything not on the allow-list is silently dropped. Returns { $set } or null
// if nothing valid remains.
const buildSafeSet = (body, allowedPaths) => {
  const source = (body && typeof body.$set === 'object') ? body.$set : body;
  if (!source || typeof source !== 'object') return null;
  const set = {};
  for (const path of allowedPaths) {
    if (Object.prototype.hasOwnProperty.call(source, path) && source[path] !== undefined) {
      set[path] = source[path];
    }
  }
  return Object.keys(set).length ? { $set: set } : null;
};

// ── Employee: fields an admin is allowed to write via update ──
const EMPLOYEE_ALLOWED_PATHS = [
  'full_name',
  'photo',
  'contact.email',
  'contact.phone',
  'portal_access.username',
  'portal_access.has_access',
  'portal_access.password',
  'employment_details.hire_date',
  'employment_details.status',
  'employment_details.department',
  'employment_details.role.title',
  'employment_details.role.base_salary',
];

const VALID_EMP_STATUS = ['ACTIVE', 'ON LEAVE', 'TERMINATED', 'INACTIVE'];
const isValidEmail = (e) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Password policy: 5–8 chars, with an uppercase, a lowercase, a number,
// and a special character. Returns an error string, or null if valid.
const PASSWORD_RULE_MSG =
  'Password must be 5–8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';
const validatePasswordPolicy = (pw) => {
  const s = String(pw || '');
  if (s.length < 5 || s.length > 8) return PASSWORD_RULE_MSG;
  if (!/[A-Z]/.test(s))            return PASSWORD_RULE_MSG;
  if (!/[a-z]/.test(s))            return PASSWORD_RULE_MSG;
  if (!/[0-9]/.test(s))            return PASSWORD_RULE_MSG;
  if (!/[^A-Za-z0-9]/.test(s))     return PASSWORD_RULE_MSG;
  return null;
};

// Field-level validation for an employee $set payload. Returns an error string
// or null if everything checks out.
const validateEmployeeSet = (set) => {
  if ('full_name' in set) {
    const n = String(set['full_name'] || '').trim();
    if (n.length < 2) return 'Full name must be at least 2 characters';
  }
  if ('contact.email' in set && set['contact.email'] && !isValidEmail(set['contact.email'])) {
    return 'Invalid email address';
  }
  if ('employment_details.status' in set &&
      !VALID_EMP_STATUS.includes(String(set['employment_details.status']).toUpperCase())) {
    return `Invalid status. Allowed: ${VALID_EMP_STATUS.join(', ')}`;
  }
  if ('employment_details.role.base_salary' in set) {
    const s = Number(set['employment_details.role.base_salary']);
    if (Number.isNaN(s) || s < 0) return 'Salary must be a non-negative number';
  }
  return null;
};

// Is this employee an admin? (department contains "admin")
const isAdminEmployee = (emp) =>
  (emp?.employment_details?.department || '').toLowerCase().includes('admin');


// ─────────────────────────────────────────────
// MONEY / BILLING HELPERS
// The transaction ledger is the single source of truth. Every money route
// mutates the ledger, then calls recomputeBilling() so expected_total,
// total_paid and balance_due are always derived consistently.
//
// Each (non-voided) transaction is one of three kinds:
//   charge  — what the guest owes (room charge, F&B, penalty). amount > 0.
//   payment — money received (deposit, balance payment).       amount > 0.
//   refund  — money returned to the guest.                      amount < 0.
// We infer the kind from the transaction's fields so existing records (which
// have no explicit type) still classify correctly.
// ─────────────────────────────────────────────

// Parse a money string like "12,500.00" (or "-2,100.00") into a Number.
const money = (str) => parseFloat(String(str ?? '0').replace(/,/g, '')) || 0;

// Format a Number back into the stored "12,500.00" string form.
const moneyStr = (n) => Number(n || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});

// Classify a transaction as 'charge' | 'payment' | 'refund'.
// Prefers an explicit t.type if present; otherwise infers from amount sign,
// payment_method and description keywords.
const classifyTxn = (t) => {
  if (!t) return 'charge';
  const explicit = String(t.type || '').toLowerCase();
  if (explicit === 'charge' || explicit === 'payment' || explicit === 'refund') return explicit;

  const amt = money(t.amount);
  const desc = String(t.description || '').toLowerCase();
  const method = String(t.payment_method || '').toLowerCase();

  // Negative amounts are money leaving the till → refunds.
  if (amt < 0 || desc.includes('refund')) return 'refund';

  // Charges: things the guest owes. Penalties/fees and explicit "charge" lines.
  if (method === 'penalty' || desc.includes('charge') || desc.includes('penalty') ||
      desc.includes('fee') || desc.includes('minibar') || desc.includes('f&b') ||
      desc.includes('room service') || desc.includes('laundry') || desc.includes('spa')) {
    return 'charge';
  }

  // Everything else positive is treated as a payment (deposit / balance payment).
  return 'payment';
};

// Recompute billing totals from the ledger (ignoring VOIDED transactions) and
// write them back onto the booking object. Returns the same booking.
//   expected_total = sum of charges
//   total_paid     = sum of payments  − sum of |refunds|
//   balance_due    = max(0, expected_total − total_paid)
const recomputeBilling = (booking) => {
  const txns = (booking.transactions || []).filter(
    t => String(t.status || '').toUpperCase() !== 'VOIDED'
  );

  let charges = 0, payments = 0, refunds = 0;
  for (const t of txns) {
    const kind = classifyTxn(t);
    const amt = Math.abs(money(t.amount));
    if (kind === 'charge')       charges  += amt;
    else if (kind === 'payment') payments += amt;
    else if (kind === 'refund')  refunds  += amt;
  }

  // If the booking already carried an expected_total that isn't represented as
  // charge transactions (e.g. legacy bookings whose room total was stored only
  // in billing), keep the larger of the two so we never understate what's owed.
  const storedExpected = money(booking.billing?.expected_total);
  const expectedTotal = Math.max(charges, storedExpected);

  const totalPaid = Math.max(0, payments - refunds);
  const balanceDue = Math.max(0, expectedTotal - totalPaid);

  booking.billing = {
    ...(booking.billing || {}),
    expected_total: moneyStr(expectedTotal),
    total_paid: moneyStr(totalPaid),
    balance_due: moneyStr(balanceDue),
  };
  return booking;
};


// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────




app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }




    const employee = await Employee.findOne({
      'portal_access.username': { $regex: `^${username}$`, $options: 'i' },
      'portal_access.has_access': true,
    });


    if (!employee) {
      return res.status(401).json({ error: 'Invalid credentials or portal access not granted' });
    }


    // Verify password. Stored hashes start with "$2" (bcrypt). Accounts that
    // haven't been migrated yet still hold plain text — accept those too so no
    // one is locked out, then transparently upgrade them to a hash on login.
    const stored = employee.portal_access.password || '';
    const looksHashed = stored.startsWith('$2');
    let passwordOk;
    if (looksHashed) {
      passwordOk = await bcrypt.compare(password, stored);
    } else {
      passwordOk = stored === password;
      if (passwordOk) {
        // Lazy migration: replace the plain-text password with a hash.
        const hash = await bcrypt.hash(password, 10);
        await Employee.updateOne(
          { _id: employee._id },
          { $set: { 'portal_access.password': hash } }
        );
      }
    }
    if (!passwordOk) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }


    // Determine department for routing to correct module
    const dept = (employee.employment_details?.department || '').toLowerCase();
    let module = 'frontdesk'; // default
    if (dept.includes('housekeeping'))  module = 'housekeeping';
    else if (dept.includes('maintenance')) module = 'maintenance';
    else if (dept.includes('admin'))    module = 'admin';

    const role = module === 'admin' ? 'admin' : 'employee';

    // Sign a JWT carrying identity + role. The middleware trusts this token
    // instead of re-querying the DB on every request.
    const token = jwt.sign(
      {
        sub:      String(employee._id),
        username: employee.portal_access.username,
        role,
        module,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_TTL }
    );

    res.json({
      token,
      role,
      module,
      employee: {
        _id:         employee._id,
        employee_id: employee.employee_id,   // numeric id that tasks/requests reference
        name:        employee.full_name,
        email:       employee.contact?.email,
        department:  employee.employment_details?.department,
        role:        employee.employment_details?.role?.title,
        username:    employee.portal_access.username,
        photo:       employee.photo || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', detail: error.message });
  }
});


// ─────────────────────────────────────────────
// AUTH MIDDLEWARE
// requireAuth  → caller must present a valid, unexpired token (else 401)
// requireAdmin → caller must additionally be an admin (else 403)
// ─────────────────────────────────────────────

// Verify the Bearer token and attach the decoded payload to req.user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    // Covers both tampered tokens and expired ones.
    const expired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      error: expired ? 'Session expired. Please log in again.' : 'Invalid authentication token.',
    });
  }
}

// Gate a route to admins only. Must run after requireAuth.
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required for this action.' });
  }
  next();
}


// ─────────────────────────────────────────────
// CHANGE OWN PASSWORD
// Any logged-in user can change their own password. They must prove they
// know the current one. The token identifies who they are (req.user.sub),
// so a user can never change someone else's password through this route.
// ─────────────────────────────────────────────
app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    const policyError = validatePasswordPolicy(newPassword);
    if (policyError) {
      return res.status(400).json({ error: policyError });
    }
    if (String(newPassword) === String(currentPassword)) {
      return res.status(400).json({ error: 'New password must be different from the current one.' });
    }

    const employee = await Employee.findById(req.user.sub);
    if (!employee) return res.status(404).json({ error: 'Account not found.' });

    // Verify the current password. Handle both hashed and any lingering
    // plain-text password the same way the login route does.
    const stored = employee.portal_access?.password || '';
    const currentOk = stored.startsWith('$2')
      ? await bcrypt.compare(currentPassword, stored)
      : stored === currentPassword;
    if (!currentOk) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hash = await bcrypt.hash(String(newPassword), 10);
    await Employee.updateOne(
      { _id: employee._id },
      { $set: { 'portal_access.password': hash } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password', detail: error.message });
  }
});


// ─────────────────────────────────────────────
// UPDATE OWN PROFILE
// Any logged-in user can update THEIR OWN name / email / photo (identified by
// the token's sub). It never touches role, department, salary, or the login
// username — so non-admins can save their profile without admin rights.
// ─────────────────────────────────────────────
app.put('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    if (hasMongoOperators(body)) {
      return res.status(400).json({ error: 'Update operators are not allowed' });
    }

    // Defense-in-depth: the client tells us WHO it thinks it is (expectUsername).
    // If that doesn't match the token's identity, the token is stale/mismatched —
    // reject rather than silently updating the wrong person's record.
    if (body.expectUsername && req.user.username &&
        String(body.expectUsername).toLowerCase() !== String(req.user.username).toLowerCase()) {
      return res.status(409).json({
        error: 'Your session no longer matches this account. Please log out and log in again.',
      });
    }

    const set = {};
    if (typeof body.full_name === 'string') {
      const n = body.full_name.trim();
      if (n.length < 2) return res.status(400).json({ error: 'Full name must be at least 2 characters' });
      set['full_name'] = n;
    }
    if (typeof body.email === 'string') {
      if (body.email && !isValidEmail(body.email)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }
      set['contact.email'] = body.email;
    }
    if (typeof body.photo === 'string') {
      set['photo'] = body.photo;
    }

    if (!Object.keys(set).length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updated = await Employee.findByIdAndUpdate(
      req.user.sub,
      { $set: set },
      { new: true, runValidators: true }
    ).select('-portal_access.password');
    if (!updated) return res.status(404).json({ error: 'Account not found.' });

    res.json({
      success: true,
      employee: {
        _id:        updated._id,
        name:       updated.full_name,
        email:      updated.contact?.email,
        department: updated.employment_details?.department,
        role:       updated.employment_details?.role?.title,
        username:   updated.portal_access?.username,
        photo:      updated.photo || null,
      },
    });
  } catch (error) {
    console.error('Update own profile error:', error);
    res.status(500).json({ error: 'Failed to update profile', detail: error.message });
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

// PUT update a room by _id (housekeeping status, assignment, notes, etc.)
app.put('/api/rooms/:id', requireAuth, async (req, res) => {
  try {
    const updated = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Room not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update room' });
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




app.delete('/api/bookings/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid booking id' });
    }
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




app.post('/api/bookings/:id/cancel', requireAuth, async (req, res) => {
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


    booking.status = 'Cancelled';
    booking.cancellation = {
      cancelled_by: cancelled_by || 'Staff',
      cancelled_at: new Date().toLocaleString('en-CA', { hour12: false }).replace(',', ''),
      reason: reason || 'Guest request',
      penalty_applied: !!penalty_applied,
      penalty_amount: penalty_applied ? moneyStr(money(penalty_amount)) : '0.00',
    };

    // A cancellation penalty is a CHARGE the guest owes.
    if (penalty_applied && money(penalty_amount) > 0) {
      booking.transactions.push({
        txn_id: `TXN-${Date.now()}`,
        datetime: new Date().toLocaleString('en-CA', { hour12: false }).replace(',', ''),
        description: `Cancellation Penalty - ${reason || 'Guest request'}`,
        amount: moneyStr(money(penalty_amount)),
        payment_method: 'Penalty',
        payment_details: `Cancelled by ${cancelled_by || 'Staff'}`,
        status: 'COMPLETED',
      });
    }

    recomputeBilling(booking);
    const updated = await booking.save();
    res.json(updated);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking', detail: error.message });
  }
});




app.post('/api/bookings', requireAuth, async (req, res) => {
  try {
    const booking = new Booking(req.body);
    // Keep billing consistent with whatever transactions the booking was
    // created with (deposit payments, room charges, etc.).
    recomputeBilling(booking);
    const saved = await booking.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});




app.put('/api/bookings/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid booking id' });
    }
    if (hasMongoOperators(req.body)) {
      return res.status(400).json({ error: 'Update operators are not allowed' });
    }

    // Never let this generic route rewrite the ledger or the id. Transactions
    // must go through the dedicated void/refund routes that enforce their rules.
    const update = { ...req.body };
    delete update._id;
    delete update.transactions;
    delete update.booking_id;

    if (!Object.keys(update).length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Booking not found' });
    res.json(updated);
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking', detail: error.message });
  }
});




app.post('/api/bookings/:id/checkin', requireAuth, async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'Checked In' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Booking not found' });

    // Keep the linked room in sync so room-based views (RoomRack, Housekeeping)
    // reflect the in-house guest. Best-effort: don't fail check-in if no match.
    const roomNum = String(updated.room_number || '').trim();
    if (roomNum) {
      await Room.updateOne({ room_number: roomNum }, { $set: { status: 'Occupied' } });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check in' });
  }
});


// POST check-out: set status to "Checked Out"
app.post('/api/bookings/:id/checkout', requireAuth, async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'Checked Out' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Booking not found' });

    // Free up the linked room. Flag it dirty for housekeeping to turn over.
    const roomNum = String(updated.room_number || '').trim();
    if (roomNum) {
      await Room.updateOne(
        { room_number: roomNum },
        { $set: { status: 'Vacant', housekeeping: 'Dirty' } }
      );
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check out' });
  }
});




app.post('/api/bookings/:id/transactions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    booking.transactions.push(req.body);
    recomputeBilling(booking);           // keep billing in sync with the ledger
    const saved = await booking.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});


app.patch('/api/bookings/:id/transactions/:txnId/void', requireAuth, requireAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking or transaction not found' });

    const txn = (booking.transactions || []).find(t => t.txn_id === req.params.txnId);
    if (!txn) return res.status(404).json({ error: 'Booking or transaction not found' });

    txn.status = 'VOIDED';
    recomputeBilling(booking);           // voiding a payment reopens the balance, etc.
    const saved = await booking.save();
    res.json(saved);
  } catch (error) {
    console.error('Void transaction error:', error);
    res.status(500).json({ error: 'Failed to void transaction' });
  }
});


// ─────────────────────────────────────────────
// RECORD A PAYMENT against a booking's balance (staff-level).
// Adds a PAYMENT transaction and recomputes billing so the balance drops.
// ─────────────────────────────────────────────
app.post('/api/bookings/:id/payments', requireAuth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid booking id' });
    }
    const amountNum = money(req.body?.amount);
    if (!(amountNum > 0)) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const currentBalance = money(booking.billing?.balance_due);
    if (amountNum > currentBalance + 0.005) {
      return res.status(400).json({
        error: `Payment (₱${moneyStr(amountNum)}) exceeds the outstanding balance (₱${moneyStr(currentBalance)}).`,
      });
    }

    booking.transactions.push({
      txn_id: `TXN-${Date.now()}`,
      type: 'payment',
      datetime: new Date().toLocaleString('en-CA', { hour12: false }).replace(',', ''),
      description: 'Payment received',
      amount: moneyStr(amountNum),
      payment_method: String(req.body?.payment_method || 'Cash'),
      payment_details: req.body?.reference ? String(req.body.reference) : 'Front Desk',
      status: 'COMPLETED',
    });

    recomputeBilling(booking);
    const saved = await booking.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Failed to record payment', detail: error.message });
  }
});


// ─────────────────────────────────────────────
// ISSUE A REFUND against a booking (admin-level).
// Adds a REFUND transaction (money out), capped at what has been paid, and
// recomputes billing so the balance rises by the refunded amount.
// ─────────────────────────────────────────────
app.post('/api/bookings/:id/refunds', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid booking id' });
    }
    const amountNum = money(req.body?.amount);
    if (!(amountNum > 0)) {
      return res.status(400).json({ error: 'Refund amount must be greater than zero.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const totalPaid = money(booking.billing?.total_paid);
    if (amountNum > totalPaid + 0.005) {
      return res.status(400).json({
        error: `Refund (₱${moneyStr(amountNum)}) exceeds the amount paid (₱${moneyStr(totalPaid)}).`,
      });
    }

    booking.transactions.push({
      txn_id: `TXN-${Date.now()}`,
      type: 'refund',
      datetime: new Date().toLocaleString('en-CA', { hour12: false }).replace(',', ''),
      description: `Refund - ${req.body?.reason || 'Guest request'}`,
      amount: `-${moneyStr(amountNum)}`,   // negative = money out
      payment_method: String(req.body?.payment_method || 'Cash'),
      payment_details: req.body?.reference ? String(req.body.reference) : 'Front Desk',
      status: 'COMPLETED',
    });

    recomputeBilling(booking);
    const saved = await booking.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Issue refund error:', error);
    res.status(500).json({ error: 'Failed to issue refund', detail: error.message });
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
          type:            '$transactions.type',
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

    // Only COMPLETED transactions count toward money in/out; VOIDED are ignored.
    const completed = result.filter(t => String(t.status || '').toUpperCase() === 'COMPLETED');

    // Income = money actually received (payments). Charges are what's owed, not
    // cash in hand, so they don't count as income here.
    const totalIncome = completed
      .filter(t => classifyTxn(t) === 'payment')
      .reduce((sum, t) => sum + Math.abs(money(t.amount)), 0);

    // Money out = refunds returned to guests.
    const totalExpenses = completed
      .filter(t => classifyTxn(t) === 'refund')
      .reduce((sum, t) => sum + Math.abs(money(t.amount)), 0);

    // Outstanding = the sum of every booking's current balance due (live figure),
    // independent of the selected period.
    const activeBookings = await Booking.find(
      { status: { $nin: ['Cancelled'] } },
      { 'billing.balance_due': 1 }
    );
    const outstanding = activeBookings.reduce(
      (sum, b) => sum + money(b.billing?.balance_due), 0
    );

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
    console.error('Fetch transactions error:', error);
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
    // Never expose the (hashed) password to the client.
    const employees = await Employee.find(filter)
      .select('-portal_access.password')
      .sort({ full_name: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});




app.post('/api/employees', requireAuth, requireAdmin, async (req, res) => {
  try {
    const body = { ...req.body };
    // Hash the portal password before storing (if one was provided).
    if (body.portal_access && body.portal_access.password) {
      const policyError = validatePasswordPolicy(body.portal_access.password);
      if (policyError) return res.status(400).json({ error: policyError });
      body.portal_access = {
        ...body.portal_access,
        password: await bcrypt.hash(String(body.portal_access.password), 10),
      };
    }
    const employee = new Employee(body);
    const saved = await employee.save();
    // Strip the password hash from the response.
    const out = saved.toObject();
    if (out.portal_access) delete out.portal_access.password;
    res.status(201).json(out);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee', detail: error.message });
  }
});




app.put('/api/employees/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    // 1. Validate the id shape before touching the DB.
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid employee id' });
    }

    // 2. Reject raw operator injection ($rename, $unset, $inc, ...).
    //    We only ever accept a whitelisted $set (or flat) payload.
    const rawSource = (req.body && typeof req.body.$set === 'object') ? req.body.$set : req.body;
    if (hasMongoOperators(rawSource)) {
      return res.status(400).json({ error: 'Update operators are not allowed' });
    }

    // 3. Whitelist fields — anything not explicitly allowed is dropped.
    const safeUpdate = buildSafeSet(req.body, EMPLOYEE_ALLOWED_PATHS);
    if (!safeUpdate) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // 4. Field-level validation (email format, status enum, salary range, ...).
    const fieldError = validateEmployeeSet(safeUpdate.$set);
    if (fieldError) return res.status(400).json({ error: fieldError });

    // 4b. If a new portal password was supplied, validate + hash it.
    if (safeUpdate.$set['portal_access.password']) {
      const policyError = validatePasswordPolicy(safeUpdate.$set['portal_access.password']);
      if (policyError) return res.status(400).json({ error: policyError });
      safeUpdate.$set['portal_access.password'] =
        await bcrypt.hash(String(safeUpdate.$set['portal_access.password']), 10);
    }

    // 5. Guard: don't let the last active admin be demoted or deactivated,
    //    which would lock everyone out of the admin module.
    const target = await Employee.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Employee not found' });

    if (isAdminEmployee(target)) {
      const newDept   = safeUpdate.$set['employment_details.department'];
      const newStatus = safeUpdate.$set['employment_details.status'];
      const losingAdmin =
        (newDept   && !String(newDept).toLowerCase().includes('admin')) ||
        (newStatus && String(newStatus).toUpperCase() !== 'ACTIVE');
      if (losingAdmin) {
        const activeAdmins = await Employee.countDocuments({
          'employment_details.department': { $regex: 'admin', $options: 'i' },
          'employment_details.status': 'ACTIVE',
        });
        if (activeAdmins <= 1) {
          return res.status(409).json({
            error: 'Cannot demote or deactivate the last active admin account.',
          });
        }
      }
    }

    // 6. Run schema validators on the update.
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      safeUpdate,
      { new: true, runValidators: true }
    ).select('-portal_access.password');
    if (!updated) return res.status(404).json({ error: 'Employee not found' });
    res.json(updated);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee', detail: error.message });
  }
});




app.delete('/api/employees/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    // 1. Validate id shape.
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid employee id' });
    }

    // 2. Load first so we can run protective checks before deleting.
    const target = await Employee.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Employee not found' });

    // 3. Never delete the last active admin — that would lock out the admin module.
    if (isAdminEmployee(target)) {
      const activeAdmins = await Employee.countDocuments({
        'employment_details.department': { $regex: 'admin', $options: 'i' },
        'employment_details.status': 'ACTIVE',
      });
      if (activeAdmins <= 1) {
        return res.status(409).json({
          error: 'Cannot delete the last active admin account.',
        });
      }
    }

    // 4. Dependency check: block deletion while the employee still has shift
    //    assignments, so schedules don't end up pointing at a ghost record.
    //    (Consistent with how bookings block delete when transactions exist.)
    const assignedShifts = await ShiftAssignment.countDocuments({
      employee_id: target.employee_id,
    });
    if (assignedShifts > 0) {
      return res.status(409).json({
        error: 'Cannot delete an employee with existing shift assignments. Reassign or remove their shifts first.',
      });
    }

    await Employee.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to delete employee', detail: error.message });
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




app.patch('/api/shift-assignments/upsert', requireAuth, requireAdmin, async (req, res) => {
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




app.put('/api/shift-assignments/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updated = await ShiftAssignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Assignment not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});




app.delete('/api/shift-assignments/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await ShiftAssignment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});




app.post('/api/shift-assignments', requireAuth, requireAdmin, async (req, res) => {
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


app.post('/api/audits', requireAuth, requireAdmin, async (req, res) => {
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
      rooms:      (() => {
        // Occupancy driven by checked-in bookings (source of truth), capped at total.
        const occ = Math.min(checkedInBookings, totalRooms);
        return { total: totalRooms, occupied: occ, vacant: Math.max(totalRooms - occ - maintenanceRooms, 0), maintenance: maintenanceRooms };
      })(),
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});


// ─────────────────────────────────────────────
// ADMIN OPERATIONS MONITOR
// One aggregated call powering the admin Overview dashboard.
// Everything here is live from the database.
// ─────────────────────────────────────────────
app.get('/api/dashboard/admin-operations', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const parseAmt = (str) => parseFloat((str || '0').replace(/,/g, '')) || 0;

    // Pull the raw collections we need
    const [
      rooms,
      allBookings,
      inHouseBookings,
      hkCleaningPending,
      guestReqPending,
      maintPending,
      maintCritical,
      recentAudits,
      hkStaffTotal,
      hkStaffActive,
      fdStaffActive,
    ] = await Promise.all([
      Room.find({}),
      Booking.find({}),
      Booking.find({ status: 'Checked In' }),
      CleaningTask.countDocuments({ status: { $ne: 'COMPLETED' } }),
      GuestRequest.countDocuments({ status: { $ne: 'COMPLETED' } }),
      MaintenanceRequest.countDocuments({ status: { $ne: 'COMPLETED' } }),
      MaintenanceRequest.countDocuments({ status: { $ne: 'COMPLETED' }, priority: 'URGENT' }),
      Audit.find({}).sort({ datetime: -1 }).limit(8),
      Employee.countDocuments({ 'employment_details.department': 'Housekeeping' }),
      Employee.countDocuments({ 'employment_details.department': 'Housekeeping', 'employment_details.status': 'ACTIVE' }),
      Employee.countDocuments({ 'employment_details.department': 'Front Desk', 'employment_details.status': 'ACTIVE' }),
    ]);

    // ── ROOM STATUS (live) ──
    // Occupancy is driven by checked-in bookings (the source of truth for who is
    // in-house) rather than Room.status, which can drift out of sync. We cap it at
    // the total room count so the rate never exceeds 100%.
    const maintenanceRooms = rooms.filter(r => (r.status || '').toLowerCase() === 'maintenance').length;
    const occupiedCount    = Math.min(inHouseBookings.length, rooms.length);
    const roomStatus = {
      total:       rooms.length,
      occupied:    occupiedCount,
      vacant:      Math.max(rooms.length - occupiedCount - maintenanceRooms, 0),
      maintenance: maintenanceRooms,
      // "cleaning" = rooms flagged dirty / in progress by housekeeping
      cleaning:    rooms.filter(r => ['dirty', 'in progress'].includes((r.housekeeping || '').toLowerCase())).length,
    };
    const occupancyRate = roomStatus.total > 0
      ? Math.round((roomStatus.occupied / roomStatus.total) * 1000) / 10
      : 0;

    // ── TODAY'S OPERATIONS (live from bookings) ──
    const arrivalsToday   = allBookings.filter(b => b.dates?.check_in  === today);
    const departuresToday = allBookings.filter(b => b.dates?.check_out === today);
    const ops = {
      arrivals: {
        total:     arrivalsToday.length,
        pending:   arrivalsToday.filter(b => b.status === 'Confirmed').length,
        checkedIn: arrivalsToday.filter(b => b.status === 'Checked In').length,
      },
      departures: {
        total:      departuresToday.length,
        pending:    departuresToday.filter(b => ['Checked In', 'Confirmed'].includes(b.status)).length,
        checkedOut: departuresToday.filter(b => b.status === 'Checked Out').length,
      },
      inHouse: {
        total:      inHouseBookings.length,
        balanceDue: inHouseBookings.filter(b => parseAmt(b.billing?.balance_due) > 0).length,
      },
    };

    // ── REVENUE (live: sum of all COMPLETED transactions across bookings) ──
    let todayRevenue = 0, totalRevenue = 0, outstanding = 0;
    allBookings.forEach(b => {
      (b.transactions || []).forEach(t => {
        const amt = parseAmt(t.amount);
        if (t.status === 'COMPLETED') {
          totalRevenue += amt;
          if ((t.datetime || '').slice(0, 10) === today) todayRevenue += amt;
        }
      });
      outstanding += parseAmt(b.billing?.balance_due);
    });

    // ── 7-DAY REVENUE TREND (live, from transaction datetimes) ──
    const dayKeys = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayKeys.push({
        iso:   d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }
    const revenueByDay = dayKeys.map(dk => {
      let sum = 0;
      allBookings.forEach(b => (b.transactions || []).forEach(t => {
        if (t.status === 'COMPLETED' && (t.datetime || '').slice(0, 10) === dk.iso) {
          sum += parseAmt(t.amount);
        }
      }));
      return { day: dk.label, value: Math.round(sum) };
    });

    // ── 7-DAY BOOKINGS TREND (live, by check-in date) ──
    const bookingsByDay = dayKeys.map(dk => ({
      day:   dk.label,
      count: allBookings.filter(b => b.dates?.check_in === dk.iso).length,
    }));

    // ── DEPARTMENT HEALTH (live signals) ──
    const departmentHealth = [
      {
        dept: 'Front Desk',
        status: ops.arrivals.pending > 0
          ? `${ops.arrivals.pending} arrivals pending`
          : 'All clear',
        level: ops.arrivals.pending > 5 ? 'warning' : 'good',
        detail: `${fdStaffActive} staff active`,
      },
      {
        dept: 'Housekeeping',
        status: roomStatus.cleaning > 0
          ? `${roomStatus.cleaning} rooms to clean`
          : 'All rooms clean',
        level: roomStatus.cleaning > 5 ? 'warning' : roomStatus.cleaning > 0 ? 'warning' : 'good',
        detail: `${hkStaffActive}/${hkStaffTotal} staff active`,
      },
      {
        dept: 'Maintenance',
        status: maintCritical > 0
          ? `${maintCritical} urgent order${maintCritical > 1 ? 's' : ''}`
          : maintPending > 0 ? `${maintPending} open order${maintPending > 1 ? 's' : ''}` : 'No open orders',
        level: maintCritical > 0 ? 'critical' : maintPending > 0 ? 'warning' : 'good',
        detail: `${maintPending} total open`,
      },
      {
        dept: 'Guest Services',
        status: guestReqPending > 0
          ? `${guestReqPending} request${guestReqPending > 1 ? 's' : ''} pending`
          : 'No pending requests',
        level: guestReqPending > 5 ? 'warning' : 'good',
        detail: `${hkCleaningPending} cleaning tasks open`,
      },
    ];

    // ── RECENT ACTIVITY (live from audits) ──
    const recentActivity = recentAudits.map(a => ({
      id:   a._id,
      type: a.action_type,
      text: a.description,
      user: a.user_id,
      time: a.datetime,
      status: a.status,
    }));

    res.json({
      kpis: {
        todayRevenue:  Math.round(todayRevenue),
        totalRevenue:  Math.round(totalRevenue),
        outstanding:   Math.round(outstanding),
        occupancyRate,
      },
      roomStatus,
      ops,
      revenueTrend: revenueByDay,
      bookingsTrend: bookingsByDay,
      departmentHealth,
      recentActivity,
      counts: {
        cleaningPending: hkCleaningPending,
        guestReqPending,
        maintPending,
        maintCritical,
      },
    });
  } catch (error) {
    console.error('Admin operations dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch admin operations data', detail: error.message });
  }
});


// ─────────────────────────────────────────────
// REPORTS — computed live from bookings / rooms
// ─────────────────────────────────────────────

const parseAmt = (str) => parseFloat((str || '0').replace(/,/g, '')) || 0;

// ── OCCUPANCY REPORT ──
app.get('/api/reports/occupancy', async (req, res) => {
  try {
    const [rooms, roomTypes, bookings] = await Promise.all([
      Room.find({}),
      RoomType.find({}),
      Booking.find({}),
    ]);

    const totalRooms = rooms.length || 1;

    // Occupancy is driven by checked-in bookings (source of truth), not Room.status.
    // Build the set of room numbers that currently have an in-house guest.
    const occupiedRoomNums = new Set(
      bookings
        .filter(b => b.status === 'Checked In')
        .map(b => String(b.room_number || '').trim())
        .filter(Boolean)
    );
    const isOccupied = (r) => occupiedRoomNums.has(String(r.room_number || '').trim());

    // If some checked-in bookings reference rooms not found in the collection,
    // still count them (capped at total) so the headline rate stays accurate.
    const occupiedNow = Math.min(
      bookings.filter(b => b.status === 'Checked In').length,
      totalRooms
    );
    const avgOccupancy = Math.round((occupiedNow / totalRooms) * 1000) / 10;

    // Average length of stay from booking nights
    const nightsArr = bookings.map(b => parseInt(b.dates?.nights) || 0).filter(n => n > 0);
    const alos = nightsArr.length
      ? Math.round((nightsArr.reduce((a, c) => a + c, 0) / nightsArr.length) * 10) / 10
      : 0;

    // Peak / low day by check-in day-of-week
    const dowCount = [0, 0, 0, 0, 0, 0, 0];
    bookings.forEach(b => {
      if (b.dates?.check_in) {
        const d = new Date(b.dates.check_in);
        if (!isNaN(d)) dowCount[d.getDay()]++;
      }
    });
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peakDay = dayNames[dowCount.indexOf(Math.max(...dowCount))] || '—';
    const lowDay  = dayNames[dowCount.indexOf(Math.min(...dowCount))] || '—';

    // Trend — last 4 weeks: % of rooms with a booking checked-in that week
    const trend = [];
    for (let w = 3; w >= 0; w--) {
      const start = new Date(); start.setDate(start.getDate() - (w + 1) * 7);
      const end   = new Date(); end.setDate(end.getDate() - w * 7);
      const inWeek = bookings.filter(b => {
        const ci = new Date(b.dates?.check_in);
        return !isNaN(ci) && ci >= start && ci < end;
      }).length;
      trend.push({ label: `Week ${4 - w}`, rate: Math.min(100, Math.round((inWeek / totalRooms) * 100)) });
    }

    // By room type — count rooms of each type vs how many are occupied
    const typeNameById = {};
    roomTypes.forEach(t => { typeNameById[t.type_id] = t.name; });
    const byTypeMap = {};
    rooms.forEach(r => {
      const name = typeNameById[r.type_id] || `Type ${r.type_id || '?'}`;
      if (!byTypeMap[name]) byTypeMap[name] = { rooms: 0, occupied: 0 };
      byTypeMap[name].rooms++;
      if (isOccupied(r)) byTypeMap[name].occupied++;
    });
    const byRoomType = Object.entries(byTypeMap).map(([type, v]) => ({
      type,
      rooms: v.rooms,
      rate: v.rooms ? Math.round((v.occupied / v.rooms) * 100) : 0,
    })).sort((a, b) => b.rate - a.rate);

    // By floor
    const byFloorMap = {};
    rooms.forEach(r => {
      const f = r.floor || 0;
      if (!byFloorMap[f]) byFloorMap[f] = { rooms: 0, occupied: 0 };
      byFloorMap[f].rooms++;
      if (isOccupied(r)) byFloorMap[f].occupied++;
    });
    const byFloor = Object.entries(byFloorMap)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([floor, v]) => ({
        floor: `Floor ${floor}`,
        rooms: v.rooms,
        rate: v.rooms ? Math.round((v.occupied / v.rooms) * 100) : 0,
      }));

    // 7-day forecast — confirmed check-ins per upcoming day
    const forecast = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const confirmed = bookings.filter(b => b.dates?.check_in === iso).length;
      forecast.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        confirmed,
        projected: confirmed, // no separate projection source; mirror confirmed
      });
    }

    res.json({
      kpis: { avgOccupancy, totalRooms: rooms.length, alos, peakDay, lowDay },
      trend, byRoomType, byFloor, forecast,
    });
  } catch (error) {
    console.error('Occupancy report error:', error);
    res.status(500).json({ error: 'Failed to build occupancy report', detail: error.message });
  }
});

// ── FINANCIAL REPORT ──
app.get('/api/reports/financial', async (req, res) => {
  try {
    const [bookings, rooms] = await Promise.all([Booking.find({}), Room.find({})]);

    // Total revenue = sum of COMPLETED transactions; outstanding = sum of balance_due
    let totalRevenue = 0, outstandingTotal = 0, outstandingCount = 0;
    const methodTotals = {};   // payment_method → amount
    bookings.forEach(b => {
      (b.transactions || []).forEach(t => {
        const amt = parseAmt(t.amount);
        if (t.status === 'COMPLETED') {
          totalRevenue += amt;
          const m = t.payment_method || 'Other';
          methodTotals[m] = (methodTotals[m] || 0) + amt;
        }
      });
      const bal = parseAmt(b.billing?.balance_due);
      if (bal > 0) { outstandingTotal += bal; outstandingCount++; }
    });

    // Rooms revenue = room charge transactions; everything else grouped by description keyword
    const sourceTotals = { Rooms: 0, 'F&B': 0, 'Spa & Wellness': 0, Minibar: 0, Laundry: 0, 'Penalties & Fees': 0, Other: 0 };
    bookings.forEach(b => (b.transactions || []).forEach(t => {
      if (t.status !== 'COMPLETED') return;
      const amt = parseAmt(t.amount);
      const desc = (t.description || '').toLowerCase();
      // Order matters: check specific categories BEFORE the generic "room" keyword,
      // so "F&B - Room Service" is counted as F&B, not Rooms.
      if (desc.includes('refund') || desc.includes('penalty') || desc.includes('fee') || desc.includes('cancel')) {
        sourceTotals['Penalties & Fees'] += amt;   // refunds are negative → net reduces this bucket
      } else if (desc.includes('f&b') || desc.includes('food') || desc.includes('restaurant') || desc.includes('room service')) {
        sourceTotals['F&B'] += amt;
      } else if (desc.includes('spa')) {
        sourceTotals['Spa & Wellness'] += amt;
      } else if (desc.includes('minibar')) {
        sourceTotals.Minibar += amt;
      } else if (desc.includes('laundry')) {
        sourceTotals.Laundry += amt;
      } else if (desc.includes('room')) {
        sourceTotals.Rooms += amt;
      } else {
        sourceTotals.Other += amt;
      }
    }));
    // Only positive buckets are shown; base percentages on their sum so they total 100%
    const positiveSources = Object.entries(sourceTotals).filter(([, amt]) => amt > 0);
    const sourceSum = positiveSources.reduce((a, [, amt]) => a + amt, 0) || 1;
    const revenueBySource = positiveSources
      .map(([source, amount]) => ({
        source, amount: Math.round(amount),
        pct: Math.round((amount / sourceSum) * 1000) / 10,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Payment methods breakdown
    const methodSum = Object.values(methodTotals).reduce((a, c) => a + c, 0) || 1;
    const paymentMethods = Object.entries(methodTotals).map(([method, amount]) => ({
      method, amount: Math.round(amount),
      pct: Math.round((amount / methodSum) * 1000) / 10,
    })).sort((a, b) => b.amount - a.amount);

    // ADR = total room revenue / number of room-nights sold
    const roomNights = bookings.reduce((s, b) => s + (parseInt(b.dates?.nights) || 0), 0);
    const adr = roomNights ? Math.round(sourceTotals.Rooms / roomNights) : 0;
    const totalRooms = rooms.length || 1;
    const revpar = Math.round(totalRevenue / totalRooms);

    // Weekly revenue trend (current 4 weeks) — from transaction datetimes
    const revenueTrend = [];
    for (let w = 3; w >= 0; w--) {
      const start = new Date(); start.setDate(start.getDate() - (w + 1) * 7);
      const end   = new Date(); end.setDate(end.getDate() - w * 7);
      let sum = 0;
      bookings.forEach(b => (b.transactions || []).forEach(t => {
        if (t.status !== 'COMPLETED') return;
        const dt = new Date((t.datetime || '').replace(' ', 'T'));
        if (!isNaN(dt) && dt >= start && dt < end) sum += parseAmt(t.amount);
      }));
      revenueTrend.push({ label: `Week ${4 - w}`, current: Math.round(sum), previous: 0 });
    }

    // ADR/RevPAR trend mirrors the weekly revenue for a simple visual
    const adrTrend = revenueTrend.map(r => ({
      label: r.label,
      adr,
      revpar: totalRooms ? Math.round(r.current / totalRooms) : 0,
    }));

    // Expenses are not tracked in the DB → return empty so the UI shows nothing fabricated
    const expenses = [];
    const totalExpenses = 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0;

    res.json({
      kpis: {
        totalRevenue: Math.round(totalRevenue),
        totalExpenses,
        netProfit: Math.round(netProfit),
        profitMargin,
        adr, revpar,
      },
      revenueTrend, revenueBySource, expenses, adrTrend, paymentMethods,
      outstanding: { total: Math.round(outstandingTotal), count: outstandingCount },
    });
  } catch (error) {
    console.error('Financial report error:', error);
    res.status(500).json({ error: 'Failed to build financial report', detail: error.message });
  }
});

// ── GUEST REPORT ──
app.get('/api/reports/guests', async (req, res) => {
  try {
    const bookings = await Booking.find({});

    // Group by unique guest (by name)
    const guestMap = {};
    bookings.forEach(b => {
      const name = b.guest?.full_name || 'Unknown';
      if (!guestMap[name]) guestMap[name] = { name, visits: 0, totalSpent: 0, lastVisit: '' };
      guestMap[name].visits++;
      guestMap[name].totalSpent += parseAmt(b.billing?.total_paid);
      const ci = b.dates?.check_in || '';
      if (ci > guestMap[name].lastVisit) guestMap[name].lastVisit = ci;
    });
    const guests = Object.values(guestMap);

    const totalGuests = guests.length;
    const returning = guests.filter(g => g.visits > 1).length;
    const newGuests = totalGuests - returning;
    const returnRate = totalGuests ? Math.round((returning / totalGuests) * 1000) / 10 : 0;
    const totalPaid = guests.reduce((s, g) => s + g.totalSpent, 0);
    const avgSpend = totalGuests ? Math.round(totalPaid / totalGuests) : 0;

    // Booking source breakdown (real — from booking.source)
    const srcMap = {};
    bookings.forEach(b => {
      const s = b.source || 'Other';
      srcMap[s] = (srcMap[s] || 0) + 1;
    });
    const totalBookings = bookings.length || 1;
    const bookingSource = Object.entries(srcMap).map(([source, count]) => ({
      source, count,
      pct: Math.round((count / totalBookings) * 1000) / 10,
    })).sort((a, b) => b.count - a.count);

    // Top guests by revenue
    const topGuests = [...guests]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map(g => ({ ...g, totalSpent: Math.round(g.totalSpent) }));

    res.json({
      kpis: { totalGuests, newGuests, returning, avgSpend, returnRate },
      bookingSource,
      topGuests,
      // Not tracked in the DB → empty; UI will simply render nothing for these
      nationalities: [],
      purpose: [],
      feedback: null,
    });
  } catch (error) {
    console.error('Guest report error:', error);
    res.status(500).json({ error: 'Failed to build guest report', detail: error.message });
  }
});


// ─────────────────────────────────────────────
// GUEST REQUESTS
// ─────────────────────────────────────────────

app.get('/api/guest-requests', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.room_number) filter.room_number = Number(req.query.room_number);
    const items = await GuestRequest.find(filter).sort({ requested_at: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch guest requests', detail: e.message }); }
});

app.post('/api/guest-requests', requireAuth, async (req, res) => {
  try {
    const max = await GuestRequest.findOne().sort({ request_id: -1 });
    const body = { ...req.body, request_id: (max?.request_id || 0) + 1, requested_at: new Date() };
    const saved = await new GuestRequest(body).save();
    res.status(201).json(saved);
  } catch (e) { res.status(500).json({ error: 'Failed to create guest request', detail: e.message }); }
});

app.put('/api/guest-requests/:id', requireAuth, async (req, res) => {
  try {
    const updated = await GuestRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Failed to update guest request', detail: e.message }); }
});

app.delete('/api/guest-requests/:id', requireAuth, async (req, res) => {
  try {
    await GuestRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Failed to delete guest request', detail: e.message }); }
});

// ─────────────────────────────────────────────
// CLEANING TASKS
// ─────────────────────────────────────────────

app.get('/api/cleaning-tasks', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) filter.scheduled_date = { $gte: new Date(req.query.date), $lt: new Date(new Date(req.query.date).getTime() + 86400000) };
    const items = await CleaningTask.find(filter).sort({ scheduled_date: 1 });
    res.json(items);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch cleaning tasks', detail: e.message }); }
});

app.post('/api/cleaning-tasks', requireAuth, async (req, res) => {
  try {
    const max = await CleaningTask.findOne().sort({ task_id: -1 });
    const body = { ...req.body, task_id: (max?.task_id || 0) + 1 };
    const saved = await new CleaningTask(body).save();
    res.status(201).json(saved);
  } catch (e) { res.status(500).json({ error: 'Failed to create cleaning task', detail: e.message }); }
});

app.put('/api/cleaning-tasks/:id', requireAuth, async (req, res) => {
  try {
    const updated = await CleaningTask.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Failed to update cleaning task', detail: e.message }); }
});

app.delete('/api/cleaning-tasks/:id', requireAuth, async (req, res) => {
  try {
    await CleaningTask.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Failed to delete cleaning task', detail: e.message }); }
});

// ─────────────────────────────────────────────
// HOUSEKEEPING LOGS
// ─────────────────────────────────────────────

app.get('/api/housekeeping-logs', async (req, res) => {
  try {
    const filter = {};
    // Optional: only today's logs when ?today=1
    if (req.query.today) {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + 86400000);
      filter.datetime = { $gte: start, $lt: end };
    }
    const items = await HousekeepingLog.find(filter).sort({ datetime: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch housekeeping logs', detail: e.message }); }
});

app.post('/api/housekeeping-logs', requireAuth, async (req, res) => {
  try {
    const { room_number, category, description, employee } = req.body || {};
    if (!room_number || !description) {
      return res.status(400).json({ error: 'Room number and description are required.' });
    }
    const max = await HousekeepingLog.findOne().sort({ log_id: -1 });
    const saved = await new HousekeepingLog({
      log_id: (max?.log_id || 0) + 1,
      room_number: String(room_number),
      category: category || 'Room Note',
      description,
      employee: employee || '',
      datetime: new Date(),
    }).save();
    res.status(201).json(saved);
  } catch (e) { res.status(500).json({ error: 'Failed to create housekeeping log', detail: e.message }); }
});

app.delete('/api/housekeeping-logs/:id', requireAuth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid log id' });
    }
    await HousekeepingLog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Failed to delete housekeeping log', detail: e.message }); }
});

// ─────────────────────────────────────────────
// LOST AND FOUND
// ─────────────────────────────────────────────

app.get('/api/lost-and-found', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const items = await LostAndFound.find(filter).sort({ found_date: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch lost and found', detail: e.message }); }
});

app.post('/api/lost-and-found', requireAuth, async (req, res) => {
  try {
    const max = await LostAndFound.findOne().sort({ item_id: -1 });
    const body = { ...req.body, item_id: (max?.item_id || 0) + 1, found_date: req.body.found_date || new Date() };
    const saved = await new LostAndFound(body).save();
    res.status(201).json(saved);
  } catch (e) { res.status(500).json({ error: 'Failed to create lost and found record', detail: e.message }); }
});

app.put('/api/lost-and-found/:id', requireAuth, async (req, res) => {
  try {
    const updated = await LostAndFound.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Failed to update lost and found record', detail: e.message }); }
});

app.delete('/api/lost-and-found/:id', requireAuth, async (req, res) => {
  try {
    await LostAndFound.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Failed to delete lost and found record', detail: e.message }); }
});

// ─────────────────────────────────────────────
// MAINTENANCE REQUESTS
// ─────────────────────────────────────────────

app.get('/api/maintenance-requests', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const items = await MaintenanceRequest.find(filter).sort({ reported_at: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch maintenance requests', detail: e.message }); }
});

app.post('/api/maintenance-requests', requireAuth, async (req, res) => {
  try {
    const max = await MaintenanceRequest.findOne().sort({ maintenance_id: -1 });
    const body = { ...req.body, maintenance_id: (max?.maintenance_id || 0) + 1, reported_at: new Date() };
    const saved = await new MaintenanceRequest(body).save();
    res.status(201).json(saved);
  } catch (e) { res.status(500).json({ error: 'Failed to create maintenance request', detail: e.message }); }
});

app.put('/api/maintenance-requests/:id', requireAuth, async (req, res) => {
  try {
    const updated = await MaintenanceRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Failed to update maintenance request', detail: e.message }); }
});

app.delete('/api/maintenance-requests/:id', requireAuth, async (req, res) => {
  try {
    await MaintenanceRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Failed to delete maintenance request', detail: e.message }); }
});

// ─────────────────────────────────────────────
// FRONT DESK LOGS  (stored in the audits collection)
// ─────────────────────────────────────────────

app.get('/api/front-desk-logs', async (req, res) => {
  try {
    const filter = {};
    if (req.query.date) {
      const start = new Date(req.query.date);
      const end   = new Date(new Date(req.query.date).getTime() + 86400000);
      filter.datetime = { $gte: start.toISOString().slice(0,10), $lt: end.toISOString().slice(0,10) };
    }
    const logs = await Audit.find(filter).sort({ datetime: -1 });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch logs', detail: e.message }); }
});

app.post('/api/front-desk-logs', requireAuth, async (req, res) => {
  try {
    const max = await Audit.findOne().sort({ audit_id: -1 });
    const nextId = `LOG-${String((parseInt((max?.audit_id || 'LOG-0').split('-')[1]) || 0) + 1).padStart(3,'0')}`;
    const body = {
      ...req.body,
      audit_id: nextId,
      datetime: req.body.datetime || new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    const saved = await new Audit(body).save();
    res.status(201).json(saved);
  } catch (e) { res.status(500).json({ error: 'Failed to create log entry', detail: e.message }); }
});

app.put('/api/front-desk-logs/:id', requireAuth, async (req, res) => {
  try {
    const updated = await Audit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Failed to update log entry', detail: e.message }); }
});

app.delete('/api/front-desk-logs/:id', requireAuth, async (req, res) => {
  try {
    await Audit.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Failed to delete log entry', detail: e.message }); }
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

