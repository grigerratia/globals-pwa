importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDdJr7LGpQv5YUNdkdFLxQVKcNQVcPtolk",
  authDomain: "globals-pwa.firebaseapp.com",
  projectId: "globals-pwa",
  storageBucket: "globals-pwa.firebasestorage.app",
  messagingSenderId: "31104945132",
  appId: "1:31104945132:web:afba85726fc8e853f4cec9"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Si el payload trae "notification", Firebase ya muestra la notificacion automaticamente.
  // Solo mostramos una manual si fuera un data-message sin la propiedad "notification".
  if (!payload.notification) {
    const notificationTitle = payload.data?.title || 'Global\\'s PWA';
    const notificationOptions = {
      body: payload.data?.body || 'Nueva notificación',
      icon: 'https://globals-pwa.vercel.app/vite.svg',
      badge: 'https://globals-pwa.vercel.app/vite.svg',
      data: payload.data
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Intentar enfocar una pestaña abierta de la app
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
