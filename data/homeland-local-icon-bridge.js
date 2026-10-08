// Optional local PNG library. Original extracted image files are deployed separately.
// If the library is absent the existing verified sprite atlas remains fully functional.
(function(){
 'use strict';
 const slug=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
 const api={ready:false,file(category,value){return this.manifest?.assets?.[category]?.[String(value??'')]||this.manifest?.names?.[category]?.[slug(value)]||'';},
   facility(name,level){const ending='_'+slug(name)+'_level_'+Math.max(1,Number(level)||1)+'.png';return Object.values(this.manifest?.assets?.Items||{}).find(path=>path.endsWith(ending))||'';},
   picture(category,value,size=26){const path=this.file(category,value);return this.image(path,size);},
   image(path,size=26){if(!path)return '';const n=Math.max(12,Math.min(64,Number(size)||26));return '<img class="homelandLocalIcon" src="'+path+'" alt="" loading="lazy" decoding="async" onerror="this.remove()" style="display:inline-block;width:100%;max-width:'+n+'px;aspect-ratio:1;object-fit:contain;vertical-align:middle">';}
 };
 window.HomelandLocalIcons=api;
 // JSON only becomes available after the supplied PNG package has been deployed.
 fetch('data/homeland-local-icons.json?v=1').then(r=>{if(!r.ok)throw Error('optional local icon manifest unavailable');return r.json();})
  .then(m=>{api.manifest=m;api.ready=true;if(typeof renderV30Views==='function')renderV30Views();})
  .catch(()=>{}); 
})();