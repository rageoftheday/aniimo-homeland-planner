(()=>{
  const CONTROL='aniimo-homeland-companion-control';
  const PAGE='aniimo-homeland-companion-page';
  let turnstileLoader=null;

  function emit(type,payload={}){
    window.postMessage({channel:PAGE,type,...payload},location.origin);
  }

  async function jsonFetch(url,options={}){
    const response=await fetch(url,{credentials:'same-origin',...options});
    let data=null;
    try{data=await response.json();}catch{}
    if(!response.ok){
      const err=new Error((data&&data.message)||url+' HTTP '+response.status);
      err.status=response.status;
      throw err;
    }
    return data||{};
  }

  function loadTurnstile(){
    if(window.turnstile)return Promise.resolve();
    if(turnstileLoader)return turnstileLoader;
    turnstileLoader=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async=true;
      script.onload=resolve;
      script.onerror=()=>{turnstileLoader=null;reject(new Error('Could not load Aniidx verification.'));};
      document.head.appendChild(script);
    });
    return turnstileLoader;
  }

  function runTurnstile(siteKey,requestId){
    return new Promise((resolve,reject)=>{
      let host=document.getElementById('aniimo-companion-turnstile');
      if(!host){
        host=document.createElement('div');
        host.id='aniimo-companion-turnstile';
        Object.assign(host.style,{
          position:'fixed',zIndex:'2147483647',left:'50%',top:'24px',transform:'translateX(-50%)',
          padding:'16px',borderRadius:'14px',background:'#fff',boxShadow:'0 14px 45px rgba(0,0,0,.35)'
        });
        document.body.appendChild(host);
      }
      host.innerHTML='';
      emit('ANIIMO_PAGE_STATUS',{requestId,message:'Aniidx verification required — complete the Cloudflare check in this tab.',verificationRequired:true});
      const cleanup=()=>{host.innerHTML='';host.remove();};
      const timer=setTimeout(()=>{cleanup();reject(new Error('Aniidx verification timed out.'));},120000);
      const finish=fn=>value=>{clearTimeout(timer);cleanup();fn(value);};
      try{
        window.turnstile.render(host,{
          sitekey:siteKey,
          appearance:'interaction-only',
          size:'normal',
          theme:document.documentElement.dataset.theme==='dark'?'dark':'light',
          retry:'auto',
          'refresh-expired':'never',
          callback:finish(resolve),
          'error-callback':finish(()=>reject(new Error('Aniidx verification failed.'))),
          'timeout-callback':finish(()=>reject(new Error('Aniidx verification timed out.')))
        });
      }catch(err){finish(reject)(err);}
    });
  }

  async function ensurePass(requestId){
    const pass=await jsonFetch('/api/player/pass',{cache:'no-store'});
    if(pass.ok||!pass.siteKey)return true;
    await loadTurnstile();
    const token=await runTurnstile(pass.siteKey,requestId);
    await jsonFetch('/api/player/pass',{
      method:'POST',
      headers:{'Content-Type':'application/json','X-Aniidex-Request':'1','Accept':'application/json'},
      body:JSON.stringify({token})
    });
    return true;
  }

  async function syncUid(uid,requestId){
    if(!/^[1-9]\d{7,15}$/.test(uid))throw new Error('Invalid Aniimo UID.');
    emit('ANIIMO_PAGE_STATUS',{requestId,message:'Authorizing with Aniidx…'});
    await ensurePass(requestId);
    emit('ANIIMO_PAGE_STATUS',{requestId,message:'Loading player profile…'});
    const profile=await jsonFetch('/api/player/'+encodeURIComponent(uid),{headers:{Accept:'application/json'}});
    await ensurePass(requestId);
    emit('ANIIMO_PAGE_STATUS',{requestId,message:'Importing live Homeland snapshot…'});
    const homeland=await jsonFetch('/api/player/home-import',{
      method:'POST',
      headers:{Accept:'application/json','Content-Type':'application/json','X-Aniidex-Request':'1'},
      body:JSON.stringify({uid})
    });
    return {
      format:'aniimo-homeland-sync-v4',
      capturedAt:new Date().toISOString(),
      source:'aniidex.com companion',
      uid,
      profile,
      homeland,
      warnings:[]
    };
  }

  window.addEventListener('message',event=>{
    if(event.source!==window||event.origin!==location.origin)return;
    const msg=event.data||{};
    if(msg.channel!==CONTROL||msg.type!=='ANIIMO_RUN_SYNC')return;
    const requestId=String(msg.requestId||'');
    const uid=String(msg.uid||'').trim();
    syncUid(uid,requestId).then(bundle=>{
      emit('ANIIMO_PAGE_RESULT',{requestId,ok:true,bundle});
    }).catch(err=>{
      const status=err?.status;
      const hint=status===404?'Aniidx lookup is unavailable. Make sure you are signed in to Aniidx, then try again.':(err?.message||String(err));
      emit('ANIIMO_PAGE_RESULT',{requestId,ok:false,error:hint});
    });
  });
})();
