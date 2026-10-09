import { useState } from 'react';
import { supabase } from '../../supabase';
import { BarChart2, Activity, Calculator, QrCode, LogOut, Menu, X, Kanban } from 'lucide-react';
import BellNotifications from '../KanbanBoard/BellNotifications';
import logo from '../../assets/logo.png';
import styles from './TopHeader.module.scss';

export default function TopHeader({ session, currentView }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userRole = session?.user?.user_metadata?.rol || 'Usuario';
  const roleLower = userRole.toLowerCase();
  const userName = session?.user?.user_metadata?.nombre || session?.user?.email;
  const isExecutiveRole = roleLower.includes('comercial') || roleLower.includes('operaciones');
  const isAdminRole = roleLower.includes('admin') || roleLower.includes('rrhh') || roleLower.includes('recurso');
  
  // Administrators should not see the financial dashboard
  const canViewFinances = roleLower.includes('comercial'); 
  
  const vistaTexto = isAdminRole ? "Panel Admin" : "Vista Ejecutiva";
  const isLider = isExecutiveRole || isAdminRole;
  const canViewCotizador = isLider && !isAdminRole;

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
            {userRole}
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

          {isLider && (
            <>
              {currentView === 'ejecutivo' ? (
                <button 
                  className={styles.btnActionMobile} 
                  title="Tablero"
                  style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }} 
                  onClick={() => window.location.href = '/tablero'}
                >
                  <Kanban size={20} />
                  <span className={styles.hideOnMobile}>Tablero</span>
                </button>
              ) : (
                <button 
                  className={styles.btnActionMobile} 
                  title={vistaTexto}
                  style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }} 
                  onClick={() => window.location.href = '/'}
                >
                  <Activity size={20} />
                  <span className={styles.hideOnMobile}>Ejecutivo</span>
                </button>
              )}
              {canViewCotizador && (
                <button 
                  className={styles.btnActionMobile} 
                  title="Cotizador"
                  style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }} 
                  onClick={() => window.location.href = '/cotizador'}
                >
                  <Calculator size={20} />
                  <span className={styles.hideOnMobile}>Cotizador</span>
                </button>
              )}
            </>
          )}

          <button 
            className={styles.btnActionMobile} 
            title="WhatsApp Admin"
            style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            onClick={() => window.location.href = '/admin/whatsapp'}
          >
            <QrCode size={20} />
          </button>
          
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
          {isLider && (
            <>
              {currentView === 'ejecutivo' ? (
                <button 
                  className={styles.mobileMenuItem}
                  onClick={() => window.location.href = '/tablero'}
                >
                  <Kanban size={18} />
                  <span>Tablero Completo</span>
                </button>
              ) : (
                <button 
                  className={styles.mobileMenuItem}
                  onClick={() => window.location.href = '/'}
                >
                  <Activity size={18} />
                  <span>{vistaTexto}</span>
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
            </>
          )}
          
          <button 
            className={styles.mobileMenuItem}
            onClick={() => window.location.href = '/admin/whatsapp'}
          >
            <QrCode size={18} />
            <span>WhatsApp Admin</span>
          </button>

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
