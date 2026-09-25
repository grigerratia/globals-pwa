import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { X, Trash2, AlertTriangle, RefreshCcw } from 'lucide-react';
import styles from './CanceladosModal.module.scss';
import { logAudit } from '../../utils/audit';

export default function CanceladosModal({ onClose, session }) {
  const [cancelados, setCancelados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchCancelados = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('proyectos')
      .select('*')
      .eq('estado', 'Cancelado')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setCancelados(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCancelados();
  }, []);

  const handleToggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === cancelados.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cancelados.map(p => p.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const confirm = window.confirm(`¿Estás seguro de eliminar permanentemente ${selectedIds.size} proyectos? Esta acción no se puede deshacer.`);
    if (!confirm) return;

    const idsToDelete = Array.from(selectedIds);
    const { error } = await supabase.from('proyectos').delete().in('id', idsToDelete);

    if (!error) {
      logAudit(session, 'Eliminó proyectos cancelados permanentemente', { ids: idsToDelete });
      setMsg({ text: 'Proyectos eliminados correctamente', type: 'success' });
      setSelectedIds(new Set());
      fetchCancelados();
    } else {
      setMsg({ text: 'Error al eliminar: ' + error.message, type: 'error' });
    }
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleDeleteSingle = async (id, titulo) => {
    const confirm = window.confirm(`¿Eliminar permanentemente el proyecto "${titulo}"?`);
    if (!confirm) return;

    const { error } = await supabase.from('proyectos').delete().eq('id', id);
    if (!error) {
      logAudit(session, 'Eliminó proyecto cancelado permanentemente', { id, titulo });
      fetchCancelados();
    } else {
      setMsg({ text: 'Error: ' + error.message, type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    }
  };
  
  const handleRestore = async (id, titulo) => {
    const { error } = await supabase.from('proyectos').update({ estado: 'Pendiente' }).eq('id', id);
    if (!error) {
      logAudit(session, 'Restauró proyecto cancelado', { id, titulo });
      setMsg({ text: 'Proyecto restaurado a "Pendiente"', type: 'success' });
      fetchCancelados();
      setTimeout(() => { window.location.reload(); }, 1500); // recarga para ver en kanban
    } else {
      setMsg({ text: 'Error al restaurar: ' + error.message, type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Proyectos Cancelados</h2>
          <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </div>

        {msg.text && (
          <div className={`${styles.message} ${styles[msg.type]}`}>
            {msg.text}
          </div>
        )}

        <div className={styles.toolbar}>
          <div className={styles.selectInfo}>
            <input 
              type="checkbox" 
              checked={cancelados.length > 0 && selectedIds.size === cancelados.length}
              onChange={handleSelectAll}
              disabled={cancelados.length === 0}
            />
            <span>{selectedIds.size} seleccionados</span>
          </div>
          {selectedIds.size > 0 && (
            <button className={styles.btnDangerBulk} onClick={handleDeleteSelected}>
              <Trash2 size={16} /> Eliminar {selectedIds.size} Permanentemente
            </button>
          )}
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.empty}>Cargando...</div>
          ) : cancelados.length === 0 ? (
            <div className={styles.empty}>
              <AlertTriangle size={32} opacity={0.5} style={{marginBottom:'1rem'}}/>
              <p>No hay proyectos cancelados.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th width="40"></th>
                  <th>Proyecto</th>
                  <th>Cliente</th>
                  <th>Motivo de Cancelación</th>
                  <th width="100">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cancelados.map(p => (
                  <tr key={p.id} className={selectedIds.has(p.id) ? styles.selectedRow : ''}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(p.id)} 
                        onChange={() => handleToggleSelect(p.id)} 
                      />
                    </td>
                    <td><strong>{p.titulo}</strong></td>
                    <td>{p.cliente_nombre || 'N/A'}</td>
                    <td className={styles.motivoText}>{p.motivo_cancelacion || 'Sin motivo'}</td>
                    <td>
                      <div className={styles.actionsBox}>
                        <button onClick={() => handleRestore(p.id, p.titulo)} title="Restaurar" className={styles.btnIconRes}>
                           <RefreshCcw size={16} />
                        </button>
                        <button onClick={() => handleDeleteSingle(p.id, p.titulo)} title="Eliminar" className={styles.btnIconDel}>
                           <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
