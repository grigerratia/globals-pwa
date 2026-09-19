const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf-8');

const target = `            setupOnMessageListener((payload) => {
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
      });`;

const replacement = `            setupOnMessageListener((payload) => {
        console.log('Mensaje FCM recibido en primer plano:', payload);
        // Show in-app toast
        setToastMessage({
          title: payload.notification?.title || "Notificación",
          body: payload.notification?.body || "Tienes un nuevo mensaje"
        });
        setTimeout(() => setToastMessage(null), 5000);
        
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
      });`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
}

// Add state for Toast
if (!code.includes('toastMessage')) {
  code = code.replace(/const \[loading, setLoading\] = useState\(true\);/, "const [loading, setLoading] = useState(true);\n  const [toastMessage, setToastMessage] = useState(null);");
}

// Add CSS animation
if (!code.includes('slideIn')) {
  code = code.replace(/function App\(\) \{/, `
const styleSheet = document.createElement("style");
styleSheet.innerText = \`
  @keyframes slideIn {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
\`;
document.head.appendChild(styleSheet);

function App() {`);
}

// Inject Toast UI
const toastHtml = `
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
`;

if (!code.includes('Toast Notification')) {
  code = code.replace(/<KanbanBoard session=\{session\} \/>/, `<KanbanBoard session={session} />${toastHtml}`);
}

fs.writeFileSync('src/App.jsx', code);
console.log("Toast added successfully");
