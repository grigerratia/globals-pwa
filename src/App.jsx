import { useState, useEffect, useRef } from 'react';
import KanbanBoard from './components/KanbanBoard/KanbanBoard';
import Login from './components/Auth/Login';
import WhatsAppAdmin from './components/WhatsAppAdmin';
import { supabase } from './supabase';
import { logAudit } from './utils/audit';
import { requestFirebaseToken, onMessageListener } from './firebase';

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
      onMessageListener().then((payload) => {
        console.log('Mensaje FCM recibido en primer plano:', payload);
      }).catch(err => console.log('Error FCM foreground: ', err));
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

  return (
    <>
      <KanbanBoard session={session} />
    </>
  );
}

export default App;
