/* admin.js: admin.html. Дашборд (этап F), каталог (этапы B1, B2): десять разделов на общих таблице и форме, загрузка файлов, двуязычные поля kk→ru; сотрудники и права (раздел 3). Тексты только через i18n.js (admin.*) */

/* ===== каталог: описание разделов (метки — ключи словаря). cf: обычное поле, cb: пара _kk/_ru (казахский идёт первым) ===== */
const cf=(k,ty,l,x)=>Object.assign({k,ty,l},x||{}),cb=(k,ty,l,h,rk)=>({k,ty,l,bi:1,h,rk}),

 // F1: имя русской колонки пары: по умолчанию k_ru, у Points (name, address, hours) без суффикса
 brk=f=>f.rk||f.k+'_ru',
 CAT={
  Products:{t:'nav.products',f:[cf('id','t','admin.f.id'),cf('cat','r','admin.f.cat',{o:'Categories'}),cf('slug','t','admin.f.slug',{h:'admin.hint.latin'}),cf('name','t','admin.f.name'),cf('brand','t','admin.f.brand'),cf('sku','t','admin.f.sku'),cf('price','n','admin.f.price'),cf('old_price','n','admin.f.oldPrice'),cf('stock','n','admin.f.stock'),cf('barcode','t','admin.f.barcode',{h:'label.hint',h2:1}),cf('sae','t','admin.f.sae'),cf('approvals','a','admin.f.approvals',{h:'admin.hint.semi'}),cf('related','a','admin.f.related',{h:'admin.hint.related',rel:1}),cf('sizes','t','common.sizes',{h:'admin.hint.semi'}),cb('short','a','admin.f.short'),cb('desc','a','admin.f.desc'),cb('apps','a','admin.f.apps','admin.hint.lines'),cb('features','a','admin.f.features','admin.hint.lines'),cf('typical','a','admin.f.typical'),cf('image','i','admin.f.image'),cf('doc','i','admin.f.doc'),cf('is_new','b','admin.f.isNew'),cf('is_popular','b','admin.f.isPopular'),cf('active','b','admin.f.active'),cf('sort','n','admin.f.sort')]},
  Categories:{t:'nav.categories',f:[cf('id','t','admin.f.id'),cf('slug','t','admin.f.slug'),cb('name','t','admin.f.name'),cb('desc','a','admin.f.desc'),cf('remind','b','admin.f.remind'),cf('active','b','admin.f.active'),cf('sort','n','admin.f.sort')]},
  Services:{t:'nav.services',f:[cf('id','t','admin.f.id'),cf('slug','t','admin.f.slug'),cb('name','t','admin.f.name'),cb('desc','a','admin.f.desc'),cb('includes','a','admin.f.includes','admin.hint.lines'),cb('benefits','a','admin.f.features','admin.hint.lines'),cf('price','n','admin.f.price'),cf('price_from','b','admin.f.priceFrom'),cf('duration','n','admin.f.duration'),cf('image','i','admin.f.image'),cf('popular','b','admin.f.popular'),cf('remind','b','admin.f.remind'),cf('active','b','admin.f.active'),cf('sort','n','admin.f.sort')]},
  Promos:{t:'nav.promo',f:[cf('id','t','admin.f.id'),cb('title','t','admin.f.name'),cb('text','a','admin.f.desc'),cf('image','i','admin.f.image'),cf('old_price','n','admin.f.oldPrice'),cf('new_price','n','admin.f.newPrice'),cf('start','d','admin.f.start'),cf('end','d','admin.f.end'),cf('product_id','r','admin.f.product',{o:'Products'}),cf('active','b','admin.f.active'),cf('sort','n','admin.f.sort')]},
  // v2.21-E4: промокоды кассы (лист Promocodes, только admin и manager). ro: поле только для чтения, счётчик ведёт сервер
  Promocodes:{t:'nav.promocodes',cols:['code','type','value','min_total','start','end','uses','max_uses','active'],f:[cf('id','t','admin.f.id'),cf('code','t','admin.f.promoCode',{h2:1}),cf('type','s','admin.f.type',{o:['percent','fixed'],ol:'promo.type.',h2:1}),cf('value','n','admin.f.discValue'),cf('min_total','n','admin.f.minTotal'),cf('start','d','admin.f.start'),cf('end','d','admin.f.end'),cf('max_uses','n','admin.f.maxUses'),cf('uses','n','admin.f.uses',{ro:1}),cf('note','t','admin.f.note'),cf('active','b','admin.f.active')]},
  Ads:{t:'nav.ads',f:[cf('id','t','admin.f.id'),cf('type','s','admin.f.type',{o:['main','card','offer','notice']}),cb('title','t','admin.f.title'),cb('text','a','admin.f.text'),cf('image','i','admin.f.picture'),cb('btn','t','admin.f.btn'),cf('link','t','admin.f.link'),cf('start','d','admin.f.start'),cf('end','d','admin.f.end'),cf('active','b','admin.f.active'),cf('sort','n','admin.f.sort')]},
  /* этап B2. h2: поле в половину ширины формы; show: «длинное» поле тоже в таблице; key: ключевая колонка листа (по умолчанию id); cols: свой набор колонок таблицы; def: значения новой записи */
  News:{t:'nav.news',f:[cf('id','t','admin.f.id'),cf('date','d','common.date'),cb('title','t','admin.f.title'),cb('text','a','admin.f.text'),cf('image','i','admin.f.picture'),cf('active','b','admin.f.active')]},
  Reviews:{t:'nav.reviews',f:[cf('id','t','admin.f.id'),cf('name','t','admin.f.clientName'),cb('text','a','admin.f.review'),cf('rating','n','admin.f.rating'),cf('active','b','admin.f.active'),cf('sort','n','admin.f.sort')]},
  Points:{t:'nav.points',f:[cf('id','t','admin.f.id'),cb('name','t','admin.f.pointName',null,'name'),cf('city','t','admin.f.city',{h2:1}),cb('address','t','admin.f.address',null,'address'),cf('phone','t','admin.f.phone',{h2:1}),cf('whatsapp','t','admin.f.whatsapp',{h2:1}),cf('tg_chat','t','admin.f.tgChat',{h2:1}),cb('hours','t','admin.f.hours',null,'hours'),cf('map','t','admin.f.map'),cf('active','b','admin.f.active'),cf('sort','n','admin.f.sort')]},
  Settings:{t:'nav.settings',key:'key',f:[cf('key','t','admin.f.param'),cf('value','a','admin.f.value',{show:1})]},
  Bookings:{t:'nav.bookings',cols:['date','time','name','phone','service_id','point_id','car','status'],
   def:r=>{r.status='new';r.created=today()},
   f:[cf('id','t','admin.f.id'),cf('created','t','admin.f.created',{h2:1}),cf('name','t','common.client'),cf('phone','t','admin.f.phone',{h2:1}),cf('service_id','r','common.service',{o:'Services'}),cf('point_id','r','pos.point',{o:'Points'}),cf('date','d','common.date'),cf('time','t','booking.time',{h2:1}),cf('brand','t','booking.carBrand',{h2:1}),cf('model','t','car.model',{h2:1}),cf('year','t','car.year',{h2:1}),cf('plate','t','booking.plate',{h2:1}),cf('mileage','n','remind.km'),cf('comment','a','booking.comment'),cf('status','s','common.status',{o:['new','confirmed','work','done','cancel'],ol:'st.',inl:1}),cf('lang','t','admin.f.lang',{h2:1})]}},
 CGS={rows:{},fl:{}},LBSEL=new Set(),lbTxt=()=>LBSEL.size?t('label.selected',{n:LBSEL.size}):t('label.btn'),
 keyOf=sh=>CAT[sh].key||'id';

/* ===== двуязычные поля (п. 2.7): состояние пары, полнота перевода ===== */
/* empty: оба пусты; missing: есть русский, нет казахского; same: казахское поле совпадает с русским (скопировано, но не переведено); ok: готово */
const trPair=(kk,ru)=>!kk&&!ru?'empty':!kk?'missing':(kk===ru&&/[\u0400-\u04FF]/.test(ru))?'same':'ok',
 trStat=(sh,r)=>{let need=0,done=0;const miss=[];CAT[sh].f.filter(f=>f.bi).forEach(f=>{const s=trPair(String(r[f.k+'_kk']||'').trim(),String(r[brk(f)]||'').trim());if(s==='empty')return;need++;if(s==='ok')done++;else miss.push(f.k)});return{need,done,miss}},
 trCls=(n,m)=>!m?'':n===m?'ok':n?'warn':'none';

/* ===== загрузка данных раздела и вспомогательные ===== */
const cgLab=(sh,id)=>{const r=(CGS.rows[sh]||[]).find(x=>x.id===id);return r?(tx(r,'name')||r.name||tx(r,'title')||r.id):(id||'')};
async function cgFetch(sh){const need=[...new Set([sh,...CAT[sh].f.filter(f=>f.ty==='r').map(f=>f.o)])];
 const rs=await Promise.all(need.map(n=>adCall({action:'list',sheet:n}).then(r=>({n,r}))));let err='';
 rs.forEach(({n,r})=>{if(r.error){if(n===sh)err=r.error;else CGS.rows[n]=[]}else CGS.rows[n]=r.rows||[]});return err}
const cgColLab=c=>c.l?`${t(c.f.l)} ${t('admin.lang.'+c.l+'S')}`:t(c.f.l);
const CAR={k:'car',ty:'car',l:'car.car'};
function cgCols(sh){const S=CAT[sh];if(S.cols)return S.cols.map(k=>({k,f:k==='car'?CAR:S.f.find(f=>f.k===k)}));
 const o=[];S.f.forEach(f=>{if(f.k==='id')return;if(f.bi){if(f.ty==='t')o.push({k:f.k+'_kk',f,l:'kk'},{k:brk(f),f,l:'ru'});return}if(f.ty!=='a'||f.show)o.push({k:f.k,f})});return o.slice(0,7)}
/* r — вся строка: нужна для сводной колонки «автомобиль» и для выбора статуса записи прямо в таблице */
function cgCell(f,v,r){const ty=f.ty;if(ty==='car')return esc([r.brand,r.model,r.year,r.plate].filter(Boolean).join(' '));
 if(f.inl)return `<select class="stl ${f.k==='status'?'st-'+esc(v):''}" data-st="${esc(r.id)}" aria-label="${esc(t(f.l))}">${(v&&f.o.indexOf(v)<0?[v,...f.o]:f.o).map(x=>`<option value="${esc(x)}" ${v===x?'selected':''}>${esc(f.ol?t(f.ol+x):x)}</option>`).join('')}</select>`;
 if(f.k==='time'&&v)return esc(fmtTime(v));
 if(ty==='s'&&f.ol)return esc(v?t(f.ol+v):'');if(ty==='b')return isOn(v)?'✓':'—';if(ty==='i')return v?(/\.pdf|docs\//i.test(v)?'📄':`<img class="th" src="${esc(v)}" alt="">`):'';if(ty==='r')return esc(cgLab(f.o,v));if(ty==='d')return esc(v?fmtDate(v):'');if(/^(price|old_price|new_price)$/.test(f.k)&&v!==''&&v!=null)return esc(fmtMoney(v));return esc(String(v==null?'':v).slice(0,48))}
function catView(sh,u){queueMicrotask(()=>catInit(sh,u));return `<div id="cg" data-sh="${sh}"><div class="sk" style="height:200px"></div></div>`}
async function catInit(sh,u){const el=$('#cg');if(!el||el.dataset.sh!==sh)return;const err=await cgFetch(sh),e2=$('#cg');if(!e2||e2.dataset.sh!==sh)return;
 if(err){e2.innerHTML=`<p class="note" style="border-color:#d9534f">${esc(adErr(err))}</p>`;return}cgList(e2,sh,u)}
async function cgReload(sh,u){const err=await cgFetch(sh),el=$('#cg');if(!el||el.dataset.sh!==sh)return;if(err)return adSay(adErr(err));cgList(el,sh,u)}
async function cgSave(sh,u,row,msg){const r=await adCall({action:'upsert',sheet:sh,row});if(!r.ok){adSay(adErr(r.error));return false}adSay(msg||t('staff.saved'));await cgReload(sh,u);return true}

/* ===== записи на услуги: фильтры «дата / статус / услуга», порядок по дате и времени (как в старой админке) ===== */
const BK_D=[['','common.all'],['t','admin.bk.today'],['tm','admin.bk.tomorrow'],['w','admin.bk.week'],['m','admin.bk.month']],
 dayAdd=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())};
function bkRows(rows,f){const td=today(),d1=dayAdd(1),d7=dayAdd(7),d30=dayAdd(30);
 return rows.filter(r=>(!f.s||r.status===f.s)&&(!f.v||r.service_id===f.v)&&(!f.d||(f.d==='t'?r.date===td:f.d==='tm'?r.date===d1:f.d==='w'?(r.date>=td&&r.date<=d7):(r.date>=td&&r.date<=d30)))).sort((a,b)=>(a.date+a.time)>(b.date+b.time)?1:-1)}
const bkBar=f=>`<div class="bar">${BK_D.map(([k,l])=>`<button class="btn ${f.d===k?'gold':'ghost'}" style="padding:9px 16px" data-fd="${k}" aria-pressed="${f.d===k}">${t(l)}</button>`).join('')}<select id="fst" aria-label="${esc(t('common.status'))}"><option value="">${t('admin.bk.allSt')}</option>${['new','confirmed','work','done','cancel'].map(k=>`<option value="${k}" ${f.s===k?'selected':''}>${t('st.'+k)}</option>`).join('')}</select><select id="fsv" aria-label="${esc(t('common.service'))}"><option value="">${t('admin.bk.allSv')}</option>${(CGS.rows.Services||[]).map(s=>`<option value="${esc(s.id)}" ${f.v===s.id?'selected':''}>${esc(cgLab('Services',s.id))}</option>`).join('')}</select></div>`;

/* ===== таблица раздела ===== */
function cgList(el,sh,u){const S=CAT[sh],sc=S.f,hasSort=sc.some(f=>f.k==='sort'),hasAct=sc.some(f=>f.k==='active'),hasBi=sc.some(f=>f.bi),fl=CGS.fl[sh]||(CGS.fl[sh]={nk:false,d:'',s:'',v:''}),K=keyOf(sh),isBk=sh==='Bookings',
 full=hasSort?[...(CGS.rows[sh]||[])].sort((a,b)=>(+a.sort||0)-(+b.sort||0)):[...(CGS.rows[sh]||[])],
 nkN=hasBi?full.filter(r=>trStat(sh,r).miss.length).length:0,rows=hasBi&&fl.nk?full.filter(r=>trStat(sh,r).miss.length):isBk?bkRows(full,fl):full,cs=cgCols(sh),canDel=(u.perms||[]).includes('delete_records'),
 lbOn=sh==='Products'&&LabelsUI.canUse(u),seed=u.role==='admin'&&!full.length&&typeof SEED!=='undefined'&&SEED[sh]&&SEED[sh].length;
 el.innerHTML=`<div class="cg-h"><h1>${t(S.t)}</h1><div class="cg-b">${lbOn?`<button class="btn ghost" id="cg-lb" ${LBSEL.size?'':'disabled'}>🏷 ${lbTxt()}</button>`:''}${seed?`<button class="btn ghost" id="cg-imp">⤓ ${t('admin.seed')}</button>`:''}<button class="btn gold" id="cg-add">+ ${t('common.add')}</button></div></div>
 ${hasBi?`<div class="bar"><button class="btn ${fl.nk?'gold':'ghost'}" style="padding:9px 16px" data-nk aria-pressed="${fl.nk}">${t('admin.tr.filter')} · ${fmtNum(nkN)}</button></div>`:''}${isBk?bkBar(fl):''}
 <div class="panel tw" style="padding:10px"><table class="tb"><tr>${lbOn?`<th><input type="checkbox" data-lball aria-label="${esc(t('label.all'))}" ${rows.length&&rows.every(r=>LBSEL.has(r[K]))?'checked':''}></th>`:''}${cs.map(c=>`<th>${cgColLab(c)}</th>`).join('')}${hasBi?`<th>${t('admin.tr.col')}</th>`:''}<th></th></tr>${rows.map(r=>{const id=esc(r[K]),st=hasBi?trStat(sh,r):null;
  return `<tr>${lbOn?`<td><input type="checkbox" data-lbsel="${id}" aria-label="${esc(t('label.pick'))}" ${LBSEL.has(r[K])?'checked':''}></td>`:''}${cs.map(c=>`<td>${cgCell(c.f,r[c.k],r)}</td>`).join('')}${hasBi?`<td>${st.need?`<span class="tr ${trCls(st.done,st.need)}" title="${esc(t('admin.tr.tip',{n:st.done,m:st.need}))}">${t('admin.tr.count',{n:st.done,m:st.need})}</span>`:'—'}</td>`:''}<td><div class="ab">${hasSort&&!fl.nk?`<button data-mv="-1" data-id="${id}" title="${esc(t('admin.up'))}" aria-label="${esc(t('admin.up'))}">▲</button><button data-mv="1" data-id="${id}" title="${esc(t('admin.down'))}" aria-label="${esc(t('admin.down'))}">▼</button>`:''}${hasAct?`<button data-tg="${id}" title="${esc(t('admin.toggle'))}" aria-label="${esc(t('admin.toggle'))}">${isOn(r.active)?'👁':'🚫'}</button>`:''}${isBk&&r.phone?`<a target="_blank" rel="noopener" href="https://wa.me/${esc(String(r.phone).replace(/\D/g,''))}" aria-label="WhatsApp">WA</a>`:''}${lbOn?`<button data-lb="${id}" title="${esc(t('label.row'))}" aria-label="${esc(t('label.row'))}">🏷</button>`:''}<button data-ed="${id}" title="${esc(t('common.edit'))}" aria-label="${esc(t('common.edit'))}">✎</button>${canDel?`<button class="dl" data-dl="${id}" title="${esc(t('common.delete'))}" aria-label="${esc(t('common.delete'))}">✕</button>`:''}</div></td></tr>`}).join('')||`<tr><td colspan="${cs.length+(hasBi?2:1)+(lbOn?1:0)}">${t('common.empty')}</td></tr>`}</table></div>`;
 const get=id=>(CGS.rows[sh]||[]).find(r=>r[K]===id);
 const lbOpen=ps=>LabelsUI.open({user:u,items:ps.map(product=>({product,copies:1})),call:adCall,onCodes:()=>{const e2=$('#cg');if(e2&&e2.dataset.sh===sh)cgList(e2,sh,u)}});
 if(lbOn){const lbBtn=$('#cg-lb',el);lbBtn.onclick=()=>lbOpen([...LBSEL].map(get).filter(Boolean));
  $$('[data-lbsel]',el).forEach(c=>c.onchange=()=>{const id=c.dataset.lbsel;c.checked?LBSEL.add(id):LBSEL.delete(id);lbBtn.disabled=!LBSEL.size;lbBtn.textContent='🏷 '+lbTxt();const a=$('[data-lball]',el);a.checked=rows.length>0&&rows.every(r=>LBSEL.has(r[K]))});
  $('[data-lball]',el).onchange=e=>{rows.forEach(r=>e.target.checked?LBSEL.add(r[K]):LBSEL.delete(r[K]));cgList(el,sh,u)};
  $$('[data-lb]',el).forEach(b=>b.onclick=()=>{const r=get(b.dataset.lb);if(r)lbOpen([r])})}
 $('#cg-add').onclick=()=>cgForm(sh,null,u);
 if($('#cg-imp'))$('#cg-imp').onclick=async()=>{$('#cg-imp').disabled=true;const r=await adCall({action:'import',data:{[sh]:SEED[sh]}});if(!r.ok){adSay(adErr(r.error));$('#cg-imp').disabled=false;return}adSay(t('admin.imported',{n:r.count}));cgReload(sh,u)};
 if($('[data-nk]',el))$('[data-nk]',el).onclick=()=>{fl.nk=!fl.nk;cgList(el,sh,u)};
 $$('[data-ed]',el).forEach(b=>b.onclick=()=>cgForm(sh,get(b.dataset.ed),u));
 $$('[data-dl]',el).forEach(b=>b.onclick=async()=>{if(!confirm(t('admin.delAsk')))return;const r=await adCall({action:'delete',sheet:sh,id:b.dataset.dl});if(!r.ok)return adSay(adErr(r.error));adSay(t('admin.deleted'));cgReload(sh,u)});
 $$('[data-st]',el).forEach(x=>x.onchange=async()=>{const ok=await cgSave(sh,u,{id:x.dataset.st,status:x.value},t('admin.bk.saved'));if(!ok)cgReload(sh,u)});
 $$('[data-fd]',el).forEach(b=>b.onclick=()=>{fl.d=b.dataset.fd;cgList(el,sh,u)});
 if($('#fst',el)){$('#fst',el).onchange=e=>{fl.s=e.target.value;cgList(el,sh,u)};$('#fsv',el).onchange=e=>{fl.v=e.target.value;cgList(el,sh,u)}}
 $$('[data-tg]',el).forEach(b=>b.onclick=()=>{const r=get(b.dataset.tg);cgSave(sh,u,{id:r.id,active:isOn(r.active)?'FALSE':'TRUE'},t('admin.tr.ok'))});
 $$('[data-mv]',el).forEach(b=>b.onclick=async()=>{const i=full.findIndex(r=>r.id===b.dataset.id),j=i+Number(b.dataset.mv);if(j<0||j>=full.length)return;const all=[...full];all.splice(j,0,all.splice(i,1)[0]);
  const ch=all.map((r,n)=>({r,n:String(n+1)})).filter(x=>String(x.r.sort)!==x.n);const rs=await Promise.all(ch.map(x=>adCall({action:'upsert',sheet:sh,row:{id:x.r.id,sort:x.n}})));
  const bad=rs.find(x=>!x.ok);if(bad)adSay(adErr(bad.error));cgReload(sh,u)})}

/* ===== загрузка файла (картинки сжимаются до 1100 px, JPEG) ===== */
function fileToB64(f){return new Promise((ok,no)=>{const r=new FileReader();r.onerror=no;r.onload=()=>{if(!/^image\/(jpeg|png|webp)/.test(f.type))return ok({data:r.result.split(',')[1],mime:f.type,name:f.name});const im=new Image();im.onload=()=>{const k=Math.min(1,1100/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=im.width*k;cv.height=im.height*k;cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);ok({data:cv.toDataURL('image/jpeg',.85).split(',')[1],mime:'image/jpeg',name:f.name.replace(/\.\w+$/,'.jpg')})};im.onerror=no;im.src=r.result};r.readAsDataURL(f)})}

/* ===== форма записи ===== */
function cgBi(f,row){const kk=row[f.k+'_kk']==null?'':row[f.k+'_kk'],ru=row[brk(f)]==null?'':row[brk(f)],
 inp=(l,v)=>{const nm=l==='kk'?f.k+'_kk':brk(f);return f.ty==='a'?`<textarea name="${nm}" rows="3">${esc(v)}</textarea>`:`<input name="${nm}" value="${esc(v)}">`};
 return `<fieldset class="bi w" data-bk="${f.k}"><legend>${t(f.l)}${f.h?` <small>(${t(f.h)})</small>`:''}</legend>
  <div class="bi-r"><label>${t('admin.lang.kk')} <span class="tr" data-chip></span></label>${inp('kk',kk)}<button type="button" class="btn ghost bi-cp" data-cp="${f.k}">${t('admin.tr.copy')}</button></div>
  <div class="bi-r"><label>${t('admin.lang.ru')}</label>${inp('ru',ru)}</div></fieldset>`}
function cgForm(sh,row0,u){const isNew=!row0,row=Object.assign({},row0||{}),sc=CAT[sh].f,hasBi=sc.some(f=>f.bi),K=keyOf(sh),d=document.createElement('div');d.className='mod';
 if(isNew){if(sc.some(f=>f.k==='active'))row.active='TRUE';if(sc.some(f=>f.k==='sort'))row.sort=String((CGS.rows[sh]||[]).reduce((a,r)=>Math.max(a,+r.sort||0),0)+1);if(CAT[sh].def)CAT[sh].def(row)}
 const fld=f=>{if(f.bi)return cgBi(f,row);const{k,ty,o}=f,v=row[k]==null?'':row[k],n=`name="${k}"`,lb=`${t(f.l)}${f.h?` <small>(${t(f.h)})</small>`:''}`;
  if(k==='id'&&isNew)return'';
  if(sh==='Products'&&!isNew&&(k==='price'||k==='old_price')&&row[k]===undefined)return''; /* сервер скрывает цены без права view_prices: поле не показываем и не перезаписываем */
  if(ty==='b')return `<label class="ck w"><input type="checkbox" ${n} ${isOn(v)?'checked':''}> ${t(f.l)}</label>`;
  if(f.rel){const sel=String(v).split(';').map(s=>s.trim()).filter(Boolean),L0=(CGS.rows.Products||[]).filter(r=>r.id!==row.id&&(r.active===undefined||isOn(r.active))),ks=L0.filter(r=>sel.includes(r.id)).map(r=>r.id);
   return `<div class="w"><label>${lb}</label><input type="search" data-rq placeholder="${esc(t('admin.rel.search'))}" aria-label="${esc(t('admin.rel.search'))}"><div class="rl-box">${L0.map(r=>`<label class="rl-r" data-s="${esc([r.name,r.sku,r.brand].join(' '))}"><input type="checkbox" value="${esc(r.id)}" ${ks.includes(r.id)?'checked':''}> <span>${esc(r.name)}${r.sku?` <small>${esc(r.sku)}</small>`:''}</span></label>`).join('')||`<p class="sub">${t('common.empty')}</p>`}</div><small>${t('admin.rel.max')}</small><input type="hidden" ${n} value="${esc(ks.join(';'))}"></div>`}
  if(ty==='a')return `<div class="w"><label>${lb}</label><textarea ${n} rows="${k==='typical'?4:3}">${esc(v)}</textarea></div>`;
  /* значение, которого нет в списке (справочник пуст или запись удалена), остаётся в выборе: иначе сохранение молча обнулило бы поле */
  if(ty==='s')return `<div><label>${lb}</label><select ${n}>${(v&&o.indexOf(v)<0?[v,...o]:o).map(x=>`<option ${v===x?'selected':''} value="${esc(x)}">${esc(f.ol?t(f.ol+x):x)}</option>`).join('')}</select></div>`;
  if(ty==='r'){const L0=CGS.rows[o]||[];return `<div><label>${lb}</label><select ${n}><option value="">—</option>${v&&!L0.some(r=>r.id===v)?`<option value="${esc(v)}" selected>${esc(v)}</option>`:''}${L0.map(r=>`<option value="${esc(r.id)}" ${v===r.id?'selected':''}>${esc(cgLab(o,r.id))}</option>`).join('')}</select></div>`}
  if(ty==='i')return `<div class="w"><label>${lb}</label><div style="display:flex;gap:8px"><input ${n} value="${esc(v)}" placeholder="${esc(t('admin.f.imgPh'))}"><label class="btn ghost" style="margin:0;padding:10px 14px;cursor:pointer">⤒<input type="file" hidden data-up="${k}" accept="${k==='doc'?'application/pdf,image/*':'image/*'}"></label></div></div>`;
  return `<div class="${ty==='n'||ty==='d'||f.h2?'':'w'}"><label>${lb}</label><input ${n} ${(k===K&&!isNew)||f.ro?'readonly':''} type="${ty==='d'?'date':'text'}" ${ty==='n'?'inputmode="decimal"':''} value="${esc(v)}"></div>`};
 d.innerHTML=`<form class="${hasBi?'wide':''}"><h3 style="font-size:24px;margin-bottom:14px">${t(isNew?'admin.new':'common.edit')}</h3>${hasBi?`<div class="bi-s"><span class="tr" id="trs"></span><button type="button" class="btn ghost bi-cp" data-cpall>${t('admin.tr.copyAll')}</button></div>`:''}<div class="fr2">${sc.map(fld).join('')}</div><p class="note" data-e style="display:none;border-color:#d9534f"></p><div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>${t('common.cancel')}</button><button class="btn gold">${t('common.save')}</button></div></form>`;
 document.body.appendChild(d);const close=()=>d.remove(),fm=$('form',d),er=$('[data-e]',d),fail=m=>{er.textContent=m;er.style.display='block'};
 $('[data-x]',d).onclick=close;d.onclick=e=>{if(e.target===d)close()};
 /* E5: выбор сопутствующих товаров (не больше 6); скрытое поле related хранит ID через «;» */
 {const hid=fm.elements.related,bx=$$('.rl-box input',fm);if(hid&&bx.length){const lim=()=>{const on=bx.filter(i=>i.checked).length;bx.forEach(i=>{if(!i.checked)i.disabled=on>=6})},
  sync=()=>{hid.value=bx.filter(i=>i.checked).map(i=>i.value).join(';');lim()};bx.forEach(i=>i.onchange=sync);lim();
  const q=$('[data-rq]',fm);q.oninput=()=>{const k=norm(q.value);$$('.rl-r',fm).forEach(l=>{l.style.display=!k||norm(l.dataset.s).includes(k)?'':'none'})};q.onkeydown=e=>{if(e.key==='Enter')e.preventDefault()}}}
 /* полнота перевода: чипы у каждой пары и общий счётчик */
 const val=n=>fm.elements[n].value.trim(),rn=k=>brk(sc.find(x=>x.k===k)),
  refresh=()=>{if(!hasBi)return;let need=0,done=0;$$('.bi',fm).forEach(g=>{const k=g.dataset.bk,s=trPair(val(k+'_kk'),val(rn(k))),c=$('[data-chip]',g);c.className='tr '+(s==='ok'?'ok':s==='empty'?'':'warn');c.textContent=s==='ok'?t('admin.tr.ok'):s==='missing'?t('admin.tr.missing'):s==='same'?t('admin.tr.same'):'';if(s!=='empty'){need++;if(s==='ok')done++}});
   const sm=$('#trs',fm);sm.textContent=t('admin.tr.form',{n:done,m:need});sm.className='tr '+trCls(done,need)};
 if(hasBi){fm.addEventListener('input',refresh);refresh();
  $$('[data-cp]',fm).forEach(b=>b.onclick=()=>{const k=b.dataset.cp,ru=val(rn(k));if(!ru)return adSay(t('admin.tr.nothing'));if(!confirm(val(k+'_kk')?t('admin.tr.warn'):t('admin.tr.warnEmpty')))return;fm.elements[k+'_kk'].value=fm.elements[rn(k)].value;refresh();adSay(t('admin.tr.copied'))});
  $('[data-cpall]',fm).onclick=()=>{const ks=$$('.bi',fm).map(g=>g.dataset.bk).filter(k=>val(rn(k))&&!val(k+'_kk'));if(!ks.length)return adSay(t('admin.tr.nothing'));if(!confirm(t('admin.tr.warnAll')))return;ks.forEach(k=>{fm.elements[k+'_kk'].value=fm.elements[rn(k)].value});refresh();adSay(t('admin.tr.copied'))}}
 $$('[data-up]',d).forEach(inp=>inp.onchange=async()=>{const f=inp.files[0];if(!f)return;adSay(t('admin.uploading'));try{const b=await fileToB64(f);if(b.data.length>4200000)return adSay(t('admin.tooBig'));const r=await adCall({action:'upload',...b});if(!r.ok)return adSay(adErr(r.error));fm.elements[inp.dataset.up].value=r.url;adSay(t('admin.uploaded'))}catch(e){adSay(t('admin.uploadFail'))}inp.value=''});
 fm.onsubmit=async e=>{e.preventDefault();er.style.display='none';const vals={};
  sc.forEach(f=>(f.bi?[f.k+'_kk',brk(f)]:[f.k]).forEach(k=>{const el=fm.elements[k];if(!el)return;vals[k]=f.ty==='b'?(el.checked?'TRUE':'FALSE'):el.value.trim()}));
  const was=k=>{const f=sc.find(x=>x.k===k||x.bi&&(x.k+'_kk'===k||brk(x)===k));return f&&f.ty==='b'?(isOn(row0[k])?'TRUE':'FALSE'):String(row0[k]==null?'':row0[k]).trim()},o={};
  if(!isNew)o[K]=row0[K];Object.keys(vals).forEach(k=>{if(isNew?k!=='id':(k!==K&&vals[k]!==was(k)))o[k]=vals[k]});
  const m=Object.assign({},row0||{},vals);
  if(sh==='Points'&&!vals.name)return fail(t('err.required')); /* F1: name (русское) нужно отчётам, Telegram и чекам; казахское поле необязательно */
  if(sh==='Points'){ if(vals.whatsapp!==undefined){ const wa=normalizeWhatsApp(vals.whatsapp); if(!wa.ok)return fail(wa.error); if(Object.prototype.hasOwnProperty.call(o,'whatsapp'))o.whatsapp=wa.value; } if(vals.tg_chat!==undefined && vals.tg_chat && !/^(-?\d{5,20}|@\w{4,64})$/.test(vals.tg_chat))return fail(t('integ.tgBad')); }
  if(sh==='Points'&&isNew&&!o.tg_chat)delete o.tg_chat; /* пустой chat_id у новой точки не отправляем: поле доступно только admin */
  if(sh==='Settings'&&isNew&&!vals.key)return fail(t('err.required'));
  if(sh==='Products'&&m.typical){try{JSON.parse(m.typical)}catch(x){return fail(t('admin.jsonBad'))}}
  /* штрихкод: ровно 13 цифр = EAN-13, проверяем контрольную цифру; другая длина или буквы = внутренний код, разрешены. Проверка только при изменении поля, уникальность проверяет сервер */
  if(sh==='Products'&&o.barcode&&/^\d{13}$/.test(o.barcode)&&typeof Labels!=='undefined'){const v=Labels.validateEan13(o.barcode);if(!v.ok)return fail(t('label.err.'+v.reason))}
  if(sh==='Products'&&!String(m.slug||'').trim())o.slug=String(m.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||('p-'+Date.now());
  if(!isNew&&Object.keys(o).length===1)return close();
  const b=$('.gold',fm);b.disabled=true;const r=await adCall({action:'upsert',sheet:sh,row:o});b.disabled=false;
  if(!r.ok)return fail(adErr(r.error));close();adSay(t('staff.saved'));cgReload(sh,u)};
 const fi=$('input:not([readonly]),textarea',d);if(fi)fi.focus()}

/* ===== сотрудники и права (раздел 3): аккаунты, роли, точки, матрица «сотрудник × право». Только admin; сервер проверяет всё сам ===== */
const PERM_LIST=['view_products','view_prices','view_cost','sell','edit_draft_sale','create_receipt','edit_stock','manage_bookings','view_reports','delete_records','manage_staff','manage_settings'],
 AEM={ERR_SHIFT_OFF:'err.shiftOff',ERR_SHIFT_CLOSED:'err.shiftClosed',ERR_CASH:'err.cash',ERR_FORBIDDEN:'err.forbidden',ERR_BAD:'err.bad',ERR_REQUIRED:'err.required',ERR_LOGIN:'err.login',ERR_LOGIN_TAKEN:'err.loginTaken',ERR_WEAK:'err.weak',ERR_SELF:'err.self',ERR_LAST_ADMIN:'err.lastAdmin',ERR_LOCKED:'auth.many',ERR_AUTH:'auth.bad',ERR_SERVER:'err.server',ERR_NOT_FOUND:'err.notFound',ERR_BARCODE_DUP:'barcode.dup',ERR_STOCK:'err.stock',ERR_EMPTY:'err.empty',ERR_WA_PHONE:'integ.waBad',ERR_TG_CHAT:'integ.tgBad',ERR_TG_CONFIG:'integ.tgMissing',ERR_TG_SEND:'integ.failed',ERR_PROMO:'err.promo',ERR_PROMO_EXPIRED:'err.promoExpired',ERR_PROMO_LIMIT:'err.promoLimit',ERR_PROMO_MIN:'err.promoMin',ERR_PROMO_LOCK:'err.promoLock',ERR_PROMO_DUP:'err.promoDup'},
 AE={rows:[],pts:[],q:Promise.resolve()},
 stk=()=>ls.g('oh_admin_token')||'',adErr=c=>t(AEM[c]||'err.net'),
 adCall=(b)=>post({...b,token:stk()}).then(r=>{if(r.error==='auth'){location.reload();throw new Error('auth')}return r}).catch(e=>e.message==='auth'?{error:'auth'}:{error:'net'});
let _as;function adSay(m){let e=$('#ast');if(!e){e=document.createElement('div');e.id='ast';e.className='toast';e.setAttribute('role','status');document.body.appendChild(e)}e.textContent=m;e.classList.add('on');clearTimeout(_as);_as=setTimeout(()=>e.classList.remove('on'),2800)}
async function staffInit(u){const el=$('#sa');if(!el)return;
 const [S,P]=await Promise.all([adCall({action:'staff_list'}),adCall({action:'list',sheet:'Points'})]);
 if(S.error){el.innerHTML=`<p class="note" style="border-color:#d9534f">${esc(adErr(S.error))}</p>`;return}
 AE.rows=S.rows;AE.pts=P.rows||[];staffPaint(u)}
function staffPaint(u){const el=$('#sa');if(!el)return;const adm=u.role==='admin',mine=u.perms||[],ptn=id=>id?esc((AE.pts.find(x=>x.id===id)||{}).name||id):t('staff.anyPoint'),off=r=>r.active!==undefined&&r.active!==''&&!isOn(r.active),
 /* не-admin с manage_staff не трогает администраторов и себя; сервер проверяет то же самое */
 lock=r=>!adm&&(r.role==='admin'||r.id===u.id),lockPw=r=>!adm&&r.role==='admin';
 el.innerHTML=`<div class="sa"><div class="sa-h"><h1>${t('nav.staff')}</h1><button class="btn gold" id="sn">+ ${t('staff.new')}</button></div>
 <div class="panel tw"><table class="tb"><tr><th>${t('staff.name')}</th><th>${t('staff.role')}</th><th>${t('pos.point')}</th><th>${t('common.status')}</th><th></th></tr>${AE.rows.map(r=>`<tr class="${off(r)?'blk':''}"><td>${esc(r.name)}<br><small>${esc(r.login)}</small></td><td>${t('role.'+r.role)}</td><td>${ptn(r.point_id)}</td><td>${off(r)?t('staff.blocked'):t('staff.on')}</td>
  <td><div class="ab"><button data-ed="${esc(r.id)}" ${lock(r)?'disabled':''} title="${esc(t('common.edit'))}" aria-label="${esc(t('common.edit'))}">✎</button><button data-pw="${esc(r.id)}" ${lockPw(r)?'disabled':''} title="${esc(t('staff.resetPass'))}" aria-label="${esc(t('staff.resetPass'))}">🔑</button><button data-bl="${esc(r.id)}" ${r.id===u.id||lock(r)?'disabled':''} title="${esc(off(r)?t('staff.unblock'):t('staff.block'))}" aria-label="${esc(off(r)?t('staff.unblock'):t('staff.block'))}">${off(r)?'✔':'⛔'}</button></div></td></tr>`).join('')||`<tr><td colspan="5">${t('common.empty')}</td></tr>`}</table></div>
 <h2>${t('role.perms')}</h2><p class="sub">${t('staff.permsNote')}</p>
 <div class="panel tw" style="padding:10px"><table class="tb pm"><tr><th>${t('staff.name')}</th>${PERM_LIST.map(p=>`<th class="v" title="${esc(t('perm.'+p))}"><span>${t('perm.'+p)}</span></th>`).join('')}<th class="v"><span>${t('staff.defaults')}</span></th></tr>
 ${AE.rows.map(r=>{const isA=r.role==='admin',eff=isA?PERM_LIST:(r.perms_eff||[]);return `<tr class="${off(r)?'blk':''}"><td>${esc(r.name)}<br><small>${t('role.'+r.role)}</small></td>${PERM_LIST.map(p=>{const dis=isA||lock(r)||(!adm&&!mine.includes(p)&&!eff.includes(p)),noGrant=!adm&&!mine.includes(p);return `<td class="c"><input type="checkbox" data-s="${esc(r.id)}" data-p="${p}" ${eff.includes(p)?'checked':''} ${dis||(noGrant&&!eff.includes(p))?'disabled':''} aria-label="${esc(r.name+': '+t('perm.'+p))}"></td>`}).join('')}<td class="c">${isA||lock(r)?'':`<button class="btn ghost" style="padding:4px 10px" data-df="${esc(r.id)}" aria-label="${esc(t('staff.defaults'))}">↺</button>`}</td></tr>`}).join('')||`<tr><td colspan="${PERM_LIST.length+2}">${t('common.empty')}</td></tr>`}</table></div>
 <p class="sub"><small>${t('staff.permsEsc')}</small></p></div>`;
 $('#sn').onclick=()=>staffForm(null,u);
 $$('[data-ed]',el).forEach(b=>b.onclick=()=>staffForm(AE.rows.find(x=>x.id===b.dataset.ed),u));
 $$('[data-pw]',el).forEach(b=>b.onclick=()=>staffPass(AE.rows.find(x=>x.id===b.dataset.pw),u));
 $$('[data-bl]',el).forEach(b=>b.onclick=async()=>{const r=AE.rows.find(x=>x.id===b.dataset.bl),blk=!off(r);if(blk&&!confirm(t('staff.blockAsk')))return;
  const x=await adCall({action:'staff_block',id:r.id,blocked:blk});if(!x.ok)return adSay(adErr(x.error));adSay(t('staff.saved'));staffInit(u)});
 /* матрица: изменения идут по очереди, чтобы быстрые щелчки не затирали друг друга; набор считается от последнего ответа сервера */
 $$('.pm input[data-p]',el).forEach(cb=>cb.onchange=()=>{AE.q=AE.q.then(async()=>{const r=AE.rows.find(x=>x.id===cb.dataset.s),cur=new Set(r.perms_eff||[]);cb.checked?cur.add(cb.dataset.p):cur.delete(cb.dataset.p);
  const next=PERM_LIST.filter(x=>cur.has(x));cb.disabled=true;const x=await adCall({action:'perms_set',id:r.id,perms:next});cb.disabled=false;
  if(x.ok){r.perms=x.row.perms;r.perms_eff=x.row.perms_eff;adSay(t('staff.saved'))}else{cb.checked=!cb.checked;adSay(adErr(x.error))}})});
 $$('[data-df]',el).forEach(b=>b.onclick=()=>{AE.q=AE.q.then(async()=>{const x=await adCall({action:'perms_set',id:b.dataset.df,reset:true});if(!x.ok)return adSay(adErr(x.error));adSay(t('staff.saved'));await staffInit(u)})})}
function modal(html,onSubmit){const d=document.createElement('div');d.className='mod';d.innerHTML=`<form>${html}<p class="note" data-e style="display:none;border-color:#d9534f"></p><div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>${t('common.cancel')}</button><button class="btn gold">${t('common.save')}</button></div></form>`;
 document.body.appendChild(d);const close=()=>d.remove(),f=$('form',d),er=$('[data-e]',d);$('[data-x]',d).onclick=close;d.onclick=e=>{if(e.target===d)close()};
 f.onsubmit=async e=>{e.preventDefault();const b=$('.gold',f);b.disabled=true;const msg=await onSubmit(f.elements);b.disabled=false;if(msg){er.textContent=msg;er.style.display='block'}else close()};
 const fi=$('input',d);if(fi)fi.focus()}
function staffForm(row,u){const isNew=!row;row=row||{role:'seller'};
 modal(`<h3 style="font-size:24px;margin-bottom:14px">${t(isNew?'staff.new':'common.edit')}</h3><div class="fr2">
  <div class="w"><label>${t('staff.name')}</label><input name="name" required maxlength="80" value="${esc(row.name||'')}"></div>
  <div><label>${t('auth.user')}</label><input name="login" required maxlength="32" autocapitalize="none" autocomplete="off" value="${esc(row.login||'')}"></div>
  <div><label>${t('staff.role')}</label><select name="role">${['seller','manager','admin'].filter(r=>u.role==='admin'||r!=='admin').map(r=>`<option value="${r}" ${row.role===r?'selected':''}>${t('role.'+r)}</option>`).join('')}</select></div>
  <div><label>${t('pos.point')}</label><select name="point_id"><option value="">${t('staff.anyPoint')}</option>${AE.pts.map(p=>`<option value="${esc(p.id)}" ${row.point_id===p.id?'selected':''}>${esc(ptx(p,'name'))}</option>`).join('')}</select></div>
  ${isNew?`<div><label>${t('auth.pass')}</label><input name="password" type="password" autocomplete="new-password" minlength="8" maxlength="100" required><small>${t('staff.passHint')}</small></div>`:''}</div>`,
 async f=>{const o={name:f.name.value.trim(),login:f.login.value.trim(),role:f.role.value,point_id:f.point_id.value};if(!isNew)o.id=row.id;else o.password=f.password.value;
  const x=await adCall({action:'staff_upsert',row:o});if(!x.ok)return adErr(x.error);adSay(t('staff.saved'));staffInit(u)})}
function staffPass(row,u){modal(`<h3 style="font-size:24px;margin-bottom:6px">${t('staff.resetPass')}</h3><p class="sub">${esc(row.name)} · ${esc(row.login)}</p><label>${t('staff.newPass')}</label><input name="password" type="password" autocomplete="new-password" required minlength="8" maxlength="100"><small>${t('staff.passHint')}</small>`,
 async f=>{const x=await adCall({action:'staff_reset',id:row.id,password:f.password.value});if(!x.ok)return adErr(x.error);adSay(t('staff.saved'))})}

/* ===== приход товара и склад (этап D) ===== */
/* Приход: точка, поставщик, накладная, товар; скан или ручное количество; сохранение одним запросом (сервер под LockService, повтор того же uuid остаток не меняет). */
/* Склад: остатки по точкам из движений, корректировка с причиной, перенос нераспределённого остатка, история (приход, продажа, сторно, корректировка). */
const MV_T=['receipt','sale','void','adjust','assign'],
 uidA=()=>window.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2),
 AR={pt:'',sup:'',inv:'',pid:'',cost:'',lines:[],uuid:uidA(),P:[],Pt:[]},
 pinPt=u=>u.role!=='admin'&&u.point_id?u.point_id:'',
 ptOpts=(sel,all)=>`${all?`<option value="">${t('stock.allPoints')}</option>`:`<option value="">—</option>`}${AR.Pt.filter(p=>isOn(p.active)||p.id===sel).map(p=>`<option value="${esc(p.id)}" ${p.id===sel?'selected':''}>${esc(ptx(p,'name'))}</option>`).join('')}`,
 prN=id=>{const p=AR.P.find(x=>x.id===id);return p?p.name:id},
 ptN=id=>id?((AR.Pt.find(x=>x.id===id)||{}).name||id):'—';
async function wareLoad(){const [P,Pt]=await Promise.all([adCall({action:'list',sheet:'Products'}),adCall({action:'list',sheet:'Points'})]);if(P.error)return P.error;AR.P=P.rows||[];AR.Pt=Pt.rows||[];return ''}
function rcaLine(){const p=AR.P.find(x=>x.id===AR.pid);if(!p)return null;let l=AR.lines.find(x=>x.pid===p.id);if(!l){l={pid:p.id,codes:[],qty:0,cost:AR.cost};AR.lines.push(l)}return l}
/* скан: код уже в этом приходе — отказ без запроса; код другого товара — отказ с названием владельца; код SKU этого же товара — +1 к количеству; новый код — единица с привязкой */
async function rcaScan(code){const l=rcaLine();if(!l)return t('rc.pick');if(AR.lines.some(x=>x.codes.includes(code)))return t('barcode.dup')+': '+code;
 const r=await adCall({action:'lookup',code});
 if(AR.lines.some(x=>x.codes.includes(code)))return t('barcode.dup')+': '+code;
 if(r.ok){if(r.unit||r.product.id!==AR.pid)return t('barcode.dup')+': '+code+' · '+r.product.name;l.qty++;rcaLines();return t('rc.skuPlus',{code})}
 if(r.error!=='ERR_NOT_FOUND')return adErr(r.error);
 l.codes.push(code);if(!l.cost)l.cost=AR.cost;rcaLines();return '✓ '+code}
function rcaLines(){const el=$('#ra-l');if(!el)return;
 el.innerHTML=AR.lines.map((l,i)=>`<tr><td>${esc(prN(l.pid))}</td><td>${t('rc.units',{n:l.codes.length+l.qty})}${l.codes.length?` · ${l.codes.length} ▮`:''}</td><td>${esc(l.cost||'')}</td><td><div class="ab"><button data-rm="${i}" aria-label="${esc(t('common.close'))}">✕</button></div></td></tr>`).join('')||`<tr><td colspan="4">${t('common.empty')}</td></tr>`;
 $$('[data-rm]',el).forEach(b=>b.onclick=()=>{AR.lines.splice(+b.dataset.rm,1);rcaLines()});const s=$('#ra-s');if(s)s.disabled=!AR.lines.length;const lb=$('#ra-lb');if(lb)lb.disabled=!AR.lines.length}
/* товары и количества текущего прихода для окна этикеток: по строке на товар, копий столько, сколько единиц принимается */
const rcaLabelItems=()=>{const m=new Map();AR.lines.forEach(l=>{const p=AR.P.find(x=>x.id===l.pid);if(p)m.set(p.id,{product:p,copies:(m.has(p.id)?m.get(p.id).copies:0)+Math.max(1,l.codes.length+l.qty)})});return[...m.values()]};
async function rcaInit(u){const el=$('#ra');if(!el)return;const err=await wareLoad();if(err){el.innerHTML=`<p class="note" style="border-color:#d9534f">${esc(adErr(err))}</p>`;return}
 const pin=pinPt(u);if(pin)AR.pt=pin;
 el.innerHTML=`<div class="sa"><div class="sa-h"><h1>${t('pos.income')}</h1></div>
  <div class="panel"><div class="fr2"><div><label>${t('pos.warehouse')}</label><select id="ra-pt" ${pin?'disabled':''}>${ptOpts(AR.pt)}</select></div><div><label>${t('pos.supplier')}</label><input id="ra-su" maxlength="120" value="${esc(AR.sup)}"></div><div><label>${t('pos.invoice')}</label><input id="ra-in" maxlength="60" value="${esc(AR.inv)}"></div></div>
  <label style="margin-top:14px">${t('common.search')}</label><input id="ra-q" type="search" autocomplete="off"><select id="ra-p" size="5" style="margin-top:8px"></select>
  <div class="bar" style="margin-top:12px"><button class="btn gold" id="ra-sc">📷 ${t('pos.scan')}</button><input id="ra-n" inputmode="numeric" placeholder="${esc(t('pos.qty'))}" style="max-width:120px"><input id="ra-c" inputmode="decimal" placeholder="${esc(t('rc.cost'))}" value="${esc(AR.cost)}" style="max-width:160px"><button class="btn ghost" id="ra-a">${t('common.add')}</button></div></div>
  <div class="panel tw" style="padding:10px;margin-top:14px"><h3 style="margin:6px 8px">${t('rc.lines')}</h3><table class="tb"><tr><th>${t('pos.sale')}</th><th>${t('pos.qty')}</th><th>${t('rc.cost')}</th><th></th></tr><tbody id="ra-l"></tbody></table></div>
  <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:14px">${LabelsUI.canUse(u)?`<button class="btn ghost" id="ra-lb" disabled>🏷 ${t('label.btn')}</button>`:''}<button class="btn gold" id="ra-s" disabled>${t('common.save')}</button></div></div>`;
 const fill=()=>{const k=norm($('#ra-q').value);$('#ra-p').innerHTML=AR.P.filter(p=>!k||norm([p.name,p.sku,p.barcode].join(' ')).includes(k)).slice(0,60).map(p=>`<option value="${esc(p.id)}" ${p.id===AR.pid?'selected':''}>${esc(p.name)}${p.sku?' · '+esc(p.sku):''}</option>`).join('')};fill();rcaLines();
 $('#ra-q').oninput=fill;$('#ra-p').onchange=e=>{AR.pid=e.target.value};$('#ra-pt').onchange=e=>{AR.pt=e.target.value};$('#ra-su').onchange=e=>AR.sup=e.target.value;$('#ra-in').onchange=e=>AR.inv=e.target.value;$('#ra-c').onchange=e=>AR.cost=e.target.value;
 if($('#ra-lb'))$('#ra-lb').onclick=()=>LabelsUI.open({user:u,items:rcaLabelItems(),call:adCall});
 $('#ra-sc').onclick=()=>{if(!rcaLine())return adSay(t('rc.pick'));Scanner.open({keep:true,onCode:rcaScan})};
 $('#ra-a').onclick=()=>{const l=rcaLine(),n=Number($('#ra-n').value);if(!l)return adSay(t('rc.pick'));if(!(n>0)||Math.floor(n)!==n)return adSay(t('err.bad'));l.qty+=n;l.cost=$('#ra-c').value||l.cost;$('#ra-n').value='';rcaLines()};
 $('#ra-s').onclick=async()=>{if(!AR.pt)return adSay(t('rc.noPoint'));const b=$('#ra-s');b.disabled=true;const lines=[];
  AR.lines.forEach(l=>{if(l.codes.length)lines.push({product_id:l.pid,codes:l.codes,cost:l.cost});if(l.qty>0)lines.push({product_id:l.pid,qty:l.qty,cost:l.cost})});
  const r=await adCall({action:'receipt_post',uuid:AR.uuid,point_id:AR.pt,supplier:AR.sup,invoice:AR.inv,lines}); /* uuid не меняется до успеха: повтор после обрыва связи не задвоит остаток */
  if(!r.ok){b.disabled=false;return adSay(r.error==='ERR_BARCODE_DUP'?t('barcode.dup')+': '+r.code+(r.product_id?' · '+prN(r.product_id):''):adErr(r.error))}
  adSay(t('rc.done'));Object.assign(AR,{pid:'',cost:'',lines:[],uuid:uidA(),inv:''});rcaInit(u)}}

const SK={tab:'rest',pt:'',q:'',ty:'',rows:[],hist:[],scoped:false};
async function stockInit(u){const el=$('#sk');if(!el)return;const err=await wareLoad();if(err){el.innerHTML=`<p class="note" style="border-color:#d9534f">${esc(adErr(err))}</p>`;return}
 const [R,H]=await Promise.all([adCall({action:'stock_report'}),adCall({action:'stock_history',point_id:SK.pt,type:SK.ty,limit:300})]);
 if(!R.ok){el.innerHTML=`<p class="note" style="border-color:#d9534f">${esc(adErr(R.error))}</p>`;return}
 SK.rows=R.rows;SK.scoped=R.scoped;SK.hist=H.rows||[];stockPaint(u)}
function stockPaint(u){const el=$('#sk');if(!el)return;const can=(u.perms||[]).includes('edit_stock'),k=norm(SK.q),pts=AR.Pt.filter(p=>!SK.pt||p.id===SK.pt),pin=pinPt(u);
 const tab=`<div class="bar"><button class="btn ${SK.tab==='rest'?'gold':'ghost'}" data-tab="rest" aria-pressed="${SK.tab==='rest'}">${t('stock.rest')}</button><button class="btn ${SK.tab==='hist'?'gold':'ghost'}" data-tab="hist" aria-pressed="${SK.tab==='hist'}">${t('stock.hist')}</button>
  ${pin?'':`<select id="sk-pt" aria-label="${esc(t('pos.point'))}">${ptOpts(SK.pt,true)}</select>`}<input id="sk-q" type="search" placeholder="${esc(t('common.search'))}" value="${esc(SK.q)}">${SK.tab==='hist'?`<select id="sk-ty" aria-label="${esc(t('common.type'))}"><option value="">${t('common.all')}</option>${MV_T.map(x=>`<option value="${x}" ${SK.ty===x?'selected':''}>${t('mv.'+x)}</option>`).join('')}</select>`:''}</div>${SK.scoped?`<p class="sub"><small>${t('stock.scoped')}</small></p>`:''}`;
 let body;
 if(SK.tab==='rest'){const rows=SK.rows.filter(r=>!k||norm(r.name+' '+r.sku).includes(k));
  body=`<div class="panel tw" style="padding:10px"><table class="tb"><tr><th>${t('pos.sale')}</th>${SK.scoped?'':`<th>${t('stock.total')}</th>`}${pts.map(p=>`<th>${esc(ptx(p,'name'))}</th>`).join('')}${SK.scoped?'':`<th>${t('stock.free')}</th>`}<th></th></tr>${rows.map(r=>`<tr><td>${esc(r.name)}<br><small>${esc(r.sku)}</small></td>${SK.scoped?'':`<td><b>${fmtNum(r.total)}</b></td>`}${pts.map(p=>`<td>${fmtNum(r.pts[p.id]||0)}</td>`).join('')}${SK.scoped?'':`<td class="${r.unassigned?'':'mu'}">${r.unassigned?fmtNum(r.unassigned):'—'}</td>`}<td><div class="ab">${can?`<button data-adj="${esc(r.product_id)}" title="${esc(t('stock.adjust'))}" aria-label="${esc(t('stock.adjust'))}">✎</button>`:''}${can&&r.unassigned>0?`<button data-asg="${esc(r.product_id)}" title="${esc(t('stock.assign'))}" aria-label="${esc(t('stock.assign'))}">⇥</button>`:''}</div></td></tr>`).join('')||`<tr><td colspan="${pts.length+4}">${t('common.empty')}</td></tr>`}</table></div>`}
 else{const rows=SK.hist.filter(r=>!k||norm(prN(r.product_id)+' '+r.ref+' '+r.user).includes(k));
  body=`<div class="panel tw" style="padding:10px"><table class="tb"><tr><th>${t('common.date')}</th><th>${t('pos.point')}</th><th>${t('pos.sale')}</th><th>${t('pos.qty')}</th><th>${t('common.type')}</th><th>${t('stock.doc')}</th><th>${t('stock.user')}</th></tr>${rows.map(r=>`<tr><td>${esc(r.time)}</td><td>${esc(ptN(r.point_id))}</td><td>${esc(prN(r.product_id))}</td><td><b style="color:${Number(r.qty)<0?'#d9534f':'#4caf6a'}">${Number(r.qty)>0?'+':''}${esc(r.qty)}</b></td><td>${esc(MV_T.includes(r.type)?t('mv.'+r.type):r.type)}</td><td>${esc(r.ref)}</td><td>${esc(r.user)}</td></tr>`).join('')||`<tr><td colspan="7">${t('common.empty')}</td></tr>`}</table></div>`}
 el.innerHTML=`<div class="sa"><div class="sa-h"><h1>${t('pos.warehouse')}</h1></div>${tab}${body}</div>`;
 $$('[data-tab]',el).forEach(b=>b.onclick=()=>{SK.tab=b.dataset.tab;stockPaint(u)});
 if($('#sk-pt'))$('#sk-pt').onchange=e=>{SK.pt=e.target.value;stockInit(u)};if($('#sk-ty'))$('#sk-ty').onchange=e=>{SK.ty=e.target.value;stockInit(u)};
 $('#sk-q').oninput=e=>{SK.q=e.target.value;const pos=e.target.selectionStart;stockPaint(u);const q=$('#sk-q');q.focus();q.setSelectionRange(pos,pos)};
 $$('[data-adj]',el).forEach(b=>b.onclick=()=>stockAdjForm(SK.rows.find(r=>r.product_id===b.dataset.adj),u));
 $$('[data-asg]',el).forEach(b=>b.onclick=()=>stockAsgForm(SK.rows.find(r=>r.product_id===b.dataset.asg),u))}
function stockAdjForm(r,u){const pin=pinPt(u),pt0=pin||SK.pt||'';
 modal(`<h3 style="font-size:24px;margin-bottom:6px">${t('stock.adjust')}</h3><p class="sub">${esc(r.name)}</p><label>${t('pos.point')}</label><select name="pt" ${pin?'disabled':''}>${ptOpts(pt0)}</select><label>${t('stock.counted')}</label><input name="n" inputmode="numeric" required value="${pt0?esc(r.pts[pt0]||0):''}"><label>${t('stock.reason')}</label><input name="why" required maxlength="200">`,
  async f=>{const pt=pin||f.pt.value,n=Number(f.n.value);if(!pt)return t('rc.noPoint');if(!(n>=0)||Math.floor(n)!==n||!f.why.value.trim())return t('err.bad');
   const x=await adCall({action:'stock_adjust',point_id:pt,product_id:r.product_id,counted:n,reason:f.why.value.trim()});if(!x.ok)return adErr(x.error);adSay(t(x.delta?'stock.done':'stock.same'));stockInit(u)});
 const sel=$('.mod [name=pt]');if(sel&&!pin)sel.onchange=()=>{$('.mod [name=n]').value=sel.value?(r.pts[sel.value]||0):''}}
function stockAsgForm(r,u){const pin=pinPt(u);
 modal(`<h3 style="font-size:24px;margin-bottom:6px">${t('stock.assign')}</h3><p class="sub">${esc(r.name)} · ${t('stock.free')}: ${fmtNum(r.unassigned)}</p><label>${t('pos.point')}</label><select name="pt" ${pin?'disabled':''}>${ptOpts(pin||SK.pt||'')}</select><label>${t('pos.qty')}</label><input name="n" inputmode="numeric" required value="${esc(r.unassigned)}">`,
  async f=>{const pt=pin||f.pt.value,n=Number(f.n.value);if(!pt)return t('rc.noPoint');if(!(n>0)||Math.floor(n)!==n)return t('err.bad');
   const x=await adCall({action:'stock_assign',point_id:pt,product_id:r.product_id,qty:n});if(!x.ok)return adErr(x.error);adSay(t('stock.done'));stockInit(u)})}

/* ===== продажи и сторно (этап E): фильтры дата / точка / сотрудник / оплата / статус, итоги, экспорт CSV, сторно с причиной (только admin). Удаления нет. ===== */
const SL={f:{date_from:'',date_to:'',point_id:'',staff_id:'',pay:'',status:''},rows:[],sum:{},staff:[],pts:[],init:false};
async function salesInit(u){const el=$('#sl');if(!el)return;if(!SL.init){SL.f.date_from=dayAdd(-29);SL.f.date_to=today();SL.init=true}
 const [R,Pt]=await Promise.all([adCall({action:'sales_list',...SL.f}),adCall({action:'list',sheet:'Points'})]);
 if(!R.ok){el.innerHTML=`<p class="note" style="border-color:#d9534f">${esc(adErr(R.error))}</p>`;return}
 SL.rows=R.rows;SL.sum=R.sum;SL.staff=R.staff;SL.pts=Pt.rows||[];salesPaint(u)}
function salesPaint(u){const el=$('#sl');if(!el)return;const f=SL.f,s=SL.sum,pin=pinPt(u),adm=u.role==='admin',pn=id=>id?((SL.pts.find(x=>x.id===id)||{}).name||id):'—',
 opt=(v,l,c)=>`<option value="${esc(v)}" ${c===v?'selected':''}>${esc(l)}</option>`;
 el.innerHTML=`<div class="sa"><div class="sa-h"><h1>${t('nav.sales')}</h1><button class="btn ghost" id="sl-x">⤓ ${t('sales.export')}</button></div>
 <div class="bar"><label class="sl-l">${t('sales.from')} <input type="date" id="sl-df" value="${esc(f.date_from)}"></label><label class="sl-l">${t('sales.to')} <input type="date" id="sl-dt" value="${esc(f.date_to)}"></label>
  ${pin?'':`<select id="sl-pt" aria-label="${esc(t('pos.point'))}">${opt('',t('stock.allPoints'),f.point_id)}${SL.pts.map(p=>opt(p.id,ptx(p,'name'),f.point_id)).join('')}</select>`}
  <select id="sl-st" aria-label="${esc(t('sales.staff'))}">${opt('',t('sales.allStaff'),f.staff_id)}${SL.staff.map(p=>opt(p.id,p.name,f.staff_id)).join('')}</select>
  <select id="sl-py" aria-label="${esc(t('pos.payment'))}">${opt('',t('sales.allPay'),f.pay)}${opt('cash',t('pos.cash'),f.pay)}${opt('card',t('pos.card'),f.pay)}</select>
  <select id="sl-ss" aria-label="${esc(t('common.status'))}">${opt('',t('admin.bk.allSt'),f.status)}${opt('posted',t('sales.st.posted'),f.status)}${opt('void',t('sales.st.void'),f.status)}</select></div>
 <p class="sub"><b>${t('sales.sum',{n:fmtNum(s.count),total:fmtMoney(s.total)})}</b> · ${t('pos.cash')}: ${fmtMoney(s.cash)} · ${t('pos.card')}: ${fmtMoney(s.card)}${s.void_count?` · ${t('sales.sumVoid',{n:fmtNum(s.void_count),total:fmtMoney(s.void_total)})}`:''}</p>
 <div class="panel tw" style="padding:10px"><table class="tb"><tr><th>${t('common.date')}</th><th>№</th><th>${t('pos.point')}</th><th>${t('sales.staff')}</th><th>${t('common.client')}</th><th>${t('pos.payment')}</th><th>${t('pos.total')}</th><th>${t('common.status')}</th><th></th></tr>${SL.rows.map(r=>`<tr class="${r.status==='void'?'blk':''}"><td>${esc(r.date?fmtDate(r.date):'')}</td><td><small>${esc(r.id)}</small></td><td>${esc(pn(r.point_id))}</td><td>${esc(r.staff)}</td><td>${esc(r.client)}${r.phone||r.plate?`<br><small>${esc([r.phone,r.plate].filter(Boolean).join(' · '))}</small>`:''}</td><td>${t(r.pay==='card'?'pos.card':'pos.cash')}</td><td><b>${esc(fmtMoney(r.total))}</b></td><td>${t('sales.st.'+r.status)}</td>
  <td><div class="ab"><button data-dt="${esc(r.id)}" title="${esc(t('sales.details'))}" aria-label="${esc(t('sales.details'))}">☰</button>${adm&&r.status!=='void'?`<button class="dl" data-rv="${esc(r.id)}" title="${esc(t('sales.reverse'))}" aria-label="${esc(t('sales.reverse'))}">↩</button>`:''}</div></td></tr>`).join('')||`<tr><td colspan="9">${t('common.empty')}</td></tr>`}</table></div></div>`;
 const set=(k,id)=>{const x=$(id,el);if(x)x.onchange=e=>{f[k]=e.target.value;salesInit(u)}};set('date_from','#sl-df');set('date_to','#sl-dt');set('point_id','#sl-pt');set('staff_id','#sl-st');set('pay','#sl-py');set('status','#sl-ss');
 $('#sl-x').onclick=async()=>{const b=$('#sl-x');b.disabled=true;const r=await adCall({action:'sales_export',...f});b.disabled=false;if(!r.ok)return adSay(adErr(r.error));
  const url=URL.createObjectURL(new Blob([r.csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=r.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);adSay(t('sales.exported',{n:r.count}))};
 $$('[data-dt]',el).forEach(b=>b.onclick=()=>salesDetail(SL.rows.find(x=>x.id===b.dataset.dt),u));
 $$('[data-rv]',el).forEach(b=>b.onclick=()=>salesReverse(SL.rows.find(x=>x.id===b.dataset.rv),u))}
function salesDetail(r,u){const d=document.createElement('div');d.className='mod';
 d.innerHTML=`<form><h3 style="font-size:24px;margin-bottom:6px">№ ${esc(r.id)}</h3><p class="sub">${esc(r.date?fmtDate(r.date):'')} · ${esc(r.staff)} · ${t(r.pay==='card'?'pos.card':'pos.cash')}</p>
  <table class="tb"><tr><th>${t('sales.items')}</th><th>${t('pos.qty')}</th><th>${t('pos.price')}</th></tr>${r.items.map(i=>`<tr><td>${esc(i.name)}${i.code?`<br><small>${esc(i.code)}</small>`:''}</td><td>${esc(i.qty)}</td><td>${esc(fmtMoney(i.price))}</td></tr>`).join('')||`<tr><td colspan="3">${t('common.empty')}</td></tr>`}</table>
  ${r.discount?`<p class="sub">${t('pos.discount')}: ${esc(fmtMoney(r.discount))}</p>`:''}<p><b>${t('pos.total')}: ${esc(fmtMoney(r.total))}</b></p>
  ${r.status==='void'?`<p class="note" style="border-color:#d9534f">${t('sales.voidInfo',{who:esc(r.void_by),time:esc(r.void_time)})}<br>${esc(r.void_reason)}</p>`:''}
  <div style="display:flex;justify-content:flex-end;margin-top:16px"><button type="button" class="btn ghost" data-x>${t('common.close')}</button></div></form>`;
 document.body.appendChild(d);const close=()=>d.remove();$('[data-x]',d).onclick=close;d.onclick=e=>{if(e.target===d)close()}}
function salesReverse(r,u){modal(`<h3 style="font-size:24px;margin-bottom:6px">${t('sales.reverse')} № ${esc(r.id)}</h3><p class="sub">${esc(fmtMoney(r.total))} · ${esc(r.staff)}</p><p class="note">${t('sales.reverseNote')}</p><label>${t('sales.reason')}</label><input name="why" required minlength="3" maxlength="300">`,
 async f=>{const why=f.why.value.trim();if(why.length<3)return t('err.required');const x=await adCall({action:'sale_reverse',id:r.id,reason:why});if(!x.ok)return x.error==='ERR_POSTED'?t('sales.already'):adErr(x.error);adSay(t('sales.done'));salesInit(u)})}

/* ===== дашборд (этап F): один запрос `dash` (на сервере кэш), период списков переключается без нового запроса; прошлый снимок показывается сразу, пока идёт обновление ===== */
const DS={p:'day',d:null,uid:'',busy:false};
async function dashInit(u,fresh){const el=$('#ds');if(!el)return;
 if(DS.uid!==u.id){DS.d=null;DS.uid=u.id}
 DS.busy=true;if(DS.d)dashPaint(u);
 const r=await adCall(fresh?{action:'dash',fresh:true}:{action:'dash'});DS.busy=false;
 const e2=$('#ds');if(!e2)return; /* ушли с раздела, пока шёл запрос */
 if(r.ok)DS.d=r;else if(DS.d)adSay(adErr(r.error));else{e2.innerHTML=`<p class="note" style="border-color:#d9534f">${esc(adErr(r.error))}</p>`;return}
 dashPaint(u)}
function dashPaint(u){const el=$('#ds');if(!el||!DS.d)return;const d=DS.d,P=d.p[DS.p],rg=d.ranges,lw=d.low_stock,bk=d.bookings,
 rng=k=>rg[k][0]===rg[k][1]?fmtDate(rg[k][0]):fmtDate(rg[k][0])+' – '+fmtDate(rg[k][1]),
 g=String(d.generated||''),gt=g.slice(0,10)===today()?g.slice(11):fmtDate(g.slice(0,10))+' '+g.slice(11),
 rev=k=>{const x=d.p[k];return `<button class="ds-c" data-go="${k}"><span>${t('dash.rev')} · ${t('dash.'+k)}</span><b>${esc(fmtMoney(x.total))}</b><small>${esc(tn('cnt.sale',x.count))} · ${esc(rng(k))}</small>${x.void_count?`<small class="ds-v">${esc(t('sales.sumVoid',{n:x.void_count,total:fmtMoney(x.void_total)}))}</small>`:''}</button>`},
 lab=(x,k)=>x.name||x.id||t(k),
 list=(rows,sum,sub,k)=>{const mx=Math.max(...rows.map(sum),0);return rows.length?`<ol class="ds-l">${rows.map(x=>`<li><div class="ds-n"><span>${esc(lab(x,k))}</span><b>${esc(fmtMoney(sum(x)))}</b></div><div class="ds-m"><i style="width:${mx>0?Math.max(2,Math.round(sum(x)/mx*100)):0}%"></i></div><small>${esc(sub(x))}</small></li>`).join('')}</ol>`:`<p class="sub">${t('common.empty')}</p>`},
 pn=(h,body)=>`<div class="panel ds-p"><h2>${t(h)}</h2>${body}</div>`;
 el.innerHTML=`<div class="ds"><div class="sa-h"><div><h1>${t('nav.dash')}</h1><p class="sub ds-t">${esc(t('dash.updated',{time:gt}))}${d.scoped?' · '+esc(t('dash.scoped')):''}</p></div><button class="btn ghost" id="ds-r" ${DS.busy?'disabled':''}>⟳ ${t('dash.refresh')}</button></div>
 <div class="ds-rv">${['day','week','month'].map(rev).join('')}</div>
 <div class="ds-sc">${bk?`<a class="ds-c" href="#/bookings" data-bk><span>${t('dash.newBk')}</span><b>${esc(fmtNum(bk.new))}</b><small>${esc(t('dash.bkToday',{n:bk.today}))}</small></a>`:''}<a class="ds-c ${lw.n?'warn':''}" href="#/stock"><span>${t('dash.low')}</span><b>${esc(fmtNum(lw.n))}</b><small>${esc(t('dash.lowTh',{n:lw.th}))}</small></a></div>
 <div class="bar ds-seg" role="group" aria-label="${esc(t('dash.period'))}">${['day','week','month'].map(k=>`<button class="btn ${DS.p===k?'gold':'ghost'}" data-p="${k}" aria-pressed="${DS.p===k}">${t('dash.'+k)}</button>`).join('')}</div>
 <div class="ds-g">${pn('dash.top',list(P.top,x=>x.sum,x=>t('dash.qty',{n:x.qty}),'common.empty'))}${pn('dash.byStaff',list(P.staff,x=>x.total,x=>tn('cnt.sale',x.count),'dash.noStaff'))}${d.scoped?'':pn('dash.byPoint',list(P.points,x=>x.total,x=>tn('cnt.sale',x.count),'dash.noPoint'))}
 ${pn('dash.low',lw.rows.length?`<ul class="ds-s">${lw.rows.map(x=>`<li><span>${esc(x.name)}${x.sku?` <small>${esc(x.sku)}</small>`:''}</span><b class="${x.stock<=0?'z':''}">${esc(fmtNum(x.stock))}</b></li>`).join('')}</ul>${lw.n>lw.rows.length?`<p class="sub">${esc(t('dash.more',{n:lw.n-lw.rows.length}))}</p>`:''}<a class="btn ghost" href="#/stock">${t('dash.openStock')}</a>`:`<p class="sub">${t('dash.lowOk')}</p>`)}</div></div>`;
 $('#ds-r').onclick=()=>dashInit(u,true);
 $$('[data-p]',el).forEach(b=>b.onclick=()=>{DS.p=b.dataset.p;dashPaint(u)});
 $$('[data-go]',el).forEach(b=>b.onclick=()=>{const r=rg[b.dataset.go];Object.assign(SL.f,{date_from:r[0],date_to:r[1],point_id:'',staff_id:'',pay:'',status:''});SL.init=true;location.hash='#/sales'}); /* карточка выручки открывает «Продажи» с тем же периодом: цифру легко сверить */
 const lb=$('[data-bk]',el);if(lb)lb.onclick=()=>{CGS.fl.Bookings={nk:false,d:'',s:'new',v:''}}}

/* ===== подбор по авто: раздел «Автомобили» (этап G2.1). Строки Compat — обычным list, проверка — compat_check; админ и менеджер ===== */
/* Таблица, фильтры, счётчики-фильтры, подсветка по issues, форма одной строки. Импорт CSV и массовая правка — этап G2.2. Тексты — ключи compat.* */
const CP={rows:[],chk:null,busy:false,more:100,sel:new Set(),f:{q:'',brand:'',model:'',fuel:'',prob:false,flag:''}},
 CP_PAGE=100,CP_FUEL=['petrol','diesel','hybrid','lpg'],
 /* три подсвечиваемых типа: цвет всегда дублируется значком и подписью */
 CP_FLAGS={dup:{ic:'⧉',k:'compat.flag.dup',tk:'compat.flag.dupT',cls:'dup'},spec:{ic:'∅',k:'compat.flag.spec',tk:'compat.flag.specT',cls:'spec'},years:{ic:'⚠',k:'compat.flag.years',tk:'compat.flag.yearsT',cls:'yr'}},
 cpId=(r,i)=>r.id||('#'+(i+2)), /* так сервер называет строки без id в compat_check */
 cpIs=c=>/^(years_order|year_bad)/.test(c)?'years':c==='spec_empty'?'spec':c==='dup'?'dup':'',
 cpIss=id=>(CP.chk&&CP.chk.issues&&CP.chk.issues[id])||[],
 cpHas=(id,fl)=>cpIss(id).some(c=>cpIs(c)===fl),
 cpLow=s=>String(s==null?'':s).replace(/\s+/g,' ').trim().toLowerCase(),
 cpYears=r=>r.year_from&&r.year_to?(r.year_from===r.year_to?r.year_from:r.year_from+'–'+r.year_to):r.year_from?t('compat.yFrom',{y:r.year_from}):r.year_to?t('compat.yTo',{y:r.year_to}):'',
 cpFuel=v=>v?(CP_FUEL.includes(v)?t('compat.fuel.'+v):v):'',
 cpSpec=v=>String(v||'').split(';').map(x=>x.trim()).filter(Boolean).join(' · '),
 /* код сервера → понятный текст: year_bad:year_from, value_bad:note — с названием поля */
 cpFld=f=>f?t(({year_from:'compat.f.yearFrom',year_to:'compat.f.yearTo',spec_required:'compat.f.spec'})[f]||'compat.f.'+f):'',
 cpMsg=c=>{const [b,f]=String(c).split(':'),fl=cpFld(f);
  return ({brand_empty:1,model_empty:1,year_bad:1,years_order:1,fuel_bad:1,value_bad:1,id_bad:1,row_bad:1,spec_empty:1,sae_format:1,dup:1})[b]?t('compat.issue.'+b,{f:fl}):String(c)};
const cpBrands=()=>{const m=new Map();CP.rows.forEach(r=>{const k=cpLow(r.brand);if(k&&!m.has(k))m.set(k,String(r.brand).trim())});return[...m.values()].sort((a,b)=>a.localeCompare(b))},
 cpModels=b=>{const m=new Map();CP.rows.forEach(r=>{if(b&&cpLow(r.brand)!==cpLow(b))return;const k=cpLow(r.model);if(k&&!m.has(k))m.set(k,String(r.model).trim())});return[...m.values()].sort((a,b)=>a.localeCompare(b))};
function cpRows(){const f=CP.f,q=cpLow(f.q);
 return CP.rows.map((r,i)=>({r,id:cpId(r,i)})).filter(({r,id})=>(!f.brand||cpLow(r.brand)===cpLow(f.brand))&&(!f.model||cpLow(r.model)===cpLow(f.model))&&(!f.fuel||r.fuel===f.fuel)
  &&(!f.prob||cpIss(id).length>0)&&(!f.flag||cpHas(id,f.flag))&&(!q||cpLow([r.brand,r.model,r.engine,r.spec_required,r.sae,r.note].join(' ')).includes(q)))}
async function cpLoad(){const [R,C]=await Promise.all([adCall({action:'list',sheet:'Compat'}),adCall({action:'compat_check'})]);
 if(R.error)return R.error;CP.rows=R.rows||[];{const have=new Set(CP.rows.map(r=>r.id));[...CP.sel].forEach(id=>{if(!have.has(id))CP.sel.delete(id)})} /* выбор не переживает удаление строки */if(C.ok)CP.chk=C;else if(C.error)return C.error;return ''}
function compatView(c,u){queueMicrotask(()=>cpInit(u));return `<div id="cp"><div class="sk" style="height:200px"></div></div>`}
async function cpInit(u){const el=$('#cp');if(!el)return;CP.busy=true;const err=await cpLoad();CP.busy=false;const e2=$('#cp');if(!e2)return; /* ушли с раздела, пока шёл запрос */
 if(err){e2.innerHTML=`<p class="note" style="border-color:#d9534f">${esc(adErr(err))}</p>`;return}cpPaint(u)}
/* повторная проверка без перерисовки всей страницы при ошибке сети: цифры и подсветка обновляются, прежние остаются */
async function cpRecheck(u,say){CP.busy=true;cpPaint(u);const err=await cpLoad();CP.busy=false;if(!$('#cp'))return;if(err)adSay(adErr(err));else if(say)adSay(t('compat.checked'));cpPaint(u)}
function cpPaint(u){const el=$('#cp');if(!el)return;const f=CP.f,S=(CP.chk&&CP.chk.summary)||null,all=cpRows(),rows=all.slice(0,CP.more),canDel=(u.perms||[]).includes('delete_records'),
 canBulk=['admin','manager'].includes(u.role),sel=CP.sel,selN=sel.size,fAll=all.filter(x=>x.r.id),pageSel=rows.filter(x=>x.r.id),allPage=pageSel.length>0&&pageSel.every(x=>sel.has(x.id)),noId=all.length-fAll.length,
 n=v=>S?fmtNum(v):'…',
 cnt=(k,lab,v,fl)=>`<button class="ds-c cp-c ${fl?'cp-'+CP_FLAGS[fl].cls:''} ${(fl?f.flag===fl:!f.flag&&!f.prob)?'on':''}" data-fl="${fl}" aria-pressed="${fl?f.flag===fl:!f.flag&&!f.prob}"><span>${fl?`<i aria-hidden="true">${CP_FLAGS[fl].ic}</i> `:''}${t(lab)}</span><b>${n(v)}</b></button>`,
 opt=(v,l,c)=>`<option value="${esc(v)}" ${c===v?'selected':''}>${esc(l)}</option>`,
 badge=id=>[...new Set(cpIss(id).map(c=>cpIs(c)||c))].map(k=>CP_FLAGS[k]?`<span class="cp-b cp-${CP_FLAGS[k].cls}" title="${esc(t(CP_FLAGS[k].k))}"><i aria-hidden="true">${CP_FLAGS[k].ic}</i> ${t(CP_FLAGS[k].k)}</span>`:`<span class="cp-b cp-oth" title="${esc(cpMsg(k))}"><i aria-hidden="true">•</i> ${esc(cpMsg(k))}</span>`).join('');
 el.innerHTML=`<div class="cg-h"><h1>${t('nav.compat')}</h1><div class="cg-b"><button class="btn ghost" id="cp-im">⤒ ${t('compat.import.btn')}</button><button class="btn ghost" id="cp-ck" ${CP.busy?'disabled':''}>⟳ ${t('compat.check')}</button><button class="btn gold" id="cp-add">+ ${t('common.add')}</button></div></div>
 <div class="ds-sc cp-cn">${cnt('t','compat.cnt.total',S&&S.total,'')}${cnt('d','compat.cnt.dup',S&&S.dup_rows,'dup')}${cnt('s','compat.cnt.spec',S&&S.spec_empty,'spec')}${cnt('y','compat.cnt.years',S&&S.years,'years')}</div>
 ${CP.chk&&CP.chk.truncated?`<p class="note">${t('compat.truncated')}</p>`:''}
 <ul class="cp-lg" aria-label="${esc(t('compat.legend'))}"><li class="cp-lt">${t('compat.legend')}:</li>${Object.keys(CP_FLAGS).map(k=>`<li><span class="cp-b cp-${CP_FLAGS[k].cls}"><i aria-hidden="true">${CP_FLAGS[k].ic}</i> ${t(CP_FLAGS[k].k)}</span> ${t(CP_FLAGS[k].tk)}</li>`).join('')}</ul>
 <div class="cp-f"><input id="cp-q" type="search" placeholder="${esc(t('common.search'))}" aria-label="${esc(t('common.search'))}" value="${esc(f.q)}">
  <select id="cp-b" aria-label="${esc(t('compat.f.brand'))}">${opt('',t('compat.allBrands'),f.brand)}${cpBrands().map(b=>opt(b,b,f.brand)).join('')}</select>
  <select id="cp-m" aria-label="${esc(t('compat.f.model'))}">${opt('',t('compat.allModels'),f.model)}${cpModels(f.brand).map(b=>opt(b,b,f.model)).join('')}</select>
  <select id="cp-fu" aria-label="${esc(t('compat.f.fuel'))}">${opt('',t('compat.allFuel'),f.fuel)}${CP_FUEL.map(x=>opt(x,t('compat.fuel.'+x),f.fuel)).join('')}</select>
  <button class="btn ${f.prob?'gold':'ghost'}" id="cp-pr" aria-pressed="${f.prob}">${t('compat.onlyProb')}${S?' · '+fmtNum(S.problem_rows):''}</button></div>
 ${canBulk?`<div class="cp-sb" role="group" aria-label="${esc(t('compat.bulk.btn'))}"><label class="ck"><input type="checkbox" id="cp-sp" ${allPage?'checked':''} ${pageSel.length?'':'disabled'}> ${t('compat.bulk.page')}</label><button class="btn ghost" id="cp-sa" ${fAll.length?'':'disabled'}>${t('compat.bulk.filter',{n:fmtNum(fAll.length)})}</button><b class="cp-sn" role="status">${t('compat.bulk.sel',{n:fmtNum(selN)})}</b>${selN?`<button class="btn ghost" id="cp-sc">${t('compat.bulk.clear')}</button>`:''}<button class="btn gold" id="cp-bk" ${selN&&selN<=CB_MAX&&!CP.busy?'':'disabled'}>✎ ${t('compat.bulk.btn')}</button></div>${selN>CB_MAX?`<p class="note cp-ne">${t('compat.bulk.tooMany',{n:fmtNum(selN),max:CB_MAX})}</p>`:''}${noId?`<p class="sub">${t('compat.bulk.noId',{n:fmtNum(noId)})}</p>`:''}`:''}
 <p class="sub cp-sh" role="status">${t('compat.shown',{n:fmtNum(rows.length),m:fmtNum(all.length)})}${all.length!==CP.rows.length?' · '+t('compat.ofAll',{n:fmtNum(CP.rows.length)}):''}</p>
 <div class="panel tw cp-t" style="padding:10px"><table class="tb cp-tb"><tr><th>${t('compat.f.brand')}</th><th>${t('compat.f.model')}</th><th>${t('compat.f.years')}</th><th>${t('compat.f.engine')}</th><th>${t('compat.f.fuel')}</th><th>${t('compat.f.spec')}</th><th>${t('compat.f.sae')}</th><th>${t('compat.f.note')}</th><th>${t('compat.f.status')}</th><th></th></tr>
 ${rows.map(({r,id})=>{const fl=['dup','spec','years'].filter(k=>cpHas(id,k)).map(k=>'cp-r-'+CP_FLAGS[k].cls).join(' '),no=!r.id,ei=esc(id);
  return `<tr class="${(fl+(sel.has(id)?' cp-sel':'')).trim()}" data-row="${ei}"><td data-l="${esc(t('compat.f.brand'))}">${canBulk?`<label class="cp-sl"><input type="checkbox" data-sel="${ei}" ${sel.has(id)?'checked':''} ${r.id?'':'disabled'} aria-label="${esc(t('compat.bulk.pick'))}"><b>${esc(r.brand)}</b></label>`:`<b>${esc(r.brand)}</b>`}</td><td data-l="${esc(t('compat.f.model'))}">${esc(r.model)}</td><td data-l="${esc(t('compat.f.years'))}">${esc(cpYears(r))}</td><td data-l="${esc(t('compat.f.engine'))}">${esc(r.engine)}</td><td data-l="${esc(t('compat.f.fuel'))}">${esc(cpFuel(r.fuel))}</td><td data-l="${esc(t('compat.f.spec'))}">${esc(cpSpec(r.spec_required))}</td><td data-l="${esc(t('compat.f.sae'))}">${esc(r.sae)}</td><td data-l="${esc(t('compat.f.note'))}">${esc(String(r.note||'').slice(0,80))}</td><td class="cp-st" data-l="${esc(t('compat.f.status'))}">${badge(id)||'—'}</td>
  <td class="cp-ac"><div class="ab"><button data-ed="${ei}" ${no?'disabled':''} title="${esc(t('common.edit'))}" aria-label="${esc(t('common.edit'))}">✎</button>${canDel?`<button class="dl" data-dl="${ei}" ${no?'disabled':''} title="${esc(t('common.delete'))}" aria-label="${esc(t('common.delete'))}">✕</button>`:''}</div></td></tr>`}).join('')||`<tr class="cp-em"><td colspan="10">${t('common.empty')}</td></tr>`}</table></div>
 ${all.length>rows.length?`<div class="cp-mo"><button class="btn ghost" id="cp-mo">${t('compat.more',{n:Math.min(CP_PAGE,all.length-rows.length)})}</button></div>`:''}`;
 const rp=()=>{CP.more=CP_PAGE;CP.sel.clear();cpPaint(u)},get=id=>{const i=CP.rows.findIndex((r,j)=>cpId(r,j)===id);return i<0?null:CP.rows[i]};
 $('#cp-add').onclick=()=>cpForm(null,u);$('#cp-im').onclick=()=>cpImport(u);$('#cp-ck').onclick=()=>cpRecheck(u,true);
 $$('[data-fl]',el).forEach(b=>b.onclick=()=>{const k=b.dataset.fl;f.flag=k&&f.flag!==k?k:'';if(!k)f.prob=false;rp()}); /* повторный клик снимает; «всего» сбрасывает счётчик-фильтр */
 if(canBulk){$('#cp-sp').onchange=e=>{pageSel.forEach(x=>e.target.checked?sel.add(x.id):sel.delete(x.id));cpPaint(u)};
  $('#cp-sa').onclick=()=>{fAll.forEach(x=>sel.add(x.id));cpPaint(u)}; /* все строки под текущими поиском и фильтрами, не только показанные */
  const sc=$('#cp-sc');if(sc)sc.onclick=()=>{sel.clear();cpPaint(u)};$('#cp-bk').onclick=()=>cpBulk(u);
  $$('[data-sel]',el).forEach(c=>c.onchange=()=>{const id=c.dataset.sel;c.checked?sel.add(id):sel.delete(id);cpPaint(u);const n=$$('[data-sel]',$('#cp')).find(x=>x.dataset.sel===id);if(n)n.focus()})}
 $('#cp-q').oninput=e=>{f.q=e.target.value;const p=e.target.selectionStart;CP.more=CP_PAGE;CP.sel.clear();cpPaint(u);const q=$('#cp-q');q.focus();q.setSelectionRange(p,p)};
 $('#cp-b').onchange=e=>{f.brand=e.target.value;if(f.model&&!cpModels(f.brand).some(m=>cpLow(m)===cpLow(f.model)))f.model='';rp()}; /* модель зависит от марки */
 $('#cp-m').onchange=e=>{f.model=e.target.value;rp()};$('#cp-fu').onchange=e=>{f.fuel=e.target.value;rp()};$('#cp-pr').onclick=()=>{f.prob=!f.prob;rp()};
 if($('#cp-mo'))$('#cp-mo').onclick=()=>{CP.more+=CP_PAGE;cpPaint(u)};
 $$('[data-ed]',el).forEach(b=>b.onclick=()=>{const r=get(b.dataset.ed);if(r)cpForm(r,u)});
 $$('[data-dl]',el).forEach(b=>b.onclick=async()=>{if(!confirm(t('compat.delAsk')))return;const r=await adCall({action:'delete',sheet:'Compat',id:b.dataset.dl});if(!r.ok)return adSay(adErr(r.error));adSay(t('admin.deleted'));cpRecheck(u)})}

/* форма одной строки: правка шлёт только изменённые поля; после сохранения таблица и проверка обновляются, замечания сервера по строке остаются в форме */
function cpForm(row0,u){let cur=row0,isNew=!row0;const d=document.createElement('div'),R=row0||{},v=k=>esc(R[k]==null?'':R[k]);d.className='mod';
 d.innerHTML=`<form class="wide" novalidate><h3 style="font-size:24px;margin-bottom:14px">${t(isNew?'admin.new':'common.edit')}</h3><div class="fr2">
  <div><label for="cf-brand">${t('compat.f.brand')} *</label><input id="cf-brand" name="brand" list="cf-bl" maxlength="300" autocomplete="off" value="${v('brand')}"><datalist id="cf-bl">${cpBrands().map(b=>`<option value="${esc(b)}">`).join('')}</datalist></div>
  <div><label for="cf-model">${t('compat.f.model')} *</label><input id="cf-model" name="model" maxlength="300" value="${v('model')}"></div>
  <div><label for="cf-yf">${t('compat.f.yearFrom')}</label><input id="cf-yf" name="year_from" inputmode="numeric" maxlength="4" value="${v('year_from')}"></div>
  <div><label for="cf-yt">${t('compat.f.yearTo')}</label><input id="cf-yt" name="year_to" inputmode="numeric" maxlength="4" value="${v('year_to')}"></div>
  <div><label for="cf-en">${t('compat.f.engine')}</label><input id="cf-en" name="engine" maxlength="300" value="${v('engine')}"></div>
  <div><label for="cf-fu">${t('compat.f.fuel')}</label><select id="cf-fu" name="fuel"><option value="">—</option>${(R.fuel&&!CP_FUEL.includes(R.fuel)?[R.fuel,...CP_FUEL]:CP_FUEL).map(x=>`<option value="${esc(x)}" ${R.fuel===x?'selected':''}>${esc(cpFuel(x))}</option>`).join('')}</select></div>
  <div class="w"><label for="cf-sp">${t('compat.f.spec')} <small>(${t('admin.hint.semi')})</small></label><textarea id="cf-sp" name="spec_required" rows="2">${v('spec_required')}</textarea></div>
  <div><label for="cf-sae">${t('compat.f.sae')}</label><input id="cf-sae" name="sae" maxlength="300" value="${v('sae')}"></div>
  <div class="w"><label for="cf-no">${t('compat.f.note')}</label><textarea id="cf-no" name="note" rows="3">${v('note')}</textarea></div></div>
  <div data-ie role="alert"></div>
  <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>${t('common.cancel')}</button><button class="btn gold">${t('common.save')}</button></div></form>`;
 document.body.appendChild(d);const close=()=>d.remove(),fm=$('form',d),ie=$('[data-ie]',d),X=$('[data-x]',d);X.onclick=close;d.onclick=e=>{if(e.target===d)close()};
 const say=(errs,warns)=>{ie.innerHTML=[...errs.map(m=>`<p class="note cp-ne">${esc(m)}</p>`),...warns.map(m=>`<p class="note cp-nw">${esc(m)}</p>`)].join('')},
  val=k=>fm.elements[k].value.trim();
 fm.onsubmit=async e=>{e.preventDefault();say([],[]);const o={},errs=[],warns=[];
  ['brand','model','year_from','year_to','engine','fuel','spec_required','sae','note'].forEach(k=>{o[k]=k==='note'||k==='spec_required'?fm.elements[k].value.trim():val(k)});
  if(!o.brand)errs.push(t('compat.issue.brand_empty'));if(!o.model)errs.push(t('compat.issue.model_empty'));
  ['year_from','year_to'].forEach(k=>{if(o[k]&&!(/^\d{4}$/.test(o[k])&&+o[k]>=1900&&+o[k]<=2100))errs.push(t('compat.issue.year_bad',{f:cpFld(k)}))});
  if(!errs.length&&o.year_from&&o.year_to&&+o.year_from>+o.year_to)errs.push(t('compat.issue.years_order'));
  if(o.fuel&&!CP_FUEL.includes(o.fuel)&&o.fuel!==(R.fuel||''))errs.push(t('compat.issue.fuel_bad'));
  if(errs.length){say(errs,[]);const bad=['brand','model','year_from','year_to'].find(k=>!o[k]&&(k==='brand'||k==='model')||o[k]&&/year/.test(k)&&!/^\d{4}$/.test(o[k]));if(bad)fm.elements[bad].focus();return}
  const spec=o.spec_required.split(/[;\n]+/).map(x=>x.trim()).filter(Boolean);o.spec_required=spec.join(';');
  const row={};if(isNew)Object.assign(row,o);else{row.id=cur.id;Object.keys(o).forEach(k=>{if(o[k]!==String(cur[k]==null?'':cur[k]).trim())row[k]=o[k]});if(Object.keys(row).length===1){close();return}}
  const b=$('.gold',fm);b.disabled=true;const r=await adCall({action:'upsert',sheet:'Compat',row});
  if(!r.ok){b.disabled=false;return say([adErr(r.error)],[])}
  const id=r.row&&r.row.id||row.id;cur=Object.assign({},cur||{},r.row||{},o,{id});isNew=false;R.fuel=cur.fuel;
  const err=await cpLoad();b.disabled=false;if($('#cp'))cpPaint(u);if(err){adSay(adErr(err));return close()}
  /* замечания сервера (compat_check) по только что сохранённой строке: показываем в форме */
  const iss=cpIss(id),er=iss.filter(c=>!/^(spec_empty|sae_format|dup)$/.test(c)),wr=iss.filter(c=>/^(spec_empty|sae_format|dup)$/.test(c));
  if(!iss.length){close();return adSay(t('staff.saved'))}
  say(er.map(cpMsg),wr.map(c=>c==='dup'?t('compat.issue.dup'):cpMsg(c)));X.textContent=t('common.close');adSay(t('staff.saved'))};
 const fi=$('input',d);if(fi)fi.focus()}

/* ===== импорт CSV (этап G2.2a): разбор в браузере (csv.js) → compat_import с dry_run:true → отчёт → запись только после отчёта и при тех же файле и параметрах ===== */
const CI_MAX=2000,CI_BYTES=5*1024*1024,
 cpErr=r=>r.error==='ERR_TOO_MANY'?t('compat.err.tooMany',{max:r.max||CI_MAX}):adErr(r.error),
 ciName=id=>{const r=CP.rows.find(x=>x.id===id);return r?[r.brand,r.model,cpYears(r)].filter(Boolean).join(' ')+' · '+id:String(id)};
async function ciRead(file){const buf=await file.arrayBuffer();try{return{text:new TextDecoder('utf-8',{fatal:true}).decode(buf),enc:'utf-8'}}catch(e){return{text:new TextDecoder('windows-1251').decode(buf),enc:'windows-1251'}}}
function cpImport(u){const S={fid:0,rec:null,lines:null,name:'',enc:'',seq:0,rep:null,sig:'',busy:false,done:false,msg:'',err:'',flt:''},d=document.createElement('div');d.className='mod';
 d.innerHTML=`<form class="wide ci" novalidate><h3 style="font-size:24px;margin-bottom:8px">${t('compat.import.title')}</h3>
  <p class="sub ci-h">${t('compat.import.hint')} <a href="./data/compat-template.csv" download="compat-template.csv" id="ci-tp">${t('compat.import.template')}</a></p>
  <label class="btn ghost ci-f" style="margin:0;cursor:pointer;display:inline-flex">⤒ ${t('compat.import.pick')}<input type="file" id="ci-file" hidden accept=".csv,text/csv,text/plain,application/vnd.ms-excel"></label>
  <div class="fr2 ci-o"><div><label for="ci-dup">${t('compat.import.onDup')}</label><select id="ci-dup" name="on_dup"><option value="skip">${t('compat.import.skip')}</option><option value="update">${t('compat.import.update')}</option></select><small>${t('compat.import.onDupH')}</small></div>
   <div><label class="ck" style="margin-top:34px"><input type="checkbox" id="ci-strict" name="strict"> ${t('compat.import.strict')}</label></div></div>
  <p class="sub ci-st" id="ci-st" role="status"></p><div id="ci-rep"></div><div id="ci-er" role="alert"></div>
  <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;flex-wrap:wrap"><button type="button" class="btn ghost" data-x>${t('common.close')}</button><button type="submit" class="btn gold" id="ci-go" disabled>${t('compat.import.go')}</button></div></form>`;
 document.body.appendChild(d);const fm=$('form',d),close=()=>d.remove(),$$e=s=>$(s,d);$('[data-x]',d).onclick=close;d.onclick=e=>{if(e.target===d)close()};
 const sig=()=>[S.fid,$$e('#ci-dup').value,$$e('#ci-strict').checked].join('|'),
  ok=()=>!!(S.rep&&S.rep.sig===sig()&&!S.busy&&!S.done&&!S.rep.blocked&&(S.rep.summary.new+S.rep.summary.update)>0),
  fl=n=>(S.lines&&S.lines[n-2])||n; /* номер записи у сервера → строка файла (с учётом пустых строк и переносов в кавычках) */
 function paint(){const r=S.rep,go=$$e('#ci-go');go.disabled=!ok();
  go.textContent=ok()?t('compat.import.goN',{n:fmtNum(r.summary.new+r.summary.update)}):t('compat.import.go');
  $$e('#ci-st').textContent=S.busy?t('compat.import.checking'):S.msg;
  $$e('#ci-er').innerHTML=S.err?`<p class="note cp-ne">${esc(S.err)}</p>`:'';
  const el=$$e('#ci-rep');if(!r||r.sig!==sig()){el.innerHTML='';return}
  const m=r.summary,items=(r.rows||[]).filter(x=>!S.flt||(S.flt==='warn'?x.status!=='error'&&x.status!=='dup'&&x.warnings.length:x.status===S.flt)),
   chip=(k,v,c)=>`<li class="ci-c ${c||''}"><b>${fmtNum(v)}</b><span>${t('compat.import.sum.'+k)}</span></li>`,
   st=x=>`<span class="cp-b ${x.status==='error'?'cp-yr':x.status==='dup'?'cp-dup':'cp-oth'}"><i aria-hidden="true">${({error:'⚠',dup:'⧉',new:'+',update:'↻'})[x.status]}</i> ${t('compat.import.st.'+x.status)}</span>`,
   dp=x=>x.dup_of?t('compat.import.dupOf',{name:esc(ciName(x.dup_of))}):x.dup_line?t('compat.import.dupLine',{n:fl(x.dup_line)}):'—';
  el.innerHTML=`<ul class="ci-sum">${chip('total',m.total)}${chip('new',m.new,'ok')}${chip('update',m.update,'ok')}${chip('dup',m.dup,m.dup?'dup':'')}${chip('error',m.error,m.error?'er':'')}${chip('spec',m.spec_empty,m.spec_empty?'spec':'')}${chip('sae',m.sae_format)}</ul>
   ${r.ignored_columns&&r.ignored_columns.length?`<p class="note cp-nw">${t('compat.import.ignored',{list:esc(r.ignored_columns.join(', '))})}</p>`:''}
   ${r.blocked?`<p class="note cp-ne">${t('compat.import.blocked')}</p>`:!(m.new+m.update)?`<p class="note">${t('compat.import.nothing')}</p>`:''}
   <div class="ci-fb"><select id="ci-fl" aria-label="${esc(t('compat.import.filter'))}">${[['','all'],['error','error'],['dup','dup'],['warn','warn']].map(([v,k])=>`<option value="${v}" ${S.flt===v?'selected':''}>${t('compat.import.f.'+k)}</option>`).join('')}</select><small>${t('compat.import.only')}${r.truncated?' '+t('compat.import.trunc'):''}</small></div>
   <div class="tw ci-t"><table class="tb ci-tb"><tr><th>${t('compat.import.col.line')}</th><th>${t('compat.import.col.status')}</th><th>${t('compat.import.col.issues')}</th><th>${t('compat.import.col.dup')}</th></tr>
   ${items.map(x=>`<tr class="ci-r-${x.status}"><td data-l="${esc(t('compat.import.col.line'))}"><b>${fl(x.line)}</b></td><td data-l="${esc(t('compat.import.col.status'))}">${st(x)}</td><td data-l="${esc(t('compat.import.col.issues'))}">${x.errors.map(c=>`<span class="ci-e">${esc(cpMsg(c))}</span>`).join('')}${x.warnings.map(c=>`<span class="ci-w">${esc(cpMsg(c))}</span>`).join('')}</td><td data-l="${esc(t('compat.import.col.dup'))}">${dp(x)}</td></tr>`).join('')||`<tr><td colspan="4">${t('common.empty')}</td></tr>`}</table></div>`;
  const f=$$e('#ci-fl');if(f)f.onchange=e=>{S.flt=e.target.value;paint()}}
 /* смена файла или параметров сразу гасит кнопку (отчёт устарел) и запускает новую проверку */
 async function dry(){const my=++S.seq,s=sig();S.rep=null;S.err='';S.msg='';S.done=false;if(!S.rec){paint();return}
  S.busy=true;paint();const r=await adCall({action:'compat_import',rows:S.rec,dry_run:true,first_line:2,on_dup:$$e('#ci-dup').value,strict:$$e('#ci-strict').checked});
  if(my!==S.seq)return;S.busy=false;if(!r.ok){S.err=cpErr(r);paint();return}r.sig=s;S.rep=r;S.msg=S.name+' · '+t('compat.import.rows',{n:fmtNum(S.rec.length)})+(S.enc==='windows-1251'?' · '+t('compat.import.enc1251'):'');paint()}
 const fail=m=>{S.seq++;S.rec=null;S.rep=null;S.busy=false;S.err=m;S.msg='';paint()};
 $$e('#ci-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';S.fid++;S.seq++;S.rep=null;S.rec=null;S.err='';S.done=false;S.flt='';paint();if(!f)return;S.name=f.name;
  if(f.size>CI_BYTES)return fail(t('compat.import.tooBig'));
  let rd;try{rd=await ciRead(f)}catch(x){return fail(t('compat.import.readFail'))}
  const p=Csv.parse(rd.text);if(p.unclosed)return fail(t('compat.import.badQuote'));
  const R=Csv.records(p);if(!R.records.length)return fail(t('compat.import.empty'));
  if(!R.header.some(h=>h==='brand'||h==='marka')||!R.header.includes('model'))return fail(t('compat.import.noHeader'));
  if(R.records.length>CI_MAX)return fail(t('compat.import.tooMany',{n:fmtNum(R.records.length),max:fmtNum(CI_MAX)})); /* файл не отправляется */
  S.rec=R.records;S.lines=R.lines;S.enc=rd.enc;dry()};
 $$e('#ci-dup').onchange=()=>{S.fid++;dry()};$$e('#ci-strict').onchange=()=>{S.fid++;dry()};
 fm.onsubmit=async e=>{e.preventDefault();if(!ok())return;const s=sig();S.busy=true;S.err='';paint();
  const r=await adCall({action:'compat_import',rows:S.rec,dry_run:false,first_line:2,on_dup:$$e('#ci-dup').value,strict:$$e('#ci-strict').checked});
  S.busy=false;if(!r.ok||s!==sig()){S.err=r.ok?'':cpErr(r);paint();return}
  S.done=true;S.rep=null;const m=r.summary;S.msg=r.blocked||!r.written?t('compat.import.nothing'):t('compat.import.done',{n:fmtNum(r.written),a:fmtNum(m.new),b:fmtNum(m.update),c:fmtNum(m.dup),d:fmtNum(m.error)});paint();adSay(S.msg);
  const err=await cpLoad();if($('#cp'))cpPaint(u);if(err)adSay(adErr(err))};
 paint();$$e('#ci-file').focus()}

/* ===== массовая правка (этап G2.2b): выбор строк → compat_bulk с dry_run:true → отчёт → запись только после отчёта, при тех же строках и параметрах и после подтверждения ===== */
const CB_MAX=500, /* лимит сервера (COMPAT_MAX_IDS) */
 cbVal=(k,v)=>k==='fuel'?cpFuel(v):k==='spec_required'?cpSpec(v):String(v==null?'':v),
 cbList=v=>String(v||'').split(';').map(x=>x.trim()).filter(Boolean),
 cbErr=r=>r.error==='ERR_TOO_MANY'?t('compat.err.tooMany',{max:r.max||CB_MAX}):r.error==='ERR_BAD'&&r.reason==='spec_empty'?t('compat.bulk.err.specEmpty'):r.error==='ERR_BAD'&&r.reason==='replace'?t('compat.bulk.err.replace'):r.error==='ERR_BAD'&&r.reason==='value'&&r.errors&&r.errors.length?r.errors.map(cpMsg).join('; '):adErr(r.error);
function cpBulk(u){const ids=[...CP.sel];if(!ids.length||ids.length>CB_MAX)return;
 const S={seq:0,rep:null,busy:false,done:false,msg:'',err:''},d=document.createElement('div');d.className='mod';
 const fld=(k,inp)=>`<div class="cb-f"><label class="ck"><input type="checkbox" id="cb-c-${k}"> ${t('compat.f.'+k)}: ${t('compat.bulk.change')}</label>${inp}</div>`;
 d.innerHTML=`<form class="wide cb" novalidate><h3 style="font-size:24px;margin-bottom:8px">${t('compat.bulk.title')}</h3>
  <p class="sub cb-h"><b>${t('compat.bulk.for',{n:fmtNum(ids.length)})}</b>. ${t('compat.bulk.hint')}</p>
  <div class="cb-f"><label for="cb-sm">${t('compat.f.spec')}</label><select id="cb-sm"><option value="">${t('compat.bulk.sm.none')}</option><option value="set">${t('compat.bulk.sm.set')}</option><option value="add">${t('compat.bulk.sm.add')}</option><option value="remove">${t('compat.bulk.sm.remove')}</option><option value="replace">${t('compat.bulk.sm.replace')}</option></select>
   <div id="cb-sv-w" hidden><label for="cb-sv">${t('compat.bulk.specVal')} <small>(${t('admin.hint.semi')})</small></label><textarea id="cb-sv" rows="2" maxlength="500"></textarea></div>
   <div class="fr2" id="cb-rp-w" hidden><div><label for="cb-fi">${t('compat.bulk.find')}</label><input id="cb-fi" maxlength="120"></div><div><label for="cb-wi">${t('compat.bulk.with')}</label><input id="cb-wi" maxlength="120"></div></div>
   <small>${t('compat.bulk.specHint')}</small></div>
  ${fld('sae',`<input id="cb-sae" maxlength="300" disabled aria-label="${esc(t('compat.f.sae'))}"><small>${t('compat.bulk.saeHint')}</small>`)}
  ${fld('fuel',`<select id="cb-fuel" disabled aria-label="${esc(t('compat.f.fuel'))}">${CP_FUEL.map(x=>`<option value="${x}">${t('compat.fuel.'+x)}</option>`).join('')}</select>`)}
  ${fld('note',`<textarea id="cb-note" rows="2" maxlength="1000" disabled aria-label="${esc(t('compat.f.note'))}"></textarea><small>${t('compat.bulk.noteHint')}</small>`)}
  <p class="sub cb-st" id="cb-st" role="status"></p><div id="cb-rep"></div><div id="cb-er" role="alert"></div>
  <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;flex-wrap:wrap"><button type="button" class="btn ghost" data-x>${t('common.close')}</button><button type="button" class="btn ghost" id="cb-ck">${t('compat.bulk.check')}</button><button type="submit" class="btn gold" id="cb-go" disabled>${t('compat.bulk.apply')}</button></div></form>`;
 document.body.appendChild(d);const fm=$('form',d),close=()=>d.remove(),$$e=s=>$(s,d);$('[data-x]',d).onclick=close;d.onclick=e=>{if(e.target===d)close()};
 /* параметры собираются из формы; неотмеченные поля на сервер не уходят */
 const build=()=>{const set={},spec={};let n=0;const m=$$e('#cb-sm').value;
  if(m==='set'||m==='add'||m==='remove'){const l=cbList($$e('#cb-sv').value);if(!l.length)return{err:t('compat.bulk.err.specList')};if(m==='set')set.spec_required=l.join(';');else spec[m]=l;n++}
  else if(m==='replace'){const a=cbList($$e('#cb-fi').value),b=cbList($$e('#cb-wi').value);if(a.length!==1||b.length!==1)return{err:t('compat.bulk.err.replace')};spec.replace={find:a[0],with:b[0]};n++}
  if($$e('#cb-c-sae').checked){const v=$$e('#cb-sae').value.trim();if(!v)return{err:t('compat.bulk.err.empty',{f:t('compat.f.sae')})};set.sae=v;n++}
  if($$e('#cb-c-fuel').checked){set.fuel=$$e('#cb-fuel').value;n++}
  if($$e('#cb-c-note').checked){set.note=$$e('#cb-note').value.trim();n++}
  if(!n)return{err:t('compat.bulk.err.nothing')};return{set,spec,sig:JSON.stringify([ids,set,spec])}},
  cur=()=>{const b=build();return b.err?'':b.sig},
  ok=()=>!!(S.rep&&!S.busy&&!S.done&&S.rep.changed>0&&S.rep.sig===cur());
 function paint(){const r=S.rep,go=$$e('#cb-go');go.disabled=!ok();go.textContent=ok()?t('compat.bulk.applyN',{n:fmtNum(r.changed)}):t('compat.bulk.apply');
  $$e('#cb-ck').disabled=S.busy||S.done;$$e('#cb-st').textContent=S.busy?t('compat.bulk.checking'):S.msg;
  $$e('#cb-er').innerHTML=S.err?`<p class="note cp-ne">${esc(S.err)}</p>`:'';
  const el=$$e('#cb-rep');if(!r){el.innerHTML='';return}
  const chip=(k,v,c)=>`<li class="ci-c ${c||''}"><b>${fmtNum(v)}</b><span>${t('compat.bulk.sum.'+k)}</span></li>`,
   why=x=>x.reason==='dup_result'||x.reason==='spec_empty_result'?t('compat.bulk.blk.'+x.reason):esc(x.reason);
  el.innerHTML=`<ul class="ci-sum">${chip('changed',r.changed,r.changed?'ok':'')}${chip('unchanged',r.unchanged)}${chip('blocked',r.blocked.length,r.blocked.length?'er':'')}${chip('missing',r.missing.length,r.missing.length?'er':'')}</ul>
   ${r.changed?'':`<p class="note">${t('compat.bulk.nothing')}</p>`}
   ${r.blocked.length?`<p class="note cp-ne"><b>${t('compat.bulk.blk.title')}</b></p><ul class="cb-bl">${r.blocked.map(x=>`<li><b>${esc(ciName(x.id))}</b>: ${why(x)}</li>`).join('')}</ul>`:''}
   ${r.missing.length?`<p class="note cp-nw">${t('compat.bulk.missing',{n:fmtNum(r.missing.length)})}</p>`:''}
   ${r.preview.length?`<h4 class="cb-ph">${t('compat.bulk.prev',{n:fmtNum(r.preview.length)})}${r.changed>r.preview.length?' · '+t('compat.bulk.prevMore',{n:fmtNum(r.changed)}):''}</h4><ul class="cb-pv">${r.preview.map(p=>`<li><b>${esc(p.name)}</b>${Object.keys(p.after).map(k=>`<span class="cb-ch"><em>${esc(cpFld(k))}</em> ${esc(cbVal(k,p.before[k])||'—')} → <b>${esc(cbVal(k,p.after[k])||'—')}</b></span>`).join('')}</li>`).join('')}</ul>`:''}`}
 /* любое изменение формы гасит кнопку «Применить» сразу: отчёт относится к прежним параметрам */
 const inval=()=>{S.seq++;S.rep=null;S.err='';S.msg='';S.busy=false;paint()};
 $$e('#cb-sm').onchange=e=>{const m=e.target.value;$$e('#cb-sv-w').hidden=!(m==='set'||m==='add'||m==='remove');$$e('#cb-rp-w').hidden=m!=='replace';inval()};
 ['sae','fuel','note'].forEach(k=>$$e('#cb-c-'+k).onchange=e=>{$$e('#cb-'+k).disabled=!e.target.checked;inval()});
 $$('input:not([type=checkbox]),textarea,select',d).forEach(x=>{x.oninput=inval;if(x.tagName==='SELECT')x.onchange=x.id==='cb-sm'?x.onchange:inval});
 $$e('#cb-ck').onclick=async()=>{const b=build();if(b.err){S.rep=null;S.err=b.err;paint();return}
  const my=++S.seq;S.busy=true;S.err='';S.msg='';S.rep=null;paint();
  const r=await adCall({action:'compat_bulk',ids,set:b.set,spec:b.spec,dry_run:true});
  if(my!==S.seq)return;S.busy=false;if(!r.ok){S.err=cbErr(r);paint();return}r.sig=b.sig;S.rep=r;paint()};
 fm.onsubmit=async e=>{e.preventDefault();if(!ok())return;const b=build(),exp=S.rep.changed;
  if(!confirm(t('compat.bulk.ask',{n:fmtNum(exp)})))return;
  const my=++S.seq;S.busy=true;S.err='';paint();
  const r=await adCall({action:'compat_bulk',ids,set:b.set,spec:b.spec,dry_run:false}); /* dry_run:false всегда явно */
  if(my!==S.seq)return;S.busy=false;if(!r.ok){S.err=cbErr(r);S.rep=null;paint();return}
  S.done=true;S.rep=null;S.msg=t('compat.bulk.done',{n:fmtNum(r.written)})+(r.written!==exp?'. '+t('compat.bulk.mismatch',{a:fmtNum(exp),b:fmtNum(r.written)}):'');
  CP.sel.clear();paint();adSay(S.msg);const err=await cpLoad();if($('#cp'))cpPaint(u);if(err)adSay(adErr(err))};
 paint();$$e('#cb-sm').focus()}

// v2.21-E8: резервная копия таблицы (только admin) и QR-коды сайта и записи для печати
async function backupInit(u){
 const el=$('#backup');if(!el||!u||u.role!=='admin')return;const tx=k=>t('backup.'+k);
 el.innerHTML=`<section class="panel" style="margin-bottom:16px"><h2>${tx('title')}</h2><p class="sub">${tx('hint')}</p><div id="bk-state" class="note">${t('common.loading')}</div><form id="bk-form" class="form-grid"><label>${tx('keep')}<input name="keep" inputmode="numeric" maxlength="2" autocomplete="off"></label><div class="form-actions"><button class="btn gold" type="submit">${t('common.save')}</button><button class="btn ghost" type="button" id="bk-run">${tx('run')}</button><button class="btn ghost" type="button" id="bk-tr"></button></div></form><p id="bk-msg" role="status"></p></section>`;
 let st=null;const msg=m=>{const e=$('#bk-msg');if(e)e.textContent=m},
  paint=()=>{$('#bk-state').textContent=`${tx('trigger')}: ${t(st.trigger?'integ.enabled':'integ.disabled')} · ${tx('last')}: ${st.last||tx('never')} · ${tx('files')}: ${st.count}`+(st.lastError?` · ${tx('lastError')}: ${st.lastError}`:'');$('#bk-form').elements.keep.value=st.keep;$('#bk-tr').textContent=tx(st.trigger?'off':'on')},
  load=async()=>{const r=await adCall({action:'settings_backup',mode:'status'});if(!r.ok){$('#bk-state').textContent=adErr(r.error);return false}st=r;paint();return true},
  act=async(b,mode,extra,ok)=>{b.disabled=true;const r=await adCall(Object.assign({action:'settings_backup',mode},extra||{}));b.disabled=false;msg(r.ok?t(ok):(r.message||t('backup.fail')+' '+adErr(r.error)));if(r.ok||mode==='run')await load()};
 if(!await load())return;
 $('#bk-form').onsubmit=e=>{e.preventDefault();act(e.submitter,'set_keep',{keep:e.target.elements.keep.value},'integ.saved')};
 $('#bk-run').onclick=e=>act(e.target,'run',null,'backup.done');
 $('#bk-tr').onclick=e=>act(e.target,st.trigger?'untrigger':'trigger',null,st.trigger?'backup.triggerOff':'backup.triggerOn');
}
function qrInit(u){
 const el=$('#qrs');if(!el||!u||u.role!=='admin')return;
 let root='';try{const x=new URL('./',location.href);x.hash='';x.search='';root=x.href}catch(e){}
 el.innerHTML=`<section class="panel" style="margin-bottom:16px"><h2>${t('qr.title')}</h2><p class="sub">${t('qr.hint')}</p><label>${t('qr.url')}<input id="qr-url" inputmode="url" maxlength="200" autocomplete="off" value="${esc(root)}"></label><div class="qr-row" id="qr-prev"></div><div class="form-actions"><button class="btn gold" type="button" id="qr-print">${t('label.print')}</button></div></section>`;
 // два адреса: сайт и страница записи (хэш-маршрут #/booking)
 const items=()=>{const b=($('#qr-url').value||'').trim().split('#')[0];if(!/^https?:\/\/[^\s]+$/i.test(b)||b.length>280)return null;return[['site',b],['booking',b+'#/booking']]},
  fig=(k,url,svg)=>`<figure class="qr-f"><figcaption>${t('qr.'+k)}</figcaption>${svg}<small>${esc(url)}</small></figure>`,
  draw=()=>{const it=items(),p=$('#qr-prev');let h='',ok=true;try{if(!it||typeof Labels==='undefined')throw 0;h=it.map(([k,url])=>fig(k,url,Labels.render('qr',url))).join('')}catch(e){ok=false;h=`<p class="note" style="border-color:#d9534f">${t('qr.err')}</p>`}p.innerHTML=h;return ok};
 draw();$('#qr-url').oninput=draw;
 $('#qr-print').onclick=()=>{if(!draw())return;const old=$('#qr-print-area');if(old)old.remove();const d=document.createElement('div');d.id='qr-print-area';d.innerHTML=$('#qr-prev').innerHTML.replace(/<\/figure>/g,`<p class="qr-s">${t('qr.scan')}</p></figure>`);document.body.appendChild(d);document.body.classList.add('qr-printing');
  addEventListener('afterprint',()=>{document.body.classList.remove('qr-printing');d.remove()},{once:true});window.print()};
}
/* ===== Интеграции Telegram / WhatsApp (этап H1) ===== */
async function devicesInit(u){
 const el=$('#devices');if(!el||!u||u.role!=='admin')return;
 el.innerHTML=`<section class="panel" style="margin-bottom:16px"><h2>${t('dev.title')}</h2><p class="sub">${t('dev.hint')}</p><div id="dev-body" class="note">${t('common.loading')}</div></section>`;
 const r=await adCall({action:'devices_list'}),b=$('#dev-body');if(!b)return;
 if(!r.ok){b.textContent=adErr(r.error);return}
 if(!(r.items||[]).length){b.textContent=t('dev.empty');return}
 b.className='tw';b.innerHTML='<table class="tb"><tr><th>'+t('staff.name')+'</th><th>'+t('dev.title')+'</th></tr>'+r.items.map(i=>'<tr><td>'+esc(i.name)+'<br><small>'+esc(i.login)+'</small></td><td>'+i.rows.map(x=>esc(x.time)+' · '+t('dev.t.'+x.type)+' · '+t('dev.mode.'+x.mode)).join('<br>')+'</td></tr>').join('')+'</table>';
}
async function integrationInit(u){
 const el=$('#integration');if(!el||!u||u.role!=='admin')return;
 const tx=k=>t('integ.'+k),api=async b=>adCall(b);
 el.innerHTML=`<section class="panel" style="margin-bottom:16px"><h2>${tx('title')}</h2><p class="sub">${tx('secret')}</p><div id="integ-tg-state" class="note">${t('common.loading')}</div>
 <form id="integ-tg-form" class="form-grid"><label>${tx('generalChat')}<input name="chatId" autocomplete="off" placeholder="-1001234567890"></label><div class="form-actions"><button class="btn gold" type="submit">${tx('save')}</button><button class="btn ghost" type="button" id="integ-tg-test">${tx('testGeneral')}</button><button class="btn ghost" type="button" id="integ-tg-trigger">${tx('trigger')}</button></div></form><div id="integ-tg-points"></div><p id="integ-tg-msg" role="status"></p></section>
 <section class="panel"><h2>${tx('waTitle')}</h2><p class="sub">${tx('waHint')}</p><form id="integ-wa-general" class="form-grid"><label>${tx('waGeneral')}<input name="phone" inputmode="tel" autocomplete="tel" placeholder="+7 701 123 45 67"><small data-wa-preview></small><small data-wa-error></small></label><div class="form-actions"><button class="btn gold" type="submit">${tx('save')}</button></div></form><div id="integ-wa-points"></div><p id="integ-wa-msg" role="status"></p></section>`;
 const tg=await api({action:'settings_tg',mode:'status'});if(!tg.ok){$('#integ-tg-state').textContent=adErr(tg.error);return}
 $('#integ-tg-form').elements.chatId.value='';$('#integ-tg-form').elements.chatId.placeholder=tg.chatIdMasked||tx('empty');
 const tgStatus=()=>`${tx('token')}: ${tg.tokenConfigured?tx('configured'):tx('missing')} · ${tx('generalChat')}: ${tg.chatIdMasked||tx('empty')} · ${tx('queue')}: ${tg.queueCount} · ${tx('retry')}: ${tg.triggerInstalled?tx('enabled'):tx('disabled')}${tg.lastError?' · '+tx('lastError')+': '+tg.lastError:''}`;
 $('#integ-tg-state').textContent=tgStatus();
 $('#integ-tg-points').innerHTML=`<h3>${tx('pointChats')}</h3>`+(tg.points||[]).map(p=>`<div class="bar" style="justify-content:space-between"><span>${esc(p.name)} — ${p.hasChat?esc(p.chatId):tx('fallbackGeneral')}</span><button class="btn ghost" type="button" data-tgpoint="${esc(p.id)}">${tx('test')}</button><span data-tgres="${esc(p.id)}" class="sub"></span></div>`).join('');
 const tgMsg=m=>$('#integ-tg-msg').textContent=m;
 $('#integ-tg-form').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;const r=await api({action:'settings_tg',mode:'set_chat',chatId:e.target.elements.chatId.value.trim()});b.disabled=false;tgMsg(r.ok?tx('saved'):adErr(r.error));if(r.ok)integrationInit(u)};
 $('#integ-tg-test').onclick=async()=>{const b=$('#integ-tg-test');b.disabled=true;const r=await api({action:'settings_tg',mode:'test'});b.disabled=false;tgMsg(r.ok?tx('sent'):((r.message||tx('failed'))+' '+(r.error||'')));const st=await api({action:'settings_tg',mode:'status'});if(st.ok){tg.lastError=st.lastError;tg.queueCount=st.queueCount;$('#integ-tg-state').textContent=tgStatus()}};
 $('#integ-tg-trigger').onclick=async()=>{const b=$('#integ-tg-trigger');b.disabled=true;const r=await api({action:'settings_tg',mode:'trigger'});b.disabled=false;tgMsg(r.ok?tx('triggerOn'):adErr(r.error));if(r.ok)integrationInit(u)};
 $$('[data-tgpoint]',el).forEach(b=>b.onclick=async()=>{b.disabled=true;const r=await api({action:'settings_tg',mode:'test',pointId:b.dataset.tgpoint});b.disabled=false;const out=$(`[data-tgres="${b.dataset.tgpoint}"]`);out.textContent=r.ok?tx('sent'):(r.message||tx('failed'));if(!r.ok){const st=await api({action:'settings_tg',mode:'status'});if(st.ok){tg.lastError=st.lastError;tg.queueCount=st.queueCount;$('#integ-tg-state').textContent=tgStatus()}}});
 const wa=await api({action:'settings_whatsapp',mode:'status'});if(!wa.ok){$('#integ-wa-msg').textContent=adErr(wa.error);return}
 const general=$('#integ-wa-general');general.elements.phone.value=wa.general||'';
 const preview=(input,wrap)=>{const n=normalizeWhatsApp(input.value),p=wrap.querySelector('[data-wa-preview]'),err=wrap.querySelector('[data-wa-error]');if(!input.value.trim()){input.setCustomValidity('');p.textContent=tx('waEmpty');err.textContent='';return}if(!n.ok){p.textContent='';err.textContent=n.error;input.setCustomValidity(n.error);return}input.setCustomValidity('');err.textContent='';p.innerHTML=`${tx('preview')}: <a target="_blank" rel="noopener" href="${esc(waLink(n.value,tx('waTestText')))}">wa.me/${esc(n.value)}</a>`};
 const gInput=general.elements.phone;gInput.addEventListener('input',()=>preview(gInput,gInput.parentElement));preview(gInput,gInput.parentElement);
 general.onsubmit=async e=>{e.preventDefault();preview(gInput,gInput.parentElement);if(!gInput.reportValidity())return;const b=e.submitter;b.disabled=true;const r=await api({action:'settings_whatsapp',mode:'set_general',phone:gInput.value});b.disabled=false;$('#integ-wa-msg').textContent=r.ok?tx('saved'):(r.error==='ERR_WA_PHONE'?tx('waBad'):((r.message||'')+' '+adErr(r.error)));if(r.ok){gInput.value=r.phone;preview(gInput,gInput.parentElement)}};
 $('#integ-wa-points').innerHTML=`<h3>${tx('pointPhones')}</h3>`+(wa.points||[]).map(p=>`<form class="panel integ-wa-point" data-point="${esc(p.id)}" style="margin:10px 0"><label>${esc(p.name)}<input name="phone" inputmode="tel" value="${esc(p.whatsapp)}" placeholder="${tx('waPlaceholder')}"><small data-wa-preview></small><small data-wa-error></small></label><button class="btn ghost" type="submit">${tx('save')}</button></form>`).join('');
 $$('.integ-wa-point',el).forEach(f=>{const input=f.elements.phone;input.addEventListener('input',()=>preview(input,f));preview(input,f);f.onsubmit=async e=>{e.preventDefault();preview(input,f);if(!input.reportValidity())return;const b=e.submitter;b.disabled=true;const r=await api({action:'settings_whatsapp',mode:'set_point',pointId:f.dataset.point,phone:input.value});b.disabled=false;$('#integ-wa-msg').textContent=r.ok?tx('saved'):(r.error==='ERR_WA_PHONE'?tx('waBad'):((r.message||'')+' '+adErr(r.error)));if(r.ok){input.value=r.phone;preview(input,f)}}});
}

/* ===== маршрутизация admin.html (шаг 1.4; разделы каталога — этап B1) ===== */
const CGR={roles:['admin','manager']},
 ADMIN_CFG={app:'admin',allowed:['admin','manager'],other:{url:'./staff.html',key:'gate.goStaff'},def:'dash',
 routes:{dash:{k:'nav.dash',perm:'view_reports'},products:{k:'nav.products',perm:'view_products'},categories:Object.assign({k:'nav.categories'},CGR),services:Object.assign({k:'nav.services'},CGR),promos:Object.assign({k:'nav.promo'},CGR),promocodes:Object.assign({k:'nav.promocodes'},CGR),ads:Object.assign({k:'nav.ads'},CGR),news:Object.assign({k:'nav.news'},CGR),reviews:Object.assign({k:'nav.reviews'},CGR),points:Object.assign({k:'nav.points'},CGR),compat:Object.assign({k:'nav.compat'},CGR),bookings:{k:'nav.bookings',perm:'manage_bookings'},remind:{k:'nav.remind',perm:['manage_bookings','view_reports']},staff:{k:'nav.staff',perm:'manage_staff'},receipt:{k:'pos.income',perm:'create_receipt'},stock:{k:'pos.warehouse',perm:['edit_stock','create_receipt','view_reports']},inventory:{k:'nav.inventory',perm:'edit_stock'},shifts:{k:'nav.shifts',perm:'view_reports'},sales:{k:'nav.sales',perm:'view_reports'},clients:{k:'nav.clients',perm:['manage_bookings','sell','view_reports']},settings:{k:'nav.settings',roles:['admin']}},
 nav:[['dash','nav.dash'],['bookings','nav.bookings'],['remind','nav.remind'],['products','nav.products'],['categories','nav.categories'],['services','nav.services'],['promos','nav.promo'],['promocodes','nav.promocodes'],['ads','nav.ads'],['news','nav.news'],['reviews','nav.reviews'],['points','nav.points'],['compat','nav.compat'],['staff','nav.staff'],['receipt','pos.income'],['stock','pos.warehouse'],['inventory','nav.inventory'],['shifts','nav.shifts'],['sales','nav.sales'],['clients','nav.clients'],['settings','nav.settings']],
 views:{products:(c,u)=>catView('Products',u),categories:(c,u)=>catView('Categories',u),services:(c,u)=>catView('Services',u),promos:(c,u)=>catView('Promos',u),promocodes:(c,u)=>catView('Promocodes',u),ads:(c,u)=>catView('Ads',u),news:(c,u)=>catView('News',u),reviews:(c,u)=>catView('Reviews',u),points:(c,u)=>catView('Points',u),compat:compatView,bookings:(c,u)=>catView('Bookings',u),remind:(c,u)=>{queueMicrotask(()=>{const el=$('#rm');if(el)Remind.mount(el,{call:adCall,err:adErr,say:adSay,canSettings:(u.perms||[]).includes('manage_settings')})});return `<div id="rm"><div class="sk" style="height:160px"></div></div>`},settings:(c,u)=>{queueMicrotask(()=>integrationInit(u));queueMicrotask(()=>devicesInit(u));queueMicrotask(()=>backupInit(u));queueMicrotask(()=>qrInit(u));return `<div id="integration"></div><div id="devices"></div><div id="backup"></div><div id="qrs"></div><div style="margin-top:18px">${catView('Settings',u)}</div>`},
  staff:(c,u)=>{queueMicrotask(()=>staffInit(u));return `<div id="sa"><div class="sk" style="height:160px"></div></div>`},
  receipt:(c,u)=>{queueMicrotask(()=>rcaInit(u));return `<div id="ra"><div class="sk" style="height:200px"></div></div>`},
  stock:(c,u)=>{queueMicrotask(()=>stockInit(u));return `<div id="sk"><div class="sk" style="height:200px"></div></div>`},
  shifts:(c,u)=>{queueMicrotask(()=>{const el=$('#shr');if(el)Shifts.report(el,{call:adCall,err:adErr,say:adSay,user:u})});return `<div id="shr"><div class="sk" style="height:200px"></div></div>`},
  inventory:(c,u)=>{queueMicrotask(()=>{const el=$('#iv');if(el)Inventory.mount(el,{call:adCall,err:adErr,say:adSay,user:u})});return `<div id="iv"><div class="sk" style="height:200px"></div></div>`},
  clients:(c,u)=>{queueMicrotask(()=>{const el=$('#chv');if(el)ClientHist.mount(el,{call:adCall,user:u})});return `<div class="sa"><div class="sa-h"><h1>${t('hist.title')}</h1></div><div id="chv"></div></div>`},
  sales:(c,u)=>{queueMicrotask(()=>salesInit(u));return `<div id="sl"><div class="sk" style="height:200px"></div></div>`},
  dash:(c,u)=>{queueMicrotask(()=>dashInit(u));return `<div id="ds"><div class="sk" style="height:96px"></div><div class="sk" style="height:96px;margin-top:12px"></div><div class="sk" style="height:220px;margin-top:12px"></div></div>`}}};
appShell(ADMIN_CFG).start();

/* Несохранённые данные прихода для pwa.js (подтверждение перед обновлением) */
window.OH_DIRTY=window.OH_DIRTY||[];window.OH_DIRTY.push(function(){return typeof AR!=='undefined'&&AR.lines&&AR.lines.length>0});
/* inventory draft is stored in localStorage, but a half-done count is still worth a confirmation before an update */
window.OH_DIRTY.push(function(){return typeof Inventory!=='undefined'&&Inventory.dirty()});
