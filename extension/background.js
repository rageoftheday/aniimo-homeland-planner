const pending=new Map();

function sendPlanner(tabId,message){
  if(tabId==null)return;
  chrome.tabs.sendMessage(tabId,message).catch(()=>{});
}

function waitForComplete(tabId,timeoutMs=15000){
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{chrome.tabs.onUpdated.removeListener(onUpdated);reject(new Error('Aniidx tab did not finish loading.'));},timeoutMs);
    function done(){clearTimeout(timer);chrome.tabs.onUpdated.removeListener(onUpdated);resolve();}
    function onUpdated(id,info){if(id===tabId&&info.status==='complete')done();}
    chrome.tabs.get(tabId).then(tab=>{if(tab.status==='complete')done();else chrome.tabs.onUpdated.addListener(onUpdated);}).catch(reject);
  });
}

async function getAniidexTab(){
  const tabs=await chrome.tabs.query({url:['https://aniidex.com/*']});
  if(tabs.length)return tabs[0];
  return await chrome.tabs.create({url:'https://aniidex.com/homeland/',active:false});
}

chrome.runtime.onMessage.addListener((msg,sender,sendResponse)=>{
  if(!msg||typeof msg!=='object')return;
  if(msg.type==='ANIIMO_SYNC_REQUEST'){
    const plannerTabId=sender.tab?.id;
    const uid=String(msg.uid||'').trim();
    const requestId=crypto.randomUUID();
    pending.set(requestId,{plannerTabId});
    sendPlanner(plannerTabId,{type:'ANIIMO_SYNC_STATUS',message:'Opening Aniidx connection…'});
    (async()=>{
      try{
        const tab=await getAniidexTab();
        await waitForComplete(tab.id);
        await chrome.tabs.sendMessage(tab.id,{type:'ANIIMO_SYNC_UID',uid,requestId});
      }catch(err){
        sendPlanner(plannerTabId,{type:'ANIIMO_SYNC_RESULT',ok:false,error:err?.message||String(err)});
        pending.delete(requestId);
      }
    })();
    sendResponse({ok:true,requestId});
    return true;
  }
  if(msg.type==='ANIIMO_SYNC_STATUS'&&msg.requestId){
    const p=pending.get(msg.requestId);if(!p)return;
    sendPlanner(p.plannerTabId,{type:'ANIIMO_SYNC_STATUS',message:msg.message,error:!!msg.error});
    if(msg.verificationRequired&&sender.tab?.id!=null){
      chrome.tabs.update(sender.tab.id,{active:true}).then(tab=>{
        if(tab.windowId!=null)chrome.windows.update(tab.windowId,{focused:true}).catch(()=>{});
      }).catch(()=>{});
    }
    return;
  }
  if(msg.type==='ANIIMO_SYNC_RESULT'&&msg.requestId){
    const p=pending.get(msg.requestId);if(!p)return;
    sendPlanner(p.plannerTabId,{type:'ANIIMO_SYNC_RESULT',ok:!!msg.ok,bundle:msg.bundle,error:msg.error});
    pending.delete(msg.requestId);
  }
});
