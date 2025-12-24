const Expense = require('../models/Expense');
const Group = require('../models/Group');

exports.calculateGroupBalances = async (groupId) => {
  const expenses = await Expense.find({ group: groupId });
  const group = await Group.findById(groupId);
  
  if (!group) throw new Error('Group not found');

  // 1. Calculate Net Balance for each member
  const balances = {}; 
  // Initialize 0 for everyone
  group.members.forEach(m => balances[m._id.toString()] = 0);

  expenses.forEach(expense => {
    const payerId = expense.paidBy.toString();
    
    // Payer gets POSITIVE (They are owed money)
    // Note: We only add the amount *others* consumed. 
    // BUT simpler logic: Payer +Amount, Consumers -SplitAmount.
    balances[payerId] += expense.amount;

    expense.splits.forEach(split => {
      const consumerId = split.memberId.toString();
      balances[consumerId] -= split.amount;
    });
  });

  // 2. Separate into Debtors (-) and Creditors (+)
  let debtors = [];
  let creditors = [];

  for (const [memberId, amount] of Object.entries(balances)) {
    const net = parseFloat(amount.toFixed(2));
    if (net < -0.01) debtors.push({ memberId, amount: net });
    if (net > 0.01) creditors.push({ memberId, amount: net });
  }

  // Sort to optimize matching
  debtors.sort((a, b) => a.amount - b.amount); // Ascending (-100, -50)
  creditors.sort((a, b) => b.amount - a.amount); // Descending (100, 50)

  // 3. Greedy Matching (Simplification)
  const settlements = [];
  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    let debtor = debtors[i];
    let creditor = creditors[j];

    // The amount to settle is the minimum of what debtor owes vs what creditor is owed
    let amount = Math.min(Math.abs(debtor.amount), creditor.amount);
    amount = parseFloat(amount.toFixed(2));

    // Record the settlement
    settlements.push({
      from: debtor.memberId,
      to: creditor.memberId,
      amount
    });

    // Update remaining balances
    debtor.amount += amount;
    creditor.amount -= amount;

    // Move pointers if settled
    if (Math.abs(debtor.amount) < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return settlements;
};