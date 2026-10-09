import {createRemoteJWKSet,jwtVerify} from 'jose';

// Required Worker secrets/vars: TURNSTILE_SECRET, ACCESS_TEAM_DOMAIN,
// ACCESS_AUD, ADMIN_EMAIL, HASH_SALT, SITE_ORIGIN; D1 binding DB.
const json=(obj,status=200,origin='')=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin',...(origin?{'Access-Control-Allow-Origin':origin}:{})}});
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
export default {async fetch(req,env){
 const url=new URL(req.url);
 const allowed=env.SITE_ORIGIN||'';
 const origin=req.headers.get('Origin')||'';
 const cors=origin===allowed?origin:'';
 if(req.method==='OPTIONS'){
   if(!cors)return fail('Forbidden origin',403);
   return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':cors,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET, POST, PATCH, DELETE, OPTIONS','Vary':'Origin'}});
 }
 if(!env.DB||!env.SITE_ORIGIN||!env.HASH_SALT)return fail('Service not configured',503,cors);
 if(origin&&origin!==allowed)return fail('Forbidden origin',403);
 const path=url.pathname;
 try{
   if(path==='/api/suggestions'&&req.method==='GET')return json(await listPublic(env),200,cors);
   // Admin endpoints always require a cryptographically verified Access JWT + explicit owner identity.
   if(path.startsWith('/api/admin/')){
     if(!await adminAuthorized(req,env))return fail('Admin sign-in required',401,cors);
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
