let aniimoPageReady=false;
let aniimoPageReadyWaiters=[];

function resolveAniimoPageReady(){
  if(aniimoPageReady)return;
  aniimoPageReady=true;
  const waiters=aniimoPageReadyWaiters.splice(0);
  for(const fn of waiters)fn();
}

function waitForAniimoPageReady(timeoutMs=15000){
  if(aniimoPageReady)return Promise.resolve();
  window.postMessage({
    channel:'aniimo-homeland-companion-control',
    type:'ANIIMO_PAGE_PING'
  },location.origin);
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{
      aniimoPageReadyWaiters=aniimoPageReadyWaiters.filter(fn=>fn!==done);
      reject(new Error('Aniidx sync helper did not become ready in time.'));
    },timeoutMs);
    function done(){clearTimeout(timer);resolve();}
    aniimoPageReadyWaiters.push(done);
  });
}

window.addEventListener('message',event=>{
  if(event.source!==window||event.origin!==location.origin)return;
  const msg=event.data||{};
  if(msg.channel!=='aniimo-homeland-companion-page')return;
  if(msg.type==='ANIIMO_PAGE_READY'){
    resolveAniimoPageReady();
    return;
  }
  if(msg.type==='ANIIMO_PAGE_STATUS'){
    chrome.runtime.sendMessage({
      type:'ANIIMO_SYNC_STATUS',
      requestId:msg.requestId,
      message:msg.message,
      error:!!msg.error,
      verificationRequired:!!msg.verificationRequired
    }).catch(()=>{});
  }
  if(msg.type==='ANIIMO_PAGE_RESULT'){
    chrome.runtime.sendMessage({
      type:'ANIIMO_SYNC_RESULT',
      requestId:msg.requestId,
      ok:!!msg.ok,
      bundle:msg.bundle,
      error:msg.error
    }).catch(()=>{});
  }
});

chrome.runtime.onMessage.addListener((msg,sender,sendResponse)=>{
  if(msg?.type!=='ANIIMO_SYNC_UID')return;
  (async()=>{
    try{
      await waitForAniimoPageReady();
      window.postMessage({
        channel:'aniimo-homeland-companion-control',
        type:'ANIIMO_RUN_SYNC',
        requestId:msg.requestId,
        uid:msg.uid
      },location.origin);
      sendResponse({ok:true});
    }catch(err){
      sendResponse({ok:false,error:err?.message||String(err)});
    }
  })();
  return true;
});
