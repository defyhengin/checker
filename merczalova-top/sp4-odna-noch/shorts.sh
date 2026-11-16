#!/bin/bash
# Shorts 9:16 из глав 2, 3, 4: клип с звуком + концовка с журналом записи; звук гаснет перед концовкой.
set -e
cd "$(dirname "$0")"
export ANIM_FORMAT=9:16
read -r -a W < <(node -e "const S=require('./score');const o=[];for(const c of [1,2,3]){const ch=S.CH[c];o.push((ch.start-0.5).toFixed(2),(ch.end+3.6).toFixed(2),(ch.end+1.4-(ch.start-0.5)).toFixed(2))}console.log(o.join(' '))")
n=2
for i in 0 3 6; do
  a=${W[$i]}; b=${W[$((i+1))]}; f=${W[$((i+2))]}
  node engine/render.js clip $a $b --format 9:16 > out/short$n.log 2>&1
  src=$(ls -t out/clip_*9x16*.mp4 | head -1)
  ffmpeg -v error -y -i "$src" -c:v copy -af "afade=t=out:st=$f:d=0.9" -c:a aac -b:a 192k -movflags +faststart out/odna-noch-short-glava$n.mp4
  rm -f "$src"
  n=$((n+1))
done
echo done > out/shorts.done
