#!/bin/bash
# Пересобрать звук в готовых Shorts из нового out/music.wav (картинку не трогаем).
set -e
cd "$(dirname "$0")"
read -r -a W < <(node -e "const S=require('./score');const o=[];for(const c of [1,2,3]){const ch=S.CH[c];const a=Math.ceil((ch.start-0.5)*30-1e-6)/30;o.push(a.toFixed(4),(ch.end+1.4-a).toFixed(2))}console.log(o.join(' '))")
n=2
for i in 0 2 4; do
  a=${W[$i]}; f=${W[$((i+1))]}; v=out/odna-noch-short-glava$n.mp4
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $v)
  ffmpeg -v error -y -i $v -ss $a -t $d -i out/music.wav -map 0:v -map 1:a -c:v copy -af "afade=t=out:st=$f:d=0.9" -c:a aac -b:a 192k -movflags +faststart out/tmp.mp4
  mv out/tmp.mp4 $v
  n=$((n+1))
done
echo shorts ok
