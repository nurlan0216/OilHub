/* api.js: клиент API (Apps Script) */
const API_URL=(window.OILHUB&&window.OILHUB.API_URL)||"";
/* Действия, о недоступности сети для которых страница сообщает сама (очередь продаж) или молчит */
const NO_NET_QUIET=['sale_post','whoami','logout'];
function noNet(b){try{if(NO_NET_QUIET.indexOf(b&&b.action)<0)window.dispatchEvent(new CustomEvent('oh:nonet',{detail:b&&b.action}))}catch(e){}}
/* v2.22-S10: состояние связи с API (navigator.onLine врёт при слабом сигнале); шапка кассы слушает oh:netstate */
let NETOK=true;
const netOk=()=>NETOK&&!(typeof navigator!=='undefined'&&navigator.onLine===false);
function netState(ok){if(ok===NETOK)return;NETOK=ok;try{window.dispatchEvent(new CustomEvent('oh:netstate',{detail:{ok}}))}catch(e){}}
async function post(b){
  if(typeof navigator!=='undefined'&&navigator.onLine===false){netState(false);noNet(b);throw new Error('net')}
  try{const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(b)});const j=await r.json();netState(true);return j}
  catch(e){netState(false);noNet(b);throw e}
}
