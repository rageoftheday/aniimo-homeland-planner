const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('js/homebuilder-portraits.js','utf8');
const data=JSON.parse(fs.readFileSync('data/homebuilder-aniimo-portraits.json','utf8'));
let resolveFetch,renderCount=0;
const ctx={window:{},document:{querySelectorAll:()=>[]},render:()=>{renderCount++},fetch:()=>new Promise(resolve=>{resolveFetch=resolve})};
vm.runInNewContext(source,ctx);
const portraits=ctx.window.HomebuilderPortraits;
assert.equal(portraits.candidates({name:'Fragrancier',form:'Base'}).length,0,'Cannot guess old filename before manifest loads');
resolveFetch({ok:true,json:async()=>data});
setImmediate(()=>{
 assert.equal(renderCount,1,'Map must rerender when manifest becomes available');
 assert.equal(portraits.candidates({name:'Fragrancier',form:'Base'})[0],data.assets.fragrancier,'Base form must use current ID-mapped PNG');
 assert.equal(portraits.candidates({name:'Fragrancier',formId:1035200,form:'Base'})[0],data.byFormId['1035200'],'Numeric form must resolve exact ID');
 assert.equal(portraits.candidates({name:'Piopiota',form:'Nighttime Form'})[0],data.assets['nighttime-piopiota'],'Variant needs correct circular PNG');
 assert.equal(portraits.candidates({name:'Glacy',form:'Prismana Form'})[0],data.assets['prismana-glacy'],'Prismana needs matching PNG');
 console.log('PASS: deferred manifest triggers map refresh; Fragrancier, Nighttime Piopiota and Prismana Glacy use uploaded portraits');
});
