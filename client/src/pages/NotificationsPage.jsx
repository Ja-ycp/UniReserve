import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import api from '../services/api.js';
import { showToast } from '../services/toast.js';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

  const load = () => {
    api.get('/notifications')
      .then((r) => setItems(r.data || []))
      .catch((e) => setMessage(e.response?.data?.message || 'Error loading notifications'));
  };

  useEffect(() => {
    load();
  }, []);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      window.dispatchEvent(new Event('notifications-updated'));
      showToast('Notification marked as read.', 'success');
      load();
    } catch (e) {
      setMessage(e.response?.data?.message || 'Unable to update notification.');
    }
  };

  const markAllRead = async () => {
    try {
      await Promise.all(items.filter((item) => !item.read).map((item) => api.patch(`/notifications/${item._id}/read`)));
      window.dispatchEvent(new Event('notifications-updated'));
      showToast('Unread notifications cleared.', 'success');
      load();
    } catch (e) {
      setMessage(e.response?.data?.message || 'Unable to mark all notifications as read.');
    }
  };

  return (
    <DashboardLayout>
      <div className="page-intro">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">Keep up with approvals, due-soon reminders, overdue alerts, and fine updates.</p>
        </div>
        <div className="chip-row">
          <span className="chip">{items.length} total notifications</span>
          <span className="chip">{unreadCount} unread</span>
        </div>
      </div>

      {message ? <div className="text-sm text-red-600">{message}</div> : null}

      <div className="card-panel">
        <div className="section-header">
          <div>
            <div className="section-kicker">Inbox controls</div>
            <h3 className="section-title">Review and clear updates</h3>
          </div>
          <button type="button" className="btn-primary" onClick={markAllRead} disabled={!unreadCount}>
            Mark all as read
          </button>
        </div>
      </div>

      <div className="section-card">
        <div className="list-stack">
          {items.length === 0 ? (
            <div className="empty-state">No notifications have been generated yet.</div>
          ) : (
            items.map((item) => (
              <div key={item._id} className="list-row">
                <div>
                  <div className="font-semibold">{item.message}</div>
                  <div className="inline-note" style={{ marginTop: '4px' }}>
                    {dayjs(item.createdAt).format('MMM D, YYYY h:mm A')}
                  </div>
                </div>
                <div className="action-row" style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span className={item.read ? 'badge' : 'badge badge-warning'}>{item.read ? 'Read' : 'Unread'}</span>
                  {!item.read ? (
                    <button type="button" className="btn-ghost" onClick={() => markRead(item._id)}>Mark read</button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
