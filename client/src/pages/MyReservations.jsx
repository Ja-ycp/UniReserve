import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import api from '../services/api.js';

const statusTabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'borrowed', label: 'Borrowed' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'returned', label: 'Returned' },
  { key: 'rejected', label: 'Rejected' }
];

const badgeClass = {
  pending: 'badge badge-warning',
  approved: 'badge badge-positive',
  borrowed: 'badge badge-positive',
  overdue: 'badge badge-danger',
  returned: 'badge',
  rejected: 'badge badge-danger'
};

export default function MyReservations() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('all');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/reservations/my')
      .then((r) => setItems(r.data || []))
      .catch((e) => setMessage(e.response?.data?.message || 'Error loading reservations'));
  }, []);

  const filtered = useMemo(() => items.filter((item) => tab === 'all' || item.status === tab), [items, tab]);

  const counts = useMemo(() => {
    const result = { all: items.length };
    items.forEach((item) => {
      result[item.status] = (result[item.status] || 0) + 1;
    });
    return result;
  }, [items]);

  return (
    <DashboardLayout>
      <div className="page-intro">
        <div>
          <h1 className="page-title">My Reservations</h1>
          <p className="page-sub">Track every request from submission to return with clearer status and date context.</p>
        </div>
        <div className="chip-row">
          <span className="chip">{counts.pending || 0} pending</span>
          <span className="chip">{counts.borrowed || 0} borrowed</span>
          <span className="chip">{counts.overdue || 0} overdue</span>
        </div>
      </div>

      {message ? <div className="text-sm text-red-600">{message}</div> : null}

      <div className="card-panel">
        <div className="toolbar">
          {statusTabs.map((tabItem) => (
            <button
              key={tabItem.key}
              type="button"
              className={tab === tabItem.key ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setTab(tabItem.key)}
            >
              {tabItem.label} ({counts[tabItem.key] || 0})
            </button>
          ))}
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div>
            <div className="section-kicker">Reservation history</div>
            <h3 className="section-title">{filtered.length} item(s) in this view</h3>
          </div>
        </div>

        <div className="list-stack">
          {filtered.length === 0 ? (
            <div className="empty-state">No reservations match the selected status.</div>
          ) : (
            filtered.map((item) => (
              <div key={item._id} className="list-row">
                <div>
                  <div className="font-semibold">{item.resource?.title || 'Resource'}</div>
                  <div className="inline-note" style={{ marginTop: '4px' }}>
                    Requested {dayjs(item.requestedDate || item.createdAt).format('MMM D, YYYY')}
                    {' • '}
                    Due {item.dueDate ? dayjs(item.dueDate).format('MMM D, YYYY') : 'Awaiting approval'}
                  </div>
                  {item.resource?.library?.name ? (
                    <div className="inline-note" style={{ marginTop: '4px' }}>
                      Library: {item.resource.library.name}
                    </div>
                  ) : null}
                </div>
                <div className="timeline-meta">
                  <span className={badgeClass[item.status] || 'badge'}>{item.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
