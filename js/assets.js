// v30.12.2 local asset resolver.
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
  function canonicalFormName(formName=''){
    const raw=String(formName||'').trim();
    if(!raw||/^(base|basic|basic form)$/i.test(raw))return '';
    if(/^prismana form$/i.test(raw))return 'Prismana';
    return raw;
  }
  function form(name,formName=''){
    const wanted=canonicalFormName(formName);
    return byNameForm.get(normalize(String(name||'')+'|'+wanted))||
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
  const stageNameAliases={Hexxin:'Witchin'};
  function stageSpeciesName(name){
    const raw=String(name||'').trim();
    return stageNameAliases[raw]||raw;
  }
  function romanSparklingNumber(v){
    const s=String(v||'').trim().toUpperCase();
    const m=s.match(/(?:VARIANT|TYPE|SPARKLING)?\s*[- ]?0*(\d{1,2})/);
    if(m){const n=Number(m[1]);return n>=1&&n<=12?n:0}
    const roman=(s.match(/\b(X|IX|VIII|VII|VI|V|IV|III|II|I)\b/)||[])[1];
    return {I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10}[roman]||0;
  }
  function stageAppearanceLabel(appearance='Normal',sparklingHue=''){
    const raw=String(appearance||'Normal');
    const a=appearanceKey(raw);
    if(a==='normal')return 'Normal';
    if(a==='umbral')return 'Umbral';
    if(a==='dazzling-sparkling')return 'Sparkling-11';
    if(a==='shadow-sparkling')return 'Sparkling-12';
    if(a==='sparkling'){
      const n=romanSparklingNumber(sparklingHue)||romanSparklingNumber(raw)||1;
      return `Sparkling-${String(n).padStart(2,'0')}`;
    }
    return '';
  }
  function stagePortrait(name,f,appearance='Normal',sparklingHue=''){
    if(!f?.id)return'';
    const label=stageAppearanceLabel(appearance,sparklingHue);if(!label)return'';
    const species=stageSpeciesName(name||f.name);
    return `assets/aniimo/stage/${species}__${f.id}__ThreeQuarter__${label}.webp`;
  }
  function portraitCandidates(name,formName='',appearance='Normal',sparklingHue=''){
    const f=form(name,formName);if(!f)return[];
    const a=appearanceKey(appearance),h=normalize(sparklingHue).replace(/ /g,'-');
    const base=`assets/aniimo/heads/${f.id}`;
    const out=[];
    const stage=stagePortrait(name,f,appearance,sparklingHue);
    if(stage)out.push(stage);
    if(a!=='normal'&&h)out.push(`${base}/${a}/${h}.webp`);
    out.push(`${base}/${a}.webp`);
    out.push(f.head||`${base}.webp`);
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
  window.AniimoAssets={manifest:m,canonicalFormName,form,appearanceKey,stageAppearanceLabel,stagePortrait,portraitCandidates,localFormPortrait,localFormArt,facility,item,ability};
})();