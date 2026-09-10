const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  room_number: Number,
  floor: Number,
  type_id: Number,
  status: String,
  housekeeping: String
});

module.exports = mongoose.model('Room', roomSchema, 'rooms');