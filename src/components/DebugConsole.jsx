import { useState, useEffect } from 'react';
import { appLogs, subscribeToLogs, clearLogs } from '../utils/logger';
import { X, Bug, Trash2 } from 'lucide-react';

export default function DebugConsole({ onClose }) {
  const [logs, setLogs] = useState([...appLogs]);

  useEffect(() => {
    const unsubscribe = subscribeToLogs(() => setLogs([...appLogs]));
    return unsubscribe;
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        background: '#1e293b', color: '#f8fafc', width: '90%', maxWidth: '800px', height: '80vh',
        borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Bug size={20} color="#ef4444" /> Consola de Depuración (Errores)
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={clearLogs} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} title="Limpiar"><Trash2 size={20} /></button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logs.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', marginTop: '2rem' }}>No hay errores registrados en esta sesión.</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{
                background: log.type === 'WARN' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                borderLeft: `4px solid ${log.type === 'WARN' ? '#eab308' : '#ef4444'}`,
                padding: '12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all'
              }}>
                <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>{new Date(log.timestamp).toLocaleTimeString()} - {log.type}</div>
                <div>{log.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
