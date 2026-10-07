#!/usr/bin/env node
/**
 * Scrape Wikily Homeland mutant plants and farmland crops.
 *
 * Goals:
 * - Mutant Plant reference must discover at least 120 entries before publishing.
 * - Capture every 403xxxx item id + friendly name + Wikily URL we can discover.
 * - Capture growable crop names and seed names from the Farmland guide, including
 *   late-RV, seasonal and collaboration crops.
 *
 * Optional second pass:
 * - If an Aniidx item page can be resolved for a discovered name, parse Base sell price.
 *
 * Node 18+ built-ins only. This script is intentionally NOT run in every smoke test.
 */
const fs=require('fs');
const path=require('path');

const WIKILY_FURNITURE='https://new.wikily.gg/aniimo/homeland-furniture';
const WIKILY_FARMLAND='https://new.wikily.gg/aniimo/homeland-furniture/farmland';
const OUT_JSON=path.join(__dirname,'..','data','wikily-homeland-reference.json');
const OUT_JS=path.join(__dirname,'..','data','wikily-homeland-reference.js');

async function get(url){
  const r=await fetch(url,{headers:{'user-agent':'aniimo-homeland-planner-reference/1.0'}});
  if(!r.ok)throw new Error(url+' HTTP '+r.status);
  return await r.text();
}
function clean(s){return String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim()}
function slugify(name){return String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

function discoverMutants(html){
  const byId={};
  // Wikily detail paths end in -403xxxx for mutant plant objects.
  const re=/href=["']([^"']*\/homeland-furniture\/([^"'/?#]+)-(403\d{4}))["']/gi;
  let m;
  while((m=re.exec(html))){
    const id=m[3],slug=m[2];
    const name=slug.split('-').map(x=>x?x[0].toUpperCase()+x.slice(1):'').join(' ');
    byId[id]={id:Number(id),name,url:new URL(m[1],WIKILY_FURNITURE).href};
  }
  // Also accept absolute/canonical URLs present in embedded page state.
  const re2=/https?:\\?\/\\?\/[^"'\s]+\/homeland-furniture\/([^"'/?#\\]+)-(403\d{4})/gi;
  while((m=re2.exec(html))){
    const id=m[2],slug=m[1].replace(/\\/g,'');
    if(!byId[id]){
      const name=slug.split('-').map(x=>x?x[0].toUpperCase()+x.slice(1):'').join(' ');
      byId[id]={id:Number(id),name,url:'https://wikily.gg/aniimo/homeland-furniture/'+slug+'-'+id};
    }
  }
  return byId;
}

function discoverCrops(html){
  const crops={};
  // Heading followed by "Needs: <seed> ×1" and "Produces: <crop> ×N".
  const normalized=clean(html);
  const re=/([A-Z][A-Za-z0-9' -]{1,60})\s+Needs:\s+([A-Z][A-Za-z0-9' -]{1,60}Seeds?)\s+×1\s+Produces:\s+([A-Z][A-Za-z0-9' -]{1,60})\s+×\d+/g;
  let m;
  while((m=re.exec(normalized))){
    const heading=m[1].trim(),seed=m[2].trim(),product=m[3].trim();
    const key=product.toLowerCase();
    crops[key]={name:product,seed,recipe:heading,source:WIKILY_FARMLAND};
  }
  return Object.values(crops).sort((a,b)=>a.name.localeCompare(b.name));
}

(async()=>{
  const [furnitureHtml,farmlandHtml]=await Promise.all([get(WIKILY_FURNITURE),get(WIKILY_FARMLAND)]);
  const mutants=discoverMutants(furnitureHtml);
  const mutantRows=Object.values(mutants).sort((a,b)=>a.id-b.id);
  if(mutantRows.length<120){
    throw new Error('Refusing to publish incomplete mutant reference: discovered '+mutantRows.length+'; expected at least 120.');
  }
  const crops=discoverCrops(farmlandHtml);
  if(crops.length<10)throw new Error('Refusing to publish suspiciously small crop reference: '+crops.length);

  const payload={
    format:'aniimo-wikily-homeland-reference-v1',
    source:{furniture:WIKILY_FURNITURE,farmland:WIKILY_FARMLAND},
    scrapedAt:new Date().toISOString(),
    counts:{mutantPlants:mutantRows.length,crops:crops.length},
    mutantPlants:mutantRows,
    mutantById:Object.fromEntries(mutantRows.map(x=>[String(x.id),x])),
    crops
  };
  fs.writeFileSync(OUT_JSON,JSON.stringify(payload,null,2)+'\n');
  fs.writeFileSync(OUT_JS,'window.ANIIMO_WIKILY_HOMELAND_REFERENCE='+JSON.stringify(payload,null,2)+';\n');
  console.log('Wrote',OUT_JSON,'with',mutantRows.length,'mutant plants and',crops.length,'crops.');
})().catch(err=>{console.error(err.stack||err);process.exit(1)});
