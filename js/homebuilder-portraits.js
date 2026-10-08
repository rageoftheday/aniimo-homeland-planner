// Homebuilder only: prefer user-supplied original 190x190 Game8 portrait PNGs.
// The PNG package is installed separately; missing images preserve existing artwork.
(function(){
 'use strict';
 const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clean=s=>String(s??'').trim().replace(/\s+/g,' ');
 const formPart=s=>clean(s).replace(/\s+form$/i,'').replace(/^base(?:\s+form)?$/i,'').replace(/^normal$/i,'');
 const slug=s=>clean(s).normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
 const path=name=>'assets/homebuilder-aniimo-portraits/'+slug(name)+'.png';
 let manifest=null;
 fetch('data/homebuilder-aniimo-portraits.json?v=1').then(r=>r.ok?r.json():null).then(m=>{manifest=m;window.HomebuilderPortraits?.hydrate(document);}).catch(()=>{});
 function candidates(worker){
  const species=clean(worker?.name),form=formPart(worker?.form),appearance=formPart(worker?.appearance);
  if(!species)return [];
  const names=[];
  for(const v of [form,appearance]){
   if(!v)continue;
   if(v.toLowerCase().includes(species.toLowerCase()))names.push(v);
   else names.push(v+' '+species);
  }
  names.push(species);
  return [...new Set(names)].map(n=>manifest?.assets?.[slug(n)]||path(n));
 }
 function html(worker,fallback){
  const paths=candidates(worker);
  if(!paths.length)return fallback||'';
  // Preserve the old graphic underneath until the higher-quality portrait loads.
  const payload=escapeHTML(JSON.stringify(paths));
  return '<span class="homebuilderPortraitSwap" data-portrait-candidates="'+payload+'">'+
   '<span class="homebuilderPortraitFallback">'+(fallback||'')+'</span>'+
   '<img class="homebuilderPortraitImage" alt="" loading="lazy" decoding="async" style="display:none" />'+
   '</span>';
 }
 function hydrate(root=document){
  for(const node of root.querySelectorAll('.homebuilderPortraitSwap:not([data-portrait-loaded])')){
   node.dataset.portraitLoaded='1';
   let paths;try{paths=JSON.parse(node.dataset.portraitCandidates)}catch(_){continue}
   const img=node.querySelector('.homebuilderPortraitImage');
   let index=0;
   const next=()=>{if(index<paths.length)img.src=paths[index++];else img.remove()};
   img.onload=()=>{img.style.display='block';const old=node.querySelector('.homebuilderPortraitFallback');if(old)old.style.visibility='hidden'};
   img.onerror=next;
   next();
  }
 }
 window.HomebuilderPortraits={html,candidates,hydrate};
})();