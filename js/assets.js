// v30.12 local asset resolver.
// Local static game assets are preferred when present. Missing files fall back without breaking the UI.
(function(){
  const m=window.ANIIMO_ASSET_MANIFEST||{};
  const forms=m.aniimoForms||{};
  const normalize=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const byNameForm=new Map();
  for(const [id,f] of Object.entries(forms)){
    byNameForm.set(normalize((f.name||'')+'|'+(f.form||'')),{id,...f});
    if((f.form||'').toLowerCase()==='basic form')byNameForm.set(normalize((f.name||'')+'|'),{id,...f});
  }
  function form(name,formName=''){
    return byNameForm.get(normalize(String(name||'')+'|'+String(formName||'')))||
      byNameForm.get(normalize(String(name||'')+'|'))||null;
  }
  function appearanceKey(v){
    const s=normalize(v||'normal');
    if(s.includes('dazzling'))return 'dazzling-sparkling';
    if(s.includes('shadow'))return 'shadow-sparkling';
    if(s.includes('sparkling')||s.includes('shiny'))return 'sparkling';
    if(s.includes('umbral'))return 'umbral';
    return 'normal';
  }
  function portraitCandidates(name,formName='',appearance='Normal',sparklingHue=''){
    const f=form(name,formName);if(!f)return[];
    const a=appearanceKey(appearance),h=normalize(sparklingHue).replace(/ /g,'-');
    const base=`assets/aniimo/heads/${f.id}`;
    const out=[];
    if(a!=='normal'&&h)out.push(`${base}/${a}/${h}.webp`);
    out.push(`${base}/${a}.webp`);
    if(a==='normal')out.push(f.head||`${base}.webp`);
    else out.push(f.head||`${base}.webp`);
    return [...new Set(out.filter(Boolean))];
  }
  function localFormPortrait(name,formName='',appearance='Normal',sparklingHue=''){
    return portraitCandidates(name,formName,appearance,sparklingHue)[0]||'';
  }
  function localFormArt(name,formName=''){
    const f=form(name,formName);return f?.art||'';
  }
  function facility(name){
    return Object.values(m.facilities||{}).find(x=>x.name===name)||null;
  }
  function item(id){return (m.items||{})[String(id)]||null}
  function ability(name){return (m.abilities||{})[name]||null}
  window.AniimoAssets={manifest:m,form,appearanceKey,portraitCandidates,localFormPortrait,localFormArt,facility,item,ability};
})();