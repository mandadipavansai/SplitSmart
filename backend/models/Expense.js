const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  
  // Who paid? (References a member._id from the Group model)
  paidBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  
  splitType: { type: String, enum: ['EQUAL', 'EXACT', 'PERCENT'], required: true },
  
  // Who owes what?
  splits: [{
    memberId: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true }
  }],
  
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', ExpenseSchema);