const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const state = { category: 'icons', tint: '#80cfbe', playing: !reducedMotion.matches, speed: 1,
  shape: 'square', contour: 'rounded', radius: 8, aspect: 4, explicit: 'auto', fill: 72,
  corner: 5, family: 'all', borderWidth: 280, borderHeight: 100, borderScale: 100, borderArtwork: 'native',
  query: '', revision: 0, time: 0 };
const descriptions = {
  icons: ['ORBIT-MEDIA', 'Icon glows', 'Animated outlines and radial effects registered with LibOrbitGlow.'],
  dispels: ['LIBORBITGLOW', 'Dispel glows', 'Tracer and Pin Neon, with contour and aspect-ratio controls.'],
  fills: ['ORBIT-MEDIA · LIBSHAREDMEDIA', 'Status-bar textures', 'Grayscale fills registered with LibSharedMedia.'],
  borders: ['ORBIT-MEDIA · LIBSHAREDMEDIA', 'Nine-slice borders', 'Corner size stays fixed when the frame is resized.'],
};
const images = new Map();
const borderStrips = new WeakMap();
const observedCards = new WeakMap();
let catalog, cards = [], toastTimer, priorTime = performance.now();

function error(message) {
  $('load-error').hidden = false;
  $('load-error').textContent = message;
}

function rgb(hex) {
  return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
}

function image(source) {
  if (!images.has(source)) {
    const promise = new Promise((resolve, reject) => {
      const result = new Image();
      result.onload = () => resolve(result);
      result.onerror = () => reject(new Error(`Could not load ${source}. Reload the gallery to try again.`));
      result.src = source;
    });
    images.set(source, promise);
  }
  return images.get(source);
}

function tint(original, color) {
  const canvas = document.createElement('canvas');
  canvas.width = original.width; canvas.height = original.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(original, 0, 0);
  const data = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.data.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) data.data[i + channel] *= color[channel] / 255;
  }
  context.putImageData(data, 0, 0);
  return canvas;
}

function contourFor(definition, width, height) {
  const requestedRatio = Math.log(width) - Math.log(height);
  const variant = definition.variants.reduce((best, candidate) =>
    Math.abs(requestedRatio - Math.log(candidate.ratio)) < Math.abs(requestedRatio - Math.log(best.ratio)) ? candidate : best);
  if (state.explicit !== 'auto') return { variant, shape: state.explicit in variant.shapes ? state.explicit : 'square' };
  if (state.contour === 'square' || state.radius === 0) return { variant, shape: 'square' };
  const target = Math.min(state.radius, Math.min(width, height) / 2) / Math.max(width, height);
  const sourceShort = Math.min(variant.ratio, 1);
  const xScale = sourceShort / variant.ratio * width / Math.max(width, height);
  const yScale = sourceShort * height / Math.max(width, height);
  let selected = 'square', fraction = 0, distance = 2 * target ** 2;
  for (const [name, geometry] of Object.entries(definition.contours)) {
    if (geometry.kind !== state.contour) continue;
    const value = geometry.radiusFraction ?? geometry.cutFraction;
    const candidate = (value * xScale - target) ** 2 + (value * yScale - target) ** 2;
    if (candidate < distance || (candidate === distance && (value > fraction || (value === fraction && name < selected)))) {
      selected = name; fraction = value; distance = candidate;
    }
  }
  return { variant, shape: selected };
}

function selection(entry) {
  if (entry.kind === 'icons') {
    const shape = state.shape in entry.def.shapes ? state.shape : 'square';
    return { sources: entry.def.shapes[shape], shape };
  }
  if (entry.kind === 'fills') return { sources: [entry.def.image], shape: '' };
  if (entry.kind === 'borders') {
    const native = entry.def.nativeImage && state.borderArtwork === 'native';
    return { sources: [native ? entry.def.nativeImage : entry.def.image], shape: native ? 'slice' : 'edge' };
  }
  const { variant, shape } = contourFor(entry.def, 60 * state.aspect, 60);
  return { sources: [variant.shapes[shape]], shape, variant };
}

async function prepare(entry) {
  const selected = selection(entry);
  const key = `${selected.sources.join('|')}|${state.tint}`;
  entry.selected = selected;
  entry.card.dataset.shape = selected.shape;
  entry.detail.textContent = entry.kind === 'fills' ? entry.def.family
    : entry.kind === 'borders' ? `${entry.def.registeredName} · ${selected.shape === 'slice' ? 'Native slice' : 'SharedMedia'}`
    : entry.kind === 'dispels' ? `${selected.shape} · ${state.aspect}:1` : entry.def.id;
  if (key === entry.resourceKey) return;
  entry.resourceKey = key;
  entry.layers = null;
  entry.card.setAttribute('aria-busy', 'true');
  try {
    const originals = await Promise.all(selected.sources.map(image));
    if (entry.resourceKey !== key) return;
    const base = rgb(state.tint);
    entry.layers = originals.map((original, index) => tint(original,
      entry.kind === 'icons' && index === 1 ? base.map(v => 153 + 0.4 * v) : base));
    entry.last = '';
  } catch (problem) {
    if (entry.resourceKey === key) error(problem.message);
  }
}

function outline(context, x, y, width, height, kind, amount) {
  const corner = Math.min(amount, Math.min(width, height) / 2);
  context.beginPath();
  if (kind === 'chamfer' && corner > 0) {
    context.moveTo(x + corner, y); context.lineTo(x + width - corner, y);
    context.lineTo(x + width, y + corner); context.lineTo(x + width, y + height - corner);
    context.lineTo(x + width - corner, y + height); context.lineTo(x + corner, y + height);
    context.lineTo(x, y + height - corner); context.lineTo(x, y + corner); context.closePath();
  } else context.roundRect(x, y, width, height, kind === 'square' ? 0 : corner);
}

function sprite(context, atlas, frame, definition, x, y, width, height) {
  const fw = atlas.width / definition.cols, fh = atlas.height / definition.rows;
  context.drawImage(atlas, frame % definition.cols * fw, Math.floor(frame / definition.cols) * fh,
    fw, fh, x, y, width, height);
}

function slicedBorder(context, atlas, margin, corner, x, y, width, height) {
  const sourceX = [0, margin, atlas.width - margin, atlas.width];
  const sourceY = [0, margin, atlas.height - margin, atlas.height];
  const targetX = [x, x + corner, x + width - corner, x + width];
  const targetY = [y, y + corner, y + height - corner, y + height];
  for (let row = 0; row < 3; row++) for (let column = 0; column < 3; column++) {
    context.drawImage(atlas, sourceX[column], sourceY[row],
      sourceX[column + 1] - sourceX[column], sourceY[row + 1] - sourceY[row],
      targetX[column], targetY[row], targetX[column + 1] - targetX[column], targetY[row + 1] - targetY[row]);
  }
}

function edgeBorder(context, atlas, edge, x, y, width, height) {
  // Backdrop.lua: L/R/T/B/TL/TR/BL/BR, with 1/16-cell guards and vertically repeated edge UVs.
  const cell = atlas.width / 8, guard = cell / 16, inner = cell - 2 * guard;
  if (!borderStrips.has(atlas)) {
    borderStrips.set(atlas, Array.from({length: 4}, (_, index) => {
      const column = document.createElement('canvas'); column.width = inner; column.height = atlas.height;
      column.getContext('2d').drawImage(atlas, index * cell + guard, 0, inner, atlas.height, 0, 0, inner, atlas.height);
      return column;
    }));
  }
  for (let corner = 0; corner < 4; corner++) {
    context.drawImage(atlas, (corner + 4) * cell + guard, guard, inner, inner,
      x + (corner % 2 ? width - edge : 0), y + (corner > 1 ? height - edge : 0), edge, edge);
  }
  const strip = (index, length, left, top, horizontal) => {
    if (length <= 0) return;
    const start = atlas.height / 16;
    const span = (length / edge - 1 / 8) * atlas.height;
    context.save(); context.translate(left, top);
    if (horizontal) context.rotate(Math.PI / 2);
    const pattern = context.createPattern(borderStrips.get(atlas)[index], 'repeat-y');
    pattern.setTransform(new DOMMatrix([edge / inner, 0, 0, length / span, 0, -start * length / span]));
    context.fillStyle = pattern; context.fillRect(0, 0, edge, length);
    context.restore();
  };
  strip(0, height - 2 * edge, x, y + edge, false);
  strip(1, height - 2 * edge, x + width - edge, y + edge, false);
  strip(2, width - 2 * edge, x + width - edge, y, true);
  strip(3, width - 2 * edge, x + width - edge, y + height - edge, true);
}

function render(entry, frame) {
  const logicalWidth = entry.preview.clientWidth, logicalHeight = entry.preview.clientHeight;
  if (!logicalWidth || !logicalHeight) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(logicalWidth * ratio), height = Math.round(logicalHeight * ratio);
  const key = `${frame}|${state.revision}|${width}|${height}|${Boolean(entry.layers)}`;
  if (key === entry.last) return;
  entry.last = key;
  entry.canvas.width = width; entry.canvas.height = height;
  const context = entry.context;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, logicalWidth, logicalHeight);
  if (entry.kind === 'icons') {
    const side = Math.min(logicalWidth, logicalHeight) * 0.58;
    const x = (logicalWidth - side) / 2, y = (logicalHeight - side) / 2;
    const corner = { square: 0, soft: .125, softer: .25, round: .35 }[state.shape] * side;
    outline(context, x, y, side, side, 'rounded', corner);
    const surface = context.createLinearGradient(0, y, 0, y + side);
    surface.addColorStop(0, '#273234'); surface.addColorStop(1, '#151e23');
    context.fillStyle = surface; context.fill();
    context.strokeStyle = '#7d938129'; context.lineWidth = 1; context.stroke();
    const effect = side * 1.35;
    if (entry.layers) {
      sprite(context, entry.layers[0], frame, entry.def, (logicalWidth - effect) / 2, (logicalHeight - effect) / 2, effect, effect);
      context.globalCompositeOperation = 'lighter';
      sprite(context, entry.layers[1], frame, entry.def, (logicalWidth - effect) / 2, (logicalHeight - effect) / 2, effect, effect);
    }
  } else if (entry.kind === 'borders') {
    const fit = Math.min(1, (logicalWidth - 36) / 360, (logicalHeight - 36) / 160);
    const frameWidth = state.borderWidth * fit, frameHeight = state.borderHeight * fit;
    const x = (logicalWidth - frameWidth) / 2, y = (logicalHeight - frameHeight) / 2;
    const edge = entry.def.cornerSize * state.borderScale / 100 * fit;
    if (entry.layers) {
      if (entry.selected.shape === 'slice') {
        slicedBorder(context, entry.layers[0], entry.def.sliceMargin, edge, x, y, frameWidth, frameHeight);
      } else edgeBorder(context, entry.layers[0], edge, x, y, frameWidth, frameHeight);
    }
    context.fillStyle = '#8b969e'; context.font = '10px Consolas, monospace';
    context.textAlign = 'center'; context.textBaseline = 'middle';
    if (frameWidth > 95) context.fillText(`${state.borderWidth} × ${state.borderHeight}`, logicalWidth / 2, logicalHeight / 2);
  } else {
    const baseWidth = entry.kind === 'dispels' ? 60 * state.aspect : 280;
    const baseHeight = entry.kind === 'dispels' ? 60 : 34;
    const fit = Math.min((logicalWidth - 52) / baseWidth, (logicalHeight - 44) / baseHeight);
    const barWidth = baseWidth * fit, barHeight = baseHeight * fit;
    const x = (logicalWidth - barWidth) / 2, y = (logicalHeight - barHeight) / 2;
    let kind = 'rounded', corner = state.corner;
    if (entry.kind === 'dispels') {
      const geometry = entry.def.contours[entry.selected.shape];
      kind = geometry?.kind || 'square';
      corner = (geometry?.radiusFraction ?? geometry?.cutFraction ?? 0) * baseHeight;
    }
    outline(context, x, y, barWidth, barHeight, kind, corner * fit);
    context.fillStyle = '#202a30'; context.fill();
    context.save(); context.clip();
    if (entry.kind === 'fills' && entry.layers) {
      context.beginPath(); context.rect(x, y, barWidth * state.fill / 100, barHeight); context.clip();
      context.drawImage(entry.layers[0], x, y, barWidth, barHeight);
    } else if (entry.kind === 'dispels') {
      context.fillStyle = '#688f842d'; context.fillRect(x, y, barWidth * .72, barHeight);
      context.fillStyle = '#e3ede49c'; context.font = `${Math.max(10, 11 * fit)}px "Segoe UI", sans-serif`;
      context.fillText('Dispel', x + 12 * fit, y + barHeight / 2 + 4 * fit);
    }
    context.restore();
    if (entry.kind === 'dispels' && entry.layers) {
      const overhang = entry.def.overhang;
      const dimensions = [x - barWidth * overhang, y - barHeight * overhang,
        barWidth * (1 + overhang * 2), barHeight * (1 + overhang * 2)];
      sprite(context, entry.layers[0], frame, entry.def, ...dimensions);
      context.globalCompositeOperation = 'lighter'; context.globalAlpha = entry.def.coreAlpha;
      sprite(context, entry.layers[0], frame, entry.def, ...dimensions);
    }
  }
  context.globalCompositeOperation = 'source-over'; context.globalAlpha = 1;
  if (entry.layers) entry.card.setAttribute('aria-busy', 'false');
}

const observer = new IntersectionObserver((entries) => {
  for (const observation of entries) {
    const entry = observedCards.get(observation.target);
    if (!entry || !entry.card.isConnected) continue;
    entry.visible = observation.isIntersecting;
    if (entry.visible && !entry.card.hidden) prepare(entry);
    if (!entry.visible) { entry.layers = null; entry.resourceKey = ''; }
  }
}, { rootMargin: '100px' });

function notify(message) {
  clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2300);
}

async function copy(entry) {
  let value;
  if (entry.kind === 'fills' || entry.kind === 'borders') value = entry.def.registeredName;
  else if (entry.kind === 'icons') value = entry.def.id;
  else {
    const contour = state.contour === 'square' ? '{ kind = "square" }'
      : `{ kind = "${state.contour}", ${state.contour === 'rounded' ? 'radius' : 'cut'} = ${state.radius} }`;
    const geometry = state.explicit === 'auto' ? `contour = ${contour}` : `shape = "${state.explicit}"`;
    value = `lib.StatusBar:Show(frame, { glow = "${entry.def.id}", width = ${60 * state.aspect}, height = 60, ${geometry} })`;
  }
  try { await navigator.clipboard.writeText(value); notify(entry.kind === 'dispels' ? 'Example copied' : 'In-game name copied'); }
  catch { notify(`Copy: ${value}`); }
}

function createCard(definition, kind) {
  const card = document.createElement('article'); card.className = 'art-card';
  card.setAttribute('aria-busy', 'true');
  card.dataset.id = definition.id;
  const preview = document.createElement('div'); preview.className = 'preview';
  const canvas = document.createElement('canvas'); canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `${definition.name} ${kind === 'borders' ? 'nine-slice border' : kind === 'fills' ? 'status-bar texture' : 'animated glow'} preview`);
  preview.append(canvas);
  const meta = document.createElement('div'); meta.className = 'card-meta';
  const title = document.createElement('h3'); title.className = 'card-name'; title.textContent = definition.name;
  const detail = document.createElement('span'); detail.className = 'card-detail';
  title.append(detail);
  const button = document.createElement('button'); button.className = 'copy'; button.textContent = '⧉';
  button.setAttribute('aria-label', `Copy ${definition.name} ${kind === 'dispels' ? 'usage example' : 'in-game name'}`);
  meta.append(title, button); card.append(preview, meta);
  const entry = { def: definition, kind, card, preview, canvas, detail, context: canvas.getContext('2d'),
    visible: false, last: '', resourceKey: '', layers: null };
  observedCards.set(card, entry);
  button.addEventListener('click', () => copy(entry));
  return entry;
}

function refresh() {
  state.revision++;
  let count = 0;
  for (const entry of cards) {
    const name = `${entry.def.name} ${entry.def.id} ${entry.def.family || ''}`.toLowerCase();
    entry.card.hidden = !name.includes(state.query) ||
      (entry.kind === 'fills' && state.family !== 'all' && entry.def.family !== state.family);
    if (!entry.card.hidden) {
      count++;
      if (entry.visible) prepare(entry);
    }
  }
  $('empty').hidden = count !== 0;
  $('result-count').textContent = `${count} / ${cards.length} ${state.category === 'borders' ? 'borders' : state.category === 'fills' ? 'textures' : 'glows'}`;
  $('radius-value').textContent = state.radius;
  $('fill-value').textContent = `${state.fill}%`;
  $('border-width-value').textContent = state.borderWidth;
  $('border-height-value').textContent = state.borderHeight;
  $('border-scale-value').textContent = `${state.borderScale}%`;
  $('radius').disabled = state.contour === 'square' || state.explicit !== 'auto';
  $('contour').disabled = state.explicit !== 'auto';
  for (const button of document.querySelectorAll('.swatch')) {
    const selected = button.dataset.tint === state.tint;
    button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', selected);
  }
}

function changeCategory(category, updateHash = true) {
  if (!Object.hasOwn(descriptions, category)) return;
  observer.disconnect();
  state.category = category; state.query = ''; $('search').value = '';
  const details = descriptions[category];
  $('source-label').textContent = details[0]; $('gallery-title').textContent = details[1]; $('description').textContent = details[2];
  $('search').placeholder = category === 'borders' ? 'Find a border…' : category === 'fills' ? 'Find a texture…' : 'Find a glow…';
  for (const button of document.querySelectorAll('.category')) {
    const selected = button.dataset.category === category;
    button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', selected);
  }
  $('icon-controls').hidden = category !== 'icons'; $('dispel-controls').hidden = category !== 'dispels';
  $('fill-controls').hidden = category !== 'fills'; $('border-controls').hidden = category !== 'borders';
  document.querySelector('.animation-controls').hidden = category === 'fills' || category === 'borders';
  $('gallery-note').textContent = category === 'dispels'
    ? 'Included with LibOrbitGlow. The contour chooses the closest baked outline; an explicit artwork choice takes priority. Your addon owns its masks.'
    : category === 'borders'
      ? 'Corners stay fixed as the frame grows. SharedMedia edges repeat; native slice edges stretch. White shows the original artwork. Your addon owns padding and masks.'
      : 'Previewed from the current artwork. Color and blending may look slightly different in-game.';
  cards = catalog[category].map(definition => createCard(definition, category));
  $('cards').className = `grid ${category}`; $('cards').replaceChildren(...cards.map(entry => entry.card));
  for (const entry of cards) observer.observe(entry.card);
  if (updateHash) history.replaceState(null, '', `#${category}`);
  refresh();
}

function setPlaying(playing) {
  state.playing = playing; $('play').textContent = playing ? 'Pause motion' : 'Play motion';
  $('play').setAttribute('aria-pressed', playing);
}

function tick(now) {
  const elapsed = Math.min((now - priorTime) / 1000, .1); priorTime = now;
  if (state.playing && !document.hidden) state.time += elapsed * state.speed;
  for (const entry of cards) {
    if (!entry.visible || entry.card.hidden || document.hidden) continue;
    const frame = entry.kind === 'fills' || entry.kind === 'borders' ? 0 : Math.floor(state.time / entry.def.duration * entry.def.frames) % entry.def.frames;
    render(entry, frame);
  }
  requestAnimationFrame(tick);
}

async function boot() {
  const response = await fetch('catalog.json');
  if (!response.ok) throw new Error('The artwork catalog could not be loaded. Please reload the gallery.');
  catalog = await response.json();
  for (const category of ['icons', 'dispels', 'fills', 'borders']) $(`${category}-count`).textContent = catalog[category].length;
  for (const family of [...new Set(catalog.fills.map(fill => fill.family))]) {
    const option = document.createElement('option'); option.value = family; option.textContent = family; $('family').append(option);
  }
  for (const button of document.querySelectorAll('.category')) button.addEventListener('click', () => changeCategory(button.dataset.category));
  for (const button of document.querySelectorAll('.swatch')) button.addEventListener('click', () => {
    state.tint = button.dataset.tint; $('tint').value = state.tint; refresh();
  });
  for (const [id, key, cast] of [
    ['tint', 'tint', String], ['speed', 'speed', Number], ['icon-shape', 'shape', String],
    ['contour', 'contour', String], ['radius', 'radius', Number], ['aspect', 'aspect', Number],
    ['dispel-shape', 'explicit', String], ['fill', 'fill', Number], ['fill-corner', 'corner', Number], ['family', 'family', String],
    ['border-width', 'borderWidth', Number], ['border-height', 'borderHeight', Number],
    ['border-scale', 'borderScale', Number], ['border-artwork', 'borderArtwork', String],
  ]) $(id).addEventListener('input', event => { state[key] = cast(event.target.value); refresh(); });
  $('search').addEventListener('input', event => { state.query = event.target.value.trim().toLowerCase(); refresh(); });
  $('play').addEventListener('click', () => setPlaying(!state.playing));
  reducedMotion.addEventListener('change', event => setPlaying(!event.matches));
  window.addEventListener('hashchange', () => changeCategory(location.hash.slice(1), false));
  setPlaying(state.playing);
  changeCategory(Object.hasOwn(descriptions, location.hash.slice(1)) ? location.hash.slice(1) : 'icons', false);
  requestAnimationFrame(tick);
}

boot().catch(problem => error(problem.message));
