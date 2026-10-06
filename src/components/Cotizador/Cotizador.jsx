import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { ArrowLeft, Calculator, Receipt, Plus, Trash2 } from 'lucide-react';
import styles from './Cotizador.module.scss';

// Fallback if DB is empty, adapted for Venezuela (Cumaná prices approx in USD)
const DEFAULT_MATERIALS = [
  { id: '1', nombre: 'Tubo Estructural 2x1', categoria: 'Estructura', precio_unitario: 4.00, unidad_medida: 'm' },
  { id: '2', nombre: 'Tubo Estructural 1x1', categoria: 'Estructura', precio_unitario: 2.50, unidad_medida: 'm' },
  { id: '3', nombre: 'Lona Tensada (Backlight)', categoria: 'Impresión', precio_unitario: 8.00, unidad_medida: 'm2' },
  { id: '4', nombre: 'Lona Frontlight', categoria: 'Impresión', precio_unitario: 6.00, unidad_medida: 'm2' },
  { id: '5', nombre: 'Vinil Autoadhesivo', categoria: 'Impresión', precio_unitario: 5.00, unidad_medida: 'm2' },
  { id: '6', nombre: 'Acrílico 3mm', categoria: 'Materiales', precio_unitario: 35.00, unidad_medida: 'm2' },
  { id: '7', nombre: 'Luces LED (Módulos)', categoria: 'Iluminación', precio_unitario: 3.50, unidad_medida: 'm' },
  { id: '8', nombre: 'Pintura', categoria: 'Acabados', precio_unitario: 15.00, unidad_medida: 'galón' },
  { id: '9', nombre: 'Electrodos', categoria: 'Insumos', precio_unitario: 4.00, unidad_medida: 'kg' },
  { id: '10', nombre: 'Mano de Obra', categoria: 'Servicios', precio_unitario: 20.00, unidad_medida: 'día' },
  { id: '11', nombre: 'Flete / Traslado', categoria: 'Servicios', precio_unitario: 40.00, unidad_medida: 'global' },
];

export default function Cotizador() {
  const [materialesDb, setMaterialesDb] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Form state
  const [tipoTrabajo, setTipoTrabajo] = useState('Valla Publicitaria');
  const [ancho, setAncho] = useState('');
  const [alto, setAlto] = useState('');
  
  // Quote state
  const [materialesCotizacion, setMaterialesCotizacion] = useState([]);
  const [cotizacionGenerada, setCotizacionGenerada] = useState(false);
  const [totalCotizacion, setTotalCotizacion] = useState(0);

  useEffect(() => {
    async function fetchMateriales() {
      const { data, error } = await supabase.from('materiales').select('*').order('categoria');
      if (data && data.length > 0) {
        setMaterialesDb(data);
      } else {
        setMaterialesDb(DEFAULT_MATERIALS);
      }
      setCargando(false);
    }
    fetchMateriales();
  }, []);

  const handleCalcularPrevia = (e) => {
    e.preventDefault();
    if (!ancho || !alto) {
      alert("Por favor ingresa ancho y alto.");
      return;
    }

    const a = parseFloat(ancho);
    const h = parseFloat(alto);
    const area = a * h;
    const perimetro = (a + h) * 2;

    let lista = [];

    const findMat = (nameIncludes) => materialesDb.find(m => m.nombre.toLowerCase().includes(nameIncludes)) || DEFAULT_MATERIALS.find(m => m.nombre.toLowerCase().includes(nameIncludes));

    const agregarMat = (nameRef, qty) => {
      const dbMat = findMat(nameRef);
      if (dbMat) {
        lista.push({
          id: Date.now() + Math.random(),
          nombre: dbMat.nombre,
          precio_unitario: dbMat.precio_unitario,
          cantidad: Math.ceil(qty * 10) / 10, // redondear 1 decimal
          unidad_medida: dbMat.unidad_medida,
          categoria: dbMat.categoria
        });
      }
    };

    if (tipoTrabajo === 'Valla Publicitaria') {
      agregarMat('tubo estructural 2x1', perimetro * 1.5); // Estructura principal
      agregarMat('tubo estructural 1x1', area * 2); // Refuerzos
      agregarMat('lona front', area * 1.1); // 10% desperdicio
      agregarMat('electrodo', area * 0.2); // estimación
      agregarMat('pintura', Math.max(1, area / 20)); 
      agregarMat('mano de obra', Math.max(2, area / 10)); 
      agregarMat('flete', 1);
    } 
    else if (tipoTrabajo === 'Letras Corpóreas') {
      agregarMat('acrílico', area * 1.5); 
      agregarMat('led', perimetro * 3); // borde interno
      agregarMat('vinil', area);
      agregarMat('mano de obra', Math.max(3, area / 5)); 
      agregarMat('flete', 1);
    }
    else if (tipoTrabajo === 'Impresión Lona') {
      agregarMat('lona front', area * 1.05);
      agregarMat('mano de obra', 0.5); 
    }

    setMaterialesCotizacion(lista);
    setCotizacionGenerada(false); // Reset final total
  };

  const handleActualizarMaterial = (id, campo, valor) => {
    setMaterialesCotizacion(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, [campo]: valor };
      }
      return m;
    }));
    setCotizacionGenerada(false);
  };

  const handleEliminarMaterial = (id) => {
    setMaterialesCotizacion(prev => prev.filter(m => m.id !== id));
    setCotizacionGenerada(false);
  };

  const handleGenerarCotizacion = () => {
    let t = 0;
    materialesCotizacion.forEach(m => {
      t += (parseFloat(m.precio_unitario) || 0) * (parseFloat(m.cantidad) || 0);
    });
    // Agregar un margen de ganancia del 30% como ejemplo industrial estándar
    setTotalCotizacion(t * 1.3);
    setCotizacionGenerada(true);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => window.location.href = '/'}>
          <ArrowLeft size={20} color="#64748b" />
        </button>
        <h1><Calculator color="#3b82f6" /> Cotizador de Proyectos</h1>
      </header>

      {cargando ? (
        <p style={{ textAlign: 'center', color: '#64748b' }}>Cargando datos del cotizador...</p>
      ) : (
        <div className={styles.grid}>
          
          {/* Panel Izquierdo: Formulario */}
          <div className={styles.panel}>
            <h2>Datos del Trabajo</h2>
            <p className={styles.subtitle}>Ingresa las medidas para pre-calcular los materiales aproximados necesarios.</p>
            
            <form onSubmit={handleCalcularPrevia}>
              <div className={styles.formGroup}>
                <label>Tipo de Trabajo</label>
                <select value={tipoTrabajo} onChange={e => setTipoTrabajo(e.target.value)}>
                  <option>Valla Publicitaria</option>
                  <option>Letras Corpóreas</option>
                  <option>Impresión Lona</option>
                </select>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Ancho (metros)</label>
                  <input type="number" step="0.01" min="0" required placeholder="Ej: 3" value={ancho} onChange={e => setAncho(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Alto (metros)</label>
                  <input type="number" step="0.01" min="0" required placeholder="Ej: 2" value={alto} onChange={e => setAlto(e.target.value)} />
                </div>
              </div>

              <button type="submit" className={styles.btnPrimary}>
                Calcular Materiales
              </button>
            </form>
          </div>

          {/* Panel Derecho: Lista Editable de Materiales */}
          <div className={styles.panel}>
            <h2>Desglose de Materiales</h2>
            <p className={styles.subtitle}>Ajusta nombres, cantidades o precios. Los precios están en base al mercado local (USD).</p>
            
            {materialesCotizacion.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                Llena los datos del trabajo y presiona "Calcular Materiales" para ver la lista.
              </div>
            ) : (
              <>
                <div className={styles.materialList}>
                  {materialesCotizacion.map(m => (
                    <div key={m.id} className={styles.materialItem}>
                      <div className={styles.itemHeader}>
                        <div className={styles.itemNameWrapper}>
                          <input 
                            type="text" 
                            className={styles.itemNameInput}
                            value={m.nombre} 
                            onChange={(e) => handleActualizarMaterial(m.id, 'nombre', e.target.value)}
                          />
                        </div>
                        <button 
                          onClick={() => handleEliminarMaterial(m.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                          title="Eliminar material"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className={styles.itemDetails}>
                        <div className={styles.priceWrapper}>
                          <span style={{ color: '#10b981', fontWeight: 600 }}>$</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            value={m.precio_unitario} 
                            onChange={(e) => handleActualizarMaterial(m.id, 'precio_unitario', e.target.value)}
                          />
                        </div>
                        <span className={styles.unit}>por {m.unidad_medida}</span>
                        
                        <div className={styles.qtyWrapper}>
                          <label>Cant:</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            min="0"
                            value={m.cantidad} 
                            onChange={(e) => handleActualizarMaterial(m.id, 'cantidad', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!cotizacionGenerada ? (
                  <button onClick={handleGenerarCotizacion} className={styles.btnSuccess}>
                    <Receipt size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }} />
                    Generar Cotización Final
                  </button>
                ) : (
                  <div className={styles.totalBanner}>
                    <h3>Presupuesto Sugerido (Inc. 30% Margen)</h3>
                    <div className={styles.totalAmount}>
                      ${totalCotizacion.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <button onClick={() => window.print()} className={styles.btnOutline}>
                      Imprimir / Guardar PDF
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
