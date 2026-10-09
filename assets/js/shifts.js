/* shifts.js (v2.21-E6): cashier shifts and cash reconciliation.
   Shifts.mount(el, {call, err, say, user, points, pending, opened})  - staff.html, route #/shift: open a shift, see running totals, close it with a count.
   Shifts.report(el, {call, err, say, user})                  - admin.html, route #/shifts (right view_reports): shifts with expected, counted and difference.
   The server computes the expected amounts (shift_close); the cashier enters the counted cash and the card total from the terminal first, then sees the difference.
   E6 (extension): cash in/out during the shift (shift_cash), Z-report of a shift (shift_z, printed through printBox), admin can close another cashier's open shift.
   Texts: i18n.js (shift.*). */
const Shifts=(()=>{
 const own=(a,b)=>fmtMoney(a)+(b==null?'':' / '+fmtMoney(b));
 const num=v=>{const s=String(v==null?'':v).replace(/\s/g,'').replace(',','.');return s!==''&&/^\d+(\.\d{1,2})?$/.test(s)?Number(s):NaN};
 const pinOf=u=>u&&u.role!=='admin'&&u.point_id?u.point_id:'';
 const dc=v=>`<b style="color:${v<0?'#d9534f':v>0?'#e0b25a':'#4cc38a'}">${v>0?'+':''}${fmtMoney(v)}</b>`;
 const sk='<div class="sk" style="height:160px"></div>';
 // Z-report: printable document built from the server's shift_z answer
 function zHtml(z){const pt=(L==='kk'&&z.point_kk)||z.point,cl=z.status==='closed',sg=`<div class="sg"><div>${esc(t('doc.signStaff'))}</div><div>${esc(t('doc.signHead'))}</div></div>`;
  const row=(a,b)=>`<tr><td>${esc(a)}</td><td>${b}</td></tr>`;
  return `<h1>${esc(t('shift.z'))}</h1><p>${esc(pt)} · ${esc(z.staff)}<br>${esc(t('shift.opened',{time:fmtDateTime(z.open_time)}))}${cl?'<br>'+esc(t('shift.col.close'))+': '+esc(fmtDateTime(z.close_time)):''}</p>${cl?'':`<p><b>${esc(t('shift.z.notClosed'))}</b></p>`}
   <table>${row(t('shift.z.sales'),fmtNum(z.n))}${row(t('shift.z.subtotal'),fmtMoney(z.subtotal))}${row(t('shift.z.discount'),fmtMoney(z.discount))}${row(t('shift.z.promo'),fmtMoney(z.promo_disc))}${row(t('shift.z.total'),'<b>'+fmtMoney(z.total)+'</b>')}${row(t('pos.cash'),fmtMoney(z.cash))}${row(t('pos.card'),fmtMoney(z.card))}${row(t('shift.z.voids',{n:fmtNum(z.void_n),sum:fmtMoney(z.void_sum)}),'')}</table>
   <table><tr><th></th><th>${esc(t('shift.expected'))}</th><th>${esc(t('shift.counted'))}</th><th>${esc(t('shift.diff'))}</th></tr>
   <tr><td>${esc(t('pos.cash'))}<br><small>${esc(t('shift.openCash'))}: ${fmtMoney(z.open_cash)}; ${esc(t('shift.z.cashIn'))}: ${fmtMoney(z.cash_in)}; ${esc(t('shift.z.cashOut'))}: ${fmtMoney(z.cash_out)}</small></td><td>${fmtMoney(z.exp_cash)}</td><td>${cl?fmtMoney(z.cash_counted):'—'}</td><td>${cl?fmtMoney(z.diff_cash):'—'}</td></tr>
   <tr><td>${esc(t('pos.card'))}</td><td>${fmtMoney(z.exp_card)}</td><td>${cl?fmtMoney(z.card_declared):'—'}</td><td>${cl?fmtMoney(z.diff_card):'—'}</td></tr></table>
   ${z.moves.length?`<table><tr><th>${esc(t('common.date'))}</th><th>${esc(t('shift.mv.title'))}</th><th>${esc(t('shift.mv.amount'))}</th><th>${esc(t('shift.mv.reason'))}</th></tr>${z.moves.map(m=>`<tr><td>${esc(fmtDateTime(m.time))}</td><td>${esc(t(m.type==='out'?'shift.mv.out':'shift.mv.in'))}</td><td>${fmtMoney(m.amount)}</td><td>${esc(m.reason)}</td></tr>`).join('')}</table>`:''}
   ${z.note?`<p>${esc(z.note)}</p>`:''}${sg}`}
 async function zPrint(o,id){const r=await o.call({action:'shift_z',id:id});if(!r||!r.ok)return o.say(o.err(r&&r.error));printBox(zHtml(r.z))}
 function mount(el,o){
  const fail=c=>{el.innerHTML=`<p class="note" style="border-color:#d9534f">${esc(o.err(c))}</p>`};
  async function load(){el.innerHTML=sk;const r=await o.call({action:'shift_current'});if(!r||!r.ok)return fail(r&&r.error);draw(r)}
  function done(sh){el.innerHTML=`<div class="panel"><h3>${t('shift.title')}</h3><p class="note">${t('shift.closed')}</p>
   <table class="tb"><tr><th></th><th>${t('shift.expected')}</th><th>${t('shift.counted')}</th><th>${t('shift.diff')}</th></tr>
   <tr><td>${t('pos.cash')}</td><td>${fmtMoney(sh.exp_cash)}</td><td>${fmtMoney(sh.cash_counted)}</td><td>${dc(Number(sh.diff_cash))}</td></tr>
   <tr><td>${t('pos.card')}</td><td>${fmtMoney(sh.exp_card)}</td><td>${fmtMoney(sh.card_declared)}</td><td>${dc(Number(sh.diff_card))}</td></tr></table>
   <button class="btn ghost bigb" id="sh-z">🖨 ${t('shift.z')}</button>
   <button class="btn gold bigb" id="sh-n">${t('shift.open')}</button></div>`;$('#sh-n',el).onclick=load;$('#sh-z',el).onclick=()=>zPrint(o,sh.id)}
  function draw(r){
   if(r.off)return el.innerHTML=`<p class="note">${t('err.shiftOff')}</p>`;
   const sh=r.shift,pin=pinOf(o.user),P=(o.points&&o.points())||[];
   if(!sh){el.innerHTML=`<div class="panel"><h3>${t('shift.title')}</h3><p class="note">${t(r.required?'shift.banner':'shift.none')}</p>
    <label>${t('pos.point')}</label>${pin?`<b>${esc(ptx(P.find(x=>x.id===pin),'name'))}</b>`:`<select id="sh-pt"><option value="">${t('rc.noPoint')}</option>${P.map(p=>`<option value="${esc(p.id)}">${esc(ptx(p,'name'))}</option>`).join('')}</select>`}
    <label>${t('shift.openCash')}</label><input id="sh-oc" inputmode="decimal" value="0">
    <button class="btn gold bigb" id="sh-o">${t('shift.open')}</button></div>`;
    $('#sh-o',el).onclick=async()=>{const pt=pin||($('#sh-pt',el)||{}).value,oc=num($('#sh-oc',el).value);if(!pt)return o.say(t('rc.noPoint'));if(isNaN(oc))return o.say(t('err.bad'));
     const b=$('#sh-o',el);b.disabled=true;const x=await o.call({action:'shift_open',point_id:pt,open_cash:String(oc)});b.disabled=false;if(!x||!x.ok)return o.say(o.err(x&&x.error));o.say(t('staff.saved'));if(o.opened)o.opened();load()};return}
   const T=r.totals||{n:0,cash:0,card:0};
   el.innerHTML=`<div class="panel"><h3>${t('shift.title')}</h3><p class="sub" style="margin-bottom:8px">${esc(t('shift.opened',{time:fmtDateTime(sh.open_time)}))} · ${esc(((P.find(x=>x.id===sh.point_id)||{}).name)||'')}</p>
    <p class="note">${esc(t('shift.running',{n:fmtNum(T.n),cash:fmtMoney(T.cash),card:fmtMoney(T.card)}))}</p>
    <p class="sub">${esc(t('shift.mv.expected',{sum:fmtMoney(r.exp_cash)}))}</p>
    <h3 style="margin-top:14px">${t('shift.mv.title')}</h3>
    <div class="bar"><select id="mv-t" aria-label="${esc(t('shift.mv.title'))}"><option value="in">${t('shift.mv.in')}</option><option value="out">${t('shift.mv.out')}</option></select><input id="mv-a" inputmode="decimal" placeholder="${esc(t('shift.mv.amount'))}" style="max-width:130px"><input id="mv-r" maxlength="120" placeholder="${esc(t('shift.mv.reason'))}"><button class="btn ghost" id="mv-ok">${t('shift.mv.add')}</button></div>
    ${(r.moves||[]).length?`<table class="tb">${r.moves.map(m=>`<tr><td>${esc(fmtDateTime(m.time))}</td><td>${esc(t(m.type==='out'?'shift.mv.out':'shift.mv.in'))}</td><td>${fmtMoney(m.amount)}</td><td>${esc(m.reason)}</td></tr>`).join('')}</table>`:`<p class="sub">${t('shift.mv.empty')}</p>`}
    <label>${t('shift.cashCounted')}</label><input id="sh-c" inputmode="decimal">
    <label>${t('shift.cardDeclared')}</label><input id="sh-k" inputmode="decimal">
    <label>${t('shift.note')}</label><input id="sh-t" maxlength="300">
    <button class="btn ghost bigb" id="sh-z">🖨 ${t('shift.z')}</button>
    <button class="btn gold bigb" id="sh-x">${t('shift.close')}</button></div>`;
   $('#sh-z',el).onclick=()=>zPrint(o,sh.id);
   $('#mv-ok',el).onclick=async()=>{const a=num($('#mv-a',el).value),why=$('#mv-r',el).value.trim();if(isNaN(a)||a<=0)return o.say(t('err.bad'));if(!why)return o.say(t('err.required'));
    const b=$('#mv-ok',el);b.disabled=true;const x=await o.call({action:'shift_cash',id:sh.id,type:$('#mv-t',el).value,amount:String(a),reason:why});b.disabled=false;if(!x||!x.ok)return o.say(o.err(x&&x.error));o.say(t('shift.mv.saved'));load()};
   $('#sh-x',el).onclick=async()=>{const n=o.pending?o.pending():0;if(n>0)return o.say(t('shift.pending',{n:n}));
    const c=num($('#sh-c',el).value),k=num($('#sh-k',el).value);if(isNaN(c)||isNaN(k))return o.say(t('err.bad'));if(!confirm(t('shift.closeAsk')))return;
    const b=$('#sh-x',el);b.disabled=true;const x=await o.call({action:'shift_close',id:sh.id,cash_counted:String(c),card_declared:String(k),note:$('#sh-t',el).value.trim()});b.disabled=false;
    if(!x||!x.ok)return o.say(o.err(x&&x.error));done(x.shift)}}
  load()}
 // admin report
 function report(el,o){
  const d=n=>{const x=new Date();x.setDate(x.getDate()+n);return x.getFullYear()+'-'+p2(x.getMonth()+1)+'-'+p2(x.getDate())};
  const F={from:d(-29),to:d(0),pt:''};let Pt=[],R=[];
  async function load(){el.innerHTML=sk;const pin=pinOf(o.user);
   const [r,p]=await Promise.all([o.call({action:'shifts_list',date_from:F.from,date_to:F.to,point_id:pin||F.pt}),Pt.length?Promise.resolve({rows:Pt}):o.call({action:'list',sheet:'Points'})]);
   if(!r||!r.ok){el.innerHTML=`<p class="note" style="border-color:#d9534f">${esc(o.err(r&&r.error))}</p>`;return}
   Pt=(p&&p.rows)||[];R=r.rows;draw()}
  function draw(){const pin=pinOf(o.user),open=R.filter(x=>x.status==='open').length;
   el.innerHTML=`<div class="sa"><div class="sa-h"><h1>${t('nav.shifts')}</h1></div>
    <div class="bar"><label class="sl-l">${t('sales.from')} <input type="date" id="sf-a" value="${esc(F.from)}"></label><label class="sl-l">${t('sales.to')} <input type="date" id="sf-b" value="${esc(F.to)}"></label>
     ${pin?'':`<select id="sf-p" aria-label="${esc(t('pos.point'))}"><option value="">${t('stock.allPoints')}</option>${Pt.map(p=>`<option value="${esc(p.id)}" ${p.id===F.pt?'selected':''}>${esc(ptx(p,'name'))}</option>`).join('')}</select>`}</div>
    <p class="sub" style="margin-bottom:10px">${esc(t('shift.openNow',{n:open}))}</p>
    <div class="panel tw" style="padding:10px"><table class="tb"><tr><th>${t('shift.col.open')}</th><th>${t('shift.col.close')}</th><th>${t('pos.point')}</th><th>${t('sales.staff')}</th><th>${t('shift.col.expCash')}</th><th>${t('shift.col.cash')}</th><th>${t('shift.diff')}</th><th>${t('shift.col.expCard')}</th><th>${t('shift.col.card')}</th><th>${t('shift.diff')}</th><th>${t('shift.col.moves')}</th><th>${t('common.status')}</th><th></th></tr>
    ${R.map(x=>{const c=x.status==='closed';return `<tr><td>${esc(fmtDateTime(x.open_time))}</td><td>${c?esc(fmtDateTime(x.close_time)):'—'}</td><td>${esc(x.point)}</td><td>${esc(x.staff)}</td><td>${fmtMoney(x.exp_cash)}</td><td>${c?fmtMoney(x.cash_counted):'—'}</td><td>${c?dc(x.diff_cash):'—'}</td><td>${fmtMoney(x.exp_card)}</td><td>${c?fmtMoney(x.card_declared):'—'}</td><td>${c?dc(x.diff_card):'—'}</td><td>${own(x.cash_in||0,x.cash_out||0)}</td><td>${t(c?'shift.st.closed':'shift.st.open')}${x.note?`<br><small>${esc(x.note)}</small>`:''}</td><td><button class="btn ghost" data-z="${esc(x.id)}">🖨 ${t('shift.z')}</button>${!c&&o.user&&o.user.role==='admin'?` <button class="btn ghost" data-fc="${esc(x.id)}">${t('shift.force')}</button>`:''}</td></tr>`}).join('')||`<tr><td colspan="13">${t('common.empty')}</td></tr>`}</table></div></div>`;
   $('#sf-a',el).onchange=e=>{F.from=e.target.value;load()};$('#sf-b',el).onchange=e=>{F.to=e.target.value;load()};const p=$('#sf-p',el);if(p)p.onchange=e=>{F.pt=e.target.value;load()};
   $$('[data-z]',el).forEach(b=>b.onclick=()=>zPrint(o,b.dataset.z));
   $$('[data-fc]',el).forEach(b=>b.onclick=async()=>{const x=R.find(r=>r.id===b.dataset.fc);if(!x||!confirm(t('shift.forceAsk',{staff:x.staff})))return;
    const c=prompt(t('shift.cashCounted'));if(c===null)return;const k=prompt(t('shift.cardDeclared'));if(k===null)return;
    const cn=num(c),kn=num(k);if(isNaN(cn)||isNaN(kn))return o.say(t('err.bad'));b.disabled=true;
    const r=await o.call({action:'shift_close',id:x.id,cash_counted:String(cn),card_declared:String(kn),note:''});b.disabled=false;if(!r||!r.ok)return o.say(o.err(r&&r.error));o.say(t('staff.saved'));load()})}
  document.addEventListener('langchange',()=>{if(el.isConnected&&R)draw()});load()}
 return{mount,report}})();
