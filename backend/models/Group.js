const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  name: { type: String, required: true },

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },

  members: [MemberSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Group', GroupSchema);