const CACHE='macroscale-v2';
const CORE=[
  './','./index.html','./manifest.json','./icon-192.png','./icon-512.png',
  'https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-500-normal.woff2',
  'https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-700-normal.woff2'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(CORE.map(u=>c.add(u)))));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  const isPage=e.request.mode==='navigate'||(u.origin===location.origin&&u.pathname.endsWith('index.html'));
  if(isPage){
    // Network-first for the app itself: always up to date when online, cached copy when offline
    e.respondWith(
      fetch(e.request).then(res=>{
        const clone=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',clone));
        return res;
      }).catch(()=>caches.match('./index.html'))
    );
    return;
  }
  // Cache-first for everything else (icons, fonts, the OCR library)
  const cacheable=u.origin===location.origin||u.hostname.endsWith('jsdelivr.net');
  e.respondWith(
    caches.match(e.request,{ignoreSearch:u.origin===location.origin}).then(hit=>{
      if(hit)return hit;
      return fetch(e.request).then(res=>{
        if(res.ok&&cacheable){const clone=res.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));}
        return res;
      }).catch(()=>Response.error());
    })
  );
});
