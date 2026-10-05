// v30.10 first-party Homeland data adapter.
// Keeps the UI independent from live Aniidx requests while letting existing planner code
// consume authoritative facility/level/footprint/cap facts from the captured reference snapshot.
(function(){
  const raw=window.HOMELAND_REFERENCE_DATA||null;
  const aliases={
    'Egg Incubator':'Hatchinator',
    'Joywheel Loom':'Joy Wheel Loom',
    'Woodworking Workbench':'Woodworking Bench',
    'Tidewisper Sand Castle':'Tidewhisper Sandcastle',
    'Tidewisper SandCastle':'Tidewhisper Sandcastle'
  };
  const canonical=n=>aliases[n]||n;
  const facilities=new Map((raw?.facilities||[]).map(f=>[canonical(f.name),f]));
  if(raw?.storage) facilities.set(canonical(raw.storage.name||'Storage Unit'),Object.assign({levels:[],rv:1},raw.storage));

  function counts(){
    return {
      facilities:(raw?.facilities||[]).length,
      recipes:Array.isArray(raw?.recipes)?raw.recipes.length:Object.keys(raw?.recipes||{}).length,
      items:Array.isArray(raw?.items)?raw.items.length:Object.keys(raw?.items||{}).length,
      rv:(raw?.rv||[]).length,
      plots:(raw?.plots||[]).length,
      forms:(raw?.forms||[]).length,
      modules:(raw?.modules||[]).length,
      abilities:Object.keys(raw?.abilities||{}).length
    };
  }
  function countByRv(cap){
    const out={};
    (cap||[]).forEach((v,i)=>out[i+1]=Number(v)||0);
    return out;
  }
  function firstUnlockRv(f){
    const levels=f?.levels||[];
    if(levels.length)return Math.min(...levels.map(x=>Number(x.rv)||99));
    return Number(f?.rv)||1;
  }
  function levelRows(name){
    const f=facilities.get(canonical(name));
    return (f?.levels||[]).map(x=>({
      lv:Number(x.level)||1,
      rv:Number(x.rv)||1,
      cost:Number(x.upgradeCost)||0,
      buyCost:Number(x.buyCost)||Number(x.upgradeCost)||0,
      outputLimit:x.outputLimit==null?null:Number(x.outputLimit),
      recipes:[...(x.recipes||[])],
      electricRecipes:[...(x.electricRecipes||[])],
      electricRequire:x.electricRequire==null?null:Number(x.electricRequire),
      electricModeRv:x.electricModeRv==null?null:Number(x.electricModeRv)
    }));
  }
  function applyCatalogFacts(catalog){
    if(!raw||!Array.isArray(catalog))return {matched:0,missing:[]};
    let matched=0; const missing=[];
    for(const item of catalog){
      const f=facilities.get(canonical(item.name));
      if(!f){missing.push(item.name);continue}
      matched++;
      const fp=f.footprint;
      if(Array.isArray(fp)&&fp.length>=2){item.w=Number(fp[0]);item.h=Number(fp[1]);}
      item.rv=firstUnlockRv(f);
      if(Array.isArray(f.capByRv))item.countByRV=countByRv(f.capByRv);
      if(item.countByRV)delete item.count;
      item.referenceType=f.type??item.referenceType;
      item.referenceSource='homeland-reference-v1';
    }
    return {matched,missing};
  }
  function applyFacilityLevels(target){
    if(!raw||!target)return 0;
    let changed=0;
    for(const [name,f] of facilities){
      if(!(f?.levels||[]).length)continue;
      target[name]=levelRows(name);
      changed++;
    }
    return changed;
  }
  function getFacility(name){return facilities.get(canonical(name))||null}
  function getRecipe(id){
    const list=Array.isArray(raw?.recipes)?raw.recipes:Object.values(raw?.recipes||{});
    return list.find(r=>String(r.id??r.recipeId??r.type)===String(id))||null;
  }
  function validate(){
    const issues=[];
    if(!raw)issues.push('reference dataset missing');
    if((raw?.facilities||[]).length!==29)issues.push('expected 29 facilities');
    if((Array.isArray(raw?.recipes)?raw.recipes.length:Object.keys(raw?.recipes||{}).length)!==217)issues.push('expected 217 recipes');
    if((raw?.plots||[]).length!==16)issues.push('expected 16 plots');
    if((raw?.rv||[]).length!==20)issues.push('expected 20 RV levels');
    return {ok:issues.length===0,issues,counts:counts()};
  }
  window.HomelandData={raw,counts,getFacility,getRecipe,levelRows,applyCatalogFacts,applyFacilityLevels,validate};
})();