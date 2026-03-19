import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const defaultTypeLabels = {
  book: 'Book',
  laptop: 'Laptop',
  projector: 'Projector',
  projector_screen: 'Projector Screen'
};

const formatTypeLabel = (value = '') =>
  defaultTypeLabels[value] ||
  String(value)
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const iconFor = (type) => {
  const map = {
    book: 'BK',
    laptop: 'LP',
    projector: 'PJ',
    projector_screen: 'SC'
  };

  return map[type] || 'IT';
};

const getAssetBase = () => (api.defaults.baseURL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const coverFor = (item) => (item.coverImage ? `${getAssetBase()}/uploads/${item.coverImage}` : null);

const statusFor = (item) => {
  const total = item.quantity || 0;
  const available = item.availableQuantity ?? total;

  if (!total) {
    return { text: 'Not stocked', className: 'badge badge-warning' };
  }

  if (available <= 0) {
    return { text: 'Fully checked out', className: 'badge badge-danger' };
  }

  if (available <= Math.max(1, Math.ceil(total * 0.25))) {
    return { text: 'Low availability', className: 'badge badge-warning' };
  }

  return { text: 'Available', className: 'badge badge-positive' };
};

export default function ResourceCatalog() {
  const [items, setItems] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [query, setQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [type, setType] = useState('');
  const [library, setLibrary] = useState('');
  const [libraries, setLibraries] = useState([]);
  const [sortBy, setSortBy] = useState('availability');
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const canReserve = ['student', 'personnel'].includes(user?.role);

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/resources', {
        params: {
          q: query || undefined,
          type: type || undefined,
          library: library || undefined,
          barcode: barcode || undefined
        }
      });
      setItems(data || []);
      setMessage('');
    } catch (e) {
      setMessage(e.response?.data?.message || 'Unable to load resources right now.');
    }
  };

  useEffect(() => {
    fetchItems();
  }, [barcode, query, type, library]);

  useEffect(() => {
    api.get('/policies').then((r) => setPolicies(r.data || [])).catch(() => {});
    api.get('/libraries').then((r) => setLibraries(r.data || [])).catch(() => {});
  }, []);

  const visibleItems = useMemo(() => {
    const list = [...items];

    list.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'limited') return (a.availableQuantity ?? a.quantity ?? 0) - (b.availableQuantity ?? b.quantity ?? 0);
      return (b.availableQuantity ?? b.quantity ?? 0) - (a.availableQuantity ?? a.quantity ?? 0);
    });

    return list;
  }, [items, sortBy]);

  const metrics = useMemo(() => {
    return items.reduce((acc, item) => {
      const total = item.quantity || 0;
      const available = item.availableQuantity ?? total;
      acc.catalog += 1;
      acc.units += total;
      acc.available += available;
      if (available <= Math.max(1, Math.ceil(total * 0.25))) acc.lowStock += 1;
      return acc;
    }, {
      catalog: 0,
      units: 0,
      available: 0,
      lowStock: 0
    });
  }, [items]);

  const typeOptions = useMemo(() => {
    const values = [...Object.keys(defaultTypeLabels), ...items.map((item) => item.resourceType), type]
      .filter(Boolean);
    return [...new Set(values)];
  }, [items, type]);

  return (
    <DashboardLayout>
      <div className="page-intro">
        <div>
          <h4 className="page-title">Catalog</h4>
          <p className="page-sub">
            Search books and equipment, compare availability, and move straight into reservation when stock is ready.
          </p>
        </div>
        <div className="chip-row">
          <span className="chip">{libraries.length} library locations</span>
          <span className="chip">{policies.length} active policies</span>
          <span className="chip">{canReserve ? 'Reservation enabled' : 'View-only access'}</span>
        </div>
      </div>

      <div className="hero-grid">
        <div className="hero-panel">
          <div className="eyebrow">Operational visibility</div>
          <h2 className="hero-title">Find the right item faster with availability-first browsing.</h2>
          <p className="hero-copy">
            Catalog results are organized to help users see what can be borrowed now, which items are nearly out,
            and which library currently holds the resource.
          </p>

          <div className="stats-grid" style={{ marginTop: '22px' }}>
            <div className="metric-card">
              <div className="metric-label">Catalog entries</div>
              <div className="metric-value">{metrics.catalog}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Available units</div>
              <div className="metric-value">{metrics.available}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Tracked units</div>
              <div className="metric-value">{metrics.units}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Low-stock items</div>
              <div className="metric-value">{metrics.lowStock}</div>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-kicker">Borrowing guidance</div>
              <h3 className="section-title">Before users reserve</h3>
            </div>
            <span className="badge badge-positive">Live rules</span>
          </div>

          <div className="list-stack">
            {(policies.slice(0, 3) || []).map((policy) => (
              <div key={policy._id} className="surface-muted">
                <div className="font-semibold">{policy.title}</div>
                <div className="inline-note" style={{ marginTop: '6px' }}>
                  {policy.description || 'Follow this policy before completing the reservation.'}
                </div>
              </div>
            ))}

            {policies.length === 0 ? (
              <div className="empty-state">No policy summaries are available yet.</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="card-panel">
        <div className="section-header">
          <div>
            <div className="section-kicker">Catalog filters</div>
            <h3 className="section-title">Search and refine inventory</h3>
          </div>
          <div className="toolbar">
            <button type="button" className="btn-primary" onClick={fetchItems}>Refresh results</button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setQuery('');
                setBarcode('');
                setType('');
                setLibrary('');
                setSortBy('availability');
              }}
            >
              Reset filters
            </button>
          </div>
        </div>

        <div className="filter-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div>
            <div className="text-xs text-gray-600 mb-2">Keyword</div>
            <input
              className="input"
              placeholder="Title, author, description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-2">Barcode</div>
            <input
              className="input"
              placeholder="Barcode or resource code"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-2">Type</div>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {typeOptions.map((value) => (
                <option key={value} value={value}>{formatTypeLabel(value)}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-2">Library</div>
            <select className="input" value={library} onChange={(e) => setLibrary(e.target.value)}>
              <option value="">All libraries</option>
              {libraries.map((lib) => (
                <option key={lib._id} value={lib._id}>{lib.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-2">Sort by</div>
            <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="availability">Most available</option>
              <option value="limited">Most limited</option>
              <option value="newest">Newest</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>

        {message ? <div className="text-sm text-red-600 mt-3">{message}</div> : null}
      </div>

      <div className="section-card">
        <div className="section-header">
          <div>
            <div className="section-kicker">Live results</div>
            <h3 className="section-title">{visibleItems.length} resources matched</h3>
          </div>
          <span className="pill">{canReserve ? 'Students and personnel can reserve' : 'Staff browsing mode'}</span>
        </div>

        {visibleItems.length === 0 ? (
          <div className="empty-state">No resources matched the current filters.</div>
        ) : (
          <div className="resource-grid">
            {visibleItems.map((item) => {
              const status = statusFor(item);
              const cover = coverFor(item);
              const available = item.availableQuantity ?? item.quantity ?? 0;
              const canBorrowNow = canReserve && available > 0;

              return (
                <article key={item._id} className="resource-card">
                  <div className="resource-cover">
                    {cover ? (
                      <img src={cover} alt={item.title} />
                    ) : (
                      <span className="resource-cover-icon">{iconFor(item.resourceType)}</span>
                    )}
                  </div>

                  <div className="list-stack" style={{ gap: '8px' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-lg">{item.title}</div>
                        <div className="inline-note">{formatTypeLabel(item.resourceType)}</div>
                      </div>
                      <span className={status.className}>{status.text}</span>
                    </div>

                    <div className="inline-note">
                      {item.description || 'No description available yet.'}
                    </div>
                  </div>

                  <div className="detail-list">
                    <div className="detail-row">
                      <span className="inline-note">Library</span>
                      <strong>{item.library?.name || 'Unassigned'}</strong>
                    </div>
                    <div className="detail-row">
                      <span className="inline-note">Availability</span>
                      <strong>{available} of {item.quantity || 0}</strong>
                    </div>
                    <div className="detail-row">
                      <span className="inline-note">Reference</span>
                      <strong>{item.barcode || item._id.slice(-6).toUpperCase()}</strong>
                    </div>
                    {item.author ? (
                      <div className="detail-row">
                        <span className="inline-note">Author</span>
                        <strong>{item.author}</strong>
                      </div>
                    ) : null}
                    {item.genre?.name ? (
                      <div className="detail-row">
                        <span className="inline-note">Genre</span>
                        <strong>{item.genre.name}</strong>
                      </div>
                    ) : null}
                  </div>

                  <div className="action-row">
                    {canReserve ? (
                      <Link
                        to={`/resources/${item._id}/reserve`}
                        state={{ policies, resource: item }}
                        className="btn-primary"
                        style={{ opacity: canBorrowNow ? 1 : 0.7, pointerEvents: canBorrowNow ? 'auto' : 'none' }}
                      >
                        {canBorrowNow ? 'Reserve now' : 'Unavailable'}
                      </Link>
                    ) : (
                      <button type="button" className="btn-ghost" disabled>Available for borrowers only</button>
                    )}

                    <span className="pill">{item.createdAt ? `Added ${new Date(item.createdAt).toLocaleDateString()}` : 'Catalog item'}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
