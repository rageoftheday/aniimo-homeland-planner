// Verified TH.GL atlas cells from the provided 3,581-item database export.
// These are local, validated Homeland outputs; unlisted items gracefully fall back.
(function(){
 'use strict';
 const url='https://cdn.th.gl/aniimo/icons/icons.f142638c8e3e64306636dfb0158d439e.webp';
 const data="4001000|Wheat|1058|1784\n4001001|Sugarcane|1124|1784\n4001002|Potato|1586|1784\n4001003|Rice|1652|1784\n4001004|Cotton|1190|1784\n4001005|Strawberry|1718|1784\n4001006|Lotus Root|1784|1784\n4001007|Lavender|1850|1784\n4001008|Sorghum|1916|1784\n4001009|Soybean|1982|1784\n4001010|Grapes|2048|1784\n4001011|Taro|2114|1784\n4001012|Cocoa|2180|1784\n4001013|Agave|2246|1784\n4001014|Rose|2312|1784\n4001015|Cranberry|2378|1784\n4001016|Ginseng|2444|1784\n4001017|Bamboo|2510|1784\n4001018|Willow Wood|2576|1784\n4001019|Rubber Tree Timber|2642|1784\n4001020|Maple Tree Timber|2708|1784\n4001021|Palm Tree Timber|2774|1784\n4001022|Pine Tree Timber|2840|1784\n4001023|Apple Tree Timber|2906|1784\n4001024|Cherry Tree Timber|2972|1784\n4001025|Bitter Orange Tree Timber|3038|1784\n4001026|Volcano Bean Tree Timber|3104|1784\n4001027|Aloeswood Timber|3170|1784\n4001028|Lemon Tree Timber|3236|1784\n4001029|Natural Rubber|3302|1784\n4001030|Maple Syrup|3368|1784\n4001031|Palm Bark|3434|1784\n4001032|Pine Tree Heartwood|3500|1784\n4001033|Apple|3566|1784\n4001034|Cherry Blossom|3632|1784\n4001035|Orange Flower|3698|1784\n4001036|Volcano Bean|3764|1784\n4001037|Aloeswood|3830|1784\n4001038|Lemon|3896|1784\n4001039|Coconut|3962|1784\n4001040|Walnut|2|1850\n4001041|Chestnut|68|1850\n4001042|Scales|134|1850\n4001043|Advanced Scales|200|1850\n4001044|Wool|266|1850\n4001045|Petals|332|1850\n4001046|Aromathyst|1256|1784\n4001047|Star|398|1850\n4001048|Fertilizer|464|1850\n4001049|Pearl|530|1850\n4001050|Love Bubble|596|1850\n4001051|Shell|662|1850\n4001052|Gem|728|1850\n4001053|Rock|794|1850\n4001054|Copper Ore|860|1850\n4001055|Iron Ore|926|1850\n4001056|Quartz Ore|992|1850\n4001057|Clay|1058|1850\n4001058|Bamboo Shoots|1124|1850\n4001059|Coconut Tree Timber|1190|1850\n4001060|Walnut Tree Timber|1256|1850\n4001061|Chestnut Tree Timber|1322|1850\n4001062|Pumpkin|1388|1850\n4001063|Milled Rice|1454|1850\n4001064|Wood Block|1520|1850\n4001065|Mineral Sand|1586|1850\n4001066|Moondew Radish|1652|1850\n4001067|Waxing Moon Pepper|1718|1850\n4001068|Captain Spud|1784|1850\n4001069|Sea Salt|1850|1850\n4001070|Well Water|1916|1850\n4001071|Plain Fresh Water|1982|1850\n4001072|Deep Rock Spring Water|2048|1850\n4001073|Natural Mineral Spring|2114|1850";
 // Exact 64×64 recipe crops from the saved TH.GL recipe exports.\n const recipeData="110001|Aniipod|3368|464\n110002|Aniipod Pro|3434|464\n110007|Aniipod Mega|3764|464\n150001|Growth Bud|3434|530\n150002|Growth Flower|3500|530\n150003|Growth Fruit|3566|530\n4001000|Wheat|1058|1784\n4001001|Sugarcane|1124|1784\n4001002|Potato|1586|1784\n4001003|Rice|1652|1784\n4001004|Cotton|1190|1784\n4001005|Strawberry|1718|1784\n4001007|Lavender|1850|1784\n4001009|Soybean|1982|1784\n4001010|Grapes|2048|1784\n4001012|Cocoa|2180|1784\n4001013|Agave|2246|1784\n4001014|Rose|2312|1784\n4001015|Cranberry|2378|1784\n4001016|Ginseng|2444|1784\n4001017|Bamboo|2510|1784\n4001018|Willow Wood|2576|1784\n4001029|Natural Rubber|3302|1784\n4001030|Maple Syrup|3368|1784\n4001031|Palm Bark|3434|1784\n4001033|Apple|3566|1784\n4001034|Cherry Blossom|3632|1784\n4001035|Orange Flower|3698|1784\n4001038|Lemon|3896|1784\n4001039|Coconut|3962|1784\n4001040|Walnut|2|1850\n4001041|Chestnut|68|1850\n4001063|Milled Rice|1454|1850\n4001066|Moondew Radish|1652|1850\n4001067|Waxing Moon Pepper|1718|1850\n4001068|Captain Spud|1784|1850\n4010000|Wheat Tea|2180|1850\n4010001|Toasted Rice Green Tea|2246|1850\n4010002|Sweet Rice Drink|2312|1850\n4010003|Grape Juice|2378|1850\n4010006|Potato Kvass|2576|1850\n4010008|Ginseng Water|2708|1850\n4010009|Cider Vinegar|2774|1850\n4010011|Rice Vinegar|2906|1850\n4010012|Soy Sauce|2972|1850\n4010015|Agave Drink|3170|1850\n4010017|Lavender Incense|3302|1850\n4010018|Rose Incense|3368|1850\n4010019|Orange Flower Incense|3434|1850\n4010020|Cherry Incense|3500|1850\n4010022|Lemon Incense|3632|1850\n4010023|Mixed Perfume|3698|1850\n4010024|Coconut Oil|3764|1850\n4010025|Soap|3830|1850\n4010027|Bamboo Joss Stick|3962|1850\n4010028|Rose Freshener|2|1916\n4010030|Lotion|134|1916\n4010032|Wheatmeal|266|1916\n4010035|Tofu|464|1916\n4010036|Cocoa Powder|530|1916\n4010039|Cotton Thread|728|1916\n4010040|Woolen Yarn|794|1916\n4010041|Palm Rope|860|1916\n4010042|Cotton Fabric|926|1916\n4010043|Wool Fabric|992|1916\n4010045|Malt Sugar|1124|1916\n4010046|Rock Candy|1190|1916\n4010047|Maple Sugar Chunk|1256|1916\n4010049|Tanghulu|1388|1916\n4010051|Maple Candy Star|1520|1916\n4010053|Bread|1652|1916\n4010054|Strawberry Cream Puff|1718|1916\n4010055|Steamed Vermicelli Roll|1784|1916\n4010056|Coconut Cookie|1850|1916\n4010058|Hot Cocoa|1982|1916\n4010060|Jello|2114|1916\n4010061|Soy Sauce Tofu|2180|1916\n4010062|Soy Sauce Fried Rice|2246|1916\n4010064|Creamy Potato Soup|2378|1916\n4010066|Nuts|2510|1916\n4010068|Dried Strawberries|2642|1916\n4010069|Dried Grapes|2708|1916\n4010070|Dried Cranberries|2774|1916\n4010071|Dried Apple Slices|2840|1916\n4010072|Dried Lemon Slices|2906|1916\n4010073|Potato Chips|2972|1916\n4010074|Dried Bean Curd|3038|1916\n4010075|Dried Flowers|3104|1916\n4010076|Shredded Coconut|3170|1916\n4010077|Caramel Nut Chips|3236|1916\n4010078|Pottery|3302|1916\n4010079|Porcelain|3368|1916\n4010080|Bamboo Ware|3434|1916\n4010081|Wood Sculpture|3500|1916\n4010082|Pearl Necklace|3566|1916\n4010083|Gemstone Dust|3632|1916\n4010084|Shell Ornament|3698|1916\n4010085|Wind Chime|3764|1916\n4010087|Dye|3896|1916\n4010088|Doll|3962|1916\n4010089|Woven Toy|2|1982\n4010090|Star Wish Lantern|68|1982\n4010091|Dream Catcher|134|1982\n4010092|Bouquet|200|1982\n4010093|Flowers in a Bottle|266|1982\n4010094|Strawberry Juice|332|1982\n4010095|Cranberry Juice|398|1982\n4010096|Apple Juice|464|1982\n4010097|Grape Jam|530|1982\n4010098|Strawberry Jam|596|1982\n4010099|Cranberry Jam|662|1982\n4010100|Maple Candy Apple Jam|728|1982\n4010101|Grape Candy|794|1982\n4010102|Strawberry Candy|860|1982\n4010104|Apple Candy|992|1982\n4010112|Sugar-Roasted Chestnuts|1058|1982\n4010113|Flower Bread|1124|1982\n4010133|Dried Cherry Blossom|2114|1982\n4010134|Cherry Blossom Rice Ball|2180|1982\n4010135|Salted Cherry Blossom|2246|1982\n4010136|Lavender Sachet|68|1916\n4010137|Ginseng Powder|2312|1982\n4010138|Dried Ginseng|2576|1916\n4010139|Herbal Ginseng Aroma|2378|1982\n4010140|Ginseng Porridge|2444|1982\n4010141|Ginseng Chestnut Cake|2510|1982\n4010142|Cocoa Spread|2576|1982\n4010143|Cranberry Chocolate|2642|1982\n4010144|Berry Chocolate Coconut Pudding|2708|1982\n4010145|Lavender Powder|2774|1982\n4010146|Umbral Pickle|2840|1982\n4010147|Umbral Hot Pot|2906|1982\n4010148|Harvest Platter|2972|1982\n4010149|Roasted Waxing Moon Pepper|3038|1982\n4010150|Moondew Radish Slices|3104|1982\n4010151|Umbral Sweet Spicy Sauce|3170|1982\n4010152|Rice Drink|3236|1982\n4010154|Maple Candy Roasted Potatoes|3368|1982\n4010155|Plain Rice Porridge|3434|1982\n4010156|Agave Syrup|2642|1850\n4010157|Chestnut Purée|3500|1982\n4010158|Rich Grape Compote|2444|1916\n4010159|Grape Lemon Drink|3566|1982\n4010160|Lavender Cookies|3632|1982\n4010161|Sugarcane Juice|3698|1982\n4010162|Apple Tart|3764|1982\n4010163|Refined Flour|3830|1982\n4010164|Coconut Milk|3896|1982\n4010165|Rose Concentrate|3962|1982\n4010166|Rose Shortbread|2|2048\n4010168|River-Washed Stones|68|2048\n4010169|Rough Lumber|134|2048\n4010170|Standard Planks|200|2048\n4010171|Laminated Beams|266|2048\n4010172|Densified Timber Component|332|2048\n4010174|Coarse-Sifted Ore|464|2048\n4010175|Sintered Ore Brick|530|2048\n4010176|Refined Ore|596|2048\n4010177|Microcrystalline Ore Plate|662|2048\n4010184|Walnut Cake|1124|2048\n4010185|Walnut Milk|1190|2048\n4010186|Coconut Cocoa|1256|2048\n4010187|Orange Flower Dew|1322|2048\n4010188|Candied Strawberries|1388|2048\n4010189|Candied Orange Flower|1454|2048\n4010190|Rubber Duck|1520|2048\n4010191|Roasted Soybeans|1586|2048\n4010192|Salted Lemon|1652|2048\n4010193|Dyed Cotton Fabric|1718|2048\n4010194|Coconut Cooler|1784|2048\n4020033|Quick Formula: Wheat|2642|2048\n4020035|Quick Formula: Bamboo|2708|2048\n4020043|Quick Formula: Lemon|2840|2048\n4020044|Quick Formula: Coconut|2906|2048\n4020052|Advanced Wind Chime|3434|2048\n4020054|Quick Recipe: Potato|3566|2048\n4020055|Quick Recipe: Rice|3632|2048\n4020056|Quick Recipe: Maple Syrup|3698|2048\n4020057|Quick Recipe: Strawberry|3764|2048\n4020067|Premium Bread|398|2114\n4020068|Premium Potato Soup|464|2114\n4020069|Premium Sweet Rice Wine|530|2114\n4020070|Premium Salted Lemon|596|2114\n4020071|Premium Jello|662|2114\n4020072|Premium Berry Chocolate Coconut Pudding|728|2114\n4020073|Premium River-Washed Stones|794|2114\n4020074|Premium Rose Freshener|860|2114\n4020075|Advanced Lemon Incense|926|2114\n4020076|Premium Soap|992|2114\n4020077|Advanced Gemstone Dust|1058|2114\n4020078|Premium Mixed Perfume|1124|2114\n4020079|Premium Wheat|1190|2114";
 const byId={},byName={};
 for(const line of (data+'\n'+recipeData).split('\n')){
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
   const ref=window.HOMELAND_REFERENCE_DATA?.items||{};
   let id=outputItem(value);
   let item=ref[id]||null;
   if(!item&&!/^\\d+$/.test(id)){
     const key=id.toLowerCase().replace(/\\s*\\(quick\\)$/,'').replace(/^quick\\s+/,'').trim();
     const matched=Object.entries(ref).find(([,x])=>String(x.name||'').toLowerCase()===key);
     if(matched){id=matched[0];item=matched[1];}
   }
   return {id,item};
 }
 function html(idOrName,size=24){
   const local=window.HomelandLocalIcons;
   const localImage=local?.picture('Items',idOrName,size)||local?.picture('Recipes',idOrName,size);
   if(localImage){
     const fallback=find(idOrName)||find(outputItem(idOrName))||find(catalogItem(idOrName).id);
     const underlay=fallback?sprite(fallback,size):'<span aria-hidden="true">◈</span>';
     return '<span class="homelandIconWithFallback" style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:100%;max-width:'+Math.max(12,Math.min(64,Number(size)||24))+'px;aspect-ratio:1;overflow:hidden">'+underlay+'<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">'+localImage+'</span></span>';
   }
   const direct=find(idOrName);if(direct)return sprite(direct,size);
   const resolved=outputItem(idOrName),v=find(resolved);if(v)return sprite(v,size);
   const known=catalogItem(idOrName),knownSprite=find(known.id);if(knownSprite)return sprite(knownSprite,size);
   // The captured catalog provides ui_item_<ID> assets for items without atlas cells.
   // Keep an ordinary icon fallback if this remote asset is not published.
   const {id,item}=catalogItem(idOrName);
   if(!item||!/^\\d+$/.test(id))return '';
   const n=Math.max(12,Math.min(64,Number(size)||24));
   const path='https://aniidex.com/images/items/'+encodeURIComponent(item.icon||'ui_item_'+id)+'.webp';
   return '<span class="aniimoAtlasIcon aniimoCatalogIcon" title="'+String(item.name||'').replace(/"/g,'&quot;')+'" style="position:relative;display:inline-flex;width:100%;max-width:'+n+'px;aspect-ratio:1;align-items:center;justify-content:center;overflow:hidden;vertical-align:middle"><span aria-hidden="true" style="font-size:55%;position:absolute">◈</span><img src="'+path+'" alt="" loading="lazy" decoding="async" onerror="this.remove()" style="position:relative;display:block;width:100%;height:100%;object-fit:contain"></span>';
 }
 const charRows="Celestis:3962,134 Stellarys:1322,200 Helmut:398,200 Pawney:992,200 Rookey:1124,200 Wisptis:1454,200 Ignitis:728,200 Inferlupa:926,200 Hexxin:596,200 Dreaple:68,200 Dewy:2,200 Fragrancier:134,200 Helmwhelp:2840,134 Helgon:2708,134 Jawling:2972,134 Chirpi:68,68 Tromber:3368,134 Cornet:266,68 Tubster:3566,134 Flutternym:2444,134 Gracewing:1454,134 Nimbi:3104,134 Turbo:3764,134 Eko:2378,134 Eklue:2312,134 Infergon:3896,266 Emberpup:2774,2 Flameruff:3236,2 Scorchhowl:3566,2 Lavazar:3434,2 Magmarex:3500,2 Sparki:3698,2 Flamerion:2972,2 Squarrel:3962,2 Squashel:2,68 Fulmintis:662,332 Besauce:1850,332 Bulbly:3698,68 Veilfloat:134,134 Luminelle:3896,68 Bolty:3566,68 Blazen:3500,68 Fentuft:3830,68 Fenmane:3764,68 Dazmand:3698,398 Skippy:1256,68 Pranky:926,68 Susuta:1454,68 Popota:794,68 Piopiota:662,68 Panpanta:596,68 Shelly:1190,68 Sheldon:1124,68 Sherro:2,134 Jabster:3170,398 Fahloo:530,68 Erlath:464,68 Glacy:530,134 Bonesky:200,134 Fenrier:332,134 Glynsera:200,200 Geoclaw:464,134 Leafy:2642,68 Budclaw:992,134 Shrubclaw:1916,134 Hummin:1718,68 Tuckin:3368,68 Iris:1850,68 Irisal:2246,68 Irisalis:794,398 Somniwing:1454,398 Budsquire:1586,68 Thornblade:3170,68 Melloblum:2708,68 Pomegg:2906,68 Pomawk:2774,68 Morphling:1520,398 Pebbling:1850,134 Geodeback:1388,134 Minespine:1784,134 Cozite:1256,134 Bailite:728,134 Baleetle:794,134 Waleetle:2180,134 Bouldus:926,134 Cubbo:1322,134 Grizbo:1718,134 Helion:2906,398 Soleon:2972,398 Lunara:3038,398 Fennelun:3104,398";
 const characters={};
 for(const piece of charRows.split(' ')){
  const [name,xy]=piece.split(':');if(!name||!xy)continue;
  const [x,y]=xy.split(',').map(Number);characters[name.toLowerCase()]={name,x,y,width:64,height:64};
 }
 function character(name,size=26){
  const local=window.HomelandLocalIcons?.picture('Aniimo',name,size);
  if(local){
    const fallback=characters[String(name||'').toLowerCase().trim()];
    const underlay=fallback?sprite(fallback,size,true):'';
    return '<span class="homelandIconWithFallback" style="position:relative;display:inline-flex;width:100%;max-width:'+Math.max(12,Math.min(64,Number(size)||26))+'px;aspect-ratio:1;overflow:hidden;border-radius:50%">'+underlay+'<span style="position:absolute;inset:0;display:flex">'+local+'</span></span>';
  }
  const v=characters[String(name||'').toLowerCase().trim()];
  return v?sprite(v,size,true):'';
 }
 window.AniimoIconAtlas={url,byId,byName,find,html,outputItem,catalogItem,characters,character};
})();