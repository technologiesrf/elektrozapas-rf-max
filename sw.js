/* Электрозапас РФ. Кэш первой посещённой версии для слабой связи.
 * НЕ кэширует запросы к API или пользовательские данные. */
const CACHE='elektrozapas-rf-max-lite-v7-2';
const SHELL=['./','./index.html','./styles.css','./app.js'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('elektrozapas-rf-max-lite-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const path=url.pathname;
  const isShell=request.mode==='navigate'||/\/(index\.html|styles\.css|app\.js)$/.test(path);
  const isImage=/\/assets\/[a-zA-Z0-9_.-]+\.webp$/.test(path);
  if(!isShell&&!isImage)return;
  if(isShell){
    event.respondWith(fetch(request).then(response=>{
      if(response.ok){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(request,clone));}
      return response;
    }).catch(()=>caches.match(request,{ignoreSearch:true}).then(resp=>resp||(request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
  }else{
    event.respondWith(caches.match(request).then(resp=>resp||fetch(request).then(response=>{
      if(response.ok&&response.type==='basic'){
        const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(request,clone));
      }
      return response;
    })));
  }
});
