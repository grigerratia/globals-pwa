import { useState, useEffect, useRef } from 'react';
import KanbanBoard from './components/KanbanBoard/KanbanBoard';
import Login from './components/Auth/Login';
import WhatsAppAdmin from './components/WhatsAppAdmin';
import Cotizador from './components/Cotizador/Cotizador';
import { supabase } from './supabase';
import { logAudit } from './utils/audit';
import { requestFirebaseToken, setupOnMessageListener } from './firebase';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
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
        // Aquí puedes mostrar un Toast o usar un estado global si lo deseas.
        // Como solución rápida para mostrar la notificación visual en primer plano:
        if (Notification.permission === 'granted') {
           if ('serviceWorker' in navigator) {
             navigator.serviceWorker.ready.then((registration) => {
               registration.showNotification(payload.notification?.title || "Notificación", {
                 body: payload.notification?.body,
                 icon: '/vite.svg'
               });
             });
           } else {
             new Notification(payload.notification?.title || "Notificación", {
                body: payload.notification?.body,
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

  return (
    <>
      <KanbanBoard session={session} />
    </>
  );
}

export default App;
