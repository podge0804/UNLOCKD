'use strict';
const $ = id => document.getElementById(id);
const achievement = $('achievement');
const image = $('imagePreview');
let items = [];
let selected = { id: 'diamond', names: { en: 'Diamond', ru: 'Алмаз' }, icon: 'assets/items/diamond.png' };
let source = 'item';
let customURL = null;
let revision = 0;
let exporting = false;
let copying = false;
const defaults = { minecraft: 'Achievement Get!', steam: 'ACHIEVEMENT UNLOCKED' };
const headings = { ...defaults };
let platform = 'minecraft';
let renderRevision = 0;
function minecraftState() {
  return {
    heading:$('eyebrowInput').value,
    title:$('titleInput').value || 'Без названия',
    description:$('descriptionInput').value,
    headingColor:$('headingColor').value,
    titleColor:$('titleColor').value,
    descriptionColor:$('descriptionColor').value,
    icon:image.src,
    custom:source==='upload',
    emoji:source==='emoji'?$('emojiInput').value:''
  };
}
function renderMinecraft() {
  const currentRender = renderRevision + 1;
  renderRevision = currentRender;
  const state=minecraftState();
  MinecraftToast.render(state).then(({canvas,truncated})=>{
    if(currentRender!==renderRevision) return;
    const preview=$('minecraftPreview');preview.width=canvas.width;preview.height=canvas.height;
    preview.getContext('2d').drawImage(canvas,0,0);
    preview.setAttribute('aria-label',state.heading+' '+state.title+(state.description?' '+state.description:''));
    $('toastHint').textContent=truncated?'Длинный текст сокращён многоточием.':'Если описание пустое, оно не показывается.';
    fitPreview();
  }).catch(()=>status('Не удалось отрисовать Minecraft-плашку. Проверь загрузку иконки.',true));
}

function status(message, error = false) {
  $('appStatus').textContent = message;
  $('appStatus').classList.toggle('error', error);
}
function fitPreview() {
  const stage = document.querySelector('.preview-stage');
  const padding = parseFloat(getComputedStyle(stage).paddingLeft) * 2 + 2;
  const target = platform === 'minecraft' ? $('minecraftToast') : achievement;
  const width = platform === 'minecraft' ? $('minecraftPreview').width : target.offsetWidth;
  const height = platform === 'minecraft' ? $('minecraftPreview').height : target.offsetHeight;
  if (platform === 'minecraft') {
    target.style.width = width + 'px';
    target.style.height = height + 'px';
  }
  const scale = Math.max(0, Math.min(platform === 'minecraft' ? 2 : 1, (stage.clientWidth - padding) / width));
  target.style.transformOrigin = 'top left';
  target.style.transform = 'scale(' + scale + ')';
  $('previewSizer').style.width = width * scale + 'px';
  $('previewSizer').style.height = height * scale + 'px';
}
function updatePreview() {
  // The DOM toast is Steam-only. Native hidden attributes also protect mixed CSS caches.
  achievement.hidden = platform === 'minecraft';
  $('minecraftToast').hidden = platform !== 'minecraft';
  $('minecraftOptions').hidden = platform !== 'minecraft';
  $('descriptionInput').disabled = false;
  if (platform === 'minecraft') renderMinecraft();
  $('eyebrow').textContent = $('eyebrowInput').value;
  $('titlePreview').textContent = $('titleInput').value || 'Без названия';
  $('descriptionPreview').textContent = $('descriptionInput').value;
  image.hidden = source === 'emoji';
  $('emojiPreview').hidden = source !== 'emoji';
  $('emojiPreview').textContent = $('emojiInput').value;
  image.classList.toggle('custom', source === 'upload');
  $('selectedName').textContent = source === 'upload' ? 'Своя картинка' : source === 'emoji' ? 'Emoji' : selected.names.en;
  fitPreview();
}
function releaseCustom() {
  if (customURL) URL.revokeObjectURL(customURL);
  customURL = null;
}
function useItem(item = selected) {
  revision++;
  selected = item;
  source = 'item';
  image.src = selected.icon;
  releaseCustom();
  $('imageInput').value = '';
  $('emojiInput').value = '';
  updatePreview();
  markSelection();
}
function markSelection() {
  document.querySelectorAll('.item').forEach(button => {
    button.setAttribute('aria-pressed', String(source === 'item' && button.dataset.id === selected.id));
  });
}
async function drawItemIcon(canvas, src) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  try {
    const img = new Image();
    if (/^https?:\/\//.test(src)) img.crossOrigin = 'anonymous';
    img.src = src;
    await img.decode();
    const scale = Math.max(1, Math.floor(Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight)));
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = Math.floor((canvas.width - w) / 2);
    const y = Math.floor((canvas.height - h) / 2);
    ctx.drawImage(img, x, y, w, h);
  } catch {}
}

function renderItems() {
  const query = $('itemSearch').value.trim().toLocaleLowerCase().replaceAll('_', ' ');
  const matches = items.filter(item => [item.id.replaceAll('_', ' '), ...Object.values(item.names), ...(item.aliases || [])].join(' ').toLocaleLowerCase().includes(query));
  $('itemResults').replaceChildren();
  for (const item of matches) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'item';
    button.dataset.id = item.id;

    // Canvas is intentional here: some Android/Samsung dark-mode engines
    // recolor <img> pixels. Drawing the original texture to canvas preserves
    // the actual Minecraft colors.
    const icon = document.createElement('canvas');
    icon.className = 'item-icon';
    icon.width = icon.height = 32;
    icon.setAttribute('aria-hidden', 'true');
    drawItemIcon(icon, item.icon);

    const name = document.createElement('span');
    name.textContent = item.names.en;
    button.title = item.names.ru || item.names.en;
    button.append(icon, name);
    button.addEventListener('click', () => useItem(item));
    $('itemResults').append(button);
  }
  $('searchStatus').textContent = matches.length ? 'Найдено: ' + matches.length + ' · каталог: ' + items.length : 'Ничего не найдено. Попробуй diamond или sword.';
  markSelection();
}
async function loadItems() {
  try {
    const response = await fetch('items.json');
    if (!response.ok) throw new Error('Catalog unavailable');
    const catalog = await response.json();
    items = catalog.items;
    if (!Array.isArray(items) || !items.length) throw new Error('Invalid catalog');
    renderItems();
  } catch {
    items = [selected];
    renderItems();
    $('searchStatus').textContent = 'Каталог недоступен. Доступен Diamond; попробуй перезагрузить страницу.';
  }
}
['eyebrowInput', 'titleInput', 'descriptionInput'].forEach(id => $(id).addEventListener('input', updatePreview));
$('platform').addEventListener('change', () => {
  headings[platform] = $('eyebrowInput').value;
  platform = $('platform').value;
  $('eyebrowInput').value = headings[platform];
  updatePreview();
});
function bindColorPicker(presetId, colorId) {
  const preset = $(presetId);
  const color = $(colorId);
  preset.addEventListener('change', () => {
    if (preset.value !== 'custom') color.value = preset.value;
    updatePreview();
  });
  color.addEventListener('input', () => {
    preset.value = 'custom';
    updatePreview();
  });
}
bindColorPicker('headingColorPreset','headingColor');
bindColorPicker('titleColorPreset','titleColor');
bindColorPicker('descriptionColorPreset','descriptionColor');
$('itemSearch').addEventListener('input', renderItems);
$('clearImageBtn').addEventListener('click', () => useItem());
$('emojiInput').addEventListener('input', () => {
  revision++;
  source = $('emojiInput').value ? 'emoji' : 'item';
  image.src = selected.icon;
  releaseCustom();
  $('imageInput').value = '';
  updatePreview();
  markSelection();
});
$('imageInput').addEventListener('change', async () => {
  const file = $('imageInput').files[0];
  if (!file) return;
  const token = ++revision;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    status('Выбери PNG, JPG или WebP размером до 5 МБ.', true);
    $('imageInput').value = '';
    return;
  }
  const url = URL.createObjectURL(file);
  try {
    const probe = new Image();
    probe.src = url;
    await probe.decode();
    if (probe.naturalWidth * probe.naturalHeight > 16000000) throw new Error('Image too large');
    if (token !== revision) { URL.revokeObjectURL(url); return; }
    releaseCustom();
    customURL = url;
    image.src = url;
    source = 'upload';
    $('emojiInput').value = '';
    updatePreview();
    markSelection();
    status('Картинка загружена. Она остаётся только в твоём браузере.');
  } catch {
    URL.revokeObjectURL(url);
    if (token !== revision) return;
    $('imageInput').value = '';
    status('Не удалось прочитать картинку. Используй корректное изображение до 16 мегапикселей.', true);
  }
});
image.addEventListener('error', () => status('Не удалось загрузить иконку. Выбери другой предмет или свою картинку.', true));
async function createExportCanvas() {
  const filePlatform = platform;
  const state = filePlatform === 'minecraft' ? minecraftState() : null;
  if (state) {
    const {canvas:original} = await MinecraftToast.render(state);
    const output = document.createElement('canvas');
    output.width = original.width * 3;
    output.height = original.height * 3;
    const ctx = output.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(original, 0, 0, output.width, output.height);
    return { canvas: output, filePlatform };
  }

  await document.fonts.ready;
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:600px;pointer-events:none';
  const snapshot = achievement.cloneNode(true);
  snapshot.style.transform = 'none';
  holder.append(snapshot);
  document.body.append(holder);
  try {
    const snapshotImage = snapshot.querySelector('img');
    if (!snapshotImage.hidden) {
      await snapshotImage.decode();
      const iconCanvas = document.createElement('canvas');
      iconCanvas.width = iconCanvas.height = 168;
      const ctx = iconCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = snapshotImage.classList.contains('custom');
      const ratio = Math.min(168 / snapshotImage.naturalWidth, 168 / snapshotImage.naturalHeight);
      const w = snapshotImage.naturalWidth * ratio, h = snapshotImage.naturalHeight * ratio;
      ctx.drawImage(snapshotImage, (168-w)/2, (168-h)/2, w, h);
      snapshotImage.src = iconCanvas.toDataURL('image/png');
      await snapshotImage.decode();
    }
    const canvas = await html2canvas(snapshot, { scale: 3, backgroundColor: null, logging: false });
    return { canvas, filePlatform };
  } finally {
    holder.remove();
  }
}

$('downloadBtn').addEventListener('click', async () => {
  if (exporting) return;
  exporting = true;
  $('downloadBtn').disabled = true;
  status('Готовим PNG…');
  try {
    const {canvas, filePlatform} = await createExportCanvas();
    await savePNG(canvas, filePlatform);
  } catch {
    status('Не удалось создать PNG. Проверь иконку и попробуй ещё раз.', true);
  } finally {
    exporting = false;
    $('downloadBtn').disabled = false;
  }
});

const touchDevice = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
if (touchDevice) $('copyBtn').textContent = 'Поделиться';

async function sharePNG(blob) {
  if (!navigator.share) return false;
  const file = new File([blob], platform + '-achievement.png', { type: 'image/png' });
  if (navigator.canShare && !navigator.canShare({ files: [file] })) return false;
  await navigator.share({ files: [file], title: 'UNLOCKD' });
  return true;
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = platform + '-achievement.png';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

$('copyBtn').addEventListener('click', async () => {
  if (copying) return;
  copying = true;
  $('copyBtn').disabled = true;
  status(touchDevice ? 'Готовим изображение…' : 'Копируем…');

  try {
    const {canvas} = await createExportCanvas();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Empty export');

    // На телефонах системное меню «Поделиться» надёжнее,
    // чем запись PNG в буфер обмена браузера.
    if (touchDevice) {
      try {
        if (await sharePNG(blob)) {
          status('');
          return;
        }
      } catch (error) {
        if (error?.name === 'AbortError') {
          status('');
          return;
        }
      }
    }

    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        status('Скопировано.');
        return;
      } catch {}
    }

    // Если браузер не умеет копировать PNG, пробуем системный share.
    if (!touchDevice) {
      try {
        if (await sharePNG(blob)) {
          status('');
          return;
        }
      } catch (error) {
        if (error?.name === 'AbortError') {
          status('');
          return;
        }
      }
    }

    // Последний fallback — обычное скачивание.
    downloadBlob(blob);
    status('Скопировать нельзя — PNG скачан.');
  } catch {
    status('Не удалось подготовить изображение.', true);
  } finally {
    copying = false;
    $('copyBtn').disabled = false;
  }
});

async function savePNG(canvas,filePlatform) {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Empty export');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filePlatform + '-achievement.png';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    status('PNG готов: ' + canvas.width + ' × ' + canvas.height + ' px.');
}
new ResizeObserver(fitPreview).observe(document.querySelector('.preview-stage'));
new ResizeObserver(fitPreview).observe(achievement);
new ResizeObserver(fitPreview).observe($('minecraftToast'));
document.fonts.ready.then(fitPreview);
updatePreview();
loadItems();
