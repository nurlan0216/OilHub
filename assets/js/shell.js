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
 const view=(state,html)=>{const m=$('#view');if(m){m.dataset.view=state;m.innerHTML=html}};
 const msg=(text,link)=>`<div class="panel" style="max-width:520px;margin:40px auto"><h2 style="font-size:26px">${esc(text)}</h2>${link||''}</div>`;
 const homeLink=()=>`<p style="margin-top:18px"><a class="btn ghost" href="#/${cfg.def}">${t('gate.home')}</a></p>`;
 const errText=e=>{const c=String(e||'');if(/ERR_LOCKED/.test(c))return t('auth.many');if(/ERR_AUTH|auth/.test(c)&&c!=='net')return t('auth.bad');if(/ERR_FORBIDDEN|^forbidden$/.test(c))return t('err.forbidden');if(/ERR_STOCK/.test(c))return t('err.stock');if(/ERR_SLOT_TAKEN|^taken$/.test(c))return t('err.slotTaken');if(/ERR_NOT_FOUND/.test(c))return t('err.notFound');if(/ERR_POSTED/.test(c))return t('sale.locked');if(/ERR_BARCODE_DUP/.test(c))return t('barcode.dup');if(/ERR_SERVER/.test(c))return t('err.server');if(/ERR_BAD/.test(c))return t('err.bad');return t('err.net')};
 const logout=()=>{const old=token;token='';user=null;ls.s(K.token,'');if(old&&API_URL)post({action:'logout',token:old}).catch(()=>{});location.hash='';paint()};
 const roleNav=()=>cfg.nav.filter(([n])=>{const r=cfg.routes[n];return(!r.roles||r.roles.includes(user.role))&&(!r.perm||[].concat(r.perm).some(x=>(user.perms||[]).includes(x)))});
 /* v2.22-S2: на телефоне меню — боковая шторка (кнопка ☰ слева, затемнение, Esc, закрытие по пункту) */
 const userBox=()=>user?`<span class=\"sh-u\">${esc(user.name||user.login)}</span><button class=\"btn ghost\" id=\"lo\">${t('auth.logout')}</button>`:'';
 const top=(withNav)=>`<header class=\"sh\">${withNav?`<button class=\"sh-bg\" id=\"mb\" aria-expanded=\"false\" aria-controls=\"dr\" aria-label=\"${t('aria.menu')}\">\u2630</button>`:''}<b class=\"sh-b\">OilHub</b>${withNav?`<nav class=\"sh-n\" id=\"dr\" aria-label=\"${t('aria.menu')}\"><div class=\"sh-dh\"><b class=\"sh-b\">OilHub</b><button class=\"sh-x\" id=\"mx\" aria-label=\"${t('common.close')}\">\u2715</button></div>${roleNav().map(([n,k])=>`<a href=\"#/${n}\" data-n=\"${n}\">${t(k)}</a>`).join('')}<div class=\"sh-df\">${userBox().replace('id=\"lo\"','id=\"lo2\"')}</div></nav><div class=\"sh-bk\" id=\"bk\"></div>`:'<span></span>'}<span class=\"sh-r\">${langPill()}${userBox()}</span></header><main id=\"view\"></main>`;
 const drawer=o=>{const d=$('#dr'),b=$('#bk'),m=$('#mb');if(!d)return;d.classList.toggle('open',o);if(b)b.classList.toggle('on',o);if(m)m.setAttribute('aria-expanded',o);document.body.classList.toggle('sh-lock',o)};
 const afterTop=()=>{bindLang();if($('#lo'))$('#lo').onclick=logout;if($('#lo2'))$('#lo2').onclick=logout;
  if($('#mb')){$('#mb').onclick=()=>drawer(!$('#dr').classList.contains('open'));$('#mx').onclick=()=>drawer(false);$('#bk').onclick=()=>drawer(false);$$('#dr a').forEach(a=>a.addEventListener('click',()=>drawer(false)))}};
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
 function shellView(){setTitle();root().innerHTML=top(true);afterTop();
  const nv=roleNav(),dd=nv.some(x=>x[0]===cfg.def)||!nv.length?cfg.def:nv[0][0];
  router=createRouter({routes:cfg.routes,def:dd,role:()=>user.role,perms:()=>user.perms||[],on:{
   render(ctx,n){drawer(false);$$('.sh-n a').forEach(a=>a.classList.toggle('on',a.dataset.n===n));const r=cfg.routes[n];
    view(n,(cfg.views&&cfg.views[n]?cfg.views[n](ctx,user):`<h1 style="font-size:34px">${t(r.k)}</h1><p class="sub">${t('gate.soon')}</p>`))},
   forbidden(){view('forbidden',msg(t('gate.noAccess'),homeLink()))},
   notFound(){view('notFound',msg(t('gate.notFound'),homeLink()))}}});
  router.resolve()}
 let bound=false;
 addEventListener('keydown',e=>{if(e.key==='Escape')drawer(false)});
 async function paint(){document.documentElement.lang=L;
  if(!API_URL){setTitle();root().innerHTML=top(false);afterTop();return view('config',msg(t('err.noApi')))}
  if(token&&!user){setTitle();root().innerHTML=top(false);afterTop();view('loading',`<p class="sub" style="text-align:center;margin-top:60px">${t('common.loading')}</p>`);const r=await post({action:'whoami',token}).catch(()=>({error:'net'}));
   if(r.user)user=r.user;else if(r.error==='auth'){token='';ls.s(K.token,'')}else{setTitle();root().innerHTML=top(false);afterTop();return view('net',msg(t('err.net')))}}
  if(!user)return loginView();
  if(!cfg.allowed.includes(user.role)||(cfg.app==='admin'&&user.role!=='admin'&&!roleNav().length))return gateView();
  shellView()}
 return{start(){if(!bound){bound=true;addEventListener('hashchange',()=>{if(router&&user&&cfg.allowed.includes(user.role))router.resolve()})}return paint()},get router(){return router}}}
