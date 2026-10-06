import { useState, useEffect } from 'react';
import styles from './WhatsAppAdmin.module.scss';

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
    <div className={styles.container}>
      <div className={styles.backLinkContainer}>
        <a href="/" className={styles.backLink}>&larr; Volver al Tablero</a>
      </div>
      <h1 className={styles.title}>Administración de WhatsApp</h1>
      <p className={styles.statusText}>
        Estado actual de la conexión: 
        <strong style={{ marginLeft: '10px', color: status === 'CONNECTED' ? '#22c55e' : '#ef4444' }}>
          {status}
        </strong>
      </p>

      {status === 'QR_READY' && qr && (
        <div className={styles.qrContainer}>
          <p className={styles.qrInstruction}>Escanea este código QR con el WhatsApp de la empresa</p>
          <img src={qr} alt="WhatsApp QR Code" className={styles.qrImage} />
        </div>
      )}

      {status === 'CONNECTED' && (
        <div className={`${styles.statusCard} ${styles.successCard}`}>
          <h2>✅ Conectado y listo</h2>
          <p>El bot de WhatsApp está funcionando correctamente.</p>
        </div>
      )}

      {status === 'ERROR' && (
        <div className={`${styles.statusCard} ${styles.errorCard}`}>
          <h2>❌ Error de conexión</h2>
          <p>No se pudo contactar con el backend. Asegúrate de que el servidor esté corriendo.</p>
        </div>
      )}
      
    </div>
  );
}
