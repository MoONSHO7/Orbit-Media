const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const state = { category: 'icons', tint: '#80cfbe', playing: !reducedMotion.matches, speed: 1,
  shape: 'square', contour: 'rounded', radius: 8, aspect: 4, explicit: 'auto', fill: 72,
  corner: 5, family: 'all', query: '', revision: 0, time: 0 };
const descriptions = {
  icons: ['ORBIT-MEDIA', 'A signal that stands out.', 'Animated icon outlines and radial effects for procs, auras and active abilities.'],
  dispels: ['LIBORBITGLOW · INCLUDED BASELINES', 'An outline with a purpose.', 'Tracer and Pin Neon follow the whole frame. Explore corners and proportions with your own contour.'],
  fills: ['ORBIT-MEDIA · SHARED MEDIA', 'Give your bars some depth.', 'Every selected status-bar texture, with its in-game name. Explore the shading at any fill level.'],
};
const images = new Map();
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
  const { variant, shape } = contourFor(entry.def, 60 * state.aspect, 60);
  return { sources: [variant.shapes[shape]], shape, variant };
}

async function prepare(entry) {
  const selected = selection(entry);
  const key = `${selected.sources.join('|')}|${state.tint}`;
  entry.selected = selected;
  entry.card.dataset.shape = selected.shape;
  entry.detail.textContent = entry.kind === 'fills' ? entry.def.family
    : entry.kind === 'dispels' ? `${selected.shape} · ${state.aspect}:1` : entry.def.id;
  if (key === entry.resourceKey) return;
  entry.resourceKey = key;
  entry.layers = null;
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
  if (entry.kind === 'fills') value = entry.def.registeredName;
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
  card.dataset.id = definition.id;
  const preview = document.createElement('div'); preview.className = 'preview';
  const canvas = document.createElement('canvas'); canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `${definition.name} ${kind === 'fills' ? 'status-bar texture' : 'animated glow'} preview`);
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
  $('result-count').textContent = `${count} / ${cards.length} ${state.category === 'fills' ? 'textures' : 'glows'}`;
  $('radius-value').textContent = state.radius;
  $('fill-value').textContent = `${state.fill}%`;
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
  $('search').placeholder = category === 'fills' ? 'Find a texture…' : 'Find a glow…';
  for (const button of document.querySelectorAll('.category')) {
    const selected = button.dataset.category === category;
    button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', selected);
  }
  $('icon-controls').hidden = category !== 'icons'; $('dispel-controls').hidden = category !== 'dispels';
  $('fill-controls').hidden = category !== 'fills'; document.querySelector('.animation-controls').hidden = category === 'fills';
  $('gallery-note').textContent = category === 'dispels'
    ? 'Included with LibOrbitGlow. The contour chooses the closest baked outline; an explicit artwork choice takes priority. Your addon owns its masks.'
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
    const frame = entry.kind === 'fills' ? 0 : Math.floor(state.time / entry.def.duration * entry.def.frames) % entry.def.frames;
    render(entry, frame);
  }
  requestAnimationFrame(tick);
}

async function boot() {
  const response = await fetch('catalog.json');
  if (!response.ok) throw new Error('The artwork catalog could not be loaded. Please reload the gallery.');
  catalog = await response.json();
  for (const category of ['icons', 'dispels', 'fills']) $(`${category}-count`).textContent = catalog[category].length;
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
