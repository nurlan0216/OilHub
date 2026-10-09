// OilHub PWA: один код для admin, staff и site.
// Баннер установки (Android/Chromium по beforeinstallprompt, подсказка только для Safari на iPhone/iPad),
// безопасное обновление service worker и сообщение об отсутствии сети.
(function(){
  'use strict';
  var DAYS7=7*24*3600*1000, DKEY='oh_pwa_dismissed', ID='oh-pwa-banner', NID='oh-pwa-nonet';
  var deferred=null, reg=null, hadController=false, userUpdate=false, render=null, forms=[];

  function tt(k,fb){try{if(typeof t==='function'){var v=t(k);if(v&&v!==k)return v}}catch(e){}return fb||k}
  function ua(){return navigator.userAgent||''}
  function standalone(){try{return (window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true}catch(e){return false}}
  function isIosSafari(){
    var u=ua(),ios=/iPhone|iPad|iPod/i.test(u)||(/Macintosh/i.test(u)&&navigator.maxTouchPoints>1);
    return ios&&/Safari/i.test(u)&&!/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|DuckDuckGo|YaBrowser/i.test(u);
  }
  function dismissed(){try{var v=+localStorage.getItem(DKEY);return v>0&&Date.now()-v<DAYS7}catch(e){return false}}
  function remember(){try{localStorage.setItem(DKEY,String(Date.now()))}catch(e){}}

  /* несохранённые данные: явные хуки страниц (window.OH_DIRTY) и любые изменённые формы, кроме входа */
  document.addEventListener('input',function(e){
    var f=e.target&&e.target.closest&&e.target.closest('form');
    if(f&&f.id!=='lf'&&forms.indexOf(f)<0)forms.push(f);
  },true);
  document.addEventListener('submit',function(e){var i=forms.indexOf(e.target);if(i>=0)forms.splice(i,1)},true);
  window.addEventListener('hashchange',function(){forms=[]});
  function dirty(){
    forms=forms.filter(function(f){return document.contains(f)});
    if(forms.length)return true;
    var h=window.OH_DIRTY||[];
    for(var i=0;i<h.length;i++){try{if(h[i]())return true}catch(e){}}
    return false;
  }

  /* баннер стоит в потоке страницы (перед содержимым) и ничего не перекрывает */
  function remove(){var b=document.getElementById(ID);if(b)b.remove()}
  function btn(label,primary,run){
    var b=document.createElement('button');b.type='button';b.textContent=label;
    b.style.cssText='min-height:44px;min-width:44px;padding:10px 16px;border:0;border-radius:10px;font:inherit;font-weight:600;cursor:pointer;background:'+(primary?'#d5a64b':'#34373d')+';color:'+(primary?'#171717':'#fff');
    b.addEventListener('click',run);return b;
  }
  function show(kind,text,buttons,html){
    remove();if(!document.body)return;
    var box=document.createElement('aside');box.id=ID;box.setAttribute('role','region');box.setAttribute('aria-label','OilHub');box.dataset.kind=kind;
    box.style.cssText='box-sizing:border-box;margin:8px auto;max-width:640px;width:calc(100% - 16px);padding:12px 14px;border:1px solid #d5a64b;border-radius:14px;background:#17191d;color:#fff;font:14px/1.45 system-ui,sans-serif';
    var p=document.createElement('div');p.style.marginBottom='10px';
    if(html){p.innerHTML=html}else{p.textContent=text}
    box.appendChild(p);
    var row=document.createElement('div');row.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
    buttons.forEach(function(b){row.appendChild(b)});box.appendChild(row);
    document.body.insertBefore(box,document.body.firstChild);
  }
  // C2. iOS: три шага со схемой (inline SVG, без внешних картинок). Подписи только через i18n (pwa.ios1..3, kk первым).
  // На схемах нет текста: строки заменены полосками, поэтому они одинаковы для kk и ru. Баннер закрываемый (кнопка «Кейін»),
  // в standalone не показывается, после закрытия возвращается через 7 дней (C1).
  var GOLD='#d5a64b';
  function scheme(inner){return '<svg viewBox="0 0 96 64" width="96" height="64" aria-hidden="true" focusable="false" style="flex:none;border-radius:8px;background:#0e0f11">'+inner+'</svg>'}
  function bar(x,y,w,h,c){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+Math.min(2,h/2)+'" fill="'+c+'"/>'}
  function schemes(){
    var tb='#2a2d33',pg='#23262b',gr='#4a4e56',lt='#cfd2d6';
    /* 1: нижняя панель Safari, значок «Бөлісу» выделен */
    var s1=scheme('<rect x="8" y="5" width="80" height="34" rx="5" fill="'+pg+'"/>'+bar(14,12,50,4,gr)+bar(14,21,66,4,gr)+bar(14,30,36,4,gr)
      +'<rect x="0" y="46" width="96" height="18" fill="'+tb+'"/>'+bar(12,53,8,4,gr)+bar(27,53,8,4,gr)+bar(66,53,8,4,gr)+bar(82,53,8,4,gr)
      +'<circle cx="48" cy="55" r="9" fill="none" stroke="'+GOLD+'" stroke-width="1.5"/>'
      +'<g transform="translate(41 48) scale(.58)" fill="none" stroke="'+GOLD+'" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></g>');
    /* 2: список действий, строка «Басты экранға қосу» выделена */
    var s2=scheme('<rect x="8" y="4" width="80" height="56" rx="6" fill="'+pg+'"/>'+bar(16,10,40,4,gr)+bar(16,18,56,4,gr)
      +'<rect x="12" y="26" width="72" height="14" rx="4" fill="rgba(213,166,75,.18)" stroke="'+GOLD+'" stroke-width="1.3"/>'
      +'<rect x="17" y="29" width="8" height="8" rx="2" fill="none" stroke="'+GOLD+'" stroke-width="1.3"/><path d="M21 31v4M19 33h4" stroke="'+GOLD+'" stroke-width="1.3" stroke-linecap="round"/>'+bar(30,31,38,4,GOLD)
      +bar(16,46,48,4,gr)+bar(16,53,30,3,gr));
    /* 3: подтверждение, кнопка «Қосу» выделена */
    var s3=scheme('<rect x="8" y="4" width="80" height="56" rx="6" fill="'+pg+'"/>'+bar(14,11,14,4,gr)
      +'<rect x="64" y="7" width="20" height="12" rx="6" fill="none" stroke="'+GOLD+'" stroke-width="1.3"/>'+bar(69,11,10,4,GOLD)
      +'<rect x="14" y="28" width="22" height="22" rx="5" fill="'+GOLD+'"/><circle cx="25" cy="39" r="6" fill="#16181b"/>'
      +bar(44,31,36,5,lt)+bar(44,41,26,4,gr));
    return [s1,s2,s3];
  }
  function iosSteps(){
    var rows=schemes().map(function(svg,i){
      return '<li style="display:flex;gap:12px;align-items:center;margin:8px 0">'+svg+'<span><b style="color:'+GOLD+'">'+(i+1)+'.</b> '+tt('pwa.ios'+(i+1))+'</span></li>';
    }).join('');
    return '<div>'+tt('pwa.hint')+'</div><ol style="list-style:none;margin:6px 0 0;padding:0" aria-label="'+tt('pwa.iosStep')+'">'+rows+'</ol>';
  }
  function hide(){render=null;remove()}
  function closeBtn(){return btn(tt('pwa.later'),false,function(){remember();hide()})}

  function maybeInstall(){
    if(standalone()||dismissed()){return}
    if(deferred){
      render=maybeInstall;
      show('install',tt('pwa.hint'),[
        btn(tt('pwa.install'),true,function(){
          var p=deferred;deferred=null;hide();
          try{p.prompt();p.userChoice.then(function(c){if(c&&c.outcome==='dismissed')remember()}).catch(function(){})}catch(e){}
        }),closeBtn()]);
      return;
    }
    if(isIosSafari()){
      render=maybeInstall;
      show('ios',null,[closeBtn()],iosSteps());
    }
  }
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e;maybeInstall()});
  window.addEventListener('appinstalled',function(){deferred=null;remember();hide()});

  /* обновление */
  function showUpdate(worker){
    render=function(){showUpdate(worker)};
    show('update',tt('pwa.update'),[
      btn(tt('pwa.updNow'),true,function(){
        if(dirty()&&!window.confirm(tt('pwa.confirmUpd')))return;
        userUpdate=true;worker.postMessage('SKIP_WAITING');hide();
      }),
      btn(tt('pwa.later'),false,hide)]);
  }
  /* страницу перезагружает только нажатие «Обновить»; первая установка service worker страницу не трогает */
  if('serviceWorker' in navigator&&location.protocol!=='file:'){
    hadController=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',function(){
      if(!hadController){hadController=true;return}
      if(userUpdate){userUpdate=false;location.reload()}
    });
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(function(r){
        reg=r;
        if(r.waiting&&navigator.serviceWorker.controller)showUpdate(r.waiting);
        r.addEventListener('updatefound',function(){
          var w=r.installing;if(!w)return;
          w.addEventListener('statechange',function(){if(w.state==='installed'&&navigator.serviceWorker.controller)showUpdate(w)});
        });
      }).catch(function(e){console.warn('SW:',e&&e.message)});
      setTimeout(maybeInstall,800); /* подсказка не зависит от успеха регистрации */
    });
  }else{window.addEventListener('load',function(){setTimeout(maybeInstall,800)})}
  document.addEventListener('langchange',function(){if(render)render()});

  /* нет сети: понятное сообщение, данные не теряются молча */
  window.addEventListener('oh:nonet',function(){
    var old=document.getElementById(NID);if(old)old.remove();if(!document.body)return;
    var d=document.createElement('div');d.id=NID;d.setAttribute('role','alert');
    d.style.cssText='box-sizing:border-box;margin:8px auto;max-width:640px;width:calc(100% - 16px);padding:12px 14px;border:1px solid #d9534f;border-radius:14px;background:#2a1517;color:#fff;font:14px/1.45 system-ui,sans-serif';
    d.textContent=tt('net.nodata');
    document.body.insertBefore(d,document.body.firstChild);
    setTimeout(function(){if(d.parentNode)d.remove()},10000);
  });
  window.OH_PWA={isIosSafari:isIosSafari,standalone:standalone,dismissed:dismissed,dirty:dirty};
})();
