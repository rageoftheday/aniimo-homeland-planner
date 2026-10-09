// Homebuilder only: prefer user-supplied original 190x190 Game8 portrait PNGs.
// The PNG package is installed separately; missing images preserve existing artwork.
(function(){
 'use strict';
 const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clean=s=>String(s??'').trim().replace(/\s+/g,' ');
 const formPart=s=>clean(s).replace(/\s+form$/i,'').replace(/^base(?:\s+form)?$/i,'').replace(/^normal$/i,'');
 const slug=s=>clean(s).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
 let manifest=null;
 const missing=()=>window.HomebuilderMissingPortraits=window.HomebuilderMissingPortraits||new Set();
 // Rendering the map may happen before the manifest loads. Refresh the full map
 // after its verified ID mappings become available, even if the active tab changed.
 fetch('data/homebuilder-aniimo-portraits.json?v=6').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(m=>{manifest=m;if(typeof render==='function')render();else window.HomebuilderPortraits?.hydrate(document);}).catch(e=>{missing().add('Portrait manifest could not load: '+e.message)});
 function candidates(worker){
  const species=clean(worker?.name),form=formPart(worker?.form),appearance=formPart(worker?.appearance);
  const rawId=worker?.formId??worker?.form_id??worker?.variantId??worker?.variant??worker?.form;
  const formId=/^\d{6,8}$/.test(String(rawId??''))?String(rawId):'';
  if(!species&&!formId)return [];
  // Authoritative reference ID from the imported Aniimo record wins over names.
  if(manifest&&formId&&manifest.byFormId){
   if(manifest.byFormId[formId])return [manifest.byFormId[formId]];
   if(!manifest.intentionallyExcludedFormIds?.[formId]){
    missing().add((species||'Unknown Aniimo')+' — form #'+formId+' — expected '+formId+'_*.png');
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
  // No speculative image URLs before the authoritative ID/name manifest arrives.
  const found=manifest?unique.map(key=>manifest.assets?.[key]).filter(Boolean):[];
  if(manifest&&!found.length){
   missing().add((species+' — '+(form||appearance||'Base')).trim());
  }
  return found;
 }
 function html(worker,fallback){
  const paths=candidates(worker);
  const species=clean(worker?.name)||'Unknown Aniimo';
  const form=clean(worker?.form)||clean(worker?.appearance)||'Base';
  const formId=String(worker?.formId??worker?.form_id??'');
  const details=escapeHTML(species+' — '+form+(formId?' (#'+formId+')':''));
  if(!paths.length)return '<span class="homebuilderPortraitSwap homebuilderPortraitMissing" title="Missing Aniimo portrait: '+details+'"><img class="homebuilderPortraitImage" src="assets/homebuilder-aniimo-portraits/unassigned-aniimo.svg" alt="Missing Aniimo portrait" /></span>';
  // The verified file is loaded directly, not via a delayed image-hydration pass.
  // The universal placeholder is visible only until the exact PNG loads.
  const src=escapeHTML(paths[0]);
  return '<span class="homebuilderPortraitSwap" data-portrait-source="'+src+'" data-portrait-worker="'+details+'">'+
   '<span class="homebuilderPortraitFallback" aria-hidden="true"><img src="assets/homebuilder-aniimo-portraits/unassigned-aniimo.svg" alt="" /></span>'+
   '<img class="homebuilderPortraitImage" src="'+src+'" alt="'+details+'" loading="eager" decoding="async" style="display:none" />'+
   '</span>';
 }
 function hydrate(root=document){
  for(const node of root.querySelectorAll('.homebuilderPortraitSwap[data-portrait-source]:not([data-portrait-loaded])')){
   node.dataset.portraitLoaded='1';
   const img=node.querySelector('.homebuilderPortraitImage');
   if(!img)continue;
   const loaded=()=>{
    img.style.display='block';
    const old=node.querySelector('.homebuilderPortraitFallback');
    if(old)old.style.display='none';
    node.dataset.portraitReady='1';
   };
   const failed=()=>{
    node.dataset.portraitMissing='1';
    missing().add((node.dataset.portraitWorker||'Unknown Aniimo')+' — image failed: '+node.dataset.portraitSource);
    img.remove();
   };
   img.onload=loaded;
   img.onerror=failed;
   // Covers cached images whose load/error fired before the badge was hydrated.
   if(img.complete){if(img.naturalWidth>0)loaded();else failed()}
  }
 }
 window.HomebuilderPortraits={html,candidates,hydrate};
})();