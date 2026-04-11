import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { billsAPI } from '../../api';
import { useDebounce } from '../../hooks/useDebounce';

const fmt = (n) => `LKR ${parseFloat(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

export default function BillHistoryPage() {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('');

  const debouncedSearch = useDebounce(search);

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['bills', debouncedSearch, dateFrom, dateTo, status],
    queryFn: () => billsAPI.getAll({ search: debouncedSearch, date_from: dateFrom, date_to: dateTo, status }).then(r => r.data),
  });

  const totalRevenue = bills.filter(b => b.status === 'completed').reduce((s, b) => s + parseFloat(b.total), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left"><h2>Bill History</h2><p>{bills.length} bills · {fmt(totalRevenue)} total</p></div>
        <Link to="/billing" className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Bill
        </Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="form-input" placeholder="Search bill # or customer..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <input className="form-input" type="date" style={{ width: 150 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
            <input className="form-input" type="date" style={{ width: 150 }} value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" />
            <select className="form-select" style={{ width: 140 }} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="voided">Voided</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setStatus(''); }}>Clear</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {isLoading ? <div className="loading-center"><div className="spinner" /></div>
            : !bills.length ? <div className="empty-state"><p>No bills found</p></div>
            : (
              <table>
                <thead>
                  <tr><th>Bill #</th><th>Customer</th><th>Items</th><th>Subtotal</th><th>Discount</th><th>Total</th><th>Payment</th><th>Status</th><th>Cashier</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                  {bills.map(b => (
                    <tr key={b.id}>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{b.bill_number}</span></td>
                      <td style={{ color: b.customer_name ? 'var(--text)' : 'var(--text3)' }}>{b.customer_name || 'Walk-in'}</td>
                      <td><span className="badge badge-blue">{b.item_count}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{fmt(b.subtotal)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--red)' }}>
                        {parseFloat(b.discount) > 0 ? `- ${fmt(b.discount)}` : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>{fmt(b.total)}</td>
                      <td><span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{b.payment_method}</span></td>
                      <td>
                        <span className={`badge ${b.status === 'completed' ? 'badge-green' : b.status === 'voided' ? 'badge-red' : 'badge-yellow'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text2)', fontSize: 12 }}>{b.cashier_name}</td>
                      <td style={{ color: 'var(--text3)', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {new Date(b.created_at).toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <br />
                        <span style={{ fontSize: 10 }}>{new Date(b.created_at).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td>
                        <Link to={`/bills/${b.id}`} className="btn btn-ghost btn-sm">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </div>
  );
}
