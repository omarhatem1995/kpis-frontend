importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA2FcFMUdasVtK5bl-Z1xtdiS28TaNIp20',
  authDomain: 'cic-kpis.firebaseapp.com',
  projectId: 'cic-kpis',
  storageBucket: 'cic-kpis.firebasestorage.app',
  messagingSenderId: '596669272965',
  appId: '1:596669272965:web:72c66b135aac0f1db0aaec'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, { body, icon: '/icons/icon-192x192.png' });
});
