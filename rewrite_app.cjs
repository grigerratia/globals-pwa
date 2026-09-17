const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf-8');

code = code.replace(/import\s+\{\s*requestFirebaseToken,\s*onMessageListener\s*\}\s*from\s*['"]\.\/firebase['"];/, 
  "import { requestFirebaseToken, setupOnMessageListener } from './firebase';");

code = code.replace(/onMessageListener\(\)\.then\(\(payload\)\s*=>\s*\{[\s\S]*?\}\)\.catch\(err\s*=>\s*console\.log\(['"]Error FCM foreground:\s*['"],\s*err\)\);/m, 
`      setupOnMessageListener((payload) => {
        console.log('Mensaje FCM recibido en primer plano:', payload);
        // Aquí puedes mostrar un Toast o usar un estado global si lo deseas.
        // Como solución rápida para mostrar la notificación visual en primer plano:
        if (Notification.permission === 'granted') {
           new Notification(payload.notification?.title || "Notificación", {
              body: payload.notification?.body,
              icon: '/vite.svg'
           });
        }
      });`);

fs.writeFileSync('src/App.jsx', code);
