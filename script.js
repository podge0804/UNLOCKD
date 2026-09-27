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
const defaults = { minecraft: 'Achievement Get!', steam: 'ACHIEVEMENT UNLOCKED' };
const headings = { ...defaults };
let platform = 'minecraft';

function status(message, error = false) {
  $('appStatus').textContent = message;
  $('appStatus').classList.toggle('error', error);
}
function fitPreview() {
  const stage = document.querySelector('.preview-stage');
  const padding = parseFloat(getComputedStyle(stage).paddingLeft) * 2 + 2;
  const scale = Math.min(1, (stage.clientWidth - padding) / achievement.offsetWidth);
  achievement.style.transform = 'scale(' + scale + ')';
  $('previewSizer').style.width = achievement.offsetWidth * scale + 'px';
  $('previewSizer').style.height = achievement.offsetHeight * scale + 'px';
}
function updatePreview() {
  achievement.className = 'achievement ' + platform;
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
function renderItems() {
  const query = $('itemSearch').value.trim().toLocaleLowerCase().replaceAll('_', ' ');
  const matches = items.filter(item => [item.id.replaceAll('_', ' '), ...Object.values(item.names), ...(item.aliases || [])].join(' ').toLocaleLowerCase().includes(query));
  $('itemResults').replaceChildren();
  for (const item of matches) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'item';
    button.dataset.id = item.id;
    const icon = document.createElement('img');
    icon.src = item.icon;
    icon.alt = '';
    icon.width = icon.height = 28;
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
$('downloadBtn').addEventListener('click', async () => {
  if (exporting) return;
  exporting = true;
  $('downloadBtn').disabled = true;
  status('Готовим PNG…');
  let holder;
  try {
    await document.fonts.ready;
    // Snapshot is independent of responsive preview scaling and subsequent edits.
    holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:600px;pointer-events:none';
    const snapshot = achievement.cloneNode(true);
    const filePlatform = platform;
    snapshot.style.transform = 'none';
    holder.append(snapshot);
    document.body.append(holder);
    const snapshotImage = snapshot.querySelector('img');
    if (!snapshotImage.hidden) {
      await snapshotImage.decode();
      // Bake the icon at export resolution with nearest-neighbor pixels.
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
  } catch {
    status('Не удалось создать PNG. Проверь иконку и попробуй ещё раз.', true);
  } finally {
    holder?.remove();
    exporting = false;
    $('downloadBtn').disabled = false;
  }
});
new ResizeObserver(fitPreview).observe(document.querySelector('.preview-stage'));
new ResizeObserver(fitPreview).observe(achievement);
document.fonts.ready.then(fitPreview);
updatePreview();
loadItems();
