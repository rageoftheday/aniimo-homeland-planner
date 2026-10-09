/* Public feedback page. All secrets and access decisions stay in Cloudflare Worker. */
(()=>{
 const root=()=>document.getElementById('feedbackPane');
 const api=()=>String(window.PLANNER_SUGGESTIONS_API||'').replace(/\/$/,'');
 const turnstileKey=()=>String(window.PLANNER_TURNSTILE_SITE_KEY||'');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let rows=[],loaded=false,error='',adminMode=false,busy=false,notice='';
 const get=async(path,options={})=>{
   const response=await fetch(api()+path,{...options,credentials:path.startsWith('/api/admin/')?'include':'omit',headers:{'Content-Type':'application/json',...(options.headers||{})}});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.error||'Request failed ('+response.status+')');
   return data;
 };
 async function refresh(){
   if(!api())return;
   try{const d=await get('/api/suggestions');rows=d.suggestions||[];loaded=true;error='';render();}
   catch(e){error=e.message;loaded=true;render();}
 }
 const card=x=>'<article class="feedbackCard"><div class="feedbackCardTop"><b>'+esc(x.title)+'</b><span class="feedbackStatus">'+esc(x.status||'New')+'</span></div><small>'+esc(x.category||'Suggestion')+' · '+esc(x.author||'Guest')+' · '+new Date(x.created_at).toLocaleDateString()+'</small><p>'+esc(x.body)+'</p>'+(x.comments||[]).map(c=>'<div class="feedbackComment"><b>'+esc(c.author||'Guest')+':</b> '+esc(c.body)+'</div>').join('')+(!x.locked?'<form data-comment="'+Number(x.id)+'"><input name="author" maxlength="60" placeholder="Name (optional)"><input name="body" maxlength="1000" required placeholder="Add a comment (reviewed before display)"><input name="website" class="feedbackHoneypot" tabindex="-1" autocomplete="off"><div class="feedbackCaptcha"></div><button type="submit">Comment</button></form>':'<small>Discussion locked</small>')+'</article>';
 function render(){
  const el=root();if(!el)return;
  const unavailable=!api()||!turnstileKey();
  el.innerHTML='<div class="feedbackWrap"><div class="v30Title">Suggestions & Feedback</div><p class="small">Suggest a feature, report a bug, or discuss improvements. Guest posts and comments are reviewed before appearing publicly.</p>'+ (unavailable?'<div class="feedbackNotice">Public submissions are not yet enabled. The site owner must configure the secure feedback service and spam protection first.</div>':'') +'<div class="feedbackToolbar"><button id="feedbackPublic" '+(!adminMode?'class="primary"':'')+'>Community suggestions</button><button id="feedbackAdmin" '+(adminMode?'class="primary"':'')+'>Admin sign-in / moderation</button></div>'+ (error?'<div class="feedbackNotice" role="alert">'+esc(error)+'</div>':'') + (adminMode?'<p class="small">Administrator authentication is handled by Cloudflare Access, never by a password stored in this site.</p><p><a href="'+esc(api())+'/admin" target="_blank" rel="noopener noreferrer">Open secure admin sign-in and moderation console ↗</a></p><p class="small">Moderation is available only in the secure Cloudflare-hosted administrator console.</p>':'<form id="feedbackSubmit"><h3>Post a suggestion</h3><input name="author" placeholder="Display name (optional)" maxlength="60"><select name="category"><option>Feature</option><option>Bug</option><option>Data correction</option><option>Other</option></select><input name="title" placeholder="Title" maxlength="120" required><textarea name="body" placeholder="Describe your idea or bug…" maxlength="4000" rows="5" required></textarea><input name="website" class="feedbackHoneypot" tabindex="-1" autocomplete="off"><div id="feedbackCaptcha"></div><button type="submit" '+(unavailable||busy?'disabled':'')+'>Submit for review</button><span id="feedbackMessage" role="status"></span></form><h3>Community ideas</h3>'+(!loaded?'<p>Loading suggestions…</p>':rows.length?rows.map(card).join(''):'<p class="small">No approved suggestions yet.</p>'))+'</div>';
  el.querySelector('#feedbackPublic')?.addEventListener('click',()=>{adminMode=false;render();});
  el.querySelector('#feedbackAdmin')?.addEventListener('click',()=>{adminMode=true;render();});
  el.querySelector('#feedbackSubmit')?.addEventListener('submit',submit);
  el.querySelectorAll('form[data-comment]').forEach(f=>f.addEventListener('submit',submit));
  if(!adminMode&&!unavailable&&window.turnstile){el.querySelectorAll('#feedbackCaptcha, .feedbackCaptcha').forEach(e=>{e.dataset.widgetId=String(window.turnstile.render(e,{sitekey:turnstileKey()}));});}
 }
 async function submit(event){
  event.preventDefault();const form=event.currentTarget,commentId=form.dataset.comment;
  if(busy)return;busy=true;notice='';
  const fd=new FormData(form);const widget=form.querySelector('.feedbackCaptcha, #feedbackCaptcha');const token=widget?.dataset.widgetId?window.turnstile?.getResponse?.(widget.dataset.widgetId)||'':'';
  const payload=Object.fromEntries(fd.entries());payload.turnstileToken=token;
  const messageNode=()=>form.querySelector('.feedbackMessage');
  try{
   await get(commentId?'/api/suggestions/'+commentId+'/comments':'/api/suggestions',{method:'POST',body:JSON.stringify(payload)});
   notice=commentId?'Comment submitted for review.':'Suggestion submitted for review. Thank you!';
   busy=false;
   await refresh();
  }catch(e){
   const node=messageNode();if(node){node.textContent='Could not submit: '+e.message;node.classList.add('feedbackError');}
   busy=false;
  }
 }
 window.PlannerSuggestions={render:()=>{render();if(!loaded&&api())refresh();}};
})();