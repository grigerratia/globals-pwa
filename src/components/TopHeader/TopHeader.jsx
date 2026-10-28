import { useState } from 'react';
import { supabase } from '../../supabase';
import { BarChart2, Activity, Calculator, QrCode, LogOut, Menu, X, Kanban, Shield, Wrench } from 'lucide-react';
import BellNotifications from '../KanbanBoard/BellNotifications';
import logo from '../../assets/logo.png';
import styles from './TopHeader.module.scss';

export default function TopHeader({ session, currentView }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userRole = session?.user?.user_metadata?.rol || 'Usuario';
  const roleLower = userRole.toLowerCase();
  const userName = session?.user?.user_metadata?.nombre || session?.user?.email;
  
  const isMaster = roleLower === 'masterusuario' || roleLower.includes('master');
  const isComercial = isMaster || roleLower.includes('comercial');
  const isOperaciones = isMaster || roleLower.includes('operaciones') || roleLower.includes('operativo') || roleLower.includes('producci');
  const isAdminRole = isMaster || roleLower.includes('admin') || roleLower.includes('rrhh') || roleLower.includes('recurso') || roleLower.includes('administrativ');
  const isExecutiveRole = isMaster || isComercial || isOperaciones;

  let displayRole = userRole;
  if (isMaster) displayRole = 'Masterusuario 👑';
  else if (displayRole === 'Líder Comercial') displayRole = 'Director Comercial';
  else if (displayRole === 'Líder de Operaciones') displayRole = 'Gerente de Operaciones';
  else if (displayRole === 'Líder de Producción') displayRole = 'Asistente de Operaciones';
  else if (displayRole === 'Administración' || displayRole === 'Administracion' || displayRole === 'Líder de Administración') displayRole = 'Líder Administrativo y RRHH';
  
  // Administrators should not see the financial dashboard, Master sees everything
  const canViewFinances = isComercial || isMaster;
  const canViewCotizador = isMaster || isComercial || isOperaciones;
  const canViewOperaciones = isMaster || isOperaciones || isComercial;

  const getNavBtnStyle = (isActive) => ({
    padding: '0.4rem 0.75rem',
    borderRadius: '8px',
    border: isActive ? '1px solid #93c5fd' : '1px solid #cbd5e1',
    background: isActive ? '#eff6ff' : '#f8fafc',
    color: isActive ? '#1d4ed8' : '#0f172a',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    fontWeight: isActive ? 700 : 600,
    fontSize: '0.875rem',
    transition: 'all 0.15s ease'
  });

  return (
    <header className={styles.topHeader}>
      <div className={styles.logoAndProfile}>
        <div className={styles.logo}>
          <img src={logo} alt="Globals Logo" style={{ height: "40px" }} />
        </div>
        <div className={styles.profileInfo}>
          <span className={styles.userName} title={userName}>
            {userName}
          </span>
          <span className={styles.userRole}>
            {displayRole}
          </span>
        </div>
      </div>

      <div className={styles.userInfo}>
        <BellNotifications session={session} />

        <div className={styles.desktopOnlyActions}>
          {canViewFinances && (
            <button 
              className={styles.btnActionMobile} 
              title="Dashboard Financiero"
              style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#3b82f6', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              onClick={() => window.location.href = '/dashboard'}
            >
              <BarChart2 size={20} />
            </button>
          )}

          {/* Tablero Kanban */}
          <button 
            className={styles.btnActionMobile} 
            title="Tablero Kanban"
            style={getNavBtnStyle(currentView === 'tablero')} 
            onClick={() => window.location.href = '/tablero'}
          >
            <Kanban size={18} color={currentView === 'tablero' ? '#1d4ed8' : '#475569'} />
            <span className={styles.hideOnMobile}>Tablero</span>
          </button>

          {/* Dirección Comercial */}
          {isComercial && (
            <button 
              className={styles.btnActionMobile} 
              title="Resumen Ejecutivo Comercial"
              style={getNavBtnStyle(currentView === 'ejecutivo' || currentView === 'comercial')} 
              onClick={() => window.location.href = '/'}
            >
              <Activity size={18} color={(currentView === 'ejecutivo' || currentView === 'comercial') ? '#1d4ed8' : '#475569'} />
              <span className={styles.hideOnMobile}>Comercial</span>
            </button>
          )}

          {/* Gerente de Operaciones */}
          {canViewOperaciones && (
            <button 
              className={styles.btnActionMobile} 
              title="Vista del Gerente de Operaciones"
              style={getNavBtnStyle(currentView === 'operaciones')} 
              onClick={() => window.location.href = '/operaciones'}
            >
              <Wrench size={18} color={currentView === 'operaciones' ? '#0284c7' : '#475569'} />
              <span className={styles.hideOnMobile}>Operaciones</span>
            </button>
          )}

          {/* Panel Admin / RRHH */}
          {isAdminRole && (
            <button 
              className={styles.btnActionMobile} 
              title="Panel Administración y RRHH"
              style={getNavBtnStyle(currentView === 'admin')} 
              onClick={() => window.location.href = '/admin'}
            >
              <Shield size={18} color={currentView === 'admin' ? '#4f46e5' : '#6366f1'} />
              <span className={styles.hideOnMobile}>Admin/RRHH</span>
            </button>
          )}

          {/* Cotizador */}
          {canViewCotizador && (
            <button 
              className={styles.btnActionMobile} 
              title="Cotizador de Proyectos"
              style={getNavBtnStyle(currentView === 'cotizador')} 
              onClick={() => window.location.href = '/cotizador'}
            >
              <Calculator size={18} color={currentView === 'cotizador' ? '#1d4ed8' : '#475569'} />
              <span className={styles.hideOnMobile}>Cotizador</span>
            </button>
          )}

          {/* WhatsApp Admin */}
          {isComercial && (
            <button 
              className={styles.btnActionMobile} 
              title="WhatsApp Admin"
              style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              onClick={() => window.location.href = '/admin/whatsapp'}
            >
              <QrCode size={20} />
            </button>
          )}
          
          <button className={styles.btnLogout} onClick={() => supabase.auth.signOut()}>
            <LogOut size={18} /> <span className={styles.hideOnMobile}>Cerrar Sesión</span>
          </button>
        </div>

        <button className={styles.mobileMenuBtn} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
      
      {isMobileMenuOpen && (
        <div className={styles.mobileDropdown}>
          {canViewFinances && (
            <button 
              className={`${styles.mobileMenuItem} ${styles.primary}`}
              onClick={() => window.location.href = '/dashboard'}
            >
              <BarChart2 size={18} />
              <span>Dashboard Financiero</span>
            </button>
          )}

          <button 
            className={styles.mobileMenuItem}
            onClick={() => window.location.href = '/tablero'}
          >
            <Kanban size={18} />
            <span>Tablero Completo</span>
          </button>

          {isComercial && (
            <button 
              className={styles.mobileMenuItem}
              onClick={() => window.location.href = '/'}
            >
              <Activity size={18} />
              <span>Vista Comercial</span>
            </button>
          )}

          {canViewOperaciones && (
            <button 
              className={styles.mobileMenuItem}
              onClick={() => window.location.href = '/operaciones'}
            >
              <Wrench size={18} color="#0284c7" />
              <span>Vista Gerente de Operaciones</span>
            </button>
          )}

          {isAdminRole && (
            <button 
              className={styles.mobileMenuItem}
              onClick={() => window.location.href = '/admin'}
            >
              <Shield size={18} color="#6366f1" />
              <span>Panel Admin y RRHH</span>
            </button>
          )}
          
          {canViewCotizador && (
            <button 
              className={styles.mobileMenuItem}
              onClick={() => window.location.href = '/cotizador'}
            >
              <Calculator size={18} />
              <span>Cotizador</span>
            </button>
          )}

          {isComercial && (
            <button 
              className={styles.mobileMenuItem}
              onClick={() => window.location.href = '/admin/whatsapp'}
            >
              <QrCode size={18} />
              <span>WhatsApp Admin</span>
            </button>
          )}

          <div className={styles.mobileDivider}></div>

          <button className={`${styles.mobileMenuItem} ${styles.danger}`} onClick={() => supabase.auth.signOut()}>
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </header>
  );
}
