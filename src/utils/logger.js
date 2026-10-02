export const appLogs = [];
const listeners = new Set();

export const subscribeToLogs = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const notify = () => {
  listeners.forEach((fn) => fn());
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
  if (appLogs.length > 50) appLogs.pop();
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
  addLog('WINDOW_ERROR', e.message, e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  addLog('PROMISE_REJECTION', e.reason);
});
