const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const manifest=JSON.parse(fs.readFileSync('data/homebuilder-aniimo-portraits.json','utf8'));
const entries=Object.entries(manifest.assets||{});
assert.equal(entries.length,208,'Expected all 208 original circular portraits');
for(const [key,path] of entries){
 assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key),'Invalid normalized key '+key);
 assert.equal(path,'assets/homebuilder-aniimo-portraits/'+key+'.png');
 const bytes=fs.readFileSync(path);
 assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Invalid PNG: '+path);
}
assert(manifest.assets['nighttime-piopiota'],'Nighttime Piopiota must resolve');
assert(manifest.assets['prismana-glacy'],'Prismana Glacy must resolve');
assert(manifest.assets['sea-of-flowers-glacy'],'Sea of Flowers Glacy must resolve');
assert(fs.readFileSync('assets/homebuilder-aniimo-portraits/unassigned-aniimo.svg','utf8').includes('<svg'),'Missing neutral Aniimo placeholder');
const source=fs.readFileSync('js/app.js','utf8');
const section=source.slice(source.indexOf('const ANIIMO_CATALOG=['),source.indexOf('];',source.indexOf('const ANIIMO_CATALOG=['))+2);
const catalog=[...section.matchAll(/\{name:'([^']+)',form:'([^']+)'/g)].map(x=>({name:x[1],form:x[2]}));
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const missingSpecific=[];
for(const {name,form} of catalog){
 const base=slug(name),key=slug(form.replace(/ form$/i,'')+' '+name);
 assert(manifest.assets[base]||manifest.assets[key],'No portrait for '+name+' '+form);
 if(form!=='Base'&&!manifest.assets[key])missingSpecific.push(name+' — '+form);
}
assert.deepEqual(missingSpecific,[],'Every built-in Aniimo form should have its correct portrait');
const embedded=fs.readFileSync('data/embedded-aniidex-catalog.js','utf8');
const catalogData=vm.runInNewContext(embedded+';EMBEDDED_ANIIDEX_CATALOG');
const formLabels=catalogData.text.forms;
assert.equal(Object.keys(formLabels).length,210,'Expected 210 official Aniidex form IDs');
assert.equal(Object.keys(manifest.byFormId).length,208,'Expected exactly 208 mapped form IDs');
const excluded=manifest.intentionallyExcludedFormIds;
assert.deepEqual(Object.keys(excluded).sort(),['1036300','1037300'],'Intentional exclusions must be explicit');
for(const [id,info] of Object.entries(formLabels)){
 const key=slug((info.form?info.form.replace(/ form$/i,'')+' ':'')+info.name);
 const file=manifest.byFormId[id];
 if(excluded[id]){assert(!file,'Excluded form must not be mapped: '+id);continue}
 assert.equal(file,manifest.assets[key],'Incorrect form ID mapping '+id+' '+key);
}
assert.equal(manifest.byFormId['1032301'],manifest.assets['thunderstorm-thornblade'],'Thunderstorm Thornblade must use 1032301');
const loader=fs.readFileSync('js/homebuilder-portraits.js','utf8');
assert(loader.includes('manifest?.assets?.[key]'),'Manifest lookup must be exact');
assert(loader.includes('assets/homebuilder-aniimo-portraits/unassigned-aniimo.svg'),'Missing artwork must use the universal Aniimo placeholder');
const view=fs.readFileSync('js/views.js','utf8');
assert(view.includes('const live=assigned?[assigned]:[];'),'Unassigned map objects must have no badges');
console.log('Circular portrait audit PASS: 208 valid PNGs, '+catalog.length+' built-in Aniimo entries, 2 intentional omissions (Soleon and Fennelun).');
