const mongoose = require('mongoose');

// Separate append-only journal: never offered as an archivable category.
const schema = new mongoose.Schema({
  category: { type: String, required: true },
  record_id: { type: String, required: true },
  action: { type: String, enum: ['archive', 'restore', 'purge'], required: true },
  actor_id: { type: String, required: true },
  reason: String,
  occurred_at: { type: Date, default: Date.now, immutable: true },
});
module.exports = mongoose.model('ArchiveEvent', schema, 'archive_events');
