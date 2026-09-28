'use strict';
// Vanilla Java bitmap renderer. Render once; use the same pixels for preview and PNG.
window.MinecraftToast = (() => {
  const load = path => { const image = new Image(); image.src = path; return image.decode().then(() => image); };
  let assets;
  const ready = Promise.all([
    load('assets/minecraft/achievement_background.png'),
    load('assets/minecraft/toasts.png'),
    load('assets/minecraft/ascii.png'),
    load('data:image/png;base64,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')
  ]).then(images => {
    assets = images;
    return images;
  });
  const cache = new Map();
  function glyph(character, color) {
    const key = character + color;
    if (cache.has(key)) return cache.get(key);
    let code = character.codePointAt(0), sheet = assets[2], cell = 8, cyrillic = false;
    if (code >= 0x400 && code <= 0x4ff) {
      sheet = assets[3]; cell = 32; code -= 0x400; cyrillic = true;
    } else if (code < 32 || code > 126) code = 63;
    const tile = document.createElement('canvas'); tile.width = tile.height = cell;
    const ctx = tile.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(sheet, code % 16 * cell, Math.floor(code / 16) * cell, cell, cell, 0, 0, cell, cell);
    const pixels = ctx.getImageData(0,0,cell,cell).data;
    let left = cell, right = -1, top = cell, bottom = -1;
    for (let y=0;y<cell;y++) for (let x=0;x<cell;x++) if(pixels[(y*cell+x)*4+3]) {
      left=Math.min(left,x); right=Math.max(right,x); top=Math.min(top,y); bottom=Math.max(bottom,y);
    }
    if (!cyrillic) { left=0; top=0; bottom=cell-1; }
    const advance = character===' ' ? 8 : right<0 ? 8 : cyrillic ? right-left+2 : (right+2)*2;
    ctx.globalCompositeOperation='source-in'; ctx.fillStyle=color; ctx.fillRect(0,0,cell,cell);
    const result = {tile,left:Math.max(0,left),right,top:Math.max(0,top),bottom,advance,scale:cyrillic?1:2,offsetY:cyrillic?top-6:0};
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
        const w=g.right-g.left+1, h=g.bottom-g.top+1;
        ctx.drawImage(g.tile,g.left,g.top,w,h,x,y+g.offsetY,w*g.scale,h*g.scale);
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
    const extra=state.description ? lines(state.description,248) : [];
    const canvas=document.createElement('canvas'); canvas.width=320;canvas.height=64+extra.length*18;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    frame(ctx,false,canvas.height);
    if(icon) {
      const ratio=Math.min(32/icon.naturalWidth,32/icon.naturalHeight),w=icon.naturalWidth*ratio,h=icon.naturalHeight*ratio;
      ctx.imageSmoothingEnabled=state.custom;
      ctx.drawImage(icon,16+(32-w)/2,16+(32-h)/2,w,h);ctx.imageSmoothingEnabled=false;
    } else { ctx.font='28px sans-serif';ctx.textBaseline='top';ctx.fillText(state.emoji,16,14); }
    text(ctx,fit(state.heading,248),60,14,state.headingColor || '#ffff55');
    text(ctx,fit(state.title || 'Без названия',248),60,36,state.titleColor || '#ffffff');
    extra.forEach((line,i)=>text(ctx,line,60,58+i*18,state.descriptionColor || '#aaaaaa'));
    return {canvas,truncated:width(state.heading)>248 || width(state.title)>248};
  }
  return {ready,render};
})();
