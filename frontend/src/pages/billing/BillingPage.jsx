// import { useState, useRef } from 'react';
// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';
// import { productsAPI, billsAPI } from '../../api';

// const fmt = (n) => `LKR ${parseFloat(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

// export default function BillingPage() {
//   const qc = useQueryClient();
//   const navigate = useNavigate();
//   const codeRef = useRef(null);

//   const [items, setItems] = useState([]);
//   const [codeInput, setCodeInput] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [searching, setSearching] = useState(false);
//   const [customer, setCustomer] = useState({ name: '', phone: '' });
//   const [discount, setDiscount] = useState('');
//   const [tax, setTax] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('cash');
//   const [notes, setNotes] = useState('');

//   // Search product by code
//   const searchProduct = async (code) => {
//     if (!code.trim()) return;
//     setSearching(true);
//     try {
//       const res = await productsAPI.getByCode(code.trim());
//       const p = res.data;
//       addItem(p);
//       setCodeInput('');
//       setSearchResults([]);
//     } catch {
//       // Try name search
//       try {
//         const res = await productsAPI.getAll({ search: code.trim() });
//         if (res.data.length === 1) { addItem(res.data[0]); setCodeInput(''); setSearchResults([]); }
//         else if (res.data.length > 1) setSearchResults(res.data.slice(0, 6));
//         else toast.error('Product not found');
//       } catch { toast.error('Product not found'); }
//     } finally {
//       setSearching(false);
//     }
//   };

//   const addItem = (product, color = '') => {
//     if (product.quantity <= 0) { toast.error(`"${product.name}" is out of stock`); return; }
//     setItems(prev => {
//       const existIdx = prev.findIndex(i => i.product_id === product.id && i.color === color && i.size === (product.size || ''));
//       if (existIdx >= 0) {
//         const updated = [...prev];
//         const newQty = updated[existIdx].quantity + 1;
//         if (newQty > product.quantity) { toast.error(`Only ${product.quantity} in stock`); return prev; }
//         updated[existIdx] = { ...updated[existIdx], quantity: newQty };
//         return updated;
//       }
//       return [...prev, {
//         product_id: product.id,
//         product_name: product.name,
//         product_code: product.code,
//         size: product.size || '',
//         color,
//         unit_price: parseFloat(product.selling_price),
//         quantity: 1,
//         max_qty: product.quantity,
//         available_colors: product.colors || [],
//       }];
//     });
//     setSearchResults([]);
//     setTimeout(() => codeRef.current?.focus(), 50);
//   };

//   const updateItem = (idx, field, value) => {
//     setItems(prev => {
//       const updated = [...prev];
//       if (field === 'quantity') {
//         const v = Math.max(1, Math.min(parseInt(value) || 1, updated[idx].max_qty));
//         updated[idx] = { ...updated[idx], quantity: v };
//       } else {
//         updated[idx] = { ...updated[idx], [field]: value };
//       }
//       return updated;
//     });
//   };

//   const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

//   const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
//   const discountAmt = parseFloat(discount) || 0;
//   const taxAmt = parseFloat(tax) || 0;
//   const total = subtotal - discountAmt + taxAmt;

//   const createMutation = useMutation({
//     mutationFn: (data) => billsAPI.create(data),
//     onSuccess: (res) => {
//       qc.invalidateQueries({ queryKey: ['products'] });
//       qc.invalidateQueries({ queryKey: ['product-stats'] });
//       qc.invalidateQueries({ queryKey: ['dashboard'] });
//       toast.success('Bill created!');
//       navigate(`/bills/${res.data.id}`);
//     },
//     onError: (err) => toast.error(err.response?.data?.message || 'Failed to create bill'),
//   });

//   const handleSubmit = () => {
//     if (!items.length) { toast.error('Add at least one item'); return; }
//     createMutation.mutate({
//       customer_name: customer.name || null,
//       customer_phone: customer.phone || null,
//       items: items.map(i => ({
//         product_id: i.product_id,
//         product_name: i.product_name,
//         size: i.size,
//         color: i.color || null,
//         quantity: i.quantity,
//         unit_price: i.unit_price,
//       })),
//       discount: discountAmt,
//       tax: taxAmt,
//       payment_method: paymentMethod,
//       notes,
//     });
//   };

//   return (
//     <div className="page">
//       <div className="page-header">
//         <div className="page-header-left"><h2>New Bill</h2><p>Create a sale transaction</p></div>
//       </div>

//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
//         {/* Left: Items */}
//         <div>
//           {/* Product Search */}
//           <div className="card" style={{ marginBottom: 14 }}>
//             <div className="card-header"><div className="card-title">Add Products</div></div>
//             <div className="card-body">
//               <div style={{ display: 'flex', gap: 8 }}>
//                 <div style={{ flex: 1, position: 'relative' }}>
//                   <input
//                     ref={codeRef}
//                     className="form-input"
//                     placeholder="Scan barcode or type product code / name..."
//                     value={codeInput}
//                     onChange={e => setCodeInput(e.target.value)}
//                     onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); searchProduct(codeInput); } }}
//                     autoFocus
//                   />
//                   {/* Dropdown results */}
//                   {searchResults.length > 0 && (
//                     <div style={{
//                       position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
//                       background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
//                       marginTop: 4, overflow: 'hidden', boxShadow: 'var(--shadow)',
//                     }}>
//                       {searchResults.map(p => (
//                         <div key={p.id}
//                           onClick={() => addItem(p)}
//                           style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
//                           onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
//                           onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
//                         >
//                           <div>
//                             <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', marginRight: 8 }}>{p.code}</span>
//                             <span style={{ fontSize: 13 }}>{p.name}</span>
//                             {p.size && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>({p.size})</span>}
//                           </div>
//                           <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
//                             <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)' }}>{fmt(p.selling_price)}</span>
//                             <span className={`badge ${p.quantity === 0 ? 'badge-red' : 'badge-green'}`}>{p.quantity}</span>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//                 <button className="btn btn-primary" onClick={() => searchProduct(codeInput)} disabled={searching}>
//                   {searching ? <span className="spinner" style={{ width: 14, height: 14 }} /> : (
//                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
//                   )}
//                   Add
//                 </button>
//               </div>
//               <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>Press Enter or click Add. Use barcode scanner for quick entry.</p>
//             </div>
//           </div>

//           {/* Items Table */}
//           <div className="card">
//             <div className="card-header"><div className="card-title">Bill Items</div><span style={{ fontSize: 12, color: 'var(--text3)' }}>{items.length} item(s)</span></div>
//             <div className="card-body" style={{ paddingTop: 12 }}>
//               {!items.length ? (
//                 <div className="empty-state" style={{ padding: 32 }}>
//                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 36, height: 36 }}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
//                   <p>No items added yet</p>
//                 </div>
//               ) : (
//                 <>
//                   {/* Header */}
//                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 70px 95px 32px', gap: 8, padding: '4px 0 8px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
//                     {['Product', 'Color', 'Qty', 'Price', ''].map((h, i) => (
//                       <div key={i} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</div>
//                     ))}
//                   </div>
//                   {items.map((item, idx) => (
//                     <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 70px 95px 32px', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(46,46,50,0.5)' }}>
//                       <div>
//                         <div style={{ fontSize: 13, fontWeight: 500 }}>{item.product_name}</div>
//                         <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
//                           {item.product_code}{item.size ? ` · ${item.size}` : ''}
//                         </div>
//                       </div>
//                       <div>
//                         {item.available_colors.length > 0 ? (
//                           <select className="form-select" style={{ fontSize: 12, padding: '5px 8px' }} value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)}>
//                             <option value="">—</option>
//                             {item.available_colors.map(c => <option key={c} value={c}>{c}</option>)}
//                           </select>
//                         ) : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
//                       </div>
//                       <div>
//                         <input type="number" className="form-input" style={{ fontSize: 13, padding: '5px 8px', textAlign: 'center' }} min="1" max={item.max_qty} value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
//                       </div>
//                       <div style={{ textAlign: 'right' }}>
//                         <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{fmt(item.unit_price * item.quantity)}</div>
//                         <div style={{ fontSize: 10, color: 'var(--text3)' }}>{fmt(item.unit_price)} ea</div>
//                       </div>
//                       <button className="btn btn-danger btn-icon" style={{ width: 28, height: 28 }} onClick={() => removeItem(idx)}>
//                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
//                       </button>
//                     </div>
//                   ))}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Right: Summary & Customer */}
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
//           {/* Customer */}
//           <div className="card">
//             <div className="card-header"><div className="card-title">Customer</div></div>
//             <div className="card-body">
//               <div className="form-grid" style={{ gap: 10 }}>
//                 <div className="form-group">
//                   <label className="form-label">Name</label>
//                   <input className="form-input" placeholder="Walk-in customer" value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} />
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">Phone</label>
//                   <input className="form-input" placeholder="077 000 0000" value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Payment */}
//           <div className="card">
//             <div className="card-header"><div className="card-title">Payment</div></div>
//             <div className="card-body">
//               <div className="form-grid" style={{ gap: 10 }}>
//                 <div className="form-group">
//                   <label className="form-label">Method</label>
//                   <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
//                     <option value="cash">Cash</option>
//                     <option value="card">Card</option>
//                     <option value="other">Other</option>
//                   </select>
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">Discount (LKR)</label>
//                   <input className="form-input" type="number" min="0" placeholder="0.00" value={discount} onChange={e => setDiscount(e.target.value)} />
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">Tax (LKR)</label>
//                   <input className="form-input" type="number" min="0" placeholder="0.00" value={tax} onChange={e => setTax(e.target.value)} />
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">Notes</label>
//                   <textarea className="form-textarea" rows={2} placeholder="Optional notes..." value={notes} onChange={e => setNotes(e.target.value)} />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Summary */}
//           <div className="card">
//             <div className="card-header"><div className="card-title">Summary</div></div>
//             <div className="card-body">
//               <div className="bill-summary-block" style={{ margin: 0 }}>
//                 <div className="bill-summary-row"><span style={{ color: 'var(--text2)' }}>Subtotal</span><span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(subtotal)}</span></div>
//                 {discountAmt > 0 && <div className="bill-summary-row"><span style={{ color: 'var(--red)' }}>Discount</span><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>- {fmt(discountAmt)}</span></div>}
//                 {taxAmt > 0 && <div className="bill-summary-row"><span style={{ color: 'var(--text2)' }}>Tax</span><span style={{ fontFamily: 'var(--font-mono)' }}>+ {fmt(taxAmt)}</span></div>}
//                 <div className="bill-summary-row total-row"><span>Total</span><span>{fmt(total)}</span></div>
//               </div>
//               <button className="btn btn-primary" style={{ width: '100%', marginTop: 14, padding: 12, fontSize: 15 }}
//                 onClick={handleSubmit} disabled={createMutation.isPending || !items.length}>
//                 {createMutation.isPending
//                   ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Creating Bill...</>
//                   : <>
//                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><polyline points="20 6 9 17 4 12"/></svg>
//                     Create Bill
//                   </>}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productsAPI, billsAPI } from '../../api';
import BarcodeScanner from '../../components/BarcodeScanner';

const fmt = (n) => `LKR ${parseFloat(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

export default function BillingPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const codeRef = useRef(null);

  const [items, setItems] = useState([]);
  const [codeInput, setCodeInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  // Called by BarcodeScanner when a code is detected
  const handleScan = (code) => {
    searchProduct(code);
  };

  // Search product by code
  const searchProduct = async (code) => {
    if (!code.trim()) return;
    setSearching(true);
    try {
      const res = await productsAPI.getByCode(code.trim());
      const p = res.data;
      addItem(p);
      setCodeInput('');
      setSearchResults([]);
    } catch {
      // Try name search
      try {
        const res = await productsAPI.getAll({ search: code.trim() });
        if (res.data.length === 1) { addItem(res.data[0]); setCodeInput(''); setSearchResults([]); }
        else if (res.data.length > 1) setSearchResults(res.data.slice(0, 6));
        else toast.error('Product not found');
      } catch { toast.error('Product not found'); }
    } finally {
      setSearching(false);
    }
  };

  const addItem = (product, color = '') => {
    if (product.quantity <= 0) { toast.error(`"${product.name}" is out of stock`); return; }
    setItems(prev => {
      const existIdx = prev.findIndex(i => i.product_id === product.id && i.color === color && i.size === (product.size || ''));
      if (existIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existIdx].quantity + 1;
        if (newQty > product.quantity) { toast.error(`Only ${product.quantity} in stock`); return prev; }
        updated[existIdx] = { ...updated[existIdx], quantity: newQty };
        return updated;
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        size: product.size || '',
        color,
        unit_price: parseFloat(product.selling_price),
        quantity: 1,
        max_qty: product.quantity,
        available_colors: product.colors || [],
      }];
    });
    setSearchResults([]);
    setTimeout(() => codeRef.current?.focus(), 50);
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      if (field === 'quantity') {
        const v = Math.max(1, Math.min(parseInt(value) || 1, updated[idx].max_qty));
        updated[idx] = { ...updated[idx], quantity: v };
      } else {
        updated[idx] = { ...updated[idx], [field]: value };
      }
      return updated;
    });
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const discountAmt = parseFloat(discount) || 0;
  const taxAmt = parseFloat(tax) || 0;
  const total = subtotal - discountAmt + taxAmt;

  const createMutation = useMutation({
    mutationFn: (data) => billsAPI.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product-stats'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Bill created!');
      navigate(`/bills/${res.data.id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create bill'),
  });

  const handleSubmit = () => {
    if (!items.length) { toast.error('Add at least one item'); return; }
    createMutation.mutate({
      customer_name: customer.name || null,
      customer_phone: customer.phone || null,
      items: items.map(i => ({
        product_id: i.product_id,
        product_name: i.product_name,
        size: i.size,
        color: i.color || null,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
      discount: discountAmt,
      tax: taxAmt,
      payment_method: paymentMethod,
      notes,
      customer_paid : paidAmount
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left"><h2>New Bill</h2><p>Create a sale transaction</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        {/* Left: Items */}
        <div>
          {/* Product Search */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header"><div className="card-title">Add Products</div></div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    ref={codeRef}
                    className="form-input"
                    placeholder="Scan barcode or type product code / name..."
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); searchProduct(codeInput); } }}
                    autoFocus
                  />
                  {/* Dropdown results */}
                  {searchResults.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                      background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
                      marginTop: 4, overflow: 'hidden', boxShadow: 'var(--shadow)',
                    }}>
                      {searchResults.map(p => (
                        <div key={p.id}
                          onClick={() => addItem(p)}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', marginRight: 8 }}>{p.code}</span>
                            <span style={{ fontSize: 13 }}>{p.name}</span>
                            {p.size && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>({p.size})</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)' }}>{fmt(p.selling_price)}</span>
                            <span className={`badge ${p.quantity === 0 ? 'badge-red' : 'badge-green'}`}>{p.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button className="btn btn-primary" onClick={() => searchProduct(codeInput)} disabled={searching}>
                  {searching ? <span className="spinner" style={{ width: 14, height: 14 }} /> : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  )}
                  Add
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setScannerOpen(true)}
                  title="Open camera barcode scanner"
                  style={{ flexShrink: 0 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Camera
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                Press Enter or click <strong>Add</strong>. Click <strong>Camera</strong> to scan with your webcam.
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="card">
            <div className="card-header"><div className="card-title">Bill Items</div><span style={{ fontSize: 12, color: 'var(--text3)' }}>{items.length} item(s)</span></div>
            <div className="card-body" style={{ paddingTop: 12 }}>
              {!items.length ? (
                <div className="empty-state" style={{ padding: 32 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 36, height: 36 }}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                  <p>No items added yet</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 70px 95px 32px', gap: 8, padding: '4px 0 8px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                    {['Product', 'Color', 'Qty', 'Price', ''].map((h, i) => (
                      <div key={i} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</div>
                    ))}
                  </div>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 70px 95px 32px', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(46,46,50,0.5)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{item.product_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                          {item.product_code}{item.size ? ` · ${item.size}` : ''}
                        </div>
                      </div>
                      <div>
                        {item.available_colors.length > 0 ? (
                          <select className="form-select" style={{ fontSize: 12, padding: '5px 8px' }} value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)}>
                            <option value="">—</option>
                            {item.available_colors.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
                      </div>
                      <div>
                        <input type="number" className="form-input" style={{ fontSize: 13, padding: '5px 8px', textAlign: 'center' }} min="1" max={item.max_qty} value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{fmt(item.unit_price * item.quantity)}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{fmt(item.unit_price)} ea</div>
                      </div>
                      <button className="btn btn-danger btn-icon" style={{ width: 28, height: 28 }} onClick={() => removeItem(idx)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Summary & Customer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Customer */}
          <div className="card">
            <div className="card-header"><div className="card-title">Customer</div></div>
            <div className="card-body">
              <div className="form-grid" style={{ gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" placeholder="Walk-in customer" value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="077 000 0000" value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="card">
            <div className="card-header"><div className="card-title">Payment</div></div>
            <div className="card-body">
              <div className="form-grid" style={{ gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Method</label>
                  <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Discount (LKR)</label>
                  <input className="form-input" type="number" min="0" placeholder="0.00" value={discount} onChange={e => setDiscount(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax (LKR)</label>
                  <input className="form-input" type="number" min="0" placeholder="0.00" value={tax} onChange={e => setTax(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Paid (LKR)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" rows={2} placeholder="Optional notes..." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card">
            <div className="card-header"><div className="card-title">Summary</div></div>
            <div className="card-body">
              <div className="bill-summary-block" style={{ margin: 0 }}>
                <div className="bill-summary-row"><span style={{ color: 'var(--text2)' }}>Subtotal</span><span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(subtotal)}</span></div>
                {discountAmt > 0 && <div className="bill-summary-row"><span style={{ color: 'var(--red)' }}>Discount</span><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>- {fmt(discountAmt)}</span></div>}
                {taxAmt > 0 && <div className="bill-summary-row"><span style={{ color: 'var(--text2)' }}>Tax</span><span style={{ fontFamily: 'var(--font-mono)' }}>+ {fmt(taxAmt)}</span></div>}
                <div className="bill-summary-row total-row"><span>Total</span><span>{fmt(total)}</span></div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 14, padding: 12, fontSize: 15 }}
                onClick={handleSubmit} disabled={createMutation.isPending || !items.length}>
                {createMutation.isPending
                  ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Creating Bill...</>
                  : <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><polyline points="20 6 9 17 4 12" /></svg>
                    Create Bill
                  </>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Barcode Scanner overlay */}
      {scannerOpen && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}