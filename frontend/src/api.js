import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5002/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers['x-auth-token'] = token;
  return req;
});

export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const createGroup = (data) => API.post('/groups', data);
export const getGroups = () => API.get('/groups');
export const addExpense = (data) => API.post('/expenses', data);
export const getExpenses = (groupId) => API.get(`/expenses/${groupId}`);
export const getBalances = (groupId) => API.get(`/balances/${groupId}`);

// Members
export const addMember = (groupId, name) => API.post(`/groups/${groupId}/members`, { name });
export const removeMember = (groupId, memberId) => API.delete(`/groups/${groupId}/members/${memberId}`); // <--- NEW

export default API;