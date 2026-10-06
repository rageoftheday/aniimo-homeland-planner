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
function focusHomelandImporter(){setMainTab('import');setTimeout(()=>el('aniidexSyncFile')?.focus(),50)}


function aniimoZipCrc32(bytes){
 let c=0xffffffff;
 for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}
 return (c^0xffffffff)>>>0;
}
function aniimoZipU16(n){return new Uint8Array([n&255,(n>>>8)&255])}
function aniimoZipU32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255])}
function aniimoZipJoin(parts){
 const len=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(len);let at=0;
 for(const p of parts){out.set(p,at);at+=p.length}
 return out;
}
function aniimoZipDosTime(date=new Date()){
 const year=Math.max(1980,date.getFullYear());
 return {
   time:((date.getHours()&31)<<11)|((date.getMinutes()&63)<<5)|((Math.floor(date.getSeconds()/2))&31),
   date:(((year-1980)&127)<<9)|(((date.getMonth()+1)&15)<<5)|(date.getDate()&31)
 };
}
function aniimoBuildStoreZip(fileMap){
 const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;
 const stamp=aniimoZipDosTime();
 for(const [name,text] of Object.entries(fileMap)){
   const n=enc.encode(name),data=enc.encode(text),crc=aniimoZipCrc32(data);
   const local=aniimoZipJoin([
     aniimoZipU32(0x04034b50),aniimoZipU16(20),aniimoZipU16(0),aniimoZipU16(0),
     aniimoZipU16(stamp.time),aniimoZipU16(stamp.date),aniimoZipU32(crc),
     aniimoZipU32(data.length),aniimoZipU32(data.length),aniimoZipU16(n.length),aniimoZipU16(0),n,data
   ]);
   locals.push(local);
   const central=aniimoZipJoin([
     aniimoZipU32(0x02014b50),aniimoZipU16(20),aniimoZipU16(20),aniimoZipU16(0),aniimoZipU16(0),
     aniimoZipU16(stamp.time),aniimoZipU16(stamp.date),aniimoZipU32(crc),
     aniimoZipU32(data.length),aniimoZipU32(data.length),aniimoZipU16(n.length),aniimoZipU16(0),
     aniimoZipU16(0),aniimoZipU16(0),aniimoZipU16(0),aniimoZipU32(0),aniimoZipU32(offset),n
   ]);
   centrals.push(central);offset+=local.length;
 }
 const centralData=aniimoZipJoin(centrals);
 const end=aniimoZipJoin([
   aniimoZipU32(0x06054b50),aniimoZipU16(0),aniimoZipU16(0),
   aniimoZipU16(centrals.length),aniimoZipU16(centrals.length),
   aniimoZipU32(centralData.length),aniimoZipU32(offset),aniimoZipU16(0)
 ]);
 return new Blob([...locals,centralData,end],{type:'application/zip'});
}
async function downloadAniimoCompanionExtension(){
 const btn=el('downloadCompanionBtn');
 const old=btn?.textContent;
 try{
   if(btn){btn.disabled=true;btn.textContent='Building extension ZIP…';}
   const names=['manifest.json','background.js','planner-bridge.js','aniidex-isolated.js','aniidex-main.js'];
   const files={};
   for(const name of names){
     const r=await fetch('extension/'+name,{cache:'no-store'});
     if(!r.ok)throw new Error(name+' HTTP '+r.status);
     files['Aniimo_Homeland_Companion/'+name]=await r.text();
   }
   files['Aniimo_Homeland_Companion/INSTALL.txt']=
`ANIIMO HOMELAND COMPANION — INSTALL

1. Extract Aniimo_Homeland_Companion.zip.
2. Keep the extracted Aniimo_Homeland_Companion folder somewhere permanent.
3. Chrome: open chrome://extensions
   Edge:   open edge://extensions
4. Turn ON Developer mode.
5. Click "Load unpacked".
6. Select the extracted Aniimo_Homeland_Companion folder — the folder containing manifest.json.
7. Return to Aniimo Homeland Planner and refresh the page.
8. Open Import / Sync.
9. Confirm it says "Companion detected ✓".
10. Enter an Aniimo UID and click "Import from Aniidx".

If Aniidx requires Cloudflare verification, its tab may be brought forward. Complete the normal verification and the import will continue automatically.

The companion does not export your Aniidx cookies or Turnstile token to the planner.
`;
   const blob=aniimoBuildStoreZip(files),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='Aniimo_Homeland_Companion.zip';document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1500);
   setAniidexCompanionMessage('Companion extension ZIP downloaded. Extract it, load the extracted folder with Load unpacked, then refresh this planner.');
 }catch(err){
   setAniidexCompanionMessage('Could not build companion download: '+(err?.message||err),true);
 }finally{
   if(btn){btn.disabled=false;btn.textContent=old||'Download Companion Extension';}
 }
}


let importUiMessage='';
let aniidexCompanionDetected=false;
let aniidexCompanionTimer=null;

function setAniidexCompanionMessage(message,isError=false){
 importUiMessage=String(message||'');
 const status=el('aniidexImportStatus');
 if(status){
   status.className=isError?'rightAlert':'rightGood';
   status.textContent=importUiMessage;
 }
}

function requestAniidexCompanionSync(){
 const input=el('aniidexCompanionUid');
 const uid=String(input?.value||'').trim();
 if(!/^[1-9]\d{7,15}$/.test(uid)){
   setAniidexCompanionMessage('Enter a valid numeric Aniimo UID first.',true);
   return;
 }
 const btn=el('aniidexCompanionBtn');
 if(btn)btn.disabled=true;
 setAniidexCompanionMessage(aniidexCompanionDetected?'Connecting to Aniidx…':'Looking for the Aniimo Homeland Companion extension…');
 window.postMessage({channel:'aniimo-homeland-planner',type:'ANIIMO_SYNC_REQUEST',uid},location.origin);
 clearTimeout(aniidexCompanionTimer);
 aniidexCompanionTimer=setTimeout(()=>{
   if(!aniidexCompanionDetected){
     if(btn)btn.disabled=false;
     setAniidexCompanionMessage('Aniimo Homeland Companion was not detected. Install/load the extension from this repository, then refresh the planner.',true);
   }
 },1600);
}

window.addEventListener('message',event=>{
 if(event.source!==window||event.origin!==location.origin)return;
 const msg=event.data||{};
 if(msg.channel!=='aniimo-homeland-companion')return;
 if(msg.type==='ANIIMO_COMPANION_READY'){
   aniidexCompanionDetected=true;
   clearTimeout(aniidexCompanionTimer);
   const badge=el('aniidexCompanionState');
   if(badge){badge.textContent='Companion detected ✓';badge.className='okText';}
   return;
 }
 if(msg.type==='ANIIMO_SYNC_STATUS'){
   aniidexCompanionDetected=true;
   clearTimeout(aniidexCompanionTimer);
   setAniidexCompanionMessage(msg.message||'Connecting to Aniidx…',!!msg.error);
   return;
 }
 if(msg.type==='ANIIMO_SYNC_RESULT'){
   aniidexCompanionDetected=true;
   clearTimeout(aniidexCompanionTimer);
   const btn=el('aniidexCompanionBtn');if(btn)btn.disabled=false;
   if(!msg.ok){
     setAniidexCompanionMessage(msg.error||'Aniidx sync failed.',true);
     return;
   }
   try{
     const data=msg.bundle||{};
     const profileData=data.profile||{};
     const homeData=data.homeland||{};
     const sum=applyAniidexImportedData(profileData,homeData,'Aniidx direct sync',EMBEDDED_ANIIDEX_CATALOG);
     if(!sum){setAniidexCompanionMessage('Aniidx sync received; import was cancelled.');return;}
     setAniidexCompanionMessage(`Direct Aniidx sync complete ✓ ${sum.name||'Player'} • RV ${sum.rv} • ${sum.aniimo} Homeland Aniimo • ${sum.facilities} facility pieces • ${sum.caught||0} caught forms`);
     renderImportTab();
   }catch(err){
     setAniidexCompanionMessage('Direct Aniidx sync import failed: '+(err?.message||err),true);
   }
 }
});
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
 const directUid=esc(String(meta?.uid||''));
 root.innerHTML=`<div class="v30Title">Import / Sync</div><div class="v30Sub">Sync a UID directly through the optional Aniimo Homeland Companion. The extension uses Aniidx's normal signed-in browser session and legitimate verification flow; it never exposes cookies or Turnstile tokens to the planner.</div>
 <div class="importSummary">${meta?`<span class="importChip">Last source: ${esc(meta.source||'Aniidx')}</span><span class="importChip">${esc(sum.name||'Player')} • RV ${sum.rv||'?'}</span><span class="importChip">${sum.aniimo||0} Homeland Aniimo</span><span class="importChip">${sum.caught||0} caught forms</span>`:'<span class="importChip">No Aniidx sync imported into this profile yet</span>'}</div>
 ${importUiMessage?`<div class="${/failed|not detected|invalid/i.test(importUiMessage)?'rightAlert':'rightGood'}" style="margin-top:10px">${esc(importUiMessage)}</div>`:''}
 <div class="importGrid" style="margin-top:12px">
  <div class="importMethod"><h3>1. Direct Aniidx Sync (Companion)</h3><div class="small">Enter a UID here. The companion asks Aniidx to authorize the lookup, completes the normal <b>/api/player/pass</b> verification when required, then returns the player profile and Homeland snapshot directly to this planner. If Cloudflare requires interaction, the Aniidx tab is brought forward only for that verification.</div><div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-top:10px"><label style="min-width:230px">Aniimo UID<input id="aniidexCompanionUid" inputmode="numeric" autocomplete="off" value="${directUid}" placeholder="302000117964"></label><button class="primary" id="aniidexCompanionBtn">Import from Aniidx</button><span id="aniidexCompanionState" class="small">${aniidexCompanionDetected?'Companion detected ✓':'Companion extension required'}</span></div><div style="margin-top:12px;padding:10px;border:1px solid #31495d;border-radius:10px"><b>Install the Companion Extension</b><div class="small" style="margin-top:6px">1. Click <b>Download Companion Extension</b> below. This downloads <b>only the extension</b>, not the whole GitHub repository.<br>2. Extract <b>Aniimo_Homeland_Companion.zip</b> somewhere permanent.<br>3. Open <b>chrome://extensions</b> or <b>edge://extensions</b>.<br>4. Turn on <b>Developer mode</b>.<br>5. Click <b>Load unpacked</b>.<br>6. Select the extracted <b>Aniimo_Homeland_Companion</b> folder — the folder containing <b>manifest.json</b>.<br>7. Return here and refresh the planner. This box should change to <b>Companion detected ✓</b>.</div><div style="margin-top:10px"><button id="downloadCompanionBtn">Download Companion Extension</button></div></div></div>
  <div class="importMethod"><h3>2. Bookmarklet Fallback</h3><div class="small">The existing same-origin helper remains available if you do not want to install the companion. It runs on Aniidx and downloads one JSON sync file without copying cookies or passwords into the planner.</div><ol class="importSteps"><li>Drag the button below to your bookmarks bar, or copy it into a new bookmark's URL.</li><li>Open Aniidx → Homeland and let the page finish loading.</li><li>Click the bookmark and enter your UID.</li><li>Load the downloaded JSON using the sync-file box.</li></ol><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><a id="syncBookmarklet" class="bookmarkletLink" href="#" title="Drag this to your bookmarks bar. Clicking it here will only open Aniidx.">Drag to Bookmarks: Aniimo Homeland Sync</a><button id="openAniidexBtn">Open Aniidx Homeland</button><button id="copyBookmarkletBtn">Copy Bookmarklet</button><button id="downloadBookmarkletBtn">Download Instructions</button></div><details style="margin-top:10px"><summary>Show bookmarklet code</summary><textarea id="bookmarkletCode" class="bookmarkletCode" readonly></textarea></details></div>
  <div class="importMethod"><h3>3. Load Sync File</h3><div class="syncDrop"><input type="file" id="aniidexSyncFile" accept="application/json,.json"><div class="small" style="margin-top:6px">Choose an <b>Aniimo_Homeland_...json</b> file downloaded by the fallback helper.</div></div><div class="small" style="margin-top:10px"><b>Import priority:</b> imported individual data → decoded Aniimo/form defaults → editable user overrides.</div></div>
  <div id="aniidexImportStatus" class="small" style="margin:10px 0"></div>
  <div class="importMethod"><h3>4. Advanced: Paste Network Responses</h3><div class="small">Fallback for troubleshooting. Paste the GET <b>/api/player/&lt;UID&gt;</b> response and POST <b>/api/player/home-import</b> response.</div><div class="copiedGrid" style="grid-template-columns:1fr;margin-top:8px"><label>Profile / Collection<textarea id="aniidexProfilePaste" placeholder='Paste response containing "profile" and "collection"'></textarea></label><label>Homeland<textarea id="aniidexHomePaste" placeholder='Paste response containing "home", "facilities" and "aniimo"'></textarea></label></div><div class="importActions"><button class="primary" id="aniidexPasteImportBtn">Import Copied Responses</button><button id="aniidexPasteClearBtn">Clear</button></div></div>
 </div>`;
 const bm=aniidexBookmarkletCode();el('syncBookmarklet').href=bm;el('bookmarkletCode').value=bm;el('syncBookmarklet').onclick=(e)=>{e.preventDefault();importUiMessage='Opened Aniidx Homeland. Once it finishes loading, click the Aniimo Homeland Sync bookmark from your browser bookmarks bar.';window.open('https://aniidex.com/homeland/','_blank');renderImportTab()};el('openAniidexBtn').onclick=()=>window.open('https://aniidex.com/homeland/','_blank');
 el('aniidexCompanionBtn').onclick=requestAniidexCompanionSync;
 el('downloadCompanionBtn').onclick=downloadAniimoCompanionExtension;
 el('aniidexCompanionUid').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();requestAniidexCompanionSync();}});
 el('copyBookmarkletBtn').onclick=async()=>{try{await navigator.clipboard.writeText(bm);importUiMessage='Bookmarklet copied. Create a bookmark and paste it into the URL/location field.';}catch{importUiMessage='Clipboard permission was blocked. Open “Show bookmarklet code” and copy it manually.';}renderImportTab()};
 el('downloadBookmarkletBtn').onclick=downloadBookmarkletText;
 el('aniidexSyncFile').onchange=e=>importAniidexSyncFile(e.target.files?.[0]);
 el('aniidexPasteImportBtn').onclick=importAniidexPastedResponses;
 el('aniidexPasteClearBtn').onclick=()=>{el('aniidexProfilePaste').value='';el('aniidexHomePaste').value='';};
 window.postMessage({channel:'aniimo-homeland-planner',type:'ANIIMO_COMPANION_PING'},location.origin);
}
