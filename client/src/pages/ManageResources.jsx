import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { showToast } from '../services/toast.js';

const defaultResourceTypes = ['book', 'laptop', 'projector', 'projector_screen'];

const normalizeTypeValue = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const formatTypeLabel = (value = '') =>
  String(value)
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export default function ManageResources() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [genres, setGenres] = useState([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [libraryFilter, setLibraryFilter] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [newType, setNewType] = useState('');
  const emptyForm = {
    title: '',
    resourceType: 'book',
    library: '',
    quantity: 1,
    availableQuantity: 1,
    barcode: '',
    author: '',
    genre: '',
    description: '',
    cover: null
  };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [res, libs, gen] = await Promise.all([
        api.get('/resources', { params: { q: query, type: typeFilter || undefined, library: libraryFilter || undefined } }),
        api.get('/libraries'),
        api.get('/genres')
      ]);

      setItems(res.data || []);
      setLibraries(libs.data || []);
      setGenres(gen.data || []);

      if (!form.library && libs.data.length) {
        setForm((current) => ({
          ...current,
          library: user?.role === 'librarian' ? user.library : libs.data[0]._id
        }));
      }

      setMessage('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to load resources';
      setMessage(msg);
      showToast(msg, 'error');
    }
  };

  useEffect(() => {
    load();
  }, [query, typeFilter, libraryFilter]);

  const updateField = (key, value) => {
    setForm((current) => {
      if (key === 'resourceType') {
        const nextType = normalizeTypeValue(value) || 'book';
        if (nextType !== 'book') {
          return { ...current, resourceType: nextType, barcode: '', author: '', genre: '' };
        }
        return { ...current, resourceType: nextType };
      }

      return { ...current, [key]: value };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'cover') return;
        if (value !== undefined && value !== null && value !== '') fd.append(key, value);
      });
      if (!fd.get('availableQuantity')) fd.append('availableQuantity', form.quantity || 1);
      if (form.cover) fd.append('cover', form.cover);

      if (editingId) {
        await api.patch(`/resources/${editingId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage('Resource updated');
        showToast('Resource updated', 'success');
      } else {
        await api.post('/resources', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage('Resource created');
        showToast('Resource created', 'success');
      }

      setForm({ ...emptyForm, library: form.library || (libraries[0]?._id || '') });
      setEditingId(null);
      setNewType('');
      load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Save failed';
      setMessage(msg);
      showToast(msg, 'error');
    }
  };

  const addGenreInline = async () => {
    if (!newGenre.trim()) {
      showToast('Enter a genre name', 'error');
      return;
    }

    try {
      await api.post('/genres', { name: newGenre.trim() });
      setNewGenre('');
      const refreshed = await api.get('/genres');
      setGenres(refreshed.data || []);
      showToast('Genre added', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to add genre';
      setMessage(msg);
      showToast(msg, 'error');
    }
  };

  const deleteGenreInline = async (genre) => {
    const usageCount = items.filter((item) => String(item.genre?._id || item.genre || '') === String(genre._id)).length;
    const confirmMessage = usageCount
      ? `Delete "${genre.name}"? ${usageCount} resource(s) will lose this genre tag.`
      : `Delete "${genre.name}"?`;

    if (!confirm(confirmMessage)) return;

    try {
      await api.delete(`/genres/${genre._id}`);
      if (form.genre === genre._id) {
        setForm((current) => ({ ...current, genre: '' }));
      }
      const refreshed = await api.get('/genres');
      setGenres(refreshed.data || []);
      showToast('Genre deleted', 'info');
      load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to delete genre';
      setMessage(msg);
      showToast(msg, 'error');
    }
  };

  const addTypeInline = () => {
    const normalized = normalizeTypeValue(newType);
    if (!normalized) {
      showToast('Enter a resource type name', 'error');
      return;
    }

    setForm((current) => ({ ...current, resourceType: normalized }));
    setNewType('');
    showToast('Type added to the form. Save a resource with it to keep using it.', 'success');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this resource?')) return;

    try {
      await api.delete(`/resources/${id}`);
      setItems((current) => current.filter((item) => item._id !== id));
      showToast('Resource deleted', 'info');
    } catch (err) {
      const msg = err.response?.data?.message || 'Delete failed';
      setMessage(msg);
      showToast(msg, 'error');
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      resourceType: item.resourceType,
      library: item.library?._id || item.library,
      quantity: item.quantity,
      availableQuantity: item.availableQuantity,
      barcode: item.barcode || '',
      author: item.author || '',
      genre: item.genre?._id || item.genre || '',
      description: item.description || '',
      cover: null
    });
  };

  const visibleLibraries = user?.role === 'librarian' ? libraries.filter((lib) => lib._id === user.library) : libraries;
  const presetLibraryNames = ['Junior High Library', 'Senior High Library', 'College Library'];
  const getLibIdByName = (name) => visibleLibraries.find((lib) => lib.name?.toLowerCase() === name.toLowerCase())?._id || '';
  const filterOptions = [{ label: 'All Libraries', value: '' }, ...presetLibraryNames.map((name) => ({ label: name, value: getLibIdByName(name) }))];
  const showLibrarySelect = user?.role === 'developer';
  const isBook = form.resourceType === 'book';

  const typeOptions = useMemo(() => {
    const values = [...defaultResourceTypes, ...items.map((item) => item.resourceType), form.resourceType, typeFilter]
      .map(normalizeTypeValue)
      .filter(Boolean);

    return [...new Set(values)].map((value) => ({
      value,
      label: formatTypeLabel(value)
    }));
  }, [form.resourceType, items, typeFilter]);

  const totals = items.reduce((acc, item) => {
    acc.total += item.quantity || 0;
    acc.available += item.availableQuantity || 0;
    acc.reserved += Math.max((item.quantity || 0) - (item.availableQuantity || 0), 0);
    return acc;
  }, { total: 0, available: 0, reserved: 0 });

  const statusLabel = (item) => {
    if ((item.availableQuantity || 0) === 0) return { text: 'Checked Out', className: 'bg-red-100 text-red-700' };
    if ((item.availableQuantity || 0) < (item.quantity || 0)) return { text: 'Already Reserved', className: 'bg-amber-100 text-amber-700' };
    return { text: 'Available', className: 'bg-green-100 text-green-700' };
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-1">
        <h2 className="page-title">Manage Resources</h2>
        <p className="text-sm text-gray-600">Create, edit, and track inventory status across libraries.</p>
      </div>
      {message && <div className="text-sm text-red-600 mb-2">{message}</div>}

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div className="card-panel">
          <div className="text-xs text-gray-500">Total Items</div>
          <div className="text-2xl font-bold">{totals.total}</div>
        </div>
        <div className="card-panel">
          <div className="text-xs text-gray-500">Available</div>
          <div className="text-2xl font-bold text-green-600">{totals.available}</div>
        </div>
        <div className="card-panel">
          <div className="text-xs text-gray-500">Reserved / Checked Out</div>
          <div className="text-2xl font-bold text-amber-600">{totals.reserved}</div>
        </div>
      </div>

      <div className="card-panel mb-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-gray-600 mb-1">Search</div>
            <input className="input" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Type</div>
            <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          {showLibrarySelect && (
            <div>
              <div className="text-xs text-gray-600 mb-1">Library</div>
              <select className="input" value={libraryFilter} onChange={(e) => setLibraryFilter(e.target.value)}>
                {filterOptions.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={submit} className="card-panel mb-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">Title</div>
            <input className="input" placeholder="Title" value={form.title} onChange={(e) => updateField('title', e.target.value)} required />
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">Type</div>
            <select className="input" value={form.resourceType} onChange={(e) => updateField('resourceType', e.target.value)}>
              {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-gray-600 mb-1">Add a new type</div>
            <div className="flex gap-2 flex-wrap">
              <input
                className="input flex-1"
                placeholder="Examples: camera, tablet, lab_kit"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              />
              <button type="button" className="btn-primary" onClick={addTypeInline}>Add Type</button>
            </div>
            <div className="text-xs text-gray-500 mt-2">New types become reusable once you save a resource with that type.</div>
          </div>

          {isBook ? (
            <div>
              <div className="text-xs text-gray-600 mb-1">Barcode</div>
              <input className="input" placeholder="Barcode" value={form.barcode} onChange={(e) => updateField('barcode', e.target.value)} />
            </div>
          ) : (
            <div className="surface-muted">
              <div className="font-semibold">Barcode not required</div>
              <div className="text-sm text-gray-600 mt-1">Only books use barcode tracking in this system.</div>
            </div>
          )}

          {showLibrarySelect ? (
            <div>
              <div className="text-xs text-gray-600 mb-1">Library</div>
              <select className="input" value={form.library} onChange={(e) => updateField('library', e.target.value)}>
                {visibleLibraries.map((lib) => <option key={lib._id} value={lib._id}>{lib.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <div className="text-xs text-gray-600 mb-1">Library</div>
              <input className="input" value={visibleLibraries[0]?.name || 'Your Library'} disabled />
            </div>
          )}

          <div>
            <div className="text-xs text-gray-600 mb-1">Quantity</div>
            <input className="input" type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={(e) => updateField('quantity', Number(e.target.value))} />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Available</div>
            <input className="input" type="number" min="0" placeholder="Available" value={form.availableQuantity} onChange={(e) => updateField('availableQuantity', Number(e.target.value))} />
          </div>

          {isBook && (
            <>
              <div>
                <div className="text-xs text-gray-600 mb-1">Author</div>
                <input className="input" placeholder="Author" value={form.author} onChange={(e) => updateField('author', e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Genre</div>
                <select className="input" value={form.genre} onChange={(e) => updateField('genre', e.target.value)}>
                  <option value="">Genre</option>
                  {genres.map((genre) => <option key={genre._id} value={genre._id}>{genre.name}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="text-xs text-gray-600 mb-1">Add genre</div>
                <div className="flex gap-2 flex-wrap">
                  <input className="input flex-1" placeholder="Add genre" value={newGenre} onChange={(e) => setNewGenre(e.target.value)} />
                  <button type="button" className="btn-primary" onClick={addGenreInline}>Add Genre</button>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="text-xs text-gray-600 mb-2">Existing genres</div>
                <div className="flex gap-2 flex-wrap">
                  {genres.length === 0 && <span className="text-sm text-gray-500">No genres yet.</span>}
                  {genres.map((genre) => (
                    <span key={genre._id} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm">
                      {genre.name}
                      <button type="button" className="text-red-600 hover:text-red-700" onClick={() => deleteGenreInline(genre)}>
                        Delete
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div>
          <div className="text-xs text-gray-600 mb-1">Description</div>
          <textarea className="input" placeholder="Description" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <div className="text-xs text-gray-600 mb-1">Cover image</div>
            <input type="file" accept="image/*" onChange={(e) => updateField('cover', e.target.files?.[0])} />
          </div>
          <button className="btn-primary">{editingId ? 'Update Resource' : 'Create Resource'}</button>
        </div>
      </form>

      <table className="table-shell">
        <thead><tr>
          <th>Title</th><th>Type</th><th>Status</th><th>Availability</th><th>Library</th><th>Barcode</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.title}</td>
              <td>{formatTypeLabel(item.resourceType)}</td>
              <td>
                {item.resourceType === 'book' ? (item.genre?.name || '') : ''}
                <div className="mt-1">
                  {(() => {
                    const status = statusLabel(item);
                    return <span className={`badge ${status.className}`}>{status.text}</span>;
                  })()}
                </div>
              </td>
              <td>
                <div className="font-semibold">{item.availableQuantity}/{item.quantity}</div>
                <div className="text-xs text-gray-500">
                  Reserved/Out: {Math.max((item.quantity || 0) - (item.availableQuantity || 0), 0)} | Available: {item.availableQuantity || 0}
                </div>
              </td>
              <td>{item.library?.name || item.library}</td>
              <td>{item.resourceType === 'book' ? (item.barcode || '-') : 'Book only'}</td>
              <td>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" className="btn-ghost" onClick={() => startEdit(item)}>Edit</button>
                  <button type="button" className="btn-ghost" onClick={() => handleDelete(item._id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}
