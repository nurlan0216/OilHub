/* staff.js: рабочее место сотрудника (касса, товары, записи, мои продажи, приход). Права проверяются на сервере; здесь только удобство. */
/* тексты этого файла живут в i18n.js */
const tk=()=>ls.g('oh_staff_token')||'';
const uid=()=>window.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const D={},EM={ERR_STOCK:'err.stock',ERR_FORBIDDEN:'err.forbidden',ERR_NOT_FOUND:'err.notFound',ERR_POSTED:'sale.locked',ERR_BARCODE_DUP:'barcode.dup',ERR_BARCODE_SOLD:'err.sold',ERR_BAD:'err.bad',ERR_EMPTY:'err.empty',ERR_LOCKED:'auth.many',ERR_AUTH:'auth.bad',ERR_SLOT_TAKEN:'err.slotTaken',ERR_REQUIRED:'err.required',ERR_PHONE:'err.phone',ERR_DATE:'err.date',ERR_PAST:'err.past',ERR_SERVER:'err.server',ERR_WA_PHONE:'err.clientPhone',ERR_SHIFT:'err.shift',ERR_SHIFT_OPEN:'err.shiftOpen',ERR_SHIFT_CLOSED:'err.shiftClosed',ERR_SHIFT_OFF:'err.shiftOff',ERR_CASH:'err.cash',ERR_PROMO:'err.promo',ERR_PROMO_EXPIRED:'err.promoExpired',ERR_PROMO_LIMIT:'err.promoLimit',ERR_PROMO_MIN:'err.promoMin',ERR_PROMO_LOCK:'err.promoLock'};
const em=c=>t(EM[c]||'err.net'),nm=o=>o.name||tx(o,'name'),can=(u,p)=>(u.perms||[]).includes(p);
let _tt;function say(m){let e=$('#stt');if(!e){e=document.createElement('div');e.id='stt';e.className='toast';e.setAttribute('role','status');document.body.appendChild(e)}e.textContent=m;e.classList.add('on');clearTimeout(_tt);_tt=setTimeout(()=>e.classList.remove('on'),2800)}
async function lst(n){const r=await post({action:'list',sheet:n,token:tk()});if(r.error==='auth'){location.reload();throw new Error('auth')}if(r.error)throw new Error(r.error);return r.rows}
async function load(f){if(D.P&&!f)return;[D.P,D.S,D.Pt,D.C,D.St]=await Promise.all(['Products','Services','Points','Categories','Settings'].map(lst));const c=D.St.find(x=>x.key==='currency');if(c)setCurrency(c.value)}
const sk='<div class="sk" style="height:160px"></div>',errBox=e=>`<p class="note" style="border-color:#d9534f">${esc(em(e.message))}</p>`;
const ptSel=(id,v,u)=>(u.point_id&&u.role==='seller')?`<b>${esc(ptx((D.Pt||[]).find(x=>x.id===u.point_id),'name'))}</b>`:`<select id="${id}"><option value="">${t('rc.noPoint')}</option>${(D.Pt||[]).map(p=>`<option value="${esc(p.id)}" ${p.id===v?'selected':''}>${esc(ptx(p,'name'))}</option>`).join('')}</select>`;

/* ===== касса ===== */
const DR=Object.assign({cart:[],pay:'cash',disc:'',client:'',phone:'',plate:'',km:'',pt:'',promo:null,uuid:uid()},(()=>{try{return JSON.parse(ls.g('oh_staff_draft')||'{}')}catch(e){return{}}})());
const keep=()=>ls.s('oh_staff_draft',JSON.stringify(DR)),QK='oh_staff_queue',queue=()=>{try{return JSON.parse(ls.g(QK)||'[]')}catch(e){return[]}};
const sub=()=>DR.cart.reduce((a,x)=>a+x.pr*x.q,0),dsc=()=>Math.min(Math.max(+DR.disc||0,0),sub());
// v2.21-E4: промокод. Предпросмотр считается на клиенте по данным promo_check, итог всё равно пересчитывает сервер (sale_post)
const pbase=()=>sub()-dsc(),pOn=()=>!!(DR.promo&&pbase()>0&&pbase()>=(+DR.promo.min||0)),
 pdsc=()=>{if(!pOn())return 0;const p=DR.promo,v=+p.value||0;return p.type==='percent'?Math.round(pbase()*Math.min(v,100)/100):Math.min(v,pbase())},tot=()=>sub()-dsc()-pdsc();
function promoBox(){const p=DR.promo;if(p)return `<label>${t('promo.code')}</label><div class="pay"><b class="pc">${esc(p.code)}</b><button class="btn ghost" id="ppx">${t('promo.remove')}</button></div>${pOn()?`<div>${t('promo.rcp',{code:esc(p.code)})}<b>−${fmtMoney(pdsc())}</b></div>`:`<small class="sub">${t('promo.min',{n:fmtMoney(+p.min||0)})}</small>`}`;
 return `<label>${t('promo.code')}</label><div class="pay"><input id="ppc" autocomplete="off" autocapitalize="characters" maxlength="24" aria-label="${esc(t('promo.code'))}"><button class="btn ghost" id="ppa">${t('promo.apply')}</button></div>`}
async function promoApply(){const i=$('#ppc'),code=((i&&i.value)||'').trim();if(!code)return;if(!navigator.onLine)return say(t('promo.offline'));const b=$('#ppa');b.disabled=true;
 try{const r=await post({action:'promo_check',token:tk(),code,subtotal:sub(),discount:dsc()});if(r.error==='auth')return location.reload();if(!r.ok){b.disabled=false;return say(r.error==='ERR_PROMO_MIN'?t('err.promoMin')+'. '+t('promo.min',{n:fmtMoney(+r.min||0)}):em(r.error))}
  DR.promo={code:r.code,type:r.type,value:r.value,min:r.min};keep();cartPaint();say(t('promo.applied',{n:fmtMoney(pdsc())}))}catch(e){b.disabled=false;say(t('err.net'))}}
function addP(p,code){if(code&&DR.cart.some(x=>x.code===code))return t('barcode.dup');
 const ex=!code&&DR.cart.find(x=>x.k==='p'&&x.id===p.id&&!x.code),have=DR.cart.filter(x=>x.k==='p'&&x.id===p.id).reduce((a,x)=>a+x.q,0);
 if(have+1>(+p.stock||0))return t('err.stock');
 if(ex)ex.q++;else DR.cart.push({k:'p',id:p.id,n:p.name,pr:+p.price||0,q:1,code:code||''});keep();cartPaint();return '✓ '+p.name}
function addS(s){const ex=DR.cart.find(x=>x.k==='s'&&x.id===s.id);if(ex)ex.q++;else DR.cart.push({k:'s',id:s.id,n:tx(s,'name'),pr:+s.price||0,q:1,code:''});keep();cartPaint()}
async function scanPos(code){let p=D.P.find(x=>x.barcode===code||x.sku===code);
 if(!p){const r=await post({action:'lookup',token:tk(),code}).catch(()=>({error:'net'}));if(!r.ok)return em(r.error);
  if(r.unit&&r.unit.status!=='in_stock')return t('err.sold');p=D.P.find(x=>x.id===r.product.id);if(!p)return t('err.notFound');return addP(p,r.unit?code:'')}
 return addP(p,'')}
// E5: сопутствующие товары. Связь Products.related задаётся в админке; здесь только подсказка кассиру под корзиной (не блокирует сканирование).
const RELX=new Set();
function relSug(){const inCart=new Set(DR.cart.filter(x=>x.k==='p').map(x=>x.id)),seen=new Set(),o=[];
 DR.cart.forEach(x=>{if(x.k!=='p')return;const p=(D.P||[]).find(y=>y.id===x.id);if(!p||!p.related)return;
  String(p.related).split(';').map(s=>s.trim()).filter(Boolean).forEach(id=>{if(inCart.has(id)||seen.has(id)||RELX.has(id))return;const r=D.P.find(y=>y.id===id);if(!r||isOff(r)||!(+r.stock>0))return;seen.add(id);o.push(r)})});return o}
function relBlock(){const L=relSug();return L.length?`<div class="rel"><b>${t('rel.title')}</b>${L.map(r=>`<div class="rel-r"><span class="cn">${esc(r.name)}<small> ${esc(r.sizes||'')} · ${t('pos.stock')}: ${fmtNum(+r.stock||0)}</small></span><span>${fmtMoney(+r.price||0)}</span><button class="btn gold" data-rel="${esc(r.id)}">${t('common.add')}</button><button class="x" data-rx="${esc(r.id)}" aria-label="${esc(t('common.close'))}">✕</button></div>`).join('')}</div>`:''}
function cartPaint(){const c=$('#pc');if(!c)return;const u=c._u,pr=can(u,'edit_draft_sale'),n=queue().length;
 c.innerHTML=`${n?`<p class="note" style="border-color:var(--gold)">${t('pos.pending',{n})}. ${t('pos.pendingNote')}</p>`:''}<h3>${t('pos.cart')}</h3>`+(DR.cart.length?DR.cart.map((x,i)=>`<div class="cl"><span class="cn">${esc(x.n)}${x.code?` <small>${esc(x.code)}</small>`:''}</span>${x.k==='s'&&pr?`<input class="cp" data-pi="${i}" inputmode="decimal" value="${x.pr}" aria-label="${t('pos.price')}">`:`<span>${fmtMoney(x.pr)}</span>`}<span class="qt"><button data-d="-1" data-i="${i}" aria-label="−">−</button><b>${fmtNum(x.q)}</b><button data-d="1" data-i="${i}" ${x.code?'disabled':''} aria-label="+">+</button></span><b>${fmtMoney(x.pr*x.q)}</b><button class="x" data-rm="${i}" aria-label="${t('common.close')}">✕</button></div>`).join(''):`<p class="sub">${t('pos.empty')}</p>`)+
 `${relBlock()}<div class="tt"><div>${t('pos.subtotal')}<b>${fmtMoney(sub())}</b></div>${can(u,'edit_draft_sale')?`<label>${t('pos.discount')}</label><input id="pdis" inputmode="decimal" value="${esc(DR.disc)}">`:''}${promoBox()}<div class="big">${t('pos.total')}<b>${fmtMoney(tot())}</b></div></div>
 <label>${t('pos.payment')}</label><div class="pay"><button class="btn ${DR.pay==='cash'?'gold':'ghost'}" data-pay="cash">${t('pos.cash')}</button><button class="btn ${DR.pay==='card'?'gold':'ghost'}" data-pay="card">${t('pos.card')}</button></div>
 <label>${t('pos.client')}</label><input id="pcl" value="${esc(DR.client)}" maxlength="120"><label>${t('remind.saleData')}</label><div class="fr2"><div><label>${t('pos.client.phone')}</label><input id="pph" type="tel" inputmode="tel" value="${esc(DR.phone)}" maxlength="25" autocomplete="off"></div><div><label>${t('pos.client.plate')}</label><input id="ppl" value="${esc(DR.plate)}" maxlength="15" autocomplete="off" style="text-transform:uppercase"></div></div><div class="fr2"><div><label>${t('remind.km')}</label><input id="pkm" inputmode="numeric" autocomplete="off" value="${esc(DR.km)}" maxlength="8"></div></div><small class="sub">${t('remind.saleHint')}</small>${chAllowed(u)?`<button class="btn ghost" id="phist" style="margin-top:10px">🕐 ${t('hist.open')}</button>`:''}<button class="btn gold bigb" id="psave" ${DR.cart.length?'':'disabled'}>${t('common.save')}</button>`;
 $$('[data-d]',c).forEach(b=>b.onclick=()=>{const x=DR.cart[+b.dataset.i];x.q+=+b.dataset.d;if(x.q<=0)DR.cart.splice(+b.dataset.i,1);else if(x.k==='p'){const p=D.P.find(y=>y.id===x.id);if(p&&DR.cart.filter(y=>y.id===x.id).reduce((a,y)=>a+y.q,0)>(+p.stock||0)){x.q--;say(t('err.stock'))}}keep();cartPaint()});
 $$('[data-rm]',c).forEach(b=>b.onclick=()=>{DR.cart.splice(+b.dataset.rm,1);keep();cartPaint()});
 $$('[data-rel]',c).forEach(b=>b.onclick=()=>{const m=addP(D.P.find(y=>y.id===b.dataset.rel));if(m&&m[0]!=='✓')say(m)});
 $$('[data-rx]',c).forEach(b=>b.onclick=()=>{RELX.add(b.dataset.rx);cartPaint()});
 $$('[data-pi]',c).forEach(i=>i.onchange=()=>{const v=parseFloat(String(i.value).replace(',','.'));if(v>=0)DR.cart[+i.dataset.pi].pr=v;keep();cartPaint()});
 $$('[data-pay]',c).forEach(b=>b.onclick=()=>{DR.pay=b.dataset.pay;keep();cartPaint()});
 if($('#pdis'))$('#pdis').onchange=e=>{DR.disc=e.target.value;keep();cartPaint()};if($('#ppa'))$('#ppa').onclick=promoApply;if($('#ppx'))$('#ppx').onclick=()=>{DR.promo=null;keep();cartPaint()};$('#pcl').onchange=e=>{DR.client=e.target.value;keep()};$('#pph').onchange=e=>{DR.phone=e.target.value;keep()};$('#ppl').onchange=e=>{DR.plate=e.target.value.toUpperCase();keep()};$('#pkm').onchange=e=>{DR.km=e.target.value;keep()};if($('#phist'))$('#phist').onclick=()=>chOpen(u,DR.phone||DR.plate||'');$('#psave').onclick=sell}
async function sell(){if(!DR.cart.length)return;const b=$('#psave');
 // v2.21-E3: phone, plate and mileage are optional; a wrong phone or mileage is rejected before the sale is saved or queued
 const wa=normalizeWhatsApp(DR.phone);if(!wa.ok)return say(t('err.clientPhone'));if(String(DR.km).trim()!==''&&!/^\d{1,7}$/.test(String(DR.km).replace(/\s/g,'')))return say(t('err.bad'));
 b.disabled=true;
 const pc=pOn()?DR.promo.code:'',snap={id:'',cart:DR.cart.map(x=>({...x})),disc:dsc(),promo:pc,pd:pdsc(),total:tot(),pay:DR.pay,pt:DR.pt,cl:DR.client},
  body={action:'sale_post',uuid:DR.uuid,point_id:DR.pt,discount:dsc(),promo:pc||undefined,pay:DR.pay,client:DR.client,phone:wa.value,plate:DR.plate,mileage:String(DR.km).replace(/\s/g,''),items:DR.cart.map(x=>({kind:x.k==='s'?'service':'product',id:x.id,qty:x.q,code:x.code||undefined,price:x.k==='s'?x.pr:undefined}))};
 try{const r=await post({...body,token:tk()});if(r.error==='auth')return location.reload();if(!r.ok){b.disabled=false;if(/^ERR_PROMO/.test(r.error||'')){DR.promo=null;keep();cartPaint()}if(r.error==='ERR_SHIFT')shiftBanner();return say(em(r.error))}
  snap.id=r.id;snap.total=r.total;if(r.discount!=null&&r.promo){snap.pd=Math.max(0,r.discount-snap.disc);snap.promo=r.promo}resetDraft();cartPaint();say(t('sale.saved'));load(true).catch(()=>{});showReceipt(snap)}
 catch(e){const q=queue();q.push({body,snap});ls.s(QK,JSON.stringify(q));resetDraft();say(t('net.offline'));cartPaint()}}
function resetDraft(){RELX.clear();Object.assign(DR,{cart:[],disc:'',client:'',phone:'',plate:'',km:'',promo:null,uuid:uid()});keep()}
// H2: продажа, отклонённая с ERR_SHIFT, остаётся в очереди с пометкой hold и не отправляется повторно, пока не откроют смену (проверка один раз за запуск flush, без цикла)
async function flush(){const q=queue();if(!q.length||!navigator.onLine)return;
 if(q.some(j=>j.hold)){const s=await post({action:'shift_current',token:tk()}).catch(()=>null);if(s&&s.ok&&(s.shift||!s.required||s.off))q.forEach(j=>{delete j.hold})}
 const rest=[];let held=0;
 for(const j of q){if(j.hold){rest.push(j);held++;continue}try{let r=await post({...j.body,token:tk()});if(!r.ok&&/^ERR_PROMO/.test(r.error||'')&&j.body.promo){const b2={...j.body};delete b2.promo;r=await post({...b2,token:tk()});say(t('promo.dropped'))}if(r.error==='auth'||(!r.ok&&!r.error)){rest.push(j);continue}if(!r.ok&&r.error==='ERR_SHIFT'){j.hold=1;rest.push(j);held++;continue}if(!r.ok)say(em(r.error))}catch(e){rest.push(j)}}
 ls.s(QK,JSON.stringify(rest));if(rest.length<q.length){load(true).catch(()=>{});say(t('sale.saved'))}if(held){say(t('err.shift')+'. '+t('shift.held',{n:held}));shiftBanner()}cartPaint()}
addEventListener('online',flush);
function rText(s){const pn=ptx((D.Pt||[]).find(x=>x.id===s.pt),'name'),o=['OilHub'+(pn?' · '+pn:''),fmtDateTime(new Date()),t('pos.receipt')+' № '+s.id,''];
 s.cart.forEach(x=>o.push(x.n+' × '+fmtNum(x.q)+' = '+fmtMoney(x.pr*x.q)));if(s.disc)o.push(t('pos.discount')+': −'+fmtMoney(s.disc));if(s.promo&&s.pd)o.push(t('promo.rcp',{code:s.promo})+': −'+fmtMoney(s.pd));if(s.cl)o.push('',s.cl);o.push('',t('pos.total')+': '+fmtMoney(s.total),t('pos.payment')+': '+t(s.pay==='card'?'pos.card':'pos.cash'));return o.join('\n')}
function showReceipt(s){const d=document.createElement('div');d.className='stm rcp';const tx_=rText(s);
 d.innerHTML=`<div class="panel"><h3>${t('sale.saved')}</h3><pre>${esc(tx_)}</pre><div class="pay"><button class="btn ghost" data-pr>${t('pos.print')}</button><a class="btn ghost" target="_blank" rel="noopener" href="${esc(waLink(((D.Pt||[]).find(p=>p.id===DR.pt)||{}).whatsapp||((D.St||[]).find(x=>x.key==='whatsapp')||{}).value,tx_)||'#')}">${t('pos.wa')}</a><button class="btn gold" data-x>${t('pos.new')}</button></div></div>`;
 document.body.appendChild(d);$('[data-x]',d).onclick=()=>d.remove();$('[data-pr]',d).onclick=()=>window.print()}
async function posInit(u){const el=$('#pos');if(!el)return;try{await load()}catch(e){el.innerHTML=errBox(e);return}
 if(!DR.pt)DR.pt=u.point_id||'';
 el.innerHTML=`<div class="pos-top"><input id="pq" type="search" placeholder="${esc(t('pos.search'))}" aria-label="${esc(t('common.search'))}" autocomplete="off"><button class="btn gold" id="psc">📷 ${t('pos.scan')}</button><button class="btn ghost" id="poil">🛢 ${t('selector.title')}</button></div>
  <div class="pos-pt">${t('pos.point')}: ${ptSel('ppt',DR.pt,u)}</div><div id="pr"></div>
  <h3 class="h3">${t('pos.services')}</h3><div class="chips">${D.S.filter(s=>!isOff(s)).map(s=>`<button class="btn ghost" data-s="${esc(s.id)}">${esc(tx(s,'name'))} · ${fmtMoney(+s.price||0)}</button>`).join('')}</div>
  <div class="panel" id="pc"></div>`;
 {const pcEl=$('#pc');if(!pcEl)return;pcEl._u=u}cartPaint();flush();shiftBanner(u);
 if($('#ppt'))$('#ppt').onchange=e=>{DR.pt=e.target.value;keep()};
 $$('[data-s]',el).forEach(b=>b.onclick=()=>addS(D.S.find(s=>s.id===b.dataset.s)));
 $('#pq').oninput=e=>{const q=norm(e.target.value);$('#pr').innerHTML=q?D.P.filter(p=>!isOff(p)&&norm([p.name,p.sku,p.barcode,p.sae].join(' ')).includes(q)).slice(0,8).map(p=>`<button class="row" data-p="${esc(p.id)}"><span>${esc(p.name)}<small>${esc(p.sku||'')} ${esc(p.sizes||'')}</small></span><b>${fmtMoney(+p.price||0)}</b><i>${t('pos.stock')}: ${fmtNum(+p.stock||0)}</i></button>`).join(''):'';
  $$('[data-p]',$('#pr')).forEach(b=>b.onclick=()=>{const m=addP(D.P.find(p=>p.id===b.dataset.p));if(m&&m[0]!=='✓')say(m)})};
 $('#psc').onclick=()=>Scanner.open({keep:true,onCode:scanPos});$('#poil').onclick=psOpen}
const isOff=o=>o.hasOwnProperty('active')&&!isOn(o.active);

// ===== A1. подбор масла по автомобилю в кассе =====
// Логика сопоставления общая с сайтом: selector-core.js (OilSel). Здесь только окно, цена, остаток и «Себетке қосу».
// Compat читается тем же action=list (лист публичный). Пустой Compat: «Әзірге бос». Корзина (DR) хранится отдельно и не теряется
// при смене языка: окно перерисовывается по событию langchange.
const PS={b:'',m:'',y:'',e:''};
const psProds=()=>(D.P||[]).filter(p=>!isOff(p));
function psCard(x,reqs){const p=x.p,st=+p.stock||0,ex=x.exact;
 return `<div class="ps-c ${ex?'ex':''}"><div class="ps-n"><b>${esc(p.name)}</b><span class="ch">${esc(p.sae||'')}</span></div>
  <div class="exb">${ex?'✓ '+t('selector.exact'):t('selector.partial')+' · '+x.m.length+'/'+reqs.length+' · '+t('selector.askExpert')}</div>
  <div>${appr(p).map(a=>`<span class="ch ${reqs.some(q=>norm(q)===norm(a))?'hl':''}">${esc(a)}</span>`).join('')}</div>
  <div class="ps-f"><span><b>${fmtMoney(+p.price||0)}</b><small>${t('pos.stock')}: ${fmtNum(st)}</small></span>
  <button class="btn gold" data-ps="${esc(p.id)}" ${st>0?'':'disabled'}>${st>0?t('pos.cart.add'):t('pos.outOfStock')}</button></div></div>`}
function psSel(id,lab,opts,val,L_){return `<div><label>${lab}</label><select id="${id}"><option value="">${t('common.choose')}</option>${opts.map(o=>`<option value="${esc(o)}" ${String(val)===String(o)?'selected':''}>${esc(L_?L_(o):o)}</option>`).join('')}</select></div>`}
function psDraw(){const box=$('#psb');if(!box)return;const C=D.Cp||[],st=OilSel.resolve(C,PS,psProds());
 if(st.state==='empty'){box.innerHTML=`<p class="note">${t('selector.emptyPos')}</p>`;return}
 box.innerHTML=`<div class="fr2">${psSel('psb1',t('car.brand'),OilSel.brands(C),PS.b)}${psSel('psm1',t('car.model'),OilSel.models(C,PS.b),PS.m)}${psSel('psy1',t('car.year'),OilSel.years(C,PS.b,PS.m),PS.y)}${psSel('pse1',t('car.engine'),OilSel.engines(C,PS.b,PS.m,PS.y),PS.e,OilSel.engLabel)}</div><div id="psr"></div>`;
 const R=$('#psr');
 if(st.state==='nocar')R.innerHTML=`<p class="note">${t('selector.noCar')}</p>`;
 else if(st.state==='ok'){const r=st.result;
  R.innerHTML=`<p style="margin-top:14px"><b>${t('selector.required')}</b> ${st.reqs.map(x=>`<span class="ch hl">${esc(x)}</span>`).join('')}${st.sae?`<span class="ch hl">SAE ${esc(st.sae)}</span>`:''}</p>${st.car.note?`<p class="note">${esc(st.car.note)}</p>`:''}${r.exact?'':`<p class="note">${t(r.list.length?'selector.noExact':'selector.noExactNone')}</p>`}${r.list.map(x=>psCard(x,st.reqs)).join('')}`;
  $$('[data-ps]',R).forEach(b=>b.onclick=()=>{const m=addP(D.P.find(p=>p.id===b.dataset.ps));say(m)})}
 const on=(id,fn)=>{$('#'+id).onchange=e=>{fn(e.target.value);psDraw()}};
 on('psb1',v=>{PS.b=v;PS.m=PS.y=PS.e=''});on('psm1',v=>{PS.m=v;PS.y=PS.e=''});on('psy1',v=>{PS.y=v;PS.e=''});on('pse1',v=>{PS.e=v})}
function psPaint(){const d=$('#psm');if(!d)return;d.innerHTML=`<div class="panel ps"><div class="ps-h"><h3>${t('selector.title')}</h3><button class="btn ghost" data-x>${t('common.close')}</button></div><div id="psb">${sk}</div></div>`;
 $('[data-x]',d).onclick=()=>d.remove();psDraw()}
async function psOpen(){if($('#psm'))return;const d=document.createElement('div');d.className='stm';d.id='psm';document.body.appendChild(d);psPaint();
 if(!D.Cp){try{D.Cp=await lst('Compat')}catch(e){const b=$('#psb');if(b)b.innerHTML=errBox(e);return}}
 psDraw()}
document.addEventListener('langchange',()=>{if($('#psm'))psPaint()});

/* v2.21-E6: if the shop requires shifts and the cashier has no open shift, show a hint above the cart (the server enforces the rule with ERR_SHIFT) */
let SHU=null;
async function shiftBanner(u){if(u)SHU=u;const r=await post({action:'shift_current',token:tk()}).catch(()=>null);const c=$('#pc');if(!c||!c.isConnected)return;const old=$('#shb');if(old)old.remove();if(!r||!r.ok||r.off||!r.required||r.shift)return;
 const held=queue().filter(j=>j.hold).length;
 c.insertAdjacentHTML('beforebegin',`<div id="shb" class="note" style="border-color:#d9534f"><p>${t('shift.banner')}</p>${held?`<p>${esc(t('shift.held',{n:held}))}</p>`:''}<a class="btn gold" href="#/shift">${t('shift.open')}</a></div>`)}
document.addEventListener('langchange',()=>{if($('#shb'))shiftBanner(SHU)});
/* ===== товары (только просмотр) ===== */
async function prodInit(){const el=$('#pv');if(!el)return;try{await load()}catch(e){el.innerHTML=errBox(e);return}
 let q='',c='';const draw=()=>{const k=norm(q);$('#pl').innerHTML=D.P.filter(p=>!isOff(p)&&(!c||p.cat===c)&&(!k||norm([p.name,p.sku,p.barcode].join(' ')).includes(k))).slice(0,150).map(p=>`<tr><td>${esc(p.name)}<br><small>${esc(p.sku||'')}</small></td><td>${esc(p.sizes||'')}</td><td>${p.price!=null?fmtMoney(+p.price||0):''}</td><td>${fmtNum(+p.stock||0)}</td></tr>`).join('')||`<tr><td colspan="4">${t('common.empty')}</td></tr>`};
 el.innerHTML=`<div class="bar"><input id="pvq" type="search" placeholder="${esc(t('pos.search'))}"><button class="btn gold" id="pvs">📷 ${t('pos.scan')}</button><select id="pvc"><option value="">${t('common.all')}</option>${D.C.map(x=>`<option value="${esc(x.id)}">${esc(tx(x,'name'))}</option>`).join('')}</select></div><div class="panel tw"><table class="tb"><tr><th>${t('pos.sale')}</th><th>${t('common.sizes')}</th><th>${t('pos.price')}</th><th>${t('pos.stock')}</th></tr><tbody id="pl"></tbody></table></div>`;draw();
 $('#pvq').oninput=e=>{q=e.target.value;draw()};$('#pvc').onchange=e=>{c=e.target.value;draw()};
 $('#pvs').onclick=()=>Scanner.open({onCode:code=>{$('#pvq').value=q=code;draw()}})}

/* ===== записи ===== */
async function bkInit(u){const el=$('#bk');if(!el)return;try{await load();const B=(await lst('Bookings')).sort((a,b)=>(a.date+a.time)<(b.date+b.time)?1:-1);
 el.innerHTML=`<div class="panel tw"><table class="tb"><tr><th>${t('common.date')}</th><th>${t('common.client')}</th><th>${t('common.service')}</th><th>${t('common.status')}</th></tr>${B.slice(0,100).map(b=>`<tr><td>${fmtDate(b.date)}<br>${fmtTime(b.time)}</td><td>${esc(b.name)}<br><a href="tel:${esc(b.phone)}">${esc(b.phone)}</a><br><small>${esc([b.brand,b.model,b.plate].filter(Boolean).join(' '))}</small></td><td>${esc(tx(D.S.find(s=>s.id===b.service_id)||{},'name'))}</td><td><select data-st="${esc(b.id)}">${['new','confirmed','work','done','cancel'].map(k=>`<option value="${k}" ${b.status===k?'selected':''}>${t('st.'+k)}</option>`).join('')}</select></td></tr>`).join('')||`<tr><td colspan="4">${t('common.empty')}</td></tr>`}</table></div>`;
 $$('[data-st]',el).forEach(s=>s.onchange=async()=>{const r=await post({action:'upsert',sheet:'Bookings',row:{id:s.dataset.st,status:s.value},token:tk()});say(r.error?em(r.error):t('common.save')+' ✓')})}catch(e){el.innerHTML=errBox(e)}}

/* ===== мои продажи ===== */
async function msInit(u){const el=$('#ms');if(!el)return;try{const S=(await lst('Sales')).filter(s=>s.staff_id===u.id&&s.total!=null&&s.total!=='').sort((a,b)=>b.id<a.id?-1:1);
 el.innerHTML=`<div class="panel tw"><table class="tb"><tr><th>${t('common.date')}</th><th>${t('pos.total')}</th><th>${t('pos.payment')}</th><th>${t('common.status')}</th></tr>${S.slice(0,100).map(s=>`<tr><td>${fmtDate(s.date)}<br><small>${esc(s.id)}</small></td><td><b>${fmtMoney(+s.total||0)}</b></td><td>${t(s.pay==='card'?'pos.card':'pos.cash')}</td><td>${t(s.status==='void'?'sale.void':'sale.posted')}</td></tr>`).join('')||`<tr><td colspan="4">${t('common.empty')}</td></tr>`}</table></div>`}catch(e){el.innerHTML=errBox(e)}}

/* ===== клиенты: история обслуживания (E2). Права проверяет сервер (client_history): записи — manage_bookings, продажи — sell или view_reports ===== */
const chAllowed=u=>can(u,'manage_bookings')||can(u,'sell')||can(u,'view_reports');
const chCall=async b=>{const r=await post({...b,token:tk()});if(r.error==='auth')location.reload();return r};
function chOpen(u,q){if($('#chm'))return;const d=document.createElement('div');d.className='stm';d.id='chm';
 d.innerHTML=`<div class="panel ps"><div class="ps-h"><h3>${t('hist.title')}</h3><button class="btn ghost" data-x>${t('common.close')}</button></div><div id="chb"></div></div>`;
 document.body.appendChild(d);$('[data-x]',d).onclick=()=>d.remove();ClientHist.mount($('#chb'),{call:chCall,user:u,q})}
document.addEventListener('langchange',()=>{const d=$('#chm');if(d)d.remove()});
function chInit(u){const el=$('#chv');if(el)ClientHist.mount(el,{call:chCall,user:u})}

/* ===== приход товара ===== */
const RC={pt:'',sup:'',inv:'',pid:'',cost:'',lines:[],uuid:uid()};
function curLine(){const p=D.P.find(x=>x.id===RC.pid);if(!p)return null;let l=RC.lines.find(x=>x.pid===p.id);if(!l){l={pid:p.id,n:p.name,codes:[],qty:0,cost:RC.cost};RC.lines.push(l)}return l}
async function rcScan(code){const l=curLine();if(!l)return t('rc.pick');if(RC.lines.some(x=>x.codes.includes(code)))return t('barcode.dup');
 const r=await post({action:'lookup',token:tk(),code}).catch(()=>({error:'net'}));
 if(r.ok){if(r.unit||r.product.id!==RC.pid)return t('barcode.dup');l.qty++;rcLines();return t('rc.skuPlus',{code})} /* код SKU: количество без привязки */
 if(r.error!=='ERR_NOT_FOUND')return em(r.error);
 l.codes.push(code);if(!l.cost)l.cost=RC.cost;rcLines();return '✓ '+code}
function rcLines(){const el=$('#rl');if(!el)return;el.innerHTML=RC.lines.map((l,i)=>`<div class="cl"><span class="cn">${esc(l.n)}<small> ${t('rc.units',{n:l.codes.length+l.qty})}</small></span><span>${l.codes.length?l.codes.length+' ▮':''}</span><button class="x" data-rm="${i}" aria-label="${t('common.close')}">✕</button></div>`).join('')||`<p class="sub">${t('common.empty')}</p>`;
 $$('[data-rm]',el).forEach(b=>b.onclick=()=>{RC.lines.splice(+b.dataset.rm,1);rcLines()});const s=$('#rsave');if(s)s.disabled=!RC.lines.length;const lb=$('#rlb');if(lb)lb.disabled=!RC.lines.length}
/* окно этикеток: товары и количества текущего прихода; запросы с токеном сотрудника */
const rcLabelItems=()=>{const m=new Map();RC.lines.forEach(l=>{const p=D.P.find(x=>x.id===l.pid);if(p)m.set(p.id,{product:p,copies:(m.has(p.id)?m.get(p.id).copies:0)+Math.max(1,l.codes.length+l.qty)})});return[...m.values()]},
 lbCall=async b=>{const r=await post({...b,token:tk()});if(r.error==='auth'){location.reload();throw new Error('auth')}return r};
async function rcInit(u){const el=$('#rc');if(!el)return;try{await load()}catch(e){el.innerHTML=errBox(e);return}
 if(!RC.pt)RC.pt=u.point_id||'';
 el.innerHTML=`<div class="panel"><label>${t('pos.warehouse')}</label>${ptSel('rpt',RC.pt,u)}<label>${t('pos.supplier')}</label><input id="rsu" value="${esc(RC.sup)}" maxlength="120"><label>${t('pos.invoice')}</label><input id="rin" value="${esc(RC.inv)}" maxlength="60">
  <label>${t('pos.sale')}</label><input id="rq" type="search" placeholder="${esc(t('common.search'))}" autocomplete="off"><select id="rp" size="4" style="margin-top:8px"></select>
  <div class="pay" style="margin-top:12px"><button class="btn gold" id="rsc">📷 ${t('pos.scan')}</button></div>
  <label>${t('pos.manual')}: ${t('pos.qty')}</label><div class="pay"><input id="rn" inputmode="numeric" placeholder="${esc(t('pos.qty'))}"><input id="rco" inputmode="decimal" placeholder="${esc(t('rc.cost'))}" value="${esc(RC.cost)}"><button class="btn ghost" id="rad">${t('common.add')}</button></div></div>
  <div class="panel" style="margin-top:14px"><h3>${t('rc.lines')}</h3><div id="rl"></div>${LabelsUI.canUse(u)?`<button class="btn ghost bigb" id="rlb" disabled>🏷 ${t('label.btn')}</button>`:''}<button class="btn gold bigb" id="rsave" disabled>${t('common.save')}</button></div>`;
 const fill=()=>{const k=norm($('#rq').value);$('#rp').innerHTML=D.P.filter(p=>!k||norm([p.name,p.sku,p.barcode].join(' ')).includes(k)).slice(0,40).map(p=>`<option value="${esc(p.id)}" ${p.id===RC.pid?'selected':''}>${esc(p.name)}</option>`).join('')};fill();rcLines();
 $('#rq').oninput=fill;$('#rp').onchange=e=>{RC.pid=e.target.value};if($('#rpt'))$('#rpt').onchange=e=>{RC.pt=e.target.value};
 $('#rsu').onchange=e=>RC.sup=e.target.value;$('#rin').onchange=e=>RC.inv=e.target.value;$('#rco').onchange=e=>RC.cost=e.target.value;
 if($('#rlb'))$('#rlb').onclick=()=>LabelsUI.open({user:u,items:rcLabelItems(),call:lbCall});
 $('#rsc').onclick=()=>{if(!curLine())return say(t('rc.pick'));Scanner.open({keep:true,onCode:rcScan})};
 $('#rad').onclick=()=>{const l=curLine(),n=parseInt($('#rn').value,10);if(!l)return say(t('rc.pick'));if(!(n>0))return say(t('err.bad'));l.qty+=n;l.cost=$('#rco').value||l.cost;$('#rn').value='';rcLines()};
 $('#rsave').onclick=async()=>{if(!RC.pt)return say(t('rc.noPoint'));const b=$('#rsave');b.disabled=true;const lines=[];
  RC.lines.forEach(l=>{if(l.codes.length)lines.push({product_id:l.pid,codes:l.codes,cost:l.cost});if(l.qty>0)lines.push({product_id:l.pid,qty:l.qty,cost:l.cost})});
  const r=await post({action:'receipt_post',token:tk(),uuid:RC.uuid,point_id:RC.pt,supplier:RC.sup,invoice:RC.inv,lines}).catch(()=>({error:'net'}));
  if(!r.ok){b.disabled=false;return say(r.error==='ERR_BARCODE_DUP'?t('barcode.dup')+': '+r.code:em(r.error))}
  say(t('rc.done'));Object.assign(RC,{pid:'',cost:'',lines:[],uuid:uid(),inv:''});load(true).catch(()=>{});rcInit(u)}}

const STAFF_CFG={app:'staff',allowed:['seller','manager','admin'],other:{url:'./admin.html',key:'gate.goAdmin'},def:'pos',
 routes:{pos:{k:'nav.pos'},shift:{k:'nav.shift',perm:'sell'},products:{k:'nav.products'},bookings:{k:'nav.bookings'},'my-sales':{k:'nav.mySales'},clients:{k:'nav.clients',perm:['manage_bookings','sell','view_reports']},remind:{k:'nav.remind',perm:['manage_bookings','view_reports']},receipt:{k:'pos.income',perm:'create_receipt'},inventory:{k:'nav.inventory',perm:'edit_stock'}},
 nav:[['pos','nav.pos'],['shift','nav.shift'],['products','nav.products'],['bookings','nav.bookings'],['my-sales','nav.mySales'],['clients','nav.clients'],['remind','nav.remind'],['receipt','pos.income'],['inventory','nav.inventory']],
 views:{pos:(c,u)=>{queueMicrotask(()=>posInit(u));return `<div id="pos">${sk}</div>`},
  shift:(c,u)=>{queueMicrotask(async()=>{const el=$('#shf');if(!el)return;try{await load()}catch(e){el.innerHTML=errBox(e);return}Shifts.mount(el,{call:b=>post({...b,token:tk()}).then(r=>{if(r.error==='auth')location.reload();return r}).catch(()=>({error:'net'})),err:em,say,user:u,points:()=>D.Pt||[],pending:()=>queue().length,opened:()=>flush()})});return `<div id="shf">${sk}</div>`},
  products:()=>{queueMicrotask(prodInit);return `<div id="pv">${sk}</div>`},
  bookings:(c,u)=>{queueMicrotask(()=>bkInit(u));return `<div id="bk">${sk}</div>`},
  'my-sales':(c,u)=>{queueMicrotask(()=>msInit(u));return `<div id="ms">${sk}</div>`},
  remind:(c,u)=>{queueMicrotask(()=>{const el=$('#rm');if(el)Remind.mount(el,{call:b=>post({...b,token:tk()}).then(r=>{if(r.error==='auth')location.reload();return r}).catch(()=>({error:'net'})),err:em,say,canSettings:false})});return `<div id="rm">${sk}</div>`},
  clients:(c,u)=>{if(!chAllowed(u))return `<p class="note" style="border-color:#d9534f">${t('err.forbidden')}</p>`;queueMicrotask(()=>chInit(u));return `<h1 style="font-size:30px">${t('hist.title')}</h1><div id="chv"></div>`},
  inventory:(c,u)=>{if(!can(u,'edit_stock'))return `<p class="note" style="border-color:#d9534f">${t('err.forbidden')}</p>`;queueMicrotask(()=>{const el=$('#iv');if(el)Inventory.mount(el,{call:b=>post({...b,token:tk()}).then(r=>{if(r.error==='auth')location.reload();return r}).catch(()=>({error:'net'})),err:em,say,user:u})});return `<div id="iv">${sk}</div>`},
  receipt:(c,u)=>{if(!can(u,'create_receipt'))return `<p class="note" style="border-color:#d9534f">${t('err.forbidden')}</p>`;queueMicrotask(()=>rcInit(u));return `<div id="rc">${sk}</div>`}}};
appShell(STAFF_CFG).start();

/* Несохранённые данные прихода кассы (черновик прихода в localStorage не хранится) */
window.OH_DIRTY=window.OH_DIRTY||[];window.OH_DIRTY.push(function(){return RC.lines.length>0});
window.OH_DIRTY.push(function(){return typeof Inventory!=='undefined'&&Inventory.dirty()});
