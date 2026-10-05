import { useState, useEffect } from 'react';
import { Kanban, Activity, TrendingUp, CheckCircle, Briefcase, AlertCircle, Wrench, BarChart2, X } from 'lucide-react';
import { supabase } from '../../supabase';
import styles from './ExecutiveDashboard.module.scss';
import GlobalSearch from '../GlobalSearch/GlobalSearch';
import TopHeader from '../TopHeader/TopHeader';
import ProjectDetailModal from '../Modals/ProjectDetailModal';

export default function ExecutiveDashboard({ session }) {
  const [proyectos, setProyectos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [proyectoDetalleId, setProyectoDetalleId] = useState(null);
  
  // Estado para el modal de KPIs (Tarjetas interactivas)
  const [modalKpi, setModalKpi] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const { data: colsData } = await supabase.from('columnas').select('nombre').order('orden', { ascending: true });
      if (colsData) {
        setEstados(colsData.map(c => c.nombre));
      }

      const { data: proys } = await supabase.from('proyectos').select('*');
      if (proys) {
        setProyectos(proys);
      }
      setCargando(false);
    }
    fetchData();
  }, []);

  const goToKanban = () => {
    window.location.href = '/kanban';
  };

  if (cargando) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando vista ejecutiva...</p>
      </div>
    );
  }

  const userRole = session?.user?.user_metadata?.rol;
  const isLiderComercial = userRole === 'Líder Comercial';

  const activos = proyectos.filter(p => p.estado !== 'Entregado y cerrado' && p.estado !== 'Archivado' && !p.estado?.includes('Cancelado'));
  const completados = proyectos.filter(p => p.estado === 'Entregado y cerrado');
  
  // FINANCIEROS - Corregido a presupuesto_vendido en lugar de precio_venta
  const ingresosProyectados = activos.reduce((sum, p) => sum + (Number(p.presupuesto_vendido) || 0), 0);
  const ingresosCompletados = completados.reduce((sum, p) => sum + (Number(p.presupuesto_vendido) || 0), 0);
  
  // OPERATIVOS
  const produccionFases = ['Logística y compras', 'En fabricación', 'Listo para instalación', 'En instalación'];
  const enProduccion = activos.filter(p => produccionFases.includes(p.estado));
  
  const hoy = new Date();
  const estancados = activos.filter(p => {
    if (p.estado?.includes('Pausa')) return true;
    if (!p.fecha_ultima_actualizacion) return false;
    const diffTime = Math.abs(hoy - new Date(p.fecha_ultima_actualizacion));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) > 5;
  });
  
  const recientes = [...activos].sort((a, b) => new Date(b.fecha_ultima_actualizacion) - new Date(a.fecha_ultima_actualizacion)).slice(0, 5);

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);

  return (
    <div className={styles.executiveContainer}>
      <TopHeader session={session} currentView="ejecutivo" />
      <header className={styles.header} style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className={styles.greeting}>
          <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>Resumen Ejecutivo</p>
        </div>
        <div className={styles.searchSection}>
          <GlobalSearch onResultClick={(id) => setProyectoDetalleId(id)} />
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.kpiGrid}>
          
          {isLiderComercial ? (
            <>
              <div 
                className={`${styles.kpiCard} ${styles.cardProyectados}`} 
                onClick={() => setModalKpi({ title: 'Ingresos Proyectados (Activos)', data: activos })}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.kpiHeader}>
                  <TrendingUp size={20} />
                  <h3>Ingresos Proyectados</h3>
                </div>
                <div className={styles.kpiValue}>
                  {formatCurrency(ingresosProyectados)}
                </div>
                <div className={styles.kpiSub}>
                  En {activos.length} proyectos activos (Click para ver)
                </div>
              </div>

              <div 
                className={`${styles.kpiCard} ${styles.cardCerrados}`}
                onClick={() => setModalKpi({ title: 'Ingresos Cerrados', data: completados })}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.kpiHeader}>
                  <CheckCircle size={20} />
                  <h3>Ingresos Cerrados</h3>
                </div>
                <div className={styles.kpiValue}>
                  {formatCurrency(ingresosCompletados)}
                </div>
                <div className={styles.kpiSub}>
                  Histórico completado (Click para ver)
                </div>
              </div>
            </>
          ) : (
            <>
              <div 
                className={`${styles.kpiCard} ${styles.cardProyectados}`}
                onClick={() => setModalKpi({ title: 'Proyectos en Producción', data: enProduccion })}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.kpiHeader}>
                  <Wrench size={20} />
                  <h3>En Producción</h3>
                </div>
                <div className={styles.kpiValue}>
                  {enProduccion.length}
                </div>
                <div className={styles.kpiSub}>
                  Logística, fab. o inst. (Click para ver)
                </div>
              </div>

              <div 
                className={`${styles.kpiCard} ${styles.cardCerrados}`}
                onClick={() => setModalKpi({ title: 'Proyectos Completados', data: completados })}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.kpiHeader}>
                  <CheckCircle size={20} />
                  <h3>Proyectos Completados</h3>
                </div>
                <div className={styles.kpiValue}>
                  {completados.length}
                </div>
                <div className={styles.kpiSub}>
                  Histórico cerrado (Click para ver)
                </div>
              </div>
            </>
          )}

          <div 
            className={`${styles.kpiCard} ${styles.cardActivos}`}
            onClick={() => setModalKpi({ title: 'Todos los Proyectos Activos', data: activos })}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.kpiHeader}>
              <Briefcase size={20} />
              <h3>Proyectos Activos</h3>
            </div>
            <div className={styles.kpiValue}>
              {activos.length}
            </div>
            <div className={styles.kpiSub}>
              En progreso (Click para ver)
            </div>
          </div>

          <div 
            className={`${styles.kpiCard} ${styles.cardAtencion}`}
            onClick={() => setModalKpi({ title: 'Requieren Atención (Estancados > 5 días o en Pausa)', data: estancados })}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.kpiHeader}>
              <AlertCircle size={20} />
              <h3>Atención Requerida</h3>
            </div>
            <div className={styles.kpiValue}>
              {estancados.length}
            </div>
            <div className={styles.kpiSub}>
              Estancados por &gt; 5 días (Click para ver)
            </div>
          </div>
        </section>

        <section className={styles.activitySection}>
          <div className={styles.sectionHeader}>
            <Activity size={18} />
            <h2>Actividad Reciente</h2>
          </div>
          <div className={styles.activityList}>
            {recientes.map(p => (
              <div key={p.id} className={styles.activityItem} onClick={() => setProyectoDetalleId(p.id)}>
                <div className={styles.activityMain}>
                  <h4>{p.titulo}</h4>
                  <span className={styles.badge}>{p.estado}</span>
                </div>
                <div className={styles.activityMeta}>
                  <span>Actualizado: {new Date(p.fecha_ultima_actualizacion).toLocaleDateString()}</span>
                  {p.presupuesto_vendido && <span>• {formatCurrency(p.presupuesto_vendido)}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modal para mostrar lista de proyectos de la KPI clickeada */}
      {modalKpi && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9000,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            background: 'white', width: '90%', maxWidth: '600px', maxHeight: '80vh',
            borderRadius: '12px', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{modalKpi.title}</h3>
              <button onClick={() => setModalKpi(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {modalKpi.data.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>No hay proyectos en esta categoría.</p>
              ) : (
                modalKpi.data.map(p => (
                  <div 
                    key={p.id} 
                    className={styles.activityItem}
                    onClick={() => {
                      setModalKpi(null);
                      setProyectoDetalleId(p.id);
                    }}
                  >
                    <div className={styles.activityMain}>
                      <h4 style={{ color: '#3b82f6' }}>{p.titulo}</h4>
                      <span className={styles.badge}>{p.estado}</span>
                    </div>
                    <div className={styles.activityMeta} style={{ marginTop: '4px' }}>
                      <span>Cliente: {p.cliente_nombre || p.cliente_empresa || 'N/A'}</span>
                      {p.presupuesto_vendido && <span>• {formatCurrency(p.presupuesto_vendido)}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {proyectoDetalleId && (
        <ProjectDetailModal
          proyectoId={proyectoDetalleId}
          estados={estados}
          session={session}
          onClose={() => setProyectoDetalleId(null)}
          onProjectUpdated={(updatedProject) => {
            setProyectos(prev => prev.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p));
          }}
        />
      )}
    </div>
  );
}
