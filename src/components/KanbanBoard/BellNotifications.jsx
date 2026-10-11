import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import styles from './BellNotifications.module.scss';
import { Bell, Trash2 } from 'lucide-react';
import { formatDateTimeVE } from '../../utils/kanbanRules';

export default function BellNotifications({ session }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchNotificaciones = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (data) setNotificaciones(data);
    };

    fetchNotificaciones();
    if (!session?.user?.id) return;
    const channel = supabase
      .channel('notificaciones-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `user_id=eq.${session.user.id}` }, (payload) => {
        setNotificaciones(prev => [payload.new, ...prev]);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session?.user?.id]);

  const unreadCount = notificaciones.filter(n => !n.leida).length;

  const markAllAsRead = async () => {
    const unreadIds = notificaciones.filter(n => !n.leida).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase.from('notificaciones').update({ leida: true }).in('id', unreadIds);
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    }
  };

  const toggleOpen = () => {
    if (!isOpen) {
      markAllAsRead();
    }
    setIsOpen(!isOpen);
  };

  const clearAll = async (e) => {
    e.stopPropagation();
    await supabase.from('notificaciones').delete().eq('user_id', session.user.id);
    setNotificaciones([]);
  };

  const deleteOne = async (id, e) => {
    e.stopPropagation();
    await supabase.from('notificaciones').delete().eq('id', id);
    setNotificaciones(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className={styles.bellContainer}>
      <button className={styles.bellButton} onClick={toggleOpen}>
        <Bell size={20} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>
      
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <span>Notificaciones</span>
            {notificaciones.length > 0 && (
              <button onClick={clearAll} className={styles.clearAllBtn}>Borrar todas</button>
            )}
          </div>
          <div className={styles.list}>
            {notificaciones.length === 0 ? (
              <div className={styles.empty}>No tienes notificaciones recientes.</div>
            ) : (
              notificaciones.map(n => (
                <div key={n.id} className={`${styles.item} ${n.leida ? '' : styles.unread}`}>
                  <div className={styles.itemContent}>
                    <strong>{n.titulo}</strong>
                    <p>{n.mensaje}</p>
                    <small>{formatDateTimeVE(n.created_at)}</small>
                  </div>
                  <button className={styles.deleteBtn} onClick={(e) => deleteOne(n.id, e)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
