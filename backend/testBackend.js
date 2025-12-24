const axios = require('axios');

// FORCE IPv4 and PORT 5001
const API_URL = 'http://127.0.0.1:5002/api';

let token = '';     // Alice's token
let bobToken = '';  // Bob's token (NEW)
let users = {}; 
let groupId = '';

const log = (msg) => console.log(`\n🔹 ${msg}`);

const runTest = async () => {
  try {
    log('1. Registering Users...');
    
    const registerOrLogin = async (name, email, password) => {
      try {
        await axios.post(`${API_URL}/auth/register`, { name, email, password });
        return { name, email, password };
      } catch (err) {
        if (err.response && err.response.status === 400) {
          return { name, email, password };
        }
        throw err;
      }
    };

    const alice = await registerOrLogin('Alice', 'alice@test.com', '123');
    const bob = await registerOrLogin('Bob', 'bob@test.com', '123');
    const charlie = await registerOrLogin('Charlie', 'charlie@test.com', '123');
    console.log('✅ Users Ready');

    log('2. Logging in...');
    // Login Alice
    const loginRes = await axios.post(`${API_URL}/auth/login`, { email: alice.email, password: alice.password });
    token = loginRes.data.token;
    users.alice = loginRes.data.user.id;
    console.log('✅ Alice Logged in');

    // Login Bob (Save his token too!)
    const bobRes = await axios.post(`${API_URL}/auth/login`, { email: bob.email, password: bob.password });
    users.bob = bobRes.data.user.id;
    bobToken = bobRes.data.token; // <--- FIXED: Saving Bob's token
    
    // Login Charlie
    const charRes = await axios.post(`${API_URL}/auth/login`, { email: charlie.email, password: charlie.password });
    users.charlie = charRes.data.user.id;

    log('3. Creating a Group "Trip to Vegas"...');
    const groupRes = await axios.post(`${API_URL}/groups`, {
      name: 'Trip to Vegas',
      members: [users.bob, users.charlie] 
    }, { headers: { 'x-auth-token': token } });
    groupId = groupRes.data._id;
    console.log(`✅ Group Created (ID: ${groupId})`);

    log('4. Adding Expense: Alice pays $300 (Equal Split)...');
    await axios.post(`${API_URL}/expenses`, {
      description: 'Hotel Booking',
      amount: 300,
      group: groupId,
      splitType: 'EQUAL',
      splits: [
        { user: users.alice, amount: 100 },
        { user: users.bob, amount: 100 },
        { user: users.charlie, amount: 100 }
      ]
    }, { headers: { 'x-auth-token': token } });
    console.log('✅ Expense 1 Added');

    log('5. Adding Expense: Bob pays $100 for Charlie (Exact Split)...');
    await axios.post(`${API_URL}/expenses`, {
      description: 'Dinner for Charlie',
      amount: 100,
      group: groupId,
      splitType: 'EXACT',
      splits: [
        { user: users.charlie, amount: 100 }
      ]
    }, { headers: { 'x-auth-token': bobToken } }); // <--- FIXED: Using Bob's Token
    console.log('✅ Expense 2 Added');

    log('6. Checking Final Balances...');
    const balanceRes = await axios.get(`${API_URL}/balances/${groupId}`, { headers: { 'x-auth-token': token } });
    
    console.log('\n💰 SIMPLIFIED DEBTS (Unique Algorithm):');
    if (balanceRes.data.data.length === 0) {
      console.log('No debts found.');
    } else {
      balanceRes.data.data.forEach(debt => {
        const fromName = Object.keys(users).find(key => users[key] === debt.from).toUpperCase();
        const toName = Object.keys(users).find(key => users[key] === debt.to).toUpperCase();
        console.log(`👉 ${fromName} pays ${toName} $${debt.amount}`);
      });
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
        console.error('Error:', error.message);
    }
  }
};

runTest();