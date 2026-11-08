// Собирает таблицу бестиария (bestiary-table.html) из cards.js + captions.js.
// node build-table.js  -> bestiary-table.html (картинки карточек рядом: cards/NN_id.jpg)
// Публикация: publish_files, as: index.html + cards/*.jpg (артефакт - см. PUBLISHING.md).
const fs = require('fs');
require('./cards.js'); require('./captions.js');
const C = globalThis.CARDS, P = globalThis.CAPTIONS;
const EP = { obmanka: '1 «Обманка»', tumannik: '2 «Туманник»', podrazhatel: '3 «Подражатель»', mokhnach: '4 «Мохнач»', ulybyshi: '5 «Улыбыши»', tishka: '6 «Тишка»', zerkalnik: '7 «Зеркальник»', fonarnitsa: '8 «Фонарница»', pryatysh: '9 «Пряталки»', puzyryok: '10 «Пузырёк»', mokhovichki: '11 «Моховички»', lunoed: '12 «Луноед»', zubochka: '13 «Зубочка»', pugovka: '15 «Пуговка»', teplyshka: '16 «Тёплышка»' };

// что наблюдатель сделал ручкой на странице (у каждой свой приём)
const PEN = {
  obmanka: 'Первая страница журнала. Правка спокойная, как у учёного: он засекал, сколько можно смотреть на свет, - вышло меньше, чем думал.',
  tumannik: 'На снимке еле виден второй силуэт в тумане - их двое. «это не дерево».',
  podrazhatel: 'REC 03:12:07 - снимок с одной из прошлых ночей. В записке последняя фраза - «это я. открой.»: наблюдатель её никогда не говорил (это слова из-за двери в 03:12).',
  mokhnach: 'Пересчитывал глаза - значит, подходил близко. Глаз стало 25.',
  ulybyshi: 'Пометок нет - вместо них отпечаток ладошки улыбыша. Кто-то листал журнал. Мама улыбышей не попадает в кадр.',
  tishka: 'Фраза оборвана на «зв…» - Тишка съел звук, и наблюдатель перестал писать.',
  zerkalnik: 'Надпись зеркальная: её писали, глядя в отражение, - или писал не он.',
  fonarnitsa: 'Крестики на огоньках - это люди. «12?» - кто-то потерялся сегодня.',
  pryatysh: 'Считалка Прятыша: на «пять» почерк срывается - он нашёл.',
  puzyryok: 'одно слово крупно поверх машинописи: «ЗОВИ»',
  mokhovichki: 'лист порос мхом, из-под мха видно «не засы…»',
  lunoed: 'клякса и дрожащий почерк «не смотри на свет», угол откушен',
  zubochka: 'к странице приклеен скотчем настоящий зубик',
  pugovka: 'глаза на снимке заштрихованы ручкой, лист прошит красной ниткой крест-накрест',
  teplyshka: 'столбик температур ручкой поверх снимка: «кур.» теплеет, «я» остывает; последняя цифра не дописана, ручка соскользнула',
};
// что спрятано на странице - только для автора, в посты не идёт
const ARG = {
  obmanka: 'Первая страница журнала. Пометка спокойная: наблюдатель ещё просто засекает время.',
  tumannik: '«не моргай» - он уже понял, как подходит туманник.',
  podrazhatel: 'REC 03:12:07 - снимок с одной из прошлых ночей: дверь скрипела каждую ночь в 03:12, задолго до стука. «это не дверь».',
  mokhnach: '«я сосчитал» - наблюдатель пересчитывает глаза, значит, подходил близко.',
  ulybyshi: '«шестой, если кто-то задержался» + мама улыбышей не попадает в кадр.',
  tishka: '«рация» - у наблюдателя была рация; рядом с Тишкой она замолкала (мостик к «МОЛЧИ»).',
  zerkalnik: '«нас двое» в стекле будки - первый раз в журнале наблюдатель пишет о будке.',
  fonarnitsa: '12-й огонёк появился «сегодня»: кто-то потерялся. Намёк, что огоньки - это люди.',
  pryatysh: '«он уже здесь» - Прятыш прятался у будки.',
  puzyryok: 'Морзе ЭТО НЕ Я - настоящее слово наблюдателя: шёпот «не верь…» в 10-й серии был не его голос. В окне будки подделка мигала вместо этого ЛОЖЬ со сбоем. «ЗОВИ» поверх машинописи - он спорит с собственным милым текстом («звать на помощь не нужно»).',
  mokhovichki: 'Морзе УХОДИ - в окне будки подделка превратила его в ОСТАНЬСЯ. Лист порос мхом (журнал лежал в болоте), из-под мха видна пометка «не засы…» (не засыпай). А в 11-й серии он сам лежит под мхом.',
  lunoed: 'Последняя страница журнала: REC 03:10:58, за минуту до «Наблюдения №4». Морзе ГАСИ СВ… (гаси свет) - в окне будки подделка мигала ИДИ НА СВЕТ; угол страницы откушен прямо по слову. Клякса - ручку уронили; дрожащее «не смотри на свет» - это уже про зрителя.',
};
ARG.zubochka = 'REC 02:14:37 - одна из ранних ночей (№ 12 остаётся последней страницей). Морзе НЕ СПИ - настоящее слово наблюдателя; в окне будки в 13-й серии подделка мигает СПИ (буквы слиты, ритм ровный, как колыбельная). «Утром у моей подушки лежал камушек» - он сам был у неё в гостях; приклеенный зубик - его.';
ARG.pugovka = 'REC 01:22:09 - ранняя ночь, у Пуговки ещё два глаза. Записи № 14 нет - будто вырвана (серия 14 не о существе). Морзе НЕ СМОТРИ - сигнал акта 3, его же в серии мигает светлячок. Пропавший объектив - последний глаз из серии; прошитый лист - эхо финала.';
ARG.teplyshka = 'REC 00:41:16 - самая ранняя ночь журнала, но одной пуговицы на снимке уже нет. Это куртка самого наблюдателя (последний факт: оставил на крючке, утром висела на коряге). Температуры - его последние замеры: он мёрз, пока она грелась. Морзе НЕ СМОТРИ - как светлячок в серии.';
const rows = Object.entries(C).map(([id, c]) => ({ id, no: c.no, title: c.title, ep: EP[id], rec: c.rec, forged: !!c.forged, pen: PEN[id] || '', morse: c.morse + (c.morseCode ? ' (сбой)' : c.bite ? '… (откушено)' : ''), sub: c.sub, facts: c.facts, caption: P[id] || '', arg: ARG[id] || '', img: `cards/${c.no}_${id}.jpg` }));

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Мерцалова топь - бестиарий</title>
<style>
  :root{--bg:#0B1030;--card:#16224A;--line:#25325C;--txt:#E8ECF7;--mut:#9AA6C8;--warm:#FFC874;--glow:#5AC8D2;--red:#E0736A;}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--txt);font:15px/1.45 -apple-system,system-ui,"Segoe UI",Roboto,sans-serif;padding:14px 12px 60px}
  h1{font-size:20px;margin:4px 0 2px}
  .sub{color:var(--mut);font-size:13px;margin-bottom:12px}
  .tabs{display:flex;gap:6px;overflow-x:auto;padding:6px 0;position:sticky;top:0;background:var(--bg);z-index:2}
  .tab{flex:0 0 auto;border:1px solid var(--line);background:var(--card);color:var(--txt);border-radius:999px;padding:8px 13px;font-size:14px}
  .tab.on{background:var(--warm);color:#1a1300;border-color:var(--warm);font-weight:600}
  .tab.f{border-color:#6b3a44}
  .wrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px;margin:10px 0}
  table{border-collapse:collapse;min-width:760px;font-size:13.5px}
  th,td{padding:8px 9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
  th{color:var(--mut);font-weight:500;background:var(--card);position:sticky;top:0}
  td.n{color:var(--warm);font-weight:600}
  tr.f td{background:rgba(120,40,50,.18)}
  tr{cursor:pointer}
  .pill{display:inline-block;font-size:11.5px;padding:1px 7px;border-radius:6px;background:#1E4A47;color:#BFF3EC;white-space:nowrap}
  .pill.f{background:#5a2630;color:#FFD3CF}
  .h{margin:14px 0 4px;font-size:18px}
  .field{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:8px 0}
  .row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}
  .label{color:var(--mut);font-size:13px}
  .val{white-space:pre-wrap;word-break:break-word;font-size:14.5px}
  .arg{border-color:#6b3a44}
  .arg .label{color:var(--red)}
  img.card{width:100%;max-width:540px;display:block;border-radius:10px;margin:8px 0}
  button.copy{border:0;border-radius:8px;background:var(--line);color:var(--txt);padding:7px 12px;font-size:13px;min-width:92px}
  button.copy.done{background:#1E4A47;color:#BFF3EC}
  .note{color:var(--mut);font-size:13px;margin:6px 2px}
  ul{margin:4px 0;padding-left:18px}
</style>
</head>
<body>
<h1>📖 Бестиарий Мерцаловой топи</h1>
<div class="sub">Страницы журнала наблюдателя для Telegram. Таблица - обзор, вкладки - карточка, подпись к посту и что спрятано.</div>
<div class="tabs" id="tabs"></div>
<div id="view"></div>
<script>
const DATA = ${JSON.stringify(rows, null, 1)};
const tabs = document.getElementById('tabs'), view = document.getElementById('view');
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function copyBtn(text){const b=document.createElement('button');b.className='copy';b.textContent='Копировать';
  b.onclick=async()=>{try{await navigator.clipboard.writeText(text);b.textContent='Скопировано';b.classList.add('done');setTimeout(()=>{b.textContent='Копировать';b.classList.remove('done')},1600);}catch(e){b.textContent='Выдели вручную';}};return b;}
function field(label,text,cls){const d=document.createElement('div');d.className='field '+(cls||'');
  d.innerHTML='<div class="row"><span class="label">'+esc(label)+'</span></div><div class="val">'+esc(text)+'</div>';
  d.querySelector('.row').appendChild(copyBtn(text));return d;}
function overview(){
  let h='<div class="h">Все существа</div><div class="note">Нажми на строку - откроется карточка. Все страницы - настоящие записи наблюдателя.</div>';
  h+='<div class="wrap"><table><tr><th>№</th><th>Существо</th><th>Серия</th><th>REC</th><th>Ручкой</th><th>Морзе</th></tr>';
  for(const r of DATA){h+='<tr class="'+(r.forged?'f':'')+'" data-id="'+r.id+'"><td class="n">'+r.no+'</td><td>'+esc(r.title)+'</td><td>'+esc(r.ep)+'</td><td>'+r.rec+'</td><td>'+esc(r.pen)+'</td><td>'+esc(r.morse)+'</td></tr>';}
  h+='</table></div>';
  h+='<div class="field"><div class="label">Кто пишет журнал</div><div class="val">Машинопись - старый нежный справочник самого наблюдателя. Его голос потом украл Подражатель: это и есть голос рассказчика.\\nРучка - поздние пометки наблюдателя. У каждой страницы свой приём: сначала спокойные правки учёного, потом записки, подсчёты, оборванные фразы, к концу паника и следы болота.\\n01-09 - настоящие пометки (снимки с разных ночей, все до 03:11), к концу всё тревожнее.\\n10-12 - после 03:12 пишет уже не он: почерк слишком ровный, зачёркнуто страшное и вписано милое, пометки зазывают, Морзе со сбоями.\\nКанал ведёт «рассказчик»: он выкладывает страницы как милый бестиарий, а пометки ручкой проскакивают мимо него.</div></div>';
  h+='<div class="field"><div class="label">Порядок постов</div><div class="val">№ 03 уже вышла. Дальше по номерам: 01, 02, 04 … 13, 15, 16 - так подписчики увидят, как пометки становятся всё тревожнее. Новая карточка - через день после выхода серии или когда в канале тихо.</div></div>';
  view.innerHTML=h;
  view.querySelectorAll('tr[data-id]').forEach(tr=>tr.onclick=()=>show(tr.dataset.id));
}
function card(r){
  view.innerHTML='';
  const hd=document.createElement('div');hd.className='h';hd.textContent='№ '+r.no+' - '+r.title+(r.forged?' · подделка':'');view.appendChild(hd);
  const n=document.createElement('div');n.className='note';n.textContent='Серия '+r.ep+' · REC '+r.rec+' · Морзе '+r.morse+'. Сохранить картинку - кнопкой под ней.';view.appendChild(n);
  const im=document.createElement('img');im.className='card';im.src=r.img;im.alt=r.title;view.appendChild(im);
  // сохранить как настоящий .jpg: «Поделиться» (в галерею или сразу в Telegram) и запасная кнопка «Скачать»
  const fname=r.img.split('/').pop();
  const getFile=async()=>{const res=await fetch(r.img);const blob=new Blob([await res.arrayBuffer()],{type:'image/jpeg'});return new File([blob],fname,{type:'image/jpeg'});};
  const bar=document.createElement('div');bar.style.cssText='display:flex;gap:8px;margin:4px 0 12px';
  const sh=document.createElement('button');sh.className='copy';sh.textContent='Поделиться / сохранить';
  sh.onclick=async()=>{try{const f=await getFile();if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f]});}else{dl.onclick();}}catch(e){if(e&&e.name!=='AbortError')dl.onclick();}};
  const dl=document.createElement('button');dl.className='copy';dl.textContent='Скачать .jpg';
  dl.onclick=async()=>{try{const f=await getFile();const u=URL.createObjectURL(f);const a=document.createElement('a');a.href=u;a.download=fname;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);}catch(e){dl.textContent='Не вышло - долгое нажатие на картинку';}};
  bar.appendChild(sh);bar.appendChild(dl);view.appendChild(bar);
  view.appendChild(field('Подпись к посту ('+r.caption.length+' зн.)',r.caption));
  const t=document.createElement('div');t.className='field';
  t.innerHTML='<div class="label">Текст на карточке</div><div class="val">'+esc(r.sub)+'</div><ul>'+r.facts.map(f=>'<li>'+esc(f)+'</li>').join('')+'</ul><div class="note">Ручкой: '+esc(r.pen)+'</div>';
  view.appendChild(t);
  view.appendChild(field('Что спрятано (только для тебя, не публиковать)',r.arg,'arg'));
}
function show(id){
  [...tabs.children].forEach(b=>b.classList.toggle('on',b.dataset.id===id));
  if(id==='all')overview();else card(DATA.find(r=>r.id===id));
  try{history.replaceState(null,'','#'+id);}catch(e){}
  window.scrollTo(0,0);
}
function addTab(id,label,f){const b=document.createElement('button');b.className='tab'+(f?' f':'');b.dataset.id=id;b.textContent=label;b.onclick=()=>show(id);tabs.appendChild(b);}
addTab('all','Таблица');DATA.forEach(r=>addTab(r.id,r.no+' · '+r.title,r.forged));
const h0=location.hash.slice(1);show(DATA.some(r=>r.id===h0)?h0:'all');
window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(h)show(DATA.some(r=>r.id===h)?h:'all');});
</script>
</body>
</html>
`;
fs.writeFileSync('bestiary-table.html', html);
console.log('bestiary-table.html', html.length);
