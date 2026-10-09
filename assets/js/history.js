// history.js (v2.21-E2): история обслуживания клиента по телефону или госномеру. Общий модуль для staff.html и admin.html.
// Данные приходят действием client_history (права проверяет сервер). Здесь только форма поиска и вывод; все тексты из i18n.js.
// Комментарии с кириллицей только через // (правило D3).
const ClientHist=(()=>{
 const svc=r=>(L==='kk'?r.service_kk:r.service_ru)||r.service_ru||r.service_kk||'';
 const car=r=>[r.brand,r.model,r.year,r.plate].filter(Boolean).join(' ');
 const ERR={ERR_FORBIDDEN:'err.forbidden',ERR_BAD:'hist.short',ERR_SERVER:'err.server'};
 const errText=c=>t(ERR[c]||'err.net');
 function line(r,money){
  if(r.type==='booking')return `<div class="ch-i bk"><div class="ch-h"><b>${esc(fmtDate(r.date))}${r.time?' '+esc(fmtTime(r.time)):''}</b><span class="ch">${t('hist.booking')}</span><span class="ch ${r.status==='cancel'?'':'hl'}">${t('st.'+r.status)}</span></div>
   <div>${esc(svc(r))}</div><small>${esc([r.point,car(r),r.comment].filter(Boolean).join(' · '))}</small></div>`;
  const its=(r.items||[]).map(x=>esc(x.name)+' × '+esc(fmtNum(x.qty))).join(', ');
  return `<div class="ch-i sl ${r.status==='void'?'vd':''}"><div class="ch-h"><b>${esc(fmtDate(r.date))}</b><span class="ch">${t('hist.sale')}</span>${r.status==='void'?`<span class="ch">${t('sales.st.void')}</span>`:''}${money&&r.total!=null?`<b class="ch-s">${esc(fmtMoney(r.total))}</b>`:''}</div>
   <div>${its||esc(r.client)}</div><small>${esc([r.point,r.staff,t(r.pay==='card'?'pos.card':'pos.cash'),r.plate,r.phone].filter(Boolean).join(' · '))}</small></div>`}
 function view(r,u){
  const s=r.sum,pin=u&&u.role!=='admin'&&u.point_id;
  if(!r.rows.length)return `<p class="note">${t('hist.none')}</p>${r.sections.bookings&&r.sections.sales?'':`<p class="sub">${t(r.sections.bookings?'hist.noSales':'hist.noBk')}</p>`}`;
  return `<div class="panel ch-sum"><p><b>${t('hist.visits',{n:fmtNum(s.visits)})}</b>${s.spent!=null?' · '+t('hist.spent',{sum:fmtMoney(s.spent)}):''}</p>
   ${r.names.length||r.phones.length?`<p>${esc(r.names.concat(r.phones).join(' · '))}</p>`:''}
   ${r.vehicles.length?`<p><small>${t('hist.cars')}:</small> ${r.vehicles.map(v=>`<span class="ch">${esc(car(v))}</span>`).join('')}</p>`:''}</div>
   <div class="ch-l">${r.rows.map(x=>line(x,r.money)).join('')}</div>
   ${r.truncated?`<p class="sub">${t('hist.more')}</p>`:''}${pin?`<p class="sub">${t('hist.scope')}</p>`:''}${r.sections.bookings&&r.sections.sales?'':`<p class="sub">${t(r.sections.bookings?'hist.noSales':'hist.noBk')}</p>`}`}
 // el: контейнер; o.call(body) -> Promise с ответом сервера; o.user: сотрудник; o.q: стартовый запрос
 function mount(el,o){
  const st={q:o.q||''};el.classList.add('chx');
  el.innerHTML=`<form class="ch-f" autocomplete="off"><input name="q" type="search" inputmode="search" maxlength="40" placeholder="${esc(t('hist.ph'))}" aria-label="${esc(t('hist.ph'))}" value="${esc(st.q)}"><button class="btn gold">${t('hist.find')}</button></form><p class="sub">${t('hist.hint')}</p><div class="ch-r"></div>`;
  const f=$('.ch-f',el),box=$('.ch-r',el);
  async function go(){
   st.q=f.elements.q.value.trim();if(!st.q){box.innerHTML='';return}
   box.innerHTML='<div class="sk" style="height:120px"></div>';
   const r=await o.call({action:'client_history',q:st.q}).catch(()=>({error:'net'}));
   if(r.error==='auth')return;
   box.innerHTML=r.ok?view(r,o.user):`<p class="note" style="border-color:#d9534f">${esc(errText(r.error))}</p>`}
  f.onsubmit=e=>{e.preventDefault();go()};
  if(st.q)go();
  return{q:()=>f.elements.q.value.trim()}}
 return{mount}})();
