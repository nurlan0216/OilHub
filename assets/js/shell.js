/* shell.js: общая оболочка admin.html и staff.html: вход, проверка роли, меню, маршрутизация. Публичный сайт этот файл не загружает. */
/* тексты оболочки admin.html / staff.html */
/* тексты этого файла живут в i18n.js */
function appShell(cfg){
 const K={token:'oh_'+cfg.app+'_token'}; /* отдельный ключ на каждое приложение */
 const root=()=>$('#app');
 let user=null,token=ls.g(K.token)||'',router=null;
 const setTitle=()=>{document.title=t(cfg.app==='admin'?'app.title.admin':'app.title.staff')};
 const langPill=()=>`<div class="pill" id="lg" data-v="${L==='kk'?0:1}"><span class="k"></span><button data-l="kk" class="${L==='kk'?'on':''}">\u049A\u0410\u0417</button><button data-l="ru" class="${L==='ru'?'on':''}">RU</button></div>`;
 const bindLang=()=>$$('#lg button').forEach(b=>b.onclick=()=>{const f=$('#lf'),l=f&&f.elements.l.value;setLang(b.dataset.l);paint().then(()=>{const g=$('#lf');if(g&&l)g.elements.l.value=l})});
 const view=(state,html)=>{const m=$('#view');if(m){m.dataset.view=state;m.innerHTML=html;labelCells(m)}}; /* v2.22-S4: подписи ячеек для карточного вида */
 const msg=(text,link)=>`<div class="panel" style="max-width:520px;margin:40px auto"><h2 style="font-size:26px">${esc(text)}</h2>${link||''}</div>`;
 const homeLink=()=>`<p style="margin-top:18px"><a class="btn ghost" href="#/${cfg.def}">${t('gate.home')}</a></p>`;
 const errText=e=>{const c=String(e||'');if(/ERR_LOCKED/.test(c))return t('auth.many');if(/ERR_AUTH|auth/.test(c)&&c!=='net')return t('auth.bad');if(/ERR_FORBIDDEN|^forbidden$/.test(c))return t('err.forbidden');if(/ERR_STOCK/.test(c))return t('err.stock');if(/ERR_SLOT_TAKEN|^taken$/.test(c))return t('err.slotTaken');if(/ERR_NOT_FOUND/.test(c))return t('err.notFound');if(/ERR_POSTED/.test(c))return t('sale.locked');if(/ERR_BARCODE_DUP/.test(c))return t('barcode.dup');if(/ERR_SERVER/.test(c))return t('err.server');if(/ERR_BAD/.test(c))return t('err.bad');return t('err.net')};
 const logout=()=>{const old=token;token='';user=null;bd={};ls.s(K.token,'');if(old&&API_URL)post({action:'logout',token:old}).catch(()=>{});location.hash='';paint()};
 const roleNav=()=>cfg.nav.filter(([n])=>{const r=cfg.routes[n];return(!r.roles||r.roles.includes(user.role))&&(!r.perm||[].concat(r.perm).some(x=>(user.perms||[]).includes(x)))});
 /* v2.22-S2: на телефоне меню — боковая шторка (кнопка ☰ слева, затемнение, Esc, закрытие по пункту) */
 const GRP=cfg.groups||null,RK='oh_recent';let bd={}; /* bd: счётчики бейджей по ключу раздела */
 /* v2.22-S6: нижняя панель вкладок (только если в конфиге есть tabs, сейчас касса); на телефоне ≤560px, «Ещё» открывает шторку */
 const tabsHtml=()=>{if(!cfg.tabs)return'';const nv=roleNav().map(x=>x[0]),it=cfg.tabs.filter(x=>nv.includes(x[0]));return `<nav class="sh-tabs" id="tb" aria-label="${t('aria.tabs')}">${it.map(([n,k,i])=>`<a href="#/${n}" data-n="${n}"><i aria-hidden="true">${i}</i><span>${t(k)}</span><span class="sh-bd" hidden></span></a>`).join('')}<button type="button" id="tbm" aria-controls="dr"><i aria-hidden="true">\u2630</i><span>${t('nav.more')}</span></button></nav>`};
 const navA=([n,k])=>`<a href="#/${n}" data-n="${n}">${t(k)}<span class="sh-bd" hidden></span></a>`;
 const navHtml=()=>{const nv=roleNav();if(!GRP)return nv.map(navA).join('');
  const g=GRP.map(x=>{const it=nv.filter(y=>y[2]===x);return it.length?`<div class="sh-g">${t('nav.g.'+x)}</div>`+it.map(navA).join(''):''}).join(''),rest=nv.filter(y=>!GRP.includes(y[2]));return g+rest.map(navA).join('')};
 const recGet=()=>{try{const o=JSON.parse(ls.g(RK)||'{}'),a=o&&o[cfg.app];return Array.isArray(a)?a.slice(0,3):[]}catch(e){return[]}};
 const recPush=n=>{try{let o={};try{o=JSON.parse(ls.g(RK)||'{}')||{}}catch(e){o={}}if(typeof o!=='object'||Array.isArray(o))o={};o[cfg.app]=[n,...recGet().filter(x=>x!==n)].slice(0,3);ls.s(RK,JSON.stringify(o))}catch(e){}};
 const paintRecent=()=>{const el=$('#rc');if(!el)return;const nv=roleNav(),it=recGet().map(x=>nv.find(y=>y[0]===x)).filter(Boolean);
  el.innerHTML=it.length?`<div class="sh-g">${t('nav.recent')}</div>`+it.map(([n,k])=>`<a href="#/${n}" data-r="${n}">${t(k)}</a>`).join(''):''};
 const paintBadges=()=>{$$('.sh-bd').forEach(e=>{const c=bd[e.parentNode.dataset.n]||0;e.hidden=!c;e.textContent=c>99?'99+':String(c)});
  const m=$('#mb');if(m)m.classList.toggle('has-new',Object.keys(bd).some(k=>bd[k]>0))};
 document.addEventListener('oh:badge',e=>{const d=e.detail||{};bd[d.n]=d.c;paintBadges()});
 /* v2.22-S10: индикатор сети и число неотправленных (только если в конфиге есть net: касса) */
 const netPaint=()=>{const e=$('#shn');if(!e||!cfg.net)return;const n=cfg.net.queue(),off=!netOk();e.hidden=!(off||n);e.classList.toggle('off',off);
  const full=off?t('net.chip.off')+(n?'. '+t('net.chip.q',{n}):''):t('net.chip.q',{n});e.setAttribute('aria-label',full);e.title=full;
  e.innerHTML=`<i aria-hidden="true">${off?'\u25CF':'\u2191'}</i>${off?`<em>${esc(t('net.chip.off'))}</em>`:''}${n?`<b>${n}</b>`:''}`};
 if(cfg.net){['online','offline','oh:netstate'].forEach(x=>addEventListener(x,netPaint));document.addEventListener('oh:queue',netPaint);document.addEventListener('langchange',netPaint)}
 const userBox=()=>user?`<span class=\"sh-u\">${esc(user.name||user.login)}</span><button class=\"btn ghost\" id=\"lo\">${t('auth.logout')}</button>`:'';
 const top=(withNav)=>`<header class=\"sh\">${withNav?`<button class=\"sh-bg\" id=\"mb\" aria-expanded=\"false\" aria-controls=\"dr\" aria-label=\"${t('aria.menu')}\">\u2630<i class=\"sh-dot\"></i></button>`:''}<b class=\"sh-b\">OilHub</b>${withNav?`<nav class=\"sh-n\" id=\"dr\" aria-label=\"${t('aria.menu')}\"><div class=\"sh-dh\"><b class=\"sh-b\">OilHub</b><button class=\"sh-x\" id=\"mx\" aria-label=\"${t('common.close')}\">\u2715</button></div><div class="sh-rc" id="rc"></div>${navHtml()}<button type="button" class="btn ghost sh-inst" data-pwa-install hidden></button><div class=\"sh-df\">${userBox().replace('id=\"lo\"','id=\"lo2\"')}</div></nav><div class=\"sh-bk\" id=\"shbk\"></div>`:'<span></span>'}<span class=\"sh-r\">${withNav&&cfg.net?'<button type="button" class="sh-net" id="shn" role="status" hidden></button>':''}${langPill()}${userBox()}</span></header><main id=\"view\"></main>`;
 const drawer=o=>{const d=$('#dr'),b=$('#shbk'),m=$('#mb');if(!d)return;d.classList.toggle('open',o);if(b)b.classList.toggle('on',o);if(m)m.setAttribute('aria-expanded',o);document.body.classList.toggle('sh-lock',o)};
 const afterTop=()=>{bindLang();netPaint();if(window.OH_PWA&&OH_PWA.paint)OH_PWA.paint();if($('#shn'))$('#shn').onclick=()=>document.dispatchEvent(new CustomEvent('oh:flush'));if($('#lo'))$('#lo').onclick=logout;if($('#lo2'))$('#lo2').onclick=logout;
  if($('#tbm'))$('#tbm').onclick=()=>drawer(!$('#dr').classList.contains('open'));
  if($('#mb')){$('#mb').onclick=()=>drawer(!$('#dr').classList.contains('open'));$('#mx').onclick=()=>drawer(false);$('#shbk').onclick=()=>drawer(false);$('#dr').addEventListener('click',e=>{if(e.target.closest('a'))drawer(false)})}paintBadges()};
 function loginView(err){setTitle();root().innerHTML=top(false);afterTop();
  view('login',`<form class="panel" id="lf" style="max-width:420px;margin:40px auto"><h2 style="font-size:28px;margin-bottom:6px">${t('auth.login')}</h2>
   <label>${t('auth.user')}</label><input name="l" autocomplete="username" required><label>${t('auth.pass')}</label><input name="p" type="password" autocomplete="current-password" required>
   <p id="le" class="note" style="display:${err?'block':'none'};border-color:#d9534f">${esc(err||'')}</p>
   <button class="btn gold" style="margin-top:18px;width:100%;justify-content:center">${t('auth.login')}</button></form>`);
  $('#lf').onsubmit=async e=>{e.preventDefault();const f=e.target.elements,b=e.target.querySelector('button');b.disabled=true;
   const r=await post({action:'login',login:f.l.value.trim(),password:f.p.value,device:deviceInfo()}).catch(()=>({error:'net'}));b.disabled=false;
   if(r.error)return loginView(errText(r.error));token=r.token;user=r.user;ls.s(K.token,token);paint()}}
 function gateView(){setTitle();root().innerHTML=top(false);afterTop();
  /* чужая роль: только сообщение и ссылка, без запросов данных */
  view('gate',msg(t('gate.wrongRole'),`<p style="margin-top:18px"><a class="btn gold" href="${cfg.other.url}">${t(cfg.other.key)}</a></p>`))}
 function shellView(){setTitle();root().innerHTML=top(true)+tabsHtml();document.body.classList.toggle('has-tabs',!!cfg.tabs);afterTop();
  const nv=roleNav(),dd=nv.some(x=>x[0]===cfg.def)||!nv.length?cfg.def:nv[0][0];
  router=createRouter({routes:cfg.routes,def:dd,role:()=>user.role,perms:()=>user.perms||[],on:{
   render(ctx,n){drawer(false);recPush(n);paintRecent();$$('.sh-n a[data-n]').forEach(a=>a.classList.toggle('on',a.dataset.n===n));$$('.sh-tabs a').forEach(a=>a.classList.toggle('on',a.dataset.n===n));{const tm=$('#tbm');if(tm)tm.classList.toggle('on',!$$('.sh-tabs a').some(a=>a.dataset.n===n))}const r=cfg.routes[n];
    view(n,(cfg.views&&cfg.views[n]?cfg.views[n](ctx,user):`<h1 style="font-size:34px">${t(r.k)}</h1><p class="sub">${t('gate.soon')}</p>`))},
   forbidden(){view('forbidden',msg(t('gate.noAccess'),homeLink()))},
   notFound(){view('notFound',msg(t('gate.notFound'),homeLink()))}}});
  router.resolve()}
 let bound=false;
 addEventListener('keydown',e=>{if(e.key==='Escape')drawer(false)});
 async function paint(){document.documentElement.lang=L;document.body.classList.remove('has-tabs');
  if(!API_URL){setTitle();root().innerHTML=top(false);afterTop();return view('config',msg(t('err.noApi')))}
  if(token&&!user){setTitle();root().innerHTML=top(false);afterTop();view('loading',`<p class="sub" style="text-align:center;margin-top:60px">${t('common.loading')}</p>`);const r=await post({action:'whoami',token}).catch(()=>({error:'net'}));
   if(r.user)user=r.user;else if(r.error==='auth'){token='';ls.s(K.token,'')}else{setTitle();root().innerHTML=top(false);afterTop();return view('net',msg(t('err.net')))}}
  if(!user)return loginView();
  if(!cfg.allowed.includes(user.role)||(cfg.app==='admin'&&user.role!=='admin'&&!roleNav().length))return gateView();
  shellView()}
 /* v2.22-S4: любая перерисовка списка или окна (innerHTML, tbody, модальное окно в body) → подписи ячеек обновляются сами; меняются только атрибуты, поэтому цикла нет */
 const watchTables=()=>{if(typeof MutationObserver==='undefined'||!document.body)return;const q=new Set(),add=n=>{if(n&&n.nodeType===1)q.add(n)};
  new MutationObserver(ms=>{ms.forEach(m=>{const tg=m.target&&m.target.closest?m.target.closest('table.tb'):null;if(tg)add(tg);m.addedNodes.forEach(n=>{if(n.nodeType!==1)return;const tb=n.closest&&n.closest('table.tb');add(tb||n)})});
   const a=[...q];q.clear();a.forEach(n=>labelCells(n))}).observe(document.body,{childList:true,subtree:true})};
 return{start(){if(!bound){bound=true;watchTables();addEventListener('hashchange',()=>{if(router&&user&&cfg.allowed.includes(user.role))router.resolve()})}return paint()},get router(){return router}}}
