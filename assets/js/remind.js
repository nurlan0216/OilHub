/* remind.js (v2.21-E3): list "who is due for a reminder" and the wa.me link. Shared by admin.html and staff.html.
   All texts come from i18n.js (remind.*). The server sends nothing: it only builds the list (remind_list) and records that the staff member opened WhatsApp (remind_mark).
   Remind.mount(el, {call, err, say, canSettings}):
     call(body) -> Promise of the API response (host adds the token and handles auth), err(code) -> text, say(text) -> toast. */
const Remind=(()=>{
 const rt=(k,l,p)=>_sub(_get(k,l),p);
 // greeting name: only if it looks like a name (the cashier sometimes types a phone into the client field)
 const hello=n=>{n=String(n||'').trim();return n&&!/\d/.test(n)&&n.length<=40?', '+n:''};
 // message text in the client's language: booking language if known, otherwise the current interface language
 function text(r){const l=r.lang==='kk'||r.lang==='ru'?r.lang:L,what=r['what_'+l]||r.what_ru||r.what_kk||'';
  return rt('remind.msg',l,{name:hello(r.name),what:what,date:fmtDate(r.last_date),days:r.days_since,
   km:r.next_km?rt('remind.msgKm',l,{km:fmtNum(r.next_km)}):'',sign:r.point?'\n'+r.point:''})}
 const link=r=>waLink(r.phone,text(r));
 const when=r=>r.over===0?t('remind.today'):r.over>0?t('remind.over',{n:r.over}):t('remind.in',{n:-r.over});
 function mount(el,o){
  const S={rows:[],cfg:{days:180,km:0,lead:7},setup:false,all:false};
  const fail=c=>{el.innerHTML=`<p class="note" style="border-color:#d9534f">${esc(o.err(c))}</p>`};
  async function load(){el.innerHTML='<div class="sk" style="height:160px"></div>';
   const r=await o.call({action:'remind_list'});if(!r||!r.ok)return fail(r&&r.error);
   S.rows=r.rows||[];S.cfg=r.cfg||S.cfg;S.setup=!!r.setup;draw()}
  function card(r,i){const href=link(r),car=r.plate?`<span class="rm-p">${esc(r.plate)}</span>`:'';
   return `<div class="rm-c ${r.done?'rm-d':''}"><div class="rm-i"><b>${esc(r.name&&!/\d{6}/.test(r.name)?r.name:'+'+r.phone)}</b> ${car}
    <div class="sub rm-s">+${esc(r.phone)}</div>
    <div class="rm-l">${esc(t('remind.last',{date:fmtDate(r.last_date),what:r['what_'+L]||r.what_ru||r.what_kk||''}))}${r.mileage?' · '+esc(t('remind.mileage',{km:fmtNum(r.mileage)})):''}</div>
    <div><span class="tr ${r.over>=0?'none':'warn'}">${esc(when(r))}</span>${r.next_km?` <span class="tr">${esc(t('remind.nextKm',{km:fmtNum(r.next_km)}))}</span>`:''}${r.done?` <span class="tr ok">${esc(t('remind.sent',{date:fmtDateTime(r.reminded)}))}</span>`:''}</div></div>
    ${href?`<a class="btn gold bigb rm-w" target="_blank" rel="noopener" href="${esc(href)}" data-mk="${i}">WhatsApp</a>`:`<span class="sub">${esc(t('remind.noWa'))}</span>`}</div>`}
  function draw(){const todo=S.rows.filter(r=>!r.done),rows=S.all?S.rows:todo,c=S.cfg;
   el.innerHTML=`<div class="cg-h"><h1>${t('remind.title')}</h1></div>
    <p class="sub" style="margin-bottom:14px">${esc(t('remind.sub',{days:c.days,lead:c.lead}))}${c.km?' '+esc(t('remind.subKm',{km:fmtNum(c.km)})):''}</p>
    ${o.canSettings?`<details class="panel rm-set"><summary>${t('remind.settings')}</summary><form id="rm-f" class="rm-f">
     <label>${t('remind.setDays')}<input name="days" inputmode="numeric" value="${esc(c.days)}"></label>
     <label>${t('remind.setKm')}<input name="km" inputmode="numeric" value="${esc(c.km)}"></label>
     <label>${t('remind.setLead')}<input name="lead" inputmode="numeric" value="${esc(c.lead)}"></label>
     <button class="btn gold" type="submit">${t('common.save')}</button></form><p class="sub rm-s">${t('remind.setHint')}</p></details>`:''}
    <div class="bar"><button class="btn ${S.all?'ghost':'gold'}" data-f="0" aria-pressed="${!S.all}">${t('remind.fTodo')} · ${fmtNum(todo.length)}</button><button class="btn ${S.all?'gold':'ghost'}" data-f="1" aria-pressed="${S.all}">${t('remind.fAll')} · ${fmtNum(S.rows.length)}</button></div>
    ${S.setup?`<p class="note">${t('remind.setup')}</p>`:rows.length?`<div class="rm-g">${rows.map(r=>card(r,S.rows.indexOf(r))).join('')}</div>`:`<p class="note">${t(S.rows.length?'remind.allDone':'remind.empty')}</p>`}`;
   $$('[data-f]',el).forEach(b=>b.onclick=()=>{S.all=b.dataset.f==='1';draw()});
   $$('[data-mk]',el).forEach(a=>a.onclick=()=>{const r=S.rows[+a.dataset.mk];if(!r)return;
    // the link opens by itself; the mark is sent in parallel, a failed mark does not block the message
    o.call({action:'remind_mark',phone:r.phone,plate:r.plate,event:r.event,point_id:r.point_id}).then(x=>{if(x&&x.ok){r.done=true;r.reminded=x.time;setTimeout(()=>{if(el.isConnected)draw()},400)}else if(x&&x.error)o.say(o.err(x.error))})});
   const f=$('#rm-f',el);if(f)f.onsubmit=async e=>{e.preventDefault();const b=$('.gold',f),v={};b.disabled=true;
    for(const k of['days','km','lead']){const s=String(f.elements[k].value).trim();if(s!==''&&!/^\d{1,6}$/.test(s)){b.disabled=false;return o.say(t('err.bad'))}v[k]=s}
    if(!(+v.days>=1)){b.disabled=false;return o.say(t('err.bad'))}
    for(const k of Object.keys(v)){const r=await o.call({action:'upsert',sheet:'Settings',row:{key:'remind_'+k,value:v[k]}});if(!r||!r.ok){b.disabled=false;return o.say(o.err(r&&r.error))}}
    o.say(t('staff.saved'));load()}}
  document.addEventListener('langchange',()=>{if(el.isConnected&&S.rows)draw()});
  load();return{reload:load}}
 return{mount,text,link}})();
