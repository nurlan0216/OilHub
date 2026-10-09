/* labels.js: логика этикеток (этап G3.1), без интерфейса. Тексты ошибок живут в i18n.js (label.err.*), здесь только коды причин. */
/* Labels.validateEan13(code) → {ok, reason}: reason 'len' (не 13 цифр) или 'check' (неверная контрольная цифра); при ok reason = null. */
/* Labels.render(format, value) → строка SVG: 'code128' | 'ean13' | 'qr'. Нужен DOM и локальные библиотеки из assets/vendor (JsBarcode, qrcode-generator). */
/* Ошибки render приходят исключением Error с полем code: 'format', 'empty', 'len', 'check', 'chars', 'long', 'lib', 'nodom'. */
/* Labels.pickFormat(product) → формат этикетки. Его можно задать на товаре полем label_format ('code128' | 'ean13' | 'qr'), */
/* если он выполним для кода товара (ean13 только для валидного EAN-13); иначе действуют правила по умолчанию. */
/* Labels.valueFor(product, format) → строка, которую нужно закодировать. */
/* G3.2: таблица размеров LABEL_SIZES, раскладка (layout), подбор шрифта названия (fitName), окно печати LabelsUI. Логика кодов выше не менялась. */
/* ===== таблица размеров этикеток. Чтобы добавить свой, достаточно новой записи; подпись берётся из i18n (label.size.<id>), без неё имя строится из размеров. ===== */
/* roll: рулон, w и h в мм, pad: внутренний отступ, мм. sheet: лист, page [ширина, высота] мм, cols и rows: колонки и строки, margin [верх, право, низ, лево] мм, gap [между колонками, между строками] мм. */
/* Размер ячейки листа считается из этих чисел: (страница − поля − интервалы) / число колонок или строк. */
const LABEL_SIZES=[
 {id:'r58x40',k:'label.size.r58x40',kind:'roll',w:58,h:40,pad:2},
 {id:'r40x30',k:'label.size.r40x30',kind:'roll',w:40,h:30,pad:1.5},
 {id:'a4x24',k:'label.size.a4x24',kind:'sheet',page:[210,297],cols:3,rows:8,margin:[12.9,7.2,12.9,7.2],gap:[2.54,0],pad:2},
 {id:'a4x65',k:'label.size.a4x65',kind:'sheet',page:[210,297],cols:5,rows:13,margin:[10.7,4.75,10.7,4.75],gap:[2.5,0],pad:1}];
/* copies: копий одного товара; total: этикеток за одну печать; codes: товаров за один вызов label_codes (как на сервере) */
const LABEL_LIMITS={copies:999,total:1000,codes:200};
const Labels=(function(){
 const FORMATS=['code128','ean13','qr'],MAXLEN=64,
  str=v=>String(v==null?'':v).trim(),
  isUrl=s=>/^https?:\/\/\S+$/i.test(s),
  ascii=s=>/^[\x20-\x7e]+$/.test(s); /* печатный ASCII: Code128 в режиме auto кодирует его без потерь */
 function validateEan13(code){
  const s=str(code);if(!/^\d{13}$/.test(s))return{ok:false,reason:'len'};
  let sum=0;for(let i=0;i<12;i++)sum+=(+s[i])*(i%2?3:1);
  return (10-sum%10)%10===+s[12]?{ok:true,reason:null}:{ok:false,reason:'check'}}
 const fail=c=>{const e=new Error('labels:'+c);e.code=c;return e},
  ser=n=>typeof XMLSerializer!=='undefined'?new XMLSerializer().serializeToString(n):n.outerHTML;
 function render(format,value){
  const f=String(format||'').toLowerCase(),v=str(value);
  if(FORMATS.indexOf(f)<0)throw fail('format');
  if(!v)throw fail('empty');
  if(typeof document==='undefined')throw fail('nodom');
  if(f==='qr'){
   if(typeof qrcode==='undefined')throw fail('lib');
   if(v.length>300)throw fail('long');
   /* байты строки в UTF-8 (по умолчанию библиотека режет символы до одного байта) */
   qrcode.stringToBytes=s=>Array.from(new TextEncoder().encode(s));
   const q=qrcode(0,'M');q.addData(v,'Byte');q.make();
   return q.createSvgTag({cellSize:4,margin:16}); /* поле 4 модуля со всех сторон */
  }
  if(typeof JsBarcode==='undefined')throw fail('lib');
  if(f==='ean13'){const r=validateEan13(v);if(!r.ok)throw fail(r.reason)}
  else{if(!ascii(v))throw fail('chars');if(v.length>MAXLEN)throw fail('long')}
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  JsBarcode(svg,v,{format:f==='ean13'?'EAN13':'CODE128',width:2,height:80,margin:12,displayValue:true,fontSize:16,textMargin:2,background:'#ffffff',lineColor:'#000000'});
  svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
  return ser(svg)}
 /* что кодировать: штрихкод товара; для QR без штрихкода — ссылка, иначе id */
 function valueFor(p,format){p=p||{};const code=str(p.barcode);
  if(format==='qr')return code||str(p.url)||str(p.link)||str(p.id);
  return code}
 function feasible(f,p){const v=valueFor(p,f);
  if(f==='qr')return !!v&&v.length<=300;
  if(f==='ean13')return validateEan13(v).ok;
  return !!v&&ascii(v)&&v.length<=MAXLEN}
 function pickFormat(p){p=p||{};
  const ov=str(p.label_format).toLowerCase();if(FORMATS.indexOf(ov)>=0&&feasible(ov,p))return ov;
  const code=str(p.barcode);
  if(!code)return 'qr';                       /* нет кода: QR со ссылкой или id */
  if(isUrl(code))return 'qr';                 /* в поле штрихкода лежит ссылка */
  if(validateEan13(code).ok)return 'ean13';   /* только настоящий EAN-13 с верной контрольной цифрой */
  return feasible('code128',p)?'code128':'qr'}  /* любой внутренний код; то, что не помещается в Code128, уходит в QR */

 /* ---------- G3.2: размеры, раскладка, шрифт названия (без DOM, проверяется в Node) ---------- */
 const MM=25.4/72,PTS=[10,9,8,7,6.5,6,5.5,5],LH=1.15,NAME_FRAC=0.34; /* MM: мм в одном пункте; NAME_FRAC: доля высоты под название */
 const toInt=v=>{const n=Math.floor(Number(String(v==null?'':v).replace(',','.')));return isFinite(n)?n:NaN};
 function copies(v){const n=toInt(v);return n>=1?Math.min(n,LABEL_LIMITS.copies):1}   /* число копий: целое от 1 до 999, мусор даёт 1 */
 function total(items){return(items||[]).reduce((a,x)=>a+copies(x&&x.copies),0)}      /* всего этикеток */
 function sizeById(id){return LABEL_SIZES.find(s=>s.id===id)||LABEL_SIZES[0]}
 function cell(s){ /* размер одной этикетки, мм */
  if(s.kind==='roll')return{w:s.w,h:s.h};
  const m=s.margin||[0,0,0,0],g=s.gap||[0,0];
  return{w:(s.page[0]-m[1]-m[3]-g[0]*(s.cols-1))/s.cols,h:(s.page[1]-m[0]-m[2]-g[1]*(s.rows-1))/s.rows}}
 function layout(s,n){const c=cell(s),per=s.kind==='roll'?1:s.cols*s.rows;n=Math.max(0,toInt(n)||0);
  return{kind:s.kind,w:c.w,h:c.h,perPage:per,pages:n?Math.ceil(n/per):0,total:n,page:s.kind==='roll'?[s.w,s.h]:s.page.slice()}}
 function checkSize(s){const e=[];if(!s||!s.id)return['id'];
  if(s.kind==='roll'){if(!(s.w>0))e.push('w');if(!(s.h>0))e.push('h')}
  else if(s.kind==='sheet'){if(!s.page||!(s.page[0]>0&&s.page[1]>0))e.push('page');if(!(s.cols>=1&&s.rows>=1))e.push('grid');
   if(!e.length){const c=cell(s);if(!(c.w>0&&c.h>0))e.push('cell');if((s.margin||[]).some(x=>x<0)||(s.gap||[]).some(x=>x<0))e.push('negative')}}
  else e.push('kind');
  if(!e.length&&s.pad!=null&&!(s.pad>=0&&s.pad*2<Math.min(cell(s).w,cell(s).h)))e.push('pad');return e}
 function pageCss(s){const p=s.kind==='roll'?[s.w,s.h]:s.page;return'@page{size:'+p[0]+'mm '+p[1]+'mm;margin:0}'} /* размер листа печати: рулон = этикетка, лист = страница */
 function metrics(s){const c=cell(s),pad=s.pad==null?2:s.pad,sc=Math.min(c.w/58,c.h/40);
  return{w:c.w,h:c.h,pad:pad,innerW:c.w-2*pad,innerH:c.h-2*pad,nameMaxH:(c.h-2*pad)*NAME_FRAC,metaPt:Math.max(5,Math.min(8,7*sc)),capPt:Math.max(4.5,Math.min(6.5,5.5*sc))}}
 function wrap(s,max){const out=[];let cur='';s.split(' ').forEach(w=>{while(w.length>max){if(cur){out.push(cur);cur=''}out.push(w.slice(0,max));w=w.slice(max)}
  if(!w)return;if(!cur)cur=w;else if(cur.length+1+w.length<=max)cur+=' '+w;else{out.push(cur);cur=w}});if(cur)out.push(cur);return out}
 /* Название: самый крупный шрифт из 10…5 pt, при котором текст помещается в отведённую высоту; иначе минимальный шрифт и обрезка с «…». Ширина знака берётся с запасом (0,6 em, у заглавных до 0,77 em); если браузер всё же перенесёт строк больше, лишнее скроет line-clamp. */
 function fitName(name,m){const s=str(name).replace(/\s+/g,' ');if(!s)return{pt:PTS[0],text:'',lines:0,truncated:false};
  let up=0;for(const ch of s)if(ch!==ch.toLowerCase())up++;up/=[...s].length;
  const cw=pt=>(0.6+0.17*up)*pt*MM,mx=pt=>Math.max(1,Math.floor(m.innerW/cw(pt)));
  for(const pt of PTS){const ln=wrap(s,mx(pt));if(ln.length*pt*MM*LH<=m.nameMaxH+1e-9)return{pt:pt,text:s,lines:ln.length,truncated:false}}
  const pt=PTS[PTS.length-1],max=mx(pt),cap=Math.max(1,Math.floor(m.nameMaxH/(pt*MM*LH))),ln=wrap(s,max);
  if(ln.length<=cap)return{pt:pt,text:s,lines:ln.length,truncated:false};
  const keep=ln.slice(0,cap),last=keep[cap-1];keep[cap-1]=(last.length>=max?last.slice(0,max-1):last)+'…';
  return{pt:pt,text:keep.join(' '),lines:cap,truncated:true}}
 return{FORMATS,validateEan13,render,pickFormat,valueFor,sizes:LABEL_SIZES,limits:LABEL_LIMITS,sizeById,copies,total,cell,layout,checkSize,pageCss,metrics,fitName}})();

/* ===== G3.2: окно «Этикетки» (интерфейс). Тексты только через i18n.js (label.*). Нужны utils.js (esc, $, $$, fmtMoney, fmtNum) и i18n.js (t). ===== */
/* LabelsUI.canUse(user): кнопка и окно доступны только с правом create_receipt или edit_stock (на сервере то же проверяет label_codes). */
/* LabelsUI.open({user, items:[{product, copies}], call(body)→Promise, onCodes()}): открывает окно; false, если прав нет или товаров нет. call отправляет действие на сервер с токеном. */
/* Печать: окно строит #lb-print (по этикетке или по листу на страницу), ставит body.lb-printing и @page нужного размера и вызывает window.print(); остальное скрывает labels.css (@media print). */
const LabelsUI=(function(){
 const S={},str=v=>String(v==null?'':v).trim(),CACHE={},
  ERR={ERR_FORBIDDEN:'err.forbidden',ERR_NOT_FOUND:'err.notFound',ERR_BAD:'err.bad',ERR_EMPTY:'err.empty',ERR_TOO_MANY:'label.err.many'};
 const has=(u,p)=>!!u&&Array.isArray(u.perms)&&u.perms.indexOf(p)>=0;
 const canUse=u=>has(u,'create_receipt')||has(u,'edit_stock');
 /* цена только при праве view_prices и если она задана (число больше нуля) */
 const showPrice=(u,p)=>has(u,'view_prices')&&p&&str(p.price)!==''&&isFinite(Number(p.price))&&Number(p.price)>0;
 const sizesText=p=>str(p&&p.sizes).split(';').map(x=>x.trim()).filter(Boolean).join(' · ');
 const num=n=>String(Math.round(n*1000)/1000);
 const sizeName=s=>s.k&&typeof I!=='undefined'&&I[s.k]?t(s.k):(s.name||(s.kind==='roll'?s.w+'×'+s.h:s.page[0]+'×'+s.page[1]+' '+s.cols+'×'+s.rows)+' '+t('label.mm'));
 const fmtName=f=>t('label.fmt.'+f);
 /* какой формат и что кодировать для строки; рисунок кода считается один раз на пару формат+значение */
 function info(it){const p=it.p,f=Labels.pickFormat(it.fmt?Object.assign({},p,{label_format:it.fmt}):p),v=Labels.valueFor(p,f),k=f+'|'+v;
  if(!CACHE[k]){try{CACHE[k]={svg:fitSvg(Labels.render(f,v))}}catch(e){CACHE[k]={err:e&&e.code||'lib'}}}
  return{fmt:f,value:v,svg:CACHE[k].svg,err:CACHE[k].err,code:str(p.barcode)}}
 /* SVG из библиотек имеет фиксированные width/height: переводим их в viewBox, чтобы код растягивался на отведённое место */
 function fitSvg(x){const m=/<svg\b[^>]*>/.exec(x);if(!m)return x;let tag=m[0];const w=/\swidth="([\d.]+)(?:px)?"/.exec(tag),h=/\sheight="([\d.]+)(?:px)?"/.exec(tag);
  if(!/\sviewBox=/.test(tag)&&w&&h)tag=tag.replace('<svg','<svg viewBox="0 0 '+w[1]+' '+h[1]+'"');
  tag=tag.replace(/\s(?:width|height)="[^"]*"/g,'').replace('<svg','<svg preserveAspectRatio="xMidYMid meet"');return x.replace(m[0],tag)}
 /* одна этикетка: название, фасовка, цена, код (QR с подписью; у штрихкодов подпись нарисована в самом SVG) */
 function labelHtml(it,s,u){const m=Labels.metrics(s),inf=info(it),nm=Labels.fitName(it.p.name,m),sz=sizesText(it.p),pr=showPrice(u,it.p)?fmtMoney(Number(it.p.price)):'';
  return'<div class="lb" style="width:'+num(m.w)+'mm;height:'+num(m.h)+'mm;padding:'+num(m.pad)+'mm">'
   +'<div class="lb-n" style="font-size:'+nm.pt+'pt;max-height:'+num(m.nameMaxH)+'mm;-webkit-line-clamp:'+Math.max(1,nm.lines)+'">'+esc(nm.text)+'</div>'
   +(sz||pr?'<div class="lb-m" style="font-size:'+num(m.metaPt)+'pt">'+(sz?'<span class="lb-s">'+esc(sz)+'</span>':'<span></span>')+(pr?'<b class="lb-p">'+esc(pr)+'</b>':'')+'</div>':'')
   +'<div class="lb-c">'+inf.svg+'</div>'
   +(inf.fmt==='qr'?'<div class="lb-t" style="font-size:'+num(m.capPt)+'pt">'+esc(inf.value.length>30?inf.value.slice(0,29)+'…':inf.value)+'</div>':'')+'</div>'}
 /* страницы: рулон = одна этикетка на страницу размером с этикетку; лист = сетка cols×rows на странице A4 */
 function pagesHtml(list,s,limit){const lay=Labels.layout(s,list.length);let o='';
  if(s.kind==='roll'){list.slice(0,limit||list.length).forEach(h=>{o+='<div class="lb-pg lb-roll" style="width:'+num(s.w)+'mm;height:'+num(s.h)+'mm">'+h+'</div>'});return o}
  const m=s.margin||[0,0,0,0],g=s.gap||[0,0],per=lay.perPage,np=limit?Math.min(lay.pages,limit):lay.pages;
  for(let p=0;p<np;p++)o+='<div class="lb-pg lb-sheet" style="width:'+num(s.page[0])+'mm;height:'+num(s.page[1])+'mm;padding:'+m.map(num).join('mm ')+'mm;grid-template-columns:repeat('+s.cols+','+num(lay.w)+'mm);grid-auto-rows:'+num(lay.h)+'mm;column-gap:'+num(g[0])+'mm;row-gap:'+num(g[1])+'mm">'+list.slice(p*per,(p+1)*per).join('')+'</div>';
  return o}
 const flat=()=>{const o=[];S.items.forEach(it=>{const h=labelHtml(it,S.size,S.user),n=Labels.copies(it.copies);for(let i=0;i<n;i++)o.push(h)});return o};
 const badRows=()=>S.items.filter(it=>info(it).err);
 const count=()=>Labels.total(S.items);
 const ready=()=>S.items.length>0&&count()<=Labels.limits.total&&!badRows().length&&!Labels.checkSize(S.size).length;
 function say(m,bad){const e=$('#lb-msg');if(!e)return;e.textContent=m||'';e.style.display=m?'block':'none';e.style.borderColor=bad?'#d9534f':'var(--gold)'}
 function paintInfo(){const lay=Labels.layout(S.size,count()),el=$('#lb-info');if(!el)return;
  el.textContent=t('label.total',{n:fmtNum(lay.total),p:fmtNum(lay.pages)})+' · '+t('label.cell',{w:fmtNum(lay.w,1),h:fmtNum(lay.h,1)});
  const over=count()>Labels.limits.total;$('#lb-warn').textContent=over?t('label.err.total',{n:fmtNum(Labels.limits.total)}):'';$('#lb-warn').style.display=over?'block':'none';
  $('#lb-print-btn').disabled=!ready()}
 function paintPreview(){const box=$('#lb-pv');if(!box)return;
  if(!S.items.length||Labels.checkSize(S.size).length){box.innerHTML='';return}
  const bad=badRows();if(bad.length){box.innerHTML='';return}
  if(S.size.kind==='roll'){box.innerHTML=pagesHtml(S.items.slice(0,6).map(it=>labelHtml(it,S.size,S.user)),S.size)}
  else{const per=S.size.cols*S.size.rows,l=flat().slice(0,per);box.innerHTML=pagesHtml(l,S.size,1)}}
 const fmtOpts=it=>{const auto=Labels.pickFormat(it.p);
  return'<option value="">'+esc(t('label.auto')+' ('+fmtName(auto)+')')+'</option>'+Labels.FORMATS.map(f=>{const ok=Labels.pickFormat(Object.assign({},it.p,{label_format:f}))===f;return'<option value="'+f+'"'+(it.fmt===f?' selected':'')+(ok?'':' disabled')+'>'+esc(fmtName(f))+'</option>'}).join('')};
 function paintRows(){const el=$('#lb-rows');if(!el)return;
  el.innerHTML=S.items.map((it,i)=>{const inf=info(it);
   return'<div class="lbr'+(inf.err?' bad':'')+'" data-i="'+i+'"><div class="lbr-n"><b>'+esc(it.p.name)+'</b>'+(sizesText(it.p)?'<small>'+esc(sizesText(it.p))+'</small>':'')+'</div>'
    +'<button type="button" class="lbr-x" data-rm="'+i+'" aria-label="'+esc(t('common.close'))+'">✕</button>'
    +'<div class="lbr-c">'+(inf.code?'<code>'+esc(inf.code)+'</code>':'<span class="lbr-no">'+esc(t('label.nocode'))+'</span>')+(inf.err?'<span class="lbr-e">'+esc(t('label.err.'+inf.err))+'</span>':'')+'</div>'
    +'<div class="lbr-k"><span class="lbr-q"><button type="button" data-d="-1" data-i="'+i+'" aria-label="−">−</button><input inputmode="numeric" data-q="'+i+'" value="'+Labels.copies(it.copies)+'" aria-label="'+esc(t('label.copies'))+'"><button type="button" data-d="1" data-i="'+i+'" aria-label="+">+</button></span>'
    +'<select data-f="'+i+'" aria-label="'+esc(t('label.format'))+'">'+fmtOpts(it)+'</select></div></div>'}).join('')||'<p class="sub">'+esc(t('label.none'))+'</p>';
  const nc=S.items.some(it=>!str(it.p.barcode));const g=$('#lb-gen');if(g)g.style.display=nc?'':'none';
  $$('[data-rm]',el).forEach(b=>b.onclick=()=>{S.items.splice(+b.dataset.rm,1);paintAll()});
  $$('[data-f]',el).forEach(x=>x.onchange=()=>{S.items[+x.dataset.f].fmt=x.value;paintAll()});
  $$('[data-q]',el).forEach(x=>{x.oninput=()=>{const n=Labels.copies(x.value);S.items[+x.dataset.q].copies=n;paintInfo();paintPreview()};x.onchange=()=>{x.value=Labels.copies(x.value);S.items[+x.dataset.q].copies=+x.value;paintInfo();paintPreview()}});
  $$('[data-d]',el).forEach(b=>b.onclick=()=>{const it=S.items[+b.dataset.i],n=Math.min(Labels.limits.copies,Math.max(1,Labels.copies(it.copies)+Number(b.dataset.d)));it.copies=n;$('[data-q="'+b.dataset.i+'"]',el).value=n;paintInfo();paintPreview()})}
 function paintAll(){paintRows();paintInfo();paintPreview()}
 /* «Сгенерировать коды»: label_codes выдаёт внутренние коды только товарам без штрихкода (по 200 за вызов); результат показывается списком */
 async function gen(){const ids=S.items.filter(it=>!str(it.p.barcode)).map(it=>it.p.id);if(!ids.length)return;
  const b=$('#lb-gen-btn');b.disabled=true;say('');const got={};let skipped=[],err='';
  for(let k=0;k<ids.length;k+=Labels.limits.codes){let r;try{r=await S.call({action:'label_codes',product_ids:ids.slice(k,k+Labels.limits.codes)})}catch(e){r={error:'net'}}
   if(!r||!r.ok){err=r&&r.error||'net';break}Object.assign(got,r.codes||{});skipped=skipped.concat(r.skipped||[])}
  S.items.forEach(it=>{if(got[it.p.id])it.p.barcode=got[it.p.id]});
  if(skipped.length){try{const r=await S.call({action:'list',sheet:'Products'});(r.rows||[]).forEach(x=>{S.items.forEach(it=>{if(it.p.id===x.id&&str(x.barcode))it.p.barcode=x.barcode})})}catch(e){}}
  b.disabled=false;const n=Object.keys(got).length;
  const out=$('#lb-gen-out');out.innerHTML=n?'<ul>'+S.items.filter(it=>got[it.p.id]).map(it=>'<li><span>'+esc(it.p.name)+'</span><code>'+esc(got[it.p.id])+'</code></li>').join('')+'</ul>':'';
  if(err)say(t(ERR[err]||'err.net'),true);else say(n?t('label.genDone',{n:fmtNum(n)}):t('label.genNone'));
  if(n&&S.onCodes)try{S.onCodes()}catch(e){}
  paintAll()}
 /* печать: отдельный корень #lb-print, чтобы в печать не попало ничего лишнего; @page ставится на время печати */
 function buildPrint(){cleanup();const l=flat(),d=document.createElement('div');d.id='lb-print';d.className='lb-print';d.innerHTML=pagesHtml(l,S.size);document.body.appendChild(d);
  const st=document.createElement('style');st.id='lb-page';st.textContent=Labels.pageCss(S.size);document.head.appendChild(st);document.body.classList.add('lb-printing');return l.length}
 function cleanup(){document.body.classList.remove('lb-printing');['lb-print','lb-page'].forEach(id=>{const e=document.getElementById(id);if(e)e.remove()})}
 function doPrint(){if(!canUse(S.user)||!ready())return;buildPrint();window.print()}
 const after=()=>cleanup();
 function close(){const m=$('#lb-modal');if(m)m.remove();cleanup();removeEventListener('afterprint',after);document.removeEventListener('keydown',S.key);const f=S.focus;S.open=false;if(S.onClose)try{S.onClose()}catch(e){}if(f&&f.focus)try{f.focus()}catch(e){}}
 function open(o){o=o||{};if(!canUse(o.user)||typeof o.call!=='function')return false;
  const seen={},items=[];(o.items||[]).forEach(x=>{const p=x&&x.product;if(!p||!p.id||seen[p.id])return;seen[p.id]=1;items.push({p:p,copies:Labels.copies(x.copies),fmt:''})});
  if(!items.length)return false;
  const old=$('#lb-modal');if(old)old.remove();cleanup();
  Object.assign(S,{user:o.user,call:o.call,onCodes:o.onCodes,onClose:o.onClose,items:items,size:Labels.sizeById(S.sizeId||ls.g('oh_label_size')),focus:document.activeElement,open:true});
  const d=document.createElement('div');d.id='lb-modal';d.className='lbm';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label',t('label.title'));
  d.innerHTML='<div class="lbm-b"><div class="lbm-h"><h3>'+esc(t('label.title'))+'</h3><button type="button" class="lbm-x" id="lb-x" aria-label="'+esc(t('common.close'))+'">✕</button></div>'
   +'<label for="lb-size">'+esc(t('label.size'))+'</label><select id="lb-size">'+Labels.sizes.map(s=>'<option value="'+esc(s.id)+'"'+(s.id===S.size.id?' selected':'')+'>'+esc(sizeName(s))+'</option>').join('')+'</select>'
   +'<div id="lb-rows" class="lbr-l"></div>'
   +'<div id="lb-gen" class="lbm-g"><button type="button" class="btn ghost" id="lb-gen-btn">'+esc(t('label.gen'))+'</button><span class="sub">'+esc(t('label.genHint'))+'</span></div>'
   +'<div id="lb-gen-out" class="lbm-o"></div><p class="note" id="lb-msg" style="display:none"></p>'
   +'<h4 class="lbm-t">'+esc(t('label.preview'))+'</h4><p class="sub lbm-sub" id="lb-info"></p><p class="note lbm-w" id="lb-warn" style="display:none;border-color:#d9534f"></p>'
   +'<div class="lbp" id="lb-pvbox" tabindex="0" aria-label="'+esc(t('label.preview'))+'"><div class="lbp-in" id="lb-pv"></div></div><p class="sub lbm-sub">'+esc(t('label.previewNote'))+'</p>'
   +'<div class="lbm-a"><button type="button" class="btn gold" id="lb-print-btn">'+esc(t('label.print'))+'</button></div></div>';
  document.body.appendChild(d);
  $('#lb-x').onclick=close;d.onclick=e=>{if(e.target===d)close()};
  S.key=e=>{if(e.key==='Escape'&&S.open)close()};document.addEventListener('keydown',S.key);addEventListener('afterprint',after);
  $('#lb-size').onchange=e=>{S.size=Labels.sizeById(e.target.value);S.sizeId=S.size.id;ls.s('oh_label_size',S.size.id);paintAll()};
  $('#lb-gen-btn').onclick=gen;$('#lb-print-btn').onclick=doPrint;paintAll();$('#lb-x').focus();return true}
 return{canUse,showPrice,open,close,sizeName,info,get state(){return S}}})();
