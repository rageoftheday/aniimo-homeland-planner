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
 function html(idOrName,size=24){
   const v=find(idOrName);if(!v)return '';
   const n=Math.max(12,Math.min(64,Number(size)||24));
   // object-position is measured in source pixels, so scale the full image explicitly.
   const scale=n/64;
   return '<span class="aniimoAtlasIcon" aria-hidden="true" style="width:'+n+'px;height:'+n+'px;display:inline-block;vertical-align:middle;flex:none;overflow:hidden;position:relative"><img src="'+url+'" alt="" loading="lazy" decoding="async" style="position:absolute;max-width:none;width:'+Math.round(4031*scale)+'px;height:'+Math.round(4079*scale)+'px;left:-'+(v.x*scale)+'px;top:-'+(v.y*scale)+'px"></span>';
 }
 window.AniimoIconAtlas={url,byId,byName,find,html};
})();