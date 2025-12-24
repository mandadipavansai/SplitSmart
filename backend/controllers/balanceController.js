const { calculateGroupBalances } = require('../services/balanceService');

exports.getGroupBalance = async (req, res) => {
  try {
    const debts = await calculateGroupBalances(req.params.groupId);
    res.json({ data: debts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};