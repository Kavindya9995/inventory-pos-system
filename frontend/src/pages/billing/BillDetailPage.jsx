import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { billsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import { printContent } from '../../utils/print';

const fmt = (n) => `LKR ${parseFloat(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
const SHOP = process.env.REACT_APP_SHOP_NAME || 'Lumoz';

// Logo URL from public folder — works in both dev and production build
const LOGO_URL = `${window.location.origin}/logo.jpeg`;

function buildReceiptHTML(bill) {
  const itemRows = (bill.items || []).map(item => `
    <div style="margin-bottom:5px;">
      <div style="font-weight:700;">${item.product_name}${item.size ? ` [${item.size}]` : ''}${item.color ? ` (${item.color})` : ''}</div>
      <div class="receipt-row">
        <span style="color:#000; font-weight:700;">${item.quantity} &times; ${fmt(item.unit_price)}</span>
        <span style="font-weight:700;">${fmt(item.total_price)}</span>
      </div>
    </div>
  `).join('');

  const discountRow = parseFloat(bill.discount) > 0
    ? `<div class="receipt-row"><span>Discount</span><span>- ${fmt(bill.discount)}</span></div>` : '';
  const taxRow = parseFloat(bill.tax) > 0
    ? `<div class="receipt-row"><span>Tax</span><span>+ ${fmt(bill.tax)}</span></div>` : '';
  const notesRow = bill.notes
    ? `<div style="margin-top:8px; color:#000; font-size:11px; font-weight:700;">Note: ${bill.notes}</div>` : '';
  const customerRow = bill.customer_name
    ? `<div>Customer: ${bill.customer_name}${bill.customer_phone ? ` (${bill.customer_phone})` : ''}</div>` : '';

  return `
    <div class="receipt">
      <div class="receipt-title">${SHOP}</div>
      <div class="receipt-sub">${new Date(bill.created_at).toLocaleString('en-LK')}</div>
      <hr class="receipt-divider" />
      <div class="receipt-row" style="margin-bottom:2px;">
        <span>Bill #: <strong>${bill.bill_number}</strong></span>
        <span>Cashier: ${bill.cashier_name || ''}</span>
      </div>
      ${customerRow}
      <hr class="receipt-divider" />
      ${itemRows}
      <hr class="receipt-divider" />
      <div class="receipt-row"><span>Subtotal</span><span>${fmt(bill.subtotal)}</span></div>
      ${discountRow}
      ${taxRow}
      <hr class="receipt-divider" />
      <div class="receipt-total-row"><span>TOTAL</span><span>${fmt(bill.total)}</span></div>
      <div class="receipt-total-row"><span>Paid Amount</span><span>${fmt(bill.customer_paid)}</span></div>
      <div class="receipt-total-row"><span>Balance</span><span>${fmt(bill.customer_paid-bill.total)}</span></div>
      <div class="receipt-row" style="margin-top:4px;">
        <span>Payment</span>
        <span style="text-transform:capitalize">${bill.payment_method}</span>
      </div>
      ${notesRow}
      <hr class="receipt-divider" />
      <div class="receipt-sub">No.49, Elliot Road, Galle</div>
      <div class="receipt-sub">+94 70 3927498</div>
      <div class="receipt-exchange">* Exchange within 7 days with receipt</div>
      <div class="receipt-footer">*** Thank you! Come Again! ***</div>
    </div>
  `;
}

export default function BillDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [voidOpen, setVoidOpen] = useState(false);

  const { data: bill, isLoading } = useQuery({
    queryKey: ['bill', id],
    queryFn: () => billsAPI.getOne(id).then(r => r.data),
  });

  const handlePrint = () => {
    if (!bill) return;
    printContent(buildReceiptHTML(bill), `Receipt - ${bill.bill_number}`);
  };

  const voidMutation = useMutation({
    mutationFn: () => billsAPI.voidBill(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bill', id] });
      qc.invalidateQueries({ queryKey: ['bills'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Bill voided and stock restored');
      setVoidOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to void'),
  });

  if (isLoading) return (
    <div className="page"><div className="loading-center"><div className="spinner" /></div></div>
  );
  if (!bill) return <div className="page"><p>Bill not found</p></div>;

  const canVoid = ['admin', 'manager'].includes(user?.role) && bill.status === 'completed';

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>{bill.bill_number}</h2>
          <p>
            <span className={`badge ${bill.status === 'completed' ? 'badge-green' : bill.status === 'voided' ? 'badge-red' : 'badge-yellow'}`}>
              {bill.status}
            </span>
            <span style={{ marginLeft: 10, color: 'var(--text3)', fontSize: 12 }}>
              {new Date(bill.created_at).toLocaleString('en-LK')}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/bills" className="btn btn-secondary btn-sm">← Back</Link>
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print Receipt
          </button>
          {canVoid && (
            <button className="btn btn-danger btn-sm" onClick={() => setVoidOpen(true)}>
              Void Bill
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
        {/* Items Table */}
        <div className="card">
          <div className="card-header"><div className="card-title">Items</div></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Product</th><th>Code</th><th>Size</th>
                  <th>Color</th><th>Qty</th><th>Unit Price</th><th>Total</th>
                </tr>
              </thead>
              <tbody>
                {bill.items?.map((item, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text3)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{item.product_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>{item.product_code}</td>
                    <td style={{ color: 'var(--text2)' }}>{item.size || '—'}</td>
                    <td style={{ color: 'var(--text2)' }}>{item.color || '—'}</td>
                    <td><span className="badge badge-blue">{item.quantity}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{fmt(item.unit_price)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
                      {fmt(item.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Customer info */}
          <div className="card">
            <div className="card-header"><div className="card-title">Customer</div></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13 }}>
                {[
                  ['Name',    bill.customer_name || 'Walk-in'],
                  ['Phone',   bill.customer_phone || '—'],
                  ['Cashier', bill.cashier_name],
                  ['Payment', bill.payment_method],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text2)' }}>{label}</span>
                    <span style={{ textTransform: label === 'Payment' ? 'capitalize' : 'none' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bill summary */}
          <div className="card">
            <div className="card-header"><div className="card-title">Summary</div></div>
            <div className="card-body">
              <div className="bill-summary-block" style={{ margin: 0 }}>
                <div className="bill-summary-row">
                  <span style={{ color: 'var(--text2)' }}>Subtotal</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(bill.subtotal)}</span>
                </div>
                {parseFloat(bill.discount) > 0 && (
                  <div className="bill-summary-row">
                    <span style={{ color: 'var(--red)' }}>Discount</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>- {fmt(bill.discount)}</span>
                  </div>
                )}
                {parseFloat(bill.tax) > 0 && (
                  <div className="bill-summary-row">
                    <span style={{ color: 'var(--text2)' }}>Tax</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>+ {fmt(bill.tax)}</span>
                  </div>
                )}
                <div className="bill-summary-row total-row">
                  <span>Total</span>
                  <span>{fmt(bill.total)}</span>
                </div>
                <div className="bill-summary-row total-row">
                  <span>Paid Amount</span>
                  <span>{fmt(bill.customer_paid)}</span>
                </div>
                <div className="bill-summary-row total-row">
                  <span>Balance</span>
                  <span>{fmt(bill.customer_paid-bill.total)}</span>
                </div>
              </div>
              {bill.notes && (
                <div style={{ marginTop: 12, padding: 10, background: 'var(--surface3)', borderRadius: 7, fontSize: 12, color: 'var(--text2)' }}>
                  📝 {bill.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={voidOpen}
        onClose={() => setVoidOpen(false)}
        onConfirm={() => voidMutation.mutate()}
        title="Void Bill"
        message="This will void the bill and restore all stock quantities. This cannot be undone."
        confirmLabel="Void Bill"
        danger
        loading={voidMutation.isPending}
      />
    </div>
  );
}