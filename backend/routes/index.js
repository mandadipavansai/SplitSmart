const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Import Controllers
const { register, login } = require('../controllers/authController');
const { createGroup, getGroups, addMemberToGroup, removeMemberFromGroup } = require('../controllers/groupController'); 
const { addExpense, getExpenses } = require('../controllers/expenseController');
const { getGroupBalance } = require('../controllers/balanceController');

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);

// Groups & Members
router.post('/groups', authMiddleware, createGroup);
router.get('/groups', authMiddleware, getGroups);
router.post('/groups/:groupId/members', authMiddleware, addMemberToGroup);
router.delete('/groups/:groupId/members/:memberId', authMiddleware, removeMemberFromGroup); // <--- NEW DELETE ROUTE

// Expenses & Balances
router.post('/expenses', authMiddleware, addExpense);
router.get('/expenses/:groupId', authMiddleware, getExpenses);
router.get('/balances/:groupId', authMiddleware, getGroupBalance);

module.exports = router;