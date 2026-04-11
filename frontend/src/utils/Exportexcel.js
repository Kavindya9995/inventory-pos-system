import * as XLSX from 'xlsx';

const fmt = (n) => parseFloat(n || 0).toFixed(2);

function dateStamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

export function exportProducts(products) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Products ──────────────────────────────────────────────────────
  const rows = products.map((p, i) => ({
    '#':                    i + 1,
    'Product Code':         p.code,
    'Product Name':         p.name,
    'Supplier':             p.supplier_name || '',
    'Supplier Code':        p.supplier_code || '',
    'Supplier Price (LKR)': parseFloat(fmt(p.supplier_price)),
    'Selling Price (LKR)':  parseFloat(fmt(p.selling_price)),
    'Profit (LKR)':         parseFloat(fmt(p.selling_price - p.supplier_price)),
    'Size':                 p.size || '',
    'Colors':               Array.isArray(p.colors) ? p.colors.join(', ') : '',
    'Stock Qty':            p.quantity,
    'Stock Value (LKR)':    parseFloat(fmt(p.selling_price * p.quantity)),
    'Status':               p.quantity === 0 ? 'Out of Stock' : p.quantity < 5 ? 'Low Stock' : 'In Stock',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 4 },   // #
    { wch: 14 },  // Code
    { wch: 28 },  // Name
    { wch: 20 },  // Supplier
    { wch: 16 },  // Supplier Code
    { wch: 20 },  // Supplier Price
    { wch: 20 },  // Selling Price
    { wch: 16 },  // Profit
    { wch: 10 },  // Size
    { wch: 22 },  // Colors
    { wch: 10 },  // Stock Qty
    { wch: 20 },  // Stock Value
    { wch: 14 },  // Status
  ];

  // Header row styling
  const headerKeys = Object.keys(rows[0] || {});
  headerKeys.forEach((_, ci) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (!ws[cell]) return;
    ws[cell].s = {
      font:      { bold: true, color: { rgb: 'FFFFFF' }, name: 'Arial', sz: 10 },
      fill:      { fgColor: { rgb: '1C3553' }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        bottom: { style: 'thin', color: { rgb: '888888' } },
        right:  { style: 'thin', color: { rgb: '888888' } },
      },
    };
  });

  // Alternate row colors + number formatting
  rows.forEach((_, ri) => {
    headerKeys.forEach((key, ci) => {
      const cell = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
      if (!ws[cell]) return;
      const isEven = ri % 2 === 0;
      ws[cell].s = {
        font:      { name: 'Arial', sz: 10 },
        fill:      { fgColor: { rgb: isEven ? 'F7F9FC' : 'FFFFFF' }, patternType: 'solid' },
        alignment: { vertical: 'center' },
        border: {
          bottom: { style: 'hair', color: { rgb: 'DDDDDD' } },
          right:  { style: 'hair', color: { rgb: 'DDDDDD' } },
        },
      };

      // Right-align numbers
      if (['Supplier Price (LKR)', 'Selling Price (LKR)', 'Profit (LKR)', 'Stock Value (LKR)', 'Stock Qty', '#'].includes(key)) {
        ws[cell].s.alignment = { ...ws[cell].s.alignment, horizontal: 'right' };
      }

      // Status color
      if (key === 'Status') {
        const val = ws[cell].v;
        ws[cell].s.font = {
          ...ws[cell].s.font,
          color: { rgb: val === 'Out of Stock' ? 'CC0000' : val === 'Low Stock' ? 'CC6600' : '006600' },
          bold: true,
        };
      }
    });
  });

  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  // ── Sheet 2: Summary ───────────────────────────────────────────────────────
  const totalStockValue  = products.reduce((s, p) => s + p.selling_price * p.quantity, 0);
  const totalCostValue   = products.reduce((s, p) => s + p.supplier_price * p.quantity, 0);
  const totalQty         = products.reduce((s, p) => s + p.quantity, 0);
  const outOfStock       = products.filter(p => p.quantity === 0).length;
  const lowStock         = products.filter(p => p.quantity > 0 && p.quantity < 5).length;
  const inStock          = products.filter(p => p.quantity >= 5).length;

  const summaryRows = [
    { 'Metric': 'Total Products',              'Value': products.length },
    { 'Metric': 'Total Stock Quantity',        'Value': totalQty },
    { 'Metric': 'Total Stock Value (LKR)',     'Value': parseFloat(fmt(totalStockValue)) },
    { 'Metric': 'Total Cost Value (LKR)',      'Value': parseFloat(fmt(totalCostValue)) },
    { 'Metric': 'Total Profit Potential (LKR)','Value': parseFloat(fmt(totalStockValue - totalCostValue)) },
    { 'Metric': 'In Stock Products',           'Value': inStock },
    { 'Metric': 'Low Stock Products (<5)',     'Value': lowStock },
    { 'Metric': 'Out of Stock Products',       'Value': outOfStock },
    { 'Metric': 'Exported On',                'Value': new Date().toLocaleString('en-LK') },
  ];

  const ws2 = XLSX.utils.json_to_sheet(summaryRows);
  ws2['!cols'] = [{ wch: 32 }, { wch: 24 }];

  // Header style for summary
  ['A1','B1'].forEach(ref => {
    if (!ws2[ref]) return;
    ws2[ref].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, name: 'Arial', sz: 10 },
      fill: { fgColor: { rgb: '1C3553' }, patternType: 'solid' },
      alignment: { horizontal: 'center' },
    };
  });

  XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

  // ── Download ───────────────────────────────────────────────────────────────
  XLSX.writeFile(wb, `Products_${dateStamp()}.xlsx`);
}