import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import api from '../services/api.js';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import { useAuth } from '../context/AuthContext.jsx';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const statusColors = {
  pending: '#a0aec0',
  approved: '#4299e1',
  borrowed: '#38a169',
  overdue: '#e53e3e',
  returned: '#718096',
  rejected: '#ed8936'
};

const statusOptions = ['all','pending','approved','borrowed','overdue','returned','rejected'];

export default function CalendarPage(){
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = async ()=>{
    try {
      const url = (user?.role === 'developer' || user?.role === 'librarian') ? '/reservations' : '/reservations/my';
      const { data } = await api.get(url);
      // ensure uniqueness for student/personnel views
      const list = Array.isArray(data) ? data : [];
      const unique = (user?.role === 'developer' || user?.role === 'librarian')
        ? list
        : list.filter((r, idx, arr)=> arr.findIndex(x=>x._id===r._id)===idx);
      setReservations(unique);
    } catch (e){ setMessage(e.response?.data?.message || 'Error loading calendar'); }
  };

  useEffect(()=>{ load(); }, [user]);

  const filtered = useMemo(()=> reservations.filter(r=>{
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search){
      const text = `${r.resource?.title||''} ${r.user?.fullName||''}`.toLowerCase();
      if (!text.includes(search.toLowerCase())) return false;
    }
    return true;
  }), [reservations, statusFilter, search]);

  const events = useMemo(()=> filtered.map(r=>{
    const start = r.borrowDate ? new Date(r.borrowDate) : (r.requestedDate ? new Date(r.requestedDate) : new Date(r.createdAt));
    const end = r.dueDate ? new Date(r.dueDate) : start;
    return {
      id: r._id,
      title: `${r.resource?.title || 'Resource'} (${r.status})`,
      start,
      end,
      allDay: false,
      status: r.status,
      user: r.user?.fullName,
      resource: r.resource?.title,
      dueDate: r.dueDate,
      borrowDate: r.borrowDate,
      requestedDate: r.requestedDate
    };
  }), [filtered]);

  const eventPropGetter = (event)=>{
    const color = statusColors[event.status] || '#3182ce';
    return { style: { backgroundColor: color, borderRadius: '6px', opacity: 0.9, color: '#fff', border: 'none' } };
  };

  const tooltipAccessor = (event)=>{
    const req = event.requestedDate ? dayjs(event.requestedDate).format('YYYY-MM-DD') : '—';
    const bor = event.borrowDate ? dayjs(event.borrowDate).format('YYYY-MM-DD') : '—';
    const due = event.dueDate ? dayjs(event.dueDate).format('YYYY-MM-DD') : '—';
    return `${event.resource || 'Resource'}\nStatus: ${event.status}\nRequested: ${req}\nBorrowed: ${bor}\nDue: ${due}\nUser: ${event.user || ''}`;
  };

  const sortedList = useMemo(()=> [...filtered].sort((a,b)=> new Date(a.dueDate||a.requestedDate||a.createdAt) - new Date(b.dueDate||b.requestedDate||b.createdAt)), [filtered]);
  const fmt = (d)=> d ? dayjs(d).format('YYYY-MM-DD') : '—';

  return (
    <DashboardLayout>
      <h2 className="text-xl font-semibold">Calendar</h2>
      <p className="text-sm text-gray-500 mb-3">Track requested, borrowed, and due dates for reservations</p>
      {message && <div className="text-sm text-red-600 mb-2">{message}</div>}

      <div className="card-panel mb-3 space-y-3">
        <div className="flex flex-wrap gap-2 text-sm">
          {statusOptions.map(s=>(
            <button key={s} onClick={()=>setStatusFilter(s)} className={`px-3 py-1 rounded border ${statusFilter===s?'bg-blue-100 text-blue-700 border-blue-300':'bg-gray-100 text-gray-700 border-gray-200'}`}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input className="input flex-1" placeholder="Search resource or user" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(statusColors).map(([k,v])=> (
            <span key={k} className="px-2 py-1 rounded text-white" style={{background:v}}>{k}</span>
          ))}
        </div>
      </div>

      <div className="card-panel mb-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 520 }}
          eventPropGetter={eventPropGetter}
          tooltipAccessor={tooltipAccessor}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          defaultView={Views.MONTH}
        />
      </div>

      <div className="card-panel">
        <div className="font-semibold mb-2">Upcoming & Active Reservations</div>
        <div className="grid gap-2 max-h-72 overflow-auto">
          {sortedList.length===0 && <div className="text-gray-500 text-sm">No current or upcoming reservations</div>}
          {sortedList.map(r=>(
            <div key={r._id} className="border rounded p-2 flex justify-between items-center">
              <div>
                <div className="font-semibold text-sm">{r.resource?.title || 'Resource'}</div>
                <div className="text-xs text-gray-500">{r.user?.fullName}</div>
                <div className="text-xs text-gray-500">Requested: {fmt(r.requestedDate)} • Borrowed: {fmt(r.borrowDate)} • Due: {fmt(r.dueDate)}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded" style={{background: statusColors[r.status]||'#ccc', color:'#fff'}}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

