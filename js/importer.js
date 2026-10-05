function countImportedFacilities(facilities){let n=0;for(const lvls of Object.values(facilities||{}))for(const c of Object.values(lvls||{}))n+=Number(c)||0;return n}
function aniidexCatalogParts(catalogData){
 const src=(catalogData&&Object.keys(catalogData).length)?catalogData:EMBEDDED_ANIIDEX_CATALOG;
 const hub=src?.hub||src?.homelandHub||src?.homeland||EMBEDDED_ANIIDEX_CATALOG.hub;
 const facts=hub?.facts||src?.facts||EMBEDDED_ANIIDEX_CATALOG.hub?.facts||null;
 const text=src?.text||src?.homelandText||src?.siteText||EMBEDDED_ANIIDEX_CATALOG.text;
 const planner=src?.planner||src?.homelandPlanner||EMBEDDED_ANIIDEX_CATALOG.planner;
 return {hub,facts,text,planner};
}
function decodeAniidexForm(formId,catalogData){
 const {facts,text}=aniidexCatalogParts(catalogData||{});if(!facts?.forms)return null;
 const fr=facts.forms[String(formId)]??facts.forms[formId];if(!fr)return null;
 const vr=text?.forms?.[String(fr.variant)]??text?.forms?.[fr.variant]??{};
 const skills=[];
 for(const [skillKey,levelRaw] of Object.entries(fr.skills||{})){
   const ab=facts.abilities?.[skillKey]||facts.abilities?.[String(skillKey)]||{};
   const label=text?.abilities?.[ab.id]??text?.abilities?.[String(ab.id)]??skillKey;
   const name=typeof label==='string'?label:(label?.name||label?.label||String(skillKey));
   skills.push({type:name,level:Number(levelRaw)||1,key:skillKey});
 }
 return {name:vr?.name||fr.name||`Form ${formId}`,form:vr?.form||fr.form||'',skills,variant:fr.variant,prismana:!!fr.prismana,oneLine:!!fr.oneLine,path:fr.path||'',raw:fr};
}
function importedWorkerFromAniidex(a,catalogData=null){
 const w=defaultWorker();
 const decoded=decodeAniidexForm(a.form,catalogData||EMBEDDED_ANIIDEX_CATALOG);
 const preset=catalogEntries().find(c=>String(c.formId||'')===String(a.form));
 if(decoded){
   w.name=decoded.name;w.form=decoded.form||'';w.catalogSource='aniidex-catalog';
   w.abilities=decoded.skills.map(x=>({type:x.type,level:x.level}));while(w.abilities.length<3)w.abilities.push({type:'',level:1});
   w.portrait=`https://aniidex.com/images/aniimo/UI_PetHead_${a.form}.webp`;
   if(decoded.prismana)w.appearance='Prismana';
 } else if(preset){w.name=preset.name;w.form=preset.form||'';w.family=preset.family||'';w.catalogSource=preset.source||'';w.abilities=(preset.abilities||[]).map(x=>({type:x[0],level:x[1]}));while(w.abilities.length<3)w.abilities.push({type:'',level:1})}
 else {w.name=`Form ${a.form}`;w.form=`Aniidex #${a.form}`;w.catalogSource='aniidex-raw'}
 if(preset&&!w.family)w.family=preset.family||'';
 w.active=a.facility!=null;
 w.externalId=a.id||'';
 w.aniidex={form:a.form,level:a.level,nature:a.nature,gender:a.gender,sparkling:a.sparkling,facility:a.facility,facilityLevel:a.facility_level,job:a.job,piece:a.piece,talent:a.talent,letter:a.letter,decoded:!!decoded};
 return w;
}
function summarizeAniidexImport(profileData,homeData){
 const prof=profileData?.profile||profileData||{},home=homeData?.home||homeData||{};
 const collection=prof.collection||{};return {name:prof.player_name||home.name||'',rv:Number(home.home_level||prof.homeland?.rv_level||11),caught:Number(collection.total_caught_forms||0),aniimo:Array.isArray(home.aniimo)?home.aniimo.length:0,working:Array.isArray(home.aniimo)?home.aniimo.filter(a=>a.facility!=null).length:0,facilities:countImportedFacilities(home.facilities),plots:(home.plots||[]).filter(n=>n>=1&&n<=16)};
}
function parseAniidexPaste(text,label){
 const raw=String(text||'').trim();if(!raw)throw new Error(`${label} response is empty.`);
 try{return JSON.parse(raw)}catch(e){throw new Error(`${label} response is not valid JSON: ${e.message}`)}
}
function applyAniidexImportedData(profileData,homeData,sourceLabel='Aniidex',catalogData=null){
 const sum=summarizeAniidexImport(profileData,homeData);
 const ok=confirm(`${sourceLabel} import is ready.\n\n${sum.name||'Player'}\nRV ${sum.rv}\n${sum.aniimo} Homeland Aniimo (${sum.working} placed at facilities)\n${sum.facilities} facility pieces in snapshot\n${sum.caught||0} caught forms\n\nImport into the CURRENT profile?\n\nRaw imported data will also be retained for later ID decoding.`);
 if(!ok)return false;
 rvLevel.value=String(sum.rv||11);
 const rawHome=homeData?.home||homeData||{};
 const normalPlots=(rawHome.plots||[]).filter(n=>n>=1&&n<=16);if(normalPlots.length)openPlots=new Set(normalPlots);
 const rawAniimo=rawHome.aniimo||[];workers=rawAniimo.map(a=>importedWorkerFromAniidex(a,catalogData));workerIdCounter=Math.max(1,...workers.map(w=>(Number(w.id)||0)+1));
 aniidexImportMeta={uid:String(rawHome.uid||profileData?.profile?.uid||profileData?.uid||''),importedAt:Date.now(),summary:sum,profile:profileData,home:homeData,catalog:catalogData,source:sourceLabel};
 const p=profileStore?.profiles?.[profileStore.current];if(p&&sum.name&&(/^Main Account$/i.test(p.name)||!p.name))p.name=sum.name;
 render();snapshotIntoCurrentProfile();renderProfileBar();
 return sum;
}
function importAniidexPastedResponses(){
 const st=el('aniidexImportStatus');
 try{
  const ptxt=String(el('aniidexProfilePaste')?.value||'').trim();
  const profileData=ptxt?parseAniidexPaste(ptxt,'Profile / Collection'):{};
  const homeData=parseAniidexPaste(el('aniidexHomePaste')?.value,'Homeland');
  const sum=applyAniidexImportedData(profileData,homeData,'Copied Aniidex response',EMBEDDED_ANIIDEX_CATALOG);if(!sum)return;
  st.innerHTML=`<span class="okText">Copied-response import complete ✓</span> ${esc(sum.name||'Player')} • RV ${sum.rv} • ${sum.aniimo} Homeland Aniimo • ${sum.facilities} facility pieces • ${sum.caught||0} caught forms`;
 }catch(err){st.innerHTML=`<span class="badText">Copied-response import failed:</span> ${esc(err?.message||err)}`}
}
function focusHomelandImporter(){setMainTab('import');setTimeout(()=>el('aniidexUidInput')?.focus(),50)}


let importUiMessage='';
function aniidexBookmarkletCode(){
 const code=`(async()=>{try{if(!/(^|\\.)aniidex\\.com$/i.test(location.hostname)){alert('Aniimo Homeland Sync must run on aniidex.com.\\n\\nAniidex Homeland will open now. Once it finishes loading, click the Aniimo Homeland Sync bookmark again.');location.href='https://aniidex.com/homeland/';return;}const uid=prompt('Aniimo UID to sync:');if(!uid)return;if(!/^\\d{8,16}$/.test(String(uid).trim())){alert('Please enter a numeric Aniimo UID.');return;}const get=async(u,o)=>{const r=await fetch(u,o);if(!r.ok)throw new Error(u+' HTTP '+r.status);return r.json()};const clean=String(uid).trim();let stage='player context';const profile=await get('/api/player/'+encodeURIComponent(clean),{headers:{Accept:'application/json'}});await new Promise(r=>setTimeout(r,250));stage='Homeland snapshot';const homeland=await get('/api/player/home-import',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json','X-Aniidex-Request':'1'},body:JSON.stringify({uid:clean})});const bundle={format:'aniimo-homeland-sync-v3',capturedAt:new Date().toISOString(),source:'aniidex.com',uid:clean,profile:profile||{},homeland,warnings:[]};const b=new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='Aniimo_Homeland_'+clean+'_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);alert('Aniimo Homeland sync downloaded.\\n\\nLoad that JSON in the planner Import / Sync tab.');}catch(e){alert('Aniimo sync failed while loading '+(typeof stage==='string'?stage:'Aniidex data')+': '+(e&&e.message||e)+'\\n\\nOpen https://aniidex.com/homeland/, make sure you are signed in, load that player on Aniidex if needed, then click the sync bookmark again.');}})()`;
 return 'javascript:'+code.replace(/\\n+/g,' ');
}
async function importAniidexSyncFile(file){
 if(!file) return;
 const status=el('aniidexImportStatus');
 try{
  const data=JSON.parse(await file.text());
  let profileData,homeData,catalogData=null;
  if(data?.format==='aniimo-homeland-sync-v3'){profileData=data.profile||{};homeData=data.homeland;catalogData=EMBEDDED_ANIIDEX_CATALOG;}
  else if(data?.format==='aniimo-homeland-sync-v2'){profileData=data.profile||{};homeData=data.homeland;catalogData=data.catalog||EMBEDDED_ANIIDEX_CATALOG;}
  else if(data?.format==='aniimo-homeland-sync-v1'){profileData=data.profile||{};homeData=data.homeland;catalogData=EMBEDDED_ANIIDEX_CATALOG;}
  else if(data?.profile&&data?.homeland){profileData=data.profile||{};homeData=data.homeland;catalogData=data.catalog||EMBEDDED_ANIIDEX_CATALOG;}
  else if(data?.profile&&data?.home){profileData=data;homeData=data.home;catalogData=data.catalog||EMBEDDED_ANIIDEX_CATALOG;}
  else if(data?.home&&Array.isArray(data.home.aniimo)){profileData={};homeData=data;catalogData=EMBEDDED_ANIIDEX_CATALOG;}
  else throw new Error('This does not look like an Aniimo Homeland sync or home-import file.');
  const sum=applyAniidexImportedData(profileData,homeData,'Aniիդex sync file',catalogData);
  if(!sum)return;
  importUiMessage=`Sync file imported ✓ ${sum.name||'Player'} • RV ${sum.rv} • ${sum.aniimo} Homeland Aniimo • ${sum.facilities} facility pieces • ${sum.caught||0} caught forms`;
  renderImportTab();
 }catch(err){importUiMessage='Sync file import failed: '+(err?.message||err);if(status)status.textContent=importUiMessage;}
}
function downloadBookmarkletText(){
 const text=`ANIIMO HOMELAND SYNC HELPER\n\n1. Show your browser bookmarks bar.\n2. Create a new bookmark named: Aniimo Homeland Sync\n3. Paste the entire line below into the bookmark URL/location field.\n4. Open https://aniidex.com/homeland/ and click the bookmark.\n5. Enter your Aniimo UID.\n6. A single JSON sync file downloads. Load that file in the planner's Import / Sync tab.\n\nBOOKMARKLET:\n${aniidexBookmarkletCode()}`;
 const blob=new Blob([text],{type:'text/plain'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='Aniimo_Homeland_Sync_Helper.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
function renderImportTab(){
 const root=el('importPane');if(!root)return;
 const meta=aniidexImportMeta, sum=meta?.summary||{};
 root.innerHTML=`<div class="v30Title">Import / Sync</div><div class="v30Sub">Keep imports out of the roster editor. The easiest offline workflow is a one-click bookmark helper on Aniիդex that downloads one sync file for this planner.</div>
 <div class="importSummary">${meta?`<span class="importChip">Last source: ${esc(meta.source||'Aniիդex')}</span><span class="importChip">${esc(sum.name||'Player')} • RV ${sum.rv||'?'}</span><span class="importChip">${sum.aniimo||0} Homeland Aniimo</span><span class="importChip">${sum.caught||0} caught forms</span>`:'<span class="importChip">No Aniիդex sync imported into this profile yet</span>'}</div>
 ${importUiMessage?`<div class="${/failed/i.test(importUiMessage)?'rightAlert':'rightGood'}" style="margin-top:10px">${esc(importUiMessage)}</div>`:''}
 <div class="importGrid" style="margin-top:12px">
  <div class="importMethod"><h3>1. Easy Aniիդex Sync Helper</h3><div class="small">One-time setup. This bookmark runs while you are already on Aniիդex, so its same-origin API calls are allowed. It downloads one JSON file; it does not copy cookies or passwords into the planner. v30.5 also captures Aniիդex's public Homeland catalog so numeric form IDs can resolve to names, forms and Home abilities automatically.</div><ol class="importSteps"><li>Drag the button below to your bookmarks bar, or copy it into a new bookmark's URL.</li><li>Open Aniիդex → Homeland and let the page finish loading.</li><li>Click the bookmark and enter your UID. If you accidentally run it from the planner, it will take you to Aniիդex first; click the bookmark again after Aniիդex loads.</li><li>Load the downloaded JSON using the box to the right.</li></ol><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><a id="syncBookmarklet" class="bookmarkletLink" href="#" title="Drag this to your bookmarks bar. Clicking it here will only open Aniիդex.">Drag to Bookmarks: Aniimo Homeland Sync</a><button id="openAniidexBtn">Open Aniիդex Homeland</button><button id="copyBookmarkletBtn">Copy Bookmarklet</button><button id="downloadBookmarkletBtn">Download Instructions</button></div><details style="margin-top:10px"><summary>Show bookmarklet code</summary><textarea id="bookmarkletCode" class="bookmarkletCode" readonly></textarea></details></div>
  <div class="importMethod"><h3>2. Load Sync File</h3><div class="syncDrop"><input type="file" id="aniidexSyncFile" accept="application/json,.json"><div class="small" style="margin-top:6px">Choose the <b>Aniimo_Homeland_...json</b> file downloaded by the helper. New v2 sync files include the public Homeland catalog, English labels and planner reference data so the roster can decode numeric form IDs immediately.</div></div><div class="small" style="margin-top:10px"><b>Import priority:</b> imported individual data → decoded Aniimo/form defaults → editable user overrides.</div></div>
  <div class="importMethod"><h3>3. Direct UID Test</h3><div class="small">A local <code>file://</code> planner is normally blocked by CORS, but this remains available for hosted copies/future use.</div><div class="uidImportRow" style="margin-top:8px"><label>UID<input id="aniidexUidInput" inputmode="numeric" placeholder="Aniimo UID" value="${esc(meta?.uid||'')}"></label><button id="aniidexImportBtn">Import UID</button></div><div id="aniidexImportStatus" class="small">Direct UID import may fail in local-file mode. Use the Sync Helper above instead.</div></div>
  <div class="importMethod"><h3>4. Advanced: Paste Network Responses</h3><div class="small">Fallback for troubleshooting. Paste the GET <b>/api/player/&lt;UID&gt;</b> response and POST <b>/api/player/home-import</b> response.</div><div class="copiedGrid" style="grid-template-columns:1fr;margin-top:8px"><label>Profile / Collection<textarea id="aniidexProfilePaste" placeholder='Paste response containing "profile" and "collection"'></textarea></label><label>Homeland<textarea id="aniidexHomePaste" placeholder='Paste response containing "home", "facilities" and "aniimo"'></textarea></label></div><div class="importActions"><button class="primary" id="aniidexPasteImportBtn">Import Copied Responses</button><button id="aniidexPasteClearBtn">Clear</button></div></div>
 </div>`;
 const bm=aniidexBookmarkletCode();el('syncBookmarklet').href=bm;el('bookmarkletCode').value=bm;el('syncBookmarklet').onclick=(e)=>{e.preventDefault();importUiMessage='Opened Aniիդex Homeland. Once it finishes loading, click the Aniimo Homeland Sync bookmark from your browser bookmarks bar.';window.open('https://aniidex.com/homeland/','_blank');renderImportTab()};el('openAniidexBtn').onclick=()=>window.open('https://aniidex.com/homeland/','_blank');
 el('copyBookmarkletBtn').onclick=async()=>{try{await navigator.clipboard.writeText(bm);importUiMessage='Bookmarklet copied. Create a bookmark and paste it into the URL/location field.';}catch{importUiMessage='Clipboard permission was blocked. Open “Show bookmarklet code” and copy it manually.';}renderImportTab()};
 el('downloadBookmarkletBtn').onclick=downloadBookmarkletText;
 el('aniidexSyncFile').onchange=e=>importAniidexSyncFile(e.target.files?.[0]);
 el('aniidexImportBtn').onclick=importAniidexUid;
 el('aniidexPasteImportBtn').onclick=importAniidexPastedResponses;
 el('aniidexPasteClearBtn').onclick=()=>{el('aniidexProfilePaste').value='';el('aniidexHomePaste').value='';};
}

async function importAniidexUid(){
 const inp=el('aniidexUidInput'),btn=el('aniidexImportBtn'),st=el('aniidexImportStatus');
 const uid=String(inp?.value||'').trim();if(!/^\d{8,16}$/.test(uid)){st.innerHTML='<span class="badText">Enter a numeric Aniimo UID first.</span>';return}
 btn.disabled=true;st.innerHTML='<span class="warnText">Testing direct Aniidex access…</span>';
 try{
   const profileUrl=`https://aniidex.com/api/player/${encodeURIComponent(uid)}`;
   const pr=await fetch(profileUrl,{method:'GET',headers:{'Accept':'application/json'},credentials:'omit'});
   if(!pr.ok)throw new Error(`Player lookup returned HTTP ${pr.status}`);
   const profileData=await pr.json();
   st.innerHTML='<span class="warnText">Player found. Trying Homeland snapshot…</span>';
   const hr=await fetch('https://aniidex.com/api/player/home-import',{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json','X-Aniidex-Request':'1'},body:JSON.stringify({uid:String(uid)}),credentials:'omit'});
   if(!hr.ok)throw new Error(`Homeland import returned HTTP ${hr.status}`);
   const homeData=await hr.json();
   const sum=summarizeAniidexImport(profileData,homeData);
   st.innerHTML=`<span class="okText">Direct import works ✓</span> ${esc(sum.name||uid)} • RV ${sum.rv} • ${sum.aniimo} Homeland Aniimo • ${sum.working} placed • ${sum.facilities} facility pieces • ${sum.caught||'—'} caught forms`;
   const applied=applyAniidexImportedData(profileData,homeData,'Direct Aniidex UID');if(!applied)return;
   st.innerHTML=`<span class="okText">Imported ✓</span> RV, open plots and ${workers.length} Homeland Aniimo loaded.`;
 }catch(err){
   console.error('Aniidex direct UID import failed',err);
   st.innerHTML=`<span class="badText">Direct UID is blocked from this page:</span> ${esc(err?.message||err)}<br><span class="small">Aniidex does not currently expose this import flow for cross-origin browser use. Use <b>Aniimo Homeland Sync</b> on aniidex.com or import a saved sync JSON; those run with your normal Aniidex session and do not require sharing cookies or tokens.</span>`;
 }finally{btn.disabled=false}
}
