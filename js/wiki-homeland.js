'use strict';

(function(){
  const nameAliases={Hexxin:'Witchin',Witchin:'Hexxin'};
  const norm=s=>String(s||'').toLowerCase().replace(/\b(basic|base)\s+form\b/g,'base').replace(/\bform\b/g,'').replace(/[^a-z0-9]+/g,' ').trim();

  function raw(){return window.ANIIMO_OFFICIAL_WIKI_HOMELAND||null}
  function speciesList(){return raw()?.species||[]}
  function speciesByName(name){
    const key=norm(name);
    return speciesList().find(s=>norm(s.name)===key)
      ||speciesList().find(s=>norm(s.name)===norm(nameAliases[name]))
      ||null;
  }
  function bestForSpecies(name){
    const s=speciesByName(name);
    return s?.bestAbilities||[];
  }
  function formsForSpecies(name){return speciesByName(name)?.forms||[]}
  function formFor(name,form){
    const forms=formsForSpecies(name),key=norm(form||'base');
    return forms.find(f=>norm(f.label)===key||norm(f.slug)===key)
      ||forms.find(f=>key==='base'&&/^(basic|base)[ -]?form$/i.test(f.label||''))
      ||null;
  }
  function rankAbility(type,minLevel=1){
    const key=norm(type);
    const rows=[];
    for(const s of speciesList()){
      const best=(s.bestAbilities||[]).find(a=>norm(a.type)===key);
      if(!best||Number(best.level||0)<Number(minLevel||1))continue;
      rows.push({
        dex:s.dex,
        name:s.name,
        abilityId:best.abilityId,
        type:best.type,
        level:Number(best.level)||0,
        forms:best.forms||[],
        source:s.indexUrl||raw()?.source||''
      });
    }
    return rows.sort((a,b)=>b.level-a.level||(b.forms?.length||0)-(a.forms?.length||0)||a.name.localeCompare(b.name));
  }
  function allAbilityTypes(){
    const seen=new Map();
    for(const s of speciesList())for(const a of (s.bestAbilities||[]))seen.set(String(a.abilityId),a.type);
    return [...seen.entries()].map(([abilityId,type])=>({abilityId:Number(abilityId),type})).sort((a,b)=>a.abilityId-b.abilityId);
  }
  function summary(){
    const d=raw();
    return d?{
      source:d.source,
      scrapedAt:d.scrapedAt,
      counts:d.counts||{},
      warnings:d.warnings||[]
    }:{source:'https://wiki.aniimo.com/',scrapedAt:null,counts:{species:0,forms:0,formsWithAbilities:0},warnings:['Official Wiki reference is not loaded.']};
  }

  window.WikiHomeland={raw,speciesList,speciesByName,bestForSpecies,formsForSpecies,formFor,rankAbility,allAbilityTypes,summary,normalize:norm};
})();
