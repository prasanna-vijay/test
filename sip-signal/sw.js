const C='sip-signal-v2',F=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(_){}e.waitUntil(self.registration.showNotification(d.title||'Sip Signal 💧',{body:d.body||'Time to drink water!',icon:'icon-192.png'}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.openWindow('./'))});
