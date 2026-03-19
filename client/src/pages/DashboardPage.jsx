import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const quickActions = [
  { to: '/resources', label: 'Browse resources', note: 'Find available books and equipment.' },
  { to: '/my-reservations', label: 'Track my reservations', note: 'Monitor approvals, due dates, and returns.' },
  { to: '/manage/fines', label: 'Review fines', note: 'See unpaid balances and overdue penalties.' },
  { to: '/calendar', label: 'Open calendar', note: 'See requested and due dates in one place.' },
  { to: '/notifications', label: 'Review notifications', note: 'Catch approvals, reminders, and fines.' }
];

const currency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2
});

export default function DashboardPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({ active: 0, pending: 0, overdue: 0, fines: 0, unread: 0 });
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [resvResp, finesResp, notifResp] = await Promise.all([
          api.get('/reservations/my'),
          api.get('/fines/me'),
          api.get('/notifications')
        ]);

        const reservations = resvResp.data || [];
        const fines = finesResp.data || [];
        const notifs = notifResp.data || [];

        setStats({
          active: reservations.filter((item) => ['approved', 'borrowed'].includes(item.status)).length,
          pending: reservations.filter((item) => item.status === 'pending').length,
          overdue: reservations.filter((item) => item.status === 'overdue').length,
          fines: fines.filter((item) => !item.paid).reduce((sum, item) => sum + item.amount, 0),
          unread: notifs.filter((item) => !item.read).length
        });

        setReservations(reservations);
        setNotifications(notifs.slice(0, 5));
        setMessage('');
      } catch (e) {
        setMessage(e.response?.data?.message || 'Error loading dashboard');
      }
    };

    load();
  }, []);

  const upcoming = useMemo(() => {
    return reservations
      .filter((item) => item.dueDate && ['approved', 'borrowed', 'overdue'].includes(item.status))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
  }, [reservations]);

  const recent = useMemo(() => {
    return [...reservations]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5);
  }, [reservations]);

  const summaryCards = [
    { label: 'Active items', value: stats.active, note: 'Currently approved or borrowed' },
    { label: 'Pending approvals', value: stats.pending, note: 'Waiting for staff action' },
    { label: 'Overdue items', value: stats.overdue, note: 'Needs immediate attention' },
    { label: 'Unpaid fines', value: currency.format(stats.fines), note: 'Outstanding charges' }
  ];

  return (
    <DashboardLayout>
      <div className="hero-grid">
        <div className="hero-panel">
          <div className="eyebrow">Borrower workspace</div>
          <h1 className="hero-title">Welcome back, {user?.fullName?.split(' ')[0] || 'User'}.</h1>
          <p className="hero-copy">
            Your dashboard highlights what is active, what needs attention, and the quickest paths back into the
            UniReserve workflow.
          </p>

          <div className="chip-row" style={{ marginTop: '22px' }}>
            <span className="chip">{stats.unread} unread notifications</span>
            <span className="chip">{stats.pending} request(s) in review</span>
            <span className="chip">{stats.overdue} overdue item(s)</span>
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-kicker">Next best actions</div>
              <h3 className="section-title">Keep things moving</h3>
            </div>
          </div>

          <div className="list-stack">
            {quickActions.map((action) => (
              <Link key={action.to} to={action.to} className="list-row" style={{ textDecoration: 'none' }}>
                <div>
                  <div className="font-semibold">{action.label}</div>
                  <div className="inline-note" style={{ marginTop: '4px' }}>{action.note}</div>
                </div>
                <div className="timeline-meta">Open</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {message ? <div className="text-sm text-red-600">{message}</div> : null}

      <div className="stats-grid">
        {summaryCards.map((card) => (
          <div key={card.label} className="metric-card">
            <div className="metric-label">{card.label}</div>
            <div className="metric-value">{card.value}</div>
            <div className="metric-note">{card.note}</div>
          </div>
        ))}
      </div>

      <div className="split-grid">
        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-kicker">Reservation timeline</div>
              <h3 className="section-title">Upcoming due dates</h3>
            </div>
            <Link to="/calendar" className="btn-ghost">Open calendar</Link>
          </div>

          <div className="list-stack">
            {upcoming.length === 0 ? (
              <div className="empty-state">No upcoming due dates yet.</div>
            ) : (
              upcoming.map((item) => (
                <div key={item._id} className="timeline-item">
                  <div>
                    <div className="font-semibold">{item.resource?.title || 'Resource'}</div>
                    <div className="inline-note" style={{ marginTop: '6px' }}>
                      Status: {item.status} | Requested {dayjs(item.requestedDate || item.createdAt).format('MMM D, YYYY')}
                    </div>
                  </div>
                  <div className="timeline-meta">
                    Due {dayjs(item.dueDate).format('MMM D')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-kicker">Alerts and updates</div>
              <h3 className="section-title">Recent notifications</h3>
            </div>
            <Link to="/notifications" className="btn-ghost">View all</Link>
          </div>

          <div className="list-stack">
            {notifications.length === 0 ? (
              <div className="empty-state">No notifications yet.</div>
            ) : (
              notifications.map((item) => (
                <div key={item._id} className="list-row">
                  <div>
                    <div className="font-semibold">{item.message}</div>
                    <div className="inline-note" style={{ marginTop: '4px' }}>
                      {dayjs(item.createdAt).format('MMM D, YYYY h:mm A')}
                    </div>
                  </div>
                  <div className="timeline-meta">{item.read ? 'Read' : 'Unread'}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div>
            <div className="section-kicker">Latest activity</div>
            <h3 className="section-title">Recent reservations</h3>
          </div>
          <Link to="/my-reservations" className="btn-ghost">Open my reservations</Link>
        </div>

        <div className="list-stack">
          {recent.length === 0 ? (
            <div className="empty-state">You have not created any reservations yet.</div>
          ) : (
            recent.map((item) => (
              <div key={item._id} className="list-row">
                <div>
                  <div className="font-semibold">{item.resource?.title || 'Resource'}</div>
                  <div className="inline-note" style={{ marginTop: '4px' }}>
                    Requested {dayjs(item.requestedDate || item.createdAt).format('MMM D, YYYY')} | Due{' '}
                    {item.dueDate ? dayjs(item.dueDate).format('MMM D, YYYY') : 'Pending staff confirmation'}
                  </div>
                </div>
                <div className="timeline-meta">{item.status}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

