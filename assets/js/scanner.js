// scanner.js: Scanner.open({onCode(code)→строка-статус|undefined, keep}) — камера на задней линзе (только HTTPS).
// Нативный BarcodeDetector используется самой библиотекой html5-qrcode (assets/vendor, версия зафиксирована), на iPhone/Safari — её ZXing.
/* тексты этого файла живут в i18n.js */
const Scanner=(function(){
 const SRC='./assets/vendor/html5-qrcode-2.3.8.min.js';let q=null,box=null,last='',lastT=0;
 const load=()=>window.Html5Qrcode?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement('script');s.src=SRC;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
 function beep(){try{navigator.vibrate&&navigator.vibrate(60);const c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator();o.frequency.value=1000;o.connect(c.destination);o.start();setTimeout(()=>{o.stop();c.close()},90)}catch(e){}}
 async function close(){if(q){try{await q.stop();q.clear()}catch(e){}q=null}if(box){box.remove();box=null}}
 async function open(o){await close();
  box=document.createElement('div');box.className='scn';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');
  box.innerHTML=`<div class="scn-b"><div id="scn-v"></div><p id="scn-m" class="sub">${esc(t('scan.prompt'))}</p>
   <div class="scn-a"><input id="scn-i" inputmode="numeric" autocomplete="off" placeholder="${esc(t('pos.barcode'))}" aria-label="${esc(t('pos.barcode'))}"><button class="btn gold" data-m>${esc(t('pos.manual'))}</button></div>
   <div class="scn-a"><button class="btn ghost" data-f aria-label="${esc(t('scan.torch'))}">🔦</button><button class="btn ghost" data-x>${esc(t('common.close'))}</button></div></div>`;
  document.body.appendChild(box);const msg=s=>{const m=$('#scn-m',box);if(m)m.textContent=s};
  const hit=code=>{code=String(code||'').trim();if(!code)return;const n=Date.now();if(code===last&&n-lastT<1300)return;last=code;lastT=n; /* пауза: один код не срабатывает дважды */
   beep();Promise.resolve(o.onCode(code)).then(r=>{if(r)msg(r)});if(!o.keep)close()};
  $('[data-x]',box).onclick=close;$('[data-m]',box).onclick=()=>{const i=$('#scn-i',box);hit(i.value);i.value=''};
  $('#scn-i',box).onkeydown=e=>{if(e.key==='Enter')$('[data-m]',box).click()};
  let on=false;$('[data-f]',box).onclick=async()=>{try{on=!on;await q.applyVideoConstraints({advanced:[{torch:on}]})}catch(e){on=false;$('[data-f]',box).style.display='none'}};
  try{await load();const F=Html5QrcodeSupportedFormats;
   q=new Html5Qrcode('scn-v',{formatsToSupport:[F.EAN_13,F.EAN_8,F.CODE_128,F.CODE_39,F.UPC_A,F.UPC_E,F.QR_CODE],experimentalFeatures:{useBarCodeDetectorIfSupported:true},verbose:false});
   await q.start({facingMode:'environment'},{fps:10,qrbox:{width:260,height:170}},hit,()=>{})}
  catch(e){msg(t('scan.camDenied')+'. '+t('scan.camHelp'))} /* ручной ввод остаётся доступным */
 }
 return{open,close}})();
