const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema({
  type_id: Number,
  name: String,
  base_capacity: Number,
  base_rate: Number,
  amenities: [String]
});

// The third argument specifically targets your exact collection name
module.exports = mongoose.model('RoomType', roomTypeSchema, 'room_types');