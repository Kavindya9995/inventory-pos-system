import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usersAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

const EMPTY = { name: '', username: '', password: '', role: 'cashier' };
const ROLES = ['admin', 'manager', 'cashier'];
const ROLE_BADGE = { admin: 'badge-red', manager: 'badge-yellow', cashier: 'badge-blue' };

export default function UsersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getAll().then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (d) => editUser ? usersAPI.update(editUser.id, d) : usersAPI.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(editUser ? 'User updated' : 'User created'); closeModal(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersAPI.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deleted'); setDeleteTarget(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const toggleActive = (u) => usersAPI.update(u.id, { is_active: !u.is_active })
    .then(() => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(u.is_active ? 'User deactivated' : 'User activated'); })
    .catch(() => toast.error('Failed to update'));

  const openAdd = () => { setEditUser(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (u) => { setEditUser(u); setForm({ name: u.name, username: u.username, password: '', role: u.role }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditUser(null); setForm(EMPTY); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e) => { e.preventDefault(); const d = { ...form }; if (!d.password) delete d.password; saveMutation.mutate(d); };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left"><h2>User Management</h2><p>{users.length} users</p></div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add User
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          {isLoading ? <div className="loading-center"><div className="spinner" /></div>
            : !users.length ? <div className="empty-state"><p>No users found</p></div>
            : (
              <table>
                <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 500 }}>{u.name} {u.id === me?.id && <span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>(you)</span>}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text2)' }}>@{u.username}</td>
                      <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-green' : 'badge-gray'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('en-LK')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(u)} title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          {u.id !== me?.id && (
                            <>
                              <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleActive(u)} style={{ fontSize: 11 }}>
                                {u.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDeleteTarget(u)} title="Delete">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editUser ? 'Edit User' : 'Create User'} size="sm"
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : (editUser ? 'Save' : 'Create')}</button></>}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ gap: 12 }}>
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Full name" /></div>
            <div className="form-group"><label className="form-label">Username *</label><input className="form-input" value={form.username} onChange={e => set('username', e.target.value)} required placeholder="username" disabled={!!editUser} /></div>
            <div className="form-group">
              <label className="form-label">{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} required={!editUser} placeholder={editUser ? 'Leave blank to keep current' : 'Min 6 characters'} />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
              <span className="form-hint">Admin: full access · Manager: no user mgmt · Cashier: billing only</span>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title="Delete User" message={`Permanently delete user "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" danger loading={deleteMutation.isPending} />
    </div>
  );
}
