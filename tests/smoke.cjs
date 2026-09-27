// Run: NODE_PATH=/path/to/node_modules node tests/smoke.cjs
const { chromium } = require('playwright-core');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const mime = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.ttf':'font/ttf' };
const server = http.createServer((req,res) => {
  const url = new URL(req.url, 'http://localhost');
  const relative = decodeURIComponent(url.pathname).replace(/^\/UNLOCKD\//, '');
  const file = path.resolve(root, relative || 'index.html');
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file,(err,data) => { if(err) res.writeHead(404).end(); else {res.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');res.end(data);} });
});
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1100}});
    const errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:' + server.address().port + '/UNLOCKD/');
    await page.waitForFunction(()=>document.querySelectorAll('.item').length===32);
    await page.evaluate(()=>document.fonts.ready);
    await page.evaluate(()=>MinecraftToast.ready);
    await page.waitForFunction(()=>document.querySelector('#minecraftPreview').getAttribute('aria-label').includes('Алмазы'));
    await page.waitForFunction(()=>[...document.querySelectorAll('.item img')].every(i=>i.complete && i.naturalWidth>0));
    await page.screenshot({path:'/tmp/unlockd-desktop.png',fullPage:true});
    await page.fill('#itemSearch','DIAMOND'); assert.equal(await page.locator('.item').count(),3);
    await page.getByRole('button',{name:'Diamond Sword',exact:true}).click();
    assert.match(await page.locator('#imagePreview').getAttribute('src'),/diamond_sword/);
    await page.fill('#itemSearch','алмаз'); assert.equal(await page.locator('.item').count(),3);
    await page.fill('#itemSearch','zzzz'); assert.equal(await page.locator('.item').count(),0);
    await page.fill('#titleInput','Победа <script>'); assert.equal(await page.locator('#titlePreview').textContent(),'Победа <script>');
    await page.fill('#eyebrowInput','Challenge complete!'); assert.equal(await page.locator('#eyebrow').textContent(),'Challenge complete!');
    await page.fill('#titleInput','Алмазы!');
    await page.fill('#eyebrowInput','Achievement Get!');
    async function download(name,width) {
      const ready=page.waitForEvent('download'); await page.click('#downloadBtn'); const d=await ready;
      const dest='/tmp/unlockd-'+name+'.png'; await d.saveAs(dest);
      const buf=fs.readFileSync(dest); assert.equal(buf.subarray(1,4).toString(),'PNG'); assert.equal(buf.readUInt32BE(16),width); assert.ok(buf.readUInt32BE(20)>=192);
      await page.waitForFunction(()=>!document.querySelector('#downloadBtn').disabled);
      return buf;
    }
    const desktop = await download('export-desktop',960);
    const identicalPixels=await page.evaluate(async data=>{const img=new Image();img.src=data;await img.decode();const c=document.createElement('canvas');c.width=320;c.height=64;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(img,0,0,320,64);const a=ctx.getImageData(0,0,320,64).data,b=document.querySelector('#minecraftPreview').getContext('2d').getImageData(0,0,320,64).data;return a.every((v,i)=>v===b[i]);},'data:image/png;base64,'+desktop.toString('base64'));
    assert.equal(identicalPixels,true,'Preview and PNG have identical pixels');
    assert.equal(desktop.readUInt32BE(20),192);
    const background = await page.evaluate(async data => { const img=new Image(); img.src=data; await img.decode(); const c=document.createElement('canvas'); c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);return [...ctx.getImageData(40,40,1,1).data]; }, 'data:image/png;base64,'+desktop.toString('base64'));
    assert.ok(background[0]<50 && background[0]===background[1] && background[3]===255, 'Export preserves dark toast background');
    await page.setViewportSize({width:375,height:812});
    await page.screenshot({path:'/tmp/unlockd-mobile.png',fullPage:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    const mobile = await download('export-mobile',960); assert.deepEqual(mobile,desktop);
    await page.click('summary');
    await page.setInputFiles('#imageInput',path.join(root,'assets/items/apple.png'));
    await page.waitForFunction(()=>document.querySelector('#selectedName').textContent==='Своя картинка');
    await download('upload',960);
    await page.setInputFiles('#imageInput',{name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
    await page.waitForFunction(()=>document.querySelector('#appStatus').classList.contains('error'));
    await page.click('#clearImageBtn'); assert.match(await page.locator('#imagePreview').getAttribute('src'),/diamond_sword/);
    await page.fill('#emojiInput','🏆'); assert.equal(await page.locator('#emojiPreview').evaluate(e=>!e.hidden),true);
    await page.click('#clearImageBtn');
    await page.selectOption('#platform','steam'); assert.equal(await page.locator('#eyebrow').textContent(),'ACHIEVEMENT UNLOCKED');
    await download('steam',1680);
    await page.selectOption('#platform','minecraft');
    await page.fill('#titleInput','Я'.repeat(60));
    await page.check('#extendedMode');await page.fill('#descriptionInput','Ы'.repeat(140));await page.uncheck('#extendedMode');
    await download('long-text',960);
    await page.check('#extendedMode'); const extended=await download('extended',960); assert.ok(extended.readUInt32BE(20)>192);
    await page.fill('#descriptionInput','');const empty=await download('empty-description',960);assert.equal(empty.readUInt32BE(20),192);
    await page.uncheck('#extendedMode');
    for(const style of ['modern','challenge','classic']) { await page.selectOption('#toastStyle',style); await download(style,960); }
    assert.equal(await page.evaluate(()=>document.querySelector('.achievement-text').scrollWidth<=document.querySelector('.achievement-text').clientWidth),true);
    for (const width of [320,390,768,1024]) { await page.setViewportSize({width,height:900}); assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true); }
    assert.deepEqual(errors,[]);
    await page.route('**/items.json',route=>route.abort()); await page.reload();
    await page.waitForFunction(()=>document.querySelector('#searchStatus').textContent.includes('Каталог недоступен'));
    await download('fallback',960);
    console.log('PASS: 32 icons; EN/RU/empty search; selection; safe live text; font; desktop/mobile identical PNG; upload/reset/invalid upload; emoji; Steam; long text; 320–1440px; catalog failure; no JS errors.');
  } finally { await browser.close(); server.close(); }
})().catch(error=>{ console.error(error); server.close(); process.exitCode=1; });
