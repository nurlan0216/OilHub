/* inventory.js (v2.21-E7): stocktaking by scan. Admin page, route #/inventory (right edit_stock).
   Flow: choose a point, scan units or SKU codes (or add by hand), compare with the book balance of the point (stock_report),
   apply the differences through the EXISTING stock_adjust action (one call per product, reason "Inventory <date>").
   The server does all checks (rights, point, never below zero); this file only collects the count. Texts: i18n.js (inv.*).
   Inventory.mount(el, {call, err, say, user}). Works on admin.html and on staff.html (route #/inventory, right edit_stock). E7: the discrepancy-act button prints the differences (printBox); after apply it prints the applied lines. The draft is kept per user in localStorage so a reload does not lose the count. */
const Inventory=(()=>{
 let S=null;const KEY=u=>'oh_inv_'+(u&&u.id||'');
 const save=()=>{if(S)ls.s(KEY(S.u),JSON.stringify({pt:S.pt,lines:S.lines,all0:S.all0}))};
 const sumQty=()=>Object.values(S.lines).reduce((a,l)=>a+l.qty,0);
 const book=pid=>S.book[pid]||0;
 // rows shown: counted products, plus (optionally) products with a book balance that were not counted (fact 0)
 function rows(){const out=Object.values(S.lines).map(l=>({pid:l.pid,name:l.name,sku:l.sku,fact:l.qty,unc:false}));
  if(S.all0)S.P.forEach(p=>{if(!S.lines[p.id]&&book(p.id)>0)out.push({pid:p.id,name:p.name,sku:p.sku||'',fact:0,unc:true})});
  return out.map(r=>Object.assign(r,{book:book(r.pid),diff:r.fact-book(r.pid)}))}
 const dirty=()=>!!S&&Object.keys(S.lines).length>0;
 function line(pid){const p=S.P.find(x=>x.id===pid);if(!p)return null;return S.lines[pid]||(S.lines[pid]={pid:p.id,name:p.name,sku:p.sku||'',qty:0,codes:[]})}
 async function scan(code){
  if(!S.pt)return t('rc.noPoint');
  const r=await S.o.call({action:'lookup',code});
  if(!r||!r.ok)return r&&r.error==='ERR_NOT_FOUND'?t('err.notFound')+': '+code:S.o.err(r&&r.error);
  const l=line(r.product.id);if(!l)return t('err.notFound')+': '+code;
  if(r.unit){
   if(r.unit.status!=='in_stock')return t('err.sold')+': '+code;
   if(r.unit.point_id&&r.unit.point_id!==S.pt)return t('inv.otherPoint')+': '+code;
   if(Object.values(S.lines).some(x=>x.codes.includes(code)))return t('barcode.dup')+': '+code;
   l.codes.push(code)}
  l.qty++;save();draw();return '✓ '+l.name+' · '+l.qty}
 async function load(){const el=S.el;el.innerHTML='<div class="sk" style="height:200px"></div>';
  const [P,Pt,R]=await Promise.all([S.o.call({action:'list',sheet:'Products'}),S.o.call({action:'list',sheet:'Points'}),S.o.call({action:'stock_report'})]);
  const bad=[P,Pt,R].find(x=>!x||!x.rows);if(bad){el.innerHTML=`<p class="note" style="border-color:#d9534f">${esc(S.o.err(bad&&bad.error))}</p>`;return}
  S.P=P.rows;S.Pt=Pt.rows.filter(p=>isOn(p.active)||p.id===S.pt);S.R=R.rows;
  const pin=S.u.role!=='admin'&&S.u.point_id?S.u.point_id:'';if(pin)S.pt=pin;
  S.book={};S.R.forEach(r=>{S.book[r.product_id]=S.pt?(r.pts[S.pt]||0):0});draw()}
 function draw(){const el=S.el;if(!el||!el.isConnected)return;const R=rows(),pin=S.u.role!=='admin'&&S.u.point_id,diffs=R.filter(r=>r.diff!==0).length,q=norm(S.q||'');
  const opts=S.P.filter(p=>!q||norm(p.name+' '+(p.sku||'')).includes(q)).slice(0,40).map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
  el.innerHTML=`<div class="sa"><div class="sa-h"><h1>${t('nav.inventory')}</h1></div><p class="sub" style="margin-bottom:14px">${esc(t('inv.hint'))}</p>
   <div class="bar">${pin?`<b>${esc(ptx(S.Pt.find(x=>x.id===S.pt),'name'))}</b>`:`<select id="iv-pt" aria-label="${esc(t('pos.point'))}"><option value="">${t('rc.noPoint')}</option>${S.Pt.map(p=>`<option value="${esc(p.id)}" ${p.id===S.pt?'selected':''}>${esc(ptx(p,'name'))}</option>`).join('')}</select>`}
    <button class="btn gold" id="iv-sc" ${S.pt?'':'disabled'}>📷 ${t('pos.scan')}</button></div>
   <div class="bar"><input id="iv-q" type="search" placeholder="${esc(t('common.search'))}" value="${esc(S.q||'')}" autocomplete="off"><select id="iv-p" size="3">${opts}</select><input id="iv-n" inputmode="numeric" placeholder="${esc(t('pos.qty'))}" value="1" style="max-width:90px"><button class="btn ghost" id="iv-add" ${S.pt?'':'disabled'}>${t('common.add')}</button></div>
   <label class="ck"><input type="checkbox" id="iv-a0" ${S.all0?'checked':''}> ${t('inv.all0')}</label>
   <p class="sub" style="margin:10px 0">${esc(t('inv.summary',{n:sumQty(),m:diffs}))}</p>
   <div class="panel tw" style="padding:10px"><table class="tb"><tr><th>${t('pos.sale')}</th><th>${t('inv.book')}</th><th>${t('stock.counted')}</th><th>${t('inv.diff')}</th><th></th></tr>${R.map(r=>`<tr class="${r.unc?'blk':''}"><td>${esc(r.name)}<br><small>${esc(r.sku)}</small></td><td>${fmtNum(r.book)}</td><td><input class="cp" data-fq="${esc(r.pid)}" inputmode="numeric" value="${r.fact}" aria-label="${esc(t('stock.counted'))}"></td><td><b style="color:${r.diff<0?'#d9534f':r.diff>0?'#4cc38a':'inherit'}">${r.diff>0?'+':''}${fmtNum(r.diff)}</b></td><td>${r.unc?'':`<button class="btn ghost" data-rm="${esc(r.pid)}" aria-label="${esc(t('common.close'))}">✕</button>`}</td></tr>`).join('')||`<tr><td colspan="5">${t('inv.empty')}</td></tr>`}</table></div>
   <div class="bar"><button class="btn gold" id="iv-ap" ${S.pt&&diffs?'':'disabled'}>${t('inv.apply')}</button><button class="btn ghost" id="iv-act" ${S.pt&&(diffs||S.last)?'':'disabled'}>🖨 ${t('inv.act')}</button><button class="btn ghost" id="iv-cl" ${R.length||S.all0?'':'disabled'}>${t('inv.clear')}</button></div></div>`;
  const pt=$('#iv-pt',el);if(pt)pt.onchange=()=>{S.pt=pt.value;S.book={};S.R.forEach(r=>{S.book[r.product_id]=S.pt?(r.pts[S.pt]||0):0});S.lines={};save();draw()};
  $('#iv-sc',el).onclick=()=>Scanner.open({keep:true,onCode:scan});
  $('#iv-q',el).oninput=e=>{S.q=e.target.value;const p=e.target.selectionStart;draw();const x=$('#iv-q',S.el);x.focus();x.setSelectionRange(p,p)};
  $('#iv-add',el).onclick=()=>{const pid=$('#iv-p',el).value,n=parseInt($('#iv-n',el).value,10);if(!pid)return S.o.say(t('rc.pick'));if(!(n>0))return S.o.say(t('err.bad'));const l=line(pid);if(l){l.qty+=n;save();draw()}};
  $('#iv-a0',el).onchange=e=>{S.all0=e.target.checked;save();draw()};
  $$('[data-fq]',el).forEach(i=>i.onchange=()=>{const n=parseInt(i.value,10),pid=i.dataset.fq;if(!(n>=0)){return draw()}const l=line(pid);if(l){l.qty=n;if(n===0&&!l.codes.length)delete S.lines[pid];save()}draw()});
  $$('[data-rm]',el).forEach(b=>b.onclick=()=>{delete S.lines[b.dataset.rm];save();draw()});
  $('#iv-cl',el).onclick=()=>{S.lines={};S.all0=false;save();draw()};
  $('#iv-ap',el).onclick=apply;$('#iv-act',el).onclick=act}
 // act of differences: current differences, or the lines applied last (after apply the book balance equals the count and no differences remain)
 function act(){const cur=rows().filter(r=>r.diff!==0).map(r=>({name:r.name,sku:r.sku,book:r.book,fact:r.fact,diff:r.diff})),src=cur.length?{pt:S.pt,rows:cur}:S.last;
  if(!src||!src.rows.length)return S.o.say(t('inv.act.none'));
  const P=S.Pt.find(x=>x.id===src.pt),plus=src.rows.filter(r=>r.diff>0).reduce((a,r)=>a+r.diff,0),minus=-src.rows.filter(r=>r.diff<0).reduce((a,r)=>a+r.diff,0);
  printBox(`<h1>${esc(t('inv.act.title'))}</h1><p>${esc(ptx(P,'name'))} · ${esc(fmtDate(today()))}</p><table><tr><th>#</th><th>${esc(t('pos.sale'))}</th><th>${esc(t('inv.book'))}</th><th>${esc(t('stock.counted'))}</th><th>${esc(t('inv.diff'))}</th></tr>${src.rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}${r.sku?'<br>'+esc(r.sku):''}</td><td>${fmtNum(r.book)}</td><td>${fmtNum(r.fact)}</td><td><b>${r.diff>0?'+':''}${fmtNum(r.diff)}</b></td></tr>`).join('')}</table><p>${esc(t('inv.act.sum',{n:src.rows.length,plus:fmtNum(plus),minus:fmtNum(minus)}))}</p><div class="sg"><div>${esc(t('doc.signStaff'))}</div><div>${esc(t('doc.signHead'))}</div></div>`)}
 async function apply(){const R=rows().filter(r=>r.diff!==0);if(!R.length||!S.pt)return;if(!confirm(t('inv.confirm',{n:R.length})))return;
  const b=$('#iv-ap',S.el);b.disabled=true;let ok=0,fail=0,last='';const why=t('inv.reason',{date:fmtDate(today())}),applied=[];
  for(const r of R){const x=await S.o.call({action:'stock_adjust',point_id:S.pt,product_id:r.pid,counted:r.fact,reason:why});
   if(x&&x.ok){ok++;applied.push({name:r.name,sku:r.sku,book:r.book,fact:r.fact,diff:r.diff});delete S.lines[r.pid];S.book[r.pid]=r.fact}else{fail++;last=S.o.err(x&&x.error)}}
  if(applied.length)S.last={pt:S.pt,rows:applied};
  save();S.o.say(t('inv.done',{ok:ok,fail:fail})+(last?': '+last:''));
  await load()} // fresh balances from the server; failed lines stay in the draft
 function mount(el,o){let d={};try{d=JSON.parse(ls.g(KEY(o.user))||'{}')}catch(e){}
  S={el:el,o:o,u:o.user,pt:d.pt||'',lines:d.lines||{},all0:!!d.all0,q:'',P:[],Pt:[],R:[],book:{}};
  document.addEventListener('langchange',()=>{if(S&&S.el.isConnected&&S.P.length)draw()});load()}
 return{mount,dirty}})();
