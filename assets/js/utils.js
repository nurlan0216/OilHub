/* utils.js: общие утилиты */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const ls={g(k){try{return localStorage.getItem(k)}catch(e){return null}},s(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isOn=v=>v===true||/^(true|1|\u0434\u0430|yes)$/i.test(String(v));
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const live=o=>isOn(o.active)&&(!o.start||o.start<=today())&&(!o.end||o.end>=today());
const srt=a=>[...a].sort((x,y)=>(Number(x.sort)||0)-(Number(y.sort)||0));
const lines=s=>String(s||'').split('\n').map(x=>x.trim()).filter(Boolean);
const norm=s=>String(s).toLowerCase().replace(/[\s\-_.\/]/g,'');
/* Единый формат WhatsApp: цифры, Казахстан 8XXXXXXXXXX → 7XXXXXXXXXX, 10 цифр → 7XXXXXXXXXX. Пустое значение допустимо. */
function normalizeWhatsApp(raw){const v=String(raw==null?'':raw).trim();if(!v)return {ok:true,value:''};let d=v.replace(/\D/g,'');if(d.length===11&&d[0]==='8')d='7'+d.slice(1);else if(d.length===10)d='7'+d;if(d.length<11||d.length>15)return {ok:false,error:(typeof t==='function'?t('integ.waBad'):'Invalid WhatsApp phone number (11–15 digits).')};return {ok:true,value:d}}
const waLink=(phone,text)=>{const n=normalizeWhatsApp(phone);return n.ok&&n.value?'https://wa.me/'+n.value+(text?'?text='+encodeURIComponent(text):''):''};
const appr=p=>String(p.approvals||'').split(';').map(x=>x.trim()).filter(Boolean);

/* ---------- маршрутизация по хэшу: #/имя/аргумент?ключ=значение ---------- */
function parseHash(h){const s=String(h||'').replace(/^#\/?/,''),i=s.indexOf('?'),p=i<0?s:s.slice(0,i);
 const seg=p.split('/').filter(Boolean).map(x=>{try{return decodeURIComponent(x)}catch(e){return x}});
 return{name:seg[0]||'',args:seg.slice(1),q:new URLSearchParams(i<0?'':s.slice(i+1))}}
// o: {routes:{имя:{roles?:[...]}}, def:'имя по умолчанию', role:()=>роль, on:{render(ctx,name), forbidden(ctx,name), notFound(ctx)}}
// Обработчик раздела вызывается только если роль разрешена: данные чужой роли не запрашиваются.
function createRouter(o){
 const api={state:'',resolve(){let ctx=parseHash(location.hash);
   if(!ctx.name&&o.def){try{history.replaceState(null,'','#/'+o.def)}catch(e){location.hash='#/'+o.def}ctx=parseHash('#/'+o.def)}
   const r=o.routes[ctx.name];
   if(!r){api.state='notFound';o.on.notFound(ctx);return api.state}
   if(r.roles&&!r.roles.includes(o.role())){api.state='forbidden';o.on.forbidden(ctx,ctx.name);return api.state}
   if(r.perm&&o.perms&&![].concat(r.perm).some(x=>o.perms().includes(x))){api.state='forbidden';o.on.forbidden(ctx,ctx.name);return api.state}
   api.state='ok:'+ctx.name;o.on.render(ctx,ctx.name);return api.state},
  go(name){location.hash='#/'+name},
  start(){addEventListener('hashchange',api.resolve);return api.resolve()}};
 return api}

/* Проверка казахских букв в шрифтах: kkGlyphCheck() в консоли. Рисует каждую букву нужным шрифтом и запасным; если картинка совпала с «пустым» запасным шрифтом, глифа нет. */
function kkGlyphCheck(fonts){
  const T='\u04D8\u04D9\u0492\u0493\u049A\u049B\u04A2\u04A3\u04E8\u04E9\u04B0\u04B1\u04AE\u04AF\u04BA\u04BB\u0406\u0456',F=fonts||['Manrope','Exo 2'],bad={};
  const draw=(ff,ch)=>{const c=document.createElement('canvas');c.width=c.height=48;const g=c.getContext('2d');g.font='32px '+ff;g.fillText(ch,4,36);return c.toDataURL()};
  F.forEach(f=>{bad[f]=[...T].filter(ch=>draw("'"+f+"',serif",ch)===draw('serif',ch)&&draw("'"+f+"',monospace",ch)===draw('monospace',ch))});
  console.log('\u04D8\u04D9 \u0492\u0493 \u049A\u049B \u04A2\u04A3 \u04E8\u04E9 \u04B0\u04B1 \u04AE\u04AF \u04BA\u04BB \u0406\u0456',bad);return bad;
}

/* ---------- форматы (собственные, без Intl: одинаково в Safari и на старых Android) ---------- */
const NBSP='\u00A0';let _cur='₸';
const setCurrency=c=>{_cur=String(c||'').trim()||'₸'};
const p2=n=>String(n).padStart(2,'0');
/* 12500 → «12 500» (неразрывный пробел), дробная часть через запятую */
function fmtNum(n,dec){n=Number(n);if(!isFinite(n))return'';const neg=n<0;n=Math.abs(n);const s=dec==null?String(Math.round(n*100)/100):n.toFixed(dec),q=s.split('.');return(neg?'−':'')+q[0].replace(/\B(?=(\d{3})+(?!\d))/g,NBSP)+(q[1]?','+q[1]:'')}
/* 12500 → «12 500 ₸»; валюта из Settings.currency (setCurrency), по умолчанию ₸ */
function fmtMoney(n,cur){const v=fmtNum(n);return v===''?'':v+NBSP+(cur||_cur)}
/* 'гггг-мм-дд', 'дд.мм.гггг', ISO или Date → Date (без сдвига часового пояса) */
function toDate(v){if(v instanceof Date)return isNaN(v)?null:v;const s=String(v==null?'':v).trim();let m;
 if((m=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2}))?/)))return new Date(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0));
 if((m=s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/)))return new Date(+m[3],+m[2]-1,+m[1]);
 const d=new Date(s);return isNaN(d)?null:d}
const fmtDate=v=>{const d=toDate(v);return d?p2(d.getDate())+'.'+p2(d.getMonth()+1)+'.'+d.getFullYear():String(v==null?'':v)};
const fmtTime=v=>{if(typeof v==='string'){const m=v.trim().match(/^(\d{1,2}):(\d{2})/);if(m)return p2(m[1])+':'+m[2]}const d=toDate(v);return d?p2(d.getHours())+':'+p2(d.getMinutes()):String(v==null?'':v)};
const fmtDateTime=v=>fmtDate(v)+' '+fmtTime(v);
// v2.21-D3: названия дней и месяцев лежат в словаре i18n.js (date.days, date.months, date.monthsGen), списки через запятую, воскресенье первым.
// Запасной вариант, если словарь не загружен: Intl.DateTimeFormat (kk-KZ / ru-RU); если Intl без нужной локали (старый Safari), возвращается номер.
const dateList=(k,l)=>{try{const r=I[k]&&I[k][l];if(r)return String(r).split(',').map(x=>x.trim())}catch(e){}return null};
const intlName=(l,o,d)=>{try{return new Intl.DateTimeFormat(l==='kk'?'kk-KZ':'ru-RU',o).format(d)}catch(e){return ''}};
const dayName=(v,l)=>{const d=toDate(v);if(!d)return '';l=l||L;const a=dateList('date.days',l);return a?a[d.getDay()]:(intlName(l,{weekday:'long'},d)||String(d.getDay()))};
const monthName=(m,l)=>{l=l||L;const a=dateList('date.months',l);return a?a[m]:(intlName(l,{month:'long'},new Date(2000,m,1))||String(m+1))};
const monthNameGen=(m,l)=>{l=l||L;const a=dateList('date.monthsGen',l);return a?a[m]:(intlName(l,{day:'numeric',month:'long'},new Date(2000,m,1)).replace(/^\d+\s*/,'')||String(m+1))};
// «8 қазан, Бейсенбі» / «8 октября, четверг»
function fmtDateLong(v,l){const d=toDate(v);l=l||L;if(!d)return String(v==null?'':v);const w=dayName(d,l);return d.getDate()+' '+monthNameGen(d.getMonth(),l)+', '+(l==='kk'?w:w.toLowerCase())}

/* Тип устройства и режим для журнала входов. Только тип и режим, без User-Agent, IP и отпечатков. */
function deviceInfo(){
  var ua=(navigator.userAgent||''),ty='other';
  if(/iPad/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1))ty='ipad';
  else if(/iPhone|iPod/i.test(ua))ty='iphone';
  else if(/Android/i.test(ua))ty='android';
  else if(/Windows/i.test(ua))ty='windows';
  else if(/Macintosh|Mac OS X/i.test(ua))ty='mac';
  else if(/Linux|X11/i.test(ua))ty='linux';
  var app=false;try{app=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true}catch(e){}
  return {type:ty,mode:app?'app':'browser'};
}

// v2.21-E6/E7: печать документа (Z-отчёт, акт расхождений) из текущей страницы: html кладётся в #prn, остальная страница на печати скрыта
function printBox(html){
 let d=document.getElementById('prn');if(d)d.remove();
 d=document.createElement('div');d.id='prn';d.innerHTML=html;
 if(!document.getElementById('prn-st')){const s=document.createElement('style');s.id='prn-st';
  s.textContent='#prn{display:none}@media print{body.prn-on>*:not(#prn){display:none!important}body.prn-on>#prn{display:block!important;color:#000;background:#fff;font:13px/1.45 sans-serif;padding:8mm}body.prn-on{background:#fff!important;margin:0!important;min-height:0!important;height:auto!important;overflow:visible!important}#prn table{width:100%;border-collapse:collapse;margin:8px 0}#prn th,#prn td{border-bottom:1px solid #888;padding:3px 5px;text-align:left}#prn h1{font-size:18px;margin:0 0 6px}#prn .sg{display:flex;gap:30px;margin-top:34px}#prn .sg div{flex:1;border-top:1px solid #000;padding-top:4px;font-size:11px}}';
  document.head.appendChild(s)}
 document.body.appendChild(d);document.body.classList.add('prn-on');
 addEventListener('afterprint',()=>{document.body.classList.remove('prn-on');d.remove()},{once:true});
 window.print()}
