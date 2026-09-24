import { useState, useEffect, useRef } from 'react';
import KanbanBoard from './components/KanbanBoard/KanbanBoard';
import Login from './components/Auth/Login';
import WhatsAppAdmin from './components/WhatsAppAdmin';
import Cotizador from './components/Cotizador/Cotizador';
import Dashboard from './components/Dashboard/Dashboard';
import Legales from './components/Legales/Legales';
import { supabase } from './supabase';
import { logAudit } from './utils/audit';
import { requestFirebaseToken, setupOnMessageListener } from './firebase';


const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes slideIn {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const authLogDone = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session && !authLogDone.current) {
        logAudit(session, 'Inició sesión');
        authLogDone.current = true;
        setupFirebasePush(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN' && !authLogDone.current) {
        logAudit(session, 'Inició sesión');
        authLogDone.current = true;
        setupFirebasePush(session);
      }
      if (event === 'SIGNED_OUT') {
        authLogDone.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setupFirebasePush = async (currentSession) => {
    try {
      const token = await requestFirebaseToken();
      if (token) {
        await supabase.from('fcm_tokens').upsert({ 
          token: token, 
          user_id: currentSession.user.id 
        });
      }
            setupOnMessageListener((payload) => {
        console.log('Mensaje FCM recibido en primer plano:', payload);
        // Show in-app toast
        setToastMessage({
          title: payload.notification?.title || payload.data?.title || "Notificación",
          body: payload.notification?.body || payload.data?.body || "Tienes un nuevo mensaje"
        });
        setTimeout(() => setToastMessage(null), 5000);
        
        if (Notification.permission === 'granted') {
           if ('serviceWorker' in navigator) {
             navigator.serviceWorker.ready.then((registration) => {
               registration.showNotification(payload.notification?.title || payload.data?.title || "Notificación", {
                 body: payload.notification?.body || payload.data?.body,
                 icon: '/vite.svg'
               });
             });
           } else {
             new Notification(payload.notification?.title || payload.data?.title || "Notificación", {
                body: payload.notification?.body || payload.data?.body,
                icon: '/vite.svg'
             });
           }
        }
      });
    } catch (error) {
      console.error('Error configurando Firebase Push:', error);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#64748b' }}>Cargando aplicación...</div>;
  }

  if (!session) {
    return <Login onLogin={setSession} />;
  }

  // Simple Router
  if (window.location.pathname === '/admin/whatsapp') {
    return <WhatsAppAdmin />;
  }

  if (window.location.pathname === '/cotizador') {
    return <Cotizador />;
  }

  if (window.location.pathname.startsWith('/legales/')) {
    const page = window.location.pathname.split('/').pop();
    return <Legales pagina={page} />;
  }

  if (window.location.pathname === '/dashboard') {
    return <Dashboard session={session} />;
  }

  return (
    <>
      <KanbanBoard session={session} />
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#3b82f6',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <strong style={{ fontSize: '14px' }}>{toastMessage.title}</strong>
          <span style={{ fontSize: '12px' }}>{toastMessage.body}</span>
        </div>
      )}

      {/* Discreet Legal Footer */}
      <div style={{
        position: 'fixed',
        bottom: '4px',
        right: '12px',
        fontSize: '0.65rem',
        color: '#94a3b8',
        display: 'flex',
        gap: '8px',
        zIndex: 100,
        opacity: 0.7
      }}>
        <a href="/legales/terminos-y-condiciones" style={{ color: 'inherit', textDecoration: 'none' }}>Términos</a>
        <span>|</span>
        <a href="/legales/aviso-legal" style={{ color: 'inherit', textDecoration: 'none' }}>Legal</a>
        <span>|</span>
        <a href="/legales/politica-de-cookies" style={{ color: 'inherit', textDecoration: 'none' }}>Cookies</a>
        <span>|</span>
        <a href="/legales/politica-de-privacidad" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidad</a>
      </div>
    </>
  );
}

export default App;
