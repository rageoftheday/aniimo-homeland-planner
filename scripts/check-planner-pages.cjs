// Validate that all direct-load page entrypoints match the common app shell.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const routes=[["dashboard","dashboard.html","Dashboard"],["map","homeland.html","Homeland Planner"],["snapshot","snapshot.html","Home Snapshot"],["plan","advisor.html","Plan / Advice"],["roster","roster.html","Imported Roster"],["aniimos","aniimos.html","Aniimos"],["production","recipes.html","Recipes"],["database","database.html","Database"],["raw","raw-json.html","Raw JSON"]];
const source=fs.readFileSync('index.html','utf8');
for(const [tab,file,label] of routes){
 const content=fs.readFileSync(file,'utf8');
 assert.equal(content,source,'Out-of-sync shared page: '+file);
 assert(source.includes('data-tab="'+tab+'" href="'+file+'"'),'Missing navigation: '+label);
}
assert(source.includes('js/views.js?v=30.23.31'));
assert(source.includes('id="mobilePanelNav"'),'Mobile panel navigation required');
assert(source.includes('id="mobileJsonImportInput"'),'Mobile JSON picker required');
for(const marker of ['headerSyncPanelLink','headerAutoSyncInterval','headerAutoSyncToggle','headerSyncLast'])assert(source.includes('id="'+marker+'"'),'Missing global sync header '+marker);
const views=fs.readFileSync('js/views.js','utf8');
assert(views.includes('setMainTab(homelandTabForLocation())'));
assert(views.includes("window.addEventListener('popstate'"));
console.log('PASS: 9 direct-load page routes share the same app shell and history navigation');
