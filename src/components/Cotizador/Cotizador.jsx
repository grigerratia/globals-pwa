import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { ArrowLeft, Calculator, Plus, Trash2 } from 'lucide-react';

export default function Cotizador() {
  const [materialesDb, setMaterialesDb] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function fetchMateriales() {
      const { data, error } = await supabase.from('materiales').select('*').order('categoria');
      if (data) setMaterialesDb(data);
      setCargando(false);
    }
    fetchMateriales();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => window.location.href = '/'}
          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
          <Calculator color="#3b82f6" /> Cotizador Automático (Fase 1)
        </h1>
      </header>

      {cargando ? (
        <p>Cargando maestro de materiales...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Panel Izquierdo: Formulario de Proyecto */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', marginTop: 0 }}>Datos del Trabajo</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>En la próxima fase, aquí irán las medidas y tipo de trabajo para que el sistema calcule los materiales por ti.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Tipo de Trabajo</label>
                <select style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option>Valla Publicitaria</option>
                  <option>Letras Corpóreas</option>
                  <option>Impresión Lona</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Ancho (metros)</label>
                  <input type="number" placeholder="Ej: 3" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Alto (metros)</label>
                  <input type="number" placeholder="Ej: 2" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <button style={{ marginTop: '1rem', background: '#3b82f6', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                Calcular Cotización
              </button>
            </div>
          </div>

          {/* Panel Derecho: Maestro de Materiales de Supabase */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', marginTop: 0 }}>Maestro de Materiales</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Extraídos en tiempo real de Supabase.</p>
            
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {materialesDb.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <div>
                    <span style={{ fontWeight: 600, display: 'block', color: '#0f172a' }}>{m.nombre}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', background: '#e2e8f0', padding: '0.1rem 0.4rem', borderRadius: '12px' }}>{m.categoria}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>${m.precio_unitario}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>por {m.unidad_medida}</span>
                  </div>
                </div>
              ))}
              {materialesDb.length === 0 && (
                <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>No hay materiales. Asegúrate de haber corrido el SQL en Supabase.</p>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
