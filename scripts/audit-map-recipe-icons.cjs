// Exhaustive offline icon coverage checks for the interactive Homeland recipe picker.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
global.window=global;
require('../data/homeland-reference-data.js');
const data=global.HOMELAND_REFERENCE_DATA;
const manifest=JSON.parse(fs.readFileSync('data/homeland-local-icons.json','utf8'));
const assets=manifest.assets.Items||{},recipeAssets=manifest.assets.Recipes||{};
const pathFor=id=>assets[String(id)]||recipeAssets[String(id)]||'';
const failures=[];
for(const r of data.recipes){
 const id=r.outputs?.[0]?.item;
 if(id==null||!pathFor(id))failures.push('Reference recipe '+r.id+': missing output PNG for '+id);
}
const source=fs.readFileSync('js/app.js','utf8');
const start=source.indexOf('const recipeDB=');
assert(start>=0,'Interactive recipeDB declaration not found');
const first=start+'const recipeDB='.length;
const end=source.indexOf('\n};',first);
assert(end>first,'Interactive recipeDB closing brace missing');
const db=vm.runInNewContext('('+source.slice(first,end+2)+')');
const norm=s=>String(s||'').toLowerCase().replace(/^quick\s+/,'').replace(/\s*[×x]\s*\d+\s*$/,'').replace(/[^a-z0-9]/g,'');
let count=0,composite=0;
for(const [station,rows] of Object.entries(db)){
 for(const recipe of rows){
  count++;
  if(station==='Mine'&&recipe.name.includes(' + ')){composite++;continue;}
  const output=recipe.outputItemId||Object.entries(data.items).find(([,x])=>norm(x.name)===norm(recipe.name))?.[0];
  if(!output||!pathFor(output))failures.push('Map recipe '+station+' / '+recipe.name+': no output PNG');
 }
}
// Every uploaded quick formula/recipe has a distinct PNG and must not be
// replaced with the normal produced-item icon.
const sandcastle=data.recipes.filter(r=>String(r.facility)==='1010006');
assert.deepEqual(sandcastle.map(r=>String(r.id)).sort(),['4001049','4001069','4020060']);
assert.equal(Number(sandcastle.find(r=>String(r.id)==='4001049').minLevel),3);
assert.equal(Number(sandcastle.find(r=>String(r.id)==='4020060').minLevel),2);
assert(source.includes("const wantedName=quickArt?'Quick '+info.name:info.name"),'Quick recipes must use correct legacy names');
const cropStart=source.indexOf('const crops=');
const cropFrom=cropStart+'const crops='.length,cropEnd=source.indexOf('];',cropFrom);
assert(cropStart>=0&&cropEnd>cropFrom,'Crop catalog unavailable');
const crops=vm.runInNewContext('('+source.slice(cropFrom,cropEnd+1)+')');
for(const crop of crops){
 const key=String(crop.name).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
 assert(manifest.names.Items[key]||Object.values(data.items).some(x=>String(x.name).toLowerCase()===String(crop.name).toLowerCase()),'Missing selectable plant icon '+crop.name);
}
const quickIcons=Object.entries(assets).filter(([id,path])=>/^402\d+$/.test(id)&&/_quick_(?:recipe|formula)_/.test(path));
assert.equal(quickIcons.length,27,'Expected 27 original quick icons');
for(const [id,path] of quickIcons){
 assert(pathFor(id)===path,'Quick artwork lost for '+id);
 const short=path.split('/').pop().replace(/^402\d+_quick_(?:formula|recipe)_/,'').replace(/\.png$/,'');
 assert(short.length>0,'Missing quick image name for '+id);
}
const quick=data.recipes.find(r=>String(r.id)==='4020060');
assert.equal(String(quick.outputs?.[0]?.item),'4001069','Quick Sea Salt must yield Sea Salt');
assert(pathFor('4001069').endsWith('/4001069_sea_salt.png'));
assert(pathFor('4001049').endsWith('/4001049_pearl.png'));
assert(pathFor('4020060').endsWith('/4020060_quick_recipe_sea_salt.png'));
const views=fs.readFileSync('js/views.js','utf8');
assert(views.includes('selectedRecipe?.outputItemId'),'Map renderer must prefer actual item ID');
assert(views.includes('productionArt||idleArt'),'None must restore building artwork');
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
else console.log('Map recipe PNG audit passed:',data.recipes.length,'reference outputs;',count,'legacy map recipes;',composite,'composite Mine exceptions. All remaining icons found.');