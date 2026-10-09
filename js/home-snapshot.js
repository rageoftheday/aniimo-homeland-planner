// Dedicated live Homeland Snapshot tab.
(function(){
  let productionGroupMode='grouped';
  let productionSort='item';
  function catalogParts(){
    const live=aniidexImportMeta?.catalog||null;
    const embedded=typeof EMBEDDED_ANIIDEX_CATALOG!=='undefined'?EMBEDDED_ANIIDEX_CATALOG:null;
    const liveHub=live?.hub||live?.homelandHub||live?.homeland||{};
    const embeddedHub=embedded?.hub||{};
    return {
      liveFacts:liveHub?.facts||live?.facts||{},
      liveText:live?.text||live?.homelandText||live?.siteText||liveHub?.text||{},
      embeddedFacts:embeddedHub?.facts||{},
      embeddedText:embedded?.text||embeddedHub?.text||{}
    };
  }
  function questlogItem(id){
    return window.ANIIMO_QUESTLOG_ITEMS?.byId?.[String(id??'')]||null;
  }
  function itemFact(id){
    const key=String(id??''),p=catalogParts();
    return p.liveFacts?.items?.[key]??p.liveFacts?.items?.[Number(key)]??p.embeddedFacts?.items?.[key]??p.embeddedFacts?.items?.[Number(key)]??null;
  }
  function itemName(id){
    const key=String(id??'');
    const unified=window.HomelandItemCatalog?.lookup(key,aniidexImportMeta?.catalog);
    if(unified?.name)return unified.name;
    const egg=window.ANIIMO_EGG_REFERENCE?.entries?.[key];
    if(egg?.name)return egg.name;
    return key?'Item '+key:'Unknown item';
  }
  function itemSellValue(id){
    const item=window.HomelandItemCatalog?.lookup(id,aniidexImportMeta?.catalog);
    // Confirmed non-sellable is an effective storage value of 0 HC, not an unknown price.
    if(item?.nonSellable===true)return 0;
    return item?.sell??null;
  }
  function homeCoin(n){return Number(n||0).toLocaleString()+' HC'}
  function foodEnergy(id){
    return window.HomelandItemCatalog?.lookup(id,aniidexImportMeta?.catalog)?.energy??null;
  }
  function formatReserveMinutes(totalMinutes){
    if(!Number.isFinite(totalMinutes)||totalMinutes<=0)return '—';
    const m=Math.floor(totalMinutes),d=Math.floor(m/1440),h=Math.floor((m%1440)/60),n=m%60;
    return [d?d+'d':'',h?h+'h':'',n?n+'m':''].filter(Boolean).join(' ');
  }
  function remaining(sec){
    const ms=Number(sec||0)*1000-Date.now();if(ms<=0)return 'Ready now';
    const m=Math.max(1,Math.ceil(ms/60000)),d=Math.floor(m/1440),h=Math.floor((m%1440)/60),n=m%60;
    return [d?d+'d':'',h?h+'h':'',n?n+'m':''].filter(Boolean).join(' ');
  }
  function hatchAt(sec){
    const ms=Number(sec||0)*1000;return ms?new Date(ms).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Unknown';
  }
  function abilityTable(){
    const cov=abilityCoverage(),jobs=activeJobs(),demand={},live=dashboardLiveAbilityUsage(),synced=!!aniidexImportMeta;
    for(const j of jobs)demand[j.ability]=(demand[j.ability]||0)+(j.rec||1);
    const rows=HOME_ABILITIES.map(a=>{
      const c=abilityContributors(a),levels=cov[a]||0,planned=demand[a]||0,use=live[a]||{workers:0,levels:0,names:[]};
      const status=use.workers>0?'Working now':planned>0?(levels<planned?'Planner short':levels===planned?'Planner tight':'Planner covered'):'Idle';
      const cls=use.workers>0?'fitGood':planned>0?(levels<planned?'fitBad':levels===planned?'fitWarn':'fitGood'):'';
      const liveText=use.workers?use.workers+' working • '+use.levels+' levels in use':synced?'0 working':'Not synced';
      const plannedText=planned?planned+' planned level'+(planned===1?'':'s'):'—';
      return '<tr><td><b>'+esc(a)+'</b></td><td>'+c.length+' Aniimo</td><td>'+levels+'</td><td><b>'+esc(liveText)+'</b><div class="small">Planner: '+esc(plannedText)+'</div></td><td class="'+cls+'">'+status+'</td></tr>';
    }).join('');
    return '<section class="snapshotSection"><div class="sectionTitle">Home Ability Distribution</div><div class="small snapshotSectionIntro">Live work comes from the latest Aniidx assignments. Planner demand stays separate.</div><div class="tableWrap"><table class="dataTable"><thead><tr><th>Ability</th><th>Aniimo</th><th>Total levels</th><th>Live work / planner demand</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>';
  }
  function renderHomeSnapshotTab(){
    const root=el('snapshotPane');if(!root)return;
    const h=dashboardHomeSnapshot();
    if(!h.meta){root.innerHTML='<div class="v30Title">Home Snapshot</div><div class="homeSnapshotEmpty"><b>No synced Homeland snapshot yet.</b><span>Use Dashboard → Import / Sync first.</span></div>';return}
    const icon=(id,size=22)=>window.AniimoIconAtlas?.html(id,size)||'';
    const raw=h.rawHome||{},pc=h.profileHome||{},sc=raw.comfort||{},eggs=Array.isArray(raw.eggs)?raw.eggs:[],food=Array.isArray(raw.food)?raw.food:[],queues=Array.isArray(raw.crops)?raw.crops:[],storage=raw.storage||{},visitors=Array.isArray(raw.visitors)?raw.visitors:[];
    const captured=h.captured?formatAniidexSyncTime(Number(h.captured)>1e12?Number(h.captured):Number(h.captured)*1000):'Unknown';
    const mods=Object.entries(pc.rv_modules||{}).filter(([,v])=>Number(v)>0).length;
    const eggRows=eggs.map(e=>{
      const id=String(e.item??''),ref=window.ANIIMO_EGG_REFERENCE?.entries?.[id]||{};
      return '<tr><td><b>'+icon(id,22)+esc(ref.name||itemName(id))+'</b>'+(ref.guarantee?'<div class="small">'+esc(ref.guarantee)+' guaranteed</div>':'')+'</td><td><code>'+esc(id)+'</code></td><td>'+String(e.piece??'—')+'</td><td>'+esc(hatchAt(e.ends))+'</td><td data-egg-end="'+String(e.ends||0)+'">'+esc(remaining(e.ends))+'</td></tr>';
    }).join('')||'<tr><td colspan="5">No active eggs.</td></tr>';
    let foodEnergyTotal=0,foodKnownUnits=0,foodUnknownUnits=0;
    const foodRows=food.map(x=>{
      const count=Number(x.count||0),energy=foodEnergy(x.item);
      if(energy==null)foodUnknownUnits+=count;else{foodKnownUnits+=count;foodEnergyTotal+=energy*count;}
      return '<tr><td>'+x.slot+'</td><td><b>'+icon(x.item,22)+esc(itemName(x.item))+'</b></td><td><code>'+esc(String(x.item))+'</code></td><td>'+count.toLocaleString()+'</td><td>'+(energy==null?'—':energy.toLocaleString())+'</td></tr>';
    }).join('')||'<tr><td colspan="5">No food slots returned.</td></tr>';
    const foodRate=Math.max(0,Number(raw.food_speed||0));
    const foodResidents=Math.max(0,Number(h.rosterCount||0));
    const foodReserveMinutes=foodRate>0?foodEnergyTotal/foodRate:0;
    const foodReserveLabel=foodEnergyTotal>0&&foodRate>0?(foodUnknownUnits>0?'≥ '+formatReserveMinutes(foodReserveMinutes)+' from known foods':'≈ '+formatReserveMinutes(foodReserveMinutes)):'Unknown';
    const missingFoodIds=[...new Set(food.filter(x=>foodEnergy(x.item)==null).map(x=>String(x.item)))];
    const missingStorageIds=Object.keys(storage).filter(id=>!window.HomelandItemCatalog?.lookup(id,aniidexImportMeta?.catalog)?.name||itemSellValue(id)==null);

    const productionRows=queues.map(q=>{
      const outputs=Object.entries(q.output||{}).filter(([,v])=>Number(v)>0);
      const out=outputs.map(([id,v])=>itemName(id)+' ×'+Number(v)).join(' • ');
      const p=Array.isArray(q.progress)?q.progress:[0,0],cur=Number(p[0]||0),tot=Number(p[1]||0),pct=tot?Math.round(cur/tot*100):0;
      const status=q.paused?'Paused':out?'Output ready':q.recipe!=null?'Working':'Idle';
      return {
        raw:q,
        facility:dashboardFacilityName(q.facility),
        recipeId:q.recipe==null?'':String(q.recipe),
        recipeName:q.recipe!=null?itemName(q.recipe):'Idle / no recipe',
        status,
        progress:tot?pct:null,
        output:out||'—',
        ready:!!out,
        piece:String(q.piece??'—'),
        level:String(q.level??'—')
      };
    });
    const statusRank={'Output ready':0,'Working':1,'Paused':2,'Idle':3};
    const sortProduction=(a,b)=>{
      if(productionSort==='facility')return a.facility.localeCompare(b.facility)||a.recipeName.localeCompare(b.recipeName);
      if(productionSort==='status')return (statusRank[a.status]??9)-(statusRank[b.status]??9)||a.recipeName.localeCompare(b.recipeName);
      if(productionSort==='ready')return Number(b.ready)-Number(a.ready)||a.recipeName.localeCompare(b.recipeName);
      if(productionSort==='count')return (b.count||1)-(a.count||1)||a.recipeName.localeCompare(b.recipeName);
      return a.recipeName.localeCompare(b.recipeName)||a.facility.localeCompare(b.facility);
    };
    let qRows='';
    let productionShownCount=productionRows.length;
    if(productionGroupMode==='grouped'){
      const groups=new Map();
      for(const row of productionRows){
        const key=row.recipeId?('recipe:'+row.recipeId):('idle:'+row.facility+':'+row.status);
        if(!groups.has(key))groups.set(key,{...row,count:0,pieces:[],facilities:new Set(),statuses:new Set(),outputs:new Set(),readyCount:0,progressValues:[]});
        const g=groups.get(key);g.count++;g.pieces.push(row);g.facilities.add(row.facility);g.statuses.add(row.status);if(row.output!=='—')g.outputs.add(row.output);if(row.ready)g.readyCount++;if(row.progress!=null)g.progressValues.push(row.progress);
      }
      const grouped=[...groups.values()].map(g=>{
        g.facility=[...g.facilities].join(' • ');
        g.status=g.statuses.size===1?[...g.statuses][0]:[...g.statuses].join(' / ');
        g.output=g.outputs.size?[...g.outputs].join(' • '):'—';
        g.ready=g.readyCount>0;
        g.progress=g.progressValues.length?Math.round(g.progressValues.reduce((a,b)=>a+b,0)/g.progressValues.length):null;
        return g;
      }).sort(sortProduction);
      productionShownCount=grouped.length;
      qRows=grouped.map(g=>{
        const pieceDetails=g.pieces.slice().sort((a,b)=>Number(a.piece)-Number(b.piece)).map(x=>'<div class="small">Piece '+esc(x.piece)+' · Lv '+esc(x.level)+' · '+esc(x.facility)+' · '+esc(x.status)+(x.progress!=null?' · '+x.progress+'%':'')+(x.output!=='—'?' · '+esc(x.output):'')+'</div>').join('');
        const detail=g.count>1?'<details class="snapshotProductionPieces"><summary>'+g.count+' pieces</summary>'+pieceDetails+'</details>':'<div class="small">Piece '+esc(g.pieces[0]?.piece||'—')+' · Lv '+esc(g.pieces[0]?.level||'—')+'</div>';
        return '<tr><td><b>'+esc(g.facility)+'</b>'+detail+'</td><td><b>'+icon(g.recipeId,22)+esc(g.recipeName)+'</b>'+(g.recipeId?'<div class="small"><code>'+esc(g.recipeId)+'</code></div>':'')+'</td><td>'+esc(g.status)+(g.readyCount?'<div class="small">'+g.readyCount+' ready</div>':'')+'</td><td>'+(g.progress!=null?g.progress+'% avg':'—')+'</td><td>'+esc(g.output)+'</td></tr>';
      }).join('');
    }else{
      qRows=productionRows.sort(sortProduction).map(row=>'<tr><td><b>'+esc(row.facility)+'</b><div class="small">Piece '+esc(row.piece)+' · Lv '+esc(row.level)+'</div></td><td><b>'+icon(row.recipeId,22)+esc(row.recipeName)+'</b>'+(row.recipeId?'<div class="small"><code>'+esc(row.recipeId)+'</code></div>':'')+'</td><td>'+esc(row.status)+'</td><td>'+(row.progress!=null?row.progress+'%':'—')+'</td><td>'+esc(row.output)+'</td></tr>').join('');
    }
    qRows=qRows||'<tr><td colspan="5">No production pieces returned.</td></tr>';
    const facilityRows=h.facilityRows.map(x=>'<tr><td><b>'+esc(x.name)+'</b></td><td>'+x.total+'</td><td>'+esc(x.levels)+'</td></tr>').join('');
    const storageEntries=Object.entries(storage).filter(([,v])=>Number(v)>0);
    let storageKnownValue=0,storagePricedCodes=0;
    const storageRows=storageEntries.sort((a,b)=>itemName(a[0]).localeCompare(itemName(b[0]))).map(([id,v])=>{
      const count=Number(v)||0,sell=itemSellValue(id),stack=sell==null?null:sell*count;
      if(sell!=null){storagePricedCodes++;storageKnownValue+=stack;}
      const nonSellable=window.HomelandItemCatalog?.lookup(id,aniidexImportMeta?.catalog)?.nonSellable===true;
      return '<tr><td><b>'+icon(id,22)+esc(itemName(id))+'</b></td><td><code>'+esc(id)+'</code></td><td>'+count.toLocaleString()+'</td><td>'+(nonSellable?'Not sellable (0 HC)':sell==null?'—':homeCoin(sell))+'</td><td>'+(stack==null?'—':'<b>'+homeCoin(stack)+'</b>')+'</td></tr>';
    }).join('');
    const moduleNames={2:'Rest Module',3:'Ecological Module',4:'Kitchen Module',5:'Resource Detector',6:'Crafting Module',7:'Power Module',8:'Plant Research Module',9:'Incubation Reaction Module',10:'Signal Transmitter'};
    const moduleRows=Object.entries(pc.rv_modules||{}).sort((a,b)=>Number(a[0])-Number(b[0])).map(([id,lv])=>'<tr><td>'+esc(moduleNames[id]||('Module '+id))+'</td><td>Lv '+Number(lv||0)+'</td><td><code>'+esc(id)+'</code></td></tr>').join('');
    root.innerHTML=
      '<div class="homeSnapshotHead"><div><div class="v30Title">Home Snapshot</div><div class="v30Sub">Full live Homeland readout from the latest Aniidx sync. Last snapshot: <b>'+esc(captured)+'</b>.</div></div></div>'+
      '<div class="homeSnapshotGrid">'+
      '<div class="homeSnapshotCard"><span>RV / land</span><b>RV '+Number(raw.home_level||pc.rv_level||0)+'</b><small>'+h.normalPlots+' plots • '+h.areas+' areas • '+mods+' module types</small></div>'+
      '<div class="homeSnapshotCard"><span>Habitability</span><b>'+Number(pc.habitability||0).toLocaleString()+'</b><small>Furniture '+Number(pc.furniture_comfort||0).toLocaleString()+' • Aniimo '+Number(pc.pet_comfort||0).toLocaleString()+'</small></div>'+
      '<div class="homeSnapshotCard"><span>Snapshot comfort</span><b>'+Number(sc.total||0).toLocaleString()+'</b><small>Furniture '+Number(sc.furniture||0).toLocaleString()+' • Aniimo '+Number(sc.pet||0).toLocaleString()+'</small></div>'+
      '<div class="homeSnapshotCard"><span>Facilities</span><b>'+h.facilityPieces+'</b><small>'+h.facilityRows.length+' types</small></div>'+
      '<div class="homeSnapshotCard"><span>Homeland Aniimo</span><b>'+h.working+' working</b><small>'+h.inactive+' inactive • '+h.rosterCount+' total</small></div>'+
      '<div class="homeSnapshotCard"><span>Production</span><b>'+h.activeQueues+' active</b><small>'+h.queues+' tracked • '+h.readyQueues+' with output</small></div>'+
      '<div class="homeSnapshotCard"><span>Incubation</span><b>'+eggs.length+' eggs</b><small>'+eggs.length+' / '+h.hatchinators+' occupied • '+Math.max(0,h.hatchinators-eggs.length)+' free</small></div>'+
      '<div class="homeSnapshotCard"><span>Food</span><b>'+h.foodSlots+' filled</b><small>Food speed '+h.foodSpeed+'</small></div></div>'+
      '<section class="snapshotSection"><div class="sectionTitle">Incubation</div><div class="small snapshotSectionIntro">Egg IDs are preserved even when a friendly name is not mapped yet.</div><div class="tableWrap"><table class="dataTable"><thead><tr><th>Egg</th><th>Item ID</th><th>Hatchinator piece</th><th>Hatches at</th><th>Remaining</th></tr></thead><tbody>'+eggRows+'</tbody></table></div></section>'+
      '<section class="snapshotSection"><div class="sectionTitle">Food Supply</div><div class="snapshotStorageSummary"><div><span>Estimated food reserve</span><b>'+esc(foodReserveLabel)+'</b></div><div><span>Known food energy</span><b>'+foodEnergyTotal.toLocaleString()+'</b></div><div><span>Live food cost</span><b>'+foodRate.toLocaleString()+'/min</b><small>'+foodResidents+' Homeland Aniimo</small></div></div><div class="small snapshotSectionIntro">'+food.length+' filled slot'+(food.length===1?'':'s')+' • live cost '+foodRate+'/min • estimate uses Aniidx food-energy values and the live food cost. The active food item may be partially consumed, so the game can show a slightly lower exact total.</div><div class="tableWrap"><table class="dataTable"><thead><tr><th>Slot</th><th>Food</th><th>Item ID</th><th>Count</th><th>Energy each</th></tr></thead><tbody>'+foodRows+'</tbody></table></div></section>'+
      abilityTable()+
      '<details class="homeSnapshotDetails" open><summary>Live production pieces ('+queues.length+')</summary><div class="filterBar snapshotProductionControls"><label class="small">View <select id="snapshotProductionMode"><option value="grouped"'+(productionGroupMode==='grouped'?' selected':'')+'>Grouped by item</option><option value="individual"'+(productionGroupMode==='individual'?' selected':'')+'>Individual pieces</option></select></label><label class="small">Sort <select id="snapshotProductionSort"><option value="item"'+(productionSort==='item'?' selected':'')+'>Item name</option><option value="facility"'+(productionSort==='facility'?' selected':'')+'>Facility</option><option value="status"'+(productionSort==='status'?' selected':'')+'>Status</option><option value="ready"'+(productionSort==='ready'?' selected':'')+'>Output ready first</option><option value="count"'+(productionSort==='count'?' selected':'')+'>Piece count</option></select></label><span class="small">'+productionShownCount+' row'+(productionShownCount===1?'':'s')+' shown</span></div><div class="tableWrap snapshotProductionTable '+(productionGroupMode==='grouped'?'grouped':'individual')+'"><table class="dataTable"><thead><tr><th>Facility / pieces</th><th>Recipe / item</th><th>Status</th><th>Progress</th><th>Output ready</th></tr></thead><tbody>'+qRows+'</tbody></table></div></details>'+
      '<details class="homeSnapshotDetails"><summary>Facility inventory ('+h.facilityPieces+' pieces / '+h.facilityRows.length+' types)</summary><div class="tableWrap homeFacilityTable"><table class="dataTable"><thead><tr><th>Facility</th><th>Total</th><th>Levels owned</th></tr></thead><tbody>'+facilityRows+'</tbody></table></div></details>'+
      '<details class="homeSnapshotDetails"><summary>RV modules</summary><div class="tableWrap"><table class="dataTable"><thead><tr><th>Module</th><th>Level</th><th>ID</th></tr></thead><tbody>'+moduleRows+'</tbody></table></div></details>'+
      '<details class="homeSnapshotDetails"><summary>Visitors / sync health</summary><div class="snapshotKeyRows"><div><span>Visitors</span><b>'+visitors.length+'</b></div><div><span>Visitor IDs</span><b>'+esc(visitors.join(', ')||'—')+'</b></div><div><span>Fresh</span><b>'+(h.meta?.home?.fresh===true?'Yes':h.meta?.home?.fresh===false?'No':'Unknown')+'</b></div><div><span>Cache seconds left</span><b>'+esc(String(h.meta?.home?.secondsLeft??'—'))+'</b></div><div><span>Region</span><b>'+esc(String(h.meta?.home?.region||'—'))+'</b></div><div><span>Server</span><b>'+esc(String(raw.server||'—'))+'</b></div></div></details>'+
      '<details class="homeSnapshotDetails"><summary>Missing item data audit · '+missingFoodIds.length+' unknown food energies / '+missingStorageIds.length+' storage names or prices</summary><div class="small">Entries are checked against the common Homeland item catalog, the active Aniidx profile catalog, and verified reference overrides. Missing values remain unknown; they are never counted as zero.</div><div class="snapshotKeyRows"><div><span>Missing food energy IDs</span><b>'+esc(missingFoodIds.join(', ')||'None')+'</b></div><div><span>Missing storage name/price IDs</span><b>'+esc(missingStorageIds.join(', ')||'None')+'</b></div></div></details>'+
      '<details class="homeSnapshotDetails"><summary>Home storage ('+storageEntries.length+' item codes)</summary><div class="snapshotStorageSummary"><div><span>Known sell value</span><b>'+homeCoin(storageKnownValue)+'</b></div><div><span>Priced item codes</span><b>'+storagePricedCodes+' / '+storageEntries.length+'</b></div><div><span>Unpriced / unknown</span><b>'+Math.max(0,storageEntries.length-storagePricedCodes)+'</b></div></div><div class="small snapshotSectionIntro">Total includes only items with a verified sell price. Unknown values are shown as — and are not counted as zero.</div><div class="tableWrap snapshotStorageTable"><table class="dataTable"><thead><tr><th>Item</th><th>Item ID</th><th>Count</th><th>Sell each</th><th>Stack value</th></tr></thead><tbody>'+storageRows+'</tbody></table></div></details>';
    el('snapshotProductionMode')?.addEventListener('change',e=>{productionGroupMode=e.target.value==='individual'?'individual':'grouped';renderHomeSnapshotTab();});
    el('snapshotProductionSort')?.addEventListener('change',e=>{productionSort=e.target.value||'item';renderHomeSnapshotTab();});
    clearInterval(window.__homeSnapshotTimer);
    window.__homeSnapshotTimer=setInterval(()=>document.querySelectorAll('#snapshotPane [data-egg-end]').forEach(n=>n.textContent=remaining(n.dataset.eggEnd)),30000);
  }
  window.renderHomeSnapshotTab=renderHomeSnapshotTab;
})();
