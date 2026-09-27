'use strict';
// Vanilla Java bitmap renderer. Render once; use the same pixels for preview and PNG.
window.MinecraftToast = (() => {
  const load = path => { const image = new Image(); image.src = path; return image.decode().then(() => image); };
  let assets;
  const ready = Promise.all(['achievement_background.png', 'toasts.png', 'ascii.png', 'unicode_page_04.png'].map(name => load('assets/minecraft/' + name))).then(images => {
    assets = images;
    return images;
  });
  const cache = new Map();
  function glyph(character, color) {
    const key = character + color;
    if (cache.has(key)) return cache.get(key);
    let code = character.codePointAt(0), sheet = assets[2], cell = 8;
    if (code >= 0x400 && code <= 0x4ff) { sheet = assets[3]; cell = 16; code -= 0x400; }
    else if (code < 32 || code > 126) code = 63;
    const tile = document.createElement('canvas'); tile.width = tile.height = cell;
    const ctx = tile.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(sheet, code % 16 * cell, Math.floor(code / 16) * cell, cell, cell, 0, 0, cell, cell);
    const pixels = ctx.getImageData(0,0,cell,cell).data;
    let left = cell, right = -1;
    for (let y=0;y<cell;y++) for (let x=0;x<cell;x++) if(pixels[(y*cell+x)*4+3]) { left=Math.min(left,x); right=Math.max(right,x); }
    if (cell===8) left=0;
    const advance = character===' ' ? 8 : right<0 ? 8 : cell===8 ? (right+2)*2 : right-left+2;
    ctx.globalCompositeOperation='source-in'; ctx.fillStyle=color; ctx.fillRect(0,0,cell,cell);
    const result = {tile,left:Math.max(0,left),right,advance,scale:cell===8?2:1};
    cache.set(key,result); return result;
  }
  function width(text) { return [...text].reduce((sum,char)=>sum+glyph(char,'#fff').advance,0); }
  function fit(text, maxWidth) {
    if(width(text)<=maxWidth) return text;
    let result='';
    for (const char of text) { if(width(result+char+'...')>maxWidth) break; result+=char; }
    return result+'...';
  }
  function text(ctx, value, x, y, color) {
    for(const char of value) {
      const g=glyph(char,color);
      if(g.right>=0) {
        const w=g.right-g.left+1;
        ctx.drawImage(g.tile,g.left,0,w,g.tile.height,x,y,w*g.scale,g.tile.height*g.scale);
      }
      x+=g.advance;
    }
  }
  function lines(value, maxWidth) {
    const output=[];
    for(const paragraph of value.split('\n')) {
      let line='';
      for(const char of paragraph) {
        if(width(line+char)>maxWidth) { output.push(line);line=''; }
        line+=char;
      }
      output.push(line);
    }
    return output;
  }
  function frame(ctx, modern, height) {
    const sheet=modern?assets[1]:assets[0], sx=modern?0:96, sy=modern?0:202;
    // Nine-slice the original 160×32 texture without stretching corner pixels.
    const edge=4, xs=[0,edge,160-edge], ws=[edge,160-edge*2,edge];
    const ys=[0,edge,32-edge], hs=[edge,32-edge*2,edge];
    for(let row=0;row<3;row++) for(let col=0;col<3;col++) {
      const dx=col===2?320-edge*2:xs[col]*2, dy=row===2?height-edge*2:ys[row]*2;
      const dw=col===1?320-edge*4:edge*2, dh=row===1?height-edge*4:edge*2;
      ctx.drawImage(sheet,sx+xs[col],sy+ys[row],ws[col],hs[row],dx,dy,dw,dh);
    }
  }
  async function render(state) {
    await ready;
    let icon=null;
    if(!state.emoji) icon=await load(state.icon);
    const extra=state.extended && state.description ? lines(state.description,248) : [];
    const canvas=document.createElement('canvas'); canvas.width=320;canvas.height=64+extra.length*18;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    frame(ctx,state.modern,canvas.height);
    if(icon) {
      const ratio=Math.min(32/icon.naturalWidth,32/icon.naturalHeight),w=icon.naturalWidth*ratio,h=icon.naturalHeight*ratio;
      ctx.imageSmoothingEnabled=state.custom;
      ctx.drawImage(icon,16+(32-w)/2,16+(32-h)/2,w,h);ctx.imageSmoothingEnabled=false;
    } else { ctx.font='28px sans-serif';ctx.textBaseline='top';ctx.fillText(state.emoji,16,14); }
    text(ctx,fit(state.heading,248),60,14,state.challenge?'#ff55ff':'#ffff00');
    text(ctx,fit(state.title || 'Без названия',248),60,36,'#ffffff');
    extra.forEach((line,i)=>text(ctx,line,60,58+i*18,'#aaaaaa'));
    return {canvas,truncated:width(state.heading)>248 || width(state.title)>248};
  }
  return {ready,render};
})();
