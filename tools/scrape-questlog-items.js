#!/usr/bin/env node
'use strict';

/**
 * Questlog Aniimo item reference scraper.
 * Source: https://questlog.gg/aniimo/en/db/items
 * Node 18+ built-ins only.
 *
 * Output:
 *   data/questlog-items.json
 *   data/questlog-items.js
 */

const fs=require('fs');
const path=require('path');

const ROOT='https://questlog.gg';
const ITEMS_ROOT=ROOT+'/aniimo/en/db/items';
const OUT_JSON=path.resolve(__dirname,'../data/questlog-items.json');
const OUT_JS=path.resolve(__dirname,'../data/questlog-items.js');
const REQUEST_DELAY_MS=Number(process.env.QUESTLOG_DELAY_MS||160);
const MAX_LIST_PAGES=Number(process.env.QUESTLOG_MAX_LIST_PAGES||250);
const USER_AGENT='Aniimo-Homeland-Planner-Reference-Builder/1.0 (+https://github.com/rageoftheday/aniimo-homeland-planner)';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const uniq=a=>[...new Set(a.filter(Boolean))];

function decodeEntities(s){
  return String(s||'')
    .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#x2F;/gi,'/')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
}
function clean(s){return decodeEntities(String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim())}
function abs(href,base=ROOT){try{return new URL(decodeEntities(href),base).href}catch{return ''}}

async function fetchText(url,accept='text/html,application/xhtml+xml,application/xml,text/xml'){
  const res=await fetch(url,{headers:{'User-Agent':USER_AGENT,'Accept':accept},redirect:'follow'});
  if(!res.ok)throw new Error(url+' HTTP '+res.status);
  return res.text();
}

function itemUrlsFromText(text){
  const out=[];
  const re=/https?:\/\/questlog\.gg\/aniimo\/en\/db\/item\/(\d+)|\/aniimo\/en\/db\/item\/(\d+)/gi;
  let m;while((m=re.exec(text)))out.push(ROOT+'/aniimo/en/db/item/'+(m[1]||m[2]));
  return uniq(out);
}
function hrefs(html,base){
  const out=[];const re=/<a\b[^>]*href=["']([^"']+)["']/gi;let m;
  while((m=re.exec(html)))out.push(abs(m[1],base));
  return uniq(out);
}
function xmlLocs(xml){
  const out=[];const re=/<loc[^>]*>([\s\S]*?)<\/loc>/gi;let m;
  while((m=re.exec(xml)))out.push(clean(m[1]));
  return uniq(out);
}
function parseSellPrice(html){
  const plain=clean(html);
  const m=plain.match(/Sell Price\s+([0-9][0-9,]*)/i);
  return m?Number(m[1].replace(/,/g,'')):null;
}
function parseTitle(html){
  const h1=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);if(h1)return clean(h1[1]);
  const t=html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return t?clean(t[1]).replace(/\s*-\s*Item\s*\|[\s\S]*$/i,''):'';
}
function parseBreadcrumbs(html){
  const chunks=[];const nav=html.match(/<nav\b[^>]*[\s\S]*?<\/nav>/i)?.[0]||html.slice(0,20000);
  const re=/<a\b[^>]*href=["'][^"']*\/db\/items[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;let m;
  while((m=re.exec(nav))){const x=clean(m[1]);if(x&&!chunks.includes(x))chunks.push(x)}
  return chunks;
}
function parseSource(html){
  const plain=clean(html);
  const m=plain.match(/Source:\s*(.{1,180}?)(?=\s+(?:Comments|Sold For|Rewarded By|Scraps Into|Name\s+Amount|$))/i);
  return m?m[1].trim():'';
}
function parseRarity(html){
  const plain=clean(html);
  const known=['Common','Uncommon','Rare','Epic','Legendary','Mythic'];
  return known.find(x=>new RegExp('\\b'+x+'\\b','i').test(plain))||'';
}
function parseItemPage(url,html){
  const id=Number(url.match(/\/item\/(\d+)/)?.[1]||0);
  const crumbs=parseBreadcrumbs(html);
  return {
    id,
    name:parseTitle(html)||('Item '+id),
    category:crumbs[0]||'',
    type:crumbs[1]||'',
    rarity:parseRarity(html),
    sell:parseSellPrice(html),
    source:parseSource(html),
    url
  };
}

async function discoverFromSitemaps(){
  const candidates=[
    ROOT+'/sitemap.xml',
    ROOT+'/sitemap-index.xml',
    ROOT+'/sitemap_index.xml',
    ROOT+'/aniimo/sitemap.xml'
  ];
  const seen=new Set(),queue=[...candidates],items=new Set(),warnings=[];
  while(queue.length&&seen.size<100){
    const url=queue.shift();if(seen.has(url))continue;seen.add(url);
    try{
      const xml=await fetchText(url,'application/xml,text/xml,text/plain,*/*');
      for(const item of itemUrlsFromText(xml))items.add(item);
      for(const loc of xmlLocs(xml)){
        if(/sitemap/i.test(loc)&&loc.startsWith(ROOT)&&!seen.has(loc))queue.push(loc);
        if(/\/aniimo\/en\/db\/item\/\d+/.test(loc))items.add(loc.split(/[?#]/)[0]);
      }
    }catch(err){warnings.push('sitemap '+url+': '+err.message)}
  }
  return {items,warnings};
}

async function discoverFromLists(){
  const items=new Set(),visited=new Set(),queue=[ITEMS_ROOT],warnings=[];
  for(let i=1;i<=MAX_LIST_PAGES;i++)queue.push(ITEMS_ROOT+'?page='+i);
  while(queue.length&&visited.size<MAX_LIST_PAGES+150){
    const url=queue.shift();if(visited.has(url))continue;visited.add(url);
    try{
      await sleep(REQUEST_DELAY_MS);
      const html=await fetchText(url);
      for(const item of itemUrlsFromText(html))items.add(item);
      for(const link of hrefs(html,url)){
        if(!link.startsWith(ROOT+'/aniimo/en/db/items'))continue;
        if(!visited.has(link)&&queue.length<MAX_LIST_PAGES+300)queue.push(link);
      }
    }catch(err){warnings.push('list '+url+': '+err.message)}
  }
  return {items,warnings};
}

async function main(){
  console.log('Questlog Aniimo item scraper');
  console.log('Source:',ITEMS_ROOT);

  const sitemap=await discoverFromSitemaps();
  console.log('Sitemap item URLs:',sitemap.items.size);

  const discovered=new Set(sitemap.items);
  const warnings=[...sitemap.warnings];

  const lists=await discoverFromLists();
  for(const u of lists.items)discovered.add(u);
  warnings.push(...lists.warnings);
  console.log('Combined item URLs:',discovered.size);

  if(discovered.size<100){
    throw new Error('Only '+discovered.size+' item URLs discovered; refusing to publish a likely incomplete Questlog scrape.');
  }

  const items=[];let done=0;
  const urls=[...discovered].sort((a,b)=>Number(a.match(/\d+$/)?.[0])-Number(b.match(/\d+$/)?.[0]));
  for(const url of urls){
    await sleep(REQUEST_DELAY_MS);
    try{
      const html=await fetchText(url);
      const row=parseItemPage(url,html);
      if(row.id)items.push(row);
    }catch(err){warnings.push('item '+url+': '+err.message)}
    done++;
    if(done%100===0||done===urls.length)console.log('Parsed',done,'/',urls.length);
  }

  const byId={};for(const row of items)byId[String(row.id)]=row;
  const output={
    format:'aniimo-questlog-items-v1',
    source:ITEMS_ROOT,
    scrapedAt:new Date().toISOString(),
    scraper:{requestDelayMs:REQUEST_DELAY_MS,discovered:discovered.size},
    counts:{
      items:items.length,
      withSellPrice:items.filter(x=>Number.isFinite(x.sell)).length,
      withName:items.filter(x=>x.name&&!/^Item \d+$/.test(x.name)).length
    },
    warnings,
    items,
    byId
  };

  fs.mkdirSync(path.dirname(OUT_JSON),{recursive:true});
  fs.writeFileSync(OUT_JSON,JSON.stringify(output,null,2)+'\n');
  fs.writeFileSync(OUT_JS,'window.ANIIMO_QUESTLOG_ITEMS='+JSON.stringify(output)+';\n');
  console.log('Saved:',OUT_JSON);
  console.log('Saved:',OUT_JS);
  console.log('Counts:',output.counts);
  if(warnings.length)console.log('Warnings:',warnings.length);
}

main().catch(err=>{console.error('\nScrape failed:',err&&err.stack||err);process.exitCode=1});
