const mongoose = require('mongoose');

const shiftAssignmentSchema = new mongoose.Schema({
  assignment_id: Number,     // e.g. 1
  employee_id: Number,       // references employees.employee_id
  shift_date: Date,          // ISODate e.g. 2026-08-24T00:00:00.000Z
  shift_id: Number,          // references shifts.shift_id
  status: String,            // "PUBLISHED", "DRAFT", "CANCELLED"
}, { timestamps: true });

module.exports = mongoose.model('ShiftAssignment', shiftAssignmentSchema, 'shift_assignments');
