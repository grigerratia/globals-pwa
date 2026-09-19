const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf-8');

const target = `if (Notification.permission === 'granted') {
           new Notification(payload.notification?.title || "Notificación", {
              body: payload.notification?.body,
              icon: '/vite.svg'
           });
        }`;

const replacement = `if (Notification.permission === 'granted') {
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
        }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.jsx', code);
  console.log("Fixed new Notification() bug in App.jsx");
} else {
  console.log("Target block not found");
}
