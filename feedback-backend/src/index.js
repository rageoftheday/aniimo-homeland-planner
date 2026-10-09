import {createRemoteJWKSet,jwtVerify} from 'jose';

// Required Worker secrets/vars: TURNSTILE_SECRET, ACCESS_TEAM_DOMAIN,
// ACCESS_AUD, ADMIN_EMAIL, HASH_SALT, SITE_ORIGIN; D1 binding DB.
const json=(obj,status=200,origin='')=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin',...(origin?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true'}:{})}});
const fail=(message,status=400,origin='')=>json({error:message},status,origin);
const text=(value,max)=>String(value??'').trim().slice(0,max);
const isValid=(s,min,max)=>s.length>=min&&s.length<=max;
const statuses=['Pending','New','Under Review','Planned','In Progress','Completed','Declined'];
const limitBody=async req=>{if(Number(req.headers.get('content-length')||0)>12000)throw Error('Submission too large');const raw=await req.text();if(raw.length>12000)throw Error('Submission too large');return JSON.parse(raw)};
const sha=async(s)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
async function adminAuthorized(req,env){
 const token=req.headers.get('Cf-Access-Jwt-Assertion');
 if(!token||!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD||!env.ADMIN_EMAIL)return false;
 // Never trust an email header or an unverified JWT: verify JWT signature, audience and issuer.
 const issuer='https://'+env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//,'').replace(/\/$/,'');
 const keys=createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs'));
 try{const result=await jwtVerify(token,keys,{issuer,audience:env.ACCESS_AUD,algorithms:['RS256']});
   return String(result.payload.email||'').toLowerCase()===env.ADMIN_EMAIL.toLowerCase();
 }catch{return false;}
}
async function captcha(token,req,env){
 if(!token||!env.TURNSTILE_SECRET)return false;
 const f=new FormData();f.set('secret',env.TURNSTILE_SECRET);f.set('response',token);
 const ip=req.headers.get('CF-Connecting-IP');if(ip)f.set('remoteip',ip);
 const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:f});
 const data=await res.json();return data.success===true&&(!env.TURNSTILE_HOSTNAME||data.hostname===env.TURNSTILE_HOSTNAME);
}
async function allowSubmission(req,env){
 const ip=req.headers.get('CF-Connecting-IP')||'unknown';
 const key=await sha(ip+':'+env.HASH_SALT);
 const now=Math.floor(Date.now()/1000);
 // Fixed-window limit: 3 submissions/hour per hashed IP. Turnstile still required.
 const q=await env.DB.prepare('SELECT COUNT(*) AS count FROM submission_limits WHERE ip_hash=? AND created_at>?').bind(key,now-3600).first();
 if(Number(q?.count||0)>=3)return false;
 await env.DB.prepare('INSERT INTO submission_limits(ip_hash,created_at) VALUES (?,?)').bind(key,now).run();
 return true;
}
async function listPublic(env){
 const {results:rows}=await env.DB.prepare("SELECT id,author,category,title,body,status,locked,created_at FROM suggestions WHERE status!='Pending' ORDER BY id DESC LIMIT 100").all();
 const {results:comments}=await env.DB.prepare('SELECT id,suggestion_id,author,body,created_at FROM comments WHERE approved=1 ORDER BY id ASC LIMIT 500').all();
 return {suggestions:rows.map(x=>({...x,comments:comments.filter(c=>c.suggestion_id===x.id)}))};
}
async function listAdmin(env){
 const {results:rows}=await env.DB.prepare('SELECT * FROM suggestions ORDER BY id DESC LIMIT 150').all();
 const {results:comments}=await env.DB.prepare('SELECT * FROM comments ORDER BY id ASC LIMIT 700').all();
 return {suggestions:rows.map(x=>({...x,comments:comments.filter(c=>c.suggestion_id===x.id)}))};
}
function adminHtml(){
 // Serve this ONLY after the verified Cloudflare Access JWT gate below.
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Aniimo Feedback Admin</title><style>body{font:15px system-ui;background:#101c27;color:#e5f4ff;max-width:960px;margin:28px auto;padding:0 16px}article{background:#192b39;padding:18px;border:1px solid #456178;border-radius:12px;margin:14px 0}button,select{padding:8px;margin:4px;background:#29465b;border:1px solid #6c90a4;color:white;border-radius:6px;cursor:pointer}button.danger{background:#813943}p{white-space:pre-wrap}small{color:#bacdd9} .comment{background:#263b4c;padding:9px;margin:7px 0}</style></head><body><h1>Aniimo Suggestions — Admin</h1><p>Cloudflare Access authenticated. Review pending submissions and moderate published items.</p><button id="reload">Reload</button><p id="status" role="status"></p><div id="list"></div><script>
const list=document.getElementById('list'),status=document.getElementById('status');
const make=(t,txt)=>{let n=document.createElement(t);n.textContent=txt;return n};
const request=async(path,method='GET',data)=>{let r=await fetch(path,{method,headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});let j=await r.json();if(!r.ok)throw Error(j.error||r.status);return j};
async function action(path,method,data){try{await request(path,method,data);await reload()}catch(e){status.textContent=e.message}}
async function reload(){try{status.textContent='Loading…';let data=await request('/api/admin/suggestions');list.replaceChildren();for(let x of data.suggestions){let article=make('article','');article.append(make('h3',x.title+' (#'+x.id+')'),make('small',x.author+' | '+x.category+' | '+x.created_at),make('p',x.body));let select=make('select','');for(let v of ['Pending','New','Under Review','Planned','In Progress','Completed','Declined']){let o=make('option',v);o.value=v;o.selected=x.status===v;select.append(o)}select.addEventListener('change',()=>action('/api/admin/suggestions/'+x.id,'PATCH',{status:select.value}));article.append(select);let lock=make('button',x.locked?'Unlock':'Lock');lock.onclick=()=>action('/api/admin/suggestions/'+x.id,'PATCH',{locked:!x.locked});article.append(lock);let del=make('button','Delete suggestion');del.className='danger';del.onclick=()=>{if(confirm('Delete suggestion and ALL its comments?'))action('/api/admin/suggestions/'+x.id,'DELETE')};article.append(del);for(let c of x.comments){let div=make('div',c.author+': '+c.body+(c.approved?' (approved)':' (pending)'));div.className='comment';let approve=make('button',c.approved?'Hide':'Approve');approve.onclick=()=>action('/api/admin/comments/'+c.id,'PATCH',{approved:!c.approved});let remove=make('button','Delete');remove.className='danger';remove.onclick=()=>{if(confirm('Delete this comment?'))action('/api/admin/comments/'+c.id,'DELETE')};div.append(approve,remove);article.append(div)}list.append(article)}status.textContent=data.suggestions.length+' suggestions loaded.'}catch(e){status.textContent='Error: '+e.message}}
document.getElementById('reload').onclick=reload;reload();
<\/script></body></html>`;
}
export default {async fetch(req,env){
 const url=new URL(req.url);
 const allowed=env.SITE_ORIGIN||'';
 const origin=req.headers.get('Origin')||'';
 const cors=origin===allowed?origin:'';
 if(req.method==='OPTIONS'){
   if(!cors)return fail('Forbidden origin',403);
   return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':cors,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET, POST, PATCH, DELETE, OPTIONS','Vary':'Origin'}});
 }
 if(!env.DB||!env.SITE_ORIGIN||!env.HASH_SALT)return fail('Service not configured',503,cors);
 // The public planner is cross-origin; the authenticated admin console is served from this Worker.
 const isAdminRoute=url.pathname==='/admin'||url.pathname.startsWith('/api/admin/');
 if(origin&&origin!==allowed&&!(isAdminRoute&&origin===url.origin))return fail('Forbidden origin',403);
 // Mutating admin requests must originate from our own admin console, preventing cross-site form requests.
 if(url.pathname.startsWith('/api/admin/')&&['PATCH','POST','DELETE'].includes(req.method)&&origin!==url.origin)return fail('Admin origin required',403);
 const path=url.pathname;
 try{
   if(path==='/api/visitors'&&req.method==='POST'){
     if(!cors)return fail('Origin required',403,cors);
     const day=new Date().toISOString().slice(0,10);
     const ip=req.headers.get('CF-Connecting-IP')||'unknown';
     // Salt rotates by calendar day. A visitor cannot be linked across days.
     const fingerprint=await sha(day+':'+ip+':'+env.HASH_SALT);
     await env.DB.prepare('INSERT OR IGNORE INTO visitor_daily(day,fingerprint) VALUES (?,?)').bind(day,fingerprint).run();
     await env.DB.prepare('INSERT INTO visitor_hits(day,hits) VALUES (?,1) ON CONFLICT(day) DO UPDATE SET hits=hits+1').bind(day).run();
     const today=await env.DB.prepare('SELECT COUNT(*) AS count FROM visitor_daily WHERE day=?').bind(day).first();
     const total=await env.DB.prepare('SELECT COUNT(*) AS count FROM visitor_daily').first();
     const hits=await env.DB.prepare('SELECT COALESCE(SUM(hits),0) AS count FROM visitor_hits').first();
     return json({uniqueToday:Number(today?.count||0),uniqueVisitorDays:Number(total?.count||0),totalPageViews:Number(hits?.count||0)},200,cors);
   }
   if(path==='/api/suggestions'&&req.method==='GET')return json(await listPublic(env),200,cors);
   // Admin endpoints always require a cryptographically verified Access JWT + explicit owner identity.
   if(path==='/admin'||path.startsWith('/api/admin/')){
     if(!await adminAuthorized(req,env))return fail('Admin sign-in required',401,cors);
     if(path==='/admin'&&req.method==='GET')return new Response(adminHtml(),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
     if(path==='/api/admin/suggestions'&&req.method==='GET')return json(await listAdmin(env),200,cors);
     const suggestion=path.match(/^\/api\/admin\/suggestions\/(\d+)$/);
     const comment=path.match(/^\/api\/admin\/comments\/(\d+)$/);
     if(!suggestion&&!comment)return fail('Not found',404,cors);
     const id=Number((suggestion||comment)[1]);
     if(req.method==='DELETE'){
       if(suggestion)await env.DB.prepare('DELETE FROM comments WHERE suggestion_id=?').bind(id).run();
       await env.DB.prepare(suggestion?'DELETE FROM suggestions WHERE id=?':'DELETE FROM comments WHERE id=?').bind(id).run();
       return json({ok:true},200,cors);
     }
     if(req.method!=='PATCH')return fail('Method not allowed',405,cors);
     const data=await limitBody(req);
     if(suggestion){
       if(data.status!=null&&!statuses.includes(data.status))return fail('Invalid status',400,cors);
       if(data.status!=null)await env.DB.prepare('UPDATE suggestions SET status=? WHERE id=?').bind(data.status,id).run();
       if(typeof data.locked==='boolean')await env.DB.prepare('UPDATE suggestions SET locked=? WHERE id=?').bind(data.locked?1:0,id).run();
     }else{
       if(typeof data.approved!=='boolean')return fail('Invalid moderation action',400,cors);
       await env.DB.prepare('UPDATE comments SET approved=? WHERE id=?').bind(data.approved?1:0,id).run();
     }
     return json({ok:true},200,cors);
   }
   if(req.method==='POST'&&(path==='/api/suggestions'||/^\/api\/suggestions\/\d+\/comments$/.test(path))){
     if(!cors)return fail('Origin required',403);
     const data=await limitBody(req);
     if(text(data.website,80))return json({ok:true},202,cors); // Honeypot
     if(!await captcha(text(data.turnstileToken,4096),req,env))return fail('Spam verification failed',403,cors);
     const author=text(data.author,60)||'Guest';
     const body=text(data.body,4000);
     if(!isValid(body,5,4000))return fail('Description must be 5–4000 characters',400,cors);
     if(!await allowSubmission(req,env))return fail('Rate limit reached. Try again later.',429,cors);
     if(path==='/api/suggestions'){
       const title=text(data.title,120),category=text(data.category,30);
       if(!isValid(title,3,120)||!['Feature','Bug','Data correction','Other'].includes(category))return fail('Invalid suggestion',400,cors);
       await env.DB.prepare('INSERT INTO suggestions(author,category,title,body) VALUES (?,?,?,?)').bind(author,category,title,body).run();
     }else{
       const id=Number(path.match(/\d+/)[0]);
       const item=await env.DB.prepare("SELECT id FROM suggestions WHERE id=? AND locked=0 AND status!='Pending'").bind(id).first();
       if(!item)return fail('Discussion is unavailable',404,cors);
       await env.DB.prepare('INSERT INTO comments(suggestion_id,author,body) VALUES (?,?,?)').bind(id,author,body).run();
     }
     return json({ok:true,pending:true},202,cors);
   }
   return fail('Not found',404,cors);
 }catch(e){console.error('feedback error',e?.message||'unknown');return fail('Unable to complete request',500,cors);}
}};
