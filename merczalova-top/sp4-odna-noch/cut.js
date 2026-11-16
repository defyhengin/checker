// Нарезает 5 mp3 глав на куски по score.js (паузы между кусками растягиваются в фильме).
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const S = require('./score');
fs.mkdirSync(path.join(__dirname, 'voice/cut'), { recursive: true });
for (const p of S.pieces) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(p.src0), '-t', String(p.src1 - p.src0), '-i', path.join(__dirname, p.src),
    '-af', 'afade=t=in:d=0.02,areverse,afade=t=in:d=0.04,areverse', '-ar', '48000', '-ac', '2', path.join(__dirname, p.file)]);
}
console.log(`cut ${S.pieces.length} pieces`);
