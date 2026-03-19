import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { showToast } from '../services/toast.js';

const typeDurations = {
  book: 7,
  laptop: 3,
  projector: 3,
  projector_screen: 3
};

const formatTypeLabel = (value = '') =>
  String(value)
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export default function ReserveItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const seededResource = location.state?.resource || null;
  const seededPolicies = location.state?.policies || [];
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState(seededResource);
  const [policies, setPolicies] = useState(seededPolicies);
  const [accepted, setAccepted] = useState(false);
  const [requestedDate, setRequestedDate] = useState(dayjs().format('YYYY-MM-DD'));

  const canReserve = ['student', 'personnel'].includes(user?.role);
  const availableUnits = resource?.availableQuantity ?? resource?.quantity ?? 0;
  const duration = typeDurations[resource?.resourceType] || 7;

  useEffect(() => {
    let ignore = false;

    Promise.all([
      seededResource ? Promise.resolve({ data: seededResource }) : api.get(`/resources/${id}`),
      seededPolicies.length ? Promise.resolve({ data: seededPolicies }) : api.get('/policies')
    ])
      .then(([resourceResp, policyResp]) => {
        if (ignore) return;
        setResource(resourceResp.data);
        setPolicies(policyResp.data || []);
      })
      .catch((e) => {
        if (!ignore) {
          setMsg(e.response?.data?.message || 'Unable to load reservation details.');
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    if (!canReserve) {
      setMsg('Only students and personnel can reserve items.');
    }
  }, [canReserve]);

  const expectedReturn = useMemo(() => {
    if (!requestedDate) return 'Select a requested date';
    return dayjs(requestedDate).add(duration, 'day').format('MMMM D, YYYY');
  }, [duration, requestedDate]);

  const reserve = async () => {
    if (!accepted) {
      const message = 'You must accept the policies before continuing.';
      setMsg(message);
      showToast(message, 'error');
      return;
    }

    if (!requestedDate) {
      const message = 'Please select the date you need the item.';
      setMsg(message);
      showToast(message, 'error');
      return;
    }

    try {
      await api.post('/reservations', { resourceId: id, requestedDate });
      showToast('Reservation submitted successfully.', 'success');
      navigate('/my-reservations');
    } catch (e) {
      const message = e.response?.data?.message || 'Unable to submit reservation.';
      setMsg(message);
      showToast(message, 'error');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="card">Loading reservation details...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-intro">
        <div>
          <h1 className="page-title">Reserve Resource</h1>
          <p className="page-sub">Review item details, confirm the policy terms, and submit a valid borrowing request.</p>
        </div>
        <div className="chip-row">
          <span className="chip">{resource?.library?.name || 'Library pending'}</span>
          <span className="chip">{availableUnits} unit(s) available</span>
          <span className="chip">{duration}-day suggested borrowing window</span>
        </div>
      </div>

      {msg ? <div className="text-sm text-red-600">{msg}</div> : null}

      <div className="split-grid">
        <div className="hero-panel">
          <div className="eyebrow">Reservation summary</div>
          <h2 className="hero-title">{resource?.title || 'Selected resource'}</h2>
          <p className="hero-copy">
            {resource?.description || 'No description has been added for this resource yet.'}
          </p>

          <div className="detail-list" style={{ marginTop: '18px' }}>
              <div className="detail-row">
                <span className="inline-note">Resource type</span>
                <strong>{formatTypeLabel(resource?.resourceType) || 'Not set'}</strong>
              </div>
            <div className="detail-row">
              <span className="inline-note">Availability</span>
              <strong>{availableUnits} of {resource?.quantity || 0}</strong>
            </div>
            <div className="detail-row">
              <span className="inline-note">Barcode</span>
              <strong>{resource?.barcode || 'Not assigned'}</strong>
            </div>
            {resource?.author ? (
              <div className="detail-row">
                <span className="inline-note">Author</span>
                <strong>{resource.author}</strong>
              </div>
            ) : null}
            {resource?.genre?.name ? (
              <div className="detail-row">
                <span className="inline-note">Genre</span>
                <strong>{resource.genre.name}</strong>
              </div>
            ) : null}
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-kicker">Submission form</div>
              <h3 className="section-title">Choose a valid requested date</h3>
            </div>
            <span className={availableUnits > 0 ? 'badge badge-positive' : 'badge badge-danger'}>
              {availableUnits > 0 ? 'Ready for request' : 'Unavailable'}
            </span>
          </div>

          <div className="list-stack">
            <div>
              <div className="text-sm text-gray-700 mb-2">Requested date</div>
              <input
                type="date"
                className="input"
                min={dayjs().format('YYYY-MM-DD')}
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
              />
            </div>

            <div className="surface-muted">
              <div className="font-semibold">Expected return date</div>
              <div className="inline-note" style={{ marginTop: '6px' }}>
                Based on the current resource type, the suggested return date is <strong>{expectedReturn}</strong>.
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} style={{ marginTop: '4px' }} />
              <span>I have reviewed the borrowing policies and agree to follow them during this reservation.</span>
            </label>

            <div className="action-row">
              <button type="button" className="btn-primary" onClick={reserve} disabled={!canReserve || availableUnits <= 0}>
                Confirm reservation
              </button>
              <button type="button" className="btn-ghost" onClick={() => navigate('/resources')}>Back to catalog</button>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div>
            <div className="section-kicker">Active policies</div>
            <h3 className="section-title">Reservation terms and reminders</h3>
          </div>
          <span className="pill">{policies.length} policy document(s)</span>
        </div>

        <div className="list-stack">
          {policies.length === 0 ? (
            <div className="empty-state">No policies are available yet.</div>
          ) : (
            policies.map((policy) => (
              <div key={policy._id} className="surface-muted">
                <div className="font-semibold">{policy.title}</div>
                <div className="inline-note" style={{ marginTop: '6px' }}>
                  {policy.description || 'Please review this policy carefully before borrowing.'}
                </div>
                <div className="inline-note" style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>
                  {policy.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
