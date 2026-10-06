const EMBEDDED_STATE=null;

const NAME_ALIASES={
 'Egg Incubator':'Hatchinator',
 'Joywheel Loom':'Joy Wheel Loom',
 'Woodworking Workbench':'Woodworking Bench',
 'Tidewisper Sand Castle':'Tidewhisper Sandcastle',
 'Tidewisper SandCastle':'Tidewhisper Sandcastle'
};
function normalizeLegacyNames(){
 for(const o of objects){
   if(NAME_ALIASES[o.name])o.name=NAME_ALIASES[o.name];
   if(o.label && NAME_ALIASES[o.label])o.label=NAME_ALIASES[o.label];
 }
}

const U=18; let SNAP=.5; let boardScale=1;
const workspace=document.getElementById('workspace'), boardOuter=document.getElementById('boardOuter');
let mapViewport=null;

for(let i=1;i<=20;i++){let o=document.createElement('option');o.value=i;o.textContent='RV '+i;rvLevel.appendChild(o)}
rvLevel.value=1;

const plotDefs=[
 {n:13,x:0,y:0},{n:14,x:20,y:0},{n:15,x:40,y:0},{n:16,x:60,y:0},
 {n:12,x:0,y:15},{n:7,x:20,y:15},{n:8,x:40,y:15},{n:9,x:60,y:15},
 {n:11,x:0,y:30},{n:4,x:20,y:30},{n:3,x:40,y:30},{n:6,x:60,y:30},
 {n:10,x:0,y:45},{n:2,x:20,y:45},{n:1,x:40,y:45},{n:5,x:60,y:45}
];
let openPlots = new Set([1]);

function isPlotOpen(n){ return openPlots.has(n); }

function renderPlotAccess(){
 const root=document.getElementById('plotAccessGrid');
 if(!root)return;
 root.innerHTML='';
 for(let n=1;n<=16;n++){
   const lab=document.createElement('label');
   lab.className='plotToggle '+(isPlotOpen(n)?'open':'locked');
   const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=isPlotOpen(n);
   cb.onchange=()=>{
     if(cb.checked) openPlots.add(n); else openPlots.delete(n);
     // Objects are not deleted when a plot is closed; they simply become invalid/red.
     render();
   };
   const txt=document.createElement('span');txt.textContent='Plot '+n;
   lab.append(cb,txt);root.appendChild(lab);
 }
}


function applyBoardScale(scale){
 boardScale=Math.max(0.25,Math.min(1.5,scale||1));
 boardOuter.style.transform=`scale(${boardScale})`;
 if(window.zoomSlider){zoomSlider.value=String(Math.round(boardScale*100));}
 if(window.zoomLabel){zoomLabel.textContent=Math.round(boardScale*100)+'%';}
 // compensate layout footprint so scrollbars match scaled size
 boardOuter.style.marginBottom=`${Math.max(20,42*boardScale)}px`;
}
function fitBoard(){
 const wrap=mapViewport||workspaceWrap;
 if(!wrap)return;
 // approximate raw dimensions including boardOuter padding
 const rawW=1440+100;
 const rawH=1080+90;
 const availW=Math.max(300,wrap.clientWidth-24);
 const availH=Math.max(300,wrap.clientHeight-70);
 const scale=Math.min(1,availW/rawW,availH/rawH);
 applyBoardScale(scale);
 // center horizontally using the scaled footprint
 setTimeout(()=>{
   wrap.scrollLeft=Math.max(0,(wrap.scrollWidth-wrap.clientWidth)/2);
   wrap.scrollTop=0;
 },0);
}
function actualBoard(){autoFit.checked=false;applyBoardScale(1)}
function manualZoomPercent(p){
 autoFit.checked=false;
 applyBoardScale((Number(p)||100)/100);
}
function zoomStep(delta){
 manualZoomPercent(Math.max(25,Math.min(150,Math.round(boardScale*100)+delta)));
}
function boardBuild(){
 workspace.querySelectorAll('.plot,.lockedPlot,.localCoord').forEach(e=>e.remove());
 boardOuter.querySelectorAll('.axisLabel').forEach(e=>e.remove());

 for(const p of plotDefs){
   const open=isPlotOpen(p.n);
   const d=document.createElement('div');
   d.className=open?'plot':'lockedPlot';
   d.style.left=p.x*U+'px'; d.style.top=p.y*U+'px';
   d.dataset.name='Plot '+p.n;
   if(!open)d.textContent='Plot '+p.n+' — CLOSED';
   workspace.appendChild(d);

   // Every plot still shows its own 20 x 15 local coordinates when coordinate labels are enabled.
   if(open){
     for(let c=1;c<=20;c++){
       const t=document.createElement('div');t.className='localCoord coordEl';
       t.textContent='C'+c;t.style.left=(p.x+c-.5)*U+'px';t.style.top=p.y*U+2+'px';
       t.style.transform='translateX(-50%)';workspace.appendChild(t)
     }
     for(let r=1;r<=15;r++){
       const t=document.createElement('div');t.className='localCoord coordEl';
       t.textContent='R'+r;t.style.left=p.x*U+2+'px';t.style.top=(p.y+r-.5)*U+'px';
       t.style.transform='translateY(-50%)';workspace.appendChild(t)
     }
   }
 }
 // Global coordinate ruler around the complete 80 x 60 board.
 for(let x=1;x<=80;x++){
   const a=document.createElement('div');a.className='axisLabel axisTop coordEl';
   a.textContent=x;a.style.left=(58+(x-.5)*U)+'px';boardOuter.appendChild(a)
 }
 for(let y=1;y<=60;y++){
   const a=document.createElement('div');a.className='axisLabel axisLeft coordEl';
   a.textContent=y;a.style.top=(38+(y-.5)*U)+'px';boardOuter.appendChild(a)
 }
 renderPlotAccess();
 showCoords.onchange();
 showLocked.onchange();
}

const catalog=[
 {cat:'Growing',name:'Farmland',countByRV:{1:4,2:6,3:8,4:10,5:12,6:14,7:16,8:18,9:20,10:22,11:24,12:26,13:28,14:30,15:32,16:34,17:36,18:38,19:40,20:40},w:2,h:2,cls:'farm',rv:1},
 {cat:'Growing',name:'Woodland',countByRV:{2:3,3:4,4:5,5:6,6:7,7:8,8:9,9:10,10:11,11:12,12:13,13:14,14:15,15:16,16:17,17:18,18:19,19:20,20:20},w:4,h:4,cls:'wood',rv:2},

 {cat:'Environment',name:'Heat Furnace',countByRV:{7:1,12:2,17:3},w:1,h:1,cls:'heat',zone:'heat',rv:7},
 {cat:'Environment',name:'Cooling Unit',countByRV:{7:1,13:2,17:3},w:2,h:2,cls:'cool',zone:'cool',rv:7},
 {cat:'Environment',name:'Sunlamp',countByRV:{9:1,13:2,19:3},w:1,h:1,cls:'sun',zone:'sun',rv:9},

 {cat:'Raw / Gathering',name:'Mine',countByRV:{3:2,5:3,7:4,9:5,11:6,13:7,15:8,17:9,19:10},w:5,h:5,cls:'mine',rv:3},
 {cat:'Raw / Gathering',name:'Well',countByRV:{4:1,8:2,14:3,19:4},w:2,h:2,rv:4},

 {cat:'Processing',name:'Chimney Kiln',count:2,w:5.5,h:5.5,rv:6},
 {cat:'Processing',name:'Carousel Mill',count:2,w:5.5,h:5.5,rv:2},
 {cat:'Processing',name:'Pickling Jar',count:1,w:2.5,h:2.5,rv:8},
 {cat:'Processing',name:'Claw Game Cooker',count:2,w:3.5,h:3.5,rv:4},
 {cat:'Processing',name:'Jukebox Dryer',count:2,w:2.5,h:2.5,rv:4},
 {cat:'Processing',name:'Blazing Stove',count:1,w:2.5,h:2.5,rv:8},
 {cat:'Processing',name:'Crafting Table',count:2,w:4,h:4,rv:3},
 {cat:'Processing',name:'Simmering Pot',count:1,w:1.5,h:1.5,rv:5},
 {cat:'Processing',name:'Phonolfactory Table',count:1,w:2,h:2,rv:6},
 {cat:'Processing',name:'Bouncy Brew Keg',count:1,w:3,h:3,rv:6},
 {cat:'Processing',name:'Woodworking Bench',count:2,w:2,h:1.5,rv:6},
 {cat:'Processing',name:'Joy Wheel Loom',count:1,w:4,h:4,rv:7},
 {cat:'Processing',name:'Dance Pad Polisher',count:1,w:2.5,h:2.5,rv:2},
 {cat:'Processing',name:'Aniipod Maker',count:1,w:4.5,h:4.5,rv:3},

 {cat:'Aniimo / Utility',name:'Storage Unit',count:3,w:2,h:2,cls:'storage',rv:1},
 {cat:'Aniimo / Utility',name:'Hatchinator',count:10,w:2,h:2,rv:2},
 {cat:'Aniimo / Utility',name:'Tidewhisper Sandcastle',count:1,w:5,h:5,rv:5},
 {cat:'Aniimo / Utility',name:'Dewy House',count:1,w:2,h:2,rv:6},
 {cat:'Aniimo / Utility',name:'Nimbus Bed',count:1,w:5,h:5,rv:10},

 {cat:'Future Utility',name:'Crackle Generator',countByRV:{12:1,15:2,18:3},w:3,h:3,rv:1},
 {cat:'Future Utility',name:'Crackle Power Pole',count:1,w:null,h:null,rv:12},
 {cat:'Future Utility',name:'Starfall Hammock',count:1,w:null,h:null,rv:12},
 {cat:'Future Utility',name:'Floral Windmill',count:1,w:null,h:null,rv:18}
];
const homelandCatalogAudit=window.HomelandData?.applyCatalogFacts(catalog)||{matched:0,missing:catalog.map(x=>x.name)};

const crops=[
 // FARMLAND — choices are gated by the selected Farmland facility level.
 {name:'Wheat',display:'Wheat',facilityLevel:1,rv:1,req:'none',type:'Farmland',coinPH:75,output:'Wheat ×5',variant:'Standard'},
 {name:'Moondew Radish',display:'Moondew Radish',facilityLevel:1,rv:1,req:'none',type:'Farmland',coinPH:888,output:'Moondew Radish ×8',variant:'Season / Note'},
 {name:'Waxing Moon Pepper',display:'Waxing Moon Pepper',facilityLevel:1,rv:1,req:'none',type:'Farmland',coinPH:888,output:'Waxing Moon Pepper ×8',variant:'Season / Note'},
 {name:'Captain Spud',display:'Captain Spud',facilityLevel:1,rv:99,req:'none',type:'Farmland',coinPH:68,output:'Captain Spud ×5',variant:'Special / not in normal RV11 seed shop'},
 {name:'Potato',display:'Potato',facilityLevel:2,rv:2,req:'none',type:'Farmland',coinPH:90,output:'Potato ×2',variant:'Standard'},
 {name:'Wheat (Quick)',display:'Wheat — Quick',facilityLevel:2,rv:2,req:'none',type:'Farmland',coinPH:126,output:'Wheat ×42',variant:'Formula variant • Ecological Module Lv1'},
 {name:'Rice',display:'Rice',facilityLevel:3,rv:5,req:'none',type:'Farmland',coinPH:270,output:'Rice ×18',variant:'Standard'},
 {name:'Soybean',display:'Soybean',facilityLevel:3,rv:5,req:'none',type:'Farmland',coinPH:264,output:'Soybean ×16',variant:'Standard'},
 {name:'Rose',display:'Rose',facilityLevel:4,rv:7,req:'cool1',type:'Farmland',coinPH:468,output:'Rose ×8',variant:'Standard'},
 {name:'Cotton',display:'Cotton',facilityLevel:4,rv:7,req:'none',type:'Farmland',coinPH:462,output:'Cotton ×7',variant:'Standard'},
 {name:'Potato (Quick)',display:'Potato — Quick',facilityLevel:4,rv:7,req:'none',type:'Farmland',coinPH:552,output:'Potato ×46',variant:'Formula variant • Ecological Module Lv3'},
 {name:'Strawberry',display:'Strawberry',facilityLevel:5,rv:9,req:'cool1',type:'Farmland',coinPH:732,output:'Strawberry ×8',variant:'Standard'},
 {name:'Lavender',display:'Lavender',facilityLevel:5,rv:9,req:'sun',type:'Farmland',coinPH:725,output:'Lavender ×7',variant:'Standard'},
 {name:'Sugarcane',display:'Sugarcane',facilityLevel:5,rv:9,req:'heat2',type:'Farmland',coinPH:729,output:'Sugarcane ×6',variant:'Standard'},
 {name:'Ginseng',display:'Ginseng',facilityLevel:6,rv:12,req:'cool1',type:'Farmland',coinPH:1260,output:'Ginseng ×3',variant:'Standard'},
 {name:'Grape',display:'Grapes',facilityLevel:6,rv:12,req:'sun',type:'Farmland',coinPH:1256,output:'Grapes ×9',variant:'Standard'},
 {name:'Premium Wheat',display:'Premium Wheat',facilityLevel:6,rv:12,req:'none',type:'Farmland',coinPH:1170,output:'Premium Wheat ×15',variant:'Module recipe'},
 {name:'Rice (Quick)',display:'Rice — Quick',facilityLevel:6,rv:12,req:'none',type:'Farmland',coinPH:1185,output:'Rice ×79',variant:'Formula variant • Ecological Module Lv5'},
 {name:'Cranberry',display:'Cranberry',facilityLevel:7,rv:16,req:'freeze2',type:'Farmland',coinPH:2205,output:'Cranberry ×7',variant:'Standard'},
 {name:'Agave',display:'Agave',facilityLevel:7,rv:16,req:'heat2',type:'Farmland',coinPH:2160,output:'Agave ×6',variant:'Standard'},
 {name:'Strawberry (Quick)',display:'Strawberry — Quick',facilityLevel:7,rv:16,req:'cool1',type:'Farmland',coinPH:2379,output:'Strawberry ×26',variant:'Formula variant • Ecological Module Lv7'},

 // WOODLAND — plant/seed names shown, with the actual harvested product noted.
 {name:'Willow',display:'Willow',facilityLevel:1,rv:2,req:'none',type:'Woodland',coinPH:84,output:'Willow Wood ×5 + Wood Block ×1',variant:'Standard'},
 {name:'Emerald Bamboo',display:'Emerald Bamboo',facilityLevel:2,rv:4,req:'none',type:'Woodland',coinPH:195,output:'Bamboo ×10 + Wood Block ×8',variant:'Standard'},
 {name:'Lemon',display:'Lemon Tree',facilityLevel:2,rv:4,req:'none',type:'Woodland',coinPH:192,output:'Lemon ×8 + Wood Block ×8',variant:'Standard'},
 {name:'Apple',display:'Apple Tree',facilityLevel:3,rv:7,req:'cool1',type:'Woodland',coinPH:468,output:'Apple ×8 + Wood Block ×21',variant:'Standard'},
 {name:'Cherry',display:'Cherry Tree',facilityLevel:3,rv:7,req:'warm1',type:'Woodland',coinPH:462,output:'Cherry Blossom ×7 + Wood Block ×21',variant:'Standard'},
 {name:'Maple',display:'Maple Tree',facilityLevel:3,rv:7,req:'freeze2',type:'Woodland',coinPH:473,output:'Maple Syrup ×9 + Wood Block ×21',variant:'Standard'},
 {name:'Emerald Bamboo (Quick)',display:'Emerald Bamboo — Quick',facilityLevel:3,rv:7,req:'none',type:'Woodland',coinPH:449,output:'Bamboo ×23 + Wood Block ×21',variant:'Formula variant • Ecological Module Lv2'},
 {name:'Palm',display:'Palm Tree',facilityLevel:4,rv:11,req:'heat2',type:'Woodland',coinPH:1080,output:'Palm Bark ×6 + Wood Block ×47',variant:'Standard'},
 {name:'Chestnut',display:'Chestnut Tree',facilityLevel:4,rv:11,req:'warm1',type:'Woodland',coinPH:1050,output:'Chestnut ×7 + Wood Block ×47',variant:'Standard'},
 {name:'Walnut',display:'Walnut Tree',facilityLevel:4,rv:11,req:'sun',type:'Woodland',coinPH:1080,output:'Walnut ×6 + Wood Block ×47',variant:'Standard'},
 {name:'Lemon (Quick)',display:'Lemon Tree — Quick',facilityLevel:4,rv:11,req:'none',type:'Woodland',coinPH:1008,output:'Lemon ×42 + Wood Block ×47',variant:'Formula variant • Ecological Module Lv4'},
 {name:'Rubber Tree',display:'Rubber Tree',facilityLevel:5,rv:14,req:'heat2',type:'Woodland',coinPH:1665,output:'Natural Rubber ×3 + Wood Block ×75',variant:'Standard'},
 {name:'Coconut',display:'Coconut Tree',facilityLevel:5,rv:14,req:'heat2',type:'Woodland',coinPH:1650,output:'Coconut ×5 + Wood Block ×75',variant:'Standard'},
 {name:'Maple (Quick)',display:'Maple Tree — Quick',facilityLevel:5,rv:14,req:'freeze2',type:'Woodland',coinPH:1575,output:'Maple Syrup ×30 + Wood Block ×75',variant:'Formula variant • Ecological Module Lv6'},
 {name:'Cocoa',display:'Cocoa',facilityLevel:6,rv:18,req:'heat2',type:'Woodland',coinPH:2790,output:'Cocoa ×6 + Wood Block ×122',variant:'Standard'},
 {name:'Bitter Orange',display:'Bitter Orange Tree',facilityLevel:6,rv:18,req:'sun',type:'Woodland',coinPH:2760,output:'Orange Flower ×8 + Wood Block ×122',variant:'Standard'},
 {name:'Coconut (Quick)',display:'Coconut Tree — Quick',facilityLevel:6,rv:18,req:'heat2',type:'Woodland',coinPH:2640,output:'Coconut ×8 + Wood Block ×122',variant:'Formula variant • Ecological Module Lv8'}
];

const cropProductionMeta={
 'Wheat':{item:'Wheat',qty:5,minutes:4},
 'Moondew Radish':{item:'Moondew Radish',qty:8,minutes:40},
 'Waxing Moon Pepper':{item:'Waxing Moon Pepper',qty:8,minutes:40},
 'Captain Spud':{item:'Captain Spud',qty:5,minutes:13},
 'Potato':{item:'Potato',qty:2,minutes:11},
 'Wheat (Quick)':{item:'Wheat',qty:42,minutes:20},
 'Rice':{item:'Rice',qty:18,minutes:40},
 'Soybean':{item:'Soybean',qty:16,minutes:40},
 'Rose':{item:'Rose',qty:8,minutes:40},
 'Cotton':{item:'Cotton',qty:7,minutes:40},
 'Potato (Quick)':{item:'Potato',qty:46,minutes:40},
 'Strawberry':{item:'Strawberry',qty:8,minutes:40},
 'Lavender':{item:'Lavender',qty:7,minutes:40},
 'Sugarcane':{item:'Sugarcane',qty:6,minutes:40},
 'Ginseng':{item:'Ginseng',qty:3,minutes:40},
 'Grape':{item:'Grapes',qty:9,minutes:40},
 'Premium Wheat':{item:'Premium Wheat',qty:15,minutes:40},
 'Rice (Quick)':{item:'Rice',qty:79,minutes:40},
 'Cranberry':{item:'Cranberry',qty:7,minutes:40},
 'Agave':{item:'Agave',qty:6,minutes:40},
 'Strawberry (Quick)':{item:'Strawberry',qty:26,minutes:40},

 'Willow':{item:'Willow Wood',qty:5,minutes:11,secondary:{item:'Wood Block',qty:1}},
 'Emerald Bamboo':{item:'Bamboo',qty:10,minutes:40,secondary:{item:'Wood Block',qty:8}},
 'Lemon':{item:'Lemon',qty:8,minutes:40,secondary:{item:'Wood Block',qty:8}},
 'Apple':{item:'Apple',qty:8,minutes:40,secondary:{item:'Wood Block',qty:21}},
 'Cherry':{item:'Cherry Blossom',qty:7,minutes:40,secondary:{item:'Wood Block',qty:21}},
 'Maple':{item:'Maple Syrup',qty:9,minutes:40,secondary:{item:'Wood Block',qty:21}},
 'Emerald Bamboo (Quick)':{item:'Bamboo',qty:23,minutes:40,secondary:{item:'Wood Block',qty:21}},
 'Palm':{item:'Palm Bark',qty:6,minutes:40,secondary:{item:'Wood Block',qty:47}},
 'Chestnut':{item:'Chestnut',qty:7,minutes:40,secondary:{item:'Wood Block',qty:47}},
 'Walnut':{item:'Walnut',qty:6,minutes:40,secondary:{item:'Wood Block',qty:47}},
 'Lemon (Quick)':{item:'Lemon',qty:42,minutes:40,secondary:{item:'Wood Block',qty:47}},
 'Rubber Tree':{item:'Natural Rubber',qty:3,minutes:40,secondary:{item:'Wood Block',qty:75}},
 'Coconut':{item:'Coconut',qty:5,minutes:40,secondary:{item:'Wood Block',qty:75}},
 'Maple (Quick)':{item:'Maple Syrup',qty:30,minutes:40,secondary:{item:'Wood Block',qty:75}},
 'Cocoa':{item:'Cocoa',qty:6,minutes:40,secondary:{item:'Wood Block',qty:122}},
 'Bitter Orange':{item:'Orange Flower',qty:8,minutes:40,secondary:{item:'Wood Block',qty:122}},
 'Coconut (Quick)':{item:'Coconut',qty:8,minutes:40,secondary:{item:'Wood Block',qty:122}}
};

const sourceRecipeMeta={
 'Mine':{
   'Rock + Mineral Sand':[{item:'Rock',qty:6},{item:'Mineral Sand',qty:3}],
   'Clay + Mineral Sand':[{item:'Clay',qty:10},{item:'Mineral Sand',qty:16}],
   'Shell + Mineral Sand':[{item:'Shell',qty:6},{item:'Mineral Sand',qty:32}],
   'Copper Ore + Mineral Sand':[{item:'Copper Ore',qty:5},{item:'Mineral Sand',qty:56}],
   'Quartz Ore + Mineral Sand':[{item:'Quartz Ore',qty:4},{item:'Mineral Sand',qty:86}],
   'Gem + Mineral Sand':[{item:'Gem',qty:2},{item:'Mineral Sand',qty:122}]
 },
 'Well':{
   'Well Water ×10':[{item:'Well Water',qty:10}],
   'Well Water ×15':[{item:'Well Water',qty:15}],
   'Plain Fresh Water ×8':[{item:'Plain Fresh Water',qty:8}],
   'Plain Fresh Water ×17':[{item:'Plain Fresh Water',qty:17}],
   'Deep Rock Spring Water ×6':[{item:'Deep Rock Spring Water',qty:6}],
   'Deep Rock Spring Water ×9':[{item:'Deep Rock Spring Water',qty:9}],
   'Natural Mineral Spring ×6':[{item:'Natural Mineral Spring',qty:6}],
   'Natural Mineral Spring ×9':[{item:'Natural Mineral Spring',qty:9}]
 },
 'Tidewhisper Sandcastle':{
   'Sea Salt':[{item:'Sea Salt',qty:10}], 'Quick Sea Salt':[{item:'Sea Salt',qty:23}], 'Pearl':[{item:'Pearl',qty:2}]
 },
 'Dewy House':{
   'Aromathyst':[{item:'Aromathyst',qty:4}], 'Quick Aromathyst':[{item:'Aromathyst',qty:12}]
 },
 'Nimbus Bed':{
   'Wool':[{item:'Wool',qty:4}], 'Quick Wool':[{item:'Wool',qty:6}], 'Petals':[{item:'Petals',qty:6}]
 },
 'Starfall Hammock':{'Star':[{item:'Star',qty:2}]},
 'Floral Windmill':{'Scales':[{item:'Scales',qty:8}], 'Quick Scales':[{item:'Scales',qty:12}]}
};

const reqLabels={
 none:'Normal',heat2:'🔥 Scorching +2',warm1:'🌡 Warm +1',cool1:'❄ Cool −1',freeze2:'🧊 Freeze −2',sun:'☀ Sunlight',
 sun_heat2:'☀ + 🔥 Sun / +2',sun_warm1:'☀ + 🌡 Sun / +1',sun_cool1:'☀ + ❄ Sun / −1'
};


const rvModules={
 'Rest Module':[{lv:1,rv:1},{lv:2,rv:3},{lv:3,rv:5}],
 'Ecological Module':[{lv:1,rv:3},{lv:2,rv:7},{lv:3,rv:8},{lv:4,rv:11},{lv:5,rv:12},{lv:6,rv:14},{lv:7,rv:17},{lv:8,rv:18}],
 'Kitchen Module':[{lv:1,rv:2},{lv:2,rv:4},{lv:3,rv:8},{lv:4,rv:10},{lv:5,rv:13},{lv:6,rv:16},{lv:7,rv:19}],
 'Resource Detector':[{lv:1,rv:5},{lv:2,rv:8},{lv:3,rv:11},{lv:4,rv:12},{lv:5,rv:13},{lv:6,rv:15},{lv:7,rv:17},{lv:8,rv:19}],
 'Crafting Module':[{lv:1,rv:5},{lv:2,rv:7},{lv:3,rv:10},{lv:4,rv:12},{lv:5,rv:17},{lv:6,rv:18},{lv:7,rv:19}],
 'Power Module':[{lv:1,rv:12},{lv:2,rv:14},{lv:3,rv:16},{lv:4,rv:18},{lv:5,rv:20}],
 'Plant Research Module':[{lv:1,rv:6},{lv:2,rv:9},{lv:3,rv:12},{lv:4,rv:15}],
 'Incubation Reaction Module':[{lv:1,rv:9}],
 'Signal Transmitter':[{lv:1,rv:6},{lv:2,rv:11},{lv:3,rv:16}]
};
let moduleLevels={};

function moduleMaxForRV(name,rv){
 const a=rvModules[name]||[]; let m=0;
 for(const x of a) if(rv>=x.rv)m=x.lv;
 return m;
}
function initModuleLevelsToRvMax(){
 const rv=+rvLevel.value;
 for(const n of Object.keys(rvModules)) moduleLevels[n]=moduleMaxForRV(n,rv);
}
function moduleRequirementForCrop(c){
 const m={
  'Wheat (Quick)':1,'Emerald Bamboo (Quick)':2,'Potato (Quick)':3,'Lemon (Quick)':4,
  'Rice (Quick)':5,'Maple (Quick)':6,'Strawberry (Quick)':7,'Coconut (Quick)':8
 };
 return m[c.name]?{module:'Ecological Module',level:m[c.name]}:null;
}
function moduleRequirementForRecipe(stationName,r){
 const byName={
   'Premium Bread':{module:'Kitchen Module',level:2},
   'Advanced Lemon Incense':{module:'Crafting Module',level:3}
 };
 return byName[r.name]||null;
}
function moduleReqMet(req){return !req || Number(moduleLevels[req.module]||0)>=req.level}
function renderModules(){
 const root=el('moduleGrid'); if(!root)return;
 const rv=+rvLevel.value;
 root.innerHTML='';
 for(const [name,levels] of Object.entries(rvModules)){
   const max=moduleMaxForRV(name,rv);
   if(moduleLevels[name]==null) moduleLevels[name]=max;
   if(moduleLevels[name]>max) moduleLevels[name]=max;
   const lab=document.createElement('div');
   lab.textContent=name;
   if(max===0)lab.className='moduleLock';
   const s=document.createElement('select');
   s.disabled=max===0;
   let opts='<option value="0">Not installed</option>';
   for(const x of levels){
     opts+=`<option value="${x.lv}" ${x.lv>max?'disabled':''}>Lv ${x.lv}${x.lv>max?' 🔒 RV '+x.rv:''}</option>`;
   }
   s.innerHTML=opts;
   s.value=String(moduleLevels[name]||0);
   s.onchange=()=>{moduleLevels[name]=Number(s.value||0);render()};
   root.append(lab,s);
 }
}

const facilityLevels={
 'Farmland':[
  {lv:1,rv:1,cost:10},{lv:2,rv:2,cost:60},{lv:3,rv:5,cost:700},{lv:4,rv:7,cost:6200},{lv:5,rv:9,cost:23500},{lv:6,rv:12,cost:107000},{lv:7,rv:16,cost:480000}
 ],
 'Woodland':[
  {lv:1,rv:2,cost:90},{lv:2,rv:4,cost:400},{lv:3,rv:7,cost:8200},{lv:4,rv:11,cost:49000},{lv:5,rv:14,cost:199000},{lv:6,rv:18,cost:910000}
 ],
 'Mine':[
  {lv:1,rv:3,cost:320},{lv:2,rv:6,cost:4200},{lv:3,rv:9,cost:31000},{lv:4,rv:12,cost:143000},{lv:5,rv:15,cost:340000},{lv:6,rv:18,cost:910000}
 ],
 'Carousel Mill':[
  {lv:1,rv:2,cost:170},{lv:2,rv:5,cost:1800},{lv:3,rv:9,cost:16000},{lv:4,rv:13,cost:81000},{lv:5,rv:16,cost:320000},{lv:6,rv:18,cost:910000}
 ],
 'Dance Pad Polisher':[
  {lv:1,rv:2,cost:170},{lv:2,rv:5,cost:2900},{lv:3,rv:7,cost:12000}
 ],
 'Hatchinator':[
  {lv:1,rv:2,cost:320}
 ],
 'Aniipod Maker':[
  {lv:1,rv:3,cost:400},{lv:2,rv:6,cost:4200},{lv:3,rv:9,cost:24000}
 ],
 'Crafting Table':[
  {lv:1,rv:3,cost:320},{lv:2,rv:5,cost:1800},{lv:3,rv:7,cost:8200},{lv:4,rv:9,cost:31000},{lv:5,rv:12,cost:143000},{lv:6,rv:15,cost:340000},{lv:7,rv:18,cost:910000},{lv:8,rv:20,cost:1450000}
 ],
 'Claw Game Cooker':[
  {lv:1,rv:4,cost:540},{lv:2,rv:5,cost:1800},{lv:3,rv:7,cost:8200},{lv:4,rv:9,cost:31000},{lv:5,rv:12,cost:143000},{lv:6,rv:16,cost:480000},{lv:7,rv:19,cost:960000}
 ],
 'Jukebox Dryer':[
  {lv:1,rv:4,cost:540},{lv:2,rv:5,cost:1800},{lv:3,rv:7,cost:8200},{lv:4,rv:10,cost:36000},{lv:5,rv:12,cost:143000},{lv:6,rv:14,cost:300000},{lv:7,rv:18,cost:910000}
 ],
 'Well':[
  {lv:1,rv:4,cost:1100},{lv:2,rv:8,cost:20000},{lv:3,rv:11,cost:98000},{lv:4,rv:13,cost:240000},{lv:5,rv:17,cost:720000}
 ],
 'Tidewhisper Sandcastle':[
  {lv:1,rv:5,cost:1500},{lv:2,rv:8,cost:9800},{lv:3,rv:13,cost:81000}
 ],
 'Simmering Pot':[
  {lv:1,rv:5,cost:1200},{lv:2,rv:7,cost:12300},{lv:3,rv:9,cost:16000},{lv:4,rv:12,cost:72000},{lv:5,rv:15,cost:230000},{lv:6,rv:18,cost:910000}
 ],
 'Dewy House':[
  {lv:1,rv:6,cost:4200},{lv:2,rv:11,cost:269000}
 ],
 'Phonolfactory Table':[
  {lv:1,rv:6,cost:4200},{lv:2,rv:7,cost:12300},{lv:3,rv:10,cost:27000},{lv:4,rv:14,cost:149000},{lv:5,rv:17,cost:400000},{lv:6,rv:19,cost:720000}
 ],
 'Bouncy Brew Keg':[
  {lv:1,rv:6,cost:4200},{lv:2,rv:9,cost:14000},{lv:3,rv:13,cost:61000},{lv:4,rv:17,cost:270000},{lv:5,rv:19,cost:720000}
 ],
 'Woodworking Bench':[
  {lv:1,rv:6,cost:4200},{lv:2,rv:10,cost:16300},{lv:3,rv:14,cost:75000},{lv:4,rv:18,cost:340000}
 ],
 'Chimney Kiln':[
  {lv:1,rv:6,cost:4200},{lv:2,rv:10,cost:16300},{lv:3,rv:14,cost:75000},{lv:4,rv:18,cost:340000}
 ],
 'Heat Furnace':[
  {lv:1,rv:7,cost:8200}
 ],
 'Cooling Unit':[
  {lv:1,rv:7,cost:8200}
 ],
 'Joy Wheel Loom':[
  {lv:1,rv:7,cost:8200},{lv:2,rv:10,cost:16300},{lv:3,rv:15,cost:85000},{lv:4,rv:19,cost:360000}
 ],
 'Blazing Stove':[
  {lv:1,rv:8,cost:5900},{lv:2,rv:10,cost:16300},{lv:3,rv:13,cost:61000},{lv:4,rv:16,cost:240000},{lv:5,rv:18,cost:680000}
 ],
 'Pickling Jar':[
  {lv:1,rv:8,cost:5900},{lv:2,rv:10,cost:16300},{lv:3,rv:13,cost:61000},{lv:4,rv:16,cost:240000},{lv:5,rv:19,cost:720000}
 ],
 'Sunlamp':[
  {lv:1,rv:9,cost:15700}
 ],
 'Nimbus Bed':[
  {lv:1,rv:10,cost:18100},{lv:2,rv:13,cost:81000},{lv:3,rv:16,cost:320000}
 ],
 'Crackle Power Pole':[
  {lv:1,rv:12,cost:3600}
 ],
 'Starfall Hammock':[
  {lv:1,rv:12,cost:54000}
 ],
 'Floral Windmill':[
  {lv:1,rv:18,cost:453000}
 ],
 'Crackle Generator':[
  {lv:1,rv:1,cost:21000},{lv:2,rv:1,cost:45000},{lv:3,rv:1,cost:120000},{lv:4,rv:1,cost:340000},{lv:5,rv:1,cost:720000}
 ]
};
window.HomelandData?.applyFacilityLevels(facilityLevels);

function maxFacilityLevel(name,rv){
 const arr=facilityLevels[name]||[];
 let max=0;
 for(const d of arr) if(rv>=d.rv) max=Math.max(max,d.lv);
 return max;
}
function preferredPlaceLevel(name){
 const rv=+rvLevel.value,max=maxFacilityLevel(name,rv);
 if(!max)return 1;
 const pref=Number(placeLevelPrefs[name]||max);
 return Math.max(1,Math.min(max,pref));
}
function levelData(name,lv){
 return (facilityLevels[name]||[]).find(x=>x.lv===lv)||null;
}
function cumulativeUpgradeCost(name,fromLv,toLv){
 const arr=facilityLevels[name]||[];
 let total=0;
 for(const d of arr){
   if(d.lv>fromLv && d.lv<=toLv) total+=Number(d.cost)||0;
 }
 return total;
}
function directPlacementCost(name,lv){
 const d=levelData(name,lv);
 return d ? (Number(d.buyCost??d.cost)||0) : 0;
}
function historicalSpendFromPlacement(name,placedLv,currentLv){
 let total=directPlacementCost(name,placedLv);
 if(currentLv>placedLv) total+=cumulativeUpgradeCost(name,placedLv,currentLv);
 return total;
}

const recipeDB={
 'Carousel Mill':[
  {name:'Wheatmeal',ingredients:'Wheat ×50',work:54,rec:1,sell:70,rv:2,mode:'processing'}
 ],
 'Pickling Jar':[
  {name:'Salted Cherry Blossom',ingredients:'Cherry Blossom ×7 + Sea Salt ×13',work:135,rec:2,sell:780,rv:8,mode:'processing'},
  {name:'Soy Sauce',ingredients:'Soybean ×16 + Sea Salt ×13',work:135,rec:2,sell:650,rv:8,mode:'processing'}
 ],
 'Claw Game Cooker':[
  {name:'Bread',ingredients:'Wheatmeal ×2 + Well Water ×5',work:108,rec:1,sell:280,rv:4,mode:'processing'},
  {name:'Premium Bread',ingredients:'Wheatmeal ×2 + Well Water ×5',work:108,rec:1,sell:330,rv:4,mode:'processing'}
 ],
 'Jukebox Dryer':[
  {name:'Potato Chips',ingredients:'Potato ×8',work:54,rec:1,sell:110,rv:4,mode:'processing'}
 ],
 'Blazing Stove':[
  {name:'Cherry Blossom Rice Ball',ingredients:'Salted Cherry Blossom ×1 + Milled Rice ×1',work:203,rec:2,sell:1410,rv:8,mode:'processing'},
  {name:'Creamy Potato Soup',ingredients:'Potato ×15 + Plain Fresh Water ×8',work:135,rec:2,sell:750,rv:8,mode:'processing'},
  {name:'Soy Sauce Fried Rice',ingredients:'Milled Rice ×1 + Soy Sauce ×1',work:203,rec:2,sell:1280,rv:8,mode:'processing'}
 ],
 'Crafting Table':[
  {name:'Wood Sculpture',ingredients:'Willow Wood ×19',work:54,rec:1,sell:90,rv:3,mode:'processing'},
  {name:'Bamboo Ware',ingredients:'Bamboo ×10',work:54,rec:1,sell:190,rv:5,mode:'processing'},
  {name:'River-Washed Stones',ingredients:'Rock ×18 + Well Water ×5',work:108,rec:1,sell:300,rv:5,mode:'processing'},
  {name:'Rose Freshener',ingredients:'Rose Incense ×1 + Bamboo ×13',work:203,rec:2,sell:1270,rv:7,mode:'processing'},
  {name:'Pottery',ingredients:'Clay ×15 + Well Water ×8',work:135,rec:2,sell:630,rv:7,mode:'processing'}
 ],
 'Simmering Pot':[
  {name:'Plain Rice Porridge',ingredients:'Milled Rice ×2 + Well Water ×5',work:108,rec:1,sell:660,rv:5,mode:'processing'},
  {name:'Umbral Sweet Spicy Sauce',ingredients:'Moondew Radish ×8 + Waxing Moon Pepper ×8 + Sea Salt ×23',work:243,rec:3,sell:2390,rv:5,mode:'processing'},
  {name:'Rose Concentrate',ingredients:'Rose ×12 + Well Water ×8',work:135,rec:2,sell:770,rv:7,mode:'processing'}
 ],
 'Phonolfactory Table':[
  {name:'Advanced Lemon Incense',ingredients:'Lemon ×12 + Aromathyst ×2',work:135,rec:2,sell:900,rv:1,mode:'processing'}
 ],
 'Bouncy Brew Keg':[
  {name:'Toasted Rice Green Tea',ingredients:'Milled Rice ×2 + Well Water ×8',work:135,rec:2,sell:740,rv:6,mode:'processing'},
  {name:'Wheat Tea',ingredients:'Wheat ×50 + Well Water ×10',work:135,rec:2,sell:330,rv:6,mode:'processing'}
 ],
 'Chimney Kiln':[
  {name:'Coarse-Sifted Ore',ingredients:'Mineral Sand ×8',work:34,rec:2,sell:0,rv:6,mode:'processing'},
  {name:'Sintered Ore Brick',ingredients:'Coarse-Sifted Ore ×8',work:34,rec:2,sell:0,rv:10,mode:'processing'}
 ],
 'Mine':[
  {name:'Rock + Mineral Sand',ingredients:'—',work:900,rec:1,sell:42,rv:3,mode:'resource'},
  {name:'Clay + Mineral Sand',ingredients:'—',work:2250,rec:2,sell:220,rv:5,mode:'resource'},
  {name:'Shell + Mineral Sand',ingredients:'—',work:2250,rec:2,sell:456,rv:7,mode:'resource'},
  {name:'Copper Ore + Mineral Sand',ingredients:'—',work:2700,rec:3,sell:800,rv:9,mode:'resource'}
 ],
 'Well':[
  {name:'Well Water ×10',ingredients:'—',work:1800,rec:1,sell:120,rv:4,mode:'resource'}
 ],
 'Dance Pad Polisher':[
  {name:'Growth Bud ×3',ingredients:'Potato ×23',work:1200,rec:1,sell:0,rv:1,mode:'resource'},
  {name:'Growth Flower ×2',ingredients:'Soybean ×16',work:3000,rec:2,sell:0,rv:1,mode:'resource'},
  {name:'Growth Fruit ×1',ingredients:'Rose ×8',work:5400,rec:3,sell:0,rv:1,mode:'resource'}
 ],
 'Aniipod Maker':[
  {name:'Aniipod ×1',ingredients:'Rock ×12',work:1800,rec:1,sell:0,rv:1,mode:'resource'},
  {name:'Aniipod Pro ×1',ingredients:'Clay ×10',work:2250,rec:2,sell:0,rv:1,mode:'resource'},
  {name:'Aniipod Mega ×1',ingredients:'Shell ×6',work:2700,rec:3,sell:0,rv:1,mode:'resource'}
 ],
 'Tidewhisper Sandcastle':[
  {name:'Sea Salt',ingredients:'—',work:1800,rec:1,sell:160,rv:5,mode:'resource'},
  {name:'Quick Sea Salt',ingredients:'—',work:2250,rec:2,sell:368,rv:8,mode:'resource'},
  {name:'Pearl',ingredients:'—',work:2700,rec:3,sell:900,rv:13,mode:'resource'}
 ],
 'Dewy House':[
  {name:'Aromathyst',ingredients:'—',work:2250,rec:2,sell:224,rv:6,mode:'resource'},
  {name:'Quick Aromathyst',ingredients:'—',work:2700,rec:3,sell:672,rv:11,mode:'resource'}
 ],
 'Nimbus Bed':[
  {name:'Wool',ingredients:'—',work:2250,rec:2,sell:560,rv:10,mode:'resource'},
  {name:'Quick Wool',ingredients:'—',work:2700,rec:3,sell:840,rv:13,mode:'resource'},
  {name:'Petals',ingredients:'—',work:2700,rec:3,sell:1380,rv:16,mode:'resource'}
 ],
 'Starfall Hammock':[
  {name:'Star',ingredients:'—',work:2700,rec:3,sell:780,rv:12,mode:'resource'}
 ],
 'Floral Windmill':[
  {name:'Scales',ingredients:'—',work:2700,rec:3,sell:1680,rv:18,mode:'resource'},
  {name:'Quick Scales',ingredients:'—',work:2700,rec:3,sell:2520,rv:18,mode:'resource'}
 ]
};
const processingRates={1:{1:60,2:180,3:240,4:300},2:{1:45,2:60,3:180,4:240},3:{1:30,2:45,3:60,4:180}};
const resourceRates={1:{1:60,2:90,3:120,4:150},2:{1:45,2:75,3:105,4:135},3:{1:30,2:60,3:90,4:120}};

// v28: worker abilities, personality axes and station rules.
const HOME_ABILITIES=['Fire','Grass','Water','Earth','Lightning','Ice','Wind','Dark','Light','Leisure','Artisanship','Hauling','Perfumery'];
const PERSONALITY_NAMES={E:'Energetic',I:'Instinctive',S:'Practical',N:'Nimble',T:'Tenacious',F:'Faithful',J:'Judicious',P:'Playful'};
const PERSONALITY_CODES=[];
for(const a of ['E','I'])for(const b of ['S','N'])for(const c of ['T','F'])for(const d of ['J','P'])PERSONALITY_CODES.push(a+b+c+d);
const STATION_RULES={
 'Mine':{ability:'Earth',personality:'P'},
 'Nimbus Bed':{ability:'Leisure',personality:'J'},
 'Dewy House':{ability:'Leisure',personality:'I'},
 'Starfall Hammock':{ability:'Leisure',personality:'F'},
 'Tidewhisper Sandcastle':{ability:'Leisure',personality:'J'},
 'Floral Windmill':{ability:'Leisure',personality:'N'},
 'Well':{ability:'Water',personality:'F'},
 'Carousel Mill':{ability:'Wind',personality:'T'},
 'Crafting Table':{ability:'Artisanship',personality:'J'},
 'Jukebox Dryer':{ability:'Dark',personality:'N'},
 'Claw Game Cooker':{ability:'Fire',personality:'S'},
 'Joy Wheel Loom':{ability:'Wind',personality:'F'},
 'Phonolfactory Table':{ability:'Perfumery',personality:'I'},
 'Bouncy Brew Keg':{ability:'Water',personality:'E'},
 'Simmering Pot':{ability:'Fire',personality:'T'},
 'Blazing Stove':{ability:'Fire',personality:'N'},
 'Woodworking Bench':{ability:'Artisanship',personality:'E'},
 'Chimney Kiln':{ability:'Fire',personality:'S'},
 'Pickling Jar':{ability:'Dark',personality:'P'},
 'Aniipod Maker':{ability:'Lightning',personality:null},
 'Dance Pad Polisher':{ability:'Lightning',personality:null},
 'Crackle Generator':{ability:'Lightning',personality:null},
 'Heat Furnace':{ability:'Fire',personality:null},
 'Cooling Unit':{ability:'Ice',personality:null},
 'Sunlamp':{ability:'Light',personality:null}
};
const WORKER_FAMILIES={
 susuta:{label:'Susuta family',members:['Susuta','Popota','Panpanta','Piopiota']},
 shelly:{label:'Shelly family',members:['Shelly','Sheldon','Sherro']},
 nimbi:{label:'Nimbi family',members:['Nimbi','Dreaple','Turbo']},
 iris:{label:'Iris family',members:['Iris','Irisal','Irisalis']},
 dewy:{label:'Dewy family',members:['Dewy','Fragrancier']},
 celestis:{label:'Celestis family',members:['Celestis','Stellarys']},
 flutternym:{label:'Flutternym family',members:['Flutternym','Gracewing','Somniwing']}
};
const ANIIMO_FAMILIES={
 ...WORKER_FAMILIES,
 pranky:{label:'Pranky / Glacy family',members:['Pranky','Glacy']},
 wisptis:{label:'Wisptis / Ignitis / Fulmintis family',members:['Wisptis','Ignitis','Fulmintis']},
 helmut:{label:'Helmut / Pawney family',members:['Helmut','Pawney']},
 thornblade:{label:'Thornblade family',members:['Thornblade']},
 cornet:{label:'Cornet family',members:['Cornet']}
};
const FAMILY_RECIPE_RULES={
 'Tidewhisper Sandcastle|Sea Salt':{family:'susuta'},
 'Tidewhisper Sandcastle|Quick Sea Salt':{family:'susuta'},
 'Tidewhisper Sandcastle|Pearl':{family:'shelly'},
 'Nimbus Bed|Wool':{family:'nimbi'},
 'Nimbus Bed|Quick Wool':{family:'nimbi'},
 'Nimbus Bed|Petals':{family:'iris'},
 'Dewy House|Aromathyst':{family:'dewy'},
 'Dewy House|Quick Aromathyst':{family:'dewy'},
 'Starfall Hammock|Star':{family:'celestis'},
 'Floral Windmill|Scales':{family:'flutternym'},
 'Floral Windmill|Quick Scales':{family:'flutternym'}
};

// v29 starter Aniimo catalog. Verified entries are prefilled; name-only family entries remain editable.
// Appearance (Sparkling / Umbral) is kept separate from form because appearance does not automatically imply different Home abilities.
const ANIIMO_CATALOG=[
 {name:'Pranky',form:'Base',family:'pranky',abilities:[['Water',2],['Hauling',2]],source:'verified'},
 {name:'Pranky',form:'Snowfield Form',family:'pranky',abilities:[['Water',2],['Ice',1],['Hauling',2]],source:'verified'},
 {name:'Glacy',form:'Base',family:'pranky',abilities:[['Water',3],['Ice',2],['Hauling',3]],source:'verified'},
 {name:'Glacy',form:'Sea of Flowers Form',family:'pranky',abilities:[['Water',3],['Ice',2],['Hauling',3]],source:'verified'},
 {name:'Glacy',form:'Snowfield Form',family:'pranky',abilities:[['Water',3],['Ice',2],['Hauling',3]],source:'verified'},
 {name:'Glacy',form:'Prismana Form',family:'pranky',abilities:[['Water',4],['Light',3],['Hauling',4]],source:'official'},
 {name:'Ignitis',form:'Base',family:'wisptis',abilities:[['Dark',3],['Artisanship',3]],source:'official'},
 {name:'Ignitis',form:'Forest Form',family:'wisptis',abilities:[['Grass',2],['Dark',3],['Artisanship',3]],source:'official'},
 {name:'Ignitis',form:'Highland Form',family:'wisptis',abilities:[['Fire',2],['Dark',3],['Artisanship',3]],source:'official'},
 {name:'Ignitis',form:'Prismana Form',family:'wisptis',abilities:[['Fire',3],['Dark',4],['Artisanship',4]],source:'official'},
 {name:'Fulmintis',form:'Base',family:'wisptis',abilities:[['Lightning',3],['Artisanship',3]],source:'official'},
 {name:'Fulmintis',form:'Prismana Form',family:'wisptis',abilities:[['Lightning',4],['Light',3],['Artisanship',4]],source:'official'},
 {name:'Stellarys',form:'Base',family:'celestis',abilities:[['Dark',3],['Leisure',3]],source:'verified'},
 {name:'Stellarys',form:'Rainstorm Form',family:'celestis',abilities:[['Water',2],['Dark',3],['Leisure',3]],source:'verified'},
 {name:'Stellarys',form:'Prismana Form',family:'celestis',abilities:[['Ice',3],['Dark',4],['Leisure',4]],source:'verified'},
 {name:'Turbo',form:'Rainstorm Form',family:'nimbi',abilities:[['Lightning',2],['Wind',3],['Leisure',3]],source:'verified'},
 {name:'Turbo',form:'Plateau Form',family:'nimbi',abilities:[['Ice',2],['Wind',3],['Leisure',3]],source:'verified'},
 {name:'Turbo',form:'Prismana Form',family:'nimbi',abilities:[['Wind',4],['Dark',3],['Leisure',4]],source:'verified'},
 {name:'Thornblade',form:'Rainstorm Form',family:'thornblade',abilities:[['Grass',3],['Lightning',2],['Artisanship',3]],source:'verified'},
 {name:'Thornblade',form:'Prismana Form',family:'thornblade',abilities:[['Grass',4],['Water',3],['Artisanship',4]],source:'verified'},
 {name:'Cornet',form:'Base',family:'cornet',abilities:[['Wind',3]],source:'verified'},
 {name:'Cornet',form:'Beach Form',family:'cornet',abilities:[['Water',2],['Wind',3]],source:'verified'},
 {name:'Cornet',form:'Highland Form',family:'cornet',abilities:[['Grass',2],['Wind',3]],source:'verified'},
 {name:'Cornet',form:'Prismana Form',family:'cornet',abilities:[['Lightning',3],['Wind',4]],source:'verified'},
 {name:'Pawney',form:'Base',family:'helmut',abilities:[['Dark',3],['Hauling',3]],source:'verified'},
 {name:'Pawney',form:'Snowfield Form',family:'helmut',abilities:[['Ice',2],['Dark',3],['Hauling',3]],source:'verified'},
 {name:'Pawney',form:'Prismana Form',family:'helmut',abilities:[['Dark',4],['Hauling',4]],source:'verified'},
 // Full species roster stays browsable even when Homeland/Home Ability data is not loaded yet.
 ...(window.ANIIMO_SPECIES_DATA?.species||[]).map(s=>({name:s.name,form:'',family:'',abilities:[],source:'name-only'})),
 // Family-lock names available even when Home ability data is not yet verified in this offline catalog.
 ...Object.entries(WORKER_FAMILIES).flatMap(([family,f])=>f.members.map(name=>({name,form:'',family,abilities:[],source:'name-only'})))
];
const ANIIMO_ALIASES={'fulmantis':'Fulmintis','fulminitis':'Fulmintis','glacey':'Glacy','glacie':'Glacy','ignitus':'Ignitis','panpanta':'Panpanta','piopota':'Piopiota'};
let catalogMode='all';
function normalizeSearch(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function levenshtein(a,b){a=normalizeSearch(a);b=normalizeSearch(b);const m=a.length,n=b.length,d=Array.from({length:m+1},()=>Array(n+1).fill(0));for(let i=0;i<=m;i++)d[i][0]=i;for(let j=0;j<=n;j++)d[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n]}
function catalogKey(c){return c.name+'|'+(c.form||'')}
function wikiCatalogEntries(){
 const rows=[];
 const species=window.WikiHomeland?.speciesList?.()||[];
 const releasedByDex=new Map((window.ANIIMO_SPECIES_DATA?.species||[]).map(x=>[String(x.dex),x.name]));
 for(const sp of species){
   const name=releasedByDex.get(String(sp.dex))||sp.name;
   const family=familyIdForCatalog({name});
   for(const form of (sp.forms||[])){
     rows.push({
       name,
       form:/^(basic|base) form$/i.test(form.label||'')?'Base':(form.label||''),
       family,
       abilities:(form.homelandAbilities||[]).map(a=>[a.type,Number(a.level)||1]),
       source:'official-wiki',
       dex:sp.dex,
       wikiUrl:form.url||sp.indexUrl||''
     });
   }
 }
 return rows;
}
function catalogEntries(){
 const seen=new Set(),out=[];
 for(const c of wikiCatalogEntries()){
   const k=catalogKey(c);if(seen.has(k))continue;seen.add(k);out.push(c);
 }
 for(const c of ANIIMO_CATALOG){
   const k=catalogKey(c);if(seen.has(k))continue;seen.add(k);out.push(c);
 }
 return out;
}
function addCatalogWorker(c){const w=defaultWorker();w.name=c.name;w.form=c.form||'';w.family=c.family||'';w.catalogSource=c.source||'';w.appearance='Normal';w.abilities=(c.abilities||[]).map(a=>({type:a[0],level:a[1]}));while(w.abilities.length<3)w.abilities.push({type:'',level:1});const af=window.AniimoAssets?.form?.(w.name,w.form);if(af){w.formId=af.id;w.localPortrait='';}workers.push(w);render();}
function familyIdForCatalog(c){if(c.family)return c.family;const n=(c.name||'').toLowerCase();for(const [id,f] of Object.entries(WORKER_FAMILIES))if(f.members.some(m=>m.toLowerCase()===n))return id;return ''}
function catalogPortraitHTML(c){
 const a=window.AniimoAssets?.form?.(c.name,c.form||'');
 const candidates=window.AniimoAssets?.portraitCandidates?.(c.name,c.form||'','Normal','')||[];
 const src=candidates[0]||a?.head||'';
 if(!src)return esc(initialsFor(c.name));
 const fallback=a?.head&&a.head!==src?a.head:'';
 const onerr=fallback?`this.onerror=function(){this.style.display='none';this.nextElementSibling.style.display='block'};this.src='${esc(fallback)}'`:`this.style.display='none';this.nextElementSibling.style.display='block'`;
 return `<img src="${esc(src)}" alt="${esc(c.name||'Aniimo')}" loading="lazy" decoding="async" onerror="${onerr}"><span style="display:none">${esc(initialsFor(c.name))}</span>`;
}
function renderAniimoCatalog(){
 const result=el('catalogResults');if(!result)return;const q=normalizeSearch(el('aniimoSearch')?.value||''),ab=el('abilityFilter')?.value||'',min=Number(el('levelFilter')?.value||1),fam=el('familyFilter')?.value||'';
 let rows=catalogEntries();
 if(catalogMode==='ability'||ab)rows=rows.filter(c=>(c.abilities||[]).some(a=>a[0]===ab&&Number(a[1])>=min));
 if(catalogMode==='family'||fam)rows=rows.filter(c=>familyIdForCatalog(c)===fam);
 if(q){const alias=ANIIMO_ALIASES[q];rows=rows.map(c=>{const text=normalizeSearch(c.name+' '+(c.form||''));let score=text.includes(q)?0:Math.min(levenshtein(q,normalizeSearch(c.name)),levenshtein(q,text));if(alias&&normalizeSearch(c.name)===normalizeSearch(alias))score=-1;return {c,score}}).filter(x=>x.score<=Math.max(2,Math.floor(q.length*.45))||normalizeSearch(x.c.name+' '+(x.c.form||'')).includes(q)).sort((a,b)=>a.score-b.score||a.c.name.localeCompare(b.c.name)).map(x=>x.c);}
 else rows.sort((a,b)=>a.name.localeCompare(b.name)||(a.form||'').localeCompare(b.form||''));
 result.innerHTML='';
 if(!rows.length){result.innerHTML='<div class="small">No catalog match. Try a shorter spelling or use + Custom / Unknown.</div>';return}
 for(const c of rows){const d=document.createElement('div');d.className='catalogResult';const abs=(c.abilities||[]).length?(c.abilities||[]).map(a=>`${a[0]} Lv${a[1]}`).join(' • '):'Abilities not yet loaded — editable after adding';const f=familyIdForCatalog(c);const src=c.source==='official-wiki'?'Official Wiki':c.source==='official'?'Official preset':c.source==='verified'?'Cross-checked preset':'Name preset only';d.innerHTML=`<div class="catalogPortrait">${catalogPortraitHTML(c)}</div><div class="catalogName">${esc(c.name)}${c.form?' — '+esc(c.form):''}</div><div class="catalogAbilities">${esc(abs)}</div><div class="catalogHint">${f&&ANIIMO_FAMILIES[f]?esc(ANIIMO_FAMILIES[f].label):f?'Family: '+esc(f):''}${src?' • '+esc(src):''}</div>`;d.onclick=()=>addCatalogWorker(c);result.appendChild(d)}
}

let workers=[]; let workerIdCounter=1;
let aniidexImportMeta=null;
function familyForWorker(w){
 if(w&&w.family)return w.family;
 const n=(w.name||'').trim().toLowerCase();
 for(const [id,f] of Object.entries(WORKER_FAMILIES))if(f.members.some(m=>m.toLowerCase()===n))return id;
 return null;
}
function workerAbilityLevel(w,ability){
 let best=0;for(const a of (w.abilities||[]))if(a&&a.type===ability)best=Math.max(best,Number(a.level)||0);return best;
}
function personalityHas(w,letter){return !letter || String(w.personality||'').toUpperCase().includes(letter)}
function assignedObjectForWorker(id){return objects.find(o=>String(o.workerId||'')===String(id))||null}
function activeFamilyRequirements(){
 const out=[];
 for(const o of objects){
   if(!o.recipeName)continue;
   const key=o.name+'|'+o.recipeName,fr=FAMILY_RECIPE_RULES[key];
   if(fr)out.push({object:o,rule:fr,key});
 }
 return out;
}
function workerIsProtected(w){
 const fam=familyForWorker(w);if(!fam)return false;
 return activeFamilyRequirements().some(x=>x.rule.family===fam && workers.filter(q=>q.active!==false&&familyForWorker(q)===fam).length===1);
}
function defaultWorker(){return {id:workerIdCounter++,name:'',form:'',appearance:'Normal',sparklingHue:'',family:'',personality:'',portrait:'',active:true,abilities:[{type:'',level:1},{type:'',level:1},{type:'',level:1}]}}

function recipeRequiredLevel(stationName,recipe){
 const arr=facilityLevels[stationName]||[];
 if(!arr.length)return 1;
 let req=1;
 for(const d of arr){
   if((recipe.rv||1)>=d.rv) req=Math.max(req,d.lv);
 }
 return req;
}
function recipeRate(recipe,workerLevel,personality=1){const table=recipe.mode==='resource'?resourceRates:processingRates;const row=table[recipe.rec]||table[3];return (row[workerLevel]||row[4]||60)*personality}
function recipeCalc(recipe,workerLevel,personality=1){const rate=recipeRate(recipe,workerLevel,personality),mins=rate>0?recipe.work/rate:0,cycles=mins>0?60/mins:0;return{rate,mins,cycles,gross:(recipe.sell||0)*cycles}}


let objects=[],selected=null,idCounter=1; let maxOverrides={}; let dimensionOverrides={}; let placeLevelPrefs={};

function effectiveDims(item){
  if(Object.prototype.hasOwnProperty.call(dimensionOverrides,item.name)){
    const d=dimensionOverrides[item.name];
    return {w:Number(d.w)||0,h:Number(d.h)||0,overridden:true};
  }
  return {w:Number(item.w)||0,h:Number(item.h)||0,overridden:false};
}
function dimsKnown(item){
  const d=effectiveDims(item);
  return d.w>0 && d.h>0;
}
function setDimensionOverride(name,axis,val){
  const current=dimensionOverrides[name]||{w:0,h:0};
  current[axis]=Math.max(0,Math.round((Number(val)||0)*2)/2);
  dimensionOverrides[name]=current;
  render();
}
function clearDimensionOverride(name){
  delete dimensionOverrides[name];
  render();
}
function maxCount(item,rv){
 if(Object.prototype.hasOwnProperty.call(maxOverrides,item.name)) return Math.max(0,Number(maxOverrides[item.name])||0);
 if(item.countByRV){
   let n=0;Object.keys(item.countByRV).map(Number).sort((a,b)=>a-b).forEach(k=>{if(rv>=k)n=item.countByRV[k]});return n
 }
 return item.count||0
}
function isUnlocked(item){return +rvLevel.value >= (item.rv||1)}
function removeOneByName(name){
 const matches=objects.filter(o=>o.name===name);
 if(!matches.length)return;
 const victim=matches[matches.length-1];
 objects=objects.filter(o=>o.id!==victim.id);
 if(selected===victim.id)selected=null;
 render();
}
function setMaxOverride(name,val){
 const n=Math.max(0,Math.floor(Number(val)||0));
 maxOverrides[name]=n;
 const matches=objects.filter(o=>o.name===name);
 if(matches.length>n){
   const removeIds=new Set(matches.slice(n).map(o=>o.id));
   objects=objects.filter(o=>!removeIds.has(o.id));
   if(removeIds.has(selected))selected=null;
 }
 render();
}
function renderCatalog(){
 const root=document.getElementById('catalog');root.innerHTML='';
 const rv=+rvLevel.value, showFuture=futureToggle.checked;
 for(const cat of [...new Set(catalog.map(x=>x.cat))]){
   const items=catalog.filter(x=>x.cat===cat && (isUnlocked(x)||showFuture));
   if(!items.length)continue;
   const sec=document.createElement('div');sec.className='cat';sec.innerHTML='<h3>'+cat+'</h3>';
   for(const item of items){
     const unlocked=isUnlocked(item),limit=maxCount(item,rv),placed=objects.filter(o=>o.name===item.name).length;
     const overridden=Object.prototype.hasOwnProperty.call(maxOverrides,item.name);
     const dims=effectiveDims(item), known=dims.w>0&&dims.h>0;
     const row=document.createElement('div');row.className='itemrow'+(unlocked?'':' locked');

     const left=document.createElement('div');
     const dimText=known ? `${dims.w}×${dims.h}` : `<span class="dimUnknown">DIMENSIONS UNKNOWN</span>`;
     left.innerHTML=`<div class="name">${item.name}${unlocked?'':' <span class="lockTag">🔒 RV '+item.rv+'</span>'}</div>
       <div class="meta">${dimText}${item.zone?' • 9×9 effect':''} • <span class="maxTag">MAX ${unlocked?limit:'LOCKED'}</span>${unlocked&&!overridden?' • AUTO RV'+rv:''}${overridden?' • MANUAL':''}</div>`;

     // Show dimension editor only when base dimensions are unknown OR user has overridden dimensions.
     if(item.w==null || item.h==null || Object.prototype.hasOwnProperty.call(dimensionOverrides,item.name)){
       const dimLine=document.createElement('div');dimLine.className='dimEdit';
       dimLine.innerHTML='<span>Dimensions:</span>';
       const wi=document.createElement('input');wi.type='number';wi.min='0';wi.step='.5';wi.placeholder='W';wi.value=dims.w||'';
       const hi=document.createElement('input');hi.type='number';hi.min='0';hi.step='.5';hi.placeholder='H';hi.value=dims.h||'';
       wi.disabled=!unlocked; hi.disabled=!unlocked;
       wi.onchange=()=>setDimensionOverride(item.name,'w',wi.value);
       hi.onchange=()=>setDimensionOverride(item.name,'h',hi.value);
       dimLine.appendChild(wi);dimLine.appendChild(document.createTextNode('×'));dimLine.appendChild(hi);
       if(item.w!=null && item.h!=null){
         const reset=document.createElement('button');reset.textContent='Reset';reset.style.padding='3px 6px';reset.style.fontSize='10px';
         reset.onclick=()=>clearDimensionOverride(item.name);dimLine.appendChild(reset);
       }
       left.appendChild(dimLine);
     }

     if(facilityLevels[item.name] && facilityLevels[item.name].length){
       const pl=document.createElement('div');pl.className='placeLevel';
       pl.innerHTML='<span>Place at level:</span>';
       const s=document.createElement('select');
       const maxLv=maxFacilityLevel(item.name,rv);
       const arr=facilityLevels[item.name];
       s.innerHTML=arr.map(d=>`<option value="${d.lv}" ${d.lv>maxLv?'disabled':''}>Lv ${d.lv}${d.lv>maxLv?' 🔒':''}</option>`).join('');
       s.value=String(preferredPlaceLevel(item.name));
       s.disabled=!unlocked||maxLv<1;
       s.onchange=()=>{placeLevelPrefs[item.name]=Number(s.value||1);renderCatalog()};
       pl.appendChild(s);
       const cost=document.createElement('span');
       const chosen=Number(s.value||preferredPlaceLevel(item.name));
       cost.innerHTML=`• Place cost: <b>${directPlacementCost(item.name,chosen).toLocaleString()} HC</b>`;
       pl.appendChild(cost);
       left.appendChild(pl);
     }

     const maxLine=document.createElement('div');maxLine.className='maxEdit';
     maxLine.innerHTML=`<span>Max Placeable:</span>`;
     const maxInp=document.createElement('input');maxInp.type='number';maxInp.min='0';maxInp.step='1';maxInp.value=limit;
     maxInp.disabled=!unlocked;maxInp.title='Override the maximum number you can place for this item.';
     maxInp.onchange=()=>setMaxOverride(item.name,maxInp.value);
     maxLine.appendChild(maxInp);
     if(item.countByRV){
       const autoBtn=document.createElement('button');autoBtn.textContent='Auto';autoBtn.style.padding='3px 6px';autoBtn.style.fontSize='10px';
       autoBtn.title='Reset Max Placeable to the automatic RV cap';
       autoBtn.onclick=()=>{delete maxOverrides[item.name];render()};
       maxLine.appendChild(autoBtn);
     }
     left.appendChild(maxLine);

     const acts=document.createElement('div');acts.className='itemActions';
     const minus=document.createElement('button');minus.textContent='−';minus.title='Remove one '+item.name;
     minus.disabled=placed<=0;minus.onclick=()=>removeOneByName(item.name);
     const count=document.createElement('div');count.className='countBox';count.innerHTML=`<b>${placed}</b><br>/<br>${unlocked?limit:'—'}`;
     const plus=document.createElement('button');plus.textContent='+';
     plus.title=known ? 'Add one '+item.name : 'Enter Width and Height first';
     plus.disabled=!unlocked||placed>=limit||!known;
     plus.onclick=()=>addObject(item);

     acts.append(minus,count,plus);row.append(left,acts);sec.appendChild(row)
   } root.appendChild(sec)
 }
 rvNote.textContent=`RV ${rv}: unknown-size items require dimensions before + is enabled. Dimensions snap to 0.5 squares.${showFuture?' Future unlocks are shown grayed out.':''}`
}
function cropUnlockedForObject(c,o,rv){
 if(c.rv>rv)return false;
 if(!moduleReqMet(moduleRequirementForCrop(c)))return false;
 if(!o || (o.name!=='Farmland' && o.name!=='Woodland'))return true;
 const facLv=Number(o.facilityLevel||1);
 return Number(c.facilityLevel||1)<=facLv;
}
function rebuildCropPicker(){
 const rv=+rvLevel.value,hide=usableOnly.checked,current=objects.find(o=>o.id===selected);
 let arr=crops.filter(c=>{
   if(current&&(current.name==='Farmland'||current.name==='Woodland')&&c.type!==current.name)return false;
   return !hide || cropUnlockedForObject(c,current,rv);
 });
 cropSelect.innerHTML='<option value="">— choose —</option>'+arr
   .sort((a,b)=>b.coinPH-a.coinPH)
   .map(c=>{
      const unlocked=cropUnlockedForObject(c,current,rv);
      const need=`Lv ${c.facilityLevel}`; const mr=moduleRequirementForCrop(c);
      const lockWhy=mr&&!moduleReqMet(mr)?` 🔒 ${mr.module} Lv ${mr.level}`:` 🔒 ${need} / RV ${c.rv}`;
      return `<option value="${c.name}" ${unlocked?'':'disabled'}>${c.display||c.name} — ${c.coinPH.toLocaleString()} HC/h — ${reqLabels[c.req]}${unlocked?'':lockWhy}</option>`;
   }).join('');
 renderCropCards();
}function addObject(item,x=21,y=1){
 const rv=+rvLevel.value,limit=maxCount(item,rv),dims=effectiveDims(item);
 if(!isUnlocked(item)||objects.filter(o=>o.name===item.name).length>=limit||dims.w<=0||dims.h<=0)return;
 const obj={id:idCounter++,name:item.name,w:dims.w,h:dims.h,x,y,cls:item.cls||'',zone:item.zone||null,label:item.name,req:'none'};
 if(facilityLevels[item.name]&&facilityLevels[item.name].length){
   obj.facilityLevel=preferredPlaceLevel(item.name);
   obj.targetLevel=obj.facilityLevel;
   obj.placedLevel=obj.facilityLevel;
   obj.placementCost=directPlacementCost(item.name,obj.facilityLevel);
 }
 objects.push(obj);
 selected=objects.at(-1).id;render()
}
function zoneRect(o){return{x:o.x+o.w/2-4.5,y:o.y+o.h/2-4.5,w:9,h:9}}
function renderZones(){
 workspace.querySelectorAll('.zone').forEach(e=>e.remove());
 for(const o of objects.filter(x=>x.zone)){
   const z=zoneRect(o),d=document.createElement('div');d.className='zone '+o.zone;
   d.style.left=z.x*U+'px';d.style.top=z.y*U+'px';d.style.width=z.w*U+'px';d.style.height=z.h*U+'px';
   d.innerHTML='<span>'+(o.zone==='heat'?'🔥 HEAT +2':o.zone==='cool'?'❄ COOL -1':'☀ SUN')+'</span>';workspace.appendChild(d)
 }
}
function rectIntersect(a,b){return{x:Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)),y:Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y))}}
function overlapQuarter(a,b){const i=rectIntersect(a,b);return i.x>=.25&&i.y>=.25}
function zoneState(o){
 let heatCount=0,coolCount=0,sunCount=0;
 for(const e of objects.filter(x=>x.zone)){
   if(overlapQuarter(o,zoneRect(e))){
     if(e.zone==='heat')heatCount++;
     if(e.zone==='cool')coolCount++;
     if(e.zone==='sun')sunCount++;
   }
 }
 return{heatCount,coolCount,sunCount,heat:heatCount>0,cool:coolCount>0,sun:sunCount>0};
}
function reqSatisfied(o){
 if(o.req==='none')return true;
 const z=zoneState(o);
 // Heat Furnace services both Warmth +1 and Warmth +2 recipes.
 // Cooling Unit services both Cold -1 and Cold -2 recipes.
 if(o.req==='heat2'||o.req==='warm1')return z.heat;
 if(o.req==='cool1'||o.req==='freeze2')return z.cool;
 if(o.req==='sun')return z.sun;
 if(o.req==='sun_heat2'||o.req==='sun_warm1')return z.sun&&z.heat;
 if(o.req==='sun_cool1')return z.sun&&z.cool;
 return true;
}
function climateNowText(o){const z=zoneState(o),t=z.temp===0?'Normal':(z.temp>0?'+'+z.temp:String(z.temp));return`Temperature ${t}; Sun ${z.sun?'YES':'no'} (${z.heatCount} heat / ${z.coolCount} cool / ${z.sunCount} sun zones)`}
function inUnlockedPoint(x,y){
 return plotDefs.some(p=>isPlotOpen(p.n)&&x>=p.x&&x<=p.x+20&&y>=p.y&&y<=p.y+15)
}
function validArea(o){const p=[[o.x+.01,o.y+.01],[o.x+o.w-.01,o.y+.01],[o.x+.01,o.y+o.h-.01],[o.x+o.w-.01,o.y+o.h-.01],[o.x+o.w/2,o.y+o.h/2]];return p.every(v=>inUnlockedPoint(v[0],v[1]))}
function collide(o){return objects.some(q=>q.id!==o.id&&!(o.x+o.w<=q.x||q.x+q.w<=o.x||o.y+o.h<=q.y||q.y+q.h<=o.y))}
function makeObj(o){
 let e=document.getElementById('o'+o.id);if(!e){e=document.createElement('div');e.id='o'+o.id;workspace.appendChild(e)}
 e.className='obj '+o.cls+(selected===o.id?' selected':'');e.style.left=o.x*U+'px';e.style.top=o.y*U+'px';e.style.width=o.w*U+'px';e.style.height=o.h*U+'px';
 const crop=o.cropName?crops.find(c=>c.name===o.cropName):null;
 if(crop&&(o.name==='Farmland'||o.name==='Woodland')){
   const pct=climateSpeedPercent(o);
   const eff=Math.round(crop.coinPH*pct/100);
   const speedLine=o.req!=='none'?`\n${pct}% speed${pct<100?` • ~${eff.toLocaleString()} HC/h effective`:''}`:'';
   e.innerHTML=`<span class="objText">${crop.display||crop.name}\n${crop.coinPH.toLocaleString()} HC/h\n${reqLabels[crop.req]}${speedLine}</span>`;
 }
 else if(o.recipeName&&recipeDB[o.name]){
   const r=recipeDB[o.name].find(x=>x.name===o.recipeName);
   if(r){const c=recipeCalc(r,o.workerLevel||4,o.personalityMult||1);e.innerHTML=`<span class="objText">${r.name}\n${Math.round(c.gross).toLocaleString()} gross HC/h</span>`}
   else e.innerHTML=`<span class="objText">${o.label}</span>`;
 }else e.innerHTML=`<span class="objText">${o.label}</span>`;
 e.onpointerdown=ev=>dragStart(ev,o);return e
}

function getPlotInfo(o){
 const cx=o.x+o.w/2,cy=o.y+o.h/2;const p=plotDefs.find(p=>isPlotOpen(p.n)&&cx>=p.x&&cx<p.x+20&&cy>=p.y&&cy<p.y+15);
 if(!p)return{plot:'Cross-plot / none',local:'—'};return{plot:'Plot '+p.n,local:'C'+(o.x-p.x+1).toFixed(1)+' / R'+(o.y-p.y+1).toFixed(1)}
}

function esc(v){return String(v??'').replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]||ch))}
function abilityOptions(selected){return '<option value="">— none —</option>'+HOME_ABILITIES.map(a=>`<option value="${a}"${a===selected?' selected':''}>${a}</option>`).join('')}
function levelOptions(selected){return [1,2,3,4].map(n=>`<option value="${n}"${Number(selected)===n?' selected':''}>Lv ${n}</option>`).join('')}
function personalityOptions(selected){return '<option value=""'+(!selected?' selected':'')+'>Unknown</option>'+PERSONALITY_CODES.map(c=>`<option value="${c}"${c===selected?' selected':''}>${c}</option>`).join('')}
function setWorkerField(id,field,value){const w=workers.find(x=>x.id===id);if(!w)return;w[field]=value;renderRoster();renderAdvisor();refreshWorkerSelectors()}
function setWorkerAbility(id,idx,field,value){const w=workers.find(x=>x.id===id);if(!w)return;while(w.abilities.length<3)w.abilities.push({type:'',level:1});w.abilities[idx][field]=field==='level'?Number(value):value;renderRoster();renderAdvisor();refreshWorkerSelectors()}
function removeWorker(id){
 if(workerIsProtected(workers.find(x=>x.id===id)||{})){if(!confirm('This is your only active worker for a family-locked recipe. Remove it anyway?'))return}
 workers=workers.filter(x=>x.id!==id);for(const o of objects)if(o.workerId===id){delete o.workerId}render();
}

function initialsFor(name){const p=String(name||'?').trim().split(/\s+/).filter(Boolean);return (p.length>1?p[0][0]+p[p.length-1][0]:(p[0]||'?').slice(0,2)).toUpperCase()}
function catalogFormsForName(name){return catalogEntries().filter(c=>c.name===name).sort((a,b)=>(a.form||'').localeCompare(b.form||''))}
function catalogPresetForWorker(w){return catalogEntries().find(c=>c.name===w.name&&(c.form||'')===(w.form||''))||null}
function applyWorkerCatalogPreset(id,form){const w=workers.find(x=>x.id===id);if(!w)return;const c=catalogEntries().find(x=>x.name===w.name&&(x.form||'')===form);w.form=form;if(c){w.family=c.family||w.family;w.catalogSource=c.source||w.catalogSource;if((c.abilities||[]).length){const custom=confirm('Apply the known '+(c.form||'Base')+' Home Ability defaults?\n\nChoose Cancel to keep this individual copy\'s current ability values.');if(custom){w.abilities=(c.abilities||[]).map(a=>({type:a[0],level:a[1]}));while(w.abilities.length<3)w.abilities.push({type:'',level:1})}}}render()}
function appearanceOptions(selected){const vals=['Normal','Sparkling','Dazzling Sparkling','Shadow Sparkling','Umbral','Special / Other'];return vals.map(v=>`<option value="${v}"${v===selected?' selected':''}>${v}</option>`).join('')}
function appearancePreviewChoices(){
 const out=[{key:'normal',label:'Normal',appearance:'Normal',hue:''}];
 for(let i=1;i<=10;i++)out.push({key:'sparkling-'+i,label:'Type '+['I','II','III','IV','V','VI','VII','VIII','IX','X'][i-1],appearance:'Sparkling',hue:'Variant '+['I','II','III','IV','V','VI','VII','VIII','IX','X'][i-1]});
 out.push({key:'dazzling',label:'Dazzling',appearance:'Dazzling Sparkling',hue:''});
 out.push({key:'shadow',label:'Shadow',appearance:'Shadow Sparkling',hue:''});
 out.push({key:'umbral',label:'Umbral',appearance:'Umbral',hue:''});
 return out;
}
function currentAppearancePreviewKey(w){
 const a=String(w.appearance||'Normal').toLowerCase();
 if(a.includes('dazzling'))return'dazzling';
 if(a.includes('shadow'))return'shadow';
 if(a.includes('umbral'))return'umbral';
 if(a.includes('sparkling')){
   const label=window.AniimoAssets?.stageAppearanceLabel?.(w.appearance,w.sparklingHue)||'Sparkling-01';
   const m=label.match(/Sparkling-(\d+)/);if(m)return'sparkling-'+Number(m[1]);
   return'sparkling-1';
 }
 return'normal';
}
function appearancePreviewHTML(w){
 if(!w?.name)return'';
 const active=currentAppearancePreviewKey(w);
 return `<div class="appearancePreviewWrap"><div class="appearancePreviewTitle">Appearance preview</div><div class="appearancePreviewStrip">${appearancePreviewChoices().map(ch=>{
   const src=(window.AniimoAssets?.portraitCandidates?.(w.name,w.form,ch.appearance,ch.hue)||[])[0]||'';
   if(!src)return'';
   return `<button type="button" class="appearancePreview ${active===ch.key?'active':''}" data-appearance-choice="${esc(ch.key)}" data-appearance-value="${esc(ch.appearance)}" data-appearance-hue="${esc(ch.hue)}" title="${esc(ch.label)}"><img src="${esc(src)}" alt="${esc(ch.label)}" loading="lazy" decoding="async" onerror="this.closest('button').style.display='none'"><span>${esc(ch.label)}</span></button>`;
 }).join('')}</div></div>`;
}
function formOptionsForWorker(w){const forms=catalogFormsForName(w.name);const vals=[...new Set(forms.map(x=>x.form||'Base'))];if(w.form&&!vals.includes(w.form))vals.unshift(w.form);if(!vals.length)vals.push(w.form||'Base');return vals.map(v=>{const raw=v==='Base'?'':v;return `<option value="${esc(raw)}"${raw===(w.form||'')?' selected':''}>${esc(v)}</option>`}).join('')}
function workerAbilityPills(w){const arr=(w.abilities||[]).filter(a=>a.type);return arr.length?arr.map((a,i)=>`<span class="abilityPill${i===0?' primary':''}">${esc(a.type)} Lv${Number(a.level)||1}</span>`).join(''):'<span class="small">No Home abilities entered</span>'}
function workerPortraitHTML(w){const af=window.AniimoAssets?.form?.(w.name,w.form);const candidates=window.AniimoAssets?.portraitCandidates?.(w.name,w.form,w.appearance,w.sparklingHue)||[];const local=w.localPortrait||candidates[0]||af?.head||'';const remote=w.portrait||'';if(local||remote){const first=local||remote,backup=local&&remote&&remote!==local?remote:'';const fallback=backup?`this.onerror=function(){this.style.display='none';this.nextElementSibling.style.display='block'};this.src='${esc(backup)}'`:`this.style.display='none';this.nextElementSibling.style.display='block'`;return `<img src="${esc(first)}" alt="${esc(w.name||'Aniimo')}" onerror="${fallback}"><span class="initials" style="display:none">${esc(initialsFor(w.name))}</span><span class="portraitTag">${esc(w.appearance||'Normal')}</span>`}return `<span class="initials">${esc(initialsFor(w.name))}</span><span class="portraitTag">${esc(w.appearance||'Normal')}</span>`}

function openWorkerLargePreview(w,portrait){
 const image=portrait?.querySelector('img');
 const src=image?.currentSrc||image?.src||'';
 if(!src)return;
 document.querySelector('.workerLargePreview')?.remove();
 const modal=document.createElement('div');
 modal.className='workerLargePreview aniimoModal open';
 modal.dataset.fit='contain';
 modal.setAttribute('aria-hidden','false');
 modal.innerHTML=`<div class="aniimoModalBackdrop" data-worker-modal-close></div>
 <div class="aniimoModalPanel" role="dialog" aria-modal="true" aria-label="Aniimo portrait preview">
  <button type="button" class="aniimoModalClose" data-worker-modal-close aria-label="Close">×</button>
  <div class="aniimoModalImageWrap"><img alt=""></div>
  <div class="aniimoModalControls">
   <div class="aniimoModalTitle"></div>
   <div class="small workerLargePreviewMeta"></div>
   <div class="small workerLargePreviewAbilities"></div>
   <label class="aniimoSelectLabel">Large image fit<select data-worker-modal-fit><option value="contain">Fit whole image</option><option value="cover">Fill frame</option></select></label>
   <a class="aniimoOpenOriginal" target="_blank" rel="noopener">Open Original Image</a>
  </div>
 </div>`;
 const modalImg=modal.querySelector('.aniimoModalImageWrap img');
 modalImg.src=src;modalImg.alt=w.name||'Aniimo';
 modal.querySelector('.aniimoModalTitle').textContent=w.name||'Aniimo';
 modal.querySelector('.workerLargePreviewMeta').textContent=[w.form||'Base',w.appearance||'Normal',w.sparklingHue||''].filter(Boolean).join(' · ');
 modal.querySelector('.workerLargePreviewAbilities').textContent=(w.abilities||[]).filter(a=>a.type).map(a=>a.type+' Lv'+(Number(a.level)||1)).join(' · ')||'No Home abilities entered';
 modal.querySelector('.aniimoOpenOriginal').href=src;
 const close=()=>{modal.remove();document.body.classList.remove('aniimoModalOpen');document.removeEventListener('keydown',onKey);};
 const onKey=e=>{if(e.key==='Escape')close();};
 modal.querySelectorAll('[data-worker-modal-close]').forEach(el=>el.addEventListener('click',close));
 modal.querySelector('[data-worker-modal-fit]')?.addEventListener('change',e=>{modal.dataset.fit=e.target.value;});
 document.body.appendChild(modal);document.body.classList.add('aniimoModalOpen');document.addEventListener('keydown',onKey);
 modal.querySelector('.aniimoModalClose')?.focus();
}

function renderRoster(){
 const root=el('rosterList'),count=el('rosterCount');if(!root)return;
 const active=workers.filter(w=>w.active!==false).length;count.textContent=`${active} active / ${workers.length} entered`;
 if(!workers.length){root.innerHTML='<div class="small">No roster entered yet. Search the catalog, filter by Home Ability or family, or add a custom Aniimo. Each individual copy can override its catalog defaults.</div>';return}
 root.innerHTML='';
 for(const w of workers){
   const card=document.createElement('div');const prot=workerIsProtected(w);card.className='workerCard'+(prot?' lockedWorker':'');
   const fam=familyForWorker(w);const assigned=assignedObjectForWorker(w.id);const preset=catalogPresetForWorker(w);
   card.innerHTML=`<div class="workerVisualRow"><button type="button" class="workerPortrait aniimoPreviewOpen" data-worker-preview title="View ${esc(w.name||'Aniimo')} larger">${workerPortraitHTML(w)}<span class="aniimoPreviewBadge">↗</span></button><div class="workerIdentity">
      <input data-k="name" value="${esc(w.name||'')}" placeholder="Aniimo name">
      <div class="variantRow"><select data-form>${formOptionsForWorker(w)}</select><select data-k="appearance">${appearanceOptions(w.appearance||'Normal')}</select></div>
      <input data-k="sparklingHue" value="${esc(w.sparklingHue||'')}" placeholder="Sparkling hue/style (optional)" ${String(w.appearance||'').toLowerCase().includes('sparkling')?'':'style="display:none"'}>
      <select data-k="personality">${personalityOptions(w.personality||'')}</select>
      <div class="abilityPills">${workerAbilityPills(w)}</div>
      <div class="portraitHelp">Form changes can offer known defaults. Appearance is tracked separately; your in-game copy always wins.</div>
      ${appearancePreviewHTML(w)}
   </div></div>
   <div class="workerMeta">${fam?`<span class="badge lock">${esc((ANIIMO_FAMILIES[fam]||WORKER_FAMILIES[fam]||{}).label||fam)}</span>`:''}${prot?'<span class="badge lock">🔒 Locked-In</span>':''}${assigned?`<span class="badge ok">Assigned: ${esc(assigned.name)}${assigned.recipeName?' — '+esc(assigned.recipeName):''}</span>`:''}${w.catalogSource?`<span class="badge ${w.catalogSource==='official-wiki'||w.catalogSource==='official'||w.catalogSource==='verified'?'ok':'warn'}">${w.catalogSource==='official-wiki'?'Official Wiki':w.catalogSource==='official'?'Official preset':w.catalogSource==='verified'?'Verified preset':'Editable preset'}</span>`:''}<span class="personalityCode">${esc(w.personality||'')}</span></div>`;
   const ps=document.createElement('div');ps.className='personalityStrip';const code=String(w.personality||'');for(const letter of ['E','I','S','N','T','F','J','P']){const sp=document.createElement('span');sp.className='personalityLetter'+(code.includes(letter)?' on':'');sp.textContent=letter;sp.title=PERSONALITY_NAMES[letter];ps.appendChild(sp)}card.appendChild(ps);
   const rows=document.createElement('div');rows.className='abilityRows';
   for(let i=0;i<3;i++){const a=(w.abilities||[])[i]||{type:'',level:1};const r=document.createElement('div');r.className='abilityRow';r.innerHTML=`<select data-ai="${i}" data-af="type">${abilityOptions(a.type)}</select><select data-ai="${i}" data-af="level">${levelOptions(a.level)}</select>`;rows.appendChild(r)}
   card.appendChild(rows);
   const extra=document.createElement('div');extra.className='abilityRow';extra.innerHTML=`<input data-k="portrait" value="${esc(w.portrait||'')}" placeholder="Optional portrait image URL / data URI"><span class="small">optional</span>`;card.appendChild(extra);
   const flags=document.createElement('div');flags.className='workerFlags';flags.innerHTML=`<label><input type="checkbox" data-active ${w.active!==false?'checked':''}> Production Zone</label><button data-remove class="danger">Archive / Remove</button>`;card.appendChild(flags);
   card.querySelector('[data-worker-preview]')?.addEventListener('click',e=>openWorkerLargePreview(w,e.currentTarget));
   card.querySelectorAll('[data-k]').forEach(inp=>inp.addEventListener('change',()=>setWorkerField(w.id,inp.dataset.k,inp.value)));
   card.querySelector('[data-form]')?.addEventListener('change',e=>applyWorkerCatalogPreset(w.id,e.target.value));
   card.querySelectorAll('[data-appearance-choice]').forEach(btn=>btn.addEventListener('click',()=>{
     w.appearance=btn.dataset.appearanceValue||'Normal';
     w.sparklingHue=btn.dataset.appearanceHue||'';
     render();
   }));
   card.querySelectorAll('[data-ai]').forEach(inp=>inp.addEventListener('change',()=>setWorkerAbility(w.id,Number(inp.dataset.ai),inp.dataset.af,inp.value)));
   card.querySelector('[data-active]').addEventListener('change',e=>{w.active=e.target.checked;render()});
   card.querySelector('[data-remove]').addEventListener('click',()=>removeWorker(w.id));
   root.appendChild(card);
 }
}
function workerFitForJob(w,job){
 if(!w||w.active===false)return {eligible:false,score:-9999,reason:'Not in Production Zone'};
 const lvl=workerAbilityLevel(w,job.ability);
 if(lvl<=0)return {eligible:false,score:-9999,reason:`Missing ${job.ability}`};
 if(job.family && familyForWorker(w)!==job.family)return {eligible:false,score:-9999,reason:`Not ${WORKER_FAMILIES[job.family]?.label||job.family}`};
 let score=lvl*100;
 const trait=personalityHas(w,job.personality);if(trait)score+=24;
 const others=(w.abilities||[]).filter(a=>a.type&&a.type!==job.ability).map(a=>({type:a.type,level:Number(a.level)||0}));
 const demandTypes=new Set(activeJobs().map(j=>j.ability));
 if(others[0]&&demandTypes.has(others[0].type))score+=others[0].level*8;
 if(others[1]&&demandTypes.has(others[1].type))score+=others[1].level*3;
 const occupied=assignedObjectForWorker(w.id);if(occupied&&occupied.id!==job.object.id)score-=35;
 const req=job.rec||1;let fit=lvl>=req?'Perfect':'Works';if(lvl<req)score-=25*(req-lvl);
 return {eligible:true,score,lvl,trait,fit,occupied,others};
}
function activeJobs(){
 const jobs=[];
 for(const o of objects){
   const sr=STATION_RULES[o.name];if(!sr)continue;
   let recipe=null,rec=1,fam=null;
   if(o.recipeName&&recipeDB[o.name]){recipe=recipeDB[o.name].find(r=>r.name===o.recipeName)||null;if(recipe)rec=recipe.rec||1;const fr=FAMILY_RECIPE_RULES[o.name+'|'+o.recipeName];if(fr)fam=fr.family}
   // processors with recipe selectors only become a job when a recipe is chosen; environment devices are always jobs.
   if(recipeDB[o.name]&&!o.recipeName&&!['Heat Furnace','Cooling Unit','Sunlamp','Crackle Generator'].includes(o.name))continue;
   jobs.push({object:o,station:o.name,recipe:recipe?recipe.name:null,ability:sr.ability,personality:sr.personality,rec,family:fam});
 }
 return jobs;
}
function fitLabel(f){if(!f.eligible)return '<span class="fitPoor">Not eligible</span>';if(f.fit==='Perfect'&&f.trait)return '<span class="fitPerfect">Perfect</span>';if(f.fit==='Perfect')return '<span class="fitWorks">Works well</span>';return '<span class="fitWorks">Works</span>'}
function advisorReferenceForms(){
 const forms=EMBEDDED_ANIIDEX_CATALOG?.hub?.facts?.forms;
 return Array.isArray(forms)?forms:Object.values(forms||{});
}
function advisorRankNames(ability,level,prismanaOnly=false){
 const seen=new Set(),out=[];
 for(const f of advisorReferenceForms()){
   if(Number(f?.skills?.[ability]||0)!==Number(level))continue;
   if(prismanaOnly&&!f.prismana)continue;
   const name=String(f.name||'').trim();if(!name||seen.has(name))continue;
   seen.add(name);out.push({name,form:f.form||'',prismana:!!f.prismana});
 }
 return out.sort((a,b)=>a.name.localeCompare(b.name));
}
function advisorStationsForAbility(ability){
 return Object.entries(STATION_RULES).filter(([,r])=>r.ability===ability).map(([name])=>name);
}
function renderAdvisorRankMatrix(){
 const root=el('advisorRankMatrix');if(!root)return;
 root.innerHTML=HOME_ABILITIES.map(ability=>{
   const jobs=advisorStationsForAbility(ability);
   const tiers=[
     {label:'Rank 1',sub:'Lv1',rows:advisorRankNames(ability,1)},
     {label:'Rank 2',sub:'Lv2',rows:advisorRankNames(ability,2)},
     {label:'Rank 3',sub:'Lv3',rows:advisorRankNames(ability,3)},
     {label:'Rank 4',sub:'Lv4',rows:advisorRankNames(ability,4)},
     {label:'Rank 5',sub:'Prismana / BIS',rows:advisorRankNames(ability,4,true),best:true}
   ];
   return `<section class="advisorAbilityCard"><div class="advisorAbilityHead"><div><b>${esc(ability)}</b><div class="small">${jobs.length?'Jobs: '+jobs.map(esc).join(' • '):'No current station rule uses this ability directly.'}</div></div></div><div class="advisorRankGrid">${tiers.map(t=>`<div class="advisorRankTier${t.best?' bestTier':''}"><div class="advisorRankTierHead"><b>${t.label}</b><span>${t.sub}</span></div><div class="advisorRankNames">${t.rows.length?t.rows.map(x=>`<span class="advisorAniimoPill${x.prismana?' prismana':''}">${esc(x.name)}${t.best?' ✦':''}</span>`).join(''):'<span class="advisorEmpty">—</span>'}</div></div>`).join('')}</div></section>`;
 }).join('');
}
function renderAdvisor(){
 const root=el('advisorList'),head=el('advisorHeadline');if(!root||!head)return;const jobs=activeJobs();
 renderAdvisorRankMatrix();
 const active=workers.filter(w=>w.active!==false);head.textContent=`${jobs.length} active job${jobs.length===1?'':'s'} • ${active.length} active roster worker${active.length===1?'':'s'}`;
 if(!jobs.length){root.innerHTML='<div class="small">Assign production recipes or place Heat/Cooling/Sun devices to generate owned-worker recommendations. The full ability rank guide is still available below.</div>';return}
 root.innerHTML='';
 for(const job of jobs){
   const candidates=active.map(w=>({w,f:workerFitForJob(w,job)})).filter(x=>x.f.eligible).sort((a,b)=>b.f.score-a.f.score);
   const card=document.createElement('div');card.className='adviceCard'+(job.family?' locked':'');
   const title=`${job.station}${job.recipe?' — '+job.recipe:''}`;
   if(!candidates.length){
     card.classList.add('blocked');
     const famText=job.family?` Missing required <b>${WORKER_FAMILIES[job.family].label}</b>: ${WORKER_FAMILIES[job.family].members.join(' / ')}.`:'';
     card.innerHTML=`<div><b>🔒 ${esc(title)} Production Blocked</b></div><div class="jobReason">Need ${job.ability} Lv${job.rec}+.${famText}${job.personality?` Preferred trait: <b>${job.personality} — ${PERSONALITY_NAMES[job.personality]}</b> (+20% when matched).`:''}</div>`;
   }else{
     const best=candidates[0],alt=candidates.slice(1,4);
     const lock=job.family?'<span class="badge lock">🔒 Locked-In Choice</span>':'';
     const traitTxt=job.personality?`${job.personality} — ${PERSONALITY_NAMES[job.personality]}`:'No personality bonus';
     const current=job.object.workerId?workers.find(w=>w.id===job.object.workerId):null;
     const curFit=current?workerFitForJob(current,job):null;
     let curLine='';if(current){curLine=`<div class="jobReason">Currently assigned: <b>${esc(current.name||'Unnamed')}</b> — ${fitLabel(curFit)}${job.personality&&!curFit.trait?` • wants ${traitTxt}`:''}</div>`}
     card.innerHTML=`<div>${lock}<b>${esc(title)}</b></div><div class="jobReason">Main need: <b>${job.ability} Lv${job.rec}+</b>${job.personality?` • preferred <b>${traitTxt}</b>`:''}${job.family?` • ${WORKER_FAMILIES[job.family].label} required`:''}</div>${curLine}<div style="margin-top:6px"><span class="jobRank">Best:</span> <b>${esc(best.w.name||'Unnamed')}</b>${best.w.form?' — '+esc(best.w.form):''} • ${job.ability} Lv${best.f.lvl} • ${best.f.trait&&job.personality?job.personality+' ✓':job.personality?job.personality+' ✕':''} • ${fitLabel(best.f)}</div><div class="jobReason">${best.f.others.length?'Other abilities: '+best.f.others.map(a=>`${a.type} Lv${a.level}`).join(', '):'Specialist: no extra ability needed for this recommendation.'}${best.f.occupied&&best.f.occupied.id!==job.object.id?` • Currently used at ${esc(best.f.occupied.name)}; reassignment has an opportunity cost.`:''}</div>${alt.length?`<div class="jobReason">Alternatives: ${alt.map((x,i)=>`${i===0?'High':i===1?'Medium':'Low End'} — <b>${esc(x.w.name||'Unnamed')}</b> (${job.ability} Lv${x.f.lvl}${job.personality?', '+job.personality+(x.f.trait?' ✓':' ✕'):''})`).join(' • ')}</div>`:''}`;
   }
   root.appendChild(card);
 }
}
function refreshWorkerSelectors(){
 const sel=el('actualWorkerSelect');if(!sel)return;const o=objects.find(x=>x.id===selected);const old=o?.workerId||'';sel.innerHTML='<option value="">Manual / not in roster</option>';
 if(o&&STATION_RULES[o.name]){
   const rule=STATION_RULES[o.name];for(const w of workers.filter(x=>x.active!==false)){
     const lv=workerAbilityLevel(w,rule.ability);if(!lv)continue;const op=document.createElement('option');op.value=w.id;op.textContent=`${w.name||'Unnamed'}${w.form?' — '+w.form:''} | ${rule.ability} Lv${lv} | ${w.personality||'????'}`;sel.appendChild(op)
   }
 }
 sel.value=String(old||'');
}
function applyWorkerToObject(o,workerId){
 if(!o)return;if(!workerId){delete o.workerId;render();return}const w=workers.find(x=>String(x.id)===String(workerId)),rule=STATION_RULES[o.name];if(!w||!rule)return;o.workerId=w.id;o.workerLevel=workerAbilityLevel(w,rule.ability)||1;o.personalityMult=personalityHas(w,rule.personality)?1.2:1;render();
}

function render(){
 boardBuild();renderZones();
 const ids=new Set(objects.map(o=>'o'+o.id));workspace.querySelectorAll('.obj').forEach(e=>{if(!ids.has(e.id))e.remove()});
 for(const o of objects){
  const e=makeObj(o);
  e.classList.remove('invalid','reqok','reqpartial','reqoff','reqbad');
  if(!validArea(o)||collide(o)){
    e.classList.add('invalid');
  }else if(o.req!=='none'){
    const pct=climateSpeedPercent(o);
    if(pct>=100)e.classList.add('reqok');
    else if(pct>0)e.classList.add('reqpartial');
    else e.classList.add('reqoff');
  }
}
 renderModules();renderCatalog();updateClimateStarterState();renderAniimoCatalog();renderProfileBar();updateInspector();rebuildCropPicker();updateCropSummary();updateProductionSummary();updateBatchUpgradeSummary();updateSupplyAudit();updatePlacementAudit();renderRoster();renderAdvisor();refreshWorkerSelectors();renderV30Views();if(profileStore&&profileStore.current)scheduleProfileAutosave()
}
function dragStart(ev,o){
 selected=o.id;render();const r=workspace.getBoundingClientRect(),ox=ev.clientX-r.left-o.x*U,oy=ev.clientY-r.top-o.y*U;
 const move=e=>{o.x=Math.round(((e.clientX-r.left-ox)/U)/SNAP)*SNAP;o.y=Math.round(((e.clientY-r.top-oy)/U)/SNAP)*SNAP;render()};
 const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up)};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up)
}
function el(id){return document.getElementById(id)}
function assignCrop(o,c){
 if(!o||!c||o.name!==c.type)return;
 if(!cropUnlockedForObject(c,o,+rvLevel.value))return;
 o.cropName=c.name;o.label=c.display||c.name;o.req=c.req;o.coinPH=c.coinPH;render()
}
function clearCrop(o){if(!o)return;delete o.cropName;delete o.coinPH;o.label=o.name;o.req='none';render()}

function stationHasLevels(o){return !!(o&&facilityLevels[o.name]&&facilityLevels[o.name].length)}
function renderLevelPanel(){
 const o=objects.find(x=>x.id===selected),panel=el('levelPanel'),cur=el('currentLevelSelect'),tgt=el('targetLevelSelect'),info=el('levelInfo');
 if(!panel||!cur||!tgt||!info)return;
 if(!stationHasLevels(o)){panel.style.display='none';return}
 panel.style.display='block';

 const rv=+rvLevel.value,max=maxFacilityLevel(o.name,rv),arr=facilityLevels[o.name];
 if(!o.facilityLevel)o.facilityLevel=Math.max(1,Math.min(max||1,1));
 if(!o.placedLevel)o.placedLevel=o.facilityLevel;
 if(o.placementCost==null)o.placementCost=directPlacementCost(o.name,o.placedLevel);
 if(!o.targetLevel)o.targetLevel=o.facilityLevel;
 if(o.facilityLevel>max&&max>0)o.facilityLevel=max;
 if(o.targetLevel<o.facilityLevel)o.targetLevel=o.facilityLevel;
 if(o.targetLevel>max&&max>0)o.targetLevel=max;

 cur.innerHTML=arr.map(d=>`<option value="${d.lv}" ${d.lv>max?'disabled':''}>Lv ${d.lv}${d.lv>max?' 🔒 RV '+d.rv:''}</option>`).join('');
 tgt.innerHTML=arr.map(d=>`<option value="${d.lv}" ${d.lv>max||d.lv<o.facilityLevel?'disabled':''}>Lv ${d.lv}${d.lv>max?' 🔒 RV '+d.rv:''}</option>`).join('');
 cur.value=String(o.facilityLevel);tgt.value=String(o.targetLevel);

 const nextData=levelData(o.name,o.facilityLevel+1);
 const targetCost=cumulativeUpgradeCost(o.name,o.facilityLevel,o.targetLevel);
 const directNow=directPlacementCost(o.name,o.facilityLevel);
 const historical=historicalSpendFromPlacement(o.name,o.placedLevel,o.facilityLevel);

 let nextText='At maximum level for selected RV.';
 if(nextData){
   nextText=nextData.lv<=max
     ? `Next upgrade Lv ${o.facilityLevel} → Lv ${nextData.lv}: <span class="upgradeCost">${nextData.cost.toLocaleString()} HC</span>`
     : `Next level: Lv ${nextData.lv} unlocks at RV ${nextData.rv} — ${nextData.cost.toLocaleString()} HC`;
 }

 info.innerHTML=
   `<b>${o.name}</b><br>`+
   `Originally placed at: <b>Lv ${o.placedLevel}</b> for <b>${Number(o.placementCost||0).toLocaleString()} HC</b><br>`+
   `A fresh Lv ${o.facilityLevel} would cost: <b>${directNow.toLocaleString()} HC</b><br>`+
   `Selected RV allows up to <b>Lv ${max||'—'}</b><br>`+
   `${nextText}<br>`+
   `Planned upgrade Lv ${o.facilityLevel} → Lv ${o.targetLevel}: <b>${targetCost.toLocaleString()} HC</b><br>`+
   `Actual spend on this copy so far: <b>${historical.toLocaleString()} HC</b>`;
}
function updateBatchUpgradeSummary(){
 const totalEl=el('batchUpgradeTotal'),textEl=el('batchUpgradeText');if(!totalEl||!textEl)return;
 let total=0,count=0;
 for(const o of objects){
   if(!stationHasLevels(o))continue;
   const cur=Number(o.facilityLevel||1),tgt=Number(o.targetLevel||cur);
   if(tgt>cur){total+=cumulativeUpgradeCost(o.name,cur,tgt);count++}
 }
 totalEl.textContent=total.toLocaleString()+' Home Coin';
 textEl.textContent=count?`${count} placed facilit${count===1?'y':'ies'} have target upgrades planned.`:'No facility upgrades planned.';
}
function renderCropCards(){
 const o=objects.find(x=>x.id===selected),panel=el('cropPanel'),root=el('cropCards'),info=el('cropInfo');
 if(!panel||!root||!info)return;
 const ok=o&&(o.name==='Farmland'||o.name==='Woodland');
 panel.style.display=ok?'block':'none';
 if(!ok){root.innerHTML='';info.innerHTML='';return}

 const rv=+rvLevel.value,facLv=Number(o.facilityLevel||1);
 const arr=crops.filter(c=>c.type===o.name && (!usableOnly.checked || cropUnlockedForObject(c,o,rv)))
                .sort((a,b)=>b.coinPH-a.coinPH);
 root.innerHTML='';

 for(const c of arr){
   const unlocked=cropUnlockedForObject(c,o,rv);
   const b=document.createElement('button');b.type='button';
   b.className='cropCard'+(o.cropName===c.name?' active':'')+(unlocked?'':' locked');
   b.disabled=!unlocked;
   b.innerHTML=
     `<div class="cropName">${c.display||c.name}</div>`+
     `<div class="cropMeta"><span class="cropValue">${c.coinPH.toLocaleString()} HC/h</span><br>`+
     `${reqLabels[c.req]} • Facility Lv ${c.facilityLevel}`+
     `${moduleRequirementForCrop(c)?'<br>'+moduleRequirementForCrop(c).module+' Lv '+moduleRequirementForCrop(c).level:''}`+
     `${c.variant?'<br>'+c.variant:''}`+
     `${unlocked?'':`<br>🔒 needs Lv ${c.facilityLevel} / RV ${c.rv}`}</div>`;
   b.addEventListener('click',()=>assignCrop(o,c));
   root.appendChild(b);
 }

 const c=o.cropName?crops.find(x=>x.name===o.cropName):null;
 if(c){
   const met=reqSatisfied(o);
   info.innerHTML=
     `<b>${c.display||c.name}</b><br>`+
     `Produces: ${c.output}<br>`+
     `Raw value: <span class="cropValue">${c.coinPH.toLocaleString()} HC/h</span><br>`+
     `Needs facility: <b>Lv ${c.facilityLevel}</b> • Current: <b>Lv ${facLv}</b><br>`+
     `Climate: <b>${reqLabels[c.req]}</b><br>`+
     `${climateNowText(o)}<br>`+
     `Operating speed: <b style="color:${climateSpeedPercent(o)>=100?'#62df8c':climateSpeedPercent(o)>0?'#ffcb6b':'#ff6971'}">${climateSpeedLabel(o)}</b><br>`+
     `Effective raw value: <b>${Math.round((c.coinPH||0)*climateSpeedPercent(o)/100).toLocaleString()} HC/h</b>`;
 }else{
   info.innerHTML=`No crop/tree assigned. This ${o.name} is currently Facility Lv ${facLv}.`;
 }
}
function updateCropSummary(){
 const a=objects.filter(o=>o.cropName),total=a.reduce((s,o)=>s+(Number(o.coinPH)||0),0),met=a.filter(reqSatisfied).length;
 if(el('totalCropValue'))el('totalCropValue').textContent=total.toLocaleString()+' Home Coin/h';
 if(el('cropSummaryText'))el('cropSummaryText').textContent=a.length?`${a.length} assigned • ${met} climate-valid • ${a.length-met} climate-invalid`:'No crops assigned yet.';
}
function stationHasRecipes(o){return !!(o&&recipeDB[o.name]&&recipeDB[o.name].length)}
function renderRecipePanel(){
 const o=objects.find(x=>x.id===selected),panel=el('recipePanel'),sel=el('recipeSelect'),worker=el('workerLevelSelect'),pers=el('personalitySelect'),info=el('recipeInfo');
 if(!panel||!sel||!worker||!pers||!info)return;
 if(!stationHasRecipes(o)){panel.style.display='none';return}
 panel.style.display='block';const rv=+rvLevel.value,facLv=Number(o.facilityLevel||1);
 const list=recipeDB[o.name].filter(r=>!usableOnly.checked || (r.rv<=rv && recipeRequiredLevel(o.name,r)<=facLv && moduleReqMet(moduleRequirementForRecipe(o.name,r))));
 sel.innerHTML='<option value="">— choose recipe —</option>'+list.map(r=>{
   const needLv=recipeRequiredLevel(o.name,r);
   const mr=moduleRequirementForRecipe(o.name,r);
   const locked=r.rv>rv||needLv>facLv||!moduleReqMet(mr);
   const why=mr&&!moduleReqMet(mr)?`${mr.module} Lv ${mr.level}`:`Lv ${needLv} / RV ${r.rv}`;
   return `<option value="${r.name}" ${locked?'disabled':''}>${r.name}${r.sell?` — ${r.sell.toLocaleString()} HC`:''}${locked?` 🔒 ${why}`:''}</option>`;
 }).join('');
 sel.value=o.recipeName||'';worker.value=String(o.workerLevel||4);pers.value=String(o.personalityMult||1);refreshWorkerSelectors();const hasActual=!!o.workerId;worker.disabled=hasActual;pers.disabled=hasActual;updateRecipeInfo();
}
function updateRecipeInfo(){
 const o=objects.find(x=>x.id===selected),info=el('recipeInfo');if(!info)return;
 if(!stationHasRecipes(o)){info.innerHTML='';return}
 const r=recipeDB[o.name].find(x=>x.name===o.recipeName);if(!r){info.innerHTML='No recipe assigned.';return}
 const c=recipeCalc(r,o.workerLevel||4,o.personalityMult||1),cycle=c.mins<1?(c.mins*60).toFixed(0)+' sec':c.mins.toFixed(2)+' min';
 info.innerHTML=`<b>${r.name}</b><br>Ingredients: ${r.ingredients}<br>Work: ${r.work.toLocaleString()} • recommends Lv ${r.rec}<br>Cycle: <b>${cycle}</b> • ${c.cycles.toFixed(2)} cycles/h<br>Sell/output: ${r.sell?'<span class="money">'+r.sell.toLocaleString()+' HC</span>':'<span class="warn">No direct coin value</span>'}<br>Gross station value: <span class="money">${Math.round(c.gross).toLocaleString()} HC/h</span>`;
}
function assignRecipe(o,name){if(!o||!recipeDB[o.name])return;const r=recipeDB[o.name].find(x=>x.name===name);if(!r)return;o.recipeName=r.name;o.workerLevel=Number(el('workerLevelSelect')?.value||4);o.personalityMult=Number(el('personalitySelect')?.value||1);render()}
function clearRecipe(o){if(!o)return;delete o.recipeName;delete o.workerLevel;delete o.personalityMult;render()}
function climateSpeedPercent(o){
 return Math.round(environmentFactor(o)*100);
}
function climateSpeedLabel(o){
 const pct=climateSpeedPercent(o);
 if((o.req||'none')==='none')return '100%';
 if(pct>=100)return '100% — optimal';
 if(pct>=80)return '80% — missing preferred climate';
 if(pct>=50)return '50% — missing preferred climate';
 return '0% — stopped';
}
function environmentFactor(o){
 const z=zoneState(o),req=o.req||'none';
 if(req==='none')return 1;
 if(req==='sun')return z.sun?1:0;
 if(req==='heat2')return z.heat?1:.5;
 if(req==='warm1')return z.heat?1:.8;
 if(req==='cool1')return z.cool?1:.8;
 if(req==='freeze2')return z.cool?1:.5;
 if(req==='sun_heat2')return z.sun&&z.heat?1:0;
 if(req==='sun_warm1')return z.sun&&z.heat?1:0;
 if(req==='sun_cool1')return z.sun&&z.cool?1:0;
 return 1;
}
function addRate(map,item,qty){
 if(!item||!isFinite(qty))return;
 map[item]=(map[item]||0)+qty;
}
function parseIngredients(s){
 if(!s||s==='—')return [];
 return s.split('+').map(x=>x.trim()).map(part=>{
   const m=part.match(/^(.*?)\s*×\s*([\d.]+)\s*$/);
   return m?{item:m[1].trim(),qty:Number(m[2])}:null;
 }).filter(Boolean);
}
function sourceRatesForObject(o){
 const out={};
 if(o.cropName){
   const meta=cropProductionMeta[o.cropName];
   if(meta){
     const waterFactor=(window.wateredTwice&&wateredTwice.checked)?(4/3):1;
     const cycles=(60/meta.minutes)*waterFactor*environmentFactor(o);
     addRate(out,meta.item,meta.qty*cycles);
     if(meta.secondary)addRate(out,meta.secondary.item,meta.secondary.qty*cycles);
   }
 }
 if(o.recipeName && sourceRecipeMeta[o.name] && sourceRecipeMeta[o.name][o.recipeName]){
   const r=(recipeDB[o.name]||[]).find(x=>x.name===o.recipeName);
   if(r){
     const c=recipeCalc(r,o.workerLevel||4,o.personalityMult||1);
     for(const p of sourceRecipeMeta[o.name][o.recipeName]) addRate(out,p.item,p.qty*c.cycles);
   }
 }
 return out;
}
function calculateSupplyAudit(){
 const available={},produced={},consumed={},stationRows=[];
 for(const o of objects){
   const rates=sourceRatesForObject(o);
   for(const [k,v] of Object.entries(rates)){addRate(available,k,v);addRate(produced,k,v)}
 }

 const processors=objects.filter(o=>o.recipeName && recipeDB[o.name] && !(sourceRecipeMeta[o.name]&&sourceRecipeMeta[o.name][o.recipeName]));
 // Repeat passes so upstream processors can feed downstream processors.
 const pending=[...processors];
 for(let pass=0;pass<8 && pending.length;pass++){
   let progress=false;
   for(let i=pending.length-1;i>=0;i--){
     const o=pending[i],r=recipeDB[o.name].find(x=>x.name===o.recipeName);
     if(!r) {pending.splice(i,1);continue}
     const ing=parseIngredients(r.ingredients);
     const potential=recipeCalc(r,o.workerLevel||4,o.personalityMult||1).cycles;
     let sustainable=potential;
     for(const q of ing){
       sustainable=Math.min(sustainable,(available[q.item]||0)/q.qty);
     }
     if(ing.length===0)sustainable=potential;

     // If no ingredient is currently available, wait for an upstream pass where possible.
     if(ing.length && sustainable<=0){
       const couldBeMade=ing.some(q=>processors.some(p=>p.recipeName===q.item));
       if(couldBeMade && pass<7)continue;
     }

     sustainable=Math.max(0,sustainable);
     for(const q of ing){
       const use=q.qty*sustainable;
       available[q.item]=(available[q.item]||0)-use;
       addRate(consumed,q.item,use);
     }
     // Processing recipes in current DB produce one output per cycle.
     addRate(available,r.name,sustainable);
     addRate(produced,r.name,sustainable);
     const util=potential>0?Math.min(1,sustainable/potential):0;
     stationRows.push({name:o.name,recipe:r.name,potential,sustainable,util,gross:(r.sell||0)*sustainable});
     pending.splice(i,1);progress=true;
   }
   if(!progress)break;
 }
 return {available,produced,consumed,stationRows,pending};
}
function physicalOverlap(a,b){
 // Touching edges/corners is legal; only positive-area intersection is a collision.
 const ix=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x);
 const iy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
 return ix>0.0001 && iy>0.0001;
}
function isInsideOpenBoard(o){
 // Physical object must be entirely inside an open plot. For the current 1–9 setup,
 // plots form a contiguous 60×45 rectangle from global x 20..80, y 15..60.
 // Use validArea so manual plot selections are still respected.
 return validArea(o);
}
function updatePlacementAudit(){
 const box=el('placementAudit'); if(!box)return;
 const collisions=[];
 for(let i=0;i<objects.length;i++){
   for(let j=i+1;j<objects.length;j++){
     if(physicalOverlap(objects[i],objects[j])) collisions.push([objects[i],objects[j]]);
   }
 }
 const outside=objects.filter(o=>!isInsideOpenBoard(o));
 const climateOutside=objects.filter(o=>o.zone).filter(o=>{
   const z=zoneRect(o);
   // Informational: influence area outside the open 1–9 rectangle wastes coverage,
   // though it is not an illegal physical placement.
   return z.x<20 || z.y<15 || z.x+z.w>80 || z.y+z.h>60;
 });
 let msg='';
 msg+=collisions.length
   ? `<div class="supplyBad">❌ ${collisions.length} physical overlap${collisions.length===1?'':'s'} found.</div>`
   : `<div class="supplyGood">✓ No physical objects overlap. Edge/corner touching is allowed.</div>`;
 msg+=outside.length
   ? `<div class="supplyBad">❌ ${outside.length} physical object${outside.length===1?' is':'s are'} outside/inside a closed plot.</div>`
   : `<div class="supplyGood">✓ Every physical object is fully inside an open plot.</div>`;
 msg+=climateOutside.length
   ? `<div class="supplyWarn">⚠ ${climateOutside.length} climate influence area${climateOutside.length===1?'':'s'} extend outside the 1–9 board (legal, but wastes coverage).</div>`
   : `<div class="supplyGood">✓ Heat/Cool/Sun 9×9 influence areas stay inside Plots 1–9.</div>`;
 if(collisions.length){
   msg+=`<div style="margin-top:5px">${collisions.slice(0,8).map(p=>`${p[0].label} ↔ ${p[1].label}`).join('<br>')}</div>`;
 }
 box.innerHTML=msg;
}
function updateSupplyAudit(){
 const grid=el('supplyGrid'),head=el('supplyHeadline'),stations=el('stationAudit');
 if(!grid||!head||!stations)return;
 const a=calculateSupplyAudit();
 const keys=[...new Set([...Object.keys(a.produced),...Object.keys(a.consumed)])]
   .filter(k=>(a.produced[k]||0)>0 || (a.consumed[k]||0)>0)
   .sort((x,y)=>(a.consumed[y]||0)-(a.consumed[x]||0));

 let rows='<div class="hdr">Material</div><div class="hdr">Made/h</div><div class="hdr">Used/h</div><div class="hdr">Left/h</div>';
 for(const k of keys){
   const p=a.produced[k]||0,c=a.consumed[k]||0,left=a.available[k]||0;
   const cls=left<-0.001?'supplyBad':(c>0?'supplyGood':'');
   rows+=`<div>${k}</div><div>${p.toFixed(1)}</div><div>${c.toFixed(1)}</div><div class="${cls}">${left.toFixed(1)}</div>`;
 }
 grid.innerHTML=rows;

 const sustainableGross=a.stationRows.reduce((s,r)=>s+r.gross,0);
 const starved=a.stationRows.filter(r=>r.util<.999);
 const planks=a.available['Standard Planks']||0;
 const bricks=a.available['Sintered Ore Brick']||0;
 head.innerHTML=`Sustainable assigned processing: <b class="money">${Math.round(sustainableGross).toLocaleString()} HC/h</b> • ${starved.length} supply-limited station${starved.length===1?'':'s'}.<br>`+
   `Upgrade materials: <b>${planks.toFixed(1)} Standard Planks/h</b> • <b>${bricks.toFixed(1)} Sintered Ore Brick/h</b>`;

 stations.innerHTML=a.stationRows.map(r=>{
   const pct=Math.round(r.util*100),cls=pct>=100?'supplyGood':(pct>=50?'supplyWarn':'supplyBad');
   return `<div style="margin:6px 0"><b>${r.name}</b> — ${r.recipe}: <span class="${cls}">${pct}% supplied</span> (${r.sustainable.toFixed(2)}/${r.potential.toFixed(2)} batches/h)<div class="utilBar ${cls}"><div class="utilFill" style="width:${Math.min(100,pct)}%"></div></div></div>`;
 }).join('') + (a.pending.length?`<div class="supplyWarn">Could not resolve ${a.pending.length} assigned recipe(s) because an upstream product is missing from the current planner recipe database.</div>`:'');
}
function updateProductionSummary(){
 const te=el('totalRecipeValue'),se=el('recipeSummaryText'),ge=el('grandTotalValue');if(!te||!se||!ge)return;
 let total=0,count=0;for(const o of objects){if(!o.recipeName||!recipeDB[o.name])continue;const r=recipeDB[o.name].find(x=>x.name===o.recipeName);if(!r)continue;total+=recipeCalc(r,o.workerLevel||4,o.personalityMult||1).gross;count++}
 te.textContent=Math.round(total).toLocaleString()+' Home Coin/h';se.textContent=count?`${count} station${count===1?'':'s'} assigned • gross output before ingredient costs`:'No production recipes assigned yet.';
 const cropTotal=objects.filter(o=>o.cropName).reduce((s,o)=>s+(Number(o.coinPH)||0)*environmentFactor(o),0);ge.textContent=Math.round(total+cropTotal).toLocaleString()+' HC/h';
}
function updateInspector(){
 const o=objects.find(x=>x.id===selected);noneSelected.style.display=o?'none':'block';editor.style.display=o?'block':'none';
 if(!o){if(el('levelPanel'))el('levelPanel').style.display='none';if(el('cropPanel'))el('cropPanel').style.display='none';if(el('recipePanel'))el('recipePanel').style.display='none';return}
 selTitle.textContent=o.name;selSize.textContent=o.w+'×'+o.h;selPos.textContent=o.x+', '+o.y;const p=getPlotInfo(o);selPlot.textContent=p.plot;selLocal.textContent=p.local;labelInput.value=o.label;reqSelect.value=o.req;
 const place=validArea(o)&&!collide(o),rs=reqSatisfied(o);reqStatus.innerHTML=`Placement: <b style="color:${place?'#62df8c':'#ff6971'}">${place?'VALID':'INVALID / COLLISION'}</b><br>Requirement: <b style="color:${rs?'#62df8c':'#ff6971'}">${o.req==='none'?'Neutral':(rs?'MET':'NOT MET')}</b><br>${climateNowText(o)}`;
 renderLevelPanel();renderCropCards();renderRecipePanel();
}

labelInput.oninput=()=>{const o=objects.find(x=>x.id===selected);if(o){o.label=labelInput.value;render()}};
reqSelect.onchange=()=>{const o=objects.find(x=>x.id===selected);if(o){o.req=reqSelect.value;render()}};
el('currentLevelSelect').addEventListener('change',()=>{
 const o=objects.find(x=>x.id===selected);if(!o)return;
 o.facilityLevel=Number(el('currentLevelSelect').value||1);
 if(!o.placedLevel || o.facilityLevel<o.placedLevel){
   o.placedLevel=o.facilityLevel;
   o.placementCost=directPlacementCost(o.name,o.facilityLevel);
 }
 if(o.cropName){
   const cc=crops.find(c=>c.name===o.cropName);
   if(cc && Number(cc.facilityLevel||1)>o.facilityLevel){
     delete o.cropName;delete o.coinPH;o.label=o.name;o.req='none';
   }
 }
 if(o.recipeName&&recipeDB[o.name]){
   const rr=recipeDB[o.name].find(r=>r.name===o.recipeName);
   if(rr&&recipeRequiredLevel(o.name,rr)>o.facilityLevel) delete o.recipeName;
 }
 if(!o.targetLevel||o.targetLevel<o.facilityLevel)o.targetLevel=o.facilityLevel;
 render();
});
el('targetLevelSelect').addEventListener('change',()=>{
 const o=objects.find(x=>x.id===selected);if(!o)return;
 o.targetLevel=Number(el('targetLevelSelect').value||o.facilityLevel||1);
 render();
});
cropSelect.onchange=()=>{const o=objects.find(x=>x.id===selected);if(!o||!cropSelect.value)return;const c=crops.find(x=>x.name===cropSelect.value);assignCrop(o,c)};
el('clearCropBtn').addEventListener('click',()=>{const o=objects.find(x=>x.id===selected);clearCrop(o)});
el('recipeSelect').addEventListener('change',()=>{const o=objects.find(x=>x.id===selected);if(!o)return;const v=el('recipeSelect').value;if(!v){clearRecipe(o);return}assignRecipe(o,v)});
el('actualWorkerSelect').addEventListener('change',()=>{const o=objects.find(x=>x.id===selected);applyWorkerToObject(o,el('actualWorkerSelect').value)});
el('workerLevelSelect').addEventListener('change',()=>{const o=objects.find(x=>x.id===selected);if(o){o.workerLevel=Number(el('workerLevelSelect').value||4);render()}});
el('personalitySelect').addEventListener('change',()=>{const o=objects.find(x=>x.id===selected);if(o){o.personalityMult=Number(el('personalitySelect').value||1);render()}});
el('clearRecipeBtn').addEventListener('click',()=>{const o=objects.find(x=>x.id===selected);clearRecipe(o)});
rotateBtn.onclick=()=>{const o=objects.find(x=>x.id===selected);if(o){[o.w,o.h]=[o.h,o.w];render()}};
deleteBtn.onclick=()=>{objects=objects.filter(x=>x.id!==selected);selected=null;render()};
duplicateBtn.onclick=()=>{const o=objects.find(x=>x.id===selected);if(!o)return;const item=catalog.find(i=>i.name===o.name);if(!item)return;const lim=maxCount(item,+rvLevel.value);if(objects.filter(x=>x.name===o.name).length>=lim)return;objects.push({...o,id:idCounter++,x:o.x+.5,y:o.y+.5});selected=objects.at(-1).id;render()};

function nextFree(w,h){for(let y=0;y<=60-h;y+=.5)for(let x=0;x<=80-w;x+=.5){const t={id:-1,x,y,w,h};if(validArea(t)&&!collide(t))return[x,y]}return null}
addAllBtn.onclick=()=>{for(const item of catalog.filter(isUnlocked)){const lim=maxCount(item,+rvLevel.value),d=effectiveDims(item);if(d.w<=0||d.h<=0)continue;while(objects.filter(o=>o.name===item.name).length<lim){const p=nextFree(d.w,d.h);if(!p)break;{const obj={id:idCounter++,name:item.name,w:d.w,h:d.h,x:p[0],y:p[1],cls:item.cls||'',zone:item.zone||null,label:item.name,req:'none'};if(facilityLevels[item.name]&&facilityLevels[item.name].length){obj.facilityLevel=preferredPlaceLevel(item.name);obj.targetLevel=obj.facilityLevel;obj.placedLevel=obj.facilityLevel;obj.placementCost=directPlacementCost(item.name,obj.facilityLevel)}objects.push(obj)}}}selected=null;render()};
function updateClimateStarterState(){
 const names=['Heat Furnace','Cooling Unit','Sunlamp'];
 const available=names.some(n=>{const i=catalog.find(x=>x.name===n);return i&&isUnlocked(i)&&maxCount(i,+rvLevel.value)>0});
 starterBtn.disabled=!available;
 starterBtn.textContent=available?'Climate Starter':'Climate Starter 🔒 RV7';
 starterBtn.title=available?'Add one of each currently unlocked climate device to the first legal free space. Existing layout is preserved.':'Climate devices are not unlocked at this RV yet.';
}
starterBtn.onclick=()=>{
 const names=['Heat Furnace','Cooling Unit','Sunlamp'];
 let placed=0;
 for(const name of names){
   const item=catalog.find(a=>a.name===name);
   if(!item||!isUnlocked(item)||maxCount(item,+rvLevel.value)<=0)continue;
   if(objects.filter(o=>o.name===name).length>=maxCount(item,+rvLevel.value))continue;
   const d=effectiveDims(item),p=nextFree(d.w,d.h);
   if(!p)continue;
   const obj={id:idCounter++,name:item.name,w:d.w,h:d.h,x:p[0],y:p[1],cls:item.cls||'',zone:item.zone||null,label:item.name,req:'none'};
   if(facilityLevels[item.name]&&facilityLevels[item.name].length){obj.facilityLevel=preferredPlaceLevel(item.name);obj.targetLevel=obj.facilityLevel;obj.placedLevel=obj.facilityLevel;obj.placementCost=directPlacementCost(item.name,obj.facilityLevel)}
   objects.push(obj);placed++;
 }
 selected=null;render();updateClimateStarterState();
 if(startupStatus){startupStatus.textContent=placed?('Climate Starter added '+placed+' climate device'+(placed===1?'':'s')+'.'):'No additional climate devices can be placed in the currently open plots.';startupStatus.style.color=placed?'#8fe3a7':'#ffcb6b';}
};

rvLevel.onchange=()=>{
  for(const n of ['Farmland','Woodland','Mine']) delete maxOverrides[n];
  for(const name of Object.keys(placeLevelPrefs)){
    const m=maxFacilityLevel(name,+rvLevel.value);
    if(m>0) placeLevelPrefs[name]=Math.min(Number(placeLevelPrefs[name])||1,m);
  }
  for(const name of Object.keys(rvModules)){
    const m=moduleMaxForRV(name,+rvLevel.value);
    moduleLevels[name]=Math.min(Number(moduleLevels[name]||0),m);
  }
  render();updateClimateStarterState()
};
futureToggle.onchange=()=>{renderCatalog();renderRecipePanel()};
usableOnly.onchange=()=>{rebuildCropPicker();renderRecipePanel()};

function toggleLeftPanel(){
 const p=document.querySelector('main > section.panel:first-child');
 if(!p)return;
 const collapsed=p.classList.toggle('sideCollapsed');
 document.body.classList.toggle('compact-left',collapsed);
 toggleLeftBtn.textContent=collapsed?'▶':'◀ Inventory';
 if(autoFit.checked)setTimeout(fitBoard,20);
}
function toggleRightPanel(){
 const panels=document.querySelectorAll('main > section.panel');
 const p=panels[panels.length-1];
 if(!p)return;
 const collapsed=p.classList.toggle('sideCollapsed');
 document.body.classList.toggle('compact-right',collapsed);
 toggleRightBtn.textContent=collapsed?'◀':'Details ▶';
 if(autoFit.checked)setTimeout(fitBoard,20);
}

wateredTwice.addEventListener('change',()=>render());
snapSel.onchange=()=>SNAP=parseFloat(snapSel.value);
showCoords.onchange=()=>document.querySelectorAll('.coordEl').forEach(e=>e.style.display=showCoords.checked?'':'none');
showLocked.onchange=()=>document.querySelectorAll('.lockedPlot').forEach(e=>e.style.display=showLocked.checked?'flex':'none');
zoomOutBtn.onclick=()=>zoomStep(-10);
zoomInBtn.onclick=()=>zoomStep(10);
zoomSlider.addEventListener('input',()=>manualZoomPercent(zoomSlider.value));
fitBtn.onclick=()=>{autoFit.checked=true;fitBoard()};
actualBtn.onclick=()=>actualBoard();
toggleLeftBtn.onclick=()=>toggleLeftPanel();
toggleRightBtn.onclick=()=>toggleRightPanel();
autoFit.onchange=()=>{if(autoFit.checked)fitBoard();else actualBoard()};
centerBtn.onclick=()=>{const w=mapViewport||workspaceWrap;w.scrollLeft=(w.scrollWidth-w.clientWidth)/2;w.scrollTop=0};
window.addEventListener('resize',()=>{if(autoFit.checked)fitBoard()});


modulesToRvMaxBtn.onclick=()=>{initModuleLevelsToRvMax();render()};
allPlotsBtn.onclick=()=>{openPlots=new Set(Array.from({length:16},(_,i)=>i+1));render()};
noPlotsBtn.onclick=()=>{openPlots=new Set();render()};


el('addWorkerBtn').onclick=()=>{workers.push(defaultWorker());render()};
el('addFiveWorkersBtn').onclick=()=>{for(let i=0;i<5;i++)workers.push(defaultWorker());render()};
el('clearRosterBtn').onclick=()=>{if(confirm('Clear all entered Aniimo from the roster?')){workers=[];for(const o of objects)delete o.workerId;render()}};
el('refreshAdvisorBtn').onclick=()=>renderAdvisor();

const STABLE_SAVE_KEY='aniimoPlanner';
const LEGACY_SAVE_KEYS=[
 'aniimoPlannerV18','aniimoPlannerV17','aniimoPlannerV16','aniimoPlannerV15',
 'aniimoPlannerV14','aniimoPlannerV13','aniimoPlannerV12','aniimoPlannerV11',
 'aniimoPlannerV10','aniimoPlannerV9','aniimoPlannerV8','aniimoPlannerV7'
];

function currentPlannerState(){
 return {
   version:30.4,
   rv:+rvLevel.value,
   objects,
   idCounter,
   maxOverrides,
   dimensionOverrides,
   placeLevelPrefs,
   moduleLevels,
   openPlots:[...openPlots],
   workers,
   workerIdCounter,
   aniidexImportMeta
 };
}
function applyPlannerState(d){
 rvLevel.value=d.rv||1;
 objects=Array.isArray(d.objects)?d.objects:[];
 idCounter=d.idCounter||Math.max(1,...objects.map(o=>(Number(o.id)||0)+1));
 maxOverrides=d.maxOverrides||{};
 dimensionOverrides=d.dimensionOverrides||{};
 placeLevelPrefs=d.placeLevelPrefs||{};
 moduleLevels=d.moduleLevels||{};
 if(!Object.keys(moduleLevels).length)initModuleLevelsToRvMax();
 openPlots=new Set(Array.isArray(d.openPlots)?d.openPlots:[1]);
 workers=Array.isArray(d.workers)?d.workers:[];
 workerIdCounter=d.workerIdCounter||Math.max(1,...workers.map(w=>(Number(w.id)||0)+1));
 aniidexImportMeta=d.aniidexImportMeta||null;
 selected=null;
 normalizeLegacyNames();
 render();
}
function tryBrowserSave(){
 const payload=JSON.stringify(currentPlannerState());
 localStorage.setItem(STABLE_SAVE_KEY,payload);
 return localStorage.getItem(STABLE_SAVE_KEY)===payload;
}
function findBrowserSave(){
 let s=localStorage.getItem(STABLE_SAVE_KEY);
 if(s)return {data:s,key:STABLE_SAVE_KEY};
 for(const key of LEGACY_SAVE_KEYS){
   s=localStorage.getItem(key);
   if(s)return {data:s,key};
 }
 return null;
}

const PROFILE_KEY='aniimoPlannerProfilesV30';
const LEGACY_PROFILE_KEY='aniimoPlannerProfilesV29';
let profileStore={current:null,profiles:{}};
let profileSaveTimer=null;
function newProfileId(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function loadProfileStore(){try{let raw=localStorage.getItem(PROFILE_KEY);if(!raw)raw=localStorage.getItem(LEGACY_PROFILE_KEY);if(raw){const x=JSON.parse(raw);if(x&&x.profiles)profileStore=x}}catch(e){};if(!profileStore.current||!profileStore.profiles[profileStore.current]){const id=newProfileId();profileStore={current:id,profiles:{[id]:{id,name:'Main Account',type:'Main',state:null,updated:Date.now()}}};saveProfileStore()}}
function saveProfileStore(){try{localStorage.setItem(PROFILE_KEY,JSON.stringify(profileStore))}catch(e){}}
function snapshotIntoCurrentProfile(){const p=profileStore.profiles[profileStore.current];if(!p)return;p.state=currentPlannerState();p.updated=Date.now();saveProfileStore();const st=el('profileSaveState');if(st)st.textContent='Saved locally ✓'}
function scheduleProfileAutosave(){const st=el('profileSaveState');if(st)st.textContent='Saving…';clearTimeout(profileSaveTimer);profileSaveTimer=setTimeout(snapshotIntoCurrentProfile,250)}
function renderProfileBar(){const sel=el('profileSelect'),typ=el('profileType');if(!sel||!typ)return;const old=profileStore.current;sel.innerHTML='';Object.values(profileStore.profiles).sort((a,b)=>a.name.localeCompare(b.name)).forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.name;sel.appendChild(o)});sel.value=old;const p=profileStore.profiles[old];if(p)typ.value=p.type||'Custom'}
function switchProfile(id){if(id===profileStore.current)return;snapshotIntoCurrentProfile();const p=profileStore.profiles[id];if(!p)return;profileStore.current=id;saveProfileStore();if(p.state)applyPlannerState(JSON.parse(JSON.stringify(p.state)));else render();renderProfileBar()}
function createProfile(name,type='Custom',copyState=true){snapshotIntoCurrentProfile();const id=newProfileId();profileStore.profiles[id]={id,name:name||'New Profile',type,state:copyState?JSON.parse(JSON.stringify(currentPlannerState())):null,updated:Date.now()};profileStore.current=id;saveProfileStore();renderProfileBar();render()}
function initProfileUI(){loadProfileStore();const p=profileStore.profiles[profileStore.current];if(p&&p.state){applyPlannerState(JSON.parse(JSON.stringify(p.state)))}else if(p){p.state=currentPlannerState();saveProfileStore()}renderProfileBar()}

el('homelandImportTopBtn')?.addEventListener('click',focusHomelandImporter);
el('profileSelect')?.addEventListener('change',e=>switchProfile(e.target.value));
el('profileType')?.addEventListener('change',e=>{const p=profileStore.profiles[profileStore.current];if(p){p.type=e.target.value;saveProfileStore();renderProfileBar()}});
el('newProfileBtn')?.addEventListener('click',()=>{const n=prompt('New profile name:','New Profile');if(n)createProfile(n,'Custom',false)});
el('duplicateProfileBtn')?.addEventListener('click',()=>{const cur=profileStore.profiles[profileStore.current];const n=prompt('Duplicate profile as:',(cur?.name||'Profile')+' Copy');if(n)createProfile(n,cur?.type||'Custom',true)});
el('renameProfileBtn')?.addEventListener('click',()=>{const p=profileStore.profiles[profileStore.current];if(!p)return;const n=prompt('Rename profile:',p.name);if(n){p.name=n;saveProfileStore();renderProfileBar()}});
el('deleteProfileBtn')?.addEventListener('click',()=>{const ids=Object.keys(profileStore.profiles);if(ids.length<=1){alert('Keep at least one profile.');return}const p=profileStore.profiles[profileStore.current];if(!confirm(`Delete profile "${p.name}"?`))return;delete profileStore.profiles[profileStore.current];profileStore.current=Object.keys(profileStore.profiles)[0];saveProfileStore();const q=profileStore.profiles[profileStore.current];if(q?.state)applyPlannerState(JSON.parse(JSON.stringify(q.state)));renderProfileBar()});


// Embedded Aniidex reference snapshot (captured by user; used offline for ID decoding)
// Catalog controls
for(const a of HOME_ABILITIES){const o=document.createElement('option');o.value=a;o.textContent=a;el('abilityFilter')?.appendChild(o)}
for(const [id,f] of Object.entries(ANIIMO_FAMILIES)){const o=document.createElement('option');o.value=id;o.textContent=f.label;el('familyFilter')?.appendChild(o)}
document.querySelectorAll('[data-cmode]').forEach(b=>b.addEventListener('click',()=>{catalogMode=b.dataset.cmode;document.querySelectorAll('[data-cmode]').forEach(x=>x.classList.toggle('active',x===b));renderAniimoCatalog()}));
el('aniimoSearch')?.addEventListener('input',renderAniimoCatalog);el('abilityFilter')?.addEventListener('change',renderAniimoCatalog);el('levelFilter')?.addEventListener('change',renderAniimoCatalog);el('familyFilter')?.addEventListener('change',renderAniimoCatalog);
el('addCustomWorkerBtn')?.addEventListener('click',()=>{workers.push(defaultWorker());render()});

loadBtn.onclick=()=>{
 try{
   const found=findBrowserSave();
   if(!found){
     alert('No browser save found. If you have a JSON backup, use "Load JSON File".');
     return;
   }
   const d=JSON.parse(found.data);
   applyPlannerState(d);

   // Automatically migrate an old versioned key to the stable key.
   if(found.key!==STABLE_SAVE_KEY){
     tryBrowserSave();
     alert('Loaded older save and migrated it to the permanent save slot.');
   }else{
     alert('Loaded browser save.');
   }
 }catch(e){
   alert('The browser save could not be loaded. Try "Load JSON File".');
 }
};


saveJsonFileBtn.onclick=()=>{
 const payload=JSON.stringify(currentPlannerState(),null,2);
 const blob=new Blob([payload],{type:'application/json'});
 const a=document.createElement('a');
 a.href=URL.createObjectURL(blob);
 a.download='Aniimo_Homeland_Planner_Save.json';
 a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};

loadJsonFileBtn.onclick=()=>jsonFileInput.click();

jsonFileInput.addEventListener('change',()=>{
 const file=jsonFileInput.files&&jsonFileInput.files[0];
 if(!file)return;
 const reader=new FileReader();
 reader.onload=()=>{
   try{
     const d=JSON.parse(String(reader.result||''));
     applyPlannerState(d);
     alert('JSON save loaded.');
   }catch(e){
     alert('That file could not be loaded: '+(e&&e.message?e.message:String(e)));
   }
   jsonFileInput.value='';
 };
 reader.readAsText(file);
});

downloadHtmlBtn.onclick=()=>{
 const state=currentPlannerState();
 let source='<!doctype html>\n'+document.documentElement.outerHTML;
 const payload=JSON.stringify(state).replace(/</g,'\\u003c');
 source=source.replace('const EMBEDDED_STATE=null;','const EMBEDDED_STATE='+payload+';');
 const blob=new Blob([source],{type:'text/html'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Aniimo_Homeland_Planner_v30_Custom.html';a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
clearBtn.onclick=()=>{if(confirm('Clear current layout?')){objects=[];selected=null;render()}};

// Initialize module defaults only after rvModules/moduleLevels have been declared.
if(!Object.keys(moduleLevels).length) initModuleLevelsToRvMax();
updateClimateStarterState();

if(EMBEDDED_STATE){
 try{
   const d=EMBEDDED_STATE;rvLevel.value=d.rv||1;objects=d.objects||[];idCounter=d.idCounter||1;
   maxOverrides=d.maxOverrides||{};dimensionOverrides=d.dimensionOverrides||{};placeLevelPrefs=d.placeLevelPrefs||{};moduleLevels=d.moduleLevels||{};if(!Object.keys(moduleLevels).length)initModuleLevelsToRvMax();openPlots=new Set(Array.isArray(d.openPlots)?d.openPlots:[1]);
 }catch(e){}
}
try{
 normalizeLegacyNames();
 initV30Layout();
 initProfileUI();
 renderAniimoCatalog();
 render();
 startupStatus.textContent='Planner ready — profile autosave enabled.';
 startupStatus.style.color='#8fe3a7';
 setTimeout(()=>{if(autoFit.checked)fitBoard();else centerBtn.click()},100);
}catch(err){
 console.error(err);
 startupStatus.textContent='Startup error: '+(err&&err.message?err.message:String(err));
 startupStatus.style.color='#ff7a83';
}
