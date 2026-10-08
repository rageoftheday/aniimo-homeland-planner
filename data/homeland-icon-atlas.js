// Verified TH.GL atlas cells from the provided 3,581-item database export.
// These are local, validated Homeland outputs; unlisted items gracefully fall back.
(function(){
 'use strict';
 const url='https://cdn.th.gl/aniimo/icons/icons.f142638c8e3e64306636dfb0158d439e.webp';
 const data="4001000|Wheat|1058|1784\n4001001|Sugarcane|1124|1784\n4001002|Potato|1586|1784\n4001003|Rice|1652|1784\n4001004|Cotton|1190|1784\n4001005|Strawberry|1718|1784\n4001006|Lotus Root|1784|1784\n4001007|Lavender|1850|1784\n4001008|Sorghum|1916|1784\n4001009|Soybean|1982|1784\n4001010|Grapes|2048|1784\n4001011|Taro|2114|1784\n4001012|Cocoa|2180|1784\n4001013|Agave|2246|1784\n4001014|Rose|2312|1784\n4001015|Cranberry|2378|1784\n4001016|Ginseng|2444|1784\n4001017|Bamboo|2510|1784\n4001018|Willow Wood|2576|1784\n4001019|Rubber Tree Timber|2642|1784\n4001020|Maple Tree Timber|2708|1784\n4001021|Palm Tree Timber|2774|1784\n4001022|Pine Tree Timber|2840|1784\n4001023|Apple Tree Timber|2906|1784\n4001024|Cherry Tree Timber|2972|1784\n4001025|Bitter Orange Tree Timber|3038|1784\n4001026|Volcano Bean Tree Timber|3104|1784\n4001027|Aloeswood Timber|3170|1784\n4001028|Lemon Tree Timber|3236|1784\n4001029|Natural Rubber|3302|1784\n4001030|Maple Syrup|3368|1784\n4001031|Palm Bark|3434|1784\n4001032|Pine Tree Heartwood|3500|1784\n4001033|Apple|3566|1784\n4001034|Cherry Blossom|3632|1784\n4001035|Orange Flower|3698|1784\n4001036|Volcano Bean|3764|1784\n4001037|Aloeswood|3830|1784\n4001038|Lemon|3896|1784\n4001039|Coconut|3962|1784\n4001040|Walnut|2|1850\n4001041|Chestnut|68|1850\n4001042|Scales|134|1850\n4001043|Advanced Scales|200|1850\n4001044|Wool|266|1850\n4001045|Petals|332|1850\n4001046|Aromathyst|1256|1784\n4001047|Star|398|1850\n4001048|Fertilizer|464|1850\n4001049|Pearl|530|1850\n4001050|Love Bubble|596|1850\n4001051|Shell|662|1850\n4001052|Gem|728|1850\n4001053|Rock|794|1850\n4001054|Copper Ore|860|1850\n4001055|Iron Ore|926|1850\n4001056|Quartz Ore|992|1850\n4001057|Clay|1058|1850\n4001058|Bamboo Shoots|1124|1850\n4001059|Coconut Tree Timber|1190|1850\n4001060|Walnut Tree Timber|1256|1850\n4001061|Chestnut Tree Timber|1322|1850\n4001062|Pumpkin|1388|1850\n4001063|Milled Rice|1454|1850\n4001064|Wood Block|1520|1850\n4001065|Mineral Sand|1586|1850\n4001066|Moondew Radish|1652|1850\n4001067|Waxing Moon Pepper|1718|1850\n4001068|Captain Spud|1784|1850\n4001069|Sea Salt|1850|1850\n4001070|Well Water|1916|1850\n4001071|Plain Fresh Water|1982|1850\n4001072|Deep Rock Spring Water|2048|1850\n4001073|Natural Mineral Spring|2114|1850";
 const byId={},byName={};
 for(const line of data.split('\n')){
   const [id,name,x,y]=line.split('|');
   const value={id,name,x:Number(x),y:Number(y),width:64,height:64};
   byId[id]=value;byName[name.toLowerCase()]=value;
 }
 byName['salt']=byName['sea salt'];
 byName['maple']=byName['maple syrup'];
 byName['cherry']=byName['cherry blossom'];
 byName['bitter orange']=byName['orange flower'];
 byName['emerald bamboo']=byName['bamboo'];
 byName['quick sea salt']=byName['sea salt'];
 const special=(name)=>String(name||'').toLowerCase().trim().replace(/\s*\(quick\)$/,'').replace(/^quick /,'');
 function find(idOrName){return byId[String(idOrName)]||byName[special(idOrName)]||null;}
 // Percentage-based crop follows the actual tile width, including tiny farmland.
 function sprite(v,size,portrait=false){
   const n=Math.max(12,Math.min(64,Number(size)||24));
   const cls=portrait?'aniimoAtlasIcon aniimoPortraitIcon':'aniimoAtlasIcon';
   const aria=portrait?' role="img" aria-label="'+String(v.name).replace(/"/g,'&quot;')+'"':' aria-hidden="true"';
   const crop='width:100%;max-width:'+n+'px;aspect-ratio:1;display:inline-block;vertical-align:middle;flex:0 1 auto;min-width:0;min-height:0;overflow:hidden;position:relative;'+(portrait?'border-radius:50%;':'');
   // Explicit percentage sizes/offsets keep the original 64px crop at any displayed size.
   const img='position:absolute;max-width:none;width:'+(4031/64*100)+'%;height:'+(4079/64*100)+'%;left:-'+(v.x/64*100)+'%;top:-'+(v.y/64*100)+'%;pointer-events:none';
   return '<span class="'+cls+'"'+aria+' style="'+crop+'"><img src="'+url+'" alt="" loading="lazy" decoding="async" style="'+img+'"></span>';
 }
 // Resolve a recipe ID to its actual output item before looking up artwork.
 function outputItem(value){
   const id=String(value??'').trim(),reference=window.HOMELAND_REFERENCE_DATA||{};
   const rows=reference.recipes||[];
   const recipe=Array.isArray(rows)?rows.find(r=>String(r.id)===id):rows[id];
   return String(recipe?.outputs?.[0]?.item??id);
 }
 function catalogItem(value){
   const id=outputItem(value),ref=window.HOMELAND_REFERENCE_DATA?.items||{};
   return {id,item:ref[id]||null};
 }
 function html(idOrName,size=24){
   const direct=find(idOrName);if(direct)return sprite(direct,size);
   const resolved=outputItem(idOrName),v=find(resolved);if(v)return sprite(v,size);
   // The captured catalog provides ui_item_<ID> assets for items without atlas cells.
   // Keep an ordinary icon fallback if this remote asset is not published.
   const {id,item}=catalogItem(idOrName);
   if(!item||!/^\\d+$/.test(id))return '';
   const n=Math.max(12,Math.min(64,Number(size)||24));
   const path='https://aniidex.com/images/items/'+encodeURIComponent(item.icon||'ui_item_'+id)+'.webp';
   return '<span class="aniimoAtlasIcon aniimoCatalogIcon" title="'+String(item.name||'').replace(/"/g,'&quot;')+'" style="display:inline-flex;width:100%;max-width:'+n+'px;aspect-ratio:1;align-items:center;justify-content:center;overflow:hidden;vertical-align:middle"><span aria-hidden="true" style="font-size:55%;position:absolute">◈</span><img src="'+path+'" alt="" loading="lazy" decoding="async" onerror="this.remove()" style="position:relative;display:block;width:100%;height:100%;object-fit:contain"></span>';
 }
 const charRows="Celestis:3962,134 Stellarys:1322,200 Helmut:398,200 Pawney:992,200 Rookey:1124,200 Wisptis:1454,200 Ignitis:728,200 Inferlupa:926,200 Hexxin:596,200 Dreaple:68,200 Dewy:2,200 Fragrancier:134,200 Helmwhelp:2840,134 Helgon:2708,134 Jawling:2972,134 Chirpi:68,68 Tromber:3368,134 Cornet:266,68 Tubster:3566,134 Flutternym:2444,134 Gracewing:1454,134 Nimbi:3104,134 Turbo:3764,134 Eko:2378,134 Eklue:2312,134 Infergon:3896,266 Emberpup:2774,2 Flameruff:3236,2 Scorchhowl:3566,2 Lavazar:3434,2 Magmarex:3500,2 Sparki:3698,2 Flamerion:2972,2 Squarrel:3962,2 Squashel:2,68 Fulmintis:662,332 Besauce:1850,332 Bulbly:3698,68 Veilfloat:134,134 Luminelle:3896,68 Bolty:3566,68 Blazen:3500,68 Fentuft:3830,68 Fenmane:3764,68 Dazmand:3698,398 Skippy:1256,68 Pranky:926,68 Susuta:1454,68 Popota:794,68 Piopiota:662,68 Panpanta:596,68 Shelly:1190,68 Sheldon:1124,68 Sherro:2,134 Jabster:3170,398 Fahloo:530,68 Erlath:464,68 Glacy:530,134 Bonesky:200,134 Fenrier:332,134 Glynsera:200,200 Geoclaw:464,134 Leafy:2642,68 Budclaw:992,134 Shrubclaw:1916,134 Hummin:1718,68 Tuckin:3368,68 Iris:1850,68 Irisal:2246,68 Irisalis:794,398 Somniwing:1454,398 Budsquire:1586,68 Thornblade:3170,68 Melloblum:2708,68 Pomegg:2906,68 Pomawk:2774,68 Morphling:1520,398 Pebbling:1850,134 Geodeback:1388,134 Minespine:1784,134 Cozite:1256,134 Bailite:728,134 Baleetle:794,134 Waleetle:2180,134 Bouldus:926,134 Cubbo:1322,134 Grizbo:1718,134 Helion:2906,398 Soleon:2972,398 Lunara:3038,398 Fennelun:3104,398";
 const characters={};
 for(const piece of charRows.split(' ')){
  const [name,xy]=piece.split(':');if(!name||!xy)continue;
  const [x,y]=xy.split(',').map(Number);characters[name.toLowerCase()]={name,x,y,width:64,height:64};
 }
 function character(name,size=26){
  const v=characters[String(name||'').toLowerCase().trim()];
  return v?sprite(v,size,true):'';
 }
 window.AniimoIconAtlas={url,byId,byName,find,html,outputItem,catalogItem,characters,character};
})();