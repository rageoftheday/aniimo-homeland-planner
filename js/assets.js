// v30.11 local asset resolver.
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
  function localFormPortrait(name,formName=''){
    const f=form(name,formName);return f?.head||'';
  }
  function localFormArt(name,formName=''){
    const f=form(name,formName);return f?.art||'';
  }
  function facility(name){
    return Object.values(m.facilities||{}).find(x=>x.name===name)||null;
  }
  function item(id){return (m.items||{})[String(id)]||null}
  function ability(name){return (m.abilities||{})[name]||null}
  window.AniimoAssets={manifest:m,form,localFormPortrait,localFormArt,facility,item,ability};
})();