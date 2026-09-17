const mongoose = require('mongoose');

const housekeepingLogSchema = new mongoose.Schema({
  log_id: Number,              // e.g. 1
  employee_id: Number,         // references employees.employee_id
  room_number: Number,         // references rooms.room_number
  action: String,              // e.g. "Room Cleaned", "Inspection Completed"
  description: String,
  log_datetime: Date,
  status: String,              // e.g. "COMPLETED", "PENDING"
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('HousekeepingLog', housekeepingLogSchema, 'housekeeping_logs');