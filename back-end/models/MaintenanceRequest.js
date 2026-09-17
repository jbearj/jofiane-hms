const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
  maintenance_id: Number,      // e.g. 1
  room_number: Number,         // references rooms.room_number
  reported_by: Number,         // references employees.employee_id
  assigned_to: Number,         // references employees.employee_id
  issue_type: String,          // e.g. "Plumbing", "Electrical", "Air Conditioning"
  description: String,
  priority: String,            // "LOW", "NORMAL", "HIGH", "URGENT"
  status: String,              // "PENDING", "IN PROGRESS", "COMPLETED"
  reported_at: Date,
  completed_at: Date,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema, 'maintenance_requests');