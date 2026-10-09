/* site.js: логика публичного сайта */
const STAGE=()=>`<div class="stage" id="stage">
<svg viewBox="0 0 520 520" aria-hidden="true"><defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d58e"/><stop offset=".55" stop-color="#e0b25a"/><stop offset="1" stop-color="#aeb4bc"/></linearGradient></defs>
<circle class="ring" cx="260" cy="260" r="220" stroke="var(--line)"/>
<circle class="ring" id="arc" cx="260" cy="260" r="220" transform="rotate(-210 260 260)" stroke-dasharray="1382" stroke-dashoffset="1382"/>
<g id="ticks"></g>
<ellipse class="rip" cx="260" cy="330" rx="90" ry="90"/><ellipse class="rip" cx="260" cy="330" rx="90" ry="90"/>
<g class="drop"><path d="M260 150C260 150 205 220 205 275a55 55 0 00110 0C315 220 260 150 260 150z" fill="url(#gg)"/><path d="M248 200C228 235 222 262 230 288" stroke="#16181b" stroke-opacity=".55" stroke-width="9" fill="none" stroke-linecap="round"/></g>
</svg>
<div class="gauge"><b id="sae">5W-40</b><small>${t('home.saeClass')}</small></div>
<div class="chip c1"><b>API SP</b><span>${t('home.chip1')}</span></div>
<div class="chip c2"><b>ACEA E9</b><span>${t('home.chip2')}</span></div>
</div>`;
let D={},S={},demo=!API_URL;
const money=v=>v===''||v==null||isNaN(Number(v))?'':fmtMoney(v,S.currency);
// B1. WhatsApp по точкам. Номер точки (Points.whatsapp) приоритетнее общего Settings.whatsapp; пустой номер точки заменяется общим.
// Выбор точки (bottom-sheet #wsh, общий для всех кнопок с data-wa) показывается, только если у активных точек больше одного РАЗНОГО собственного номера.
// При одной точке (или одном номере) выбор не показывается, ссылка ведёт сразу на этот номер. Если номера нет вообще, кнопки не выводятся.
// Форма записи не спрашивает точку повторно: используется точка, выбранная в самой форме (waPt). Кнопки в контактах привязаны к своей точке (wa с явным номером).
const waPts=()=>(D.Points||[]).filter(p=>!p.hasOwnProperty('active')||isOn(p.active));
const waOwn=p=>{const n=normalizeWhatsApp(p&&p.whatsapp);return n.ok?n.value:''};
const waGen=()=>{const n=normalizeWhatsApp(S.whatsapp);return n.ok?n.value:''};
const waChoices=()=>srt(waPts()).map(p=>({p,num:waOwn(p)||waGen()})).filter(x=>x.num);
const waOwnSet=()=>srt(waPts()).map(waOwn).filter((n,i,a)=>n&&a.indexOf(n)===i);
const waNeedPick=()=>waOwnSet().length>1;
const waDef=()=>{const o=waOwnSet();return o.length===1?o[0]:(waGen()||(waChoices()[0]||{}).num||'')};
const wa=(txt,phone)=>waLink(phone||waDef(),txt);
const waPt=(id,txt)=>{const p=waPts().find(x=>x.id===id);return waLink((p&&waOwn(p))||waGen()||waDef(),txt)};/* номер точки пуст: Settings.whatsapp, и только потом любой доступный */
/* кнопка WhatsApp: настоящая ссылка (работает и без выбора), data-wa запускает выбор точки, когда он нужен */
const waBtn=(cls,label,txt,st)=>{const h=wa(txt);return h?`<a class="${cls}"${st?` style="${st}"`:''} target="_blank" rel="noopener" data-wa="${esc(txt)}" href="${esc(h)}">${label}</a>`:''};
function waClose(){const d=$('#wsh');if(!d)return;const f=d._f;d.remove();if(f&&f.focus&&document.contains(f))try{f.focus()}catch(e){}}
function waSheet(txt){waClose();const d=document.createElement('div');d.className='wsh';d.id='wsh';d._f=document.activeElement;d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label',t('wa.pick'));
 d.innerHTML=`<div class="wsp"><h3>${t('wa.pick')}</h3>${waChoices().map(({p,num})=>`<a class="btn ghost" target="_blank" rel="noopener" href="${esc(waLink(num,txt))}"><b>${esc(ptx(p,'name'))}</b>${p.city?`<small>${esc(p.city)}</small>`:''}</a>`).join('')}<button type="button" class="btn ghost" data-wx>${t('common.close')}</button></div>`;
 d.onclick=e=>{if(e.target===d||e.target.closest('[data-wx]')||e.target.closest('a'))setTimeout(waClose,0)};
 document.body.appendChild(d);const f=$('a',d);if(f)f.focus()}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[data-wa]');if(!a||!waNeedPick())return;e.preventDefault();waSheet(a.dataset.wa)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')waClose()});
document.addEventListener('langchange',waClose);
function toast(m){const e=$('#ts');e.textContent=m;e.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>e.classList.remove('on'),2800)}
function can(p,big){const g=esc(p.sae||'');return `<svg viewBox="0 0 90 130" aria-hidden="true"><rect x="14" y="26" width="62" height="98" rx="10" fill="#23262b" stroke="#e0b25a" stroke-width="2"/><path d="M30 26V14a6 6 0 016-6h20l8 8v10" fill="none" stroke="#aeb4bc" stroke-width="4" stroke-linecap="round"/><rect x="24" y="48" width="42" height="44" rx="6" fill="#e0b25a"/><text x="45" y="76" text-anchor="middle" font-family="Exo 2,sans-serif" font-style="italic" font-weight="800" font-size="${g.length>5?9:13}" fill="#16181b">${g}</text></svg>`}
const pimg=p=>p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`:can(p);
// v2.21-D3: ключи — слова из данных (ведро, бочка, куб), записаны кодами \u, чтобы в коде не было зашитого текста
const PK={'\u0432\u0435\u0434\u0440\u043E':'pack.pail','\u0431\u043E\u0447\u043A\u0430':'pack.drum','\u043A\u0443\u0431':'pack.ibc'};const pack=s=>String(s).replace(/\((\u0432\u0435\u0434\u0440\u043E|\u0431\u043E\u0447\u043A\u0430|\u043A\u0443\u0431)\)/gi,(m,w)=>'('+t(PK[w.toLowerCase()])+')');
const catName=id=>tx(D.Categories.find(c=>c.id===id),'name');
/* ---------- data ---------- */
function prep(){S=Object.fromEntries((D.Settings||[]).map(r=>[r.key,r.value]));setCurrency(S.currency);['Products','Categories','Services','Promos','Ads','News','Reviews','Points','Compat','Settings'].forEach(k=>D[k]=D[k]||[])}
async function load(){
  if(demo){D={};prep();toast(t('err.api'));return}
  let had=false;try{const c=sessionStorage.getItem('oh');if(c){D=JSON.parse(c);prep();had=true}}catch(e){}
  const go=async()=>{const r=await fetch(API_URL+'?action=public');const j=await r.json();if(j.error)throw new Error(j.error);D=j;prep();try{sessionStorage.setItem('oh',JSON.stringify(j));localStorage.setItem('oh_last',JSON.stringify(j))}catch(e){}};
  if(had){go().then(()=>{route()}).catch(()=>{});return}
  try{await go()}catch(e){let c=null;try{c=JSON.parse(localStorage.getItem('oh_last')||'null')}catch(_){}D=c||{};prep();toast(t('err.api'))}
}
/* ---------- chrome ---------- */
function seo(){document.title=t('seo.title');const set=(q,v)=>{const e=document.querySelector(q);if(e)e.setAttribute('content',v)};set('#md',t('seo.description'));set('meta[property="og:title"]',t('og.title'));set('meta[property="og:description"]',t('og.description'));set('meta[property="og:locale"]',L==='kk'?'kk_KZ':'ru_RU');orgLD();applyI18n()}
/* F3: JSON-LD организации. Собирается из Settings и Points (action=public), ничего не зашито: пустые поля не выводятся. */
function orgLD(){try{const o={'@context':'https://schema.org','@type':'AutoRepair',name:S.company||'OilHub',url:location.origin+location.pathname,inLanguage:L};
 if(S.phone)o.telephone=S.phone;if(S.email)o.email=S.email;if(S.address)o.address=S.address;if(S.hours)o.openingHours=S.hours;if(S.instagram)o.sameAs=[S.instagram];
 const pts=(D.Points||[]).filter(p=>isOn(p.active)).map(p=>{const x={'@type':'AutoRepair',name:ptx(p,'name')};if(ptx(p,'address'))x.address=ptx(p,'address');if(p.phone)x.telephone=p.phone;if(ptx(p,'hours'))x.openingHours=ptx(p,'hours');return x});if(pts.length)o.department=pts;
 let e=document.getElementById('ld-org');if(!e){e=document.createElement('script');e.type='application/ld+json';e.id='ld-org';document.head.appendChild(e)}e.textContent=JSON.stringify(o).replace(/</g,'\\u003c')}catch(x){}}
const NAV=[['services','nav.services'],['catalog','nav.catalog'],['selector','nav.selector'],['promotions','nav.promo'],['news','nav.news'],['about','nav.about'],['contacts','nav.contacts']];
function chrome(){
  seo();
  $('#mn').innerHTML=NAV.map(([h,k])=>`<a href="#/${h}" data-r="${h}">${t(k)}</a>`).join('');
  $('#hb').textContent=t('booking.online');$('#okx').textContent=t('common.close');$('#okT').textContent=t('booking.ok.title');
  const ph=S.phone,w=S.whatsapp;
  $('#ft').innerHTML=`<div class="fb"><span>© ${new Date().getFullYear()} ${esc(S.company||'OilHub')} · ${esc(L==='kk'?S.tagline_kk:S.tagline_ru)||''}</span><span>${ph?`<a href="tel:${esc(ph.replace(/[^\d+]/g,''))}">${esc(ph)}</a>`:''}${S.instagram?` · <a href="${esc(S.instagram)}" target="_blank" rel="noopener">Instagram</a>`:''}</span></div>`;
  const wb=$('#wab'),wl=wa(t('wa.hello'));if(wl){wb.href=wl;wb.dataset.wa=t('wa.hello');wb.style.display=''}else{wb.removeAttribute('href');wb.removeAttribute('data-wa');wb.style.display='none'}/* B1: номера нет вообще — кнопка скрыта */
  const a=D.Ads.filter(x=>x.type==='notice'&&live(x))[0];
  $('#nt').innerHTML=a?`<div class="nt"><span>${esc(tx(a,'title'))}</span>${a.link?`<a href="${esc(a.link)}">${esc(tx(a,'btn')||t('common.more'))}</a>`:''}</div>`:'';
}
function lang(l,anim){setLang(l);const _ts=$('#ts');if(_ts)_ts.classList.remove('on');$$('#lg button').forEach(b=>b.classList.toggle('on',b.dataset.l===l));$('#lg').dataset.v=l==='kk'?0:1;
  const go=()=>{chrome();route(true)};if(anim){document.body.style.opacity=.2;setTimeout(()=>{go();document.body.style.opacity=1},170)}else go()}
function theme(m){document.documentElement.dataset.theme=m;ls.s('theme',m);$('#ti').textContent=m==='dark'?'🌙':'☀️';$('meta[name=theme-color]').content=m==='dark'?'#0e0f11':'#f4f4f2'}
/* ---------- cards ---------- */
function pcard(p){const pr=money(p.price),old=money(p.old_price),out=p.stock!==''&&Number(p.stock)===0;
 return `<article class="pc"><a class="in" href="#/product/${esc(p.slug)}"><div class="can">${isOn(p.is_new)?`<span class="bdg">${t('catalog.new')}</span>`:''}${p.sae?`<span class="sae">${esc(p.sae)}</span>`:''}${pimg(p)}</div><small>${esc(p.brand)} · ${esc(catName(p.cat))}</small><span class="nm">${esc(p.name)}</span></a><div class="tags">${appr(p).filter(a=>/^(ACEA|API|ILSAC)/.test(a)).slice(0,3).map(a=>`<span>${esc(a)}</span>`).join('')}</div><div class="row"><span class="pr">${pr?pr+(old?`<s>${old}</s>`:''):`<span style="font:500 13px Manrope;color:var(--mu)">${t('catalog.priceNote')}</span>`}</span><a href="#/product/${esc(p.slug)}" style="color:var(--gold);font-weight:700">${out?t('catalog.outOfStock'):t('common.more')}</a></div></article>`}
const svCard=(s,d)=>`<article class="sv rv" style="transition-delay:${d*.1}s"><svg viewBox="0 0 64 64"><g class="a"><circle cx="32" cy="32" r="22"/><path d="M32 10v8M32 46v8M10 32h8M46 32h8"/></g><path d="M32 24c0 0-6 6-6 10a6 6 0 0012 0c0-4-6-10-6-10z"/></svg><h3>${esc(tx(s,'name'))}</h3><p>${esc(tx(s,'desc'))}</p><ul>${lines(tx(s,'includes')).slice(0,3).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="pr"><span>${s.price?(isOn(s.price_from)?t('common.from')+' ':'')+money(s.price):t('catalog.priceOnRequest')}${s.duration?` · ${esc(s.duration)} ${t('common.min')}`:''}</span><a href="#/booking?s=${esc(s.id)}" class="btn gold" style="padding:10px 18px">${t('booking.cta')}</a></div></article>`;
const adCard=a=>`<article class="cd rv">${a.image?`<img src="${esc(a.image)}" alt="" loading="lazy">`:''}<div><h3>${esc(tx(a,'title'))}</h3><p>${esc(tx(a,'text'))}</p>${a.link?`<a class="btn ghost" href="${esc(a.link)}" ${/^http/.test(a.link)?'target="_blank" rel="noopener"':''}>${esc(tx(a,'btn')||t('common.more'))}</a>`:''}</div></article>`;
function promoCard(p){const disc=Number(p.old_price)>0&&Number(p.new_price)>0?Math.round((1-p.new_price/p.old_price)*100):0;const pr=D.Products.find(x=>x.id===p.product_id);
 return `<article class="cd rv">${p.image?`<img src="${esc(p.image)}" alt="" loading="lazy">`:''}<div><h3>${esc(tx(p,'title'))}</h3><p>${esc(tx(p,'text'))}</p><div>${p.old_price?`<span class="old">${money(p.old_price)}</span>`:''}${p.new_price?`<b style="font:italic 800 24px 'Exo 2'">${money(p.new_price)}</b>`:''} ${disc>0?`<span class="disc">−${disc}%</span>`:''}</div>${p.end?`<small style="color:var(--mu)">${t('common.until')} ${esc(fmtDate(p.end))}</small>`:''}<a class="btn gold" href="${pr?'#/product/'+esc(pr.slug):'#/booking'}">${pr?t('common.more'):t('booking.cta')}</a></div></article>`}
const newsCard=n=>`<article class="cd rv">${n.image?`<img src="${esc(n.image)}" alt="" loading="lazy">`:''}<div><small style="color:var(--mu)">${esc(fmtDate(n.date))}</small><h3>${esc(tx(n,'title'))}</h3><p>${esc(tx(n,'text'))}</p></div></article>`;
function banner(){const m=srt(D.Ads.filter(a=>a.type==='main'&&live(a)));if(!m.length)return'';
 return `<section style="padding:40px 0 0"><div class="wrap"><div class="bn" id="bn">${m.map((a,i)=>`<div class="bs ${i?'':'on'}"><div><h2>${esc(tx(a,'title'))}</h2><p style="color:var(--mu);margin:14px 0 22px;max-width:50ch">${esc(tx(a,'text'))}</p>${a.link?`<a class="btn gold" href="${esc(a.link)}" ${/^http/.test(a.link)?'target="_blank" rel="noopener"':''}>${esc(tx(a,'btn')||t('common.more'))}</a>`:''}</div>${a.image?`<img src="${esc(a.image)}" alt="" loading="lazy">`:'<div></div>'}</div>`).join('')}<div class="dots">${m.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div></div></div></section>`}
function bannerInit(){const b=$('#bn');if(!b)return;const s=$$('.bs',b),d=$$('.dots i',b);if(s.length<2)return;let i=0;const set=n=>{i=(n+s.length)%s.length;s.forEach((e,k)=>e.classList.toggle('on',k===i));d.forEach((e,k)=>{e.classList.remove('on');void e.offsetWidth;e.classList.toggle('on',k===i)})};d.forEach((e,k)=>e.onclick=()=>{set(k);reset()});let h;const reset=()=>{clearInterval(h);h=setInterval(()=>{if(!document.body.contains(b))return clearInterval(h);set(i+1)},6000)};reset()}
/* ---------- pages ---------- */
const GR=['5W-40','0W-20','5W-30','0W-30','10W-30','15W-40'];
function stageInit(){const st=$('#stage');if(!st)return;let k='';for(let i=0;i<=24;i++){const a=(-210+i*10)*Math.PI/180,r2=i%4?244:254;k+=`<line class="tick" x1="${260+236*Math.cos(a)}" y1="${260+236*Math.sin(a)}" x2="${260+r2*Math.cos(a)}" y2="${260+r2*Math.sin(a)}"/>`}$('#ticks').innerHTML=k;
 let gi=0;const gz=()=>{if(!document.body.contains(st))return clearInterval(gz.h);const e=$('#sae');e.style.opacity=0;setTimeout(()=>{e.textContent=GR[gi];e.style.opacity=1},250);$('#arc').style.strokeDashoffset=1382-(.18+.82*gi/5)*920;gi=(gi+1)%6};gz();clearInterval(gz.h);gz.h=setInterval(gz,2600);
 const sv=st.firstElementChild;sv.style.transition='transform .3s';st.addEventListener('pointermove',e=>{const r=st.getBoundingClientRect();sv.style.transform=`rotateY(${((e.clientX-r.left)/r.width-.5)*12}deg) rotateX(${-((e.clientY-r.top)/r.height-.5)*12}deg)`});st.addEventListener('pointerleave',()=>sv.style.transform='')}
function pHome(){const pop=srt(D.Products.filter(p=>isOn(p.is_popular))).slice(0,4),sv=srt(D.Services),pr=srt(D.Promos.filter(live)).slice(0,3),ad=srt(D.Ads.filter(a=>(a.type==='card'||a.type==='offer')&&live(a))).slice(0,3),nw=[...D.News.filter(n=>isOn(n.active))].sort((a,b)=>b.date>a.date?1:-1).slice(0,3),rv=srt(D.Reviews).slice(0,3);
 const mq=D.Products.map(p=>`<span>${esc(p.name.replace(/^SINOPEC |^Sinopec /,''))}</span>`).join('');
 return `<section class="hero"><div class="wrap hg"><div>${S['badge_'+L]?`<p class="disp" style="color:var(--gold);margin-bottom:14px;font-size:15px">${esc(S['badge_'+L])}</p>`:''}<h1><span><em>${t('home.h1a')}</em></span><span><em>${t('home.h1b')}</em></span><span><em>${t('home.h1c')}</em></span></h1><p>${t('home.lead')}</p><div class="cta"><a class="btn gold" href="#/booking">${t('booking.online')}</a><a class="btn ghost" href="#/services">${t('home.seeServices')}</a><a class="btn ghost" href="#/selector">${t('nav.selector')}</a></div></div>${STAGE()}</div></section>
 <div class="mq" aria-hidden="true"><div>${mq}${mq}${mq}</div></div>${banner()}
 <section id="services"><div class="wrap"><h2>${t('services.title')}</h2><p class="sub">${t('services.sub')}</p><div class="g3">${sv.map(svCard).join('')}</div></div></section>
 <section style="background:var(--bg2)"><div class="wrap"><h2>${t('home.popular')}</h2><p class="sub">${t('catalog.sub')}</p><div class="grid">${pop.map(pcard).join('')}</div><p style="margin-top:30px"><a class="btn gold" href="#/catalog">${t('home.openCatalog')}</a></p></div></section>
 ${pr.length?`<section><div class="wrap"><h2>${t('promo.title')}</h2><div class="g3" style="margin-top:30px">${pr.map(promoCard).join('')}</div></div></section>`:''}
 ${ad.length?`<section style="${pr.length?'background:var(--bg2)':''}"><div class="wrap"><div class="g3">${ad.map(adCard).join('')}</div></div></section>`:''}
 <section><div class="wrap"><h2>${t('about.whyTitle')}</h2><div class="wh" style="margin-top:30px">${[1,2,3,4].map(i=>`<div class="rv"><b>${t('about.w'+i+'.title')}</b><span>${t('about.w'+i+'.text')}</span></div>`).join('')}</div></div></section>
 ${nw.length?`<section style="background:var(--bg2)"><div class="wrap"><h2>${t('news.title')}</h2><div class="g3" style="margin-top:30px">${nw.map(newsCard).join('')}</div></div></section>`:''}
 ${rv.length?`<section><div class="wrap"><h2>${t('nav.reviews')}</h2><div class="g3" style="margin-top:30px">${rv.map(r=>`<div class="rvw rv"><div class="star">${'★'.repeat(Math.max(1,Math.min(5,Number(r.rating)||5)))}</div><p style="margin:10px 0">${esc(tx(r,'text'))}</p><b>${esc(r.name)}</b></div>`).join('')}</div></div></section>`:''}
 ${contactsBlock()}`}
function contactsBlock(){const pts=srt(D.Points);return `<section style="background:var(--bg2)"><div class="wrap"><h2>${t('contacts.title')}</h2><div class="g3" style="margin-top:30px">${pts.map(p=>{const ph=p.phone||S.phone,hr=ptx(p,'hours')||(L==='kk'&&S.hours_kk)||S.hours,ad=ptx(p,'address')||S.address;return `<div class="panel"><h3 style="font-size:22px;margin-bottom:12px">${esc(ptx(p,'name'))}${p.city?', '+esc(p.city):''}</h3>${ad?`<p>📍 ${esc(ad)}</p>`:''}${ph?`<p>📞 <a href="tel:${esc(ph.replace(/[^\d+]/g,''))}">${esc(ph)}</a></p>`:''}${hr?`<p>🕒 ${esc(hr)}</p>`:''}${S.email?`<p>✉️ ${esc(S.email)}</p>`:''}<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">${ph?`<a class="btn gold" href="tel:${esc(ph.replace(/[^\d+]/g,''))}">${t('common.call')}</a>`:''}${wa(t('wa.hi'),p.whatsapp||S.whatsapp)?`<a class="btn ghost" target="_blank" rel="noopener" href="${esc(wa(t('wa.hi'),p.whatsapp||S.whatsapp))}">WhatsApp</a>`:''}${p.map?`<a class="btn ghost" target="_blank" rel="noopener" href="${esc(p.map)}">${t('contacts.openMap')}</a>`:''}</div></div>`}).join('')}</div></div></section>`}
function pServices(){return `<section class="pg"><div class="wrap"><h1>${t('services.title')}</h1><p class="sub">${t('services.sub')}</p><div class="g3">${srt(D.Services).map(svCard).join('')}</div>${srt(D.Services).map(s=>`<div class="sec rv" id="s-${esc(s.slug)}"><h3>${esc(tx(s,'name'))}</h3><div class="pd" style="grid-template-columns:1fr 1fr"><div><p>${esc(tx(s,'desc'))}</p><h3 style="margin-top:18px;font-size:18px">${t('services.includes')}</h3><ul>${lines(tx(s,'includes')).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div><h3 style="font-size:18px">${t('services.benefits')}</h3><ul>${lines(tx(s,'benefits')).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p style="margin-top:20px"><a class="btn gold" href="#/booking?s=${esc(s.id)}">${t('booking.cta')}</a></p></div></div></div>`).join('')}</div></section>`}
let CF={q:'',cat:'',sae:'',sort:''};
function filtered(){let a=D.Products.filter(p=>isOn(p.active));const q=norm(CF.q);if(CF.cat)a=a.filter(p=>p.cat===CF.cat);if(CF.sae)a=a.filter(p=>p.sae===CF.sae);if(q)a=a.filter(p=>norm(p.name+p.sae+p.sku+p.approvals).includes(q));
 if(CF.sort==='p1')a.sort((x,y)=>(+x.price||1e12)-(+y.price||1e12));else if(CF.sort==='p2')a.sort((x,y)=>(+y.price||0)-(+x.price||0));else if(CF.sort==='nm')a.sort((x,y)=>x.name.localeCompare(y.name));else a=srt(a);return a}
function pCatalog(cat){if(cat!==undefined)CF.cat=cat;const saes=[...new Set(D.Products.map(p=>p.sae).filter(Boolean))];
 return `<section class="pg"><div class="wrap"><h1>${t('catalog.title')}</h1><p class="sub">${t('catalog.sub')}</p><div class="cats"><button data-c="" class="${CF.cat?'':'on'}">${t('common.all')}</button>${srt(D.Categories).map(c=>`<button data-c="${esc(c.id)}" class="${CF.cat===c.id?'on':''}">${esc(tx(c,'name'))}</button>`).join('')}</div>
 <div class="bar"><input id="fq" type="search" placeholder="${t('catalog.searchPh')}" value="${esc(CF.q)}"><select id="fs"><option value="">${t('catalog.anySae')}</option>${saes.map(s=>`<option ${CF.sae===s?'selected':''}>${esc(s)}</option>`).join('')}</select><select id="fo"><option value="">${t('catalog.sort.default')}</option><option value="p1" ${CF.sort==='p1'?'selected':''}>${t('catalog.sort.priceAsc')}</option><option value="p2" ${CF.sort==='p2'?'selected':''}>${t('catalog.sort.priceDesc')}</option><option value="nm" ${CF.sort==='nm'?'selected':''}>${t('catalog.sort.name')}</option></select></div><div class="grid" id="cg"></div></div></section>`}
function catInit(){const draw=()=>{const a=filtered();$('#cg').innerHTML=a.length?a.map(pcard).join(''):`<p class="sub">${t('catalog.empty')}</p>`;tilt()};draw();
 $$('.cats button').forEach(b=>b.onclick=()=>{CF.cat=b.dataset.c;$$('.cats button').forEach(x=>x.classList.toggle('on',x===b));draw()});
 $('#fq').oninput=e=>{CF.q=e.target.value;draw()};$('#fs').onchange=e=>{CF.sae=e.target.value;draw()};$('#fo').onchange=e=>{CF.sort=e.target.value;draw()}}
function tilt(){$$('.pc').forEach(c=>{c.onpointermove=e=>{const r=c.getBoundingClientRect();c.style.transform=`perspective(700px) rotateY(${((e.clientX-r.left)/r.width-.5)*8}deg) rotateX(${-((e.clientY-r.top)/r.height-.5)*8}deg) translateY(-5px)`};c.onpointerleave=()=>c.style.transform=''})}
function pProduct(slug){const p=D.Products.find(x=>x.slug===slug&&isOn(x.active));if(!p)return nf();let typ=[];try{typ=JSON.parse(p.typical||'[]')}catch(e){}
 const ap=appr(p),pr=money(p.price),old=money(p.old_price);
 document.title=p.name+' — OilHub';$('#md').content=(tx(p,'short')||p.name).slice(0,160);
 const ld={'@context':'https://schema.org','@type':'Product',name:p.name,brand:{'@type':'Brand',name:p.brand},sku:p.sku||undefined,description:tx(p,'short')};if(p.price)ld.offers={'@type':'Offer',price:p.price,priceCurrency:'KZT',availability:Number(p.stock)===0&&p.stock!==''?'https://schema.org/OutOfStock':'https://schema.org/InStock'};
 return `<section class="pg"><div class="wrap"><div class="crumb"><a href="#/catalog">${t('catalog.back')}</a></div><div class="pd"><div><div class="can">${isOn(p.is_new)?`<span class="bdg">${t('catalog.new')}</span>`:''}${pimg(p)}</div></div><div><small style="color:var(--mu)">${esc(p.brand)} · ${esc(catName(p.cat))}${p.sku?` · ${t('catalog.sku')}: ${esc(p.sku)}`:''}</small><h1 style="font-size:clamp(26px,3.6vw,40px);margin:8px 0 14px">${esc(p.name)}</h1><p style="color:var(--mu);margin-bottom:16px">${esc(tx(p,'short'))}</p><p style="margin-bottom:18px"><span class="pr" style="font:italic 800 30px 'Exo 2'">${pr||`<span style="font:500 15px Manrope;color:var(--mu)">${t('catalog.priceNote')}</span>`}</span>${old?` <span class="old">${old}</span>`:''}</p>${p.sizes?`<p style="margin-bottom:14px"><b>${t('catalog.sizes')}:</b> ${p.sizes.split(';').map(s=>`<span class="ch">${esc(pack(s.trim()))}</span>`).join('')}</p>`:''}<div class="cta">${waBtn('btn gold',t('catalog.order'),t('wa.product')+' '+p.name+(p.sizes?' · '+p.sizes.split(';').map(x=>pack(x.trim())).join(', '):''))}<a class="btn ghost" href="#/booking">${t('booking.oilChange')}</a></div>${p.doc?`<p style="margin-top:18px"><a href="${esc(p.doc)}" target="_blank" rel="noopener" style="color:var(--gold);font-weight:700">📄 ${t('catalog.doc')}</a></p>`:''}</div></div>
 ${ap.length?`<div class="sec"><h3>${t('catalog.approvals')}</h3>${ap.map(a=>`<span class="ch hl">${esc(a)}</span>`).join('')}</div>`:''}
 ${lines(tx(p,'apps')).length?`<div class="sec"><h3>${t('catalog.applications')}</h3><ul>${lines(tx(p,'apps')).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
 ${lines(tx(p,'features')).length?`<div class="sec"><h3>${t('catalog.features')}</h3><ul>${lines(tx(p,'features')).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
 ${tx(p,'desc')?`<div class="sec"><p>${esc(tx(p,'desc'))}</p></div>`:''}
 ${typ.length?`<div class="sec"><h3>${t('catalog.typical')}</h3><div class="tw"><table class="tb">${typ.map(r=>`<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td></tr>`).join('')}</table></div><p style="font-size:13px;color:var(--mu);margin-top:8px">${t('catalog.typicalNote')}</p></div>`:''}
 <script type="application/ld+json">${JSON.stringify(ld).replace(/</g,'\\u003c')}<\/script></div></section>`}
/* oil selector: точное совпадение по допускам */
const API_RANK=['SJ','SL','SM','SN','SN PLUS','SP'];
/* логика сопоставления вынесена в selector-core.js (OilSel), её же использует касса */
const matchOils=(reqs,sae)=>OilSel.match(D.Products,reqs,sae);
let SEL={tab:'car',b:'',m:'',y:'',e:'',spec:[],sae:''};
function resHTML(r,reqs,car){if(!r)return'';return `<div class="res">${r.exact?'':`<p class="note">${t(r.list.length?'selector.noExact':'selector.noExactNone')}</p>`}${r.list.map(({p,m,exact},i)=>`<div class="rs ${exact?'ex':''}" style="animation-delay:${i*.08}s"><div class="can"><span class="sae" style="font-size:14px">${esc(p.sae)}</span>${pimg(p)}</div><div><div class="exb">${exact?'✓ '+t('selector.exact'):t('selector.partial')+' · '+m.length+'/'+reqs.length+' · '+t('selector.askExpert')}</div><b>${esc(p.name)}</b><div style="margin-top:8px">${appr(p).map(a=>`<span class="ch ${reqs.some(q=>norm(q)===norm(a))?'hl':''}">${esc(a)}</span>`).join('')}</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn gold" style="padding:11px 18px" href="#/product/${esc(p.slug)}">${t('common.more')}</a>${car?`<a class="btn ghost" style="padding:11px 18px" href="#/booking?b=${encodeURIComponent(SEL.b)}&m=${encodeURIComponent(SEL.m)}&y=${encodeURIComponent(SEL.y)}&o=${encodeURIComponent(p.name)}">${t('booking.oilChange')}</a>`:''}${waBtn('btn ghost',t('wa.ask'),car?t('wa.carOil',{car,oil:p.name}):t('wa.oil',{oil:p.name}),'padding:11px 18px')}</div></div>`).join('')}${r.list.length?'':`<p class="sub">${t('catalog.empty')}</p>`}</div>`}
// A5. ПОДКЛЮЧЕНИЕ ПОИСКА ПО ГОСНОМЕРУ / VIN (пока НЕ реализовано, нужен внешний источник данных).
// Как подключить позже:
// 1) В Code.gs добавить публичный action, например action=vin_lookup&q=<госномер или VIN>; запрос к стороннему API
// делать только на сервере (ключ в Script Properties, не в браузере); ответ кэшировать и ограничивать по частоте.
// 2) Ответ привести к виду {brand, model, year, engine, fuel} и положить в SEL (SEL.b, SEL.m, SEL.y, SEL.e),
// где SEL.e = engine + ' · ' + код топлива; дальше работает обычный подбор по Compat без изменений.
// 3) Добавить поле ввода над каскадом и вызвать draw(); при пустом или неточном ответе оставить ручной каскад.
// 4) Тексты через i18n.js (kk и ru). Номер и VIN не сохранять без согласия клиента.
function pSelector(){
 return `<section class="pg"><div class="wrap"><h1>${t('selector.title')}</h1><p class="sub">${t('selector.sub')}</p><div class="tabs"><button data-tab="car" class="${SEL.tab==='car'?'on':''}">${t('selector.byCar')}</button><button data-tab="spec" class="${SEL.tab==='spec'?'on':''}">${t('selector.bySpec')}</button></div><div class="panel" id="sp"></div><div id="sr"></div><p class="note" style="margin-top:20px">${t('selector.why')}</p></div></section>`}
function selInit(){const C=D.Compat;
 const sp=$('#sp'),sr=$('#sr');
 $$('.tabs button').forEach(b=>b.onclick=()=>{SEL.tab=b.dataset.tab;$$('.tabs button').forEach(x=>x.classList.toggle('on',x===b));draw()});
 // A4: топливо хранится кодом (petrol|diesel|hybrid|lpg), на экране показывается через t('compat.fuel.*').
 // Значение option остаётся «двигатель · код», по нему идёт сопоставление; переводится только подпись.
 const engL=OilSel.engLabel;
 function sel(id,lab,opts,val,L){return `<div><label>${lab}</label><select id="${id}"><option value="">${t('common.choose')}</option>${opts.map(o=>`<option value="${esc(o)}" ${String(val)===String(o)?'selected':''}>${esc(L?L(o):o)}</option>`).join('')}</select></div>`}
 function draw(){sr.innerHTML='';
  if(SEL.tab==='car'){if(!C.length){sp.innerHTML=`<p>${t('selector.noCompat')}</p>`;return}
   const br=OilSel.brands(C),md=OilSel.models(C,SEL.b),rows=C.filter(c=>c.brand===SEL.b&&c.model===SEL.m);
   const yrs=OilSel.years(C,SEL.b,SEL.m),en=OilSel.engines(C,SEL.b,SEL.m,SEL.y);
   sp.innerHTML=`<div class="fr2">${sel('sb',t('car.brand'),br,SEL.b)}${sel('sm',t('car.model'),md,SEL.m)}${sel('sy',t('car.year'),yrs,SEL.y)}${sel('se',t('car.engine'),en,SEL.e,engL)}</div>`;
   $('#sb').onchange=e=>{SEL.b=e.target.value;SEL.m=SEL.y=SEL.e='';draw()};$('#sm').onchange=e=>{SEL.m=e.target.value;SEL.y=SEL.e='';draw()};$('#sy').onchange=e=>{SEL.y=e.target.value;SEL.e='';draw()};$('#se').onchange=e=>{SEL.e=e.target.value;draw()};
   if(SEL.b&&SEL.m&&SEL.y&&SEL.e){const c=OilSel.findCar(C,SEL.b,SEL.m,SEL.y,SEL.e);
    if(!c||!String(c.spec_required).trim()){sr.innerHTML=`<p class="note" style="margin-top:20px">${t('selector.noCar')}</p>`;return}
    const reqs=OilSel.reqsOf(c),r=matchOils(reqs,c.sae);
    sr.innerHTML=`<p style="margin-top:22px"><b>${t('selector.required')}</b> ${reqs.map(x=>`<span class="ch hl">${esc(x)}</span>`).join('')}${c.sae?`<span class="ch hl">SAE ${esc(c.sae)}</span>`:''}</p>${c.note?`<p class="note">${esc(c.note)}</p>`:''}`+resHTML(r,reqs,[SEL.b,SEL.m,SEL.y,engL(SEL.e)].join(' '))}
   else if(SEL.b&&SEL.m&&!rows.length)sr.innerHTML=`<p class="note" style="margin-top:20px">${t('selector.noCar')}</p>`;
  }else{const {grp,saes}=OilSel.specGroups(D.Products);
   sp.innerHTML=`<p style="margin-bottom:12px">${t('selector.pickSpec')}</p>${['ACEA','API','ILSAC'].filter(g=>grp[g]).map(g=>`<div style="margin-bottom:10px"><b style="font-size:13px;color:var(--mu)">${g}</b><div class="cats" style="margin:6px 0 0">${grp[g].map(a=>`<button type="button" data-a="${esc(a)}" class="${SEL.spec.includes(a)?'on':''}">${esc(a.replace(g+' ',''))}</button>`).join('')}</div></div>`).join('')}<div style="margin-bottom:10px"><b style="font-size:13px;color:var(--mu)">OEM</b><input id="oemq" placeholder="${t('selector.specSearchPh')}" style="margin-top:6px;max-width:320px"><div class="cats" style="margin:8px 0 0;max-height:150px;overflow:auto" id="oemb">${Object.keys(grp).filter(g=>!['ACEA','API','ILSAC'].includes(g)).flatMap(g=>grp[g]).map(a=>`<button type="button" data-a="${esc(a)}" class="${SEL.spec.includes(a)?'on':''}">${esc(a)}</button>`).join('')}</div></div><div style="max-width:260px">${sel('ssae','SAE',saes,SEL.sae)}</div><button class="btn gold" id="sgo" style="margin-top:18px">${t('selector.find')}</button>`;
   $$('#sp [data-a]').forEach(b=>b.onclick=()=>{const a=b.dataset.a;SEL.spec=SEL.spec.includes(a)?SEL.spec.filter(x=>x!==a):[...SEL.spec,a];b.classList.toggle('on')});
   $('#ssae').onchange=e=>SEL.sae=e.target.value;$('#oemq').oninput=e=>{const q=norm(e.target.value);$$('#oemb button').forEach(x=>x.style.display=norm(x.textContent).includes(q)?'':'none')};
   $('#sgo').onclick=()=>{if(!SEL.spec.length&&!SEL.sae){toast(t('selector.pickSpec'));return}const r=SEL.spec.length?matchOils(SEL.spec,SEL.sae):OilSel.bySae(D.Products,SEL.sae);sr.innerHTML=resHTML(r,SEL.spec)}}}
 draw()}
const pPromos=()=>{const a=srt(D.Promos.filter(live));return `<section class="pg"><div class="wrap"><h1>${t('promo.title')}</h1><div class="g3" style="margin-top:30px">${a.map(promoCard).join('')}</div>${a.length?'':`<p class="sub">${t('promo.empty')}</p>`}</div></section>`};
const pNews=()=>{const a=[...D.News.filter(n=>isOn(n.active))].sort((x,y)=>y.date>x.date?1:-1),ad=srt(D.Ads.filter(x=>(x.type==='card'||x.type==='offer')&&live(x)));return `<section class="pg"><div class="wrap"><h1>${t('news.title')}</h1><div class="g3" style="margin-top:30px">${ad.map(adCard).join('')}${a.map(newsCard).join('')}</div>${a.length||ad.length?'':`<p class="sub">${t('news.empty')}</p>`}</div></section>`};
const pAbout=()=>`<section class="pg"><div class="wrap brand"><img src="logo.jpg" alt="OilHub" width="640" height="375"><div><h1 style="font-size:clamp(30px,4vw,48px)">${t('about.title')}</h1><p class="sub" style="margin-top:14px">${t('about.text')}</p><div class="wh" style="grid-template-columns:1fr 1fr">${[1,2,3,4].map(i=>`<div><b>${t('about.w'+i+'.title')}</b><span>${t('about.w'+i+'.text')}</span></div>`).join('')}</div></div></div></section>`;
const pContacts=()=>`<section class="pg"><div class="wrap"><h1>${t('contacts.title')}</h1></div></section>${contactsBlock()}`;
const nf=()=>`<section class="pg"><div class="wrap"><h1>404</h1><p class="sub">${t('err.pageNotFound')}</p><a class="btn gold" href="#/">${t('common.home')}</a></div></section>`;
/* booking */
let BK={slot:''};
function slotsFor(date){const [a,b]=(S.work_start||'09:00').split(':').map(Number),[c,d]=(S.work_end||'18:00').split(':').map(Number),step=Number(S.slot_min)||60;const off=String(S.days_off||'').split(',').map(x=>x.trim()).filter(x=>x!=='');const dow=new Date(date+'T12:00:00').getDay();if(off.includes(String(dow)))return[];const out=[];for(let m=a*60+b;m+step<=c*60+d;m+=step)out.push(String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'));
  if(date===today()){const n=new Date(),nm=n.getHours()*60+n.getMinutes();return out.filter(s=>{const[h,m]=s.split(':').map(Number);return h*60+m>nm+30})}return out}
function pBooking(q){const sv=srt(D.Services),pts=srt(D.Points),d=new Date();d.setDate(d.getDate()+1);const sid=q.get('s')||'';/* A2: предзаполнение из подбора по авто: ?b=марка&m=модель&y=год&o=масло */
 return `<section class="pg"><div class="wrap two"><div><h1 style="font-size:clamp(30px,4vw,48px)">${t('booking.title')}</h1><p class="sub" style="margin-top:12px">${t('booking.sub')}</p>${demo?`<p class="note">${t('booking.demo')}</p>`:''}</div><form class="panel" id="bf" novalidate><div class="fr2"><div class="w"><label>${t('booking.service')}</label><select id="bs">${sv.map(s=>`<option value="${esc(s.id)}" ${s.id===sid?'selected':''}>${esc(tx(s,'name'))}</option>`).join('')}</select></div>${pts.length>1?`<div class="w"><label>${t('booking.point')}</label><select id="bp2">${pts.map(p=>`<option value="${esc(p.id)}">${esc(ptx(p,'name'))}${p.city?', '+esc(p.city):''}</option>`).join('')}</select></div>`:''}<div class="w"><label>${t('booking.date')}</label><input type="date" id="bd" min="${today()}" value="${d.toISOString().slice(0,10)}"></div><div class="w"><label>${t('booking.time')}</label><div class="slots" id="sl"></div><small id="ste" style="color:#d9534f"></small></div><div><label>${t('booking.name')}</label><input id="bn" autocomplete="name" maxlength="80"></div><div><label>${t('booking.phone')}</label><input id="bph" inputmode="tel" autocomplete="tel" placeholder="+7 ___ ___ __ __" maxlength="25"></div><div><label>${t('booking.carBrand')}</label><input id="bb" maxlength="40" value="${esc(q.get('b')||'')}"></div><div><label>${t('car.model')}</label><input id="bm" maxlength="40" value="${esc(q.get('m')||'')}"></div><div><label>${t('car.year')}</label><input id="by" inputmode="numeric" maxlength="4" value="${esc((q.get('y')||'').replace(/\D/g,'').slice(0,4))}"></div><div><label>${t('booking.plate')}</label><input id="bg2" maxlength="15" style="text-transform:uppercase"></div><div class="w"><label>${t('booking.comment')}</label><textarea id="bc" rows="2" maxlength="500">${esc((q.get('o')||'').slice(0,200))}</textarea></div></div><button class="btn gold" id="bsub" style="width:100%;justify-content:center;margin-top:22px">${t('booking.online')}</button></form></div></section>`}
async function bookInit(){const bd=$('#bd'),sl=$('#sl');BK.slot='';
 const draw=async()=>{BK.slot='';const all=slotsFor(bd.value);let taken=[];sl.innerHTML='<span class="sk" style="height:44px;grid-column:1/-1;border-radius:10px"></span>';
  if(!demo){try{const r=await fetch(`${API_URL}?action=slots&date=${bd.value}&point=${($('#bp2')||{}).value||''}`);taken=(await r.json()).taken||[]}catch(e){}}
  sl.innerHTML=all.length?all.map(s=>`<button type="button" ${taken.includes(s)?'disabled':''}>${s}</button>`).join(''):`<small style="grid-column:1/-1;color:var(--mu)">${t('booking.noSlots')}</small>`;
  $$('button',sl).forEach(b=>b.onclick=()=>{BK.slot=b.textContent;$$('button',sl).forEach(x=>x.classList.toggle('on',x===b));$('#ste').textContent=''})};
 bd.onchange=draw;if($('#bp2'))$('#bp2').onchange=draw;draw();
 $('#bf').onsubmit=async e=>{e.preventDefault();let ok=true;const bad=(id,m)=>{const el=$('#'+id);el.classList.add('bad');setTimeout(()=>el.classList.remove('bad'),600);ok=false};
  const nm=$('#bn').value.trim(),ph=$('#bph').value.trim();if(nm.length<2)bad('bn');if(ph.replace(/\D/g,'').length<10)bad('bph');if(!bd.value||bd.value<today())bad('bd');
  if(!BK.slot){$('#ste').textContent=t('err.time');ok=false}if(!ok)return;
  const sv=D.Services.find(s=>s.id===$('#bs').value),car=[$('#bb').value,$('#bm').value,$('#by').value].filter(Boolean).join(' ');
  const body={action:'book',service_id:$('#bs').value,point_id:($('#bp2')||{}).value||(D.Points[0]||{}).id||'',date:bd.value,time:BK.slot,name:nm,phone:ph,brand:$('#bb').value.trim(),model:$('#bm').value.trim(),year:$('#by').value.trim(),plate:$('#bg2').value.trim().toUpperCase(),comment:$('#bc').value.trim(),lang:L};
  const btn=$('#bsub');btn.disabled=true;btn.textContent=t('common.sending');
  try{let r={ok:true};if(!demo)r=await post(body);
   if(r.ok){const svn=tx(sv,'name');$('#okD').innerHTML=`<b>${esc(svn)}</b><br>${esc(fmtDate(body.date))} · ${esc(fmtTime(body.time))}<br>${esc(nm)} · ${esc(ph)}<br>${t('booking.ok.text')}${demo?`<br><small>${t('booking.demo')}</small>`:''}`;
    {const wl=waPt(body.point_id,t('wa.booking',{name:nm,phone:ph,service:sv?tx(sv,'name'):'',date:fmtDate(body.date),time:fmtTime(body.time),car:car,plate:body.plate||''}));$('#okw').textContent=t('wa.send');$('#okw').href=wl||'#';$('#okw').style.display=wl?'':'none'}$('#ok').classList.add('on');$('#bf').reset();draw()}
   else{const BE={ERR_SLOT_TAKEN:'err.slotTaken',ERR_REQUIRED:'err.required',ERR_PHONE:'err.phone',ERR_DATE:'err.date',ERR_PAST:'err.past',ERR_SERVER:'err.server',ERR_BAD:'err.send'};if(r.error==='ERR_SLOT_TAKEN'){$('#ste').textContent=t(BE.ERR_SLOT_TAKEN);draw()}else toast(t(BE[r.error]||'err.send'))}}
  catch(err){toast(t('err.send'))}finally{btn.disabled=false;btn.textContent=t('booking.online')}}}
/* ---------- router ---------- */
function route(keep){const h=location.hash.replace(/^#\/?/,''),[path,qs]=h.split('?'),seg=path.split('/'),q=new URLSearchParams(qs||''),m=$('#app');
 seo();
 $$('.menu a').forEach(a=>a.classList.toggle('on',a.dataset.r===seg[0]));$('#mn').classList.remove('o');
 let html,after=()=>{};const r=seg[0]||'';
 if(r==='')html=pHome(),after=()=>{stageInit();bannerInit()};
 else if(r==='services')html=pServices();
 else if(r==='catalog'){html=pCatalog(seg[1]?(D.Categories.find(c=>c.slug===seg[1])||{}).id||'':'');after=catInit}
 else if(r==='product')html=pProduct(seg[1]);
 else if(r==='selector'){html=pSelector();after=selInit}
 else if(r==='promotions')html=pPromos();
 else if(r==='news')html=pNews();
 else if(r==='about')html=pAbout();
 else if(r==='contacts')html=pContacts();
 else if(r==='booking'){html=pBooking(q);after=bookInit}
 else html=nf();
 m.innerHTML=html;if(!keep)scrollTo(0,0);after();tilt();revInit();
}
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});
const revInit=()=>$$('.rv').forEach(e=>io.observe(e));
addEventListener('hashchange',()=>route());
addEventListener('scroll',()=>{$('#hd').classList.toggle('s',scrollY>30);const h=document.documentElement.scrollHeight-innerHeight;$('#pp').style.strokeDashoffset=151*(1-Math.min(1,scrollY/Math.max(1,h)))},{passive:true});
$$('#lg button').forEach(b=>b.onclick=()=>lang(b.dataset.l,true));
$('#th').onclick=()=>theme(document.documentElement.dataset.theme==='dark'?'light':'dark');
$('#bg').onclick=()=>$('#mn').classList.toggle('o');
$('#okx').onclick=()=>$('#ok').classList.remove('on');$('#ok').onclick=e=>{if(e.target.id==='ok')$('#ok').classList.remove('on')};
addEventListener('keydown',e=>{if(e.key==='Escape')$('#ok').classList.remove('on')});
(async()=>{theme(ls.g('theme')||'dark');$('#app').innerHTML='<section class="pg"><div class="wrap"><div class="grid"><div class="sk"></div><div class="sk"></div><div class="sk"></div></div></div></section>';await load();lang(L,false)})();
