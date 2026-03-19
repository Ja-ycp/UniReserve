import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import api from '../services/api.js';

export default function ManageGenres(){
  const [genres, setGenres] = useState([]);
  const [name, setName] = useState('');

  const load = ()=> api.get('/genres').then(r=>setGenres(r.data));
  useEffect(load, []);

  const add = async ()=>{ if(!name) return; await api.post('/genres',{name}); setName(''); load(); };

  return (
    <DashboardLayout>
      <h2 className="text-xl font-semibold mb-3">Manage Genres</h2>
      <div className="flex gap-2 mb-4">
        <input className="input" placeholder="Genre name" value={name} onChange={e=>setName(e.target.value)} />
        <button className="btn-primary" onClick={add}>Add</button>
      </div>
      <div className="grid gap-2">
        {genres.map(g=>(<div key={g._id} className="card">{g.name}</div>))}
      </div>
    </DashboardLayout>
  );
}
