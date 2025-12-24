const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Optional: Link to a real user if they exist, otherwise just a generated ID
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Members are stored directly in the group
  members: [MemberSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Group', GroupSchema);