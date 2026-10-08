// Original extracted PNG image lookup. IDs are authoritative; names and aliases are fallbacks.
(function(){
 'use strict';
 const slug=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
 const aliases={'joywheel_loom':'joy_wheel_loom','joy_wheel':'joy_wheel_loom','pickling_station':'pickling_jar','work_bench':'woodworking_bench','woodworking_workbench':'woodworking_bench','tidewisper_sand_castle':'tidewhisper_sandcastle','tidewhisper_sand_castle':'tidewhisper_sandcastle','claw_game':'claw_game_cooker','jukebox_dryer_lv_2':'jukebox_dryer_level_2'};
 const paths={'Items':'items','Recipes':'recipes','Aniimo':'aniimo','Skills':'skills','Talents':'talents','Types':'types','Badges':'badges','Roles':'roles'};
 function itemId(value){
  const key=String(value??'').trim(),data=window.HOMELAND_REFERENCE_DATA||{};
  if(data.items?.[key])return key;
  const recipe=Array.isArray(data.recipes)?data.recipes.find(x=>String(x.id)===key):data.recipes?.[key];
  if(recipe?.outputs?.[0]?.item!=null)return String(recipe.outputs[0].item);
  const normalized=slug(key).replace(/^quick_/,'').replace(/_quick$/,'').replace(/_\d+$/,'');
  const item=Object.entries(data.items||{}).find(([,v])=>slug(v?.name)===normalized);
  return item?.[0]||key;
 }
 const api={
  ready:false,manifest:null,
  file(category,value){
   if(value==null||!this.manifest)return '';
   const assets=this.manifest.assets?.[category]||{},names=this.manifest.names?.[category]||{};
   const id=String(value).trim(),key=slug(value),alias=aliases[key]||key;
   // Some accelerated recipes have their own inventory icons (e.g. 4020060 Quick Sea Salt).
   // Production requests should show the produced item, not that recipe-token graphic.
   if(category==='Items'||category==='Recipes'){
    const rec=window.HOMELAND_REFERENCE_DATA?.recipes;
    const recipe=Array.isArray(rec)?rec.find(x=>String(x.id)===id):rec?.[id];
    const output=recipe?.outputs?.[0]?.item;
    if(output!=null&&String(output)!==id){
     const outputId=String(output);
     const itemAssets=this.manifest.assets?.Items||{};
     const recipeAssets=this.manifest.assets?.Recipes||{};
     if(itemAssets[outputId]||recipeAssets[outputId])return itemAssets[outputId]||recipeAssets[outputId];
    }
   }
   if(assets[id])return assets[id];
   if(names[key])return names[key];
   if(names[alias])return names[alias];
   if(category==='Items'||category==='Recipes'){
    const resolved=itemId(id);
    if(resolved!==id&&assets[resolved])return assets[resolved];
    const alternate=this.manifest.assets?.[category==='Items'?'Recipes':'Items']||{};
    const alternateNames=this.manifest.names?.[category==='Items'?'Recipes':'Items']||{};
    return alternate[resolved]||alternate[id]||alternateNames[key]||alternateNames[alias]||'';
   }
   return '';
  },
  // Quick recipes have distinct original artwork, separate from their regular outputs.
  // Use the original recipe PNG when named Quick; never substitute the standard product.
  quick(name,recipeId){
   if(!this.manifest)return '';
   const files=this.manifest.assets?.Items||{},names=this.manifest.names?.Items||{};
   const id=String(recipeId??'');
   if(/^402\d+$/.test(id)&&/\/(?:402\d+)_quick_(?:recipe|formula)_/.test(files[id]||''))return files[id];
   const base=slug(name).replace(/^quick_/,'').replace(/_level_\d+.*$/,'').replace(/_lv\d+.*$/,'');
   const aliases={'fresh_water':'fresh_water','plain_fresh_water':'fresh_water','natural_mineral_spring':'natural_mineral_water'};
   const key=aliases[base]||base;
   return names['quick_recipe_'+key]||names['quick_formula_'+key]||'';
  },
  facility(name,level){
   if(!this.manifest)return '';
   let nameKey=slug(name).replace(/_level_\d+$/,'');
   nameKey=aliases[nameKey]||nameKey;
   const lvl=Math.max(1,Number(level)||1);
   const names=this.manifest.names?.Items||{};
   const variants=[nameKey+'_level_'+lvl,nameKey+'_lv_'+lvl,nameKey];
   for(const key of variants)if(names[key])return names[key];
   return '';
  },
  picture(category,value,size=26){return this.image(this.file(category,value),size);},
  image(path,size=26){
   if(!path)return '';
   const n=Math.max(12,Math.min(64,Number(size)||26));
   return '<img class="homelandLocalIcon" src="'+path+'" alt="" loading="lazy" decoding="async" onerror="this.remove()" style="display:block;width:100%;height:100%;max-width:'+n+'px;max-height:'+n+'px;object-fit:contain;flex-shrink:0">';
  }
 };
 window.HomelandLocalIcons=api;
 // The manifest is versioned for cache invalidation, and may be absent on older deployments.
 fetch('data/homeland-local-icons.json?v=2').then(r=>{if(!r.ok)throw Error('local icon manifest unavailable');return r.json();})
  .then(m=>{api.manifest=m;api.ready=true;
    if(typeof renderV30Views==='function')renderV30Views();
    else if(typeof render==='function')render();
  }).catch(()=>{});
})();