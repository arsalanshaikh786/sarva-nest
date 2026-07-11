// firebase-messaging-sw.js
// IMPORTANT: This file must live at the ROOT of your domain, e.g.
//   https://yourdomain.com/firebase-messaging-sw.js
// NOT inside a subfolder — otherwise the browser can't register it for push scope "/".

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBcXm5QQaYCCddVXNgGqTBAszdKEK-0PJQ",
  authDomain: "multi-service-app-77dd8.firebaseapp.com",
  projectId: "multi-service-app-77dd8",
  storageBucket: "multi-service-app-77dd8.appspot.com",
  messagingSenderId: "123732555482",
  appId: "1:123732555482:web:ea47c825e0dbb504f597e3"
});

const messaging = firebase.messaging();

// Fired when a push arrives while the app/tab is NOT open/focused.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'AutoSaathi';
  const options = {
    body: payload.notification?.body || 'Naya update aaya hai',
    icon: '/icon-192.png',   // replace with your actual icon path if you have one
    badge: '/icon-192.png',
    data: payload.data || {},
    vibrate: [200, 100, 200]
  };
  self.registration.showNotification(title, options);
});

// Tapping the notification opens/focuses the driver app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
