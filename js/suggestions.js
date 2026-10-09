/* Public feedback page. All secrets and access decisions stay in Cloudflare Worker. */
(()=>{
 const root=()=>document.getElementById('feedbackPane');
 const api=()=>String(window.PLANNER_SUGGESTIONS_API||'').replace(/\/$/,'');
 const turnstileKey=()=>String(window.PLANNER_TURNSTILE_SITE_KEY||'');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let rows=[],loaded=false,error='',adminMode=false,adminRows=[],busy=false;
 const get=async(path,options={})=>{
   const response=await fetch(api()+path,{...options,credentials:'omit',headers:{'Content-Type':'application/json',...(options.headers||{})}});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.error||'Request failed ('+response.status+')');
   return data;
 };
 async function refresh(){
   if(!api())return;
   try{const d=await get('/api/suggestions');rows=d.suggestions||[];loaded=true;error='';render();}
   catch(e){error=e.message;loaded=true;render();}
 }
 async function loadAdmin(){try{const d=await get('/api/admin/suggestions');adminRows=d.suggestions||[];error='';render();}catch(e){error=e.message;render();}}
 const card=x=>'<article class="feedbackCard"><div class="feedbackCardTop"><b>'+esc(x.title)+'</b><span class="feedbackStatus">'+esc(x.status||'New')+'</span></div><small>'+esc(x.category||'Suggestion')+' · '+esc(x.author||'Guest')+' · '+new Date(x.created_at).toLocaleDateString()+'</small><p>'+esc(x.body)+'</p>'+(x.comments||[]).map(c=>'<div class="feedbackComment"><b>'+esc(c.author||'Guest')+':</b> '+esc(c.body)+'</div>').join('')+(!x.locked?'<form data-comment="'+Number(x.id)+'"><input name="author" maxlength="60" placeholder="Name (optional)"><input name="body" maxlength="1000" required placeholder="Add a comment (reviewed before display)"><input name="website" class="feedbackHoneypot" tabindex="-1" autocomplete="off"><button type="submit">Comment</button></form>':'<small>Discussion locked</small>')+'</article>';
 const adminCard=x=>'<article class="feedbackCard"><b>'+esc(x.title)+'</b> <small>#'+Number(x.id)+' · '+esc(x.author)+' · '+esc(x.status)+'</small><p>'+esc(x.body)+'</p><div class="feedbackControls"><select data-status="'+Number(x.id)+'">'+['Pending','New','Under Review','Planned','In Progress','Completed','Declined'].map(q=>'<option'+(q===x.status?' selected':'')+'>'+q+'</option>').join('')+'</select><button data-approve="'+Number(x.id)+'">Approve</button><button data-lock="'+Number(x.id)+'">'+(x.locked?'Unlock':'Lock')+'</button><button class="danger" data-delete="'+Number(x.id)+'">Delete</button></div>'+(x.comments||[]).map(c=>'<div class="feedbackComment">'+esc(c.author)+': '+esc(c.body)+' <button data-comment-approve="'+Number(c.id)+'">Approve</button> <button class="danger" data-comment-delete="'+Number(c.id)+'">Delete</button></div>').join('')+'</article>';
 function render(){
  const el=root();if(!el)return;
  const unavailable=!api()||!turnstileKey();
  el.innerHTML='<div class="feedbackWrap"><div class="v30Title">Suggestions & Feedback</div><p class="small">Suggest a feature, report a bug, or discuss improvements. Guest posts and comments are reviewed before appearing publicly.</p>'+ (unavailable?'<div class="feedbackNotice">Public submissions are not yet enabled. The site owner must configure the secure feedback service and spam protection first.</div>':'') +'<div class="feedbackToolbar"><button id="feedbackPublic" '+(!adminMode?'class="primary"':'')+'>Community suggestions</button><button id="feedbackAdmin" '+(adminMode?'class="primary"':'')+'>Admin sign-in / moderation</button></div>'+ (error?'<div class="feedbackNotice" role="alert">'+esc(error)+'</div>':'') + (adminMode?'<p class="small">Administrator authentication is handled by Cloudflare Access, never by a password stored in this site.</p><button id="feedbackReload">Reload moderation queue</button>'+adminRows.map(adminCard).join(''):'<form id="feedbackSubmit"><h3>Post a suggestion</h3><input name="author" placeholder="Display name (optional)" maxlength="60"><select name="category"><option>Feature</option><option>Bug</option><option>Data correction</option><option>Other</option></select><input name="title" placeholder="Title" maxlength="120" required><textarea name="body" placeholder="Describe your idea or bug…" maxlength="4000" rows="5" required></textarea><input name="website" class="feedbackHoneypot" tabindex="-1" autocomplete="off"><div id="feedbackCaptcha"></div><button type="submit" '+(unavailable||busy?'disabled':'')+'>Submit for review</button><span id="feedbackMessage" role="status"></span></form><h3>Community ideas</h3>'+(!loaded?'<p>Loading suggestions…</p>':rows.length?rows.map(card).join(''):'<p class="small">No approved suggestions yet.</p>'))+'</div>';
  el.querySelector('#feedbackPublic')?.addEventListener('click',()=>{adminMode=false;render();});
  el.querySelector('#feedbackAdmin')?.addEventListener('click',()=>{adminMode=true;render();loadAdmin();});
  el.querySelector('#feedbackReload')?.addEventListener('click',loadAdmin);
  el.querySelector('#feedbackSubmit')?.addEventListener('submit',submit);
  el.querySelectorAll('form[data-comment]').forEach(f=>f.addEventListener('submit',submit));
  el.querySelectorAll('[data-status]').forEach(e=>e.addEventListener('change',()=>moderate('/api/admin/suggestions/'+e.dataset.status,{status:e.value})));
  el.querySelectorAll('[data-approve]').forEach(e=>e.addEventListener('click',()=>moderate('/api/admin/suggestions/'+e.dataset.approve,{status:'New'})));
  el.querySelectorAll('[data-lock]').forEach(e=>e.addEventListener('click',()=>moderate('/api/admin/suggestions/'+e.dataset.lock,{locked:e.textContent==='Lock'})));
  el.querySelectorAll('[data-delete]').forEach(e=>e.addEventListener('click',()=>{if(confirm('Permanently delete this suggestion and its comments?'))moderate('/api/admin/suggestions/'+e.dataset.delete,null,'DELETE')}));
  el.querySelectorAll('[data-comment-approve]').forEach(e=>e.addEventListener('click',()=>moderate('/api/admin/comments/'+e.dataset.commentApprove,{approved:true})));
  el.querySelectorAll('[data-comment-delete]').forEach(e=>e.addEventListener('click',()=>{if(confirm('Delete comment?'))moderate('/api/admin/comments/'+e.dataset.commentDelete,null,'DELETE')}));
  if(!adminMode&&!unavailable&&window.turnstile){el.querySelectorAll('#feedbackCaptcha').forEach(e=>window.turnstile.render(e,{sitekey:turnstileKey()}));}
 }
 async function moderate(path,data,method='PATCH'){try{await get(path,{method,body:data?JSON.stringify(data):undefined});await loadAdmin();}catch(e){error=e.message;render();}}
 async function submit(event){
  event.preventDefault();const form=event.currentTarget,commentId=form.dataset.comment;
  if(busy)return;busy=true;
  const fd=new FormData(form);const token=window.turnstile?.getResponse?.(form.querySelector('.cf-turnstile')||undefined)||'';
  const payload=Object.fromEntries(fd.entries());payload.turnstileToken=token;
  try{await get(commentId?'/api/suggestions/'+commentId+'/comments':'/api/suggestions',{method:'POST',body:JSON.stringify(payload)});alert('Submitted for review. Thank you!');await refresh();}
  catch(e){alert('Could not submit: '+e.message);}finally{busy=false;render();}
 }
 window.PlannerSuggestions={render:()=>{render();if(!loaded&&api())refresh();}};
})();