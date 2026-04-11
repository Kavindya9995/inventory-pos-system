import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { billsAPI, productsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const fmt = (n) => `LKR ${parseFloat(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: dash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => billsAPI.getDashboard().then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: prodStats } = useQuery({
    queryKey: ['product-stats'],
    queryFn: () => productsAPI.getStats().then(r => r.data),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => productsAPI.getAll({ low_stock: true }).then(r => r.data),
  });

  const today = new Date().toLocaleDateString('en-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p>{today}</p>
        </div>
        <Link to="/billing" className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Bill
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Today's Bills</div>
          <div className="stat-value blue">{dash?.today?.count || 0}</div>
          <div className="stat-sub">transactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's Revenue</div>
          <div className="stat-value green">{fmt(dash?.today?.revenue)}</div>
          <div className="stat-sub">completed sales</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Month Revenue</div>
          <div className="stat-value accent">{fmt(dash?.month?.revenue)}</div>
          <div className="stat-sub">{dash?.month?.count || 0} bills this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{prodStats?.total || 0}</div>
          <div className="stat-sub">
            <span style={{ color: 'var(--red)' }}>{prodStats?.low_stock || 0} low</span>
            {' · '}
            <span style={{ color: 'var(--text3)' }}>{prodStats?.out_of_stock || 0} out</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        {/* Recent Bills */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Bills</div>
            <Link to="/bills" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="card-body" style={{ padding: '12px 0 0' }}>
            {!dash?.recent?.length ? (
              <div className="empty-state"><p>No bills yet today</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Bill #</th><th>Customer</th><th>Items</th><th>Total</th><th>Cashier</th><th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dash.recent.map(b => (
                      <tr key={b.id}>
                        <td>
                          <Link to={`/bills/${b.id}`} style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                            {b.bill_number}
                          </Link>
                        </td>
                        <td style={{ color: b.customer_name ? 'var(--text)' : 'var(--text3)' }}>
                          {b.customer_name || 'Walk-in'}
                        </td>
                        <td><span className="badge badge-blue">{b.item_count}</span></td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)' }}>{fmt(b.total)}</td>
                        <td style={{ color: 'var(--text2)' }}>{b.cashier_name}</td>
                        <td style={{ color: 'var(--text3)', fontSize: 12 }}>
                          {new Date(b.created_at).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">⚠️ Low Stock</div>
            <Link to="/inventory" className="btn btn-ghost btn-sm">Manage</Link>
          </div>
          <div className="card-body" style={{ padding: '12px 0 0' }}>
            {!lowStock?.length ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <p style={{ color: 'var(--green)' }}>✓ All stock levels OK</p>
              </div>
            ) : (
              <div>
                {lowStock.slice(0, 8).map(p => (
                  <div key={p.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 20px', borderBottom: '1px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{p.code}</div>
                    </div>
                    <span className={`badge ${p.quantity === 0 ? 'badge-red' : 'badge-yellow'}`}>
                      {p.quantity === 0 ? 'Out' : `Qty: ${p.quantity}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
