// Simulates the actual Homebuilder recipe import against bundled reference data.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
global.window=global;require('../data/homeland-reference-data.js');
const ref=global.HOMELAND_REFERENCE_DATA;
const manifest=JSON.parse(fs.readFileSync('data/homeland-local-icons.json','utf8'));
const src=fs.readFileSync('js/app.js','utf8');
const start=src.indexOf('const recipeDB=')+'const recipeDB='.length;
const end=src.indexOf('\n};',start);
assert(end>start,'Cannot locate legacy recipe database');
const db=vm.runInNewContext('('+src.slice(start,end+2)+')');
const normalize=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
const pngs=manifest.assets.Items;
const names=manifest.names.Items;
const iconLookup={
 quick(name,id){
  const art=pngs[String(id)]||'';
  if(/_quick_(?:recipe|formula)_/.test(art))return art;
  const base=normalize(name).replace(/^quick_/,'');
  return names['quick_formula_'+base]||names['quick_recipe_'+base]||'';
 }
};
const fnStart=src.indexOf('function populateReferenceStationRecipes(){');
const fnEnd=src.indexOf('\nfunction STATION_RULES_PENDING_RECIPE_COMPAT',fnStart);
assert(fnStart>0&&fnEnd>fnStart,'Cannot locate reference recipe import');
const env={HOMELAND_REFERENCE_DATA:ref,HomelandLocalIcons:iconLookup};
const factory=new Function('recipeDB','window','HOMELAND_FAMILY_BY_ID','FAMILY_RECIPE_RULES','HOMELAND_REFERENCE_RECIPE_IDS',
 src.slice(fnStart,fnEnd)+'\nfunction STATION_RULES_PENDING_RECIPE_COMPAT(s){return s!==\'Farmland\'&&s!==\'Woodland\'}\nreturn populateReferenceStationRecipes;');
const load=factory(db,env,{1017:'susuta',1019:'shelly',1026:'nimbi',1021:'iris',1035:'dewy',1001:'celestis',1023:'flutternym'},{},new Set());
load();
const stationNames=new Map(ref.facilities.map(f=>[String(f.type),f.name]));
let audited=0;
for(const recipe of ref.recipes){
 if(recipe.kind==='crop')continue;
 audited++;
 const station=stationNames.get(String(recipe.facility));
 const matching=(db[station]||[]).filter(row=>String(row.recipeId)===String(recipe.id));
 assert.equal(matching.length,1,station+' recipe #'+recipe.id+' must appear exactly once');
 const row=matching[0];
 assert.equal(String(row.outputItemId),String(recipe.outputs[0].item),'Wrong output for '+recipe.id);
 assert.equal(Number(row.minLevel),Number(recipe.minLevel),'Wrong unlock level for '+recipe.id);
 assert(pngs[String(row.outputItemId)]||manifest.assets.Recipes[String(row.outputItemId)],'Output art missing '+recipe.id);
}
assert.equal(audited,179,'Non-crop reference recipe count changed');
const sand=db['Tidewhisper Sandcastle'].filter(x=>x.reference);
assert.deepEqual(sand.map(x=>[String(x.recipeId),x.name,Number(x.minLevel)]).sort((a,b)=>a[0].localeCompare(b[0])),[
 ['4001049','Pearl',3],['4001069','Sea Salt',1],['4020060','Quick Sea Salt',2]
]);
assert.equal(db['Floral Windmill'].filter(x=>x.reference&&x.name==='Quick Scales').length,1,'Quick Scales not matched');
const extras=Object.entries(db).flatMap(([station,rows])=>rows.filter(row=>!row.reference).map(row=>station+': '+row.name));
assert(extras.every(x=>x.startsWith('Mine: ')), 'Unmatched legacy recipes: '+extras.join(', '));
assert(src.includes('hasReferences=stationRecipes.some(r=>r.reference)'),'Picker must use reference records');
assert(src.includes('r.reference||r.name===o.recipeName'),'Picker must retain a saved legacy selection');
console.log('Facility recipe audit passed:',audited,'reference recipes,',Object.keys(db).length,'station lists,',extras.length,'saved-only legacy Mine entries.');