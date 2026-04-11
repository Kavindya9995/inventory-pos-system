import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { suppliersAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

const EMPTY = { name: '', contact: '', phone: '', email: '', address: '' };

export default function SuppliersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = ['admin', 'manager'].includes(user?.role);

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersAPI.getAll().then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (d) => editItem ? suppliersAPI.update(editItem.id, d) : suppliersAPI.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toast.success(editItem ? 'Supplier updated' : 'Supplier added'); closeModal(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => suppliersAPI.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('Supplier deleted'); setDeleteTarget(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Cannot delete supplier with products'),
  });

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (s) => { setEditItem(s); setForm({ name: s.name, contact: s.contact || '', phone: s.phone || '', email: s.email || '', address: s.address || '' }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditItem(null); setForm(EMPTY); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => { e.preventDefault(); saveMutation.mutate(form); };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left"><h2>Suppliers</h2><p>{suppliers.length} suppliers</p></div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openAdd}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Supplier
          </button>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          {isLoading ? <div className="loading-center"><div className="spinner" /></div>
            : !suppliers.length ? <div className="empty-state"><p>No suppliers yet</p></div>
            : (
              <table>
                <thead><tr><th>#</th><th>Name</th><th>Contact</th><th>Phone</th><th>Email</th><th>Address</th>{canEdit && <th>Actions</th>}</tr></thead>
                <tbody>
                  {suppliers.map((s, i) => (
                    <tr key={s.id}>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td style={{ color: 'var(--text2)' }}>{s.contact || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.phone || '—'}</td>
                      <td style={{ color: 'var(--text2)', fontSize: 12 }}>{s.email || '—'}</td>
                      <td style={{ color: 'var(--text3)', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address || '—'}</td>
                      {canEdit && (
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(s)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            {user?.role === 'admin' && (
                              <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDeleteTarget(s)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
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

      <Modal open={modalOpen} onClose={closeModal} title={editItem ? 'Edit Supplier' : 'Add Supplier'} size="md"
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : (editItem ? 'Save' : 'Add')}</button></>}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ gap: 12 }}>
            <div className="form-group"><label className="form-label">Supplier Name *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Company or person name" /></div>
            <div className="form-grid form-grid-2" style={{ gap: 12 }}>
              <div className="form-group"><label className="form-label">Contact Person</label><input className="form-input" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Contact name" /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="077 000 0000" /></div>
            </div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@supplier.com" /></div>
            <div className="form-group"><label className="form-label">Address</label><textarea className="form-textarea" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, city..." rows={2} /></div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title="Delete Supplier" message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" danger loading={deleteMutation.isPending} />
    </div>
  );
}
