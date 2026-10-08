let aniimosBrowseQuery='';
let aniimosImageFit=localStorage.getItem('aniimosImageFit')||'contain';
let aniimosImageSize=localStorage.getItem('aniimosImageSize')||'medium';
let aniimosViewMode=localStorage.getItem('aniimosViewMode')||'collection';
if(aniimosViewMode==='browse')aniimosViewMode='collection';
let aniimosSelectedName=localStorage.getItem('aniimosSelectedName')||'';
let aniimosCollectionFilter=localStorage.getItem('aniimosCollectionFilter')||'all';
let aniimosRankAbility=localStorage.getItem('aniimosRankAbility')||'Hauling';
let aniimosRankMin=Number(localStorage.getItem('aniimosRankMin')||1);
let aniimosRankScope=localStorage.getItem('aniimosRankScope')||'all';
// v30 tab shell and full-screen views
let activeMainTab='dashboard';
let rawJsonQuery='';
let homelandPieceQuery='';
let homelandPlannerMode=localStorage.getItem('homelandPlannerMode')||'overview';
if(!['overview','plot','full'].includes(homelandPlannerMode))homelandPlannerMode='overview';
let homelandFocusedPlot=Number(localStorage.getItem('homelandFocusedPlot')||1);
let homelandFullZoom=Math.max(25,Math.min(400,Number(localStorage.getItem('homelandFullZoom')||100)));
function homelandAddVisiblePiece(item){
 const scroller=document.querySelector('#homelandPlannerV2 .hpv2FullScroll');
 const grid=scroller?.querySelector('.hpv2FullGrid'),d=effectiveDims(item);
 if(!grid||!d.w||!d.h){addObject(item);return}
 const cell=grid.getBoundingClientRect().width/80;
 const x0=Math.max(0,Math.floor(scroller.scrollLeft/cell)),y0=Math.max(0,Math.floor(scroller.scrollTop/cell));
 const x1=Math.min(80-d.w,Math.floor((scroller.scrollLeft+scroller.clientWidth)/cell-d.w));
 const y1=Math.min(60-d.h,Math.floor((scroller.scrollTop+scroller.clientHeight)/cell-d.h));
 const cx=(x0+x1)/2,cy=(y0+y1)/2,spots=[];
 for(let y=y0;y<=y1;y+=.5)for(let x=x0;x<=x1;x+=.5){
  if(!collide({id:-1,x,y,w:d.w,h:d.h}))spots.push({x,y,dist:(x-cx)**2+(y-cy)**2});
 }
 spots.sort((a,b)=>a.dist-b.dist);
 if(spots.length)addObject(item,spots[0].x,spots[0].y);
 else alert('No available space for '+item.name+' in the visible map area. Pan or zoom out.');
}
// Magnetically align dropped edges to nearby facilities, without allowing overlaps.
// Move selected piece exactly half a grid cell per arrow press.
function homelandNudgeSelected(key){
 if(!['full','plot'].includes(homelandPlannerMode))return false;
 const o=objects.find(x=>x.id===Number(selected));if(!o)return false;
 const delta={ArrowLeft:[-.5,0],ArrowRight:[.5,0],ArrowUp:[0,-.5],ArrowDown:[0,.5]}[key];if(!delta)return false;
 const nx=Math.round((o.x+delta[0])*2)/2,ny=Math.round((o.y+delta[1])*2)/2;
 const proposed={...o,x:nx,y:ny};
 if(nx<0||ny<0||nx+o.w>80||ny+o.h>60||collide(proposed)||!validArea(proposed))return true;
 if(homelandPlannerMode==='plot'){
  const plot=homelandPlotDef(homelandFocusedPlot);
  if(!plot||nx<plot.x||ny<plot.y||nx+o.w>plot.x+20||ny+o.h>plot.y+15)return true;
 }
 o.x=nx;o.y=ny;render();
 // Preserve keyboard focus on the selected object after render replaces the map DOM.
 document.querySelector('#homelandPlannerV2 [data-hpv2-object="'+o.id+'"]')?.focus({preventScroll:true});
 return true;
}
document.addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||e.altKey||e.ctrlKey||e.metaKey)return;
 const tag=e.target?.tagName||'';
 if(e.target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(tag)||e.target?.closest?.('[role="dialog"]'))return;
 if(!document.getElementById('mapPane')?.closest('.tabPane.active'))return;
 if(homelandNudgeSelected(e.key))e.preventDefault();
});
function homelandSnapAdjacent(candidate){
 const clamp=(n,max)=>Math.max(0,Math.min(max,n));
 const valid=(x,y)=>{const t={...candidate,x,y};return !collide(t)&&validArea(t)};
 const near=objects.filter(o=>o.id!==candidate.id);
 const possibilities=[{x:candidate.x,y:candidate.y,dist:Infinity}];
 for(const o of near){
  for(const nx of [o.x+o.w,o.x-candidate.w]){
   if(Math.abs(nx-candidate.x)>.76)continue;
   if(candidate.y>=o.y+o.h||candidate.y+candidate.h<=o.y)continue;
   const x=clamp(nx,80-candidate.w),y=candidate.y;
   if(valid(x,y))possibilities.push({x,y,dist:Math.abs(nx-candidate.x)});
  }
  for(const ny of [o.y+o.h,o.y-candidate.h]){
   if(Math.abs(ny-candidate.y)>.76)continue;
   if(candidate.x>=o.x+o.w||candidate.x+candidate.w<=o.x)continue;
   const x=candidate.x,y=clamp(ny,60-candidate.h);
   if(valid(x,y))possibilities.push({x,y,dist:Math.abs(ny-candidate.y)});
  }
 }
 const best=possibilities.filter(p=>p.dist<Infinity).sort((a,b)=>a.dist-b.dist)[0];
 return best?{...candidate,x:best.x,y:best.y}:candidate;
}
function homelandFitFullZoom(){
 const scroller=document.querySelector('#homelandPlannerV2 .hpv2FullScroll');if(!scroller)return;
 homelandSetFullZoom(Math.max(25,Math.min(400,Math.floor((scroller.clientWidth-20)/960*100/5)*5)));
 scroller.scrollLeft=0;scroller.scrollTop=0;
}
function homelandSetFullZoom(value){
 const n=Math.max(25,Math.min(400,Math.round(Number(value)||100)));homelandFullZoom=n;localStorage.setItem('homelandFullZoom',String(n));
 const grid=document.querySelector('#homelandPlannerV2 .hpv2FullGrid');if(grid){const scroller=grid.closest('.hpv2FullScroll'),oldWidth=grid.getBoundingClientRect().width,oldHeight=grid.getBoundingClientRect().height;
 const cx=scroller.scrollLeft+scroller.clientWidth/2,cy=scroller.scrollTop+scroller.clientHeight/2;
 grid.style.width=(960*n/100)+'px';
 const nx=grid.getBoundingClientRect().width/Math.max(1,oldWidth),ny=grid.getBoundingClientRect().height/Math.max(1,oldHeight);
 scroller.scrollLeft=cx*nx-scroller.clientWidth/2;scroller.scrollTop=cy*ny-scroller.clientHeight/2;
 }
 const v=document.getElementById('zoomSlider');if(v)v.value=String(Math.min(400,n));
 const label=document.getElementById('zoomLabel');if(label)label.textContent=n+'%';
}
const HOMELAND_PLOT_UNLOCKS={
 1:{rv:1,cost:0},2:{rv:2,cost:2000},3:{rv:3,cost:4000},4:{rv:4,cost:6000},
 5:{rv:5,cost:14000},6:{rv:6,cost:19000},7:{rv:7,cost:38000},8:{rv:8,cost:46000},
 9:{rv:9,cost:72000},10:{rv:10,cost:80000},11:{rv:11,cost:110000},12:{rv:12,cost:170000},
 13:{rv:13,cost:200000},14:{rv:14,cost:240000},15:{rv:15,cost:270000},16:{rv:16,cost:390000}
};
function homelandPlotDef(n){return plotDefs.find(p=>p.n===Number(n))}
function homelandPlotObjects(n){
 const p=homelandPlotDef(n);if(!p)return[];
 return objects.filter(o=>{const cx=o.x+o.w/2,cy=o.y+o.h/2;return cx>=p.x&&cx<p.x+20&&cy>=p.y&&cy<p.y+15});
}
function homelandObjectTitle(o){return o.cropName||o.recipeName||o.label||o.name}
const HOMELAND_CROP_ICONS={
 'wheat':'🌾','sugarcane':'🎋','potato':'🥔','rice':'🌾','cotton':'☁️','strawberry':'🍓','lavender':'🪻',
 'soybean':'🫘','grapes':'🍇','grape':'🍇','cocoa':'🍫','agave':'🌵','rose':'🌹','cranberry':'🔴','ginseng':'🌿',
 'bamboo':'🎋','willow wood':'🌳','natural rubber':'🌳','maple syrup':'🍁','palm bark':'🌴','apple':'🍎',
 'cherry blossom':'🌸','orange flower':'🌼','lemon':'🍋','coconut':'🥥','walnut':'🌰','chestnut':'🌰',
 'moondew radish':'🥕','waxing moon pepper':'🌶️','captain spud':'🥔','sweet potato':'🍠'
};
const HOMELAND_FACILITY_ICONS={
 'farmland':'🌱','woodland':'🌳','mine':'🪨','well':'💧','storage unit':'📦','hatchinator':'🥚',
 'nimbus bed':'🛏️','dewy house':'🏠','starfall hammock':'🛏️','tidewhisper sandcastle':'🏖️','floral windmill':'🌬️',
 'heat furnace':'🔥','cooling unit':'❄️','sunlamp':'☀️','crackle generator':'⚡','crackle power pole':'⚡',
 'carousel mill':'⚙️','crafting table':'🛠️','jukebox dryer':'🎵','claw game cooker':'🍳','joy wheel loom':'🧵',
 'phonolfactory table':'🧪','bouncy brew keg':'🛢️','simmering pot':'🍲','blazing stove':'🔥','woodworking bench':'🪚',
 'chimney kiln':'🏺','pickling jar':'🫙','aniipod maker':'⚙️','dance pad polisher':'💎'
};
// Seed/formula aliases resolve to the harvested visual shown on placed growables.
const HOMELAND_PLANT_NAME_ALIASES={
 'wheat seed':'wheat','sugarcane seed':'sugarcane','potato seed':'potato','rice seed':'rice','cotton seed':'cotton',
 'strawberry seed':'strawberry','lavender seed':'lavender','soybean seed':'soybean','grape seed':'grapes','cocoa seed':'cocoa',
 'agave seed':'agave','rose seed':'rose','cranberry seed':'cranberry','ginseng seed':'ginseng','emerald bamboo seed':'bamboo',
 'willow seed':'willow wood','rubber tree seed':'natural rubber','maple tree seed':'maple syrup','palm tree seed':'palm bark',
 'apple tree seed':'apple','cherry tree seed':'cherry blossom','bitter orange tree seed':'orange flower','lemon tree seed':'lemon',
 'coconut tree seed':'coconut','walnut tree seed':'walnut','chestnut tree seed':'chestnut',
 'moondew radish seeds':'moondew radish','waxing moon pepper seeds':'waxing moon pepper','sweet potato seeds':'sweet potato',
 'willow':'willow wood','emerald bamboo':'bamboo','rubber tree':'natural rubber','maple':'maple syrup','palm':'palm bark',
 'cherry':'cherry blossom','bitter orange':'orange flower'
};
function homelandVisualIconForName(name){
 let key=String(name||'').trim().toLowerCase();
 key=HOMELAND_PLANT_NAME_ALIASES[key]||key;
 key=key.replace(/\s*\(quick\)$/,'');
 key=HOMELAND_PLANT_NAME_ALIASES[key]||key;
 return HOMELAND_CROP_ICONS[key]||HOMELAND_FACILITY_ICONS[key]||'◈';
}
// Resolve artwork by the game's stable item ID. External material images are
// progressive enhancement: failed/missing URLs leave the readable emoji intact.
function homelandItemArtworkId(name){
 const normalized=String(name||'').trim().toLowerCase().replace(/\\s*\\(quick\\)$/,'');
 const key=HOMELAND_PLANT_NAME_ALIASES[normalized]||normalized;
 const manifest=window.ANIIMO_ASSET_MANIFEST?.items||{};
 const ref=window.HOMELAND_REFERENCE_DATA?.items||{};
 const explicit={'cherry blossom':'4001034','orange flower':'4001035','natural rubber':'4001022','bamboo':'4001017'};
 const id=Object.keys(ref).find(id=>String(ref[id]?.name||'').toLowerCase()===key)
   ||Object.keys(manifest).find(id=>String(manifest[id]?.name||'').toLowerCase()===key)
   ||explicit[key];
 return id&&/^\\d+$/.test(id)?id:null;
}
function homelandIllustratedIconHTML(name,cssClass='hpv2IconGlyph',fallbackIcon=null){
 const mapped=window.AniimoIconAtlas?.html(name,40) || window.AniimoIconAtlas?.html(homelandItemArtworkId(name),40);
 if(mapped)return '<span class="'+cssClass+' hpv2ArtHolder">'+mapped+'</span>';
 const fallback=esc(fallbackIcon||homelandVisualIconForName(name)),id=homelandItemArtworkId(name);
 const fac=window.AniimoAssets?.facility?.(String(name||'').replace(/\\s*\\(level \\d+\\)$/i,''))||null;
 // Material CDN path confirmed for Cotton (4001004), not assumed available for every ID.
 const facilitySlug=String(name||'').trim().toLowerCase().replace(/\\s*\\(level \\d+\\)$/,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const artwork=id?'https://www.hideoutgacha.com/images/aniimo/database/materials/item_'+id+'.webp':
   fac?'https://backup.hideoutgacha.com/images/aniimo/homeland/'+facilitySlug+'.webp':'';
 return '<span class="'+cssClass+' hpv2ArtHolder"><span class="hpv2ArtFallback">'+fallback+'</span>'+
   (artwork?'<img class="hpv2ArtImg" src="'+esc(artwork)+'" alt="" loading="lazy" decoding="async" onerror="this.remove()"/>':'')+'</span>';
}
function homelandPlantedOutputName(cropName){
 const meta=typeof cropProductionMeta!=='undefined'?cropProductionMeta?.[cropName]:null;
 return meta?.item||cropName;
}
function homelandObjectVisualIcon(o){
 if(o?.cropName)return homelandVisualIconForName(homelandPlantedOutputName(o.cropName));
 if(o?.name==='Mine'&&o?.recipeName)return '⛏️';
 if(o?.name==='Well')return '💧';
 return homelandVisualIconForName(o?.name||o?.label||'');
}
function homelandObjectLevel(o){
 const v=Number(o?.facilityLevel||o?.placedLevel||0);
 return Number.isFinite(v)&&v>0?v:null;
}
// Live piece records link product and Aniimo by the same in-game piece number.
function homelandLivePieceFor(o){
 const raw=aniidexImportMeta?.home?.home||aniidexImportMeta?.home||{};
 const queues=Array.isArray(raw.crops)?raw.crops:[];
 if(!queues.length||!o)return null;
 const uid=String(aniidexImportMeta?.profile?.profile?.uid||aniidexImportMeta?.profile?.uid||raw.uid||'');
 let linkedId=o.livePieceId;
 if(uid){try{const stored=JSON.parse(localStorage.getItem('homeland-live-links-v1:'+uid)||'{}');linkedId=stored[o.id+'|'+o.name+'|'+o.x+','+o.y]||linkedId;}catch(e){}}
 if(linkedId){const linked=queues.find(q=>String(q.piece)===String(linkedId)&&String(dashboardFacilityName(q.facility)).toLowerCase()===String(o.name||'').toLowerCase());if(linked)return linked;}
 const name=String(o.name||'').toLowerCase();
 const sameType=objects.filter(x=>String(x.name||'').toLowerCase()===name).sort((a,b)=>Number(a.id)-Number(b.id));
 const available=queues.filter(q=>String(dashboardFacilityName(q.facility)).toLowerCase()===name)
   .sort((a,b)=>Number(a.piece)-Number(b.piece));
 if(!available.length)return null;
 const used=new Set();
 const index=sameType.indexOf(o);
 const sameLevel=available.filter(q=>Number(q.level)===Number(o.facilityLevel||o.placedLevel||0));
 const pool=sameLevel.length>=sameType.filter(x=>Number(x.facilityLevel||x.placedLevel||0)===Number(o.facilityLevel||o.placedLevel||0)).length?sameLevel:available;
 const matchOutput=(q)=>String(window.HomelandItemCatalog?.lookup(q.recipe,aniidexImportMeta?.catalog)?.name||window.AniimoIconAtlas?.find(q.recipe)?.name||'').toLowerCase();
 for(const prev of sameType.slice(0,index)){
   const prevExpected=String(prev.cropName||prev.recipeName||'').toLowerCase().replace(/\s*\(quick\)$/,'');
   const candidate=pool.find(q=>!used.has(q.piece)&&(prevExpected&&matchOutput(q)===prevExpected));
   const taken=candidate||pool.find(q=>!used.has(q.piece));if(taken)used.add(taken.piece);
 }
 const expected=String(o.cropName||o.recipeName||'').toLowerCase().replace(/\s*\(quick\)$/,'');
 return pool.find(q=>!used.has(q.piece)&&expected&&matchOutput(q)===expected)||pool.find(q=>!used.has(q.piece))||null;
}
function homelandLiveWorkersFor(o,q){
 if(!q||['Farmland','Woodland','Mine'].includes(o?.name))return [];
 const raw=aniidexImportMeta?.home?.home||aniidexImportMeta?.home||{};
 return (Array.isArray(raw.aniimo)?raw.aniimo:[]).filter(a=>a.piece!=null&&String(a.piece)===String(q.piece));
}
function homelandLiveWorkerBadges(o,q){
 const live=homelandLiveWorkersFor(o,q);
 return live.map(a=>{
  const formId=String(a.form||'');
  const form=window.ANIIMO_ASSET_MANIFEST?.aniimoForms?.[formId]||{};
  const matching=typeof workers!=='undefined'?workers.find(w=>String(w.id)===String(a.id)):null;
  const label=String(matching?.name||a.name||form.name||'Assigned Aniimo');
  const imageSrc=matching?.localPortrait||window.AniimoAssets?.portraitCandidates?.(label,matching?.form||form.form||'')?.[0]||form.head||'';
  const art=window.AniimoIconAtlas?.character(label,26);
  return '<span class="hpv2WorkerBadge hpv2LiveWorker" role="button" tabindex="0" title="Working here: '+esc(label)+' — click for worker selection">'+(art||(imageSrc?'<img alt="'+esc(label)+'" src="'+esc(imageSrc)+'" loading="lazy" onerror="this.style.display=\'none\'">':'<span>👤</span>'))+'</span>';
 }).join('');
}
function homelandObjectVisualHTML(o,big=false){
 const lv=homelandObjectLevel(o),q=homelandLivePieceFor(o);
 const id=q?.recipe!=null?q.recipe:null;
 const currentName=id!=null?(window.AniimoIconAtlas?.find(id)?.name||window.HomelandItemCatalog?.lookup(id,aniidexImportMeta?.catalog)?.name||''):'';
 const fallbackName=o?.cropName?homelandPlantedOutputName(o.cropName):o?.recipeName||o?.name||o?.label||'';
 const artName=currentName||(q&&q.recipe==null?o?.name:fallbackName);
 const icon=id!=null&&window.AniimoIconAtlas?.html(id,40);
 const planned=o?.recipeName?window.AniimoIconAtlas?.html(o.recipeName,40):'';
 const localFacility=!q?.recipe&&!o?.recipeName&&!o?.cropName?window.HomelandLocalIcons?.image(window.HomelandLocalIcons?.facility(o?.name,lv),40):'';
 const idleFacility=localFacility?'<span class="hpv2ArtHolder" style="position:relative">'+homelandIllustratedIconHTML(o?.name)+'<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">'+localFacility+'</span></span>':'';
 const badges=homelandLiveWorkerBadges(o,q);
 return `<span class="hpv2Visual${big?' big':''}"><span class="hpv2IconCircle" aria-hidden="true">${icon||planned||idleFacility||homelandIllustratedIconHTML(artName)}</span>${lv?`<span class="hpv2LevelText">Lv.${lv}</span>`:''}${badges}</span>`;
}
function homelandPlotRole(n){
 const rows=homelandPlotObjects(n);if(!rows.length)return 'Purchased';
 const farms=rows.filter(o=>o.name==='Farmland').length,woods=rows.filter(o=>o.name==='Woodland').length,mines=rows.filter(o=>o.name==='Mine').length;
 const stations=rows.filter(o=>recipeDB[o.name]?.length).length;
 if(farms>=Math.max(2,rows.length*.45))return 'Fields';
 if(woods>=Math.max(2,rows.length*.4))return 'Groves';
 if(mines>=Math.max(1,rows.length*.35))return 'Mines';
 if(stations>=Math.max(2,rows.length*.4))return 'Workshop';
 return rows.length===1?'Idle':'Mixed';
}
function setHomelandPlannerMode(mode,plot){
 homelandPlannerMode=mode;
 if(plot!=null)homelandFocusedPlot=Number(plot)||1;
 localStorage.setItem('homelandPlannerMode',homelandPlannerMode);
 localStorage.setItem('homelandFocusedPlot',String(homelandFocusedPlot));
 renderHomelandPlannerV2();
}
function homelandAssignedPortraitHTML(o){
 if(['Farmland','Woodland','Mine'].includes(o?.name))return '';
 if(!o?.workerId)return '';
 const w=typeof workers!=='undefined'?workers.find(x=>String(x.id)===String(o.workerId)):null;
 if(!w)return '';
 const images=window.AniimoAssets?.portraitCandidates?.(w.name,w.form,w.appearance,w.sparklingHue)||[];
 const src=w.localPortrait||images[0]||w.portrait||'';
 const label=esc(w.name||'Assigned Aniimo');
 return '<span class="hpv2WorkerBadge" title="Working here: '+label+'">'+(src?'<img src="'+esc(src)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">':'<span>👤</span>')+'</span>';
}
function homelandMiniObject(o,p,big=false){
 const l=big&&p.full?o.x:Math.max(0,o.x-p.x),t=big&&p.full?o.y:Math.max(0,o.y-p.y);
 const title=homelandObjectTitle(o),lv=homelandObjectLevel(o);
 const style=p.full?`left:${l/80*100}%;top:${t/60*100}%;width:${o.w/80*100}%;height:${o.h/60*100}%`:`left:${l/20*100}%;top:${t/15*100}%;width:${Math.min(o.w,20)/20*100}%;height:${Math.min(o.h,15)/15*100}%`;
 const visual=homelandObjectVisualHTML(o,big)+(homelandLiveWorkersFor(o,homelandLivePieceFor(o)).length?'':homelandAssignedPortraitHTML(o));
 if(!big)return `<div class="hpv2Obj preview" aria-hidden="true" title="${esc(title)}${lv?' · Lv.'+lv:''}" style="${style}">${visual}</div>`;
 return `<button type="button" class="hpv2Obj big" data-hpv2-object="${o.id}" aria-pressed="${selected===o.id}" draggable="true" title="${esc(title)}${lv?' · Lv.'+lv:''}" style="${style}">${visual}</button>`;
}
function homelandPlotAddOptions(){
 return catalog.filter(item=>{
   const d=effectiveDims(item);
   return isUnlocked(item)&&d.w>0&&d.h>0;
 }).sort((a,b)=>a.cat.localeCompare(b.cat)||a.name.localeCompare(b.name));
}
function homelandPiecePaletteHTML(items){
 const rv=+rvLevel.value,focused=homelandPlannerMode==='full'?objects:homelandPlotObjects(homelandFocusedPlot);
 return items.map(item=>{
   const d=effectiveDims(item),placed=objects.filter(o=>o.name===item.name).length,focusedPlaced=focused.filter(o=>o.name===item.name).length,limit=maxCount(item,rv);
   const search=normalizeSearch(item.cat+' '+item.name+' '+d.w+'x'+d.h);
   const addDisabled=placed>=limit?' disabled':'',removeDisabled=focusedPlaced<=0?' disabled':'';
   return `<div class="hpv2PieceCard" draggable="true" data-hpv2-piece="${esc(item.name)}" data-piece-search="${esc(search)}"><div class="hpv2PieceIcon">${homelandIllustratedIconHTML(item.name,"hpv2IconGlyph",homelandVisualIconForName(item.name))}</div><div class="hpv2PieceInfo"><b>${esc(item.name)}</b><span>${esc(item.cat)} · ${d.w}×${d.h}</span><small>${placed} placed / ${limit} max · ${focusedPlaced} in this plot</small></div><div class="hpv2PieceActions"><button type="button" data-hpv2-piece-remove="${esc(item.name)}" title="Remove one from this plot"${removeDisabled}>−</button><button type="button" data-hpv2-piece-add="${esc(item.name)}" title="Add to first legal free spot in this plot"${addDisabled}>+</button></div></div>`;
 }).join('');
}
function renderHomelandPlannerV2(){
 const map=el('mapPane');if(!map)return;
 let root=el('homelandPlannerV2');
 if(!root){root=document.createElement('div');root.id='homelandPlannerV2';map.insertBefore(root,map.firstChild)}
 const oldPalette=root.querySelector('.hpv2PieceList');
 const oldPaletteScroll=oldPalette?.scrollTop??0;
 const oldSearch=root.querySelector('#hpv2PieceSearch');
 const searchWasFocused=!!oldSearch&&document.activeElement===oldSearch;
 const searchCaret=searchWasFocused?oldSearch.selectionStart:null;
 if(oldSearch&&oldSearch.value.trim())homelandPieceQuery=oldSearch.value;
 const previousFullScroll=root.querySelector('.hpv2FullScroll');
 const previousFullPosition=previousFullScroll?{left:previousFullScroll.scrollLeft,top:previousFullScroll.scrollTop}:null;
 const toolbar=map.querySelector('.toolbar'),viewport=el('mapViewport'),legend=map.querySelector('.legend');
 if(toolbar)toolbar.hidden=homelandPlannerMode!=='full';if(viewport)viewport.hidden=true;if(legend)legend.hidden=true;
 const mapLib=homelandMapLibrary(),mapEntries=homelandMapLibraryEntries(),mapCurrent=String(mapLib.current||'');
 const mapOptions=mapEntries.map(m=>`<option value="${esc(m.id)}"${String(m.id)===mapCurrent?' selected':''}>${esc(m.name||'Map Layout')}</option>`).join('');
 const noMaps=!mapEntries.length;
 const modeBar=`<div class="hpv2ModeBar"><div><b>Homeland Planner</b><span>Full Map edits across plot borders; All Plots is overview-only. Saved maps are local to this browser and can be loaded with any profile.</span></div><div class="hpv2MapLibrary"><button type="button" onclick="newHomelandMap()">New Map</button><button type="button" onclick="saveHomelandMapLayout()">Save Map</button><button type="button" onclick="exportHomelandMapFile()">Export JSON</button><button type="button" onclick="importHomelandMapFile()">Import JSON</button><select id="hpv2MapSelect" aria-label="Saved map">${noMaps?'<option value="">No saved maps</option>':mapOptions}</select><button type="button" onclick="loadHomelandMapLayout(el('hpv2MapSelect')?.value)"${noMaps?' disabled':''}>Load</button><button type="button" onclick="renameHomelandMapLayout(el('hpv2MapSelect')?.value)"${noMaps?' disabled':''}>Rename</button><button type="button" onclick="deleteHomelandMapLayout(el('hpv2MapSelect')?.value)"${noMaps?' disabled':''}>Delete</button></div><div class="hpv2ModeActions"><button class="${homelandPlannerMode==='overview'?'active':''}" onclick="setHomelandPlannerMode('overview')">All Plots</button><button class="${homelandPlannerMode==='full'?'active':''}" onclick="setHomelandPlannerMode('full')">Full Map Editor</button><button class="${homelandPlannerMode==='plot'?'active':''}" onclick="setHomelandPlannerMode('plot',homelandFocusedPlot)">Plot Editor</button></div></div>`;
 if(homelandPlannerMode==='plot'||homelandPlannerMode==='full'){
   const n=homelandFocusedPlot,p=homelandPlotDef(n)||homelandPlotDef(1),rows=homelandPlotObjects(n),unlock=HOMELAND_PLOT_UNLOCKS[n]||{};
   const addOptions=homelandPlotAddOptions();
   root.innerHTML=modeBar+`<div class="hpv2FocusHead"><button onclick="setHomelandPlannerMode('overview')">← All Plots</button><div><h3>Plot ${n} · ${esc(homelandPlotRole(n))}</h3><span>${rows.length} placed object${rows.length===1?'':'s'} · 20×15 squares</span></div><div class="hpv2FocusMeta">RV ${unlock.rv||'—'} · ${Number(unlock.cost||0).toLocaleString()} HC unlock</div></div><div class="hpv2BuilderShell"><div class="hpv2BuilderMain"><div class="hpv2FocusGrid" data-hpv2-drop-plot="${n}"><div class="hpv2GridLines"></div>${rows.map(o=>homelandMiniObject(o,p,true)).join('')}</div><div class="hpv2FocusFoot"><span>Drag new pieces from the palette onto an exact square. Drag placed pieces to rearrange them inside Plot ${n}.</span></div></div><aside class="hpv2PiecePalette"><div class="hpv2PiecePaletteHead"><div><b>Single Pieces</b><span>${addOptions.length} unlocked / available</span></div><div class="hpv2BuilderTools"><label>Snap <select id="hpv2SnapSelect"><option value="1"${String(HOMELAND_BUILDER_SNAP)==='1'?' selected':''}>1 square</option><option value=".5"${String(HOMELAND_BUILDER_SNAP)==='.5'?' selected':''}>0.5 square</option><option value=".25"${String(HOMELAND_BUILDER_SNAP)==='.25'?' selected':''}>0.25 square</option><option value="free"${String(HOMELAND_BUILDER_SNAP)==='free'?' selected':''}>No snap</option></select></label><input id="hpv2PieceSearch" placeholder="Search pieces…"></div></div><div class="hpv2PieceList">${homelandPiecePaletteHTML(addOptions)||'<div class="small">No additional unlocked pieces are available.</div>'}</div></aside></div>`;
   if(homelandPlannerMode==='full'){
     const fullPlots=plotDefs.map(q=>`<div class="hpv2FullPlotLabel" style="left:${q.x/80*100}%;top:${q.y/60*100}%;width:25%;height:25%">Plot ${q.n}</div>`).join('');
     root.innerHTML=modeBar+`<div class="hpv2FocusHead"><div><h3>Full Map Editor · 80×60</h3><span>All 16 plots together · drag across plot boundaries · ${objects.length} placed objects</span></div></div><div class="hpv2BuilderShell"><div class="hpv2BuilderMain hpv2FullScroll"><div class="hpv2FocusGrid hpv2FullGrid" data-hpv2-drop-full="1" style="width:${960*homelandFullZoom/100}px"><div class="hpv2GridLines"></div>${fullPlots}${objects.map(o=>homelandMiniObject(o,{x:0,y:0,full:true},true)).join('')}</div><div class="hpv2FocusFoot"><span>Drag facilities anywhere in the whole map. Plot boundaries are guides, not clipping edges. Objects cannot overlap other facilities.</span></div></div><aside class="hpv2PiecePalette"><div class="hpv2PiecePaletteHead"><div><b>Single Pieces</b><span>${addOptions.length} unlocked / available</span></div><div class="hpv2BuilderTools"><label>Snap <select id="hpv2SnapSelect"><option value="1"${String(HOMELAND_BUILDER_SNAP)==='1'?' selected':''}>1 square</option><option value=".5"${String(HOMELAND_BUILDER_SNAP)==='.5'?' selected':''}>0.5 square</option><option value=".25"${String(HOMELAND_BUILDER_SNAP)==='.25'?' selected':''}>0.25 square</option><option value="free"${String(HOMELAND_BUILDER_SNAP)==='free'?' selected':''}>No snap</option></select></label><input id="hpv2PieceSearch" placeholder="Search pieces…"></div></div><div class="hpv2PieceList">${homelandPiecePaletteHTML(addOptions)}</div></aside></div>`;
   }
 }else{
   const cards=plotDefs.map(p=>{
     const open=isPlotOpen(p.n),rows=homelandPlotObjects(p.n),u=HOMELAND_PLOT_UNLOCKS[p.n]||{},role=homelandPlotRole(p.n);
     if(!open)return `<button class="hpv2PlotCard locked" data-hpv2-locked="${p.n}"><div class="hpv2Lock">🔒</div><b>Plot ${p.n}</b><span>RV ${u.rv||'—'} · ${Number(u.cost||0).toLocaleString()} HC</span></button>`;
     return `<button class="hpv2PlotCard open" data-hpv2-plot="${p.n}"><div class="hpv2PlotTitle"><b>Plot ${p.n}</b><span>${esc(role)}</span></div><div class="hpv2MiniGrid"><div class="hpv2GridLines"></div>${rows.slice(0,50).map(o=>homelandMiniObject(o,p)).join('')}</div><div class="hpv2PlotFoot"><span>${rows.length?rows.length+' placed':'Purchased · nothing planned'}</span><strong>Open ›</strong></div></button>`;
   }).join('');
   root.innerHTML=modeBar+`<div class="hpv2Summary"><div><b>Home Overview</b><span>RV ${rvLevel.value} · ${openPlots.size} / 16 plots open · ${objects.length} placed objects</span></div><div class="hpv2SummaryHint">Overview only · no placement here. Open a plot to build. Locked cards show the reference RV + Home Coin unlock.</div></div><div class="hpv2PlotGrid">${cards}</div>`;
 }
 if(homelandPlannerMode==='full'){
   if(window.zoomSlider){zoomSlider.max='400';zoomSlider.value=String(homelandFullZoom);}if(window.zoomLabel)zoomLabel.textContent=homelandFullZoom+'%';
   const scroll=root.querySelector('.hpv2FullScroll');if(previousFullPosition&&scroll){scroll.scrollLeft=previousFullPosition.left;scroll.scrollTop=previousFullPosition.top;}
 }
 root.querySelectorAll('[data-hpv2-plot]').forEach(b=>b.addEventListener('click',()=>setHomelandPlannerMode('plot',b.dataset.hpv2Plot)));
 root.querySelectorAll('[data-hpv2-object]').forEach(b=>b.addEventListener('click',e=>{const workerClicked=!!e.target.closest('.hpv2LiveWorker');e.stopPropagation();selected=Number(b.dataset.hpv2Object);render();if(workerClicked)document.getElementById('actualWorkerSelect')?.focus();}));
 root.querySelectorAll('[data-hpv2-locked]').forEach(b=>b.addEventListener('click',()=>{const n=Number(b.dataset.hpv2Locked),u=HOMELAND_PLOT_UNLOCKS[n]||{};b.title=`Plot ${n}: unlock reference RV ${u.rv||'—'}, ${Number(u.cost||0).toLocaleString()} HC`;}));
 root.querySelectorAll('[data-hpv2-piece]').forEach(card=>card.addEventListener('dragstart',e=>{
   const name=card.dataset.hpv2Piece||'',item=catalog.find(x=>x.name===name),d=item?effectiveDims(item):null;
   e.dataTransfer?.setData('application/x-aniimo-catalog',name);
   e.dataTransfer?.setData('text/plain',name);
   if(d)e.dataTransfer?.setData('application/x-aniimo-anchor',JSON.stringify({x:d.w/2,y:d.h/2}));
   if(e.dataTransfer)e.dataTransfer.effectAllowed='copy';
 }));
 root.querySelectorAll('[data-hpv2-piece-add]').forEach(btn=>btn.addEventListener('click',()=>{
   const liveSearch=root.querySelector('#hpv2PieceSearch');if(liveSearch)homelandPieceQuery=liveSearch.value;
   const item=catalog.find(x=>x.name===btn.dataset.hpv2PieceAdd);if(item){if(homelandPlannerMode==='full')homelandAddVisiblePiece(item);else addObjectToFocusedPlot(item);}
 }));
 root.querySelectorAll('[data-hpv2-piece-remove]').forEach(btn=>btn.addEventListener('click',()=>{
   const liveSearch=root.querySelector('#hpv2PieceSearch');if(liveSearch)homelandPieceQuery=liveSearch.value;
   if(homelandPlannerMode==='full')removeOneByName(btn.dataset.hpv2PieceRemove||'');else removeObjectFromFocusedPlotByName(btn.dataset.hpv2PieceRemove||'');
 }));
 const pieceSearch=root.querySelector('#hpv2PieceSearch');
 const applyPieceFilter=()=>{
   const q=normalizeSearch(homelandPieceQuery);
   root.querySelectorAll('[data-piece-search]').forEach(card=>{const match=!q||String(card.dataset.pieceSearch||'').includes(q);card.hidden=!match;card.style.display=match?'':'none';});
 };
 if(pieceSearch){pieceSearch.value=homelandPieceQuery;applyPieceFilter();
   const newPalette=root.querySelector('.hpv2PieceList');if(newPalette)newPalette.scrollTop=oldPaletteScroll;
   if(searchWasFocused){pieceSearch.focus({preventScroll:true});try{pieceSearch.setSelectionRange(searchCaret,searchCaret)}catch(_){}}
 }
 pieceSearch?.addEventListener('input',()=>{homelandPieceQuery=pieceSearch.value;applyPieceFilter();});
 const snapSelect=el('hpv2SnapSelect');
 snapSelect?.addEventListener('change',()=>{setHomelandBuilderSnap(snapSelect.value);renderHomelandPlannerV2();});
 root.querySelectorAll('[data-hpv2-object][draggable="true"]').forEach(obj=>obj.addEventListener('dragstart',e=>{
   e.stopPropagation();
   e.dataTransfer?.setData('application/x-aniimo-object',obj.dataset.hpv2Object||'');
   const rect=obj.getBoundingClientRect();
   const objectId=Number(obj.dataset.hpv2Object),placed=objects.find(x=>x.id===objectId);
   if(placed&&rect.width>0&&rect.height>0){
     const anchorX=Math.max(0,Math.min(placed.w,(e.clientX-rect.left)/rect.width*placed.w));
     const anchorY=Math.max(0,Math.min(placed.h,(e.clientY-rect.top)/rect.height*placed.h));
     e.dataTransfer?.setData('application/x-aniimo-anchor',JSON.stringify({x:anchorX,y:anchorY}));
   }
   if(e.dataTransfer)e.dataTransfer.effectAllowed='move';
 }));
 const fullGrid=root.querySelector('[data-hpv2-drop-full]');
 if(fullGrid){
   fullGrid.addEventListener('dragover',e=>{e.preventDefault();fullGrid.classList.add('dragTarget')});
   fullGrid.addEventListener('dragleave',e=>{if(!fullGrid.contains(e.relatedTarget))fullGrid.classList.remove('dragTarget')});
   fullGrid.addEventListener('drop',e=>{
     e.preventDefault();fullGrid.classList.remove('dragTarget');
     const rect=fullGrid.getBoundingClientRect(),dx=(e.clientX-rect.left)/rect.width*80,dy=(e.clientY-rect.top)/rect.height*60;
     let anchor={x:0,y:0};try{anchor=JSON.parse(e.dataTransfer?.getData('application/x-aniimo-anchor')||'{}')}catch(_){}
     const id=e.dataTransfer?.getData('application/x-aniimo-object');
     const name=e.dataTransfer?.getData('application/x-aniimo-catalog')||e.dataTransfer?.getData('text/plain')||'';
     const o=id?objects.find(o=>String(o.id)===String(id)):null,item=!o?catalog.find(c=>c.name===name):null;
     const w=o?.w??effectiveDims(item||{w:0,h:0}).w,h=o?.h??effectiveDims(item||{w:0,h:0}).h;
     const x=snapHomelandBuilderCoord(dx-(Number(anchor.x)||0),80-w),y=snapHomelandBuilderCoord(dy-(Number(anchor.y)||0),60-h);
     const candidate=homelandSnapAdjacent({id:o?.id??-1,x,y,w,h});
     if(!w||!h||collide(candidate)){alert('That placement overlaps another building.');return}
     if(o){o.x=candidate.x;o.y=candidate.y;selected=o.id;render()}else if(item){addObject(item,candidate.x,candidate.y)}
   });
 }
 const dropGrid=root.querySelector('[data-hpv2-drop-plot]');
 if(dropGrid){
   dropGrid.addEventListener('dragover',e=>{e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect=e.dataTransfer.types.includes('application/x-aniimo-object')?'move':'copy';dropGrid.classList.add('dragTarget')});
   dropGrid.addEventListener('dragleave',e=>{if(!dropGrid.contains(e.relatedTarget))dropGrid.classList.remove('dragTarget')});
   dropGrid.addEventListener('drop',e=>{
     e.preventDefault();dropGrid.classList.remove('dragTarget');
     const rect=dropGrid.getBoundingClientRect();
     const cursorX=(e.clientX-rect.left)/Math.max(1,rect.width)*20;
     const cursorY=(e.clientY-rect.top)/Math.max(1,rect.height)*15;
     let anchor={x:0,y:0};
     try{anchor=JSON.parse(e.dataTransfer?.getData('application/x-aniimo-anchor')||'{"x":0,"y":0}')||anchor}catch(_){}
     const localX=cursorX-(Number(anchor.x)||0),localY=cursorY-(Number(anchor.y)||0);
     const objectId=e.dataTransfer?.getData('application/x-aniimo-object')||'';
     if(objectId){moveObjectInFocusedPlot(objectId,localX,localY);return}
     const name=e.dataTransfer?.getData('application/x-aniimo-catalog')||e.dataTransfer?.getData('text/plain')||'';
     const item=catalog.find(x=>x.name===name);if(item)addObjectToFocusedPlot(item,localX,localY);
   });
 }
}
function setMainTab(tab){
 activeMainTab=tab;document.querySelectorAll('#mainTabs [data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelectorAll('.tabPane').forEach(p=>p.classList.toggle('active',p.id===tab+'Pane'));
 if(tab==='map')setTimeout(()=>{if(el('autoFit')?.checked)fitBoard()},30);
 renderV30Views();
}
function initV30Layout(){
 mapViewport=el('mapViewport');
 if(mapViewport&&!mapViewport.dataset.panInit){
   mapViewport.dataset.panInit='1';
   mapViewport.addEventListener('wheel',e=>{
     if(e.shiftKey&&Math.abs(e.deltaY)>0){e.preventDefault();mapViewport.scrollLeft+=e.deltaY;}
   },{passive:false});
   let pan=false,sx=0,sy=0,sl=0,st=0;
   mapViewport.addEventListener('pointerdown',e=>{
     if(e.button!==1)return;
     pan=true;sx=e.clientX;sy=e.clientY;sl=mapViewport.scrollLeft;st=mapViewport.scrollTop;
     mapViewport.setPointerCapture?.(e.pointerId);e.preventDefault();
   });
   mapViewport.addEventListener('pointermove',e=>{if(pan){mapViewport.scrollLeft=sl-(e.clientX-sx);mapViewport.scrollTop=st-(e.clientY-sy);}});
   const stopPan=e=>{if(pan){pan=false;try{mapViewport.releasePointerCapture?.(e.pointerId)}catch(_){}}};
   mapViewport.addEventListener('pointerup',stopPan);mapViewport.addEventListener('pointercancel',stopPan);
 }
 const map=el('mapPane'), viewport=el('mapViewport');
 for(const id of ['boardOuter']){const n=el(id);if(n)viewport.appendChild(n)}
 const tb=document.querySelector('#workspaceWrap > .toolbar');if(tb)map.insertBefore(tb,viewport);
 const lg=document.querySelector('#workspaceWrap > .legend');if(lg)map.appendChild(lg);
 const boxes=[...document.querySelectorAll('#rightPanel .rosterBox')];if(boxes[0])el('rosterPane').appendChild(boxes[0]);if(boxes[1])el('planAdvisorHost').appendChild(boxes[1]);
 document.querySelectorAll('#planPane [data-plan-section]').forEach(b=>b.addEventListener('click',()=>setPlanAdviceSection(b.dataset.planSection)));
 document.querySelectorAll('#mainTabs [data-tab]').forEach(b=>b.addEventListener('click',()=>setMainTab(b.dataset.tab)));
 setMainTab('dashboard');
}
function abilityCoverage(){const out={};for(const a of HOME_ABILITIES)out[a]=0;for(const w of workers.filter(w=>w.active!==false))for(const a of (w.abilities||[]))if(a.type)out[a.type]=(out[a.type]||0)+(Number(a.level)||0);return out}
function familyCoverage(){const out={};for(const [id,f] of Object.entries(WORKER_FAMILIES))out[id]=workers.filter(w=>w.active!==false&&familyForWorker(w)===id).length;return out}
function blockedFamilyJobs(){return activeJobs().filter(j=>j.family&&!workers.some(w=>w.active!==false&&familyForWorker(w)===j.family))}
function renderRightQuickStats(){const root=el('rightQuickStats');if(!root)return;const jobs=activeJobs(),blocked=blockedFamilyJobs(),active=workers.filter(w=>w.active!==false).length;root.innerHTML=`<div class="quickStatRow"><span>Roster</span><b>${active} active / ${workers.length}</b></div><div class="quickStatRow"><span>Active jobs</span><b>${jobs.length}</b></div><div class="quickStatRow"><span>Placed objects</span><b>${objects.length}</b></div>${blocked.length?`<div class="rightAlert">🔒 ${blocked.length} production job${blocked.length===1?'':'s'} blocked by missing family worker.</div>`:'<div class="rightGood">No active family-locked production is blocked.</div>'}`}
function dashboardCatalogPlanner(){
 const src=aniidexImportMeta?.catalog||EMBEDDED_ANIIDEX_CATALOG||{};
 const hub=src?.hub||src?.homelandHub||src?.homeland||EMBEDDED_ANIIDEX_CATALOG?.hub||{};
 return src?.planner||src?.homelandPlanner||hub?.planner||EMBEDDED_ANIIDEX_CATALOG?.planner||{};
}
function dashboardFacilitySupportedAbilities(facilityId){
 const id=Number(facilityId),planner=dashboardCatalogPlanner(),rows=Array.isArray(planner?.recipes)?planner.recipes:Object.values(planner?.recipes||{});
 const found=[];
 for(const r of rows){
   if(Number(r?.facility)!==id)continue;
   for(const step of (r?.steps||[])){const skill=String(step?.skill||'');if(skill&&HOME_ABILITIES.includes(skill)&&!found.includes(skill))found.push(skill);}
   const watering=String(r?.watering?.skill||'');if(watering&&HOME_ABILITIES.includes(watering)&&!found.includes(watering))found.push(watering);
 }
 return found;
}
function dashboardAbilityNameForAssignment(w){
 const facility=Number(w?.aniidex?.facility),job=Number(w?.aniidex?.job);
 if(!facility)return '';
 const src=aniidexImportMeta?.catalog||EMBEDDED_ANIIDEX_CATALOG||{};
 const hub=src?.hub||src?.homelandHub||src?.homeland||EMBEDDED_ANIIDEX_CATALOG?.hub||{};
 const facts=hub?.facts||src?.facts||EMBEDDED_ANIIDEX_CATALOG?.hub?.facts||{};
 const text=src?.text||src?.homelandText||src?.siteText||hub?.text||EMBEDDED_ANIIDEX_CATALOG?.text||{};
 if(job){
   for(const [key,a] of Object.entries(facts?.abilities||{})){
     if(Number(a?.id)!==job)continue;
     const label=text?.abilities?.[job]??text?.abilities?.[String(job)]??key;
     const direct=typeof label==='string'?label:(label?.name||label?.label||key);
     if(HOME_ABILITIES.includes(String(direct)))return String(direct);
   }
 }
 const planner=dashboardCatalogPlanner(),rows=Array.isArray(planner?.recipes)?planner.recipes:Object.values(planner?.recipes||{});
 if(job){
   for(const r of rows){
     if(Number(r?.facility)!==facility)continue;
     for(const step of (r?.steps||[]))if(Number(step?.id)===job&&HOME_ABILITIES.includes(String(step?.skill||'')))return String(step.skill);
     if(Number(r?.watering?.id)===job&&HOME_ABILITIES.includes(String(r?.watering?.skill||'')))return String(r.watering.skill);
   }
 }
 const deviceAbility={1040003:'Fire',1040004:'Ice',1040005:'Light'}[facility];if(deviceAbility)return deviceAbility;
 const supported=dashboardFacilitySupportedAbilities(facility);
 if(supported.length===1)return supported[0];
 if(supported.length>1){
   let best='',bestLevel=-1;
   for(const ability of supported){const level=workerAbilityLevel(w,ability)||0;if(level>bestLevel){best=ability;bestLevel=level;}}
   if(best)return best;
 }
 return '';
}
function dashboardLiveAbilityUsage(){
 const out={};for(const a of HOME_ABILITIES)out[a]={workers:0,levels:0,names:[]};
 for(const w of workers){
   if(!w?.aniidex||w.aniidex.facility==null)continue;
   const ability=dashboardAbilityNameForAssignment(w);if(!ability)continue;
   const level=workerAbilityLevel(w,ability)||0;
   if(!out[ability])out[ability]={workers:0,levels:0,names:[]};
   out[ability].workers++;out[ability].levels+=level;out[ability].names.push(`${w.name||'Unnamed'}${level?' Lv'+level:''} — ${dashboardFacilityName(w.aniidex.facility)}`);
 }
 return out;
}
function abilityContributors(ability){
 return workers.filter(w=>w.active!==false).map(w=>{
   let level=0;
   for(const a of (w.abilities||[]))if(a?.type===ability)level=Math.max(level,Number(a.level)||0);
   return {w,level};
 }).filter(x=>x.level>0).sort((a,b)=>b.level-a.level||String(a.w.name||'').localeCompare(String(b.w.name||'')));
}
function toggleAbilityContributors(ability){
 const row=document.querySelector('[data-ability-detail="'+CSS.escape(ability)+'"]');
 if(row)row.hidden=!row.hidden;
}
function dashboardFacilityName(id){
 const key=String(id??'');
 const src=aniidexImportMeta?.catalog||EMBEDDED_ANIIDEX_CATALOG||{};
 const hub=src?.hub||src?.homelandHub||src?.homeland||EMBEDDED_ANIIDEX_CATALOG?.hub||{};
 const text=src?.text||src?.homelandText||src?.siteText||hub?.text||EMBEDDED_ANIIDEX_CATALOG?.text||{};
 const direct=text?.facilities?.[key]??text?.facilities?.[Number(key)];if(direct)return String(direct);
 const planner=src?.planner||src?.homelandPlanner||hub?.planner||EMBEDDED_ANIIDEX_CATALOG?.planner||{};
 const rows=Array.isArray(planner?.facilities)?planner.facilities:Object.values(planner?.facilities||{});
 const hit=rows.find(x=>String(x?.type??x?.id??'')===key);
 return String(hit?.name||('Facility '+key));
}
function dashboardHomeSnapshot(){
 const meta=aniidexImportMeta||null;
 const prof=meta?.profile?.profile||meta?.profile||{};
 const profileHome=prof?.homeland||{};
 const rawHome=meta?.home?.home||meta?.home||{};
 const facilities=rawHome?.facilities||{};
 const facilityRows=[];let facilityPieces=0;
 for(const [type,levels] of Object.entries(facilities)){
   let total=0;const levelParts=[];
   for(const [lv,countRaw] of Object.entries(levels||{})){const count=Number(countRaw)||0;if(!count)continue;total+=count;levelParts.push('Lv '+lv+' ×'+count);}
   if(total){facilityPieces+=total;facilityRows.push({type,name:dashboardFacilityName(type),total,levels:levelParts.join(' • ')});}
 }
 facilityRows.sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name));
 const roster=Array.isArray(rawHome?.aniimo)?rawHome.aniimo:[];
 const working=roster.filter(a=>a?.facility!=null).length;
 const inactive=Math.max(0,roster.length-working);
 const queues=Array.isArray(rawHome?.crops)?rawHome.crops:[];
 const activeQueues=queues.filter(q=>q?.recipe!=null).length;
 const readyQueues=queues.filter(q=>Object.values(q?.output||{}).some(v=>(Number(v)||0)>0)).length;
 const pausedQueues=queues.filter(q=>q?.paused===true).length;
 const eggs=Array.isArray(rawHome?.eggs)?rawHome.eggs:[];
 const normalPlots=(rawHome?.plots||[]).filter(n=>Number(n)>=1&&Number(n)<=16);
 const areas=Array.isArray(rawHome?.areas)?rawHome.areas:[];
 const hatchinators=Object.values(facilities?.['1050000']||{}).reduce((n,v)=>n+(Number(v)||0),0);
 const food=Array.isArray(rawHome?.food)?rawHome.food:[];
 const captured=meta?.home?.importedAt||rawHome?.imported_at||meta?.importedAt||0;
 return {meta,prof,profileHome,rawHome,facilityRows,facilityPieces,rosterCount:roster.length,working,inactive,queues:queues.length,activeQueues,readyQueues,pausedQueues,eggs:eggs.length,normalPlots:normalPlots.length,areas:areas.length,hatchinators,foodSlots:food.filter(x=>(Number(x?.count)||0)>0).length,foodSpeed:Number(rawHome?.food_speed||0),captured};
}
function dashboardHomeSnapshotHTML(){
 const h=dashboardHomeSnapshot();
 if(!h.meta)return `<div class="homeSnapshotEmpty"><b>No synced Homeland snapshot yet.</b><span>Use Sync now above and this section will fill with live home status that does not require map geometry.</span></div>`;
 const pc=h.profileHome||{},sc=h.rawHome?.comfort||{};
 const profileFurniture=Number(pc.furniture_comfort||0),profilePet=Number(pc.pet_comfort||0),habitability=Number(pc.habitability||0);
 const snapshotFurniture=Number(sc.furniture||0),snapshotPet=Number(sc.pet||0),snapshotTotal=Number(sc.total||0);
 const rv=Number(h.rawHome?.home_level||pc.rv_level||rvLevel.value||0);
 const modules=Object.entries(pc.rv_modules||{}).filter(([,v])=>(Number(v)||0)>0).length;
 const likes=Number(pc.likes||0);
 const capturedText=h.captured?formatAniidexSyncTime(Number(h.captured)>1e12?Number(h.captured):Number(h.captured)*1000):'Unknown';
 const facilityTable=h.facilityRows.length?`<div class="tableWrap homeFacilityTable"><table class="dataTable"><thead><tr><th>Facility</th><th>Total</th><th>Levels owned</th></tr></thead><tbody>${h.facilityRows.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${x.total}</td><td>${esc(x.levels)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="small">No facility inventory was returned by this sync.</div>';
 return `<div class="homeSnapshotHead"><div><div class="sectionTitle">Home Snapshot</div><div class="small">Live Homeland state we can read without knowing exact building coordinates. Last snapshot: <b>${esc(capturedText)}</b>.</div></div></div>
 <div class="homeSnapshotGrid">
  <div class="homeSnapshotCard"><span>RV / land</span><b>RV ${rv}</b><small>${h.normalPlots} production plots • ${h.areas} cleared areas • ${modules} installed module types</small></div>
  <div class="homeSnapshotCard"><span>Profile habitability</span><b>${habitability.toLocaleString()}</b><small>Furniture ${profileFurniture.toLocaleString()} • Aniimo ${profilePet.toLocaleString()} • ${likes} likes</small></div>
  <div class="homeSnapshotCard"><span>Snapshot comfort</span><b>${snapshotTotal.toLocaleString()}</b><small>Furniture ${snapshotFurniture.toLocaleString()} • Aniimo ${snapshotPet.toLocaleString()}</small></div>
  <div class="homeSnapshotCard"><span>Facilities</span><b>${h.facilityPieces}</b><small>${h.facilityRows.length} facility types tracked</small></div>
  <div class="homeSnapshotCard"><span>Homeland Aniimo</span><b>${h.working} working</b><small>${h.inactive} inactive / available • ${h.rosterCount} total</small></div>
  <div class="homeSnapshotCard"><span>Production activity</span><b>${h.activeQueues} active</b><small>${h.queues} pieces tracked • ${h.readyQueues} with output • ${h.pausedQueues} paused</small></div>
  <div class="homeSnapshotCard"><span>Incubation</span><b>${h.eggs} egg${h.eggs===1?'':'s'}</b><small>${h.hatchinators} Hatchinator${h.hatchinators===1?'':'s'} owned</small></div>
  <div class="homeSnapshotCard"><span>Food supply</span><b>${h.foodSlots} filled slot${h.foodSlots===1?'':'s'}</b><small>${h.foodSpeed?`Food speed ${h.foodSpeed}`:'No food-speed value returned'}</small></div>
 </div>
 <details class="homeSnapshotDetails"><summary>Facility inventory from latest sync</summary>${facilityTable}</details>`;
}
function renderDashboardTab(){
 const root=el('dashboardPane');if(!root)return;
 const active=workers.filter(w=>w.active!==false).length,blocked=blockedFamilyJobs(),jobs=activeJobs(),open=[...openPlots].length;
 root.innerHTML=`<div class="v30Title">Homeland Dashboard</div><div class="v30Sub">Quick health check for this profile. Use Home Snapshot for the complete live Aniidx Homeland readout.</div>
 <div class="snapshotJump"><div><b>Live Homeland Snapshot</b><span>Incubation, production, workers, abilities, facilities, food, modules, visitors, sync health and storage.</span></div><button type="button" onclick="setMainTab('snapshot')">Open Home Snapshot →</button></div>
 <div id="dashboardImport" class="dashboardImportHost"></div>
 <div class="dashboardGrid">
  <div class="metricCard"><div class="label">RV</div><div class="metric">${esc(rvLevel.value)}</div><div class="small">${open} open production plots</div></div>
  <div class="metricCard"><div class="label">Production Zone</div><div class="metric">${active}</div><div class="small">${workers.length} Aniimo entered</div></div>
  <div class="metricCard"><div class="label">Active planner jobs</div><div class="metric">${jobs.length}</div><div class="small">manually configured stations / recipes</div></div>
  <div class="metricCard"><div class="label">Family blocks</div><div class="metric">${blocked.length}</div><div class="small">locked recipes missing an accepted family</div></div>
 </div>`;
 renderImportTab('dashboardImport',true);
}
function recipeCatalogParts(){
 const live=aniidexImportMeta?.catalog||null,embedded=typeof EMBEDDED_ANIIDEX_CATALOG!=='undefined'?EMBEDDED_ANIIDEX_CATALOG:null;
 const pick=x=>x?.planner?.recipes||x?.recipes||x?.hub?.facts?.recipes||x?.facts?.recipes||[];
 const recipes=pick(live)?.length?pick(live):pick(embedded);
 const src=pick(live)?.length?'Aniidx live catalog':'embedded Aniidx catalog';
 const text=(pick(live)?.length?(live?.text||live?.hub?.text):(embedded?.text||embedded?.hub?.text))||{};
 const planner=(pick(live)?.length?(live?.planner||live):(embedded?.planner||embedded))||{};
 const facts=(pick(live)?.length?(live?.hub?.facts||live?.facts):(embedded?.hub?.facts||embedded?.facts))||{};
 return {recipes:Array.isArray(recipes)?recipes:Object.entries(recipes||{}).map(([id,v])=>({id:Number(id),...v})),text,planner,facts,src};
}
function recipeItemName(id,p){
 const common=window.HomelandItemCatalog?.lookup(id,aniidexImportMeta?.catalog);if(common?.name)return common.name;
 const key=String(id??''),direct=p.text?.items?.[key]??p.text?.items?.[Number(key)];
 if(typeof direct==='string')return direct;
 if(direct?.name||direct?.label)return String(direct.name||direct.label);
 const supplemental=window.ANIIMO_ITEM_SUPPLEMENTAL_REFERENCE?.entries?.[key];
 if(supplemental?.name)return String(supplemental.name);
 const fact=p.facts?.items?.[key]??p.facts?.items?.[Number(key)];
 if(fact?.name)return String(fact.name);
 const slug=String(fact?.path||'').split('?')[0].replace(/\/+$/,'').split('/').pop()||'';
 return slug?slug.replace(/[-_]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase()):(key?'Item '+key:'Unknown');
}
function recipeFacilityName(id,p){
 const key=String(id??''),direct=p.text?.facilities?.[key]??p.text?.facilities?.[Number(key)];
 if(typeof direct==='string')return direct;
 if(direct?.name||direct?.label)return String(direct.name||direct.label);
 const f=(p.planner?.facilities||[]).find(x=>String(x.type)===key);
 return f?.name||('Facility '+key);
}
function recipeFacilityRv(facilityId,minLevel,p){
 const f=(p.planner?.facilities||[]).find(x=>String(x.type)===String(facilityId));
 const level=(f?.levels||[]).find(x=>Number(x.level)===Number(minLevel));
 return Number(level?.rv||1);
}
function plannerRecipeMatch(station,name){
 const normalize=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 return (recipeDB[station]||[]).some(r=>normalize(r.name)===normalize(name));
}
const HOMELAND_REFERENCE_FAMILY_IDS={1017:'Susuta',1019:'Shelly',1026:'Nimbi',1021:'Iris',1035:'Dewy',1001:'Celestis',1023:'Flutternym'};
function fullRecipeRows(){
 const p=recipeCatalogParts();
 if(p.recipes.length){
  return {source:p.src,rows:p.recipes.map(r=>{
   const station=recipeFacilityName(r.facility,p),out=r.outputs?.[0]||{},name=recipeItemName(out.item??r.id,p);
   const ingredients=(r.inputs||[]).length?(r.inputs||[]).map(x=>recipeItemName(x.item,p)+' ×'+Number(x.qty||1)).join(' + '):'—';
   const ability=r.steps?.find(x=>x?.skill)?.skill||r.step?.skill||(Array.isArray(r.hands)&&r.hands.length?r.hands.join(' / '):'—');
   const abilityLevel=r.steps?.find(x=>x?.skill)?.level||r.step?.level||'';
   const sellRaw=p.facts?.items?.[String(out.item??r.id)]?.sell;
   const supplementalSell=window.ANIIMO_ITEM_SUPPLEMENTAL_REFERENCE?.entries?.[String(out.item??r.id)]?.sell;
   const sell=window.HomelandItemCatalog?.lookup(out.item??r.id,aniidexImportMeta?.catalog)?.sell??sellRaw??supplementalSell??null;
   return {id:r.id,outputId:out.item??null,station,name,rv:recipeFacilityRv(r.facility,r.minLevel,p),level:Number(r.minLevel||1),kind:r.kind||'work',ingredients,work:r.workload??r.time??0,ability,abilityLevel,sell,family:HOMELAND_REFERENCE_FAMILY_IDS[r.steps?.find(x=>x.family)?.family]||null,plannerAvailable:plannerRecipeMatch(station,name)};
  })};
 }
 let rows=[];for(const [station,list] of Object.entries(recipeDB)){const sr=STATION_RULES[station]||{};for(const r of list)rows.push({station,name:r.name,rv:r.rv||1,level:1,kind:r.mode||'work',ingredients:r.ingredients||'—',work:r.work||0,ability:sr.ability||'—',abilityLevel:r.rec||1,sell:r.sell??null,family:FAMILY_RECIPE_RULES[station+'|'+r.name]?.family||null,plannerAvailable:true})}
 return {source:'legacy planner recipeDB',rows};
}
let activeRecipeType='all';
function recipeTypeLabel(kind){
 return ({work:'Crafting / Work',crop:'Crops / Farming',home:'Home Resources'})[kind]||kind;
}
function renderProductionTab(){
 const root=el('productionPane');if(!root)return;
 const data=fullRecipeRows(),rows=data.rows.sort((a,b)=>a.station.localeCompare(b.station)||a.rv-b.rv||a.name.localeCompare(b.name));
 const typeOrder=['all','work','crop','home'];
 const plannerMatches=rows.filter(r=>r.plannerAvailable).length;
 const counts={all:rows.length};for(const r of rows)counts[r.kind]=(counts[r.kind]||0)+1;
 if(!typeOrder.includes(activeRecipeType))activeRecipeType='all';
 root.innerHTML=`<div class="productionBrowser"><div class="productionBrowserHead"><div class="v30Title">Recipes</div><div class="v30Sub">${rows.length.toLocaleString()} reference recipe records from ${esc(data.source)}. ${plannerMatches} recipe names currently match the interactive planner list; the remainder are reference-only or use different names. Reference listings are not automatically selectable in the map planner.</div><div class="planAdviceSubnav productionTypeTabs">${typeOrder.map(k=>`<button type="button" data-recipe-kind="${k}" class="${activeRecipeType===k?'active':''}">${k==='all'?'All Recipes':recipeTypeLabel(k)} <span class="small">(${Number(counts[k]||0).toLocaleString()})</span></button>`).join('')}</div><div class="filterBar"><input id="prodSearch" placeholder="Search station, recipe, ingredient, ID or ability..."><select id="prodRvFilter"><option value="all">All RV levels</option><option value="current">Available at current RV</option></select><select id="prodPlannerFilter"><option value="all">All planner coverage</option><option value="yes">In map recipe picker</option><option value="no">Not matched in map picker</option></select></div></div><div id="prodRecipeTable" class="tableWrap productionRecipeTable"></div></div>`;
 const draw=()=>{
  const q=normalizeSearch(el('prodSearch').value),cur=el('prodRvFilter').value,coverage=el('prodPlannerFilter').value;
  const f=rows.filter(x=>(cur!=='current'||x.rv<=+rvLevel.value)&&(activeRecipeType==='all'||x.kind===activeRecipeType)&&(coverage==='all'||x.plannerAvailable===(coverage==='yes'))&&(!q||normalizeSearch(x.station+' '+x.name+' '+x.ingredients+' '+x.id+' '+x.ability).includes(q)));
  const sectionLabel=activeRecipeType==='all'?'All Recipes':recipeTypeLabel(activeRecipeType);
  el('prodRecipeTable').innerHTML=`<div class="small" style="padding:7px 2px"><b>${esc(sectionLabel)}</b> · ${f.length.toLocaleString()} shown${q||cur!=='all'?' after filters':''}</div><table class="dataTable"><thead><tr><th>ID</th><th>Station</th><th>Recipe / Output</th><th>Facility Lv</th><th>RV</th><th>Ability</th><th>Ingredients</th><th>Work / Time</th><th>Sell</th><th>Family requirement</th><th>Map picker</th></tr></thead><tbody>${f.map(x=>`<tr><td><code>${esc(String(x.id??'—'))}</code></td><td>${esc(x.station)}</td><td><b>${(window.AniimoIconAtlas?.html(x.outputId||x.id,23)||window.AniimoIconAtlas?.html(x.name,23)||'')} ${esc(x.name)}</b></td><td>${x.level}</td><td>${x.rv}</td><td>${esc(x.ability||'—')}${x.abilityLevel?' Lv'+x.abilityLevel:''}</td><td>${esc(x.ingredients)}</td><td>${Number(x.work||0).toLocaleString()}</td><td>${x.sell===null||x.sell===undefined?'—':Number(x.sell).toLocaleString()+' HC'}</td><td>${esc(x.family||'—')}</td><td>${x.plannerAvailable?'Listed':'Reference only*'}</td></tr>`).join('')}</tbody></table>`;
 };
 root.querySelectorAll('[data-recipe-kind]').forEach(b=>b.addEventListener('click',()=>{activeRecipeType=b.dataset.recipeKind||'all';root.querySelectorAll('[data-recipe-kind]').forEach(x=>x.classList.toggle('active',x.dataset.recipeKind===activeRecipeType));draw();}));
 el('prodSearch').addEventListener('input',draw);el('prodRvFilter').addEventListener('change',draw);el('prodPlannerFilter').addEventListener('change',draw);draw();
}
function rankLabel(f){if(!f||!f.eligible)return'Not eligible';if(f.trait&&f.lvl>=4)return'Best';if(f.lvl>=3&&f.trait)return'High';if(f.lvl>=2)return'Medium';return'Low End'}
function renderSuggestionsTab(){const root=el('planSuggestions');if(!root)return;const jobs=activeJobs(),cov=abilityCoverage(),blocked=blockedFamilyJobs();const demand={};for(const j of jobs)demand[j.ability]=(demand[j.ability]||0)+(j.rec||1);let suggestions=[];for(const a of HOME_ABILITIES){const need=demand[a]||0,have=cov[a]||0;if(need&&have<=need)suggestions.push({pri:have<need?0:1,title:`${a} coverage is ${have<need?'short':'tight'}`,body:`Current active-job demand is about ${need} ability levels; your active roster totals ${have}. Use Imported Roster → By Ability to find ${a} candidates, then compare secondary abilities and personality fit.`})}for(const j of blocked)suggestions.unshift({pri:-1,title:`🔒 ${j.station}${j.recipe?' — '+j.recipe:''} production blocked`,body:`Missing ${WORKER_FAMILIES[j.family]?.label||j.family}. Add one accepted family member to the Production Zone. Preferred personality: ${j.personality?j.personality+' — '+PERSONALITY_NAMES[j.personality]:'none'}.`});for(const j of jobs){const fits=workers.map(w=>({w,f:workerFitForJob(w,j)})).filter(x=>x.f.eligible).sort((a,b)=>b.f.score-a.f.score);if(fits[0]&&!fits[0].f.trait&&j.personality)suggestions.push({pri:2,title:`${j.station}: personality improvement available`,body:`Best current fit is ${fits[0].w.name||'unnamed worker'}, but it does not have ${j.personality} — ${PERSONALITY_NAMES[j.personality]}. The job still works; a matching personality would add the station bonus.`})}suggestions.sort((a,b)=>a.pri-b.pri);root.innerHTML=`<div class="sectionTitle">Recommendations</div><div class="v30Sub">Actionable coaching based on this profile: blocked production first, then ability shortages, personality opportunities, and roster fit.</div><div class="suggestGrid">${suggestions.length?suggestions.slice(0,24).map((x,i)=>`<div class="fullCard"><h3>${esc(x.title)}</h3><div class="small">${x.body}</div></div>`).join(''):'<div class="fullCard"><h3>No urgent suggestion yet</h3><div class="small">Enter your roster and assign recipes to let the planner find shortages, family locks and personality opportunities.</div></div>'}</div>`}
function renderProgressionTab(){const root=el('planProgression');if(!root)return;const rv=+rvLevel.value,next=rv+1;const upcoming=catalog.filter(x=>(x.rv||1)===next);root.innerHTML=`<div class="sectionTitle">Progression</div><div class="v30Sub">RV, module, plot and facility progression using loaded data only.</div><div class="progressGrid"><div class="fullCard"><h3>Current RV</h3><div class="metric">RV ${rv}</div><div class="small">Next: RV ${next}</div></div><div class="fullCard"><h3>Open plots</h3><div class="metric">${openPlots.size}</div><div class="small">Plot access follows what is actually open in your game.</div></div><div class="fullCard"><h3>Next-RV unlocks</h3><div class="small">${upcoming.length?upcoming.map(x=>esc(x.name)).join(' • '):'No loaded facility unlocks for RV '+next+'.'}</div></div></div><div class="sectionTitle">RV Module Levels</div><div class="tableWrap"><table class="dataTable"><thead><tr><th>Module</th><th>Current</th></tr></thead><tbody>${Object.keys(rvModules).map(k=>`<tr><td>${esc(k)}</td><td>Lv ${Number(moduleLevels[k]||0)}</td></tr>`).join('')}</tbody></table></div>`}
function renderAniimosTab(){
 const root=el('aniimosPane');if(!root)return;
 const speciesData=window.ANIIMO_SPECIES_DATA||{species:[]};
 const manifest=window.ANIIMO_ASSET_MANIFEST||{aniimoForms:{}};
 const stageIndex=window.ANIIMO_STAGE_INDEX||{};
 const unavailableDex=new Set(['084','085','086','087','088','089','090','091','092','093']);
 const stageNameFor=n=>({Hexxin:'Witchin'}[n]||n);
 const hiddenImageOnly=new Set(['Jabster','Morphling','Fennelun','Soleon']);
 const noVariantSpecies=new Set(['Lunara','Helion']);
 const abilityImageForms={
   Lunara:[{assetName:'Fennelun',id:'1037300',label:'Ability Form — Fennelun'}],
   Helion:[{assetName:'Soleon',id:'1036300',label:'Ability Form — Soleon'}]
 };
 const humanize=s=>String(s||'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
 const formLabel=(name,id)=>{
   const mf=(manifest.aniimoForms||{})[id];
   if(mf?.form)return mf.form;
   const base=String(id||'').split('-')[0];
   const bf=(manifest.aniimoForms||{})[base];
   const slug=String(id||'').slice(base.length).replace(/^-+/,'');
   if(slug)return humanize(slug);
   return bf?.form||'Basic Form';
 };
 const actualStageFor=name=>stageIndex[stageNameFor(name)]||null;
 const collectionPayload=aniidexImportMeta?.profile?.profile?.collection||aniidexImportMeta?.profile?.collection||null;
 const caughtIds=new Set(Array.isArray(collectionPayload?.caught_pet_ids)?collectionPayload.caught_pet_ids.map(x=>String(x)):[]);
 const collectionLoaded=Array.isArray(collectionPayload?.caught_pet_ids);
 const wikiNorm=v=>window.WikiHomeland?.normalize?.(v)||String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const formEntriesFor=name=>{
   const baseAsset=stageNameFor(name);
   const entries=Object.entries(stageIndex[baseAsset]||{}).map(([id,apps])=>({
     key:baseAsset+'|'+id,assetName:baseAsset,id,
     apps:noVariantSpecies.has(name)?apps.filter(a=>a==='Normal'):apps,
     label:formLabel(name,id)
   }));
   for(const extra of abilityImageForms[name]||[]){
     const rawApps=stageIndex[extra.assetName]?.[extra.id]||[];
     const apps=noVariantSpecies.has(name)?rawApps.filter(a=>a==='Normal'):rawApps;
     if(apps.length)entries.push({key:extra.assetName+'|'+extra.id,assetName:extra.assetName,id:extra.id,apps,label:extra.label});
   }
   return entries;
 };
 const localFormForWiki=(name,wf)=>{
   const local=formEntriesFor(name);
   const target=wikiNorm(wf?.label||wf?.slug||'');
   let hit=local.find(f=>wikiNorm(f.label)===target);
   if(!hit&&/prismana/i.test(wf?.slug||wf?.label||''))hit=local.find(f=>/prismana/i.test(f.label||''));
   if(!hit&&/(basic|base)/i.test(wf?.slug||wf?.label||''))hit=local.find(f=>/(basic|base)/i.test(f.label||''));
   return hit||null;
 };
 const wikiFormState=(name,wf)=>{
   const local=localFormForWiki(name,wf),id=local?.id?String(local.id):'';
   return {local,id,known:!!id,caught:!!id&&caughtIds.has(id)};
 };
 const wikiSpeciesState=ws=>{
   const canonicalName=releasedByDex?.get?.(String(ws?.dex))||ws?.name||'';
   const forms=(ws?.forms||[]).map(wf=>({...wikiFormState(canonicalName,wf),wiki:wf}));
   const known=forms.filter(f=>f.known),caught=known.filter(f=>f.caught);
   const prismana=forms.find(f=>/prismana/i.test(f.wiki?.slug||f.wiki?.label||''));
   return {forms,known:known.length,caught:caught.length,total:forms.length,complete:known.length>0&&caught.length===known.length,prismana};
 };
 const rosterCopiesFor=name=>workers.filter(w=>wikiNorm(w.name)===wikiNorm(name));
 const roster=(speciesData.species||[]).map(s=>({...s,releaseStatus:unavailableDex.has(String(s.dex))?'unavailable':'released'}));
 const rosterNames=new Set(roster.map(s=>stageNameFor(s.name)));
 for(const imageName of Object.keys(stageIndex)){
   if(hiddenImageOnly.has(imageName))continue;
   if(!rosterNames.has(imageName))roster.push({dex:'',name:imageName,stage:'',releaseStatus:'image-only'});
 }
 const visible=roster.filter(s=>s.releaseStatus!=='unavailable'||formEntriesFor(s.name).length>0);
 const q=String(aniimosBrowseQuery||'').trim().toLowerCase();
 const species=visible.filter(s=>!q||String(s.name||'').toLowerCase().includes(q)||String(s.dex||'').includes(q));
 const appearanceLabel=a=>{
   if(a==='Normal'||a==='Umbral')return a;
   const m=String(a).match(/^Sparkling-(\d+)$/);
   if(m){
     const n=Number(m[1]);
     if(n>=1&&n<=10)return 'Sparkling Type '+['I','II','III','IV','V','VI','VII','VIII','IX','X'][n-1];
     if(n===11)return 'Dazzling';
     if(n===12)return 'Shadow';
   }
   return humanize(a);
 };
 const imagePath=(stageName,id,appearance)=>stageName&&id&&appearance?`assets/aniimo/stage/${stageName}__${id}__ThreeQuarter__${appearance}.webp`:'';
 const wikiSummary=window.WikiHomeland?.summary?.()||{counts:{species:0,forms:0,formsWithAbilities:0},warnings:[]};
 const wikiTypes=window.WikiHomeland?.allAbilityTypes?.()||[];
 if(!wikiTypes.some(x=>x.type===aniimosRankAbility)&&wikiTypes.length)aniimosRankAbility=wikiTypes[0].type;
 if(!collectionLoaded&&aniimosCollectionFilter!=='all')aniimosCollectionFilter='all';
 const officialSpecies=window.WikiHomeland?.speciesList?.()||[];
 const releasedByDex=new Map((speciesData.species||[]).map(x=>[String(x.dex),x.name]));
 const canonicalWikiSpecies=ws=>({...ws,name:releasedByDex.get(String(ws.dex))||ws.name,wikiName:ws.name});
 const localSpeciesByName=new Map(roster.map(x=>[wikiNorm(x.name),x]));
 const collectionBase=officialSpecies.map(rawWs=>{
   const ws=canonicalWikiSpecies(rawWs);
   const local=localSpeciesByName.get(wikiNorm(ws.name))||{};
   return {...local,...ws,collectionState:wikiSpeciesState(ws)};
 });
 const collectionRows=collectionBase.filter(x=>{
   if(q&&!String(x.name||'').toLowerCase().includes(q)&&!String(x.dex||'').includes(q))return false;
   const st=x.collectionState;
   if(aniimosCollectionFilter==='caught')return st.caught>0;
   if(aniimosCollectionFilter==='missing')return st.known>st.caught;
   if(aniimosCollectionFilter==='complete')return st.complete;
   if(aniimosCollectionFilter==='missing-prismana')return !!st.prismana?.known&&!st.prismana.caught;
   return true;
 });
 const collectionCaughtSpecies=collectionBase.filter(x=>x.collectionState.caught>0).length;
 const collectionComplete=collectionBase.filter(x=>x.collectionState.complete).length;
 const aniimoSubnav=`<div class="aniimosSubnav">
   <button type="button" data-aniimo-mode="collection" class="${aniimosViewMode==='collection'?'active':''}">Collection</button>
   <button type="button" data-aniimo-mode="details" class="${aniimosViewMode==='details'?'active':''}">Details</button>
   <button type="button" data-aniimo-mode="abilities" class="${aniimosViewMode==='abilities'?'active':''}">Abilities</button>
 </div>`;
 const bindAniimoSubnav=()=>{
   root.querySelectorAll('[data-aniimo-mode]').forEach(btn=>btn.addEventListener('click',()=>{
     aniimosViewMode=btn.dataset.aniimoMode||'collection';
     localStorage.setItem('aniimosViewMode',aniimosViewMode);
     renderAniimosTab();
   }));
   root.querySelectorAll('[data-aniimo-details]').forEach(btn=>btn.addEventListener('click',()=>{
     aniimosSelectedName=btn.dataset.aniimoDetails||'';
     localStorage.setItem('aniimosSelectedName',aniimosSelectedName);
     aniimosViewMode='details';
     localStorage.setItem('aniimosViewMode',aniimosViewMode);
     renderAniimosTab();
   }));
 };

 if(aniimosViewMode==='details'){
   const wikiSpecies=(window.WikiHomeland?.speciesList?.()||[]).map(canonicalWikiSpecies);
   let selected=wikiSpecies.find(x=>wikiNorm(x.name)===wikiNorm(aniimosSelectedName)||wikiNorm(x.wikiName)===wikiNorm(aniimosSelectedName))||wikiSpecies[0]||null;
   if(selected&&selected.name!==aniimosSelectedName){
     aniimosSelectedName=selected.name;
     localStorage.setItem('aniimosSelectedName',aniimosSelectedName);
   }
   if(!selected){
     root.innerHTML=`<div class="aniimosBrowser">${aniimoSubnav}<div class="fullCard">Official Wiki Aniimo reference is not loaded.</div></div>`;
     bindAniimoSubnav();return;
   }
   const state=wikiSpeciesState(selected),copies=rosterCopiesFor(selected.name);
   const options=wikiSpecies.map(ws=>`<option value="${esc(ws.name)}"${ws.name===selected.name?' selected':''}>#${esc(ws.dex)} · ${esc(ws.name)}</option>`).join('');
   const formCards=state.forms.map(fs=>{
     const wf=fs.wiki,local=fs.local,apps=local?.apps||[];
     const appearance=apps.includes('Normal')?'Normal':(apps[0]||'');
     const src=local?imagePath(local.assetName,local.id,appearance):'';
     const abilities=(wf.homelandAbilities||[]).map(a=>`<span class="aniimoDetailAbility">${esc(a.type)} Lv${Number(a.level)||'?'}</span>`).join('');
     const habitats=(wf.habitats||[]).length?(wf.habitats||[]).map(h=>esc(h)).join(' • '):'Not listed';
     const status=!collectionLoaded?'<span class="collectionBadge neutral">Sync to check</span>':!fs.known?'<span class="collectionBadge neutral">ID not matched</span>':fs.caught?'<span class="collectionBadge caught">Caught ✓</span>':'<span class="collectionBadge missing">Missing</span>';
     return `<article class="aniimoDetailFormCard">
       <div class="aniimoDetailFormImage">${src?`<img src="${esc(src)}" alt="${esc(selected.name+' '+wf.label)}" loading="lazy" decoding="async">`:`<span>${esc(String(selected.name).slice(0,2).toUpperCase())}</span>`}</div>
       <div class="aniimoDetailFormBody">
         <div class="aniimoDetailFormHead"><div><b>${esc(wf.label)}</b>${fs.id?`<div class="small">Form ID ${esc(fs.id)}</div>`:''}</div>${status}</div>
         <div class="aniimoDetailAbilities">${abilities||'<span class="small">No Homeland abilities listed.</span>'}</div>
         <div class="small"><b>Habitat:</b> ${habitats}</div>
         <a class="aniimoWikiLink" href="${esc(wf.url)}" target="_blank" rel="noopener">Official Wiki ↗</a>
       </div>
     </article>`;
   }).join('');
   const best=(selected.bestAbilities||[]).map(a=>`<div class="aniimoBestAbility"><b>${esc(a.type)} Lv${a.level}</b><span>${esc((a.forms||[]).map(x=>x.label).join(' • '))}</span></div>`).join('');
   const caughtSummary=collectionLoaded?`${state.caught}/${state.known} matched forms caught`:'Sync Aniidx to show caught / missing forms';
   const copiesHtml=copies.length?copies.map(w=>`<div class="aniimoOwnedCopy"><b>${esc(w.name||selected.name)} — ${esc(w.form||'Base')}</b><span>${esc((w.abilities||[]).filter(a=>a.type).map(a=>a.type+' Lv'+(Number(a.level)||1)).join(' • ')||'No abilities entered')}</span></div>`).join(''):'<div class="small">No copies of this Aniimo are currently in Imported Roster.</div>';
   root.innerHTML=`<div class="aniimosBrowser">${aniimoSubnav}
     <div class="aniimosBrowserHead">
       <div><div class="v30Title">Aniimo Details</div><div class="v30Sub">Official Wiki forms, Homeland abilities and habitats combined with this profile's caught forms and Imported Roster.</div></div>
       <div class="aniimosBrowseStats">${esc(caughtSummary)}</div>
     </div>
     <div class="aniimosDetailPicker"><label>Aniimo<select id="aniimoDetailSpecies">${options}</select></label></div>
     <div class="aniimoDetailHero">
       <div><div class="aniimoDetailName">#${esc(selected.dex)} · ${esc(selected.name)}</div><div class="small">${selected.forms.length} official form${selected.forms.length===1?'':'s'} · ${copies.length} Imported Roster cop${copies.length===1?'y':'ies'}</div></div>
       <button type="button" data-aniimo-mode="collection">Back to Collection</button>
     </div>
     <div class="sectionTitle">Best Homeland abilities</div>
     <div class="aniimoBestAbilityGrid">${best||'<div class="small">No ability data loaded.</div>'}</div>
     <div class="sectionTitle">Forms</div>
     <div class="aniimoDetailForms">${formCards}</div>
     <div class="sectionTitle">Imported Roster copies</div>
     <div class="aniimoOwnedCopies">${copiesHtml}</div>
     ${copies.length?'<button type="button" id="aniimoDetailsOpenRoster">Open Imported Roster</button>':''}
   </div>`;
   bindAniimoSubnav();
   root.querySelector('#aniimoDetailSpecies')?.addEventListener('change',e=>{aniimosSelectedName=e.target.value;localStorage.setItem('aniimosSelectedName',aniimosSelectedName);renderAniimosTab();});
   root.querySelector('#aniimoDetailsOpenRoster')?.addEventListener('click',()=>setMainTab('roster'));
   return;
 }

 if(aniimosViewMode==='abilities'){
   const bestRankRows=(window.WikiHomeland?.rankAbility?.(aniimosRankAbility,aniimosRankMin)||[]).map(row=>({...row,name:releasedByDex.get(String(row.dex))||row.name}));
   const caughtRankRows=collectionLoaded?(window.WikiHomeland?.speciesList?.()||[]).map(canonicalWikiSpecies).map(ws=>{
     const matching=(ws.forms||[]).map(wf=>({wf,state:wikiFormState(ws.name,wf)}))
       .filter(x=>x.state.caught)
       .map(x=>({wf:x.wf,ability:(x.wf.homelandAbilities||[]).find(a=>a.type===aniimosRankAbility)}))
       .filter(x=>x.ability&&Number(x.ability.level)>=aniimosRankMin);
     if(!matching.length)return null;
     const level=Math.max(...matching.map(x=>Number(x.ability.level)||0));
     const best=matching.filter(x=>Number(x.ability.level)===level);
     return {dex:ws.dex,name:ws.name,type:aniimosRankAbility,level,forms:best.map(x=>({slug:x.wf.slug,label:x.wf.label,url:x.wf.url}))};
   }).filter(Boolean).sort((a,b)=>b.level-a.level||a.name.localeCompare(b.name)):[];
   const rankRows=aniimosRankScope==='caught'?caughtRankRows:bestRankRows;
   const rankCard=row=>{
     const bestForm=row.forms?.[0]||null;
     const localForms=formEntriesFor(row.name);
     const targetNorm=window.WikiHomeland?.normalize?.(bestForm?.label||'')||'';
     const local=localForms.find(f=>(window.WikiHomeland?.normalize?.(f.label)||'')===targetNorm)||localForms[0]||null;
     const apps=local?.apps||[];
     const appearance=apps.includes('Normal')?'Normal':(apps[0]||'');
     const src=local?imagePath(local.assetName,local.id,appearance):'';
     const wikiSpecies=(window.WikiHomeland?.speciesList?.()||[]).find(ws=>String(ws.dex)===String(row.dex))||window.WikiHomeland?.speciesByName?.(row.name);
     const bestFull=wikiSpecies?.bestAbilities?.find(a=>a.type===row.type&&Number(a.level)===Number(row.level));
     const formLabels=(bestFull?.forms||row.forms||[]).map(f=>f.label).join(' • ')||'Unknown form';
     const habitatSet=new Set();
     for(const fref of (bestFull?.forms||row.forms||[])){
       const wf=wikiSpecies?.forms?.find(f=>f.slug===fref.slug);
       for(const h of (wf?.habitats||[]))habitatSet.add(h);
     }
     const habitats=[...habitatSet].join(' • ');
     const bestCaught=collectionLoaded&&(bestFull?.forms||row.forms||[]).some(fref=>{
       const wf=wikiSpecies?.forms?.find(f=>f.slug===fref.slug);
       return wf?wikiFormState(row.name,wf).caught:false;
     });
     const caughtBadge=!collectionLoaded?'<span class="collectionBadge neutral">Sync to check</span>':bestCaught?'<span class="collectionBadge caught">Caught ✓</span>':'<span class="collectionBadge missing">Best form missing</span>';
     return `<div class="aniimoAbilityRankCard">
       <div class="aniimoAbilityRankNum">Lv${row.level}</div>
       <div class="aniimoAbilityRankImage">${src?`<img src="${esc(src)}" alt="${esc(row.name)}" loading="lazy" decoding="async">`:`<span>${esc(String(row.name||'?').slice(0,2).toUpperCase())}</span>`}</div>
       <div class="aniimoAbilityRankInfo">
         <div class="aniimoAbilityRankName">${row.dex?'#'+esc(row.dex)+' · ':''}${esc(row.name)}</div>
         <div><b>${esc(row.type)} Lv${row.level}</b></div>
         <div class="small">${aniimosRankScope==='caught'?'Best caught form':'Best form'}${(bestFull?.forms?.length||row.forms?.length||0)>1?'s':''}: ${esc(formLabels)}</div>
         ${habitats?`<div class="small">Habitats: ${esc(habitats)}</div>`:''}
         <div class="aniimoAbilityRankActions">${caughtBadge}<button type="button" data-aniimo-details="${esc(row.name)}">Details</button></div>
       </div>
     </div>`;
   };
   root.innerHTML=`<div class="aniimosBrowser">${aniimoSubnav}
     <div class="aniimosBrowserHead">
       <div><div class="v30Title">Homeland Ability Rankings</div><div class="v30Sub">Smart-ranked from the official Aniimo Wiki. Each Aniimo is ranked by the highest level this ability reaches across all of its forms, with the form(s) that provide that maximum shown below.</div></div>
       <div class="aniimosBrowseStats">${wikiSummary.counts?.species||0} species · ${wikiSummary.counts?.forms||0} forms</div>
     </div>
     <div class="aniimosBrowseTools">
       <label class="aniimosToolLabel">Home Ability<select id="aniimosRankAbility">${wikiTypes.map(x=>`<option value="${esc(x.type)}"${x.type===aniimosRankAbility?' selected':''}>${esc(x.type)}</option>`).join('')}</select></label>
       <label class="aniimosToolLabel">Minimum level<select id="aniimosRankMin">
         ${[1,2,3,4].map(n=>`<option value="${n}"${n===aniimosRankMin?' selected':''}>Lv${n}+</option>`).join('')}
       </select></label>
       <label class="aniimosToolLabel">Ranking<select id="aniimosRankScope">
         <option value="all"${aniimosRankScope==='all'?' selected':''}>Best Possible</option>
         <option value="caught"${aniimosRankScope==='caught'?' selected':''}>My Caught Forms</option>
       </select></label>
       <div class="wikiReferenceStatus">${wikiSummary.scrapedAt?`Official Wiki snapshot: ${esc(new Date(wikiSummary.scrapedAt).toLocaleDateString())}`:'Official Wiki reference unavailable'}${wikiSummary.warnings?.length?` · ${wikiSummary.warnings.length} warning(s)`:''}</div>
     </div>
     <div class="aniimoAbilityRankSummary"><b>${rankRows.length}</b> Aniimo reach ${esc(aniimosRankAbility)} Lv${aniimosRankMin}+ ${aniimosRankScope==='caught'?'using forms you have caught':'across all official forms'}${aniimosRankScope==='caught'&&!collectionLoaded?' — sync Aniidx to populate this view':''}</div>
     <div class="aniimoAbilityRankGrid">${rankRows.length?rankRows.map(rankCard).join(''):'<div class="fullCard">No official Wiki matches for this filter.</div>'}</div>
   </div>`;
   bindAniimoSubnav();
   root.querySelector('#aniimosRankAbility')?.addEventListener('change',e=>{aniimosRankAbility=e.target.value;localStorage.setItem('aniimosRankAbility',aniimosRankAbility);renderAniimosTab();});
   root.querySelector('#aniimosRankMin')?.addEventListener('change',e=>{aniimosRankMin=Number(e.target.value)||1;localStorage.setItem('aniimosRankMin',String(aniimosRankMin));renderAniimosTab();});
   root.querySelector('#aniimosRankScope')?.addEventListener('change',e=>{aniimosRankScope=e.target.value;localStorage.setItem('aniimosRankScope',aniimosRankScope);renderAniimosTab();});
   return;
 }
 root.dataset.imageFit=aniimosImageFit;
 root.dataset.imageSize=aniimosImageSize;
 root.innerHTML=`<div class="aniimosBrowser">${aniimoSubnav}
   <div class="aniimosBrowserHead">
     <div><div class="v30Title">Aniimo Collection</div><div class="v30Sub">One card per official Aniimo species. Caught / missing status comes from your Aniidx collection sync; forms, Homeland abilities and habitats come from the official Wiki reference.</div></div>
     <div class="aniimosBrowseStats">${collectionRows.length} shown / ${collectionBase.length} species${collectionLoaded?` · ${collectionCaughtSpecies} caught · ${collectionComplete} complete`:''}</div>
   </div>
   <div class="aniimosBrowseTools">
     <input id="aniimosBrowseSearch" value="${esc(aniimosBrowseQuery)}" placeholder="Search Aniimo name or Dex #">
     <label class="aniimosToolLabel">Collection<select id="aniimosCollectionFilter" ${collectionLoaded?'':'disabled'}>
       <option value="all"${aniimosCollectionFilter==='all'?' selected':''}>All</option>
       <option value="caught"${aniimosCollectionFilter==='caught'?' selected':''}>Caught</option>
       <option value="missing"${aniimosCollectionFilter==='missing'?' selected':''}>Missing Forms</option>
       <option value="complete"${aniimosCollectionFilter==='complete'?' selected':''}>Complete</option>
       <option value="missing-prismana"${aniimosCollectionFilter==='missing-prismana'?' selected':''}>Missing Prismana</option>
     </select></label>
     <label class="aniimosToolLabel">Image fit
       <select id="aniimosImageFit">
         <option value="contain"${aniimosImageFit==='contain'?' selected':''}>Fit whole image</option>
         <option value="cover"${aniimosImageFit==='cover'?' selected':''}>Fill frame</option>
       </select>
     </label>
     <label class="aniimosToolLabel">Image size
       <select id="aniimosImageSize">
         <option value="small"${aniimosImageSize==='small'?' selected':''}>Small</option>
         <option value="medium"${aniimosImageSize==='medium'?' selected':''}>Medium</option>
         <option value="large"${aniimosImageSize==='large'?' selected':''}>Large</option>
       </select>
     </label>
   </div>
   ${collectionLoaded?'':'<div class="collectionSyncNotice">Import / Sync Aniidx on Dashboard to turn on caught / missing tracking.</div>'}
   <div class="aniimosGrid">${collectionRows.map(s=>{
     const forms=formEntriesFor(s.name);
     const firstForm=forms[0]||null;
     const firstApps=firstForm?.apps||[];
     const firstAppearance=firstApps.includes('Normal')?'Normal':(firstApps[0]||'');
     const firstSrc=firstForm?imagePath(firstForm.assetName,firstForm.id,firstAppearance):'';
     const formOpts=forms.length?forms.map((fm,i)=>`<option value="${esc(fm.key)}"${i===0?' selected':''}>${esc(fm.label)}</option>`).join(''):'<option value="">No local images</option>';
     const appOpts=firstApps.map(a=>`<option value="${esc(a)}"${a===firstAppearance?' selected':''}>${esc(appearanceLabel(a))}</option>`).join('');
     const st=s.collectionState;
     const collectionText=!collectionLoaded?'Sync to track':st.known?`${st.caught}/${st.known} forms caught`:'No matched form IDs';
     const collectionClass=!collectionLoaded?'neutral':st.complete?'caught':st.caught?'partial':'missing';
     const status=`<span class="collectionBadge ${collectionClass}">${esc(collectionText)}</span>`;
     return `<div class="aniimoBrowseCard" data-aniimo-name="${esc(s.name)}" data-form-key="${esc(firstForm?.key||'')}" data-dex="${esc(s.dex||'')}" data-stage="${esc(s.stage||'')}">
       <button type="button" class="aniimoBrowseImage aniimoPreviewOpen" data-preview-open title="View ${esc(s.name)} larger">${firstSrc?`<img src="${esc(firstSrc)}" alt="${esc(s.name)}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="aniimoBrowseFallback" style="display:none">${esc(String(s.name||'?').slice(0,2).toUpperCase())}</span>`:`<span class="aniimoBrowseFallback">${esc(String(s.name||'?').slice(0,2).toUpperCase())}</span>`}<span class="aniimoPreviewBadge">↗</span></button>
       <div class="aniimoBrowseInfo"><div class="aniimoBrowseName">${s.dex?'#'+esc(s.dex)+' · ':''}${esc(s.name)}</div><div class="aniimoCollectionCardStatus">${status}</div>
       ${forms.length>1?`<label class="aniimoSelectLabel">Form<select class="aniimoFormSelect" data-aniimo-form-select>${formOpts}</select></label>`:''}
       <label class="aniimoSelectLabel">Appearance<select class="aniimoAppearanceSelect" data-aniimo-appearance-select ${firstApps.length?'':'disabled'}>${appOpts}</select></label>
       <div class="aniimoCollectionActions"><button type="button" class="aniimoPreviewButton" data-preview-open>View Larger</button><button type="button" data-aniimo-details="${esc(s.name)}">Details</button></div>
       <div class="small aniimoImageCount">${forms.length>1?forms.length+' image forms · ':''}${firstApps.length?firstApps.length+' looks on selected form':''}</div></div>
     </div>`;
   }).join('')}</div>
 </div>
 <div class="aniimoModal" id="aniimoPreviewModal" aria-hidden="true" tabindex="-1">
   <div class="aniimoModalBackdrop" data-modal-close></div>
   <div class="aniimoModalPanel" role="dialog" aria-modal="true" aria-labelledby="aniimoModalTitle">
     <button type="button" class="aniimoModalClose" data-modal-close aria-label="Close">×</button>
     <div class="aniimoModalImageWrap"><img id="aniimoModalImage" alt=""></div>
     <div class="aniimoModalControls">
       <div class="aniimoModalTitle" id="aniimoModalTitle"></div>
       <div class="small" id="aniimoModalMeta"></div>
       <label class="aniimoSelectLabel" id="aniimoModalFormWrap">Form<select id="aniimoModalForm"></select></label>
       <label class="aniimoSelectLabel">Appearance<select id="aniimoModalAppearance"></select></label>
       <div class="aniimoModalNav"><button type="button" id="aniimoModalPrev">← Previous</button><span class="small" id="aniimoModalCounter"></span><button type="button" id="aniimoModalNext">Next →</button></div>
       <label class="aniimoSelectLabel">Large image fit<select id="aniimoModalFit"><option value="contain">Fit whole image</option><option value="cover">Fill frame</option></select></label>
       <a class="aniimoOpenOriginal" id="aniimoOpenOriginal" target="_blank" rel="noopener">Open Original Image</a>
     </div>
   </div>
 </div>`;
 bindAniimoSubnav();
 const search=root.querySelector('#aniimosBrowseSearch');
 if(search)search.addEventListener('input',e=>{aniimosBrowseQuery=e.target.value;renderAniimosTab();});
 root.querySelector('#aniimosCollectionFilter')?.addEventListener('change',e=>{aniimosCollectionFilter=e.target.value;localStorage.setItem('aniimosCollectionFilter',aniimosCollectionFilter);renderAniimosTab();});
 root.querySelector('#aniimosImageFit')?.addEventListener('change',e=>{aniimosImageFit=e.target.value;localStorage.setItem('aniimosImageFit',aniimosImageFit);root.dataset.imageFit=aniimosImageFit;});
 root.querySelector('#aniimosImageSize')?.addEventListener('change',e=>{aniimosImageSize=e.target.value;localStorage.setItem('aniimosImageSize',aniimosImageSize);root.dataset.imageSize=aniimosImageSize;});

 const modal=root.querySelector('#aniimoPreviewModal');
 const modalImg=root.querySelector('#aniimoModalImage');
 const modalTitle=root.querySelector('#aniimoModalTitle');
 const modalMeta=root.querySelector('#aniimoModalMeta');
 const modalForm=root.querySelector('#aniimoModalForm');
 const modalFormWrap=root.querySelector('#aniimoModalFormWrap');
 const modalAppearance=root.querySelector('#aniimoModalAppearance');
 const modalCounter=root.querySelector('#aniimoModalCounter');
 const modalOriginal=root.querySelector('#aniimoOpenOriginal');
 const modalFit=root.querySelector('#aniimoModalFit');
 let modalCard=null;

 const cardState=card=>{
   const name=card.dataset.aniimoName||'';
   const forms=formEntriesFor(name);
   const formSel=card.querySelector('[data-aniimo-form-select]');
   const appSel=card.querySelector('[data-aniimo-appearance-select]');
   const key=formSel?.value||card.dataset.formKey||forms[0]?.key||'';
   const form=forms.find(x=>x.key===key)||forms[0]||null;
   const apps=form?.apps||[];
   const appearance=appSel?.value||apps[0]||'';
   return {forms,formSel,appSel,key,form,apps,appearance};
 };
 const syncCardImage=card=>{
   const st=cardState(card);
   card.dataset.formKey=st.key;
   const img=card.querySelector('.aniimoBrowseImage img');
   const src=st.form?imagePath(st.form.assetName,st.form.id,st.appearance):'';
   if(img&&src){img.style.display='';img.src=src;}
   const count=card.querySelector('.aniimoImageCount');
   if(count){const totalForms=st.forms.length;count.textContent=`${totalForms>1?totalForms+' image forms · ':''}${st.apps.length} looks on selected form`;}
 };
 const syncModal=()=>{
   if(!modalCard)return;
   const st=cardState(modalCard);
   const src=st.form?imagePath(st.form.assetName,st.form.id,st.appearance):'';
   modalImg.src=src;modalImg.alt=modalCard.dataset.aniimoName||'Aniimo';
   modalTitle.textContent=(modalCard.dataset.dex?'#'+modalCard.dataset.dex+' · ':'')+(modalCard.dataset.aniimoName||'Aniimo');
   modalMeta.textContent=modalCard.dataset.stage||'';
   modalFormWrap.style.display=st.forms.length>1?'grid':'none';
   modalForm.innerHTML=st.forms.map(fm=>`<option value="${esc(fm.key)}"${fm.key===st.key?' selected':''}>${esc(fm.label)}</option>`).join('');
   modalAppearance.innerHTML=st.apps.map(a=>`<option value="${esc(a)}"${a===st.appearance?' selected':''}>${esc(appearanceLabel(a))}</option>`).join('');
   const ai=Math.max(0,st.apps.indexOf(st.appearance));
   modalCounter.textContent=st.apps.length?`${ai+1} / ${st.apps.length}`:'0 / 0';
   modalOriginal.href=src||'#';
   modalOriginal.classList.toggle('disabled',!src);
 };
 const openModal=card=>{
   if(!card)return;modalCard=card;syncModal();
   modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('aniimoModalOpen');modal.focus();
 };
 const closeModal=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('aniimoModalOpen');modalCard=null;};
 root.querySelectorAll('[data-modal-close]').forEach(b=>b.addEventListener('click',closeModal));
 modal?.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
 modalFit?.addEventListener('change',()=>{modal.dataset.fit=modalFit.value;});
 modal.dataset.fit='contain';
 root.querySelector('#aniimoModalPrev')?.addEventListener('click',()=>{
   if(!modalCard)return;const st=cardState(modalCard);if(!st.apps.length)return;
   const i=(Math.max(0,st.apps.indexOf(st.appearance))-1+st.apps.length)%st.apps.length;
   st.appSel.value=st.apps[i];syncCardImage(modalCard);syncModal();
 });
 root.querySelector('#aniimoModalNext')?.addEventListener('click',()=>{
   if(!modalCard)return;const st=cardState(modalCard);if(!st.apps.length)return;
   const i=(Math.max(0,st.apps.indexOf(st.appearance))+1)%st.apps.length;
   st.appSel.value=st.apps[i];syncCardImage(modalCard);syncModal();
 });
 modalForm?.addEventListener('change',()=>{
   if(!modalCard)return;const st=cardState(modalCard);
   modalCard.dataset.formKey=modalForm.value;
   if(st.formSel)st.formSel.value=modalForm.value;
   const chosen=st.forms.find(x=>x.key===modalForm.value);
   const apps=chosen?.apps||[];
   st.appSel.innerHTML=apps.map(a=>`<option value="${esc(a)}">${esc(appearanceLabel(a))}</option>`).join('');
   st.appSel.disabled=!apps.length;
   syncCardImage(modalCard);syncModal();
 });
 modalAppearance?.addEventListener('change',()=>{
   if(!modalCard)return;const st=cardState(modalCard);
   st.appSel.value=modalAppearance.value;syncCardImage(modalCard);syncModal();
 });

 root.querySelectorAll('.aniimoBrowseCard').forEach(card=>{
   const formSel=card.querySelector('[data-aniimo-form-select]');
   const appSel=card.querySelector('[data-aniimo-appearance-select]');
   formSel?.addEventListener('change',()=>{
     card.dataset.formKey=formSel.value;
     const st=cardState(card);
     const apps=st.apps;
     appSel.innerHTML=apps.map(a=>`<option value="${esc(a)}">${esc(appearanceLabel(a))}</option>`).join('');
     appSel.disabled=!apps.length;syncCardImage(card);
   });
   appSel?.addEventListener('change',()=>syncCardImage(card));
   card.querySelectorAll('[data-preview-open]').forEach(btn=>btn.addEventListener('click',()=>openModal(card)));
 });
}
function renderDatabaseTab(){
 const root=el('databasePane');if(!root)return;
 const ani=catalogEntries(),locks=Object.entries(FAMILY_RECIPE_RULES);
 const ref=window.HomelandData?.validate?.()||{ok:false,issues:['Reference data not loaded'],counts:{}},hc=ref.counts||{};
 const speciesData=window.ANIIMO_SPECIES_DATA||{species:[],evolutionFamilies:[],temporaryTransforms:[]};
 const wiki=window.WikiHomeland?.summary?.()||{counts:{species:0,forms:0,formsWithAbilities:0},warnings:[]};
 const releasedByDex=new Map((speciesData.species||[]).map(x=>[String(x.dex),x.name]));
 const wikiNames=new Set((window.WikiHomeland?.speciesList?.()||[]).map(x=>releasedByDex.get(String(x.dex))||x.name));
 const officialSpecies=window.WikiHomeland?.speciesList?.()||[];
 const officialDex=new Map(officialSpecies.map(x=>[String(Number(x.dex)),x]));
 // These two are confirmed released in the roster and family gates; only Wiki cache coverage is absent.
 const confirmedWithoutWiki=new Set(['030|Somniwing','10001|Irisalis']);
 const knownWikiGaps=(speciesData.species||[]).filter(x=>confirmedWithoutWiki.has(String(x.dex)+'|'+x.name)&&!officialDex.has(String(Number(x.dex))));
 const releasedMissingWiki=(speciesData.species||[]).filter(x=>!officialDex.has(String(Number(x.dex)))&&!confirmedWithoutWiki.has(String(x.dex)+'|'+x.name));
 const officialMissingRoster=officialSpecies.filter(x=>!(speciesData.species||[]).some(y=>Number(y.dex)===Number(x.dex)));
 const noWikiForms=(speciesData.species||[]).filter(x=>{const w=officialDex.get(String(Number(x.dex)));return !!w&&!(w.forms||[]).length;});
 const gatedStations=new Set(locks.map(([k])=>k.split('|')[0]));
 const familyLabelFor=name=>{
   const known=familyIdForCatalog({name});
   if(known)return (ANIIMO_FAMILIES[known]||WORKER_FAMILIES[known]||{}).label||known;
   const evo=(speciesData.evolutionFamilies||[]).find(f=>[...(f.path||[]),...(f.ends||[])].includes(name));
   return evo?evo.key+' evolution family':'—';
 };
 const master=window.HomelandItemCatalog;
 const masterItems=master?.allItems(aniidexImportMeta?.catalog)||[];
 const questCount=window.ANIIMO_QUESTLOG_ITEMS?.counts?.items||0;
 const home=dashboardHomeSnapshot?.(),stored=Object.entries(home?.rawHome?.storage||{}).filter(([,count])=>Number(count)>0);
 const examined=stored.map(([id,count])=>({id,count,record:master?.lookup(id,aniidexImportMeta?.catalog)||{}}));
 const unnamed=examined.filter(x=>!x.record.name),unpriced=examined.filter(x=>x.record.sell==null);
 const unknownFood=(home?.rawHome?.food||[]).filter(x=>master?.lookup(x.item,aniidexImportMeta?.catalog)?.energy==null);
 const itemAuditRows=examined.filter(x=>!x.record.name||x.record.sell==null);
 // Never associate a market listing with an ID until the exact item variant is verified.
 // 4030014 = Colorful Sugarcane, 10,000 HC (confirmed by in-game screenshot).
 // 30,000 HC may describe Huge Colorful Sugarcane, whose ID remains unverified.
 const marketReview=[];
 const priceConflicts=marketReview.map(x=>({...x,local:master?.lookup(x.id,aniidexImportMeta?.catalog)?.sell??null})).filter(x=>x.local!=null&&x.local!==x.market);

 const sourceBadge=c=>c.source==='official-wiki'?'<span class="sourceBadge official">Official Wiki</span>':c.source==='official'?'<span class="sourceBadge official">Official preset</span>':c.source==='verified'?'<span class="sourceBadge">Cross-checked</span>':'<span class="sourceBadge user">Name only</span>';
 root.innerHTML=`<div class="databaseBrowser"><div class="databaseBrowserHead"><div class="v30Title">Database / Reference</div><div class="v30Sub">Offline facility/recipe facts plus the cached official Wiki Aniimo reference. User-entered copy data still overrides catalog defaults.</div><div class="dashboardGrid">
 <div class="metricCard"><div class="label">Planner reference data</div><div class="metric">${ref.ok?'✓':'!'}</div><div class="small">${ref.ok?'Offline facility / recipe data loaded':esc((ref.issues||[]).join(' • '))}</div></div>
 <div class="metricCard"><div class="label">Facilities / recipes</div><div class="metric">${hc.facilities||0} / ${hc.recipes||0}</div><div class="small">${hc.items||0} items • ${hc.plots||0} plots • ${hc.rv||0} RV levels</div></div>
 <div class="metricCard"><div class="label">Official Wiki Aniimo</div><div class="metric">${wiki.counts?.species||0}</div><div class="small">${wiki.counts?.formsWithAbilities||0}/${wiki.counts?.forms||0} forms with Homeland abilities</div></div>
 <div class="metricCard"><div class="label">Recipe records</div><div class="metric">${Object.values(recipeDB).reduce((n,a)=>n+a.length,0)}</div></div>
 <div class="metricCard"><div class="label">Family-gated stations</div><div class="metric">${gatedStations.size}</div><div class="small">${locks.length} station / recipe family rules</div></div>
 <div class="metricCard"><div class="label">Station work rules</div><div class="metric">${Object.keys(STATION_RULES).length}</div></div>
 </div></div><div class="databaseScroll">
 <div class="databaseSection"><div class="sectionTitle">Aniimo species &amp; forms · coverage audit</div>
 <div class="small">Released roster: ${(speciesData.species||[]).length} species · Official Wiki snapshot: ${officialSpecies.length} species and ${wiki.counts?.forms||0} forms. Official Wiki cache: ${esc(window.WikiHomeland?.summary?.().scrapedAt||'unknown')}. Compare by Dex number; updates to the game's released roster require a fresh external reference.</div>
 <div class="small">${releasedMissingWiki.length} other released entries missing from Wiki snapshot · ${knownWikiGaps.length} confirmed released Aniimo awaiting Wiki data · ${officialMissingRoster.length} Wiki species absent from released roster · ${noWikiForms.length} Wiki entries without listed forms.</div>
 <button type="button" id="aniimoSpeciesAuditExport">Download Aniimo coverage CSV</button>
 <div class="tableWrap"><table class="dataTable"><thead><tr><th>Dex</th><th>Aniimo</th><th>Issue</th></tr></thead><tbody>
 ${knownWikiGaps.map(x=>`<tr><td>${esc(x.dex)}</td><td>${esc(x.name)}</td><td>Confirmed released — official Wiki cache missing species/forms</td></tr>`).join('')}
 ${releasedMissingWiki.map(x=>`<tr><td>${esc(x.dex)}</td><td>${esc(x.name)}</td><td>Missing official Wiki reference data / forms</td></tr>`).join('')}
 ${officialMissingRoster.map(x=>`<tr><td>${esc(x.dex)}</td><td>${esc(x.name)}</td><td>Wiki entry not in released roster — verify release</td></tr>`).join('')}
 ${noWikiForms.map(x=>`<tr><td>${esc(x.dex)}</td><td>${esc(x.name)}</td><td>No Wiki forms</td></tr>`).join('')}
 ${knownWikiGaps.length+releasedMissingWiki.length+officialMissingRoster.length+noWikiForms.length?'':'<tr><td colspan="3">No discrepancies between the loaded references.</td></tr>'}
 </tbody></table></div></div>
 <div class="databaseSection"><div class="sectionTitle">Homeland artwork library</div>
 <div class="small">Verified item icons from the Aniimo database sprite sheet. Unmapped catalog entries retain existing artwork fallbacks.</div>
 <details><summary>Browse ${Object.keys(window.AniimoIconAtlas?.byId||{}).length} verified Homeland output icons</summary>
 <div class="homelandIconGallery">${Object.values(window.AniimoIconAtlas?.byId||{}).map(item=>`<div class="homelandIconGalleryTile" title="${esc(item.name)} · ${item.id}">${window.AniimoIconAtlas.html(item.id,42)}<span>${esc(item.name)}</span><small>#${esc(item.id)}</small></div>`).join('')}</div></details></div>
 <div class="databaseSection"><div class="sectionTitle">Home Market price reconciliation</div>
 <div class="small">Public Home Market prices and locally stored HC prices can disagree. Conflicts are flagged without changing inventory totals until the matching item ID and current market value are verified.</div>
 <div class="tableWrap"><table class="dataTable"><thead><tr><th>Item ID</th><th>Item</th><th>Planner HC</th><th>Published Home Market HC</th><th>Reference</th></tr></thead><tbody>${priceConflicts.map(x=>`<tr><td><code>${esc(x.id)}</code></td><td>${esc(x.name)}</td><td>${x.local.toLocaleString()} HC</td><td>${x.market.toLocaleString()} HC</td><td><a href="${esc(x.url)}" target="_blank" rel="noopener">Review source</a></td></tr>`).join('')||'<tr><td colspan="5">No documented discrepancies.</td></tr>'}</tbody></table></div>
 </div>
 <div class="databaseSection"><div class="sectionTitle">All Aniimo items · ID coverage audit</div>
 <div class="small">Available unique item IDs: ${masterItems.length.toLocaleString()} · QuestLog imported IDs: ${questCount.toLocaleString()} · current profile stored IDs: ${examined.length}. Homeland reference is not the complete global game catalog. A missing sell value is unknown, not zero.</div>
 <div class="small">Current profile: ${unnamed.length} unnamed storage IDs · ${unpriced.length} storage IDs without a known sell price · ${unknownFood.length} food slots without verified energy.</div>
 <button type="button" id="itemAuditExportBtn">Download missing-item audit CSV</button>
 <div class="tableWrap"><table class="dataTable"><thead><tr><th>Item ID</th><th>Known name</th><th>Count</th><th>Missing</th></tr></thead><tbody>${itemAuditRows.slice(0,250).map(x=>`<tr><td><code>${esc(x.id)}</code></td><td>${window.AniimoIconAtlas?.html(x.id,23)||''} ${esc(x.record.name||'Unknown')}</td><td>${Number(x.count).toLocaleString()}</td><td>${!x.record.name?'Name ':''}${x.record.sell==null?'Sell price':''}</td></tr>`).join('')||'<tr><td colspan="4">All stored IDs have names and known prices.</td></tr>'}</tbody></table></div>
 </div>
 <div class="databaseSection">
  <div class="sectionTitle">Complete Aniimo evolution roster</div>
  <div class="tableWrap"><table class="dataTable"><thead><tr><th>Evolution line</th><th>Members</th><th>Official Wiki coverage</th></tr></thead><tbody>
  ${speciesData.evolutionFamilies.map(f=>{const members=[...(f.path||[]),...(f.ends||[])];const have=members.filter(n=>wikiNames.has(n)).length;return `<tr><td><b>${esc(f.key)}</b></td><td>${esc((f.path||[]).join(' → '))}${(f.ends||[]).length?' → '+esc((f.ends||[]).join(' / ')):''}</td><td>${have}/${members.length} species</td></tr>`}).join('')}
  </tbody></table></div>
  <div class="small" style="padding-top:6px">Temporary combat transformations are tracked separately: ${speciesData.temporaryTransforms.map(x=>esc(x.from)+' → '+esc(x.to)).join(' • ')}.</div>
 </div>
 <div class="databaseSection databaseAniimoSection">
  <div class="databaseAniimoFixed"><div class="sectionTitle">Aniimo / forms</div><div class="small" style="margin-bottom:7px">Official Wiki forms are used first; legacy presets only fill a gap when the Wiki snapshot has no matching row.</div><div class="tableWrap databaseHeaderWrap"><table class="dataTable databaseHeaderTable"><colgroup><col style="width:14%"><col style="width:22%"><col style="width:28%"><col style="width:36%"></colgroup><thead><tr><th>Aniimo</th><th>Form</th><th>Family</th><th>Home Abilities</th></tr></thead></table></div></div>
  <div class="databaseBodyScroll"><table class="dataTable databaseBodyTable"><colgroup><col style="width:14%"><col style="width:22%"><col style="width:28%"><col style="width:36%"></colgroup><tbody>${ani.map(c=>`<tr><td>${window.AniimoIconAtlas?.character(c.name,22)||''} ${esc(c.name)}</td><td>${esc(c.form||'Base')}</td><td>${esc(familyLabelFor(c.name))}</td><td>${(c.abilities||[]).length?c.abilities.map(a=>esc(a[0])+' Lv'+a[1]).join(' • '):'Not loaded'}</td></tr>`).join('')}</tbody></table></div>
 </div>
 <div class="databaseSection databaseFamilySection">
  <div class="databaseFamilyFixed"><div class="sectionTitle">Family Requirements by Station & Recipe</div><div class="small" style="margin-bottom:7px">These are recipe-specific family gates on certain stations; a station can have different family requirements for different recipes.</div><div class="tableWrap databaseHeaderWrap"><table class="dataTable databaseHeaderTable"><colgroup><col style="width:38%"><col style="width:24%"><col style="width:38%"></colgroup><thead><tr><th>Station / Recipe</th><th>Required family</th><th>Accepted line</th></tr></thead></table></div></div>
  <div class="databaseFamilyBodyScroll"><table class="dataTable databaseBodyTable"><colgroup><col style="width:38%"><col style="width:24%"><col style="width:38%"></colgroup><tbody>${locks.map(([k,v])=>`<tr><td>${esc(k.replace('|',' — '))}</td><td>${esc(WORKER_FAMILIES[v.family]?.label||v.family)}</td><td>${esc((WORKER_FAMILIES[v.family]?.members||[]).join(' / '))}</td></tr>`).join('')}</tbody></table></div>
 </div>
 </div></div>`;
 root.querySelector('#aniimoSpeciesAuditExport')?.addEventListener('click',()=>{
  const csv=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
  const rows=[['dex','name','issue'],...knownWikiGaps.map(x=>[x.dex,x.name,'Confirmed released; Wiki cache lacks species/forms']),...releasedMissingWiki.map(x=>[x.dex,x.name,'Missing Wiki species/forms']),...officialMissingRoster.map(x=>[x.dex,x.name,'Wiki only; verify release']),...noWikiForms.map(x=>[x.dex,x.name,'No Wiki forms'])];
  const blob=new Blob([rows.map(row=>row.map(csv).join(',')).join('\\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='aniimo-species-form-coverage.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 const auditBtn=root.querySelector('#itemAuditExportBtn');
 auditBtn?.addEventListener('click',()=>{
  const lines=['item_id,name,count,missing_name,missing_sell_price,source'];
  const csv=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  for(const x of itemAuditRows)lines.push([x.id,x.record.name||'',x.count,!x.record.name,x.record.sell==null,x.record.source||''].map(csv).join(','));
  const blob=new Blob([lines.join('\\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='aniimo-missing-items.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
}
let activePlanAdviceSection='suggestions';
function setPlanAdviceSection(section){
 if(!['suggestions','advisor','progression'].includes(section))section='suggestions';
 activePlanAdviceSection=section;
 document.querySelectorAll('#planPane [data-plan-section]').forEach(b=>b.classList.toggle('active',b.dataset.planSection===section));
 document.querySelectorAll('#planPane .planAdviceSection').forEach(p=>p.classList.toggle('active',p.id===({suggestions:'planSuggestions',advisor:'planAdvisorHost',progression:'planProgression'}[section])));
}
function renderPlanAdviceTab(){
 renderSuggestionsTab();
 renderProgressionTab();
 setPlanAdviceSection(activePlanAdviceSection);
}
function rawAniidexBundleForView(){
 const meta=aniidexImportMeta||null;if(!meta)return null;
 const rm=meta.rawMeta||{};
 return {
   format:rm.format||'aniimo-homeland-sync-view',
   capturedAt:rm.capturedAt||new Date(meta.importedAt||Date.now()).toISOString(),
   source:rm.source||meta.source||'Aniidx',
   uid:meta.uid||'',
   profile:meta.profile||{},
   homeland:meta.home||{},
   planner:meta.catalog||null,
   warnings:Array.isArray(rm.warnings)?rm.warnings:[]
 };
}
function renderRawJsonTab(){
 const root=el('rawPane');if(!root)return;
 // Full planner renders may replace Raw JSON while the user is still typing.
 // Capture both the text and the selection BEFORE replacing the input.
 const oldInput=root.querySelector('#rawJsonSearch');
 const wasTyping=!!oldInput&&document.activeElement===oldInput;
 const selection=wasTyping?{start:oldInput.selectionStart,end:oldInput.selectionEnd,direction:oldInput.selectionDirection}:null;
 if(oldInput)rawJsonQuery=oldInput.value;
 const bundle=rawAniidexBundleForView();
 if(!bundle){root.innerHTML='<div class="v30Title">Raw JSON</div><div class="v30Sub">No Aniidx sync has been loaded yet.</div><div class="fullCard">Use Dashboard → Import / Sync first. The latest synced profile, Homeland snapshot, and planner reference data will appear here.</div>';return;}
 const full=JSON.stringify(bundle,null,2),lines=full.split('\n');
 const q=String(rawJsonQuery||'').trim().toLowerCase();
 const shown=q?lines.filter(line=>line.toLowerCase().includes(q)):lines;
 root.innerHTML=`<div class="rawJsonBrowser"><div class="rawJsonHead"><div><div class="v30Title">Raw JSON</div><div class="v30Sub">Latest synced Aniidx data retained by the planner. This is a read-only diagnostic/reference view.</div></div><div class="rawJsonActions"><input id="rawJsonSearch" value="${esc(rawJsonQuery)}" placeholder="Search JSON..."><button id="rawJsonCopy">Copy JSON</button><button id="rawJsonDownload">Download JSON</button></div><div class="small">${q?shown.length+' matching line'+(shown.length===1?'':'s')+' • ':''}${lines.length.toLocaleString()} total lines • ${full.length.toLocaleString()} characters</div></div><pre id="rawJsonPre" class="rawJsonPre">${esc(shown.join('\n'))}</pre></div>`;
 const search=root.querySelector('#rawJsonSearch');
 if(search&&wasTyping){
   search.focus({preventScroll:true});
   try{search.setSelectionRange(selection.start,selection.end,selection.direction||'none')}catch(_){}
 }
 if(search)search.addEventListener('input',()=>{
   rawJsonQuery=search.value;
   const query=rawJsonQuery.trim().toLowerCase();
   const matches=query?lines.filter(line=>line.toLowerCase().includes(query)):lines;
   const pre=el('rawJsonPre');if(pre)pre.textContent=matches.join('\n');
   const count=root.querySelector('.rawJsonHead>.small');
   if(count)count.textContent=(query?matches.length+' matching line'+(matches.length===1?'':'s')+' • ':'')+lines.length.toLocaleString()+' total lines • '+full.length.toLocaleString()+' characters';
 });
 const copy=el('rawJsonCopy');if(copy)copy.onclick=async()=>{try{await navigator.clipboard.writeText(full);copy.textContent='Copied ✓';setTimeout(()=>{if(el('rawJsonCopy'))el('rawJsonCopy').textContent='Copy JSON'},1200)}catch{copy.textContent='Copy failed'}};
 const dl=el('rawJsonDownload');if(dl)dl.onclick=()=>{const blob=new Blob([full],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Aniimo_Homeland_'+String(bundle.uid||'sync')+'_raw.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);};
}
function renderV30Views(){renderRightQuickStats();if(activeMainTab==='map')renderHomelandPlannerV2();else if(activeMainTab==='dashboard')renderDashboardTab();else if(activeMainTab==='snapshot')renderHomeSnapshotTab();else if(activeMainTab==='production')renderProductionTab();else if(activeMainTab==='aniimos')renderAniimosTab();else if(activeMainTab==='plan')renderPlanAdviceTab();else if(activeMainTab==='database')renderDatabaseTab();else if(activeMainTab==='raw')renderRawJsonTab();}
