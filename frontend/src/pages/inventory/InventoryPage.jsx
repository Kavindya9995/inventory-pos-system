import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productsAPI, suppliersAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ColorTagsInput, { getDotColor } from '../../components/ColorTagsInput';

const EMPTY_FORM = {
  code: '', name: '', supplier_id: '', supplier_code: '',
  supplier_price: '', selling_price: '', size: '', quantity: '', colors: [], description: '',
};

const fmt = (n) => `LKR ${parseFloat(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

export default function InventoryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = ['admin', 'manager'].includes(user?.role);

  const [search, setSearch] = useState('');
  const [suppFilter, setSuppFilter] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(search);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', debouncedSearch, suppFilter, lowStock],
    queryFn: () => productsAPI.getAll({ search: debouncedSearch, supplier_id: suppFilter, low_stock: lowStock || undefined }).then(r => r.data),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersAPI.getAll().then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editProduct ? productsAPI.update(editProduct.id, data) : productsAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product-stats'] });
      toast.success(editProduct ? 'Product updated' : 'Product created');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productsAPI.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product-stats'] });
      toast.success('Product removed');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const openAdd = () => { setEditProduct(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      code: p.code, name: p.name, supplier_id: p.supplier_id || '',
      supplier_code: p.supplier_code || '', supplier_price: p.supplier_price,
      selling_price: p.selling_price, size: p.size || '',
      quantity: p.quantity, colors: p.colors || [], description: p.description || '',
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditProduct(null); setForm(EMPTY_FORM); };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      supplier_id: form.supplier_id || null,
      supplier_price: parseFloat(form.supplier_price) || 0,
      selling_price: parseFloat(form.selling_price) || 0,
      quantity: parseInt(form.quantity) || 0,
    });
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Products</h2>
          <p>{products.length} products found</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openAdd}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="form-input" placeholder="Search code, name, supplier code..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: 180 }} value={suppFilter} onChange={e => setSuppFilter(e.target.value)}>
              <option value="">All Suppliers</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} />
              Low stock only
            </label>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          {isLoading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : !products.length ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              <p>No products found</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Code</th><th>Name</th><th>Supplier</th><th>Sup. Code</th>
                  <th>Cost</th><th>Price</th><th>Size</th><th>Colors</th>
                  <th>Stock</th>{canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{p.code}</span></td>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{p.supplier_name || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{p.supplier_code || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text2)' }}>{fmt(p.supplier_price)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>{fmt(p.selling_price)}</td>
                    <td style={{ color: 'var(--text2)' }}>{p.size || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(p.colors || []).slice(0, 4).map((c, i) => (
                          <span key={i} className="color-dot" style={{ background: getDotColor(c) }} title={c} />
                        ))}
                        {(p.colors || []).length > 4 && <span style={{ fontSize: 10, color: 'var(--text3)' }}>+{p.colors.length - 4}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${p.quantity === 0 ? 'badge-red' : p.quantity < 5 ? 'badge-yellow' : 'badge-green'}`}>
                        {p.quantity}
                      </span>
                    </td>
                    {canEdit && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(p)} title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          {user?.role === 'admin' && (
                            <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDeleteTarget(p)} title="Delete">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editProduct ? 'Edit Product' : 'Add Product'} size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : (editProduct ? 'Save Changes' : 'Add Product')}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid form-grid-2" style={{ gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Product Code *</label>
              <input className="form-input" placeholder="e.g. PRD001" value={form.code} onChange={e => set('code', e.target.value)} required 
              // disabled={!!editProduct} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input className="form-input" placeholder="e.g. White T-Shirt" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <select className="form-select" value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)}>
                <option value="">Select supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Supplier Code</label>
              <input className="form-input" placeholder="Supplier's product code" value={form.supplier_code} onChange={e => set('supplier_code', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Supplier Price (LKR)</label>
              <input className="form-input" type="number" step="0.01" min="0" placeholder="0.00" value={form.supplier_price} onChange={e => set('supplier_price', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Selling Price (LKR)</label>
              <input className="form-input" type="number" step="0.01" min="0" placeholder="0.00" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Size</label>
              <input className="form-input" placeholder="e.g. M, L, 32, 42..." value={form.size} onChange={e => set('size', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input className="form-input" type="number" min="0" placeholder="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} required />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Colors</label>
            <ColorTagsInput value={form.colors} onChange={v => set('colors', v)} />
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Optional product description..." value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title="Remove Product"
        message={`Remove "${deleteTarget?.name}" from inventory? This will deactivate the product.`}
        confirmLabel="Remove"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
