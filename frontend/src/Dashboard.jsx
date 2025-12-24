import React from 'react';
import './Dashboard.css'; 
import { useEffect, useState } from 'react';
import { getGroups, createGroup, addExpense, getBalances, getExpenses, addMember, removeMember } from './api';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Wallet, PieChart, LogOut, History, ChevronDown, ChevronUp, UserPlus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // Data State
  const [balances, setBalances] = useState([]);
  const [expenses, setExpensesHistory] = useState([]);

  // UI State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  // Forms
  const [desc, setDesc] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [splitType, setSplitType] = useState('EQUAL'); 
  const [payer, setPayer] = useState(''); 
  const [memberSplits, setMemberSplits] = useState({}); 

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) navigate('/');
    else {
      setUser(JSON.parse(u));
      loadGroups();
    }
  }, []);

  const loadGroups = async () => {
    try {
      const { data } = await getGroups();
      setGroups(data);
    } catch (err) { console.error(err); }
  };

  const handleCreateGroup = async () => {
    const name = prompt("Group Name:");
    if (!name) return;
    await createGroup({ name, memberNames: [] });
    toast.success("Group Created");
    loadGroups();
  };

  const handleSelectGroup = async (group) => {
    setSelectedGroup(group);
    const myMemberObj = group.members.find(m => m.userId === user.id);
    setPayer(myMemberObj ? myMemberObj._id : group.members[0]?._id);
    resetForm();
    refreshData(group._id);
    setIsAddMemberOpen(false);
  };

  const refreshData = async (groupId) => {
    const balRes = await getBalances(groupId);
    setBalances(balRes.data.data);
    const expRes = await getExpenses(groupId);
    setExpensesHistory(expRes.data);
  };

  const resetForm = () => {
    setSplitType('EQUAL');
    setMemberSplits({});
    setTotalAmount('');
    setDesc('');
  };

  const handleSplitChange = (memberId, value) => {
    setMemberSplits(prev => ({ ...prev, [memberId]: value }));
  };

  // --- ADD MEMBER LOGIC ---
  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    
    // Frontend Duplicate Check
    const exists = selectedGroup.members.find(m => m.name.toLowerCase() === newMemberName.trim().toLowerCase());
    if (exists) return toast.error("Member already exists!");

    try {
      const { data: updatedGroup } = await addMember(selectedGroup._id, newMemberName);
      setSelectedGroup(updatedGroup);
      setNewMemberName('');
      toast.success("Member Added");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to add member");
    }
  };

  // --- REMOVE MEMBER LOGIC ---
  const handleRemoveMember = async (memberId) => {
    if(!confirm("Remove this member?")) return;
    try {
      const { data: updatedGroup } = await removeMember(selectedGroup._id, memberId);
      setSelectedGroup(updatedGroup);
      toast.success("Member Removed");
    } catch (err) {
      toast.error("Cannot remove member with expenses");
    }
  };

  const handleAddExpense = async () => {
    if (!totalAmount || !desc) return toast.error("Please fill details");
    const amount = parseFloat(totalAmount);
    let finalSplits = [];
    const members = selectedGroup.members;

    if (splitType === 'EQUAL') {
      const share = amount / members.length;
      finalSplits = members.map(m => ({ memberId: m._id, amount: share }));
    } else if (splitType === 'EXACT') {
      let sum = 0;
      finalSplits = members.map(m => {
        const val = parseFloat(memberSplits[m._id] || 0);
        sum += val;
        return { memberId: m._id, amount: val };
      });
      if (Math.abs(sum - amount) > 0.1) return toast.error(`Total mismatch! Sum: ₹${sum}`); // <--- Rupee
    } else if (splitType === 'PERCENT') {
      let sum = 0;
      finalSplits = members.map(m => {
        const pct = parseFloat(memberSplits[m._id] || 0);
        sum += pct;
        return { memberId: m._id, amount: (amount * pct) / 100 };
      });
      if (Math.abs(sum - 100) > 0.1) return toast.error(`Total mismatch! Sum: ${sum}%`);
    }

    try {
      await addExpense({
        description: desc,
        amount,
        group: selectedGroup._id,
        paidBy: payer,
        splitType,
        splits: finalSplits
      });
      toast.success("Expense Added!");
      resetForm();
      refreshData(selectedGroup._id);
    } catch (err) { toast.error("Failed"); }
  };

  const handleSettleUp = async (fromMemberId, toMemberId, amount) => {
    if (!confirm(`Settle ₹${amount}?`)) return; // <--- Rupee
    try {
      await addExpense({
        description: 'Settlement',
        amount: parseFloat(amount),
        group: selectedGroup._id,
        paidBy: fromMemberId,
        splitType: 'EXACT',
        splits: [{ memberId: toMemberId, amount: parseFloat(amount) }]
      });
      toast.success("Debt Settled!");
      refreshData(selectedGroup._id);
    } catch (err) { toast.error("Settlement Failed"); }
  };

  const getName = (id) => selectedGroup?.members.find(m => m._id === id)?.name || 'Unknown';

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="brand">Split<span>Smart</span></div>
        <div className="groups-header">
          <span>My Groups</span>
          <button onClick={handleCreateGroup} className="add-btn"><Plus size={16}/></button>
        </div>
        <div className="group-list">
          {groups.map(g => (
            <div key={g._id} onClick={() => handleSelectGroup(g)} className={`group-item ${selectedGroup?._id === g._id ? 'active' : ''}`}>{g.name}</div>
          ))}
        </div>
        <div className="user-profile">
           <span>{user?.name}</span>
           <button onClick={() => {localStorage.clear(); navigate('/')}} className="logout-btn"><LogOut size={14}/></button>
        </div>
      </aside>

      <main className="main-content">
        {!selectedGroup ? (
          <div className="empty-state">
            <Users size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h2>Select a group</h2>
          </div>
        ) : (
          <>
            <div className="top-header">
              <h1 className="group-title">{selectedGroup.name}</h1>
              <p className="group-meta">{selectedGroup.members.length} Members</p>
            </div>

            <div className="content-grid">
              
              {/* --- LEFT COLUMN --- */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* 1. COLLAPSIBLE ADD MEMBER */}
                <div className={`panel collapsible-panel ${isAddMemberOpen ? 'open' : ''}`}>
                  <div className="panel-header-row" onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}>
                    <div className="panel-title" style={{ marginBottom: 0 }}>
                      <UserPlus size={20} color="#10b981"/> 
                      <span>Manage Members</span>
                    </div>
                    {isAddMemberOpen ? <ChevronUp size={20} color="#94a3b8"/> : <ChevronDown size={20} color="#94a3b8"/>}
                  </div>
                  
                  <div className="collapsible-content">
                    <div style={{ display: 'flex', gap: '10px', marginBottom:'1.5rem' }}>
                      <input className="dash-input" placeholder="Name" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} />
                      <button className="dash-btn" onClick={handleAddMember}>Add</button>
                    </div>

                    <div className="members-manage-list">
                      {selectedGroup.members.map(m => (
                        <div key={m._id} className="manage-row">
                          <span>{m.name}</span>
                          <button onClick={() => handleRemoveMember(m._id)} className="icon-btn-danger">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. ADD EXPENSE */}
                <div className="panel">
                  <div className="panel-title"><Wallet size={20} color="#3b82f6"/> Add Expense</div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{display:'block', marginBottom:'5px', fontSize:'0.85rem', color:'#94a3b8'}}>Paid By</label>
                    <select className="dash-input" value={payer} onChange={(e) => setPayer(e.target.value)}>
                      {selectedGroup.members.map(m => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                    <input className="dash-input" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} style={{ flex: 2 }}/>
                    <input className="dash-input" type="number" placeholder="₹0.00" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} style={{ flex: 1 }}/>
                  </div>
                  
                  <div className="split-type-container">
                    {['EQUAL', 'EXACT', 'PERCENT'].map(type => (
                      <div key={type} onClick={() => setSplitType(type)} className={`type-btn ${splitType === type ? 'active' : ''}`}>{type}</div>
                    ))}
                  </div>

                  <div className="members-split-list">
                    {selectedGroup.members.map(m => (
                      <div key={m._id} className="member-row">
                        <span className="member-name">{m.name}</span>
                        {splitType === 'EQUAL' && <span className="member-amount">₹{totalAmount ? (parseFloat(totalAmount) / selectedGroup.members.length).toFixed(2) : '0.00'}</span>}
                        {splitType === 'EXACT' && <input type="number" className="tiny-input" placeholder="₹" value={memberSplits[m._id] || ''} onChange={(e) => handleSplitChange(m._id, e.target.value)} />}
                        {splitType === 'PERCENT' && <div style={{display:'flex', gap:'5px'}}><input type="number" className="tiny-input" placeholder="%" value={memberSplits[m._id] || ''} onChange={(e) => handleSplitChange(m._id, e.target.value)} /><span>%</span></div>}
                      </div>
                    ))}
                  </div>
                  <button onClick={handleAddExpense} className="dash-btn" style={{ width: '100%' }}>Add Expense</button>
                </div>

              </div>

              {/* --- RIGHT COLUMN --- */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="panel">
                  <div className="panel-title"><PieChart size={20} color="#8b5cf6"/> Net Balances</div>
                  {balances.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center' }}>All settled! 🎉</p> : 
                    balances.map((b, i) => (
                      <div key={i} className="debt-card">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600', color: '#e2e8f0' }}>{getName(b.from)}</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>OWES</span>
                          <span style={{ fontWeight: '600', color: '#e2e8f0' }}>{getName(b.to)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="amount-badge">₹{b.amount}</span>
                          <button onClick={() => handleSettleUp(b.from, b.to, b.amount)} className="dash-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#10b981' }}>Settle</button>
                        </div>
                      </div>
                    ))
                  }
                </div>

                <div className="panel" style={{ flex: 1 }}>
                   <div className="panel-title"><History size={20} color="#f59e0b"/> History</div>
                   <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                     {expenses.map(ex => (
                       <div key={ex._id} style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <span style={{ fontWeight: '600' }}>{ex.description}</span>
                           <span style={{ color: '#3b82f6' }}>₹{ex.amount}</span>
                         </div>
                         <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Paid by {getName(ex.paidBy)}</div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;