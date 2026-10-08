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
const match=source.match(/const recipeDB=([\s\S]*?);\n(?:const |let |function )/);
assert(match,'Interactive recipeDB declaration not found');
const db=vm.runInNewContext('('+match[1]+')');
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