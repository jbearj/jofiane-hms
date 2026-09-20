const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employee_id: Number,       // e.g. 1

  full_name: String,         // e.g. "Ana Buenaflor"

  photo: String,             // profile picture as a base64 data URL (optional)

  contact: {
    email: String,           // e.g. "ana@jofiane.com"
    phone: String,           // e.g. "+63 917 123 4567"
  },

  portal_access: {
    username: String,        // e.g. "ana.buenaflor"
    has_access: Boolean,     // true / false
    password: String,        // plain text for prototype; hash in production
  },

  employment_details: {
    hire_date: String,       // e.g. "2026-08-30"
    status: String,          // "ACTIVE", "ON LEAVE", "TERMINATED"
    department: String,      // "Front Desk", "Housekeeping", "Maintenance", "F&B", "Admin"
    role: {
      title: String,         // e.g. "Front Desk Concierge"
      base_salary: Number,   // e.g. 25000
    },
  },
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema, 'employees');
