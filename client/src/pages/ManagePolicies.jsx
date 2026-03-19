import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import api from '../services/api.js';

function Card({ policy, onEdit, onDelete }){
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold">{policy.title}</div>
          <div className="text-xs text-gray-500">{policy.description}</div>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={()=>onEdit(policy)}>Edit</button>
          <button className="btn-ghost" onClick={()=>onDelete(policy._id)}>Delete</button>
        </div>
      </div>
      <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">{policy.content}</pre>
    </div>
  );
}

export default function ManagePolicies(){
  const [policies, setPolicies] = useState([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ title:'', description:'', content:'', key:'' });
  const [editingId, setEditingId] = useState(null);

  const load = async ()=>{
    const { data } = await api.get('/policies');
    setPolicies(data);
  };
  useEffect(()=>{ load(); },[]);

  const submit = async (e)=>{
    e.preventDefault(); setMessage('');
    try {
      if (editingId) {
        await api.patch(`/policies/${editingId}`, form);
      } else {
        await api.post('/policies', form);
      }
      setForm({ title:'', description:'', content:'', key:'' });
      setEditingId(null);
      load();
    } catch (err) { setMessage(err.response?.data?.message || 'Save failed'); }
  };

  const startEdit = (p)=>{
    setEditingId(p._id);
    setForm({ title:p.title, description:p.description||'', content:p.content||'', key:p.key||'' });
  };

  const del = async (id)=>{
    if (!confirm('Delete policy?')) return;
    await api.delete(`/policies/${id}`);
    load();
  };

  return (
    <DashboardLayout>
      <h2 className="text-xl font-semibold mb-3">Policies & Agreements</h2>
      {message && <div className="text-sm text-red-600 mb-2">{message}</div>}
      <form onSubmit={submit} className="card mb-4 space-y-2">
        <div className="grid md:grid-cols-2 gap-2">
          <input className="input" placeholder="Title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required />
          <input className="input" placeholder="Description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
          <input className="input" placeholder="Key (optional)" value={form.key} onChange={e=>setForm(f=>({...f,key:e.target.value}))} />
        </div>
        <textarea className="input" placeholder="Content" value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} rows={4} required />
        <button className="btn-primary">{editingId ? 'Update' : 'Create'} Policy</button>
      </form>

      <div className="grid gap-3">
        {policies.map(p=>(
          <Card key={p._id} policy={p} onEdit={startEdit} onDelete={del} />
        ))}
      </div>
    </DashboardLayout>
  );
}
