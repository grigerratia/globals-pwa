import { useState, useEffect } from 'react';

export default function WhatsAppAdmin() {
  const [status, setStatus] = useState('LOADING');
  const [qr, setQr] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // En producción reemplazar esto por la URL del backend real (Render/Railway)
        const res = await fetch(import.meta.env.VITE_BACKEND_URL + '/api/whatsapp/status');
        const data = await res.json();
        setStatus(data.status);
        setQr(data.qr);
      } catch (err) {
        console.error('Error fetching WA status', err);
        setStatus('ERROR');
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}><a href="/" style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>&larr; Volver al Tablero</a></div>
      <h1>Administración de WhatsApp</h1>
      <p style={{ marginBottom: '2rem', color: '#64748b' }}>
        Estado actual de la conexión: 
        <strong style={{ marginLeft: '10px', color: status === 'CONNECTED' ? '#22c55e' : '#ef4444' }}>
          {status}
        </strong>
      </p>

      {status === 'QR_READY' && qr && (
        <div style={{ border: '2px dashed #cbd5e1', padding: '2rem', borderRadius: '1rem', display: 'inline-block' }}>
          <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Escanea este código QR con el WhatsApp de la empresa</p>
          <img src={qr} alt="WhatsApp QR Code" style={{ width: '300px', height: '300px' }} />
        </div>
      )}

      {status === 'CONNECTED' && (
        <div style={{ backgroundColor: '#dcfce7', padding: '2rem', borderRadius: '1rem', color: '#166534' }}>
          <h2>✅ Conectado y listo</h2>
          <p>El bot de WhatsApp está funcionando correctamente.</p>
        </div>
      )}

      {status === 'ERROR' && (
        <div style={{ backgroundColor: '#fee2e2', padding: '2rem', borderRadius: '1rem', color: '#991b1b' }}>
          <h2>❌ Error de conexión</h2>
          <p>No se pudo contactar con el backend. Asegúrate de que el servidor esté corriendo.</p>
        </div>
      )}
      
      
    </div>
  );
}
