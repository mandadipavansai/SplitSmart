const Expense = require('../models/Expense');

exports.addExpense = async (req, res) => {
  try {
    const { description, amount, group, paidBy, splitType, splits } = req.body;

    // Validation: Total split must match expense amount
    let totalCalculated = 0;
    splits.forEach(s => totalCalculated += parseFloat(s.amount));

    // Allow small float error (0.1)
    if (Math.abs(totalCalculated - amount) > 0.1) {
      return res.status(400).json({ msg: `Splits ($${totalCalculated}) do not match Total ($${amount})` });
    }

    const expense = new Expense({
      description,
      amount,
      group,
      paidBy,
      splitType,
      splits
    });

    await expense.save();
    res.status(201).json({ msg: 'Expense Added', expense });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ group: req.params.groupId }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};