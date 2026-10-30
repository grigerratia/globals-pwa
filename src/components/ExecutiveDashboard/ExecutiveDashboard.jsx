import { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle, 
  Wrench, 
  X, 
  Archive, 
  Trash2, 
  MoreVertical, 
  ClipboardList, 
  Palette, 
  Package, 
  Truck 
} from 'lucide-react';
import { supabase } from '../../supabase';
import styles from './ExecutiveDashboard.module.scss';
import GlobalSearch from '../GlobalSearch/GlobalSearch';
import CanceladosModal from '../Modals/CanceladosModal';
import TopHeader from '../TopHeader/TopHeader';
import ProjectDetailModal from '../Modals/ProjectDetailModal';
import { formatDateTimeVE } from '../../utils/kanbanRules';

export default function ExecutiveDashboard({ session }) {
  const [proyectos, setProyectos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [showCancelados, setShowCancelados] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [proyectoDetalleId, setProyectoDetalleId] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Estado para el modal de KPIs (Tarjetas interactivas)
  const [modalKpi, setModalKpi] = useState(null);

  const userRole = session?.user?.user_metadata?.rol || '';
  const roleLower = userRole.toLowerCase();
  const isMaster = roleLower === 'masterusuario' || roleLower.includes('master');
  const hasExecutiveActions = isMaster || roleLower.includes('comercial') || roleLower.includes('operaciones') || roleLower.includes('operativo') || roleLower.includes('producci');

  const isValidActivityLog = (log) => {
    if (!log || !log.accion) return false;
    const acc = String(log.accion).trim().toUpperCase();
    if (acc === 'INICIÓ SESIÓN') return false;
    if (acc.startsWith('ERROR') || acc.startsWith('WARN') || acc.includes('BUG')) return false;
    return true;
  };

  const fetchLogs = async () => {
    try {
      const { data: logs, error } = await supabase.from('audit_logs')
        .select('*')
        .neq('accion', 'Inició sesión')
        .not('accion', 'ilike', 'ERROR%')
        .not('accion', 'ilike', 'WARN%')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) {
        console.warn("Error cargando actividad:", error.message);
      } else if (logs) {
        setAuditLogs(logs.filter(isValidActivityLog));
      }
    } catch (err) {
      console.warn("Error en fetchLogs:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        const { data: colsData } = await supabase.from('columnas').select('nombre').order('orden', { ascending: true });
        if (colsData && isMounted) {
          setEstados(colsData.map(c => c.nombre));
        }

        const { data: proys } = await supabase.from('proyectos').select('*');
        if (proys && isMounted) {
          setProyectos(proys);
        }

        await fetchLogs();
      } catch (err) {
        console.error("Error en fetchData de ExecutiveDashboard:", err);
      } finally {
        if (isMounted) {
          setCargando(false);
        }
      }
    }
    fetchData();
    
    const channel = supabase.channel('audit_logs_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        if (isValidActivityLog(payload.new)) {
          setAuditLogs(prev => [payload.new, ...prev.filter(l => l.id !== payload.new?.id)].slice(0, 30));
        }
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (cargando) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>  {showCancelados && <CanceladosModal onClose={() => setShowCancelados(false)} session={session} />}
    </div>
        <p>Cargando vista ejecutiva...</p>
      </div>
    );
  }

  // Proyectos base excluyendo cancelados y filtrando archivados según el toggle
  const baseProyectos = proyectos.filter(p => {
    if (p.estado?.includes('Cancelado')) return false;
    if (!showArchived && p.estado === 'Archivado') return false;
    return true;
  });

  // Conteo y agrupación por las 6 Columnas Operativas
  // 1. Levantamiento Técnico
  const proysLevantamiento = baseProyectos.filter(p => {
    const est = (p.estado || '').toLowerCase().trim();
    return est === 'levantamiento técnico' || est === 'levantamiento tecnico' || est.includes('levantamiento') || est.includes('conversaci') || est.includes('presupuesto');
  });

  // 2. Diseño y Aprobación
  const proysDiseno = baseProyectos.filter(p => {
    const est = (p.estado || '').toLowerCase().trim();
    return est === 'diseño y aprobación' || est === 'diseno y aprobacion' || est.includes('diseño') || est.includes('diseno');
  });

  // 3. Logística y Materiales
  const proysLogistica = baseProyectos.filter(p => {
    const est = (p.estado || '').toLowerCase().trim();
    return est === 'logística y materiales' || est === 'logistica y materiales' || est.includes('logística') || est.includes('logistica') || est.includes('compras');
  });

  // 4. En Fabricación
  const proysFabricacion = baseProyectos.filter(p => {
    const est = (p.estado || '').toLowerCase().trim();
    return est === 'en fabricación' || est === 'en fabricacion' || est.includes('fabricaci') || est.includes('fabricacion') || est.includes('taller');
  });

  // 5. Instalación y Montaje
  const proysInstalacion = baseProyectos.filter(p => {
    const est = (p.estado || '').toLowerCase().trim();
    return est === 'instalación y montaje' || est === 'instalacion y montaje' || est.includes('instalaci') || est.includes('instalacion') || est.includes('montaje');
  });

  // 6. Entregado y Cerrado
  const proysEntregado = baseProyectos.filter(p => {
    const est = (p.estado || '').toLowerCase().trim();
    return est === 'entregado y cerrado' || est.includes('entregado') || est.includes('pagado y cerrado') || est === 'cerrado';
  });

  return (
    <div className={styles.executiveContainer}>
      <TopHeader session={session} currentView="operaciones" />
      
      <header className={styles.header} style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className={styles.greeting} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem', color: '#0f172a' }}>
              Resumen de Control Operativo y Producción
            </p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Métricas de avance, seguimiento de taller, logística y culminación de proyectos.
            </p>
          </div>
        </div>
        <div className={styles.toolbar} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <GlobalSearch onResultClick={(id) => setProyectoDetalleId(id)} />
          </div>
          
          {hasExecutiveActions && (
            <>
              <div className={styles.desktopToolbarActions}>
                <button 
                  className={`${styles.btnArchive} ${showArchived ? styles.active : ''}`}
                  onClick={() => setShowArchived(!showArchived)}
                >
                  <Archive size={18} />
                  <span className={styles.hideOnMobile}>
                    {showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
                  </span>
                </button>
                <button 
                  className={styles.btnArchive}
                  style={{ background: '#ef4444', color: 'white', borderColor: '#b91c1c' }}
                  onClick={() => setShowCancelados(true)}
                >
                  <Trash2 size={18} />
                  <span className={styles.hideOnMobile}>Cancelados</span>
                </button>
              </div>

              <div className={styles.mobileToolbarActions}>
                <button 
                  className={styles.btnMobileMenu}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  title="Menú de opciones"
                >
                  <MoreVertical size={20} />
                </button>
                
                {isMobileMenuOpen && (
                  <div className={styles.mobileToolbarDropdown}>
                    <button 
                      onClick={() => { setShowArchived(!showArchived); setIsMobileMenuOpen(false); }}
                    >
                      <Archive size={16} />
                      {showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
                    </button>
                    <button 
                      style={{ color: '#ef4444' }}
                      onClick={() => { setShowCancelados(true); setIsMobileMenuOpen(false); }}
                    >
                      <Trash2 size={16} />
                      Ver Cancelados
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.kpiGrid}>
          {/* 1. Levantamiento Técnico */}
          <div 
            className={`${styles.kpiCard} ${styles.cardLevantamiento}`}
            onClick={() => setModalKpi({ title: '1. Levantamiento Técnico', data: proysLevantamiento })}
            title="Ver proyectos en Levantamiento Técnico"
          >
            <div className={styles.kpiHeader}>
              <ClipboardList size={18} />
              <h3>
                <span className={styles.desktopTitle}>1. Levantamiento Técnico</span>
                <span className={styles.mobileTitle}>1. Levantamiento</span>
              </h3>
            </div>
            <div className={styles.kpiValue}>
              {proysLevantamiento.length}
            </div>
            <div className={styles.kpiSub}>
              <span className={styles.desktopSub}>Medidas y requisitos (Click para ver)</span>
              <span className={styles.mobileSub}>Medidas • Ver</span>
            </div>
          </div>

          {/* 2. Diseño y Aprobación */}
          <div 
            className={`${styles.kpiCard} ${styles.cardDiseno}`}
            onClick={() => setModalKpi({ title: '2. Diseño y Aprobación', data: proysDiseno })}
            title="Ver proyectos en Diseño y Aprobación"
          >
            <div className={styles.kpiHeader}>
              <Palette size={18} />
              <h3>
                <span className={styles.desktopTitle}>2. Diseño y Aprobación</span>
                <span className={styles.mobileTitle}>2. Diseño</span>
              </h3>
            </div>
            <div className={styles.kpiValue}>
              {proysDiseno.length}
            </div>
            <div className={styles.kpiSub}>
              <span className={styles.desktopSub}>Arte y validación (Click para ver)</span>
              <span className={styles.mobileSub}>Arte • Ver</span>
            </div>
          </div>

          {/* 3. Logística y Materiales */}
          <div 
            className={`${styles.kpiCard} ${styles.cardLogistica}`}
            onClick={() => setModalKpi({ title: '3. Logística y Materiales', data: proysLogistica })}
            title="Ver proyectos en Logística y Materiales"
          >
            <div className={styles.kpiHeader}>
              <Package size={18} />
              <h3>
                <span className={styles.desktopTitle}>3. Logística y Materiales</span>
                <span className={styles.mobileTitle}>3. Logística</span>
              </h3>
            </div>
            <div className={styles.kpiValue}>
              {proysLogistica.length}
            </div>
            <div className={styles.kpiSub}>
              <span className={styles.desktopSub}>Insumos y compras (Click para ver)</span>
              <span className={styles.mobileSub}>Compras • Ver</span>
            </div>
          </div>

          {/* 4. En Fabricación */}
          <div 
            className={`${styles.kpiCard} ${styles.cardFabricacion}`}
            onClick={() => setModalKpi({ title: '4. En Fabricación', data: proysFabricacion })}
            title="Ver proyectos en En Fabricación"
          >
            <div className={styles.kpiHeader}>
              <Wrench size={18} />
              <h3>
                <span className={styles.desktopTitle}>4. En Fabricación</span>
                <span className={styles.mobileTitle}>4. Fabricación</span>
              </h3>
            </div>
            <div className={styles.kpiValue}>
              {proysFabricacion.length}
            </div>
            <div className={styles.kpiSub}>
              <span className={styles.desktopSub}>Taller y manufactura (Click para ver)</span>
              <span className={styles.mobileSub}>Taller • Ver</span>
            </div>
          </div>

          {/* 5. Instalación y Montaje */}
          <div 
            className={`${styles.kpiCard} ${styles.cardInstalacion}`}
            onClick={() => setModalKpi({ title: '5. Instalación y Montaje', data: proysInstalacion })}
            title="Ver proyectos en Instalación y Montaje"
          >
            <div className={styles.kpiHeader}>
              <Truck size={18} />
              <h3>
                <span className={styles.desktopTitle}>5. Instalación y Montaje</span>
                <span className={styles.mobileTitle}>5. Instalación</span>
              </h3>
            </div>
            <div className={styles.kpiValue}>
              {proysInstalacion.length}
            </div>
            <div className={styles.kpiSub}>
              <span className={styles.desktopSub}>En sitio y montaje (Click para ver)</span>
              <span className={styles.mobileSub}>Montaje • Ver</span>
            </div>
          </div>

          {/* 6. Entregado y Cerrado */}
          <div 
            className={`${styles.kpiCard} ${styles.cardEntregado}`}
            onClick={() => setModalKpi({ title: '6. Entregado y Cerrado', data: proysEntregado })}
            title="Ver proyectos Entregados y Cerrados"
          >
            <div className={styles.kpiHeader}>
              <CheckCircle size={18} />
              <h3>
                <span className={styles.desktopTitle}>6. Entregado y Cerrado</span>
                <span className={styles.mobileTitle}>6. Entregado</span>
              </h3>
            </div>
            <div className={styles.kpiValue}>
              {proysEntregado.length}
            </div>
            <div className={styles.kpiSub}>
              <span className={styles.desktopSub}>Histórico culminado (Click para ver)</span>
              <span className={styles.mobileSub}>Cerrados • Ver</span>
            </div>
          </div>
        </section>

        <section className={styles.activitySection}>
          <div className={styles.sectionHeader}>
            <Activity size={18} />
            <h2>Actividad Reciente</h2>
            <button onClick={fetchLogs} style={{ marginLeft: "auto", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0.2rem 0.5rem", fontSize: "0.8rem", cursor: "pointer" }}>Actualizar</button>
          </div>
          <div className={styles.activityList}>
            {auditLogs.filter(isValidActivityLog).length === 0 ? (
              <p style={{ padding: "1rem", color: "#64748b", textAlign: "center", fontSize: "0.9rem" }}>No hay actividad reciente para mostrar.</p>
            ) : (
              auditLogs.filter(isValidActivityLog).map(log => {
                const projectId = log.detalles?.proyecto_id || log.detalles?.id;
                return (
                  <div key={log.id} className={styles.activityItem} onClick={() => projectId && setProyectoDetalleId(projectId)} style={{ cursor: projectId ? 'pointer' : 'default' }}>
                    <div className={styles.activityMain}>
                      <h4 style={{ fontSize: '0.95rem' }}>{log.accion}</h4>
                      {log.detalles?.titulo && <span className={styles.badge} style={{ opacity: 0.8 }}>{log.detalles.titulo}</span>}
                    </div>
                    <div className={styles.activityDetails} style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                      {log.accion === 'Movió proyecto de fase' && (
                        <span>De <strong>{log.detalles?.origen || '...'}</strong> a <strong>{log.detalles?.nuevo_estado || '...'}</strong></span>
                      )}
                      {log.detalles?.motivo && <span> (Motivo: {log.detalles.motivo})</span>}
                    </div>
                    <div className={styles.activityMeta} style={{ marginTop: '0.25rem' }}>
                      <span>{formatDateTimeVE(log.created_at)}</span>
                      <span>• {log.usuario_nombre}</span>
                    </div>
                  </div>
                );
              })
            )}
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
                      {p.dias !== undefined && <span>• {p.dias} días en fase</span>}
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
