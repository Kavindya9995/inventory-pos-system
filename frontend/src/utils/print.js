/**
 * Opens a new browser window with the given HTML content + styles and triggers print.
 * @param {string} htmlContent  - The inner HTML string to print
 * @param {string} title        - Window/document title ('Price Tags' triggers A4 layout)
 */
export function printContent(htmlContent, title = 'Print') {
  const isPriceTags = title === 'Price Tags';

  const win = window.open(
    '',
    '_blank',
    isPriceTags ? 'width=900,height=700' : 'width=302,height=100'
  );

  if (!win) {
    alert('Pop-up blocked! Please allow pop-ups for this site and try again.');
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          font-family: 'Courier New', Courier, monospace;
          background: white;
          color: #000;
          ${isPriceTags ? 'width: 210mm;' : 'width: 80mm; overflow: hidden;'}
          height: auto !important;
          font-weight: 600;
        }

        /* ── RECEIPT ── */
        .receipt {
          width: 80mm;
          font-size: 12px;
          line-height: 1.6;
          padding: 8px;
          font-weight: 600;
        }
        .receipt-logo {
          display: block;
          margin: 0 auto 4px auto;
          max-width: 60px;
          max-height: 60px;
          object-fit: contain;
        }
        .receipt-title {
          font-size: 18px;
          font-weight: 900;
          text-align: center;
          margin-bottom: 2px;
          letter-spacing: 1px;
        }
        .receipt-sub {
          text-align: center;
          font-size: 10px;
          color: #000;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .receipt-divider {
          border: none;
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        .receipt-row {
          display: flex;
          justify-content: space-between;
          font-weight: 600;
        }
        .receipt-row span {
          font-weight: 600;
          color: #000;
        }
        .receipt-total-row {
          display: flex;
          justify-content: space-between;
          font-weight: 900;
          font-size: 15px;
          color: #000;
        }
        .receipt-footer {
          text-align: center;
          margin-top: 4px;
          font-size: 11px;
          font-weight: 800;
          color: #000;
          letter-spacing: 0.5px;
        }
        .receipt-exchange {
          text-align: center;
          margin-top: 4px;
          margin-bottom: 4px;
          font-size: 11px;
          font-weight: 700;
          color: #000;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 3px 0;
        }

        /* ── PRICE TAGS — A4 grid layout ── */
        /* A4 = 210mm wide. 8mm padding each side = 194mm usable.
           4 cols × 47mm + 3 gaps × 2mm = 194mm ✓
           ~7 rows per page = ~28 tags per A4 sheet                */
        .tags-page {
          width: 210mm;
          padding: 8mm;
          display: grid;
          grid-template-columns: repeat(4, 47mm);
          gap: 2mm;
          background: white;
        }
        .price-tag-card {
          border: 1.5px solid #222;
          border-radius: 4px;
          padding: 3px 4px;
          text-align: center;
          width: 47mm;
          min-height: 32mm;
          page-break-inside: avoid;
          break-inside: avoid;
          color: #000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1px;
        }
        .price-tag-shop {
          font-size: 7px;
          color: #000;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          font-weight: 700;
        }
        .price-tag-divider {
          border: none;
          border-top: 0.5px solid #000;
          width: 100%;
          margin: 1px 0;
        }
        .price-tag-name {
          font-size: 10px;
          font-weight: 800;
          word-break: break-word;
          color: #000;
          line-height: 1.2;
        }
        .price-tag-meta {
          font-size: 8px;
          color: #000;
        }
        .price-tag-cost {
          font-size: 7px;
          color: #000;
        }
        .price-tag-price {
          font-size: 16px;
          font-weight: 900;
          color: #000;
          line-height: 1.1;
        }
        .price-tag-currency {
          font-size: 9px;
          font-weight: 700;
        }
        .price-tag-barcode {
          display: block;
          width: 42mm;
          height: 10mm;
          margin: 1px auto;
          object-fit: fill;
          image-rendering: pixelated;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .price-tag-code {
          font-size: 7px;
          color: #000;
          letter-spacing: 0.8px;
          font-weight: 700;
          font-family: 'Courier New', Courier, monospace;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            ${isPriceTags
              ? 'width: 210mm !important;'
              : 'width: 80mm !important; height: auto !important; overflow: hidden !important;'
            }
          }
          @page {
            ${isPriceTags
              ? 'size: A4 portrait; margin: 0;'
              : 'size: 80mm auto; margin: 0;'
            }
          }
          .price-tag-barcode {
            display: block !important;
            width: 42mm !important;
            height: 10mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `);

  win.document.close();

  win.onload = () => {
    setTimeout(() => {
      if (!isPriceTags) {
        // For receipts: resize window to content height first
        const body = win.document.body;
        const height = body.scrollHeight;
        win.resizeTo(302, height + 50);
      }
      win.focus();
      win.print();
      win.close();
    }, 800);
  };

  // Fallback if onload doesn't fire
  setTimeout(() => {
    try {
      win.focus();
      win.print();
      win.close();
    } catch (_) {}
  }, 2000);
}