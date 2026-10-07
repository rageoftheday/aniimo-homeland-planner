function countImportedFacilities(facilities){let n=0;for(const lvls of Object.values(facilities||{}))for(const c of Object.values(lvls||{}))n+=Number(c)||0;return n}
function aniidexCatalogParts(catalogData){
 const src=(catalogData&&Object.keys(catalogData).length)?catalogData:EMBEDDED_ANIIDEX_CATALOG;
 const sourceHub=src?.hub||src?.homelandHub||src?.homeland||null;
 const hub=sourceHub||EMBEDDED_ANIIDEX_CATALOG.hub;
 const facts=sourceHub?.facts||src?.facts||EMBEDDED_ANIIDEX_CATALOG.hub?.facts||null;
 const text=src?.text||src?.homelandText||src?.siteText||sourceHub?.text||EMBEDDED_ANIIDEX_CATALOG.text;
 const planner=src?.planner||src?.homelandPlanner||sourceHub?.planner||EMBEDDED_ANIIDEX_CATALOG.planner;
 return {hub,facts,text,planner};
}
const aniidexFormIndexCache=new WeakMap();
function aniidexFormIndexes(forms){
 if(!forms||typeof forms!=='object')return {byKey:new Map(),byVariant:new Map(),byPet:new Map()};
 const cached=aniidexFormIndexCache.get(forms);if(cached)return cached;
 const byKey=new Map(),byVariant=new Map(),byPet=new Map();
 const entries=Array.isArray(forms)?forms.map((fr,i)=>[String(i),fr]):Object.entries(forms);
 for(const [key,fr] of entries){
   if(!fr)continue;
   byKey.set(String(key),fr);
   if(fr.variant!=null)byVariant.set(String(fr.variant),fr);
   if(fr.pet!=null)byPet.set(String(fr.pet),fr);
 }
 const out={byKey,byVariant,byPet};aniidexFormIndexCache.set(forms,out);return out;
}
function aniidexFormFactById(forms,formId){
 if(!forms)return null;
 const id=String(formId??'');
 const idx=aniidexFormIndexes(forms);
 return idx.byKey.get(id)||idx.byVariant.get(id)||idx.byPet.get(id)||null;
}
function aniidexHasLiveForms(catalogData){
 const hub=catalogData?.hub||catalogData?.homelandHub||catalogData?.homeland;
 const facts=hub?.facts||catalogData?.facts;
 return !!(facts?.forms&&Object.keys(facts.forms).length);
}
function aniidexSparklingAppearance(code){
 const n=Number(code)||0;
 if(n>=1&&n<=10){
   const roman=['I','II','III','IV','V','VI','VII','VIII','IX','X'][n-1];
   return {appearance:'Sparkling',sparklingHue:'Variant '+roman};
 }
 if(n===11)return {appearance:'Dazzling Sparkling',sparklingHue:''};
 if(n===12)return {appearance:'Shadow Sparkling',sparklingHue:''};
 return {appearance:'Normal',sparklingHue:''};
}
function decodeAniidexForm(formId,catalogData){
 const {facts,text}=aniidexCatalogParts(catalogData||{});if(!facts?.forms)return null;
 const fr=aniidexFormFactById(facts.forms,formId);if(!fr)return null;
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
function decodeAniidexFormPreferred(formId,catalogData=null){
 if(catalogData&&catalogData!==EMBEDDED_ANIIDEX_CATALOG&&aniidexHasLiveForms(catalogData)){
   const live=decodeAniidexForm(formId,catalogData);if(live)return {...live,catalogSource:'aniidex-live'};
 }
 const embedded=decodeAniidexForm(formId,EMBEDDED_ANIIDEX_CATALOG);
 return embedded?{...embedded,catalogSource:'aniidex-embedded'}:null;
}
function aniidexBundleCatalog(data){
 if(data?.planner&&aniidexHasLiveForms(data.planner))return data.planner;
 if(data?.catalog&&Object.keys(data.catalog||{}).length)return data.catalog;
 return EMBEDDED_ANIIDEX_CATALOG;
}
function importedWorkerFromAniidex(a,catalogData=null){
 const w=defaultWorker();
 const decoded=decodeAniidexFormPreferred(a.form,catalogData);
 const preset=catalogEntries().find(c=>String(c.formId||'')===String(a.form));
 if(decoded){
   w.name=decoded.name;w.form=decoded.form||'';w.catalogSource=decoded.catalogSource||'aniidex-catalog';
   w.formId=String(decoded.variant||a.form||'');
   w.abilities=decoded.skills.map(x=>({type:x.type,level:x.level}));while(w.abilities.length<3)w.abilities.push({type:'',level:1});
   w.portrait=`https://aniidex.com/images/aniimo/UI_PetHead_${decoded.variant||a.form}.webp`;
   const appearance=aniidexSparklingAppearance(a.sparkling);
   w.appearance=appearance.appearance;w.sparklingHue=appearance.sparklingHue;
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
function aniidexRvModuleLevels(profileData,homeData){
 const prof=profileData?.profile||profileData||{},home=homeData?.home||homeData||{};
 const raw=prof?.homeland?.rv_modules||home?.rv_modules||homeData?.rv_modules||{};
 const ids={
  2:'Rest Module',
  3:'Ecological Module',
  4:'Kitchen Module',
  5:'Resource Detector',
  6:'Crafting Module',
  7:'Power Module',
  8:'Plant Research Module',
  9:'Incubation Reaction Module',
  10:'Signal Transmitter'
 };
 const out={};
 for(const [id,name] of Object.entries(ids))out[name]=Math.max(0,Number(raw[id]??raw[String(id)]??0)||0);
 return {raw,levels:out,count:Object.values(out).filter(v=>v>0).length};
}
function applyAniidexImportedData(profileData,homeData,sourceLabel='Aniidex',catalogData=null,confirmImport=true){
 const sum=summarizeAniidexImport(profileData,homeData);
 const ok=!confirmImport||confirm(`${sourceLabel} import is ready.\n\n${sum.name||'Player'}\nRV ${sum.rv}\n${sum.aniimo} Homeland Aniimo (${sum.working} placed at facilities)\n${sum.facilities} facility pieces in snapshot\n${sum.caught||0} caught forms\n${aniidexRvModuleLevels(profileData,homeData).count} installed RV modules\n\nImport into the CURRENT profile?\n\nRaw imported data will also be retained for later ID decoding.`);
 if(!ok)return false;
 rvLevel.value=String(sum.rv||11);
 const rawHome=homeData?.home||homeData||{};
 const importedModules=aniidexRvModuleLevels(profileData,homeData);
 moduleLevels={...importedModules.levels};
 const normalPlots=(rawHome.plots||[]).filter(n=>n>=1&&n<=16);if(normalPlots.length)openPlots=new Set(normalPlots);
 const rawAniimo=rawHome.aniimo||[];workers=rawAniimo.map(a=>importedWorkerFromAniidex(a,catalogData));workerIdCounter=Math.max(1,...workers.map(w=>(Number(w.id)||0)+1));
 aniidexImportMeta={uid:String(rawHome.uid||profileData?.profile?.uid||profileData?.uid||''),importedAt:Date.now(),summary:sum,profile:profileData,home:homeData,catalog:catalogData,source:sourceLabel};
 const p=profileStore?.profiles?.[profileStore.current];if(p&&sum.name&&(/^Main Account$/i.test(p.name)||!p.name))p.name=sum.name;
 render();snapshotIntoCurrentProfile();renderProfileBar();
 return sum;
}
function focusHomelandImporter(){setMainTab('dashboard');setTimeout(()=>{const host=el('dashboardImport');host?.scrollIntoView({behavior:'smooth',block:'start'});el('aniidexCompanionUid')?.focus()},80)}


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
   const names=['manifest.json','background.js','planner-bridge.js','aniidex-isolated.js','aniidex-main.js','Install_Companion.bat','Update_Companion.bat'];
   const files={};
   for(const name of names){
     const r=await fetch('extension/'+name,{cache:'no-store'});
     if(!r.ok)throw new Error(name+' HTTP '+r.status);
     files['Aniimo_Homeland_Companion/'+name]=await r.text();
   }
   files['Aniimo_Homeland_Companion/INSTALL.txt']=
`ANIIMO HOMELAND COMPANION — INSTALL

RECOMMENDED FIRST INSTALL
1. Extract Aniimo_Homeland_Companion.zip.
2. Double-click Install_Companion.bat.
3. The installer copies the extension to:
   %LOCALAPPDATA%\\AniimoHomelandCompanion
4. Explorer opens that permanent folder.
5. Chrome and/or Edge extension settings will open when those browsers are installed.
6. Turn ON Developer mode.
7. Click "Load unpacked".
8. Select the permanent AniimoHomelandCompanion folder opened in Explorer.
9. Return to Aniimo Homeland Planner and refresh the page.
10. Confirm Import / Sync says "Companion detected ✓".

UPDATES
1. Download the newest Companion ZIP and extract it.
2. Double-click Update_Companion.bat.
3. The updater replaces the extension files in the same permanent folder.
4. Chrome / Edge already remember that unpacked folder.
5. On the browser extension card, click "Reload".
6. Refresh Aniimo Homeland Planner.

If Aniidx requires Cloudflare verification, its tab may be brought forward. Complete the normal verification and the import will continue automatically.

The companion does not export your Aniidx cookies or Turnstile token to the planner.
`;
   const blob=aniimoBuildStoreZip(files),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='Aniimo_Homeland_Companion.zip';document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1500);
   setAniidexCompanionMessage('Companion ZIP downloaded. Extract it and run Install_Companion.bat. Then use Load unpacked once on %LOCALAPPDATA%\\AniimoHomelandCompanion.');
 }catch(err){
   setAniidexCompanionMessage('Could not build companion download: '+(err?.message||err),true);
 }finally{
   if(btn){btn.disabled=false;btn.textContent=old||'Download Companion Extension';}
 }
}


let importUiMessage='';
let aniidexCompanionDetected=false;
let aniidexCompanionTimer=null;
let aniidexSyncInFlight=false;
let aniidexSyncMode='manual';
let aniidexAutoSyncMinutes=5;
let aniidexAutoSyncRunning=false;
let aniidexAutoSyncTimer=null;
let aniidexLastSyncAt=0;
let aniidexAutoSyncRecovery=false;

function formatAniidexSyncTime(ts){
 if(!ts)return 'Never';
 try{return new Date(ts).toLocaleTimeString([],{hour:'numeric',minute:'2-digit',second:'2-digit'});}catch{return 'Unknown';}
}
function clearAniidexAutoSyncTimer(){if(aniidexAutoSyncTimer){clearTimeout(aniidexAutoSyncTimer);aniidexAutoSyncTimer=null;}}
function scheduleAniidexAutoSync(){
 clearAniidexAutoSyncTimer();
 if(!aniidexAutoSyncRunning)return;
 aniidexAutoSyncTimer=setTimeout(()=>requestAniidexCompanionSync('auto'),Math.max(1,Number(aniidexAutoSyncMinutes)||5)*60000);
}
function stopAniidexAutoSync(reason=''){
 aniidexAutoSyncRunning=false;
 clearAniidexAutoSyncTimer();
 if(reason)importUiMessage=reason;
}
function failAniidexAutoSync(message){
 aniidexSyncInFlight=false;
 stopAniidexAutoSync();
 aniidexAutoSyncRecovery=true;
 importUiMessage='Auto-sync paused — Aniidx sync needs attention. '+String(message||'The refresh failed.')+' Open the Aniidx sync page, make sure your player data loads, then return here and click Sync now.';
 renderImportTab();
}
function openAniidexSyncPage(){window.open('https://aniidex.com/homeland/','_blank','noopener');}

function setAniidexCompanionMessage(message,isError=false){
 importUiMessage=String(message||'');
 const status=el('aniidexImportStatus');
 if(status){
   status.className=isError?'rightAlert':'rightGood';
   status.textContent=importUiMessage;
 }
}

function requestAniidexCompanionSync(mode='manual'){
 if(aniidexSyncInFlight)return;
 const input=el('aniidexCompanionUid');
 const uid=String(input?.value||aniidexImportMeta?.uid||'').trim();
 if(!/^[1-9]\d{7,15}$/.test(uid)){
   if(mode==='auto'){failAniidexAutoSync('A valid Aniimo UID is required.');return;}
   setAniidexCompanionMessage('Enter a valid numeric Aniimo UID first.',true);
   return;
 }
 aniidexSyncMode=mode==='auto'?'auto':'manual';
 aniidexSyncInFlight=true;
 const btn=el('aniidexCompanionBtn');if(btn)btn.disabled=true;
 const syncNow=el('aniidexSyncNowBtn');if(syncNow)syncNow.disabled=true;
 setAniidexCompanionMessage(aniidexSyncMode==='auto'?'Auto-syncing from Aniidx…':(aniidexCompanionDetected?'Connecting to Aniidx…':'Looking for the Aniimo Homeland Companion extension…'));
 window.postMessage({channel:'aniimo-homeland-planner',type:'ANIIMO_SYNC_REQUEST',uid},location.origin);
 clearTimeout(aniidexCompanionTimer);
 aniidexCompanionTimer=setTimeout(()=>{
   if(!aniidexCompanionDetected){
     aniidexSyncInFlight=false;
     if(btn)btn.disabled=false;if(syncNow)syncNow.disabled=false;
     if(aniidexSyncMode==='auto')failAniidexAutoSync('Aniimo Homeland Companion was not detected.');
     else setAniidexCompanionMessage('Aniimo Homeland Companion was not detected. Install/load the extension from this repository, then refresh the planner.',true);
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
   aniidexSyncInFlight=false;
   const btn=el('aniidexCompanionBtn');if(btn)btn.disabled=false;
   const syncNow=el('aniidexSyncNowBtn');if(syncNow)syncNow.disabled=false;
   if(!msg.ok){
     if(aniidexSyncMode==='auto')failAniidexAutoSync(msg.error||'Aniidx sync failed.');
     else setAniidexCompanionMessage(msg.error||'Aniidx sync failed.',true);
     return;
   }
   try{
     const data=msg.bundle||{};
     const profileData=data.profile||{};
     const homeData=data.homeland||{};
     const sum=applyAniidexImportedData(profileData,homeData,'Aniidx direct sync',aniidexBundleCatalog(data),aniidexSyncMode!=='auto');
     if(!sum){setAniidexCompanionMessage('Aniidx sync received; import was cancelled.');return;}
     aniidexLastSyncAt=Date.now();
     aniidexAutoSyncRecovery=false;
     setAniidexCompanionMessage(`${aniidexSyncMode==='auto'?'Auto-sync':'Direct Aniidx sync'} complete ✓ ${sum.name||'Player'} • RV ${sum.rv} • ${sum.aniimo} Homeland Aniimo • ${sum.facilities} facility pieces • ${sum.caught||0} caught forms`);
     if(aniidexAutoSyncRunning)scheduleAniidexAutoSync();
     renderImportTab();
   }catch(err){
     aniidexSyncInFlight=false;
     if(aniidexSyncMode==='auto')failAniidexAutoSync('Direct sync import failed: '+(err?.message||err));
     else setAniidexCompanionMessage('Direct Aniidx sync import failed: '+(err?.message||err),true);
   }
 }
});
function aniidexBookmarkletCode(){
 const code=`(async()=>{try{if(!/(^|\\.)aniidex\\.com$/i.test(location.hostname)){alert('Aniimo Homeland Sync must run on aniidex.com.\\n\\nAniidex Homeland will open now. Once it finishes loading, click the Aniimo Homeland Sync bookmark again.');location.href='https://aniidex.com/homeland/';return;}const uid=prompt('Aniimo UID to sync:');if(!uid)return;if(!/^\\d{8,16}$/.test(String(uid).trim())){alert('Please enter a numeric Aniimo UID.');return;}const get=async(u,o)=>{const r=await fetch(u,o);if(!r.ok)throw new Error(u+' HTTP '+r.status);return r.json()};const clean=String(uid).trim(),warnings=[];let stage='player context';const profile=await get('/api/player/'+encodeURIComponent(clean),{headers:{Accept:'application/json'}});await new Promise(r=>setTimeout(r,250));stage='Homeland snapshot';const homeland=await get('/api/player/home-import',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json','X-Aniidex-Request':'1'},body:JSON.stringify({uid:clean})});let planner=null;stage='Homeland reference data';try{planner=await get('/api/homeland/planner',{headers:{Accept:'application/json'},cache:'no-store'});}catch(e){warnings.push('Live planner reference unavailable; embedded decoder fallback will be used: '+(e&&e.message||e));}const bundle={format:'aniimo-homeland-sync-v4',capturedAt:new Date().toISOString(),source:'aniidex.com',uid:clean,profile:profile||{},homeland,planner,warnings};const b=new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='Aniimo_Homeland_'+clean+'_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);alert('Aniimo Homeland sync downloaded.\\n\\nLoad that JSON in the planner Dashboard Import / Sync section.');}catch(e){alert('Aniimo sync failed while loading '+(typeof stage==='string'?stage:'Aniidex data')+': '+(e&&e.message||e)+'\\n\\nOpen https://aniidex.com/homeland/, make sure you are signed in, load that player on Aniidex if needed, then click the sync bookmark again.');}})()`;
 return 'javascript:'+code.replace(/\\n+/g,' ');
}
async function importAniidexSyncFile(file){
 if(!file) return;
 const status=el('aniidexImportStatus');
 try{
  const data=JSON.parse(await file.text());
  let profileData,homeData,catalogData=null;
  if(data?.format==='aniimo-homeland-sync-v4'){profileData=data.profile||{};homeData=data.homeland;catalogData=aniidexBundleCatalog(data);}
  else if(data?.format==='aniimo-homeland-sync-v3'){profileData=data.profile||{};homeData=data.homeland;catalogData=EMBEDDED_ANIIDEX_CATALOG;}
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
 const text=`ANIIMO HOMELAND SYNC HELPER\n\n1. Show your browser bookmarks bar.\n2. Create a new bookmark named: Aniimo Homeland Sync\n3. Paste the entire line below into the bookmark URL/location field.\n4. Open https://aniidex.com/homeland/ and click the bookmark.\n5. Enter your Aniimo UID.\n6. A single JSON sync file downloads. Load that file in the planner's Dashboard Import / Sync section.\n\nBOOKMARKLET:\n${aniidexBookmarkletCode()}`;
 const blob=new Blob([text],{type:'text/plain'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='Aniimo_Homeland_Sync_Helper.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
function renderImportTab(targetId='dashboardImport',embedded=true){
 const root=el(targetId);if(!root)return;
 const meta=aniidexImportMeta, sum=meta?.summary||{};
 const directUid=esc(String(meta?.uid||''));
 root.innerHTML=`<div class="dashboardSyncHead"><div><div class="dashboardSyncEyebrow">${meta?'Homeland Sync':'Start Here'}</div><h3>${meta?'Import / Update Homeland':'Import / Sync Your Homeland'}</h3><div class="small">Sync a UID directly through the optional Aniimo Homeland Companion, or use the bookmarklet / saved sync-file fallbacks. The extension uses Aniidx's normal signed-in browser session and legitimate verification flow; it never exposes cookies or Turnstile tokens to the planner.</div></div></div>
 <div class="importSummary">${meta?`<span class="importChip">Last source: ${esc(meta.source||'Aniidx')}</span><span class="importChip">${esc(sum.name||'Player')} • RV ${sum.rv||'?'}</span><span class="importChip">${sum.aniimo||0} Homeland Aniimo</span><span class="importChip">${sum.caught||0} caught forms</span>`:'<span class="importChip">No Aniidx sync imported into this profile yet</span>'}</div>
 ${importUiMessage?`<div class="${/failed|not detected|invalid/i.test(importUiMessage)?'rightAlert':'rightGood'}" style="margin-top:10px">${esc(importUiMessage)}</div>`:''}
 <div class="importGrid" style="margin-top:12px">
  <div class="importMethod"><h3>1. Direct Aniidx Sync (Companion)</h3><div class="small">Enter a UID here. The companion asks Aniidx to authorize the lookup, completes the normal <b>/api/player/pass</b> verification when required, then returns the player profile and Homeland snapshot directly to this planner. If Cloudflare requires interaction, the Aniidx tab is brought forward only for that verification.</div><div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-top:10px"><label style="min-width:230px">Aniimo UID<input id="aniidexCompanionUid" inputmode="numeric" autocomplete="off" value="${directUid}" placeholder="Enter Aniimo UID"></label><button class="primary" id="aniidexCompanionBtn">Import from Aniidx</button><span id="aniidexCompanionState" class="small">${aniidexCompanionDetected?'Companion detected ✓':'Companion extension required'}</span></div><div style="margin-top:12px;padding:10px;border:1px solid #31495d;border-radius:10px"><b>Install the Companion Extension</b><div class="small" style="margin-top:6px">1. Click <b>Download Companion Extension</b> below. This downloads <b>only the extension</b>, not the whole GitHub repository.<br>2. Extract <b>Aniimo_Homeland_Companion.zip</b>.<br>3. Run <b>Install_Companion.bat</b>. It copies the extension to <b>%LOCALAPPDATA%\\AniimoHomelandCompanion</b> and opens Explorer plus the Chrome/Edge extensions page when available.<br>4. Turn on <b>Developer mode</b>.<br>5. Click <b>Load unpacked</b> and select that permanent <b>AniimoHomelandCompanion</b> folder.<br>6. Return here and refresh the planner. This box should change to <b>Companion detected ✓</b>.<br>7. For later versions, run <b>Update_Companion.bat</b> from the new ZIP, then click <b>Reload</b> on the extension card.</div><div style="margin-top:10px"><a class="bookmarkletLink" href="extension/download.html" target="_blank" rel="noopener">Download Companion Extension</a></div></div></div>
  <div class="importMethod"><h3>2. Bookmarklet Fallback</h3><div class="small">The existing same-origin helper remains available if you do not want to install the companion. It runs on Aniidx and downloads one JSON sync file without copying cookies or passwords into the planner.</div><ol class="importSteps"><li>Drag the button below to your bookmarks bar, or copy it into a new bookmark's URL.</li><li>Open Aniidx → Homeland and let the page finish loading.</li><li>Click the bookmark and enter your UID.</li><li>Load the downloaded JSON using the sync-file box.</li></ol><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><a id="syncBookmarklet" class="bookmarkletLink" href="#" title="Drag this to your bookmarks bar. Clicking it here will only open Aniidx.">Drag to Bookmarks: Aniimo Homeland Sync</a><button id="openAniidexBtn">Open Aniidx Homeland</button><button id="copyBookmarkletBtn">Copy Bookmarklet</button><button id="downloadBookmarkletBtn">Download Instructions</button></div><details style="margin-top:10px"><summary>Show bookmarklet code</summary><textarea id="bookmarkletCode" class="bookmarkletCode" readonly></textarea></details></div>
  <div class="importMethod"><h3>3. Load Sync File</h3><div class="syncDrop"><input type="file" id="aniidexSyncFile" accept="application/json,.json"><div class="small" style="margin-top:6px">Choose an <b>Aniimo_Homeland_...json</b> file downloaded by the fallback helper.</div></div><div class="small" style="margin-top:10px"><b>Import priority:</b> imported individual data → decoded Aniimo/form defaults → editable user overrides.</div></div>
  <div id="aniidexImportStatus" class="small" style="margin:10px 0"></div>
 </div>`;
 const bm=aniidexBookmarkletCode();el('syncBookmarklet').href=bm;el('bookmarkletCode').value=bm;el('syncBookmarklet').onclick=(e)=>{e.preventDefault();importUiMessage='Opened Aniidx Homeland. Once it finishes loading, click the Aniimo Homeland Sync bookmark from your browser bookmarks bar.';window.open('https://aniidex.com/homeland/','_blank');renderImportTab()};el('openAniidexBtn').onclick=()=>window.open('https://aniidex.com/homeland/','_blank');
 el('aniidexCompanionBtn').onclick=requestAniidexCompanionSync;
 el('aniidexCompanionUid').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();requestAniidexCompanionSync();}});
 el('copyBookmarkletBtn').onclick=async()=>{try{await navigator.clipboard.writeText(bm);importUiMessage='Bookmarklet copied. Create a bookmark and paste it into the URL/location field.';}catch{importUiMessage='Clipboard permission was blocked. Open “Show bookmarklet code” and copy it manually.';}renderImportTab()};
 el('downloadBookmarkletBtn').onclick=downloadBookmarkletText;
 el('aniidexSyncFile').onchange=e=>importAniidexSyncFile(e.target.files?.[0]);
 window.postMessage({channel:'aniimo-homeland-planner',type:'ANIIMO_COMPANION_PING'},location.origin);
}
