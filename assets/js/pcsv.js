/* pcsv.js: v2.22-S9. Обновление цен, остатков, артикулов, фасовок и штрихкодов товаров из CSV (раздел «Товары»).
   Разбор и проверка целиком в браузере (csv.js), на сервер уходят обычные upsert по одному товару и только изменённые поля:
   права, история остатков и проверка штрихкода остаются серверными. Новые товары здесь не создаются (нужны категория, slug, название: форма товара).
   Правила файла: колонка id обязательна; пустая ячейка значение НЕ меняет; колонка name только для удобства и пропускается;
   фасовки в ячейке разделяются знаком «|» (допустим и «;» в кавычках), разделитель столбцов «;» или «,». */
const ProductsCsv=(()=>{
 const COLS=['id','name','sku','price','old_price','stock','sizes','barcode'],EDIT=['sku','price','old_price','stock','sizes','barcode'],MAX=500,
  LAB={sku:'admin.f.sku',price:'admin.f.price',old_price:'admin.f.oldPrice',stock:'admin.f.stock',sizes:'common.sizes',barcode:'admin.f.barcode'},
  nz=v=>String(v==null?'':v).replace(/[\s ]/g,'').replace(',','.'),
  sizesOf=v=>String(v==null?'':v).split(/[|;]/).map(x=>x.trim()).filter(Boolean),
  same=(k,a,b)=>k==='price'||k==='old_price'||k==='stock'?(a===''||a==null?'':String(Number(a)))===(b===''?'':String(Number(b))):k==='sizes'?sizesOf(a).join(';')===sizesOf(b).join(';'):String(a==null?'':a).trim()===String(b==null?'':b).trim();
 /* products: строки листа Products; возвращает отчёт {fatal, ignored, items, counts}. fatal — ключ i18n с общей ошибкой файла */
 function plan(text,products,csv){csv=csv||(typeof Csv!=='undefined'?Csv:null);
  const p=csv.parse(text);if(p.unclosed)return{fatal:'pi.unclosed',items:[],ignored:[],counts:{upd:0,same:0,err:0}};
  const rc=csv.records(p);if(!rc.header.length||!rc.records.length)return{fatal:'pi.empty',items:[],ignored:[],counts:{upd:0,same:0,err:0}};
  if(rc.header.indexOf('id')<0)return{fatal:'pi.noId',items:[],ignored:[],counts:{upd:0,same:0,err:0}};
  if(rc.records.length>MAX)return{fatal:'pi.tooMany',items:[],ignored:[],counts:{upd:0,same:0,err:0}};
  const byId={};(products||[]).forEach(r=>{byId[r.id]=r});
  const ignored=rc.header.filter(h=>h&&COLS.indexOf(h)<0),seen={},items=[];
  rc.records.forEach((r,i)=>{const id=String(r.id||'').trim(),it={line:rc.lines[i],id,name:(byId[id]||{}).name||r.name||'',row:{},changes:[],errs:[],warns:[],status:'same'};items.push(it);
   if(!id){it.errs.push({k:'pi.err.id'});return}
   if(!byId[id]){it.errs.push({k:'pi.err.unk'});return}
   if(seen[id]){it.errs.push({k:'pi.err.dup',p:{n:seen[id]}});return}seen[id]=it.line;
   const cur=byId[id];
   EDIT.forEach(k=>{if(!Object.prototype.hasOwnProperty.call(r,k))return;let v=String(r[k]==null?'':r[k]).trim();if(v==='')return;
    if(k==='price'||k==='old_price'){v=nz(v);if(!/^\d{1,9}(\.\d{1,2})?$/.test(v))return it.errs.push({k:'pi.err.num',p:{c:k}});v=String(Number(v))}
    else if(k==='stock'){v=nz(v);if(!/^\d{1,9}$/.test(v))return it.errs.push({k:'pi.err.int'});v=String(Number(v))}
    else if(k==='sizes'){const a=sizesOf(v);if(a.length>8)return it.errs.push({k:'pi.err.sizes'});v=a.join(';')}
    else if(k==='barcode'){if(/\s/.test(v)||v.length>40)return it.errs.push({k:'pi.err.bcfmt'})}
    else if(k==='sku'&&v.length>60)return it.errs.push({k:'pi.err.skuLen'});
    if(!same(k,cur[k],v)){it.row[k]=v;it.changes.push([k,cur[k]==null?'':cur[k],v])}});
   const np=it.row.price!==undefined?Number(it.row.price):Number(cur.price||0),no=it.row.old_price!==undefined?Number(it.row.old_price):Number(cur.old_price||0);
   if((it.row.price!==undefined||it.row.old_price!==undefined)&&no>0&&np>0&&no<=np)it.warns.push({k:'pi.warn.old'})});
  /* артикул и штрихкод не должны совпадать у двух товаров: считаем итоговые значения (файл поверх таблицы) */
  items.forEach(it=>{it.v0=!it.errs.length});
  ['sku','barcode'].forEach(k=>{const fin={},cnt={};(products||[]).forEach(r=>{fin[r.id]=String(r[k]||'').trim().toLowerCase()});
   items.forEach(it=>{if(it.v0&&it.row[k]!==undefined)fin[it.id]=it.row[k].toLowerCase()});
   Object.keys(fin).forEach(id=>{if(fin[id])cnt[fin[id]]=(cnt[fin[id]]||0)+1});
   items.forEach(it=>{if(it.v0&&it.row[k]!==undefined&&cnt[it.row[k].toLowerCase()]>1)it.errs.push({k:k==='sku'?'pi.err.sku':'pi.err.bc',p:{v:it.row[k]}})})});
  const counts={upd:0,same:0,err:0};items.forEach(it=>{delete it.v0;it.status=it.errs.length?'err':it.changes.length?'upd':'same';counts[it.status]++});
  return{fatal:null,ignored,items,counts}}
 const q=v=>/[;"\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;
 /* текущая таблица в виде файла для правки в Excel: UTF-8 с BOM, разделитель «;» */
 function toCsv(products){return '﻿'+COLS.join(';')+'\r\n'+(products||[]).map(r=>COLS.map(k=>q(k==='sizes'?sizesOf(r.sizes).join('|'):String(r[k]==null?'':r[k]))).join(';')).join('\r\n')+'\r\n'}
 const fv=(k,v)=>k==='sizes'?sizesOf(v).join(' | '):String(v);
 function open(o){/* o: {rows:()=>[...], call, say, err, onDone} */
  const d=document.createElement('div');d.className='mod',st={plan:null,busy:false};
  d.innerHTML=`<form class="wide pi" novalidate><h3 style="font-size:24px;margin-bottom:8px">${t('pi.title')}</h3><p class="sub">${t('pi.hint')}</p>
   <div class="pi-a"><button type="button" class="btn ghost" data-dl>⤓ ${t('pi.dl')}</button><a class="btn ghost" href="./data/products-template.csv" download="products-template.csv">${t('pi.tpl')}</a><label class="btn ghost" style="cursor:pointer">⤒ ${t('pi.pick')}<input type="file" hidden data-f accept=".csv,text/csv,text/plain,application/vnd.ms-excel"></label></div>
   <div data-rep aria-live="polite"></div><div class="mact"><button type="button" class="btn ghost" data-x>${t('common.close')}</button><button type="submit" class="btn gold" data-go disabled>${t('pi.go')}</button></div></form>`;
  document.body.appendChild(d);const fm=d.querySelector('form'),rep=d.querySelector('[data-rep]'),go=d.querySelector('[data-go]'),X=d.querySelector('[data-x]');
  if(typeof sheetInit==='function')sheetInit(d);d._try=()=>{if(!st.busy)d.remove()};d.onclick=e=>{if(e.target===d)d._try()};X.onclick=()=>d._try();
  const L=it=>`${t('pi.line',{n:it.line})} · <b>${esc(it.id||'—')}</b>${it.name?' · '+esc(it.name):''}`,
   E=e=>t(e.k,Object.assign({},e.p,e.p&&e.p.c?{c:t(LAB[e.p.c]||e.p.c)}:{})),
   draw=()=>{const P=st.plan;if(!P){rep.innerHTML='';go.disabled=true;return}
    if(P.fatal){rep.innerHTML=`<p class="note" style="border-color:#d9534f">${t(P.fatal)}</p>`;go.disabled=true;go.textContent=t('pi.go');return}
    const c=P.counts,chip=(k,v,cl)=>`<li class="ci-c ${cl||''}"><b>${fmtNum(v)}</b><span>${t('pi.sum.'+k)}</span></li>`,
     li=P.items.filter(x=>x.status!=='same'||x.warns.length).map(it=>`<li class="pi-r pi-${it.status}"><div>${L(it)}</div>${it.errs.map(e=>`<div class="pi-e">⚠ ${esc(E(e))}</div>`).join('')}${it.changes.map(([k,a,b])=>`<div class="pi-c"><span>${esc(t(LAB[k]))}</span> ${a===''||a==null?'—':esc(fv(k,a))} → <b>${esc(fv(k,b))}</b></div>`).join('')}${it.warns.map(e=>`<div class="pi-w">! ${esc(E(e))}</div>`).join('')}</li>`).join('');
    rep.innerHTML=`<ul class="ci-sum">${chip('upd',c.upd,'ok')}${chip('same',c.same)}${chip('err',c.err,c.err?'er':'')}</ul>${P.ignored.filter(h=>h!=='name').length?`<p class="note">${t('pi.ignored',{list:esc(P.ignored.filter(h=>h!=='name').join(', '))})}</p>`:''}${c.upd||c.err?'':`<p class="note">${t('pi.nothing')}</p>`}<ul class="pi-l">${li}</ul>`;
    go.disabled=st.busy||!c.upd;go.textContent=c.upd?t('pi.goN',{n:fmtNum(c.upd)}):t('pi.go')};
  d.querySelector('[data-dl]').onclick=()=>{const b=new Blob([toCsv(o.rows())],{type:'text/csv;charset=utf-8'}),a=document.createElement('a'),n=new Date();a.href=URL.createObjectURL(b);a.download='products-'+n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')+'.csv';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)};
  d.querySelector('[data-f]').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onerror=()=>{st.plan={fatal:'pi.empty'};draw()};r.onload=()=>{st.plan=plan(String(r.result),o.rows());draw()};r.readAsText(f,'utf-8');e.target.value=''};
  fm.onsubmit=async e=>{e.preventDefault();const P=st.plan;if(!P||P.fatal||st.busy)return;const todo=P.items.filter(x=>x.status==='upd');if(!todo.length)return;
   st.busy=true;go.disabled=true;let ok=0;const bad=[];
   for(let i=0;i<todo.length;i++){go.textContent=t('pi.run',{n:i+1,m:todo.length});const it=todo[i];let r;try{r=await o.call({action:'upsert',sheet:'Products',row:Object.assign({id:it.id},it.row)})}catch(x){r={ok:false,error:'ERR_NET'}}
    if(r&&r.ok)ok++;else bad.push([it,r&&r.error])}
   st.busy=false;go.textContent=t('pi.go');
   rep.innerHTML=`<p class="note" ${bad.length?'style="border-color:#d9534f"':''}>${t('pi.done',{n:fmtNum(ok),m:fmtNum(bad.length)})}</p>${bad.length?`<ul class="pi-l">${bad.map(([it,er])=>`<li class="pi-r pi-err"><div>${L(it)}</div><div class="pi-e">⚠ ${esc(o.err(er))}</div></li>`).join('')}</ul>`:''}`;
   o.say(t('pi.done',{n:fmtNum(ok),m:fmtNum(bad.length)}));if(o.onDone)o.onDone()};
  return d}
 return{plan,toCsv,open,COLS}})();
if(typeof module!=='undefined'&&module.exports)module.exports=ProductsCsv;
