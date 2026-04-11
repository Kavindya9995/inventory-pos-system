import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import JsBarcode from 'jsbarcode';
import { productsAPI } from '../../api';
import { printContent } from '../../utils/print';

const fmt = (n) => `LKR ${parseFloat(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
const SHOP = process.env.REACT_APP_SHOP_NAME || 'ShopMaster Store';

/**
 * Renders barcode onto a <canvas> and returns a PNG data URL.
 * Canvas data URL is a plain base64 string — works in any popup/window.
 */
function generateBarcodePNG(code) {
  if (!code) return '';
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, String(code), {
      format: 'CODE128',
      width: 2,
      height: 40,
      displayValue: false,
      margin: 4,
      background: '#ffffff',
      lineColor: '#000000',
    });
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.error('Barcode PNG generation failed for code:', code, e);
    return '';
  }
}

function PriceTagPreview({ product }) {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && product.code) {
      try {
        JsBarcode(barcodeRef.current, String(product.code), {
          format: 'CODE128',
          width: 1.0,
          height: 18,
          displayValue: false,
          margin: 1,
          background: 'transparent',
        });
      } catch {}
    }
  }, [product.code]);

  return (
    <div style={{
      background: 'white', color: '#111',
      width: 150, minHeight: 90,
      padding: 4, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      border: '1.5px solid #222', borderRadius: 4,
    }}>
      <div style={{ fontSize: 6, color: '#000', textTransform: 'uppercase', letterSpacing: 0.5 }}>{SHOP}</div>
      <div style={{ borderTop: '0.5px solid #aaa', width: '100%', margin: '1px 0' }} />
      <div style={{ fontSize: 9, fontWeight: 800, textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.2 }}>{product.name}</div>
      {product.size && <div style={{ fontSize: 7, color: '#000' }}>Size: {product.size}</div>}
      <div style={{ fontSize: 13, fontWeight: 900, lineHeight: 1.1 }}>
        <span style={{ fontSize: 8 }}>LKR </span>
        {parseFloat(product.selling_price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
      </div>
      <svg ref={barcodeRef} style={{ display: 'block', margin: '1px auto 0', maxWidth: '100%' }} />
      <div style={{ fontSize: 6, color: '#000', letterSpacing: 0.5, marginTop: 1 }}>{product.code}</div>
    </div>
  );
}

function buildTagsHTML(tagList, showSupplierPrice) {
  const tagCards = tagList.map(p => {
    const barcodePNG = generateBarcodePNG(p.code);
    const barcodeHTML = barcodePNG
      ? `<img src="${barcodePNG}" class="price-tag-barcode" alt="barcode" />`
      : '';

    const metaParts = [];
    if (p.size) metaParts.push(`Size: ${p.size}`);
    const costLine = showSupplierPrice
      ? `<div class="price-tag-cost">Cost: ${fmt(p.supplier_price)}</div>`
      : '';

    return `
      <div class="price-tag-card">
        <div class="price-tag-shop">${SHOP}</div>
        <hr class="price-tag-divider" />
        <div class="price-tag-name">${p.name}</div>
        ${metaParts.length ? `<div class="price-tag-meta">${metaParts.join(' · ')}</div>` : ''}
        ${costLine}
        <div class="price-tag-price">
          <span class="price-tag-currency">LKR </span>${parseFloat(p.selling_price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
        </div>
        ${barcodeHTML}
        <div class="price-tag-code">${p.code}</div>
      </div>
    `;
  }).join('');

  return `<div class="tags-page">${tagCards}</div>`;
}

export default function PriceTagsPage() {
  const [tagCounts, setTagCounts] = useState({});
  const [selected, setSelected] = useState({});
  const [search, setSearch] = useState('');
  const [showSupplierPrice, setShowSupplierPrice] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsAPI.getAll({ search }).then(r => r.data),
  });

  useEffect(() => {
    if (products.length) {
      setTagCounts(prev => {
        const next = { ...prev };
        products.forEach(p => {
          if (next[p.id] === undefined) {
            next[p.id] = p.quantity > 0 ? p.quantity : 0;
          }
        });
        return next;
      });
    }
  }, [products]);

  const toggleSelect = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const selectAll = () => {
    const next = {};
    products.forEach(p => { next[p.id] = true; });
    setSelected(next);
  };

  const clearAll = () => setSelected({});

  const setCount = (id, val) => {
    if (val === '' || val === '-') {
      setTagCounts(prev => ({ ...prev, [id]: '' }));
      return;
    }
    const n = Math.max(0, parseInt(val) || 0);
    setTagCounts(prev => ({ ...prev, [id]: n }));
  };

  const handleCountBlur = (id, val) => {
    if (val === '' || isNaN(parseInt(val))) {
      setTagCounts(prev => ({ ...prev, [id]: 0 }));
    }
  };

  const resetToStock = () => {
    const next = {};
    products.forEach(p => { next[p.id] = p.quantity > 0 ? p.quantity : 0; });
    setTagCounts(next);
  };

  const selectedProducts = products.filter(p => selected[p.id]);

  const tagList = selectedProducts.flatMap(p =>
    Array(tagCounts[p.id] || 0).fill(p)
  );

  const totalTags = tagList.length;

  const handlePrint = () => {
    if (!tagList.length) return;
    printContent(buildTagsHTML(tagList, showSupplierPrice), 'Price Tags');
  };

  const allSelected = products.length > 0 && products.every(p => selected[p.id]);
  const someSelected = products.some(p => selected[p.id]);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Price Tags</h2>
          <p>Tag counts default to stock quantity — change manually per product</p>
        </div>
        <button className="btn btn-primary" onClick={handlePrint} disabled={!totalTags}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print {totalTags > 0 ? `${totalTags} Tag${totalTags !== 1 ? 's' : ''}` : 'Tags'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

        {/* Left — product table */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    className="form-input"
                    placeholder="Search products..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <button className="btn btn-ghost btn-sm" onClick={selectAll} disabled={!products.length}>Select All</button>
                <button className="btn btn-ghost btn-sm" onClick={clearAll} disabled={!someSelected}>Clear</button>
                <button className="btn btn-ghost btn-sm" onClick={resetToStock} disabled={!products.length} title="Reset all counts to stock quantity">
                  ↺ Reset to Stock
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-wrap">
              {isLoading ? (
                <div className="loading-center"><div className="spinner" /></div>
              ) : !products.length ? (
                <div className="empty-state"><p>No products found</p></div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                          onChange={e => e.target.checked ? selectAll() : clearAll()}
                        />
                      </th>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Size</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Tag Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => {
                      const isSelected = !!selected[p.id];
                      const count = tagCounts[p.id] ?? p.quantity;
                      return (
                        <tr key={p.id} style={{ background: isSelected ? 'var(--accent-dim)' : '' }}>
                          <td>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)} />
                          </td>
                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>{p.code}</span>
                          </td>
                          <td style={{ fontWeight: 500 }}>{p.name}</td>
                          <td style={{ color: 'var(--text2)' }}>{p.size || '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)' }}>{fmt(p.selling_price)}</td>
                          <td>
                            <span className={`badge ${p.quantity === 0 ? 'badge-red' : p.quantity < 5 ? 'badge-yellow' : 'badge-green'}`}>
                              {p.quantity}
                            </span>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max="999"
                              value={count}
                              onChange={e => setCount(p.id, e.target.value)}
                              onBlur={e => handleCountBlur(p.id, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              onFocus={e => e.target.select()}
                              style={{
                                width: 70, padding: '5px 8px',
                                background: 'var(--surface3)',
                                border: `1px solid ${count !== p.quantity ? 'var(--accent)' : 'var(--border)'}`,
                                borderRadius: 6,
                                color: count !== p.quantity ? 'var(--accent)' : 'var(--text)',
                                fontFamily: 'var(--font-mono)', fontSize: 13,
                                textAlign: 'center', outline: 'none',
                                fontWeight: count !== p.quantity ? 700 : 400,
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right — settings + preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div className="card">
            <div className="card-header"><div className="card-title">Print Settings</div></div>
            <div className="card-body">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
                <input type="checkbox" checked={showSupplierPrice} onChange={e => setShowSupplierPrice(e.target.checked)} />
                Show supplier / cost price
              </label>

              {someSelected && (
                <div style={{ marginTop: 14, padding: '12px', background: 'var(--accent-dim)', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Selected products:</div>
                  {selectedProducts.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--text)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{p.name}</span>
                      <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>
                        × {tagCounts[p.id] ?? p.quantity}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)', fontWeight: 700 }}>
                    <span style={{ color: 'var(--text2)', fontSize: 13 }}>Total tags</span>
                    <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 15 }}>{totalTags}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Preview</div>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{selectedProducts.length} products</span>
            </div>
            <div className="card-body" style={{ background: '#d0d0d0', borderRadius: '0 0 10px 10px', padding: 12, minHeight: 100 }}>
              {!selectedProducts.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 8 }}>
                  <p style={{ color: '#aaa', fontSize: 13 }}>Select products to preview</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-start' }}>
                  {selectedProducts.slice(0, 8).map(p => (
                    <div key={p.id} style={{ position: 'relative' }}>
                      <PriceTagPreview product={p} />
                      <div style={{
                        position: 'absolute', top: -6, right: -6,
                        background: 'var(--accent)', color: '#0c0c0e',
                        borderRadius: '50%', width: 18, height: 18,
                        fontSize: 10, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {tagCounts[p.id] ?? p.quantity}
                      </div>
                    </div>
                  ))}
                  {selectedProducts.length > 8 && (
                    <div style={{ width: 150, minHeight: 90, background: 'white', border: '2px dashed #ccc', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 12 }}>
                      +{selectedProducts.length - 8} more
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text3)' }}>
            <strong style={{ color: 'var(--text2)' }}>Tip:</strong> Prints <strong style={{ color: 'var(--accent)' }}>4 columns × 7 rows</strong> per A4 page. Edit the Tag Count column to control how many copies print per product.
          </div>
        </div>
      </div>
    </div>
  );
}