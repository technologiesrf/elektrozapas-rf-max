/* Электрозапас РФ — 20261127-showroom-r1. Immutable media paths, network-first HTML. */
const CACHE="elektrozapas-rf-max-lite-20261127-showroom-r1";
const BASE=new URL("./",self.registration.scope);
const SHELL=["./","./index.html","./design-preview-v4/index.html","./orders.js?v=76"];
self.addEventListener("install",event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(SHELL.map(p=>new Request(new URL(p,BASE),{cache:"reload"})));await self.skipWaiting();})());});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith("elektrozapas-rf-max-lite-")&&key!==CACHE)await caches.delete(key);}await self.clients.claim();})());});
self.addEventListener("fetch",event=>{
 const req=event.request;if(req.method!=="GET")return;const u=new URL(req.url);if(u.origin!==BASE.origin||!u.pathname.startsWith(BASE.pathname))return;
 const shell=req.mode==="navigate"||/\.(?:html|js|css)$/.test(u.pathname);
 const image=/\.(?:webp|png|jpg|jpeg|svg)$/.test(u.pathname)&&u.pathname.includes("/assets/");
 if(!shell&&!image)return;
 const immutable=image&&u.pathname.includes("/assets/showroom-20261127/");
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(immutable){const hit=await cache.match(req);if(hit)return hit;}
  try{const fresh=await fetch(req,{cache:immutable?"default":"no-store"});if(fresh.ok)await cache.put(req,fresh.clone());return fresh;}
  catch(err){
   const hit=await cache.match(req);if(hit)return hit;
   if(req.mode==="navigate"){const clean=new URL(req.url);clean.search="";clean.hash="";const exact=await cache.match(clean.href);if(exact)return exact;if(clean.pathname===BASE.pathname||clean.pathname===new URL("index.html",BASE).pathname)return (await cache.match(new URL("index.html",BASE).href))||Response.error();}
   return Response.error();
  }
 })());
});