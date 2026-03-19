import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const currency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2
});

export default function ManageFines(){
  const { user } = useAuth();
  const [fines, setFines] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  const load = ()=>{
    const url = user?.role === 'developer' || user?.role === 'librarian' ? '/fines' : '/fines/me';
    api.get(url).then(r=>setFines(r.data)).catch(e=>setMessage(e.response?.data?.message||'Error loading fines'));
  };
  useEffect(()=>{ load(); }, [user]);

  const pay = async (id)=>{
    try { await api.patch(`/fines/${id}/pay`); load(); }
    catch (e){ setMessage(e.response?.data?.message||'Mark paid failed'); }
  };

  const filtered = useMemo(()=> fines.filter(f=>{
    if (filter==='paid' && !f.paid) return false;
    if (filter==='unpaid' && f.paid) return false;
    if (search){
      const text = `${f.user?.fullName||''} ${f.reservation?.resource?.title||''}`.toLowerCase();
      if (!text.includes(search.toLowerCase())) return false;
    }
    return true;
  }), [fines, filter, search]);

  const counts = useMemo(()=>{
    const c = { all: fines.length, paid:0, unpaid:0 };
    fines.forEach(f=> f.paid ? c.paid++ : c.unpaid++ );
    return c;
  }, [fines]);

  return (
    <DashboardLayout>
      <h2 className="text-xl font-semibold">Fines</h2>
      <p className="text-sm text-gray-500 mb-3">Track and settle overdue penalties</p>
      {message && <div className="text-sm text-red-600 mb-2">{message}</div>}

      <div className="card mb-4 space-y-2">
        <div className="flex flex-wrap gap-2 text-sm">
          <button className={`px-3 py-1 rounded ${filter==='all'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-700'}`} onClick={()=>setFilter('all')}>All ({counts.all})</button>
          <button className={`px-3 py-1 rounded ${filter==='unpaid'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-700'}`} onClick={()=>setFilter('unpaid')}>Unpaid ({counts.unpaid})</button>
          <button className={`px-3 py-1 rounded ${filter==='paid'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-700'}`} onClick={()=>setFilter('paid')}>Paid ({counts.paid})</button>
        </div>
        <input className="input" placeholder="Search user or item" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <div className="grid gap-2">
        {filtered.length===0 && <div className="card text-center text-gray-500">No fines</div>}
        {filtered.map(f=>(
          <div key={f._id} className="card flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="font-semibold">{f.reservation?.resource?.title || 'Resource'}</div>
              <div className="text-sm text-gray-600">{f.user?.fullName || 'Me'}</div>
              <div className="text-xs text-gray-500">Amount: {currency.format(f.amount || 0)} • {f.paid?'Paid':'Unpaid'}</div>
            </div>
            <div className="flex gap-2 items-center">
              {!f.paid && (user?.role==='developer' || user?.role==='librarian') && (
                <button className="btn-primary" onClick={()=>pay(f._id)}>Mark Paid</button>
              )}
              <a className="text-sm text-blue-600" href="#" onClick={(e)=>{e.preventDefault(); alert(`Reservation ID: ${f.reservation?._id || 'n/a'}`);}}>Details</a>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

