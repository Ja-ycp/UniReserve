import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { showToast } from '../services/toast.js';

export default function ManageUsers(){
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ role:'student', fullName:'', schoolId:'', employeeId:'', course:'', yearLevel:'', department:'', password:'' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ fullName:'', role:'', schoolId:'', employeeId:'' });

  const roleOptions = useMemo(()=>{
    if (user?.role === 'developer') return ['librarian','student','personnel']; // hide developer to avoid deletion/mistakes
    return ['student','personnel'];
  }, [user]);

  const load = ()=> api.get('/users', { params:{ q } }).then(r=>setUsers(r.data)).catch(e=>setMessage(e.response?.data?.message||'Error loading users'));
  useEffect(()=>{ load(); }, [q]);

  const updateField = (k,v)=> setForm(f=>({...f,[k]:v}));

  const strongPw = (pw)=> /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{10,}$/.test(pw);

  const submit = async (e)=>{
    e.preventDefault();
    setMessage('');
    if (!form.password || !strongPw(form.password)) { const msg='Password must be 10+ chars with upper, lower, number, and symbol'; setMessage(msg); showToast(msg,'error'); return; }
    try {
      await api.post('/users', form);
      setForm({ role:'student', fullName:'', schoolId:'', employeeId:'', course:'', yearLevel:'', department:'', password:'' });
      load();
      showToast('User created','success');
    } catch (err) { const msg=err.response?.data?.message || 'Create failed'; setMessage(msg); showToast(msg,'error'); }
  };

  const remove = async (id)=>{
    if (!confirm('Delete this user?')) return;
    try { await api.delete(`/users/${id}`); setUsers(u=>u.filter(x=>x._id!==id)); }
    catch (err) { const msg=err.response?.data?.message || 'Delete failed'; setMessage(msg); showToast(msg,'error'); }
  };

  const startEdit = (u)=>{
    setEditingId(u._id);
    setEditForm({ fullName:u.fullName, role:u.role, schoolId:u.schoolId||'', employeeId:u.employeeId||'' });
  };

  const saveEdit = async ()=>{
    if (!editingId) return;
    try {
      await api.patch(`/users/${editingId}`, editForm);
      setEditingId(null); setEditForm({ fullName:'', role:'' });
      load();
    } catch (err) { const msg=err.response?.data?.message || 'Update failed'; setMessage(msg); showToast(msg,'error'); }
  };

  const showStudentFields = form.role === 'student';
  const showPersonnelFields = form.role === 'personnel';

  return (
    <DashboardLayout>
      <h2 className="text-xl font-semibold mb-3">Manage Users</h2>
      {message && <div className="text-sm text-red-600 mb-2">{message}</div>}

      <div className="card mb-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <select className="input" value={form.role} onChange={e=>updateField('role', e.target.value)}>
            {roleOptions.map(r=> <option key={r} value={r}>{r}</option>)}
          </select>
          <input className="input" placeholder="Full Name" value={form.fullName} onChange={e=>updateField('fullName', e.target.value)} />
          {showStudentFields && (
            <>
              <input className="input" placeholder="School ID" value={form.schoolId} onChange={e=>updateField('schoolId', e.target.value)} />
              <input className="input" placeholder="Course" value={form.course} onChange={e=>updateField('course', e.target.value)} />
              <input className="input" placeholder="Year Level" value={form.yearLevel} onChange={e=>updateField('yearLevel', e.target.value)} />
            </>
          )}
          {showPersonnelFields && (
            <>
              <input className="input" placeholder="Employee ID" value={form.employeeId} onChange={e=>updateField('employeeId', e.target.value)} />
              <input className="input" placeholder="Department" value={form.department} onChange={e=>updateField('department', e.target.value)} />
            </>
          )}
          {!showStudentFields && !showPersonnelFields && (
            <input className="input" placeholder="Employee ID" value={form.employeeId} onChange={e=>updateField('employeeId', e.target.value)} />
          )}
          <input type="password" className="input" placeholder="Password (10+ chars, upper, lower, number, symbol)" value={form.password} onChange={e=>updateField('password', e.target.value)} />
        </div>
        <button className="btn-primary" onClick={submit}>Create User</button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <input className="input" placeholder="Search name or ID" value={q} onChange={e=>setQ(e.target.value)} />
      </div>

      <div className="grid gap-2">
        {users.map(u=>(
          <div key={u._id} className="card flex justify-between items-center">
            <div>
              <div className="font-semibold">{u.fullName}</div>
              <div className="text-xs text-gray-500">{u.role}</div>
              <div className="text-xs text-gray-500">{u.schoolId || u.employeeId}</div>
            </div>
            <div className="flex gap-2 items-center">
              {editingId === u._id ? (
                <>
                  <input className="input" value={editForm.fullName} onChange={e=>setEditForm(f=>({...f, fullName:e.target.value}))} />
                  {user?.role==='developer' && (
                    <select className="input" value={editForm.role} onChange={e=>setEditForm(f=>({...f, role:e.target.value}))}>
                      {roleOptions.map(r=> <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}
                  {u.role==='student' && (
                    <input className="input" placeholder="School ID" value={editForm.schoolId} onChange={e=>setEditForm(f=>({...f, schoolId:e.target.value}))} />
                  )}
                  {u.role!=='student' && (
                    <input className="input" placeholder="Employee ID" value={editForm.employeeId} onChange={e=>setEditForm(f=>({...f, employeeId:e.target.value}))} />
                  )}
                  <button className="btn-primary" onClick={saveEdit}>Save</button>
                  <button className="btn-ghost" onClick={()=>setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <button className="btn-ghost" onClick={()=>startEdit(u)}>Edit</button>
                  <button className="btn-ghost" onClick={()=>remove(u._id)}>Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

