// Shared read-only Homeland economy data for storage, recipes and food across all profiles.
(function(){
 'use strict';
 const base=window.HOMELAND_REFERENCE_DATA||{};
 const entries=base.items||{};
 const supplemental=window.ANIIMO_ITEM_SUPPLEMENTAL_REFERENCE?.entries||{};
 const foodReference=window.ANIIMO_FOOD_ENERGY_REFERENCE?.entries||{};
 const questlog=window.ANIIMO_QUESTLOG_ITEMS?.byId||{};
 const thgl=window.ANIIMO_THGL_ITEMS?.byId||{};
 function record(id,catalog){
  const key=String(id??'');
  const live=catalog||{};
  const embedded=typeof EMBEDDED_ANIIDEX_CATALOG!=='undefined'?EMBEDDED_ANIIDEX_CATALOG:{};
  const sources=[live,embedded];
  let name='',sell=null,energy=null,icon='',source='';
  const setNumber=(v,current)=>v!=null&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):current;
  const baseItem=entries[key];
  const supplementalItem=supplemental[key]||{};
  if(baseItem){name=baseItem.name||'';sell=setNumber(baseItem.sell,sell);energy=setNumber(baseItem.food,energy);icon=baseItem.icon||'';source='Homeland reference';}
  if(thgl[key]?.name&&!name){name=thgl[key].name;source=thgl[key].url||'Aniimo.th.gl';}
  if(questlog[key]?.name&&!name){name=questlog[key].name;source=questlog[key].url||'QuestLog';}
  if(supplemental[key]){name=supplemental[key].name||name;sell=setNumber(supplemental[key].sell,sell);source=supplemental[key].source||source;}
  if(foodReference[key]){name=foodReference[key].name||name;energy=setNumber(foodReference[key].energy,energy);source=foodReference[key].source||source;}
  // Embedded facts before live, so the active profile wins when it adds a verified value.
  for(const c of sources.reverse()){
   const fact=c?.hub?.facts?.items?.[key]||c?.facts?.items?.[key];
   const txt=c?.text?.items?.[key]||c?.hub?.text?.items?.[key]||c?.siteText?.items?.[key];
   if(fact){sell=setNumber(fact.sell,sell);energy=setNumber(fact.food,energy);icon=fact.icon||icon; if(!name&&fact.path){const slug=String(fact.path).split('?')[0].split('/').filter(Boolean).pop();if(slug)name=slug.split('-').map(w=>w[0]?.toUpperCase()+w.slice(1)).join(' ');}}
   if(typeof txt==='string'&&txt)name=txt;
   else if(txt?.name||txt?.label)name=txt.name||txt.label;
  }
  if(!name){const fact=live?.hub?.facts?.items?.[key]||live?.facts?.items?.[key]||embedded?.hub?.facts?.items?.[key];const slug=String(fact?.path||'').split('?')[0].split('/').filter(Boolean).pop();if(slug)name=slug.split('-').map(w=>w[0]?.toUpperCase()+w.slice(1)).join(' ');}
  if(supplementalItem.nonSellable===true)sell=null;
  return {id:key,name:name||null,sell,energy,icon,nonSellable:supplementalItem.nonSellable===true,buyPrice:supplementalItem.buyPrice??null,buyCurrency:supplementalItem.buyCurrency||null,priceEvidence:supplementalItem.priceEvidence||null,source:source||'Aniidx reference',category:questlog[key]?.category||null,type:questlog[key]?.type||null,rarity:questlog[key]?.rarity||null,questlogSell:questlog[key]?.sell??null};
 }
 function allItems(catalog){
  const keys=new Set(Object.keys(entries));
  const embedded=typeof EMBEDDED_ANIIDEX_CATALOG!=='undefined'?EMBEDDED_ANIIDEX_CATALOG:{};
  for(const c of [embedded,catalog||{}])for(const id of Object.keys(c?.hub?.facts?.items||c?.facts?.items||{}))keys.add(id);
  for(const x of [supplemental,foodReference,questlog,thgl])for(const id of Object.keys(x))keys.add(id);
  return [...keys].map(id=>record(id,catalog));
 }
 function recipes(){
  return (base.recipes||[]).map(r=>({id:r.id,facilityId:r.facility,minLevel:r.minLevel,kind:r.kind,inputs:r.inputs||[],outputs:r.outputs||[],time:r.time,workload:r.workload,steps:r.steps||[]}));
 }
 window.HomelandItemCatalog={lookup:record,allItems,recipes};
})();
