import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';

export default function ChangePasswordPage(){
  const [oldPassword, setOld] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const strongPw = (pw)=> /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{10,}$/.test(pw);

  const submit = async (e)=>{
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }
    if (!strongPw(newPassword)) { setError('Password must be 10+ chars with upper, lower, number, and symbol'); return; }
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.message || 'Validation failed'); }
  };

  return (
    <AuthLayout title="Change Password" subtitle="Set a stronger password before continuing to your workspace.">
      <form onSubmit={submit} className="space-y-4">
        <input type="password" className="input" placeholder="Old Password" value={oldPassword} onChange={e=>setOld(e.target.value)} />
        <input type="password" className="input" placeholder="New Password" value={newPassword} onChange={e=>setNew(e.target.value)} />
        <input type="password" className="input" placeholder="Confirm Password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button className="btn-primary flex-1">Update</button>
          <button type="button" className="btn-ghost" onClick={logout}>Logout</button>
        </div>
      </form>
    </AuthLayout>
  );
}
