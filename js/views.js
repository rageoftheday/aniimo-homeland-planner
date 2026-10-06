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
function renderProductionTab(){const root=el('productionPane');if(!root)return;let rows=[];for(const [station,list] of Object.entries(recipeDB)){const sr=STATION_RULES[station]||{};for(const r of list)rows.push({station,r,sr})}rows.sort((a,b)=>a.station.localeCompare(b.station)||((a.r.rv||0)-(b.r.rv||0)));root.innerHTML=`<div class="productionBrowser"><div class="productionBrowserHead"><div class="v30Title">Recipes</div><div class="v30Sub">Full recipe browser for the loaded offline database. RV and module-aware production calculations continue to use the selected stations on the Homeland Maker.</div><div class="filterBar"><input id="prodSearch" placeholder="Search station, recipe or ingredient..."><select id="prodRvFilter"><option value="all">All RV levels</option><option value="current">Available at current RV</option></select></div></div><div id="prodRecipeTable" class="tableWrap productionRecipeTable"></div></div>`;const draw=()=>{const q=normalizeSearch(el('prodSearch').value),cur=el('prodRvFilter').value;const f=rows.filter(x=>(cur!=='current'||(x.r.rv||1)<=+rvLevel.value)&&(!q||normalizeSearch(x.station+' '+x.r.name+' '+(x.r.ingredients||'')).includes(q)));el('prodRecipeTable').innerHTML=`<table class="dataTable"><thead><tr><th>Station</th><th>Recipe</th><th>RV</th><th>Ability</th><th>Preferred trait</th><th>Ingredients</th><th>Work</th><th>Sell</th><th>Lock</th></tr></thead><tbody>${f.map(x=>{const fr=FAMILY_RECIPE_RULES[x.station+'|'+x.r.name];return `<tr><td>${esc(x.station)}</td><td><b>${esc(x.r.name)}</b></td><td>${x.r.rv||1}</td><td>${esc(x.sr.ability||'—')} Lv${x.r.rec||1}</td><td>${x.sr.personality?x.sr.personality+' — '+PERSONALITY_NAMES[x.sr.personality]:'—'}</td><td>${esc(x.r.ingredients||'—')}</td><td>${x.r.work||0}</td><td>${Number(x.r.sell||0).toLocaleString()}</td><td>${fr?`🔒 ${esc(WORKER_FAMILIES[fr.family]?.label||fr.family)}`:'—'}</td></tr>`}).join('')}</tbody></table>`};el('prodSearch').addEventListener('input',draw);el('prodRvFilter').addEventListener('change',draw);draw()}
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
   const forms=(ws?.forms||[]).map(wf=>({...wikiFormState(ws.name,wf),wiki:wf}));
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
   const wikiSpecies=window.WikiHomeland?.speciesList?.()||[];
   let selected=window.WikiHomeland?.speciesByName?.(aniimosSelectedName)||wikiSpecies[0]||null;
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
   const bestRankRows=window.WikiHomeland?.rankAbility?.(aniimosRankAbility,aniimosRankMin)||[];
   const caughtRankRows=collectionLoaded?(window.WikiHomeland?.speciesList?.()||[]).map(ws=>{
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
     const wikiSpecies=window.WikiHomeland?.speciesByName?.(row.name);
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
     <div><div class="v30Title">All Aniimos</div><div class="v30Sub">Every released Aniimo, plus image-backed unreleased / special entries. Form and appearance choices only show files we actually have.</div></div>
     <div class="aniimosBrowseStats">${species.length} shown / ${visible.length} visible</div>
   </div>
   <div class="aniimosBrowseTools">
     <input id="aniimosBrowseSearch" value="${esc(aniimosBrowseQuery)}" placeholder="Search Aniimo name or Dex #">
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
   <div class="aniimosGrid">${species.map(s=>{
     const forms=formEntriesFor(s.name);
     const firstForm=forms[0]||null;
     const firstApps=firstForm?.apps||[];
     const firstAppearance=firstApps.includes('Normal')?'Normal':(firstApps[0]||'');
     const firstSrc=firstForm?imagePath(firstForm.assetName,firstForm.id,firstAppearance):'';
     const formOpts=forms.length?forms.map((fm,i)=>`<option value="${esc(fm.key)}"${i===0?' selected':''}>${esc(fm.label)}</option>`).join(''):'<option value="">No local images</option>';
     const appOpts=firstApps.map(a=>`<option value="${esc(a)}"${a===firstAppearance?' selected':''}>${esc(appearanceLabel(a))}</option>`).join('');
     const status=s.releaseStatus==='unavailable'?'<span class="sourceBadge user">Unreleased · image available</span>':s.releaseStatus==='image-only'?'<span class="sourceBadge user">Image-only / special</span>':'';
     return `<div class="aniimoBrowseCard" data-aniimo-name="${esc(s.name)}" data-form-key="${esc(firstForm?.key||'')}" data-dex="${esc(s.dex||'')}" data-stage="${esc(s.stage||'')}">
       <button type="button" class="aniimoBrowseImage aniimoPreviewOpen" data-preview-open title="View ${esc(s.name)} larger">${firstSrc?`<img src="${esc(firstSrc)}" alt="${esc(s.name)}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="aniimoBrowseFallback" style="display:none">${esc(String(s.name||'?').slice(0,2).toUpperCase())}</span>`:`<span class="aniimoBrowseFallback">${esc(String(s.name||'?').slice(0,2).toUpperCase())}</span>`}<span class="aniimoPreviewBadge">↗</span></button>
       <div class="aniimoBrowseInfo"><div class="aniimoBrowseName">${s.dex?'#'+esc(s.dex)+' · ':''}${esc(s.name)}</div><div class="small">${esc(s.stage||'')}${status?' · '+status:''}</div>
       ${forms.length>1?`<label class="aniimoSelectLabel">Form<select class="aniimoFormSelect" data-aniimo-form-select>${formOpts}</select></label>`:''}
       <label class="aniimoSelectLabel">Appearance<select class="aniimoAppearanceSelect" data-aniimo-appearance-select ${firstApps.length?'':'disabled'}>${appOpts}</select></label>
       <button type="button" class="aniimoPreviewButton" data-preview-open>View Larger</button>
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
function renderDatabaseTab(){const root=el('databasePane');if(!root)return;const ani=catalogEntries();const forms=ani.filter(x=>(x.abilities||[]).length);const locks=Object.entries(FAMILY_RECIPE_RULES);const ref=window.HomelandData?.validate?.()||{ok:false,issues:['Reference data not loaded'],counts:{}};const hc=ref.counts||{};const speciesData=window.ANIIMO_SPECIES_DATA||{species:[],evolutionFamilies:[],temporaryTransforms:[]};const capturedNames=new Set((window.HomelandData?.raw?.forms||[]).map(x=>x.name));const capturedSpecies=speciesData.species.filter(x=>capturedNames.has(x.name)).length;root.innerHTML=`<div class="databaseBrowser"><div class="databaseBrowserHead"><div class="v30Title">Database / Reference</div><div class="v30Sub">Offline facts currently loaded into this planner. User-entered copy data overrides catalog defaults.</div><div class="dashboardGrid"><div class="metricCard"><div class="label">Reference data</div><div class="metric">${ref.ok?'✓':'!'}</div><div class="small">${ref.ok?'Offline v1 loaded':esc((ref.issues||[]).join(' • '))}</div></div><div class="metricCard"><div class="label">Facilities / recipes</div><div class="metric">${hc.facilities||0} / ${hc.recipes||0}</div><div class="small">${hc.items||0} items • ${hc.plots||0} plots • ${hc.rv||0} RV levels</div></div><div class="metricCard"><div class="label">Released Aniimo</div><div class="metric">${speciesData.species.length}</div><div class="small">${capturedSpecies} with captured Homeland data • ${hc.forms||210} captured forms</div></div><div class="metricCard"><div class="label">Recipe records</div><div class="metric">${Object.values(recipeDB).reduce((n,a)=>n+a.length,0)}</div></div><div class="metricCard"><div class="label">Family-locked recipes</div><div class="metric">${locks.length}</div></div><div class="metricCard"><div class="label">Station work rules</div><div class="metric">${Object.keys(STATION_RULES).length}</div></div></div></div><div class="databaseScroll">
<div class="databaseSection">
  <div class="sectionTitle">Complete Aniimo evolution roster</div>
  <div class="tableWrap"><table class="dataTable"><thead><tr><th>Evolution line</th><th>Members</th><th>Homeland snapshot</th></tr></thead><tbody>
  ${speciesData.evolutionFamilies.map(f=>{const members=[...(f.path||[]),...(f.ends||[])];const have=members.filter(n=>capturedNames.has(n)).length;return `<tr><td><b>${esc(f.key)}</b></td><td>${esc((f.path||[]).join(' → '))}${(f.ends||[]).length?' → '+esc((f.ends||[]).join(' / ')):''}</td><td>${have}/${members.length} species captured</td></tr>`}).join('')}
  </tbody></table></div>
  <div class="small" style="padding-top:6px">Temporary combat transformations are tracked separately: ${speciesData.temporaryTransforms.map(x=>esc(x.from)+' → '+esc(x.to)).join(' • ')}.</div>
</div>
<div class="databaseSection databaseAniimoSection">
  <div class="databaseAniimoFixed"><div class="sectionTitle">Aniimo / forms</div><div class="tableWrap databaseHeaderWrap"><table class="dataTable databaseHeaderTable"><colgroup><col style="width:11%"><col style="width:18%"><col style="width:28%"><col style="width:33%"><col style="width:10%"></colgroup><thead><tr><th>Aniimo</th><th>Form</th><th>Family</th><th>Home Abilities</th><th>Source status</th></tr></thead></table></div></div>
  <div class="databaseBodyScroll"><table class="dataTable databaseBodyTable"><colgroup><col style="width:11%"><col style="width:18%"><col style="width:28%"><col style="width:33%"><col style="width:10%"></colgroup><tbody>${ani.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.form||'Base')}</td><td>${esc((ANIIMO_FAMILIES[c.family]||{}).label||c.family||'—')}</td><td>${(c.abilities||[]).length?c.abilities.map(a=>esc(a[0])+' Lv'+a[1]).join(' • '):'Not loaded'}</td><td>${c.source==='official'?'<span class="sourceBadge official">Official</span>':c.source==='verified'?'<span class="sourceBadge">Cross-checked</span>':'<span class="sourceBadge user">Name only</span>'}</td></tr>`).join('')}</tbody></table></div>
</div>
<div class="databaseSection databaseFamilySection">
  <div class="databaseFamilyFixed"><div class="sectionTitle">Family-locked recipes</div><div class="tableWrap databaseHeaderWrap"><table class="dataTable databaseHeaderTable"><colgroup><col style="width:38%"><col style="width:24%"><col style="width:38%"></colgroup><thead><tr><th>Station / Recipe</th><th>Required family</th><th>Accepted line</th></tr></thead></table></div></div>
  <div class="databaseFamilyBodyScroll"><table class="dataTable databaseBodyTable"><colgroup><col style="width:38%"><col style="width:24%"><col style="width:38%"></colgroup><tbody>${locks.map(([k,v])=>`<tr><td>${esc(k.replace('|',' — '))}</td><td>${esc(WORKER_FAMILIES[v.family]?.label||v.family)}</td><td>${esc((WORKER_FAMILIES[v.family]?.members||[]).join(' / '))}</td></tr>`).join('')}</tbody></table></div>
</div>
</div></div>`}
function renderV30Views(){renderRightQuickStats();if(activeMainTab==='dashboard')renderDashboardTab();else if(activeMainTab==='production')renderProductionTab();else if(activeMainTab==='aniimos')renderAniimosTab();else if(activeMainTab==='suggestions')renderSuggestionsTab();else if(activeMainTab==='progression')renderProgressionTab();else if(activeMainTab==='database')renderDatabaseTab();}
