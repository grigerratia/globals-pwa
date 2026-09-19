const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf-8');

const target = `setToastMessage({
          title: payload.notification?.title || "Notificación",
          body: payload.notification?.body || "Tienes un nuevo mensaje"
        });`;

const replacement = `setToastMessage({
          title: payload.notification?.title || payload.data?.title || "Notificación",
          body: payload.notification?.body || payload.data?.body || "Tienes un nuevo mensaje"
        });`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.jsx', code);
  console.log("Fixed Toast to read payload.data");
}

const target2 = `registration.showNotification(payload.notification?.title || "Notificación", {
                 body: payload.notification?.body,
                 icon: '/vite.svg'
               });`;

const replacement2 = `registration.showNotification(payload.notification?.title || payload.data?.title || "Notificación", {
                 body: payload.notification?.body || payload.data?.body,
                 icon: '/vite.svg'
               });`;
               
if (code.includes(target2)) {
  code = code.replace(target2, replacement2);
  fs.writeFileSync('src/App.jsx', code);
  console.log("Fixed ServiceWorker showNotification to read payload.data");
}

const target3 = `new Notification(payload.notification?.title || "Notificación", {
                body: payload.notification?.body,
                icon: '/vite.svg'
             });`;

const replacement3 = `new Notification(payload.notification?.title || payload.data?.title || "Notificación", {
                body: payload.notification?.body || payload.data?.body,
                icon: '/vite.svg'
             });`;
             
if (code.includes(target3)) {
  code = code.replace(target3, replacement3);
  fs.writeFileSync('src/App.jsx', code);
  console.log("Fixed Notification API to read payload.data");
}

