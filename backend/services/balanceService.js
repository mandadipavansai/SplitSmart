const Expense = require('../models/Expense');
const Group = require('../models/Group');

exports.calculateGroupBalances = async (groupId) => {
  const expenses = await Expense.find({ group: groupId });
  const group = await Group.findById(groupId);
  
  if (!group) throw new Error('Group not found');


  const balances = {}; 

  group.members.forEach(m => balances[m._id.toString()] = 0);

  expenses.forEach(expense => {
    const payerId = expense.paidBy.toString();
    
  
    balances[payerId] += expense.amount;

    expense.splits.forEach(split => {
      const consumerId = split.memberId.toString();
      balances[consumerId] -= split.amount;
    });
  });


  let debtors = [];
  let creditors = [];

  for (const [memberId, amount] of Object.entries(balances)) {
    const net = parseFloat(amount.toFixed(2));
    if (net < -0.01) debtors.push({ memberId, amount: net });
    if (net > 0.01) creditors.push({ memberId, amount: net });
  }


  debtors.sort((a, b) => a.amount - b.amount); 
  creditors.sort((a, b) => b.amount - a.amount); 


  const settlements = [];
  let i = 0; 
  let j = 0; 

  while (i < debtors.length && j < creditors.length) {
    let debtor = debtors[i];
    let creditor = creditors[j];


    let amount = Math.min(Math.abs(debtor.amount), creditor.amount);
    amount = parseFloat(amount.toFixed(2));


    settlements.push({
      from: debtor.memberId,
      to: creditor.memberId,
      amount
    });


    debtor.amount += amount;
    creditor.amount -= amount;


    if (Math.abs(debtor.amount) < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return settlements;
};