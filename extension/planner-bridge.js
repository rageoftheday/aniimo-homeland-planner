function postToPage(payload){
  window.postMessage({channel:'aniimo-homeland-companion',...payload},location.origin);
}

postToPage({type:'ANIIMO_COMPANION_READY'});

window.addEventListener('message',event=>{
  if(event.source!==window||event.origin!==location.origin)return;
  const msg=event.data||{};
  if(msg.channel!=='aniimo-homeland-planner')return;
  if(msg.type==='ANIIMO_COMPANION_PING'){
    postToPage({type:'ANIIMO_COMPANION_READY'});
    return;
  }
  if(msg.type==='ANIIMO_SYNC_REQUEST'){
    chrome.runtime.sendMessage({type:'ANIIMO_SYNC_REQUEST',uid:msg.uid}).catch(err=>{
      postToPage({type:'ANIIMO_SYNC_RESULT',ok:false,error:err?.message||String(err)});
    });
  }
});

chrome.runtime.onMessage.addListener(msg=>{
  if(msg?.type==='ANIIMO_SYNC_STATUS')postToPage(msg);
  if(msg?.type==='ANIIMO_SYNC_RESULT')postToPage(msg);
});
