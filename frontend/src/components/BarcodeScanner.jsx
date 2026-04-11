import { useEffect, useRef, useState } from 'react';

export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState('');
  const lastScannedRef = useRef('');

  useEffect(() => {
    let reader;

    // Dynamically import @zxing/library to avoid module resolution issues
    import('@zxing/library').then(({ BrowserMultiFormatReader, NotFoundException }) => {
      reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      reader.listVideoInputDevices()
        .then(devices => {
          if (!devices.length) {
            setError('No camera found on this device.');
            return;
          }
          setCameras(devices);
          const back = devices.find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear')
          );
          setSelectedCamera(back ? back.deviceId : devices[0].deviceId);
        })
        .catch(() => setError('Camera access denied. Please allow camera permission and try again.'));
    }).catch(() => {
      setError('Could not load barcode library. Run: npm install @zxing/library');
    });

    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedCamera || !videoRef.current || !readerRef.current) return;

    const reader = readerRef.current;
    setScanning(true);
    setError('');

    import('@zxing/library').then(({ NotFoundException }) => {
      reader.decodeFromVideoDevice(selectedCamera, videoRef.current, (result, err) => {
        if (result) {
          const code = result.getText();
          // Debounce — prevent same code firing repeatedly
          if (code !== lastScannedRef.current) {
            lastScannedRef.current = code;
            setLastScanned(code);
            onScan(code);
            setTimeout(() => {
              lastScannedRef.current = '';
              setLastScanned('');
            }, 2000);
          }
        }
        if (err && !(err instanceof NotFoundException)) {
          // Ignore NotFoundException — it's thrown every frame when nothing is in view
        }
      }).catch(err => {
        setError('Could not start camera: ' + (err?.message || 'Unknown error'));
        setScanning(false);
      });
    });

    return () => {
      reader.reset();
      setScanning(false);
    };
  }, [selectedCamera]); // eslint-disable-line

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      {/* Header */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16,
      }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
            Barcode Scanner
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            Point camera at product barcode
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          color: 'var(--text)', width: 34, height: 34, borderRadius: 8,
          cursor: 'pointer', fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
      </div>

      {/* Camera selector */}
      {cameras.length > 1 && (
        <div style={{ width: '100%', maxWidth: 480, marginBottom: 10 }}>
          <select
            className="form-select"
            value={selectedCamera}
            onChange={e => setSelectedCamera(e.target.value)}
          >
            {cameras.map(c => (
              <option key={c.deviceId} value={c.deviceId}>
                {c.label || `Camera ${c.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video feed */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 480,
        borderRadius: 12, overflow: 'hidden', background: '#000',
      }}>
        <video
          ref={videoRef}
          style={{ width: '100%', display: 'block', minHeight: 280 }}
          autoPlay muted playsInline
        />

        {/* Scanning overlay guide */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {/* Corner brackets */}
          {[
            { top: '25%', left: '15%', borderTop: '3px solid var(--accent)', borderLeft: '3px solid var(--accent)', borderRadius: '4px 0 0 0' },
            { top: '25%', right: '15%', borderTop: '3px solid var(--accent)', borderRight: '3px solid var(--accent)', borderRadius: '0 4px 0 0' },
            { bottom: '25%', left: '15%', borderBottom: '3px solid var(--accent)', borderLeft: '3px solid var(--accent)', borderRadius: '0 0 0 4px' },
            { bottom: '25%', right: '15%', borderBottom: '3px solid var(--accent)', borderRight: '3px solid var(--accent)', borderRadius: '0 0 4px 0' },
          ].map((style, i) => (
            <div key={i} style={{ position: 'absolute', width: 28, height: 28, ...style }} />
          ))}

          {/* Animated scan line */}
          <div style={{
            position: 'absolute',
            left: '15%', right: '15%', height: 2,
            background: 'var(--accent)', opacity: 0.85,
            boxShadow: '0 0 8px var(--accent)',
            animation: 'scanLine 2s ease-in-out infinite',
          }} />
        </div>

        {/* Scanned feedback flash */}
        {lastScanned && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(74,222,128,0.92)',
            color: '#0c0c0e', fontFamily: 'var(--font-mono)',
            fontSize: 14, fontWeight: 700,
            padding: '10px 16px', textAlign: 'center',
          }}>
            ✓ Scanned: {lastScanned}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          marginTop: 14, padding: '12px 16px',
          background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 8, color: 'var(--red)', fontSize: 13,
          width: '100%', maxWidth: 480,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Status indicator */}
      <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>
        {scanning && !error && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--green)', display: 'inline-block',
              animation: 'pulse 1.2s ease-in-out infinite',
            }} />
            Camera active — scanning for barcodes...
          </span>
        )}
        {!scanning && !error && !cameras.length && (
          <span>Starting camera...</span>
        )}
      </div>

      <p style={{
        marginTop: 12, fontSize: 11, color: 'var(--text3)',
        textAlign: 'center', maxWidth: 360,
      }}>
        Supports CODE128, QR Code, EAN-13, UPC-A and more.
        Each detected barcode is added to the bill automatically.
      </p>

      <style>{`
        @keyframes scanLine {
          0%   { top: 26%; }
          50%  { top: 70%; }
          100% { top: 26%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}