// Рендер всех карточек бестиария: node render-all.js [id ...] -> out/cards/NN_id.png
// (сначала скопировать движок: cp -r ../engine .)
const fs = require('fs'), { execFileSync } = require('child_process');
require('./cards.js');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(globalThis.CARDS);
fs.mkdirSync('out/cards', { recursive: true });
for (const id of ids) {
  fs.writeFileSync('card-id.js', `// какую карточку рисовать (рендер всех: node render-all.js)\nglobalThis.CARD_ID = '${id}';\n`);
  execFileSync(process.execPath, ['engine/render.js', 'stills', '2'], { stdio: 'ignore' });
  fs.copyFileSync('out/stills/t_002.00.png', `out/cards/${globalThis.CARDS[id].no}_${id}.png`);
  console.log('card', id);
}
