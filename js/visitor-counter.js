/* Count one page load (not in-app tab switches) and display aggregate visitor stats. */
(()=>{
  const endpoint=String(window.PLANNER_SUGGESTIONS_API||'').replace(/\/$/,'');
  if(!endpoint)return;
  const panel=document.createElement('div');
  panel.id='plannerVisitorCounter';
  panel.setAttribute('aria-label','Planner visitor statistics');
  panel.style.cssText='font-size:11px;color:#a9bdcd;display:flex;gap:12px;flex-wrap:wrap;align-items:center;padding:7px 10px;border:1px solid #38546a;border-radius:9px;margin:5px 0';
  panel.textContent='Visitors: loading…';
  const target=document.querySelector('header .headerActions')||document.querySelector('header');
  if(!target)return;
  target.appendChild(panel);
  fetch(endpoint+'/api/visitors',{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json'}})
    .then(async response=>{if(!response.ok)throw Error('counter unavailable');return response.json()})
    .then(data=>{
      const format=n=>Number.isFinite(Number(n))?Number(n).toLocaleString():'—';
      panel.textContent='Page views: '+format(data.totalPageViews)+'  ·  Today’s visitors: '+format(data.uniqueToday)+'  ·  Visitor-days: '+format(data.uniqueVisitorDays);
      panel.title='Approximate unique visitors per UTC day; visitor-days count repeat visitors on different days. No raw IPs are stored.';
    })
    .catch(()=>{panel.textContent='Visitor stats unavailable';});
})();
