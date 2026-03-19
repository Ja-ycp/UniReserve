import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import api from '../services/api.js';
import { showToast } from '../services/toast.js';

const statusTabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'borrowed', label: 'Borrowed' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'returned', label: 'Returned' },
  { key: 'rejected', label: 'Rejected' }
];

const statusClass = {
  pending: 'badge badge-warning',
  approved: 'badge badge-positive',
  borrowed: 'badge badge-positive',
  overdue: 'badge badge-danger',
  returned: 'badge',
  rejected: 'badge badge-danger'
};

const suggestDue = (resourceType, requestedDate) => {
  const days = { book: 7, laptop: 3, projector: 3, projector_screen: 3 }[resourceType] || 7;
  return dayjs(requestedDate || undefined).add(days, 'day').format('YYYY-MM-DD');
};

const formatTypeLabel = (value = '') =>
  String(value)
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export default function ManageReservations() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [dueDates, setDueDates] = useState({});
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/reservations');
      setItems(data || []);
      const prefill = {};
      (data || []).filter((item) => item.status === 'pending').forEach((item) => {
        prefill[item._id] = suggestDue(item.resource?.resourceType, item.requestedDate);
      });
      setDueDates(prefill);
      setMessage('');
    } catch (e) {
      setMessage(e.response?.data?.message || 'Error loading reservations');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (tab !== 'all' && item.status !== tab) return false;
      if (!search) return true;
      const haystack = `${item.user?.fullName || ''} ${item.resource?.title || ''} ${item.user?.schoolId || ''} ${item.user?.employeeId || ''}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [items, search, tab]);

  const counts = useMemo(() => {
    const result = { all: items.length };
    items.forEach((item) => {
      result[item.status] = (result[item.status] || 0) + 1;
    });
    return result;
  }, [items]);

  const updateDueDate = (id, value) => {
    setDueDates((current) => ({ ...current, [id]: value }));
  };

  const act = async (item, action) => {
    try {
      if (action === 'approve') {
        const dueDate = dueDates[item._id];
        if (!dueDate) {
          showToast('Pick a due date before approving.', 'error');
          return;
        }
        await api.patch(`/reservations/${item._id}/approve`, { dueDate });
      }

      if (action === 'reject') {
        await api.patch(`/reservations/${item._id}/reject`);
      }

      if (action === 'borrow') {
        await api.patch(`/reservations/${item._id}/borrow`);
      }

      if (action === 'return') {
        await api.patch(`/reservations/${item._id}/return`, { returnDate: new Date() });
      }

      showToast('Reservation updated successfully.', 'success');
      load();
    } catch (e) {
      const errorMessage = e.response?.data?.message || 'Action failed';
      setMessage(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="page-intro">
        <div>
          <h1 className="page-title">Manage Reservations</h1>
          <p className="page-sub">Approve requests, release items for borrowing, and close returns from a single queue.</p>
        </div>
        <div className="chip-row">
          <span className="chip">{counts.pending || 0} awaiting approval</span>
          <span className="chip">{counts.borrowed || 0} currently borrowed</span>
          <span className="chip">{counts.overdue || 0} overdue</span>
        </div>
      </div>

      {message ? <div className="text-sm text-red-600">{message}</div> : null}

      <div className="card-panel">
        <div className="filter-grid" style={{ gridTemplateColumns: '1.8fr 1fr' }}>
          <input
            className="input"
            placeholder="Search by borrower, ID, or resource"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="toolbar">
            {statusTabs.map((status) => (
              <button
                key={status.key}
                type="button"
                className={tab === status.key ? 'btn-primary' : 'btn-ghost'}
                onClick={() => setTab(status.key)}
              >
                {status.label} ({counts[status.key] || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div>
            <div className="section-kicker">Reservation queue</div>
            <h3 className="section-title">{filtered.length} reservation(s) in this view</h3>
          </div>
        </div>

        <div className="list-stack">
          {filtered.length === 0 ? (
            <div className="empty-state">No reservations match the selected filters.</div>
          ) : (
            filtered.map((item) => (
              <div key={item._id} className="card">
                <div className="section-header">
                  <div>
                    <div className="font-semibold text-lg">{item.resource?.title || 'Resource'}</div>
                    <div className="inline-note" style={{ marginTop: '4px' }}>
                      {item.user?.fullName || 'Unknown user'} | {item.user?.schoolId || item.user?.employeeId || 'No ID'}
                    </div>
                  </div>
                  <span className={statusClass[item.status] || 'badge'}>{item.status}</span>
                </div>

                <div className="detail-list">
                  <div className="detail-row">
                    <span className="inline-note">Requested</span>
                    <strong>{dayjs(item.requestedDate || item.createdAt).format('MMM D, YYYY')}</strong>
                  </div>
                  <div className="detail-row">
                    <span className="inline-note">Due date</span>
                    <strong>{item.dueDate ? dayjs(item.dueDate).format('MMM D, YYYY') : 'Not assigned yet'}</strong>
                  </div>
                  <div className="detail-row">
                    <span className="inline-note">Library</span>
                    <strong>{item.resource?.library?.name || 'Unassigned'}</strong>
                  </div>
                  <div className="detail-row">
                    <span className="inline-note">Resource type</span>
                    <strong>{formatTypeLabel(item.resource?.resourceType) || 'Not set'}</strong>
                  </div>
                </div>

                {item.status === 'pending' ? (
                  <div className="filter-grid" style={{ gridTemplateColumns: 'minmax(220px, 280px) 1fr', marginTop: '16px' }}>
                    <div>
                      <div className="text-sm text-gray-700 mb-2">Suggested due date</div>
                      <input
                        type="date"
                        className="input"
                        value={dueDates[item._id] || ''}
                        min={dayjs(item.requestedDate || undefined).format('YYYY-MM-DD')}
                        onChange={(e) => updateDueDate(item._id, e.target.value)}
                      />
                    </div>

                    <div className="action-row" style={{ alignItems: 'flex-end' }}>
                      <button type="button" className="btn-primary" onClick={() => act(item, 'approve')}>Approve</button>
                      <button type="button" className="btn-ghost" onClick={() => act(item, 'reject')}>Reject</button>
                    </div>
                  </div>
                ) : null}

                {item.status === 'approved' ? (
                  <div className="action-row" style={{ marginTop: '16px' }}>
                    <button type="button" className="btn-primary" onClick={() => act(item, 'borrow')}>Mark as borrowed</button>
                    <button type="button" className="btn-ghost" onClick={() => act(item, 'return')}>Mark as returned</button>
                  </div>
                ) : null}

                {['borrowed', 'overdue'].includes(item.status) ? (
                  <div className="action-row" style={{ marginTop: '16px' }}>
                    <button type="button" className="btn-primary" onClick={() => act(item, 'return')}>Mark as returned</button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

