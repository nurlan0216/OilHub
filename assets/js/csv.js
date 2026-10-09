/* csv.js: небольшой разбор CSV целиком в браузере (этап G2.2). Csv.parse(text) → {rows, lines, delim, unclosed}; Csv.records(parsed) → {header, records, lines}.
   Снимает BOM; разделитель «;», «,» или табуляция определяется по первой строке (кавычки не считаются); кавычки, "" и переносы строк внутри кавычек; пустые строки пропускаются.
   lines[i] — номер физической строки файла, с которой начинается запись rows[i] (переносы внутри кавычек сдвигают нумерацию). Тексты здесь не нужны. */
const Csv=(()=>{
 const DELIMS=[';',',','\t'];
 function detect(s){const c={';':0,',':0,'\t':0};let q=false;
  for(let i=0;i<s.length;i++){const ch=s[i];if(ch==='"'){if(q&&s[i+1]==='"')i++;else q=!q}else if(!q){if(ch==='\n'||ch==='\r')break;if(c[ch]!==undefined)c[ch]++}}
  let best=',',n=0;DELIMS.forEach(d=>{if(c[d]>n){n=c[d];best=d}});return best}
 function parse(text,delim){
  const s=String(text==null?'':text).replace(/^﻿/,''),d=delim||detect(s),rows=[],lines=[];
  let row=[],f='',q=false,quoted=false,line=1,start=1;
  const endField=()=>{row.push(f);f='';quoted=false},
   endRow=()=>{endField();if(row.some(x=>x.trim()!==''))rows.push(row),lines.push(start);row=[]};
  for(let i=0;i<s.length;i++){const ch=s[i];
   if(q){if(ch==='"'){if(s[i+1]==='"'){f+='"';i++}else q=false}else{if(ch==='\n')line++;else if(ch==='\r'&&s[i+1]!=='\n')line++;f+=ch}continue}
   if(ch==='"'&&f===''&&!quoted){q=true;quoted=true;continue}
   if(ch===d){endField();continue}
   if(ch==='\r'||ch==='\n'){if(ch==='\r'&&s[i+1]==='\n')i++;endRow();line++;start=line;continue}
   f+=ch}
  const unclosed=q;if(f!==''||row.length||quoted)endRow();
  return{rows,lines,delim:d,unclosed}}
 /* первая запись — шапка (названия колонок в нижнем регистре, пустые имена отбрасываются); остальные — объекты {колонка: значение} */
 function records(p){if(!p.rows.length)return{header:[],records:[],lines:[]};
  const header=p.rows[0].map(h=>h.trim().toLowerCase()),out=[],ln=[];
  p.rows.slice(1).forEach((r,i)=>{const o={};header.forEach((h,j)=>{if(h&&!Object.prototype.hasOwnProperty.call(o,h))o[h]=r[j]==null?'':r[j]});out.push(o);ln.push(p.lines[i+1])});
  return{header,records:out,lines:ln}}
 return{parse,records,detect}})();
if(typeof module!=='undefined'&&module.exports)module.exports=Csv;
