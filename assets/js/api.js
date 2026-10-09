/* api.js: клиент API (Apps Script) */
const API_URL=(window.OILHUB&&window.OILHUB.API_URL)||"";
/* Действия, о недоступности сети для которых страница сообщает сама (очередь продаж) или молчит */
const NO_NET_QUIET=['sale_post','whoami','logout'];
function noNet(b){try{if(NO_NET_QUIET.indexOf(b&&b.action)<0)window.dispatchEvent(new CustomEvent('oh:nonet',{detail:b&&b.action}))}catch(e){}}
async function post(b){
  if(typeof navigator!=='undefined'&&navigator.onLine===false){noNet(b);throw new Error('net')}
  try{const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(b)});return await r.json()}
  catch(e){noNet(b);throw e}
}
