let aniimosBrowseQuery='';
let aniimosImageFit=localStorage.getItem('aniimosImageFit')||'contain';
let aniimosImageSize=localStorage.getItem('aniimosImageSize')||'medium';
// v30 tab shell and full-screen views
let activeMainTab='map';
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
 setMainTab('map');
}
function abilityCoverage(){const out={};for(const a of HOME_ABILITIES)out[a]=0;for(const w of workers.filter(w=>w.active!==false))for(const a of (w.abilities||[]))if(a.type)out[a.type]=(out[a.type]||0)+(Number(a.level)||0);return out}
function familyCoverage(){const out={};for(const [id,f] of Object.entries(WORKER_FAMILIES))out[id]=workers.filter(w=>w.active!==false&&familyForWorker(w)===id).length;return out}
function blockedFamilyJobs(){return activeJobs().filter(j=>j.family&&!workers.some(w=>w.active!==false&&familyForWorker(w)===j.family))}
function renderRightQuickStats(){const root=el('rightQuickStats');if(!root)return;const jobs=activeJobs(),blocked=blockedFamilyJobs(),active=workers.filter(w=>w.active!==false).length;root.innerHTML=`<div class="quickStatRow"><span>Roster</span><b>${active} active / ${workers.length}</b></div><div class="quickStatRow"><span>Active jobs</span><b>${jobs.length}</b></div><div class="quickStatRow"><span>Placed objects</span><b>${objects.length}</b></div>${blocked.length?`<div class="rightAlert">🔒 ${blocked.length} production job${blocked.length===1?'':'s'} blocked by missing family worker.</div>`:'<div class="rightGood">No active family-locked production is blocked.</div>'}`}
function renderDashboardTab(){const root=el('dashboardPane');if(!root)return;const active=workers.filter(w=>w.active!==false).length,cov=abilityCoverage(),blocked=blockedFamilyJobs(),jobs=activeJobs();const open=[...openPlots].length;const topNeed=HOME_ABILITIES.map(a=>({a,d:jobs.filter(j=>j.ability===a).reduce((n,j)=>n+(j.rec||1),0),have:cov[a]||0})).filter(x=>x.d>0).sort((a,b)=>(a.have-a.d)-(b.have-b.d)).slice(0,5);root.innerHTML=`<div class="v30Title">Homeland Dashboard</div><div class="v30Sub">Quick health check for this profile. Use Suggestions for actionable improvements and Advisor for per-job worker choices.</div><div class="fullCard" style="margin-bottom:10px"><h3 style="margin-top:0">Import / Update Homeland</h3><div class="small">Load RV, plots, Homeland roster, facilities and collection data from an Aniիդex response. Direct UID access may be blocked in local-file mode, so copied-response import is available offline.</div><button style="margin-top:8px" onclick="setMainTab('import')">Open Import / Sync</button></div><div class="dashboardGrid"><div class="metricCard"><div class="label">RV</div><div class="metric">${esc(rvLevel.value)}</div><div class="small">${open} open production plots</div></div><div class="metricCard"><div class="label">Production Zone</div><div class="metric">${active}</div><div class="small">${workers.length} Aniimo entered</div></div><div class="metricCard"><div class="label">Active jobs</div><div class="metric">${jobs.length}</div><div class="small">stations/recipes needing workers</div></div><div class="metricCard"><div class="label">Family blocks</div><div class="metric">${blocked.length}</div><div class="small">locked recipes missing an accepted family</div></div></div><div class="sectionTitle">Tightest current Home Abilities</div><div class="tableWrap"><table class="dataTable"><thead><tr><th>Ability</th><th>Roster levels</th><th>Current job demand</th><th>Status</th></tr></thead><tbody>${topNeed.length?topNeed.map(x=>`<tr><td>${esc(x.a)}</td><td>${x.have}</td><td>${x.d}</td><td class="${x.have<x.d?'fitBad':x.have===x.d?'fitWarn':'fitGood'}">${x.have<x.d?'Short':x.have===x.d?'Tight':'Covered'}</td></tr>`).join(''):'<tr><td colspan="4">Assign recipes/stations to calculate current demand.</td></tr>'}</tbody></table></div>`}
function renderProductionTab(){const root=el('productionPane');if(!root)return;let rows=[];for(const [station,list] of Object.entries(recipeDB)){const sr=STATION_RULES[station]||{};for(const r of list)rows.push({station,r,sr})}rows.sort((a,b)=>a.station.localeCompare(b.station)||((a.r.rv||0)-(b.r.rv||0)));root.innerHTML=`<div class="productionBrowser"><div class="productionBrowserHead"><div class="v30Title">Production / Full Recipe Browser</div><div class="v30Sub">All recipes currently loaded in this offline database. RV and module-aware production calculations continue to use the selected stations on the Map.</div><div class="filterBar"><input id="prodSearch" placeholder="Search station, recipe or ingredient..."><select id="prodRvFilter"><option value="all">All RV levels</option><option value="current">Available at current RV</option></select></div></div><div id="prodRecipeTable" class="tableWrap productionRecipeTable"></div></div>`;const draw=()=>{const q=normalizeSearch(el('prodSearch').value),cur=el('prodRvFilter').value;const f=rows.filter(x=>(cur!=='current'||(x.r.rv||1)<=+rvLevel.value)&&(!q||normalizeSearch(x.station+' '+x.r.name+' '+(x.r.ingredients||'')).includes(q)));el('prodRecipeTable').innerHTML=`<table class="dataTable"><thead><tr><th>Station</th><th>Recipe</th><th>RV</th><th>Ability</th><th>Preferred trait</th><th>Ingredients</th><th>Work</th><th>Sell</th><th>Lock</th></tr></thead><tbody>${f.map(x=>{const fr=FAMILY_RECIPE_RULES[x.station+'|'+x.r.name];return `<tr><td>${esc(x.station)}</td><td><b>${esc(x.r.name)}</b></td><td>${x.r.rv||1}</td><td>${esc(x.sr.ability||'—')} Lv${x.r.rec||1}</td><td>${x.sr.personality?x.sr.personality+' — '+PERSONALITY_NAMES[x.sr.personality]:'—'}</td><td>${esc(x.r.ingredients||'—')}</td><td>${x.r.work||0}</td><td>${Number(x.r.sell||0).toLocaleString()}</td><td>${fr?`🔒 ${esc(WORKER_FAMILIES[fr.family]?.label||fr.family)}`:'—'}</td></tr>`}).join('')}</tbody></table>`};el('prodSearch').addEventListener('input',draw);el('prodRvFilter').addEventListener('change',draw);draw()}
function rankLabel(f){if(!f||!f.eligible)return'Not eligible';if(f.trait&&f.lvl>=4)return'Best';if(f.lvl>=3&&f.trait)return'High';if(f.lvl>=2)return'Medium';return'Low End'}
function renderSuggestionsTab(){const root=el('suggestionsPane');if(!root)return;const jobs=activeJobs(),cov=abilityCoverage(),blocked=blockedFamilyJobs();const demand={};for(const j of jobs)demand[j.ability]=(demand[j.ability]||0)+(j.rec||1);let suggestions=[];for(const a of HOME_ABILITIES){const need=demand[a]||0,have=cov[a]||0;if(need&&have<=need)suggestions.push({pri:have<need?0:1,title:`${a} coverage is ${have<need?'short':'tight'}`,body:`Current active-job demand is about ${need} ability levels; your active roster totals ${have}. Use Roster → By Ability to find ${a} candidates, then compare secondary abilities and personality fit.`})}for(const j of blocked)suggestions.unshift({pri:-1,title:`🔒 ${j.station}${j.recipe?' — '+j.recipe:''} production blocked`,body:`Missing ${WORKER_FAMILIES[j.family]?.label||j.family}. Add one accepted family member to the Production Zone. Preferred personality: ${j.personality?j.personality+' — '+PERSONALITY_NAMES[j.personality]:'none'}.`});for(const j of jobs){const fits=workers.map(w=>({w,f:workerFitForJob(w,j)})).filter(x=>x.f.eligible).sort((a,b)=>b.f.score-a.f.score);if(fits[0]&&!fits[0].f.trait&&j.personality)suggestions.push({pri:2,title:`${j.station}: personality improvement available`,body:`Best current fit is ${fits[0].w.name||'unnamed worker'}, but it does not have ${j.personality} — ${PERSONALITY_NAMES[j.personality]}. The job still works; a matching personality would add the station bonus.`})}suggestions.sort((a,b)=>a.pri-b.pri);root.innerHTML=`<div class="v30Title">Suggestions</div><div class="v30Sub">Actionable coaching based on this profile: blocked production first, then ability shortages, personality opportunities, and roster fit.</div><div class="suggestGrid">${suggestions.length?suggestions.slice(0,24).map((x,i)=>`<div class="fullCard"><h3>${esc(x.title)}</h3><div class="small">${x.body}</div></div>`).join(''):'<div class="fullCard"><h3>No urgent suggestion yet</h3><div class="small">Enter your roster and assign recipes to let the planner find shortages, family locks and personality opportunities.</div></div>'}</div>`}
function renderProgressionTab(){const root=el('progressionPane');if(!root)return;const rv=+rvLevel.value,next=rv+1;const upcoming=catalog.filter(x=>(x.rv||1)===next);root.innerHTML=`<div class="v30Title">Progression</div><div class="v30Sub">RV, module, plot and facility progression. Exact next-RV stock requirements are shown only when loaded into the database; this view will not invent missing costs.</div><div class="progressGrid"><div class="fullCard"><h3>Current RV</h3><div class="metric">RV ${rv}</div><div class="small">Next: RV ${next}</div></div><div class="fullCard"><h3>Open plots</h3><div class="metric">${openPlots.size}</div><div class="small">Manual plot access follows what is actually open in your game.</div></div><div class="fullCard"><h3>Next-RV unlocks</h3><div class="small">${upcoming.length?upcoming.map(x=>esc(x.name)).join(' • '):'No facility unlock entries loaded specifically for RV '+next+'.'}</div></div><div class="fullCard"><h3>Next-RV resource requirements</h3><div class="small fitWarn">Not fully loaded yet — intentionally not guessed.</div></div></div><div class="sectionTitle">RV Module Levels</div><div class="tableWrap"><table class="dataTable"><thead><tr><th>Module</th><th>Current</th></tr></thead><tbody>${Object.keys(rvModules).map(k=>`<tr><td>${esc(k)}</td><td>Lv ${Number(moduleLevels[k]||0)}</td></tr>`).join('')}</tbody></table></div>`}
function renderAniimosTab(){
 const root=el('aniimosPane');if(!root)return;
 const speciesData=window.ANIIMO_SPECIES_DATA||{species:[]};
 const manifest=window.ANIIMO_ASSET_MANIFEST||{aniimoForms:{}};
 const stageIndex=window.ANIIMO_STAGE_INDEX||{};
 const unavailableDex=new Set(['084','085','086','087','088','089','090','091','092','093']);
 const stageNameFor=n=>({Hexxin:'Witchin'}[n]||n);
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
 const roster=(speciesData.species||[]).map(s=>({...s,releaseStatus:unavailableDex.has(String(s.dex))?'unavailable':'released'}));
 const rosterNames=new Set(roster.map(s=>stageNameFor(s.name)));
 for(const imageName of Object.keys(stageIndex)){
   if(!rosterNames.has(imageName)){
     roster.push({dex:'',name:imageName,stage:'',releaseStatus:'image-only'});
   }
 }
 const visible=roster.filter(s=>s.releaseStatus!=='unavailable'||!!actualStageFor(s.name));
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
 root.dataset.imageFit=aniimosImageFit;
 root.dataset.imageSize=aniimosImageSize;
 root.innerHTML=`<div class="aniimosBrowser">
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
     const stageName=stageNameFor(s.name);
     const stageForms=actualStageFor(s.name)||{};
     const ids=Object.keys(stageForms);
     const firstId=ids[0]||'';
     const firstApps=firstId?stageForms[firstId]:[];
     const firstAppearance=firstApps.includes('Normal')?'Normal':(firstApps[0]||'');
     const firstSrc=firstId&&firstAppearance?`assets/aniimo/stage/${stageName}__${firstId}__ThreeQuarter__${firstAppearance}.webp`:'';
     const formOpts=ids.length?ids.map((id,i)=>`<option value="${esc(id)}"${i===0?' selected':''}>${esc(formLabel(s.name,id))}</option>`).join(''):'<option value="">No local images</option>';
     const appOpts=firstApps.map((a,i)=>`<option value="${esc(a)}"${a===firstAppearance?' selected':''}>${esc(appearanceLabel(a))}</option>`).join('');
     const status=s.releaseStatus==='unavailable'?'<span class="sourceBadge user">Unreleased · image available</span>':s.releaseStatus==='image-only'?'<span class="sourceBadge user">Image-only / special</span>':'';
     return `<div class="aniimoBrowseCard" data-aniimo-name="${esc(s.name)}" data-stage-name="${esc(stageName)}">
       <div class="aniimoBrowseImage">${firstSrc?`<img src="${esc(firstSrc)}" alt="${esc(s.name)}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="aniimoBrowseFallback" style="display:none">${esc(String(s.name||'?').slice(0,2).toUpperCase())}</span>`:`<span class="aniimoBrowseFallback">${esc(String(s.name||'?').slice(0,2).toUpperCase())}</span>`}</div>
       <div class="aniimoBrowseInfo"><div class="aniimoBrowseName">${s.dex?'#'+esc(s.dex)+' · ':''}${esc(s.name)}</div><div class="small">${esc(s.stage||'')}${status?' · '+status:''}</div>
       ${ids.length>1?`<label class="aniimoSelectLabel">Form<select class="aniimoFormSelect" data-aniimo-form-select>${formOpts}</select></label>`:''}
       <label class="aniimoSelectLabel">Appearance<select class="aniimoAppearanceSelect" data-aniimo-appearance-select ${firstApps.length?'':'disabled'}>${appOpts}</select></label>
       <div class="small aniimoImageCount">${ids.length>1?ids.length+' image forms · ':''}${firstApps.length?firstApps.length+' looks on selected form':''}</div></div>
     </div>`;
   }).join('')}</div>
 </div>`;
 const search=root.querySelector('#aniimosBrowseSearch');
 if(search)search.addEventListener('input',e=>{aniimosBrowseQuery=e.target.value;renderAniimosTab();});
 root.querySelector('#aniimosImageFit')?.addEventListener('change',e=>{aniimosImageFit=e.target.value;localStorage.setItem('aniimosImageFit',aniimosImageFit);root.dataset.imageFit=aniimosImageFit;});
 root.querySelector('#aniimosImageSize')?.addEventListener('change',e=>{aniimosImageSize=e.target.value;localStorage.setItem('aniimosImageSize',aniimosImageSize);root.dataset.imageSize=aniimosImageSize;});
 root.querySelectorAll('.aniimoBrowseCard').forEach(card=>{
   const formSel=card.querySelector('[data-aniimo-form-select]');
   const appSel=card.querySelector('[data-aniimo-appearance-select]');
   const img=card.querySelector('.aniimoBrowseImage img');
   const count=card.querySelector('.aniimoImageCount');
   const stageName=card.dataset.stageName;
   const data=stageIndex[stageName]||{};
   const updateImage=()=>{
     const id=formSel?.value||'',a=appSel?.value||'';
     if(img&&id&&a){img.style.display='';img.src=`assets/aniimo/stage/${stageName}__${id}__ThreeQuarter__${a}.webp`;}
     if(count&&id){const totalForms=Object.keys(data).length,apps=data[id]||[];count.textContent=`${totalForms>1?totalForms+' image forms · ':''}${apps.length} looks on selected form`;}
   };
   formSel?.addEventListener('change',()=>{
     const apps=data[formSel.value]||[];
     appSel.innerHTML=apps.map(a=>`<option value="${esc(a)}">${esc(appearanceLabel(a))}</option>`).join('');
     appSel.disabled=!apps.length;updateImage();
   });
   appSel?.addEventListener('change',updateImage);
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
function renderV30Views(){renderRightQuickStats();if(activeMainTab==='dashboard')renderDashboardTab();else if(activeMainTab==='production')renderProductionTab();else if(activeMainTab==='aniimos')renderAniimosTab();else if(activeMainTab==='suggestions')renderSuggestionsTab();else if(activeMainTab==='progression')renderProgressionTab();else if(activeMainTab==='database')renderDatabaseTab();else if(activeMainTab==='import')renderImportTab();}
