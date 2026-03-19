import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import api from '../services/api.js';

export default function ProfilePage(){
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const load = async ()=>{
    const { data } = await api.get('/users/me');
    setUser(data); setFullName(data.fullName || '');
  };
  useEffect(()=>{ load(); }, []);

  const save = async ()=>{
    setMessage('');
    try {
      await api.patch('/users/me', { fullName });
      setMessage('Profile updated');
      load();
    } catch (e) { setMessage(e.response?.data?.message || 'Update failed'); }
  };

  const changePassword = async ()=>{
    setPwMsg('');
    if (newPw !== confirmPw) { setPwMsg('Passwords do not match'); return; }
    if (newPw.length < 8) { setPwMsg('Password must be at least 8 characters'); return; }
    try {
      await api.post('/auth/change-password', { oldPassword: oldPw, newPassword: newPw });
      setPwMsg('Password updated');
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (e) { setPwMsg(e.response?.data?.message || 'Update failed'); }
  };

  if (!user) return null;
  return (
    <DashboardLayout>
      <h2 className="text-xl font-semibold mb-3">My Profile</h2>
      <div className="card space-y-3">
        <div className="text-sm text-gray-500">Role: {user.role}</div>
        <div className="text-sm text-gray-500">ID: {user.schoolId || user.employeeId}</div>
        <input className="input" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Full Name" />
        <div className="flex gap-2 items-center">
          <button className="btn-primary" onClick={save}>Save</button>
          {message && <span className="text-sm text-gray-600">{message}</span>}
        </div>
      </div>

      <div className="card space-y-3">
        <div className="font-semibold">Change Password</div>
        <input type="password" className="input" placeholder="Old Password" value={oldPw} onChange={e=>setOldPw(e.target.value)} />
        <input type="password" className="input" placeholder="New Password" value={newPw} onChange={e=>setNewPw(e.target.value)} />
        <input type="password" className="input" placeholder="Confirm New Password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} />
        <div className="flex gap-2 items-center">
          <button className="btn-primary" onClick={changePassword}>Update Password</button>
          {pwMsg && <span className="text-sm text-gray-600">{pwMsg}</span>}
        </div>
      </div>
    </DashboardLayout>
  );
}
