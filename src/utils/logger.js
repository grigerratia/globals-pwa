import { supabase } from '../supabase';

const LOCAL_KEY = 'dinamo_app_errors';
export let appLogs = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
const listeners = new Set();

export const subscribeToLogs = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const notify = () => {
  listeners.forEach((fn) => fn());
};

const saveToDB = async (type, msg) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('audit_logs').insert([{
        usuario_id: session.user.id,
        usuario_nombre: session.user.user_metadata?.nombre || session.user.email,
        accion: `ERROR_${type}`,
        detalles: { message: msg }
      }]);
    }
  } catch (e) {}
};

const addLog = (type, ...args) => {
  const msg = args.map(a => {
    if (a instanceof Error) return a.stack || a.message;
    if (typeof a === 'object') {
      try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); }
    }
    return String(a);
  }).join(' ');
  
  appLogs.unshift({ timestamp: new Date().toISOString(), type, message: msg });
  if (appLogs.length > 100) appLogs.pop();
  
  localStorage.setItem(LOCAL_KEY, JSON.stringify(appLogs));
  notify();
  saveToDB(type, msg);
};

export const clearLogs = () => {
  appLogs = [];
  localStorage.removeItem(LOCAL_KEY);
  notify();
};

const originalError = console.error;
console.error = (...args) => {
  originalError(...args);
  addLog('ERROR', ...args);
};

const originalWarn = console.warn;
console.warn = (...args) => {
  originalWarn(...args);
  addLog('WARN', ...args);
};

window.addEventListener('error', (e) => {
  addLog('WINDOW', e.message, e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  addLog('PROMISE', e.reason);
});
