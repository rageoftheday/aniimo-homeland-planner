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
let homelandPlannerMode=localStorage.getItem('homelandPlannerMode')||'overview';
if(!['overview','plot'].includes(homelandPlannerMode))homelandPlannerMode='overview';
let homelandFocusedPlot=Number(localStorage.getItem('homelandFocusedPlot')||1);
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
function homelandMiniObject(o,p,big=false){
 const l=Math.max(0,o.x-p.x),t=Math.max(0,o.y-p.y);
 const title=homelandObjectTitle(o),lv=o.facilityLevel||o.placedLevel||'';
 return `<button type="button" class="hpv2Obj${big?' big':''}" data-hpv2-object="${o.id}" title="${esc(title)}${lv?' · Lv'+lv:''}" style="left:${l/20*100}%;top:${t/15*100}%;width:${Math.min(o.w,20)/20*100}%;height:${Math.min(o.h,15)/15*100}%"><span>${esc((title||o.name||'?').slice(0,1))}</span>${big&&lv?`<b>Lv${lv}</b>`:''}</button>`;
}
function renderHomelandPlannerV2(){
 const map=el('mapPane');if(!map)return;
 let root=el('homelandPlannerV2');
 if(!root){root=document.createElement('div');root.id='homelandPlannerV2';map.insertBefore(root,map.firstChild)}
 const toolbar=map.querySelector('.toolbar'),viewport=el('mapViewport'),legend=map.querySelector('.legend');
 if(toolbar)toolbar.hidden=true;if(viewport)viewport.hidden=true;if(legend)legend.hidden=true;
 const modeBar=`<div class="hpv2ModeBar"><div><b>Homeland Planner</b><span>Overview first · click an open plot to focus its 20×15 workspace.</span></div><div class="hpv2ModeActions"><button class="${homelandPlannerMode==='overview'?'active':''}" onclick="setHomelandPlannerMode('overview')">All Plots</button><button class="${homelandPlannerMode==='plot'?'active':''}" onclick="setHomelandPlannerMode('plot',homelandFocusedPlot)">Plot Editor</button></div></div>`;
 if(homelandPlannerMode==='plot'){
   const n=homelandFocusedPlot,p=homelandPlotDef(n)||homelandPlotDef(1),rows=homelandPlotObjects(n),unlock=HOMELAND_PLOT_UNLOCKS[n]||{};
   root.innerHTML=modeBar+`<div class="hpv2FocusHead"><button onclick="setHomelandPlannerMode('overview')">← All Plots</button><div><h3>Plot ${n} · ${esc(homelandPlotRole(n))}</h3><span>${rows.length} placed object${rows.length===1?'':'s'} · 20×15 squares</span></div><div class="hpv2FocusMeta">RV ${unlock.rv||'—'} · ${Number(unlock.cost||0).toLocaleString()} HC unlock</div></div><div class="hpv2FocusGrid"><div class="hpv2GridLines"></div>${rows.map(o=>homelandMiniObject(o,p,true)).join('')}</div><div class="hpv2FocusFoot"><span>Click a tile to select it in the existing Details inspector.</span></div>`;
 }else{
   const cards=plotDefs.map(p=>{
     const open=isPlotOpen(p.n),rows=homelandPlotObjects(p.n),u=HOMELAND_PLOT_UNLOCKS[p.n]||{},role=homelandPlotRole(p.n);
     if(!open)return `<button class="hpv2PlotCard locked" data-hpv2-locked="${p.n}"><div class="hpv2Lock">🔒</div><b>Plot ${p.n}</b><span>RV ${u.rv||'—'} · ${Number(u.cost||0).toLocaleString()} HC</span></button>`;
     return `<button class="hpv2PlotCard open" data-hpv2-plot="${p.n}"><div class="hpv2PlotTitle"><b>Plot ${p.n}</b><span>${esc(role)}</span></div><div class="hpv2MiniGrid"><div class="hpv2GridLines"></div>${rows.slice(0,50).map(o=>homelandMiniObject(o,p)).join('')}</div><div class="hpv2PlotFoot"><span>${rows.length?rows.length+' placed':'Purchased · nothing planned'}</span><strong>Open ›</strong></div></button>`;
   }).join('');
   root.innerHTML=modeBar+`<div class="hpv2Summary"><div><b>Home Overview</b><span>RV ${rvLevel.value} · ${openPlots.size} / 16 plots open · ${objects.length} placed objects</span></div><div class="hpv2SummaryHint">Locked cards show the reference RV + Home Coin unlock.</div></div><div class="hpv2PlotGrid">${cards}</div>`;
 }
 root.querySelectorAll('[data-hpv2-plot]').forEach(b=>b.addEventListener('click',()=>setHomelandPlannerMode('plot',b.dataset.hpv2Plot)));
 root.querySelectorAll('[data-hpv2-object]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();selected=Number(b.dataset.hpv2Object);render();}));
 root.querySelectorAll('[data-hpv2-locked]').forEach(b=>b.addEventListener('click',()=>{const n=Number(b.dataset.hpv2Locked),u=HOMELAND_PLOT_UNLOCKS[n]||{};b.title=`Plot ${n}: unlock reference RV ${u.rv||'—'}, ${Number(u.cost||0).toLocaleString()} HC`;}));
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
 const boxes=[...document.querySelectorAll('#rightPanel .rosterBox')];if(boxes[0])el('rosterPane').appendChild(boxes[0]);if(boxes[1])el('advisorPane').appendChild(boxes[1]);
 document.querySelectorAll('#mainTabs [data-tab]').forEach(b=>b.addEventListener('click',()=>setMainTab(b.dataset.tab)));
 setMainTab('dashboard');
}
function abilityCoverage(){const out={};for(const a of HOME_ABILITIES)out[a]=0;for(const w of workers.filter(w=>w.active!==false))for(const a of (w.abilities||[]))if(a.type)out[a.type]=(out[a.type]||0)+(Number(a.level)||0);return out}
function familyCoverage(){const out={};for(const [id,f] of Object.entries(WORKER_FAMILIES))out[id]=workers.filter(w=>w.active!==false&&familyForWorker(w)===id).length;return out}
function blockedFamilyJobs(){return activeJobs().filter(j=>j.family&&!workers.some(w=>w.active!==false&&familyForWorker(w)===j.family))}
function renderRightQuickStats(){const root=el('rightQuickStats');if(!root)return;const jobs=activeJobs(),blocked=blockedFamilyJobs(),active=workers.filter(w=>w.active!==false).length;root.innerHTML=`<div class="quickStatRow"><span>Roster</span><b>${active} active / ${workers.length}</b></div><div class="quickStatRow"><span>Active jobs</span><b>${jobs.length}</b></div><div class="quickStatRow"><span>Placed objects</span><b>${objects.length}</b></div>${blocked.length?`<div class="rightAlert">🔒 ${blocked.length} production job${blocked.length===1?'':'s'} blocked by missing family worker.</div>`:'<div class="rightGood">No active family-locked production is blocked.</div>'}`}
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
function renderDashboardTab(){
 const root=el('dashboardPane');if(!root)return;
 const active=workers.filter(w=>w.active!==false).length,cov=abilityCoverage(),blocked=blockedFamilyJobs(),jobs=activeJobs();
 const open=[...openPlots].length,demand={};for(const j of jobs)demand[j.ability]=(demand[j.ability]||0)+(j.rec||1);
 const abilityRows=HOME_ABILITIES.map(a=>{
   const contributors=abilityContributors(a),levels=cov[a]||0,need=demand[a]||0;
   const status=need===0?'No demand':levels<need?'Short':levels===need?'Tight':'Covered';
   const cls=need===0?'':levels<need?'fitBad':levels===need?'fitWarn':'fitGood';
   const hover=contributors.map(x=>`${x.w.name||'Unnamed'} — Lv${x.level}`).join('\n')||'No active Aniimo with this ability';
   const detail=contributors.length?contributors.map(x=>`<button type="button" class="abilityContributor" onclick="setMainTab('roster')" title="Open Imported Roster"><b>${esc(x.w.name||'Unnamed')}</b><span>${esc(x.w.form||'Base')} · Lv${x.level}</span></button>`).join(''):'<span class="small">No active Imported Roster Aniimo have this ability.</span>';
   return `<tr><td><b>${esc(a)}</b></td><td><button type="button" class="abilityCountBtn" title="${esc(hover)}" onclick="toggleAbilityContributors('${esc(a)}')">${contributors.length} Aniimo</button></td><td>${levels}</td><td>${need||'—'}</td><td class="${cls}">${status}</td></tr><tr class="abilityContributorRow" data-ability-detail="${esc(a)}" hidden><td colspan="5"><div class="abilityContributorList"><div class="small"><b>${esc(a)} contributors</b> — highest level first</div><div class="abilityContributorGrid">${detail}</div></div></td></tr>`;
 }).join('');
 root.innerHTML=`<div class="v30Title">Homeland Dashboard</div><div class="v30Sub">Quick health check for this profile. Start with Import / Sync, then use Suggestions for actionable improvements and Advisor for per-job worker choices.</div>
 <div id="dashboardImport" class="dashboardImportHost"></div>
 <div class="dashboardGrid">
  <div class="metricCard"><div class="label">RV</div><div class="metric">${esc(rvLevel.value)}</div><div class="small">${open} open production plots</div></div>
  <div class="metricCard"><div class="label">Production Zone</div><div class="metric">${active}</div><div class="small">${workers.length} Aniimo entered</div></div>
  <div class="metricCard"><div class="label">Active jobs</div><div class="metric">${jobs.length}</div><div class="small">stations/recipes needing workers</div></div>
  <div class="metricCard"><div class="label">Family blocks</div><div class="metric">${blocked.length}</div><div class="small">locked recipes missing an accepted family</div></div>
 </div>
 <div class="sectionTitle">Home Ability Distribution</div>
 <div class="small" style="margin-bottom:8px">Aniimo count matches the game-style distribution. Total levels adds the ability levels from your active Imported Roster. Hover a count for names, or click it to expand the contributors.</div>
 <div class="tableWrap"><table class="dataTable abilityDistributionTable"><thead><tr><th>Ability</th><th>Aniimo</th><th>Total levels</th><th>Current job demand</th><th>Status</th></tr></thead><tbody>${abilityRows}</tbody></table></div>`;
 renderImportTab('dashboardImport',true);
}
function renderProductionTab(){const root=el('productionPane');if(!root)return;let rows=[];for(const [station,list] of Object.entries(recipeDB)){const sr=STATION_RULES[station]||{};for(const r of list)rows.push({station,r,sr})}rows.sort((a,b)=>a.station.localeCompare(b.station)||((a.r.rv||0)-(b.r.rv||0)));root.innerHTML=`<div class="productionBrowser"><div class="productionBrowserHead"><div class="v30Title">Recipes</div><div class="v30Sub">Full recipe browser for the loaded offline database. RV and module-aware production calculations continue to use the selected stations on the Homeland Planner.</div><div class="filterBar"><input id="prodSearch" placeholder="Search station, recipe or ingredient..."><select id="prodRvFilter"><option value="all">All RV levels</option><option value="current">Available at current RV</option></select></div></div><div id="prodRecipeTable" class="tableWrap productionRecipeTable"></div></div>`;const draw=()=>{const q=normalizeSearch(el('prodSearch').value),cur=el('prodRvFilter').value;const f=rows.filter(x=>(cur!=='current'||(x.r.rv||1)<=+rvLevel.value)&&(!q||normalizeSearch(x.station+' '+x.r.name+' '+(x.r.ingredients||'')).includes(q)));el('prodRecipeTable').innerHTML=`<table class="dataTable"><thead><tr><th>Station</th><th>Recipe</th><th>RV</th><th>Ability</th><th>Preferred trait</th><th>Ingredients</th><th>Work</th><th>Sell</th><th>Lock</th></tr></thead><tbody>${f.map(x=>{const fr=FAMILY_RECIPE_RULES[x.station+'|'+x.r.name];return `<tr><td>${esc(x.station)}</td><td><b>${esc(x.r.name)}</b></td><td>${x.r.rv||1}</td><td>${esc(x.sr.ability||'—')} Lv${x.r.rec||1}</td><td>${x.sr.personality?x.sr.personality+' — '+PERSONALITY_NAMES[x.sr.personality]:'—'}</td><td>${esc(x.r.ingredients||'—')}</td><td>${x.r.work||0}</td><td>${Number(x.r.sell||0).toLocaleString()}</td><td>${fr?`🔒 ${esc(WORKER_FAMILIES[fr.family]?.label||fr.family)}`:'—'}</td></tr>`}).join('')}</tbody></table>`};el('prodSearch').addEventListener('input',draw);el('prodRvFilter').addEventListener('change',draw);draw()}
function rankLabel(f){if(!f||!f.eligible)return'Not eligible';if(f.trait&&f.lvl>=4)return'Best';if(f.lvl>=3&&f.trait)return'High';if(f.lvl>=2)return'Medium';return'Low End'}
function renderSuggestionsTab(){const root=el('suggestionsPane');if(!root)return;const jobs=activeJobs(),cov=abilityCoverage(),blocked=blockedFamilyJobs();const demand={};for(const j of jobs)demand[j.ability]=(demand[j.ability]||0)+(j.rec||1);let suggestions=[];for(const a of HOME_ABILITIES){const need=demand[a]||0,have=cov[a]||0;if(need&&have<=need)suggestions.push({pri:have<need?0:1,title:`${a} coverage is ${have<need?'short':'tight'}`,body:`Current active-job demand is about ${need} ability levels; your active roster totals ${have}. Use Imported Roster → By Ability to find ${a} candidates, then compare secondary abilities and personality fit.`})}for(const j of blocked)suggestions.unshift({pri:-1,title:`🔒 ${j.station}${j.recipe?' — '+j.recipe:''} production blocked`,body:`Missing ${WORKER_FAMILIES[j.family]?.label||j.family}. Add one accepted family member to the Production Zone. Preferred personality: ${j.personality?j.personality+' — '+PERSONALITY_NAMES[j.personality]:'none'}.`});for(const j of jobs){const fits=workers.map(w=>({w,f:workerFitForJob(w,j)})).filter(x=>x.f.eligible).sort((a,b)=>b.f.score-a.f.score);if(fits[0]&&!fits[0].f.trait&&j.personality)suggestions.push({pri:2,title:`${j.station}: personality improvement available`,body:`Best current fit is ${fits[0].w.name||'unnamed worker'}, but it does not have ${j.personality} — ${PERSONALITY_NAMES[j.personality]}. The job still works; a matching personality would add the station bonus.`})}suggestions.sort((a,b)=>a.pri-b.pri);root.innerHTML=`<div class="v30Title">Suggestions</div><div class="v30Sub">Actionable coaching based on this profile: blocked production first, then ability shortages, personality opportunities, and roster fit.</div><div class="suggestGrid">${suggestions.length?suggestions.slice(0,24).map((x,i)=>`<div class="fullCard"><h3>${esc(x.title)}</h3><div class="small">${x.body}</div></div>`).join(''):'<div class="fullCard"><h3>No urgent suggestion yet</h3><div class="small">Enter your roster and assign recipes to let the planner find shortages, family locks and personality opportunities.</div></div>'}</div>`}
function renderProgressionTab(){const root=el('progressionPane');if(!root)return;const rv=+rvLevel.value,next=rv+1;const upcoming=catalog.filter(x=>(x.rv||1)===next);root.innerHTML=`<div class="v30Title">Progression</div><div class="v30Sub">RV, module, plot and facility progression using loaded data only.</div><div class="progressGrid"><div class="fullCard"><h3>Current RV</h3><div class="metric">RV ${rv}</div><div class="small">Next: RV ${next}</div></div><div class="fullCard"><h3>Open plots</h3><div class="metric">${openPlots.size}</div><div class="small">Plot access follows what is actually open in your game.</div></div><div class="fullCard"><h3>Next-RV unlocks</h3><div class="small">${upcoming.length?upcoming.map(x=>esc(x.name)).join(' • '):'No loaded facility unlocks for RV '+next+'.'}</div></div></div><div class="sectionTitle">RV Module Levels</div><div class="tableWrap"><table class="dataTable"><thead><tr><th>Module</th><th>Current</th></tr></thead><tbody>${Object.keys(rvModules).map(k=>`<tr><td>${esc(k)}</td><td>Lv ${Number(moduleLevels[k]||0)}</td></tr>`).join('')}</tbody></table></div>`}
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
 const gatedStations=new Set(locks.map(([k])=>k.split('|')[0]));
 const familyLabelFor=name=>{
   const known=familyIdForCatalog({name});
   if(known)return (ANIIMO_FAMILIES[known]||WORKER_FAMILIES[known]||{}).label||known;
   const evo=(speciesData.evolutionFamilies||[]).find(f=>[...(f.path||[]),...(f.ends||[])].includes(name));
   return evo?evo.key+' evolution family':'—';
 };
 const sourceBadge=c=>c.source==='official-wiki'?'<span class="sourceBadge official">Official Wiki</span>':c.source==='official'?'<span class="sourceBadge official">Official preset</span>':c.source==='verified'?'<span class="sourceBadge">Cross-checked</span>':'<span class="sourceBadge user">Name only</span>';
 root.innerHTML=`<div class="databaseBrowser"><div class="databaseBrowserHead"><div class="v30Title">Database / Reference</div><div class="v30Sub">Offline facility/recipe facts plus the cached official Wiki Aniimo reference. User-entered copy data still overrides catalog defaults.</div><div class="dashboardGrid">
 <div class="metricCard"><div class="label">Planner reference data</div><div class="metric">${ref.ok?'✓':'!'}</div><div class="small">${ref.ok?'Offline facility / recipe data loaded':esc((ref.issues||[]).join(' • '))}</div></div>
 <div class="metricCard"><div class="label">Facilities / recipes</div><div class="metric">${hc.facilities||0} / ${hc.recipes||0}</div><div class="small">${hc.items||0} items • ${hc.plots||0} plots • ${hc.rv||0} RV levels</div></div>
 <div class="metricCard"><div class="label">Official Wiki Aniimo</div><div class="metric">${wiki.counts?.species||0}</div><div class="small">${wiki.counts?.formsWithAbilities||0}/${wiki.counts?.forms||0} forms with Homeland abilities</div></div>
 <div class="metricCard"><div class="label">Recipe records</div><div class="metric">${Object.values(recipeDB).reduce((n,a)=>n+a.length,0)}</div></div>
 <div class="metricCard"><div class="label">Family-gated stations</div><div class="metric">${gatedStations.size}</div><div class="small">${locks.length} station / recipe family rules</div></div>
 <div class="metricCard"><div class="label">Station work rules</div><div class="metric">${Object.keys(STATION_RULES).length}</div></div>
 </div></div><div class="databaseScroll">
 <div class="databaseSection">
  <div class="sectionTitle">Complete Aniimo evolution roster</div>
  <div class="tableWrap"><table class="dataTable"><thead><tr><th>Evolution line</th><th>Members</th><th>Official Wiki coverage</th></tr></thead><tbody>
  ${speciesData.evolutionFamilies.map(f=>{const members=[...(f.path||[]),...(f.ends||[])];const have=members.filter(n=>wikiNames.has(n)).length;return `<tr><td><b>${esc(f.key)}</b></td><td>${esc((f.path||[]).join(' → '))}${(f.ends||[]).length?' → '+esc((f.ends||[]).join(' / ')):''}</td><td>${have}/${members.length} species</td></tr>`}).join('')}
  </tbody></table></div>
  <div class="small" style="padding-top:6px">Temporary combat transformations are tracked separately: ${speciesData.temporaryTransforms.map(x=>esc(x.from)+' → '+esc(x.to)).join(' • ')}.</div>
 </div>
 <div class="databaseSection databaseAniimoSection">
  <div class="databaseAniimoFixed"><div class="sectionTitle">Aniimo / forms</div><div class="small" style="margin-bottom:7px">Official Wiki forms are used first; legacy presets only fill a gap when the Wiki snapshot has no matching row.</div><div class="tableWrap databaseHeaderWrap"><table class="dataTable databaseHeaderTable"><colgroup><col style="width:14%"><col style="width:22%"><col style="width:28%"><col style="width:36%"></colgroup><thead><tr><th>Aniimo</th><th>Form</th><th>Family</th><th>Home Abilities</th></tr></thead></table></div></div>
  <div class="databaseBodyScroll"><table class="dataTable databaseBodyTable"><colgroup><col style="width:14%"><col style="width:22%"><col style="width:28%"><col style="width:36%"></colgroup><tbody>${ani.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.form||'Base')}</td><td>${esc(familyLabelFor(c.name))}</td><td>${(c.abilities||[]).length?c.abilities.map(a=>esc(a[0])+' Lv'+a[1]).join(' • '):'Not loaded'}</td></tr>`).join('')}</tbody></table></div>
 </div>
 <div class="databaseSection databaseFamilySection">
  <div class="databaseFamilyFixed"><div class="sectionTitle">Family Requirements by Station & Recipe</div><div class="small" style="margin-bottom:7px">These are recipe-specific family gates on certain stations; a station can have different family requirements for different recipes.</div><div class="tableWrap databaseHeaderWrap"><table class="dataTable databaseHeaderTable"><colgroup><col style="width:38%"><col style="width:24%"><col style="width:38%"></colgroup><thead><tr><th>Station / Recipe</th><th>Required family</th><th>Accepted line</th></tr></thead></table></div></div>
  <div class="databaseFamilyBodyScroll"><table class="dataTable databaseBodyTable"><colgroup><col style="width:38%"><col style="width:24%"><col style="width:38%"></colgroup><tbody>${locks.map(([k,v])=>`<tr><td>${esc(k.replace('|',' — '))}</td><td>${esc(WORKER_FAMILIES[v.family]?.label||v.family)}</td><td>${esc((WORKER_FAMILIES[v.family]?.members||[]).join(' / '))}</td></tr>`).join('')}</tbody></table></div>
 </div>
 </div></div>`;
}
function renderV30Views(){renderRightQuickStats();if(activeMainTab==='map')renderHomelandPlannerV2();else if(activeMainTab==='dashboard')renderDashboardTab();else if(activeMainTab==='production')renderProductionTab();else if(activeMainTab==='aniimos')renderAniimosTab();else if(activeMainTab==='suggestions')renderSuggestionsTab();else if(activeMainTab==='progression')renderProgressionTab();else if(activeMainTab==='database')renderDatabaseTab();}
