// Homebuilder only: prefer user-supplied original 190x190 Game8 portrait PNGs.
// The PNG package is installed separately; missing images preserve existing artwork.
(function(){
 'use strict';
 const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clean=s=>String(s??'').trim().replace(/\s+/g,' ');
 const formPart=s=>clean(s).replace(/\s+form$/i,'').replace(/^base(?:\s+form)?$/i,'').replace(/^normal$/i,'');
 const slug=s=>clean(s).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
 const path=name=>'assets/homebuilder-aniimo-portraits/'+slug(name)+'.png';
 let manifest=null;
 fetch('data/homebuilder-aniimo-portraits.json?v=3').then(r=>r.ok?r.json():null).then(m=>{manifest=m;window.HomebuilderPortraits?.hydrate(document);}).catch(()=>{});
 function candidates(worker){
  const species=clean(worker?.name),form=formPart(worker?.form),appearance=formPart(worker?.appearance);
  const formId=String(worker?.formId||worker?.form_id||worker?.variantId||worker?.variant||'').trim();
  if(!species)return [];
  // Authoritative reference ID from the imported Aniimo record wins over names.
  if(manifest&&formId&&manifest.byFormId){
   if(manifest.byFormId[formId])return [manifest.byFormId[formId]];
   if(!manifest.intentionallyExcludedFormIds?.[formId]){
    window.HomebuilderMissingPortraits=window.HomebuilderMissingPortraits||new Set();
    window.HomebuilderMissingPortraits.add(species+' — form #'+formId);
   }
   return [];
  }
  const names=[];
  for(const variant of [form,appearance]){
   if(!variant)continue;
   const canonical=(species.toLowerCase()==='thornblade'&&variant.toLowerCase()==='rainstorm')?'Thunderstorm':variant;
   names.push(canonical.toLowerCase().includes(species.toLowerCase())?canonical:canonical+' '+species);
  }
  if(!form&&!appearance)names.push(species);
  const unique=[...new Set(names.map(slug))];
  const found=unique.map(key=>manifest?.assets?.[key]||(!manifest?path(key):null)).filter(Boolean);
  if(manifest&&!found.length){
   window.HomebuilderMissingPortraits=window.HomebuilderMissingPortraits||new Set();
   window.HomebuilderMissingPortraits.add((species+' — '+(form||appearance||'Base')).trim());
  }
  return found;
 }
 function html(worker,fallback){
  const paths=candidates(worker);
  if(!paths.length)return '<span class="homebuilderPortraitSwap homebuilderPortraitMissing" title="Missing Aniimo portrait"><img class="homebuilderPortraitImage" src="assets/homebuilder-aniimo-portraits/unassigned-aniimo.svg" alt="Missing Aniimo portrait" /></span>';
  // New circular artwork is authoritative; never display the old atlas as a substitute.
  const payload=escapeHTML(JSON.stringify(paths));
  return '<span class="homebuilderPortraitSwap" data-portrait-candidates="'+payload+'">'+
   '<span class="homebuilderPortraitFallback" aria-hidden="true"><img src="assets/homebuilder-aniimo-portraits/unassigned-aniimo.svg" alt="" /></span>'+
   '<img class="homebuilderPortraitImage" alt="" loading="lazy" decoding="async" style="display:none" />'+
   '</span>';
 }
 function hydrate(root=document){
  for(const node of root.querySelectorAll('.homebuilderPortraitSwap:not([data-portrait-loaded])')){
   node.dataset.portraitLoaded='1';
   let paths;try{paths=JSON.parse(node.dataset.portraitCandidates)}catch(_){continue}
   const img=node.querySelector('.homebuilderPortraitImage');
   let index=0;
   const next=()=>{if(index<paths.length)img.src=paths[index++];else {img.remove();node.dataset.portraitMissing='1'}};
   img.onload=()=>{img.style.display='block';const old=node.querySelector('.homebuilderPortraitFallback');if(old)old.style.visibility='hidden'};
   img.onerror=next;
   next();
  }
 }
 window.HomebuilderPortraits={html,candidates,hydrate};
})();