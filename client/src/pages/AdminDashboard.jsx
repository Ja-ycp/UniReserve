import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from 'chart.js';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import api from '../services/api.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const quickLinks = [
  { to: '/manage/reservations', label: 'Review approvals', note: 'Process requests, borrowing, and returns.' },
  { to: '/manage/resources', label: 'Update inventory', note: 'Adjust stock, cover images, and library placement.' },
  { to: '/manage/users', label: 'Manage users', note: 'Create and maintain borrower and staff accounts.' },
  { to: '/manage/fines', label: 'Track fines', note: 'See what is unpaid and settle penalties quickly.' }
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    books: 0,
    laptop: 0,
    projector: 0,
    projector_screen: 0,
    pending: 0,
    overdue: 0,
    active: 0,
    users: 0,
    finesUnpaid: 0
  });
  const [monthly, setMonthly] = useState([]);
  const [popular, setPopular] = useState([]);
  const [pendingRes, setPendingRes] = useState([]);
  const [overdueRes, setOverdueRes] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: analytics }, { data: reservations }] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/reservations')
        ]);

        const reservationList = reservations || [];

        setCounts(analytics?.counts || {});
        setMonthly(analytics?.monthly || []);
        setPopular(analytics?.popular || []);
        setPendingRes(reservationList.filter((item) => item.status === 'pending').slice(0, 5));
        setOverdueRes(reservationList.filter((item) => item.status === 'overdue').slice(0, 5));
        setMessage('');
      } catch (e) {
        setMessage(e.response?.data?.message || 'Error loading dashboard');
      }
    };

    load();
  }, []);

  const summaryCards = [
    { label: 'Total users', value: counts.users, note: 'Accounts using the platform' },
    { label: 'Pending approvals', value: counts.pending, note: 'Reservations waiting for action' },
    { label: 'Active loans', value: counts.active, note: 'Approved or borrowed items' },
    { label: 'Overdue loans', value: counts.overdue, note: 'Needs follow-up' }
  ];

  const lineData = useMemo(() => ({
    labels: monthly.map((item) => item.label),
    datasets: [
      {
        label: 'Reservations',
        data: monthly.map((item) => item.value),
        borderColor: '#1d5eff',
        backgroundColor: 'rgba(29, 94, 255, 0.14)',
        fill: true,
        tension: 0.35
      }
    ]
  }), [monthly]);

  const doughnutData = useMemo(() => ({
    labels: ['Books', 'Laptops', 'Projectors', 'Projector Screens'],
    datasets: [
      {
        data: [counts.books, counts.laptop, counts.projector, counts.projector_screen],
        backgroundColor: ['#1d5eff', '#0f9d7a', '#f59e0b', '#7c3aed'],
        borderWidth: 0
      }
    ]
  }), [counts.books, counts.laptop, counts.projector, counts.projector_screen]);

  return (
    <DashboardLayout>
      <div className="hero-grid">
        <div className="hero-panel">
          <div className="eyebrow">Operations overview</div>
          <h1 className="hero-title">Stay ahead of demand across approvals, stock, and overdue returns.</h1>
          <p className="hero-copy">
            The admin workspace is tuned for day-to-day action: watch reservation pressure, spot overdue issues,
            and jump directly into the management screens that keep the service moving.
          </p>

          <div className="chip-row" style={{ marginTop: '22px' }}>
            <span className="chip">{counts.pending || 0} pending approvals</span>
            <span className="chip">{counts.overdue || 0} overdue reservations</span>
            <span className="chip">{counts.finesUnpaid || 0} unpaid fine record(s)</span>
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-kicker">Quick actions</div>
              <h3 className="section-title">Operational shortcuts</h3>
            </div>
          </div>

          <div className="list-stack">
            {quickLinks.map((link) => (
              <Link key={link.to} to={link.to} className="list-row" style={{ textDecoration: 'none' }}>
                <div>
                  <div className="font-semibold">{link.label}</div>
                  <div className="inline-note" style={{ marginTop: '4px' }}>{link.note}</div>
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
            <div className="metric-value">{card.value || 0}</div>
            <div className="metric-note">{card.note}</div>
          </div>
        ))}
      </div>

      <div className="split-grid">
        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-kicker">Demand trend</div>
              <h3 className="section-title">Reservations over the last six months</h3>
            </div>
          </div>

          {monthly.length === 0 ? (
            <div className="empty-state">No monthly reservation data is available yet.</div>
          ) : (
            <Line
              data={lineData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          )}
        </div>

        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-kicker">Inventory mix</div>
              <h3 className="section-title">Resource distribution</h3>
            </div>
          </div>

          {(counts.books || counts.laptop || counts.projector || counts.projector_screen) ? (
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          ) : (
            <div className="empty-state">Inventory breakdown will appear once resources are added.</div>
          )}
        </div>
      </div>

      <div className="split-grid">
        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-kicker">Approval queue</div>
              <h3 className="section-title">Pending reservations</h3>
            </div>
            <Link to="/manage/reservations" className="btn-ghost">Open queue</Link>
          </div>

          <div className="list-stack">
            {pendingRes.length === 0 ? (
              <div className="empty-state">No pending reservations right now.</div>
            ) : (
              pendingRes.map((item) => (
                <div key={item._id} className="list-row">
                  <div>
                    <div className="font-semibold">{item.resource?.title || 'Resource'}</div>
                    <div className="inline-note" style={{ marginTop: '4px' }}>
                      {item.user?.fullName || 'Unknown user'} | Requested {dayjs(item.requestedDate || item.createdAt).format('MMM D, YYYY')}
                    </div>
                  </div>
                  <div className="timeline-meta">Pending</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-kicker">Risk watch</div>
              <h3 className="section-title">Overdue reservations</h3>
            </div>
            <Link to="/manage/fines" className="btn-ghost">Review fines</Link>
          </div>

          <div className="list-stack">
            {overdueRes.length === 0 ? (
              <div className="empty-state">No overdue reservations right now.</div>
            ) : (
              overdueRes.map((item) => (
                <div key={item._id} className="list-row">
                  <div>
                    <div className="font-semibold">{item.resource?.title || 'Resource'}</div>
                    <div className="inline-note" style={{ marginTop: '4px' }}>
                      {item.user?.fullName || 'Unknown user'} | Due {dayjs(item.dueDate).format('MMM D, YYYY')}
                    </div>
                  </div>
                  <div className="timeline-meta">Overdue</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div>
            <div className="section-kicker">Usage signals</div>
            <h3 className="section-title">Most requested resources</h3>
          </div>
        </div>

        <div className="list-stack">
          {popular.length === 0 ? (
            <div className="empty-state">Popular resources will appear once reservations accumulate.</div>
          ) : (
            popular.map((item, index) => (
              <div key={item.title} className="list-row">
                <div>
                  <div className="font-semibold">{index + 1}. {item.title}</div>
                  <div className="inline-note" style={{ marginTop: '4px' }}>
                    Frequent demand can help you plan replenishment or scheduling.
                  </div>
                </div>
                <div className="timeline-meta">{item.count} requests</div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

