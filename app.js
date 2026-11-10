'use strict';
/* Rotulê — etiquetas adesivas para impressora térmica 58 mm via Web Bluetooth (ESC/POS) */

const DPMM = 8;            // 203 dpi ≈ 8 pontos por mm
const PAPER = 384;         // 48 mm úteis em papel de 58 mm
const GAP_X = 10, GAP_Y = 12, TOP = 6;

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

/* ------------------------------------------------------------------ dados */
const SHAPES = [
  ['pill', 'Pílula'], ['rounded', 'Retângulo'], ['ellipse', 'Oval'], ['tag', 'Etiqueta'], ['ticket', 'Ticket'],
  ['scallop', 'Ondulada'], ['hexagon', 'Hexágono'], ['octagon', 'Octógono'], ['ribbon', 'Faixa'], ['shield', 'Brasão'],
  ['cloud', 'Nuvem'],
];
const ICONS = [
  ['none', 'Nenhum'],
  // mágicos
  ['raio', 'Raio'], ['varinha', 'Varinha'], ['chapeu', 'Chapéu'], ['estrela', 'Estrela'], ['lua', 'Lua'],
  ['coruja', 'Coruja'], ['livro', 'Livro'], ['pocao', 'Poção'], ['caldeirao', 'Caldeirão'], ['nuvem', 'Nuvem'],
  // flores e plantas
  ['flor', 'Flor'], ['margarida', 'Margarida'], ['tulipa', 'Tulipa'], ['girassol', 'Girassol'], ['cacto', 'Cacto'],
  ['broto', 'Broto'], ['vaso', 'Vaso'], ['ramo', 'Ramo'], ['folha', 'Folha'],
  // temperos e comida
  ['alho', 'Alho'], ['cebola', 'Cebola'], ['tomate', 'Tomate'], ['cenoura', 'Cenoura'], ['limao', 'Limão'],
  ['pimentao', 'Pimentão'], ['pimenta', 'Pimenta'], ['cogumelo', 'Cogumelo'], ['milho', 'Milho'], ['trigo', 'Trigo'],
  ['cafe', 'Café'], ['canela', 'Canela'], ['anis', 'Anis'], ['saleiro', 'Sal'], ['colher', 'Colher'],
  // outros
  ['coracao', 'Coração'], ['sol', 'Sol'], ['borboleta', 'Borboleta'],
];
const FONTS = {
  sans:   'Roboto, "Segoe UI", Arial, sans-serif',
  serif:  '"Noto Serif", Georgia, "Times New Roman", serif',
  mono:   '"Roboto Mono", "Courier New", monospace',
  script: '"Brush Script MT", "Segoe Script", cursive',
  magic:  '"Cinzel Decorative", Georgia, serif',
  medieval: '"MedievalSharp", Georgia, serif',
};
const PRESETS = {
  'Temperos': ['Cebolinha','Salsinha','Pimenta','Tomilho','Alecrim','Açafrão','Curry','Cominho','Cravo','Colorau','Orégano','Louro','Erva-doce','Coentro','Pimenta-do-reino','Manjericão','Hortelã','Gengibre','Canela','Noz-moscada','Páprica','Alho em pó','Cebola em pó','Sal','Sal grosso','Pimenta calabresa','Cúrcuma','Cardamomo','Anis-estrelado','Sálvia','Estragão','Tempero baiano','Chimichurri','Lemon pepper','Gergelim','Linhaça','Chia','Mostarda','Hortelã-pimenta','Cheiro-verde'],
  'Mantimentos': ['Arroz','Feijão','Açúcar','Açúcar mascavo','Açúcar refinado','Farinha de trigo','Farinha de mandioca','Fubá','Macarrão','Café','Chá','Aveia','Amido de milho','Fermento','Bicarbonato','Lentilha','Grão-de-bico','Milho de pipoca','Granola','Leite em pó','Achocolatado','Cacau em pó','Castanhas','Amendoim','Uva-passa','Coco ralado','Tapioca','Polvilho','Farinha de rosca','Sagu','Canjica','Ervilha'],
  'Despensa': ['Biscoitos','Cereais','Doces','Salgadinhos','Lanches','Bebidas','Molhos','Enlatados','Conservas','Óleos','Azeite','Vinagre','Temperos prontos','Congelados','Sobras','Frutas','Legumes','Pães','Massas','Sopas','Sobremesas','Marmitas'],
  'Magia': ['Poção','Elixir','Pó mágico','Chá de bruxa','Olho de lagarto','Asa de morcego','Pelo de gato','Sapo seco','Pena de coruja','Raiz de mandrágora','Escama de dragão','Lágrima de fênix','Pó de fada','Feitiço'],
  'Casa': ['Cozinha','Banheiro','Lavanderia','Quarto','Sala','Garagem','Ferramentas','Documentos','Chaves','Pilhas','Remédios','Brinquedos','Material escolar','Costura','Eletrônicos','Cabos','Parafusos','Pregos'],
};
const CATS = ['Temperos', 'Mantimentos', 'Despensa', 'Magia', 'Casa', 'Meus'];

const DEFAULTS = { shape:'pill', style:'solid', orn:'floreio', icon:'none', iconPos:'left', font:'sans', upper:true, bold:true, wmm:46, hmm:18, feed:3, ff:false, chunk:100, delay:15 };
let S = Object.assign({}, DEFAULTS, store.get('rotule.settings', {}));
let queue = store.get('rotule.queue', []);
let mine  = store.get('rotule.mine', []);
let category = 'Temperos';
const selected = new Set();
let selQty = 1;

/* --------------------------------------------------------- desenho: formas */
function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Nuvem = união de círculos (bolas no topo, tampas nas pontas) + retângulo de base reta.
function cloudPoints(x, y, w, h) {
  const circles = [], rb = h * 0.27;
  circles.push({ cx: x + rb, cy: y + h - rb, r: rb }, { cx: x + w - rb, cy: y + h - rb, r: rb });
  const a = x + rb * 1.5, b = x + w - rb * 1.5, n = Math.max(2, Math.round((b - a) / (h * 0.42)) + 1);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), k = Math.sin(Math.PI * t);
    const r = h * (0.25 + 0.2 * k), top = y + h * (0.02 + 0.17 * (1 - k));
    circles.push({ cx: a + t * (b - a), cy: top + r, r });
  }
  const rect = { x: x + rb, y: y + h * 0.5, w: w - 2 * rb, h: h * 0.5 };
  const e = h * 0.004;   // tolerância proporcional (funciona também em desenhos em escala 0..1)
  const inC = (px, py, skip) => circles.some((c, i) => i !== skip && Math.hypot(px - c.cx, py - c.cy) < c.r - e);
  const inR = (px, py) => px > rect.x + e && px < rect.x + rect.w - e && py > rect.y + e && py < rect.y + rect.h - e;
  const pts = [];
  circles.forEach((c, i) => {
    for (let k = 0; k < 160; k++) {
      const an = k / 160 * Math.PI * 2, px = c.cx + c.r * Math.cos(an), py = c.cy + c.r * Math.sin(an);
      if (!inC(px, py, i) && !inR(px, py)) pts.push([px, py]);
    }
  });
  for (let k = 0; k <= 80; k++) {
    const px = rect.x + rect.w * k / 80;
    [rect.y, rect.y + rect.h].forEach(py => { if (!inC(px, py, -1)) pts.push([px, py]); });
  }
  const cx = x + w / 2, cy = y + h * 0.62;
  pts.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx));
  return pts;
}

function shapePath(ctx, shape, r) {
  const { x, y, w, h } = r;
  ctx.beginPath();
  switch (shape) {
    case 'pill': rr(ctx, x, y, w, h, h / 2); break;
    case 'rounded': rr(ctx, x, y, w, h, Math.min(h * 0.22, w / 4)); break;
    case 'ellipse': ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); break;
    case 'tag': {
      const k = h * 0.42, rad = h * 0.12;
      ctx.moveTo(x + k, y);
      ctx.lineTo(x + w - rad, y); ctx.arcTo(x + w, y, x + w, y + rad, rad);
      ctx.lineTo(x + w, y + h - rad); ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
      ctx.lineTo(x + k, y + h); ctx.lineTo(x, y + h / 2); ctx.closePath();
      break;
    }
    case 'ticket': {
      const nr = Math.max(4, h * 0.14), my = y + h / 2;
      ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, my - nr);
      ctx.arc(x + w, my, nr, -Math.PI / 2, Math.PI / 2, true);
      ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, my + nr);
      ctx.arc(x, my, nr, Math.PI / 2, -Math.PI / 2, true);
      ctx.closePath();
      break;
    }
    case 'scallop': {
      const D = Math.max(8, h * 0.2), a = D / 2 + 1;
      const nx = Math.max(2, Math.round((w - 2 * a) / D)), dx = (w - 2 * a) / nx;
      const ny = Math.max(1, Math.round((h - 2 * a) / D)), dy = (h - 2 * a) / ny;
      ctx.moveTo(x + a, y + a);
      for (let i = 0; i < nx; i++) ctx.arc(x + a + (i + .5) * dx, y + a, dx / 2, Math.PI, 2 * Math.PI);
      for (let j = 0; j < ny; j++) ctx.arc(x + w - a, y + a + (j + .5) * dy, dy / 2, -Math.PI / 2, Math.PI / 2);
      for (let i = 0; i < nx; i++) ctx.arc(x + w - a - (i + .5) * dx, y + h - a, dx / 2, 0, Math.PI);
      for (let j = 0; j < ny; j++) ctx.arc(x + a, y + h - a - (j + .5) * dy, dy / 2, Math.PI / 2, Math.PI * 1.5);
      ctx.closePath();
      break;
    }
    case 'hexagon': {
      const k = Math.min(h * 0.5, w * 0.22);
      ctx.moveTo(x, y + h / 2); ctx.lineTo(x + k, y); ctx.lineTo(x + w - k, y);
      ctx.lineTo(x + w, y + h / 2); ctx.lineTo(x + w - k, y + h); ctx.lineTo(x + k, y + h); ctx.closePath();
      break;
    }
    case 'octagon': {
      const c = Math.min(h * 0.3, w * 0.15);
      ctx.moveTo(x + c, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h - c);
      ctx.lineTo(x + w - c, y + h); ctx.lineTo(x + c, y + h); ctx.lineTo(x, y + h - c); ctx.lineTo(x, y + c); ctx.closePath();
      break;
    }
    case 'ribbon': {
      const n = Math.min(h * 0.3, w * 0.1);
      ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - n, y + h / 2);
      ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x + n, y + h / 2); ctx.closePath();
      break;
    }
    case 'shield': {
      ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h * 0.55);
      ctx.quadraticCurveTo(x + w, y + h, x + w / 2, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h * 0.55); ctx.closePath();
      break;
    }
    case 'cloud': {
      const pts = cloudPoints(x, y, w, h);
      pts.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1]));
      ctx.closePath();
      break;
    }
    default: rr(ctx, x, y, w, h, h / 2);
  }
}

function innerRect(shape, r, extra) {
  const { x, y, w, h } = r;
  let px = 0, py = h * 0.06, pb = py, pl = null;
  switch (shape) {
    case 'pill': px = h * 0.32; break;
    case 'rounded': px = h * 0.12; break;
    case 'ellipse': px = w * 0.13; py = pb = h * 0.12; break;
    case 'tag': px = h * 0.1; pl = h * 0.78; break;
    case 'ticket': px = h * 0.3; break;
    case 'scallop': px = py = pb = Math.max(8, h * 0.2) / 2 + 6; break;
    case 'hexagon': px = Math.min(h * 0.5, w * 0.22) * 0.85; break;
    case 'octagon': px = Math.min(h * 0.3, w * 0.15) * 1.1; break;
    case 'ribbon': px = Math.min(h * 0.3, w * 0.1) * 1.4; break;
    case 'shield': px = w * 0.1; pb = h * 0.2; break;
    case 'cloud': px = Math.max(h * 0.34, w * 0.08); py = h * 0.3; pb = h * 0.1; break;
  }
  const left = pl !== null ? pl : px, e = extra || 0;
  return { x: x + left + e, y: y + py + e, w: w - left - px - 2 * e, h: h - py - pb - 2 * e };
}

/* -------------------------------------------------------- desenho: enfeites */
function star(ctx, cx, cy, R) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? R * 0.42 : R, a = -Math.PI / 2 + i * Math.PI / 5;
    ctx[i ? 'lineTo' : 'moveTo'](cx + rad * Math.cos(a), cy + rad * Math.sin(a));
  }
  ctx.closePath(); ctx.fill();
}
function leaf(ctx, len, wid) {
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -wid, len, 0);
  ctx.quadraticCurveTo(len * 0.5, wid, 0, 0);
  ctx.fill();
}
function ornament(ctx, kind, cx, cy, wd, hh, color, flip) {
  ctx.save(); ctx.translate(cx, cy); if (flip) ctx.scale(1, -1);
  ctx.strokeStyle = ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.6, hh * 0.1); ctx.lineCap = 'round'; ctx.setLineDash([]);
  const half = wd / 2;
  const diamond = (s) => { ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0); ctx.closePath(); ctx.fill(); };
  if (kind === 'floreio') {
    for (const sg of [1, -1]) {
      ctx.save(); ctx.scale(sg, 1);
      ctx.beginPath(); ctx.moveTo(hh * 0.5, 0);
      ctx.bezierCurveTo(half * 0.25, -hh * 0.9, half * 0.45, hh * 0.9, half * 0.62, 0);
      ctx.bezierCurveTo(half * 0.78, -hh * 0.55, half * 0.95, -hh * 0.1, half * 0.9, hh * 0.35);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(half * 0.86, hh * 0.4, hh * 0.13, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    diamond(hh * 0.3);
  } else if (kind === 'folhas') {
    ctx.beginPath(); ctx.moveTo(-half * 0.55, 0); ctx.lineTo(half * 0.55, 0); ctx.stroke();
    for (const i of [-2, -1, 1, 2]) {
      ctx.save(); ctx.translate(i * half * 0.2, 0);
      ctx.rotate(i > 0 ? -0.75 : Math.PI + 0.75);
      leaf(ctx, hh * 1.05, hh * 0.32); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, hh * 0.2, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'estrelas') {
    ctx.beginPath(); ctx.moveTo(-half, 0); ctx.lineTo(-wd * 0.2, 0); ctx.moveTo(wd * 0.2, 0); ctx.lineTo(half, 0); ctx.stroke();
    star(ctx, 0, 0, hh * 0.62); star(ctx, -wd * 0.11, 0, hh * 0.4); star(ctx, wd * 0.11, 0, hh * 0.4);
  } else if (kind === 'pontos') {
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.arc(i * wd / 11, 0, Math.max(1.4, hh * (0.2 - Math.abs(i) * 0.03)), 0, Math.PI * 2); ctx.fill(); }
  } else if (kind === 'nuvens') {
    [[-0.3, 0.8], [0, 1.15], [0.3, 0.8]].forEach(([off, k]) => {
      const cw = hh * 2.1 * k, ch = cw * 0.6;
      shapePath(ctx, 'cloud', { x: off * wd - cw / 2, y: -ch / 2, w: cw, h: ch }); ctx.fill();
    });
  } else if (kind === 'faiscas') {
    [[-0.34, 0.34], [-0.17, 0.6], [0.17, 0.6], [0.34, 0.34]].forEach(([off, k]) => star(ctx, off * wd, 0, hh * k));
    star(ctx, 0, 0, hh * 0.85);
    [-0.46, -0.25, 0.25, 0.46].forEach(off => { ctx.beginPath(); ctx.arc(off * wd, 0, Math.max(1.2, hh * 0.1), 0, Math.PI * 2); ctx.fill(); });
  } else if (kind === 'linha') {
    ctx.beginPath(); ctx.moveTo(-half, 0); ctx.lineTo(-hh * 0.6, 0); ctx.moveTo(hh * 0.6, 0); ctx.lineTo(half, 0); ctx.stroke();
    diamond(hh * 0.34);
  }
  ctx.restore();
}

/* --------------------------------------------------- desenho: figurinhas */
// Desenhos simples numa caixa de 1×1 centrada em (cx, cy). fg = cor do traço, bg = cor do fundo.
function drawIcon(ctx, key, cx, cy, s, fg, bg) {
  if (!key || key === 'none') return;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.fillStyle = ctx.strokeStyle = fg; ctx.lineWidth = 0.08; ctx.lineCap = ctx.lineJoin = 'round'; ctx.setLineDash([]);
  const circ = (x, y, r, c) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = c || fg; ctx.fill(); ctx.fillStyle = fg; };
  const poly = (pts, c) => { ctx.beginPath(); pts.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.closePath(); ctx.fillStyle = c || fg; ctx.fill(); ctx.fillStyle = fg; };
  switch (key) {
    case 'raio': poly([[0.12, -0.5], [-0.3, 0.06], [-0.03, 0.06], [-0.13, 0.5], [0.3, -0.12], [0.04, -0.12]]); break;
    case 'estrela': star(ctx, 0, 0.03, 0.52); break;
    case 'lua':
      ctx.beginPath(); ctx.moveTo(0.14, -0.47); ctx.bezierCurveTo(-0.55, -0.42, -0.55, 0.42, 0.14, 0.47);
      ctx.bezierCurveTo(-0.22, 0.3, -0.22, -0.3, 0.14, -0.47); ctx.fill();
      star(ctx, 0.3, -0.18, 0.13); break;
    case 'varinha':
      ctx.lineWidth = 0.1; ctx.beginPath(); ctx.moveTo(-0.42, 0.42); ctx.lineTo(0.22, -0.22); ctx.stroke();
      ctx.lineWidth = 0.17; ctx.beginPath(); ctx.moveTo(-0.44, 0.44); ctx.lineTo(-0.26, 0.26); ctx.stroke();
      star(ctx, 0.36, -0.36, 0.17); circ(0.16, -0.46, 0.04); circ(0.46, -0.14, 0.04); circ(0.1, -0.2, 0.0); break;
    case 'chapeu':
      ctx.beginPath(); ctx.moveTo(-0.28, 0.3); ctx.lineTo(-0.04, -0.5); ctx.quadraticCurveTo(0.36, -0.36, 0.28, 0.3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 0.34, 0.5, 0.11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = bg; ctx.fillRect(-0.3, 0.12, 0.6, 0.07); ctx.fillStyle = fg; break;
    case 'coruja':
      ctx.beginPath(); ctx.ellipse(0, 0.08, 0.32, 0.4, 0, 0, Math.PI * 2); ctx.fill();
      poly([[-0.3, -0.18], [-0.26, -0.48], [-0.06, -0.3]]); poly([[0.3, -0.18], [0.26, -0.48], [0.06, -0.3]]);
      circ(-0.13, -0.1, 0.12, bg); circ(0.13, -0.1, 0.12, bg); circ(-0.13, -0.1, 0.05); circ(0.13, -0.1, 0.05);
      poly([[-0.05, 0.0], [0.05, 0.0], [0, 0.1]], bg);
      ctx.strokeStyle = bg; ctx.lineWidth = 0.05;
      [[-0.12, 0.22], [0, 0.22], [0.12, 0.22], [-0.06, 0.32], [0.06, 0.32]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 0.05, 0, Math.PI); ctx.stroke(); });
      break;
    case 'livro':
      poly([[-0.5, -0.28], [-0.03, -0.18], [-0.03, 0.4], [-0.5, 0.3]]); poly([[0.5, -0.28], [0.03, -0.18], [0.03, 0.4], [0.5, 0.3]]);
      ctx.strokeStyle = bg; ctx.lineWidth = 0.04;
      [-0.05, 0.05, 0.15].forEach(d => { ctx.beginPath(); ctx.moveTo(-0.4, d - 0.06); ctx.lineTo(-0.12, d + 0.02); ctx.moveTo(0.4, d - 0.06); ctx.lineTo(0.12, d + 0.02); ctx.stroke(); }); break;
    case 'pocao':
      ctx.fillRect(-0.1, -0.46, 0.2, 0.3); ctx.fillRect(-0.14, -0.5, 0.28, 0.08);
      circ(0, 0.16, 0.3); circ(0.1, 0.08, 0.06, bg); circ(-0.08, 0.24, 0.045, bg); circ(0.06, 0.28, 0.03, bg); break;
    case 'caldeirao':
      ctx.beginPath(); ctx.ellipse(0, -0.12, 0.4, 0.52, 0, 0, Math.PI); ctx.fill();
      ctx.fillRect(-0.46, -0.2, 0.92, 0.1);
      ctx.lineWidth = 0.09; ctx.beginPath(); ctx.moveTo(-0.22, 0.34); ctx.lineTo(-0.28, 0.48); ctx.moveTo(0.22, 0.34); ctx.lineTo(0.28, 0.48); ctx.stroke();
      circ(-0.12, -0.38, 0.07); circ(0.1, -0.44, 0.055); circ(0.0, -0.3, 0.04); break;
    case 'nuvem': shapePath(ctx, 'cloud', { x: -0.5, y: -0.3, w: 1, h: 0.6 }); ctx.fill(); break;
    case 'folha':
      ctx.save(); ctx.rotate(-Math.PI / 4); ctx.translate(-0.3, 0); leaf(ctx, 0.85, 0.34);
      ctx.strokeStyle = bg; ctx.lineWidth = 0.035; ctx.beginPath(); ctx.moveTo(0.04, 0); ctx.lineTo(0.7, 0); ctx.stroke(); ctx.restore();
      ctx.lineWidth = 0.07; ctx.beginPath(); ctx.moveTo(-0.3, 0.3); ctx.lineTo(-0.42, 0.46); ctx.stroke(); break;
    case 'pimenta': {
      // corpo = faixa que afina ao longo de uma curva (cabo no alto à esquerda, ponta embaixo à direita)
      const P0 = [-0.26, -0.2], P1 = [0.34, -0.3], P2 = [0.36, 0.46], L = [], R = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24, u = 1 - t;
        const px = u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0], py = u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1];
        const dx = 2 * u * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), dy = 2 * u * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
        const n = Math.hypot(dx, dy), hw = 0.17 * Math.pow(1 - t, 0.75) + 0.005;
        L.push([px - dy / n * hw, py + dx / n * hw]); R.push([px + dy / n * hw, py - dx / n * hw]);
      }
      poly(L.concat(R.reverse()));
      ctx.lineWidth = 0.075; ctx.beginPath(); ctx.moveTo(-0.28, -0.2); ctx.quadraticCurveTo(-0.34, -0.36, -0.2, -0.46); ctx.stroke();
      ctx.strokeStyle = bg; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(-0.17, -0.3); ctx.lineTo(-0.2, -0.1); ctx.stroke();
      break;
    }
    case 'colher':
      ctx.save(); ctx.rotate(-Math.PI / 5);
      ctx.beginPath(); ctx.ellipse(0, -0.26, 0.17, 0.23, 0, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 0.09; ctx.beginPath(); ctx.moveTo(0, -0.04); ctx.lineTo(0, 0.48); ctx.stroke(); ctx.restore(); break;
    case 'trigo':
      ctx.lineWidth = 0.06; ctx.beginPath(); ctx.moveTo(0, 0.5); ctx.lineTo(0, -0.28); ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const y = -0.22 + i * 0.17;
        [-1, 1].forEach(sg => { ctx.save(); ctx.translate(sg * 0.1, y); ctx.rotate(sg * 0.6); ctx.beginPath(); ctx.ellipse(0, 0, 0.06, 0.13, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
      }
      ctx.beginPath(); ctx.ellipse(0, -0.4, 0.06, 0.12, 0, 0, Math.PI * 2); ctx.fill(); break;
    case 'coracao':
      ctx.beginPath(); ctx.moveTo(0, 0.44); ctx.bezierCurveTo(-0.66, 0.0, -0.4, -0.52, 0, -0.18);
      ctx.bezierCurveTo(0.4, -0.52, 0.66, 0.0, 0, 0.44); ctx.fill(); break;
    case 'flor':
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; circ(Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0.19); }
      circ(0, 0, 0.14, bg); circ(0, 0, 0.07); break;
    case 'margarida':
      for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * Math.PI / 6); ctx.translate(0, -0.33); ctx.beginPath(); ctx.ellipse(0, 0, 0.06, 0.17, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      circ(0, 0, 0.17); circ(0, 0, 0.08, bg); break;
    case 'tulipa':
      ctx.lineWidth = 0.07; ctx.beginPath(); ctx.moveTo(0, 0.12); ctx.lineTo(0, 0.5); ctx.stroke();
      ctx.save(); ctx.translate(0, 0.45); ctx.rotate(-1.0); leaf(ctx, 0.4, 0.1); ctx.restore();
      ctx.save(); ctx.translate(0, 0.45); ctx.rotate(Math.PI + 1.0); leaf(ctx, 0.4, 0.1); ctx.restore();
      ctx.beginPath(); ctx.moveTo(-0.26, -0.36); ctx.lineTo(-0.13, -0.2); ctx.lineTo(0, -0.38); ctx.lineTo(0.13, -0.2); ctx.lineTo(0.26, -0.36);
      ctx.bezierCurveTo(0.34, -0.02, 0.16, 0.16, 0, 0.16); ctx.bezierCurveTo(-0.16, 0.16, -0.34, -0.02, -0.26, -0.36); ctx.fill(); break;
    case 'girassol':
      for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * Math.PI / 6); ctx.translate(0, -0.36); ctx.beginPath(); ctx.ellipse(0, 0, 0.075, 0.14, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      circ(0, 0, 0.25); ctx.strokeStyle = bg; ctx.lineWidth = 0.035; ctx.beginPath(); ctx.arc(0, 0, 0.15, 0, Math.PI * 2); ctx.stroke(); circ(0, 0, 0.05, bg); break;
    case 'cacto':
      ctx.lineWidth = 0.26; ctx.beginPath(); ctx.moveTo(0, -0.33); ctx.lineTo(0, 0.4); ctx.stroke();
      ctx.lineWidth = 0.13; ctx.beginPath(); ctx.moveTo(-0.05, 0.12); ctx.lineTo(-0.28, 0.12); ctx.lineTo(-0.28, -0.12); ctx.moveTo(0.05, 0.22); ctx.lineTo(0.28, 0.22); ctx.lineTo(0.28, -0.02); ctx.stroke();
      ctx.lineWidth = 0.03; ctx.strokeStyle = bg; ctx.beginPath(); ctx.moveTo(0, -0.3); ctx.lineTo(0, 0.36); ctx.stroke(); break;
    case 'broto':
      ctx.lineWidth = 0.07; ctx.beginPath(); ctx.moveTo(0, 0.45); ctx.lineTo(0, 0.0); ctx.stroke();
      ctx.save(); ctx.translate(0, 0.02); ctx.rotate(-0.7); leaf(ctx, 0.5, 0.17); ctx.restore();
      ctx.save(); ctx.translate(0, 0.1); ctx.rotate(Math.PI + 0.7); leaf(ctx, 0.46, 0.16); ctx.restore();
      ctx.beginPath(); ctx.ellipse(0, 0.47, 0.26, 0.05, 0, 0, Math.PI * 2); ctx.fill(); break;
    case 'vaso':
      poly([[-0.24, 0.1], [0.24, 0.1], [0.17, 0.48], [-0.17, 0.48]]); ctx.fillRect(-0.3, 0.02, 0.6, 0.1);
      ctx.lineWidth = 0.06; ctx.beginPath(); ctx.moveTo(0, 0.02); ctx.lineTo(0, -0.22); ctx.stroke();
      ctx.save(); ctx.translate(0, -0.12); ctx.rotate(-0.8); leaf(ctx, 0.42, 0.15); ctx.restore();
      ctx.save(); ctx.translate(0, -0.12); ctx.rotate(Math.PI + 0.8); leaf(ctx, 0.42, 0.15); ctx.restore();
      ctx.save(); ctx.translate(0, -0.2); ctx.rotate(-Math.PI / 2); leaf(ctx, 0.3, 0.1); ctx.restore(); break;
    case 'ramo': {
      const ang = Math.atan2(-0.9, 0.6);
      ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(-0.3, 0.45); ctx.lineTo(0.3, -0.45); ctx.stroke();
      for (let i = 1; i <= 5; i++) {
        const t = i / 6, bx = -0.3 + 0.6 * t, by = 0.45 - 0.9 * t;
        [-0.9, 0.9].forEach(d => { ctx.save(); ctx.translate(bx, by); ctx.rotate(ang + d); leaf(ctx, 0.24, 0.05); ctx.restore(); });
      }
      ctx.save(); ctx.translate(0.3, -0.45); ctx.rotate(ang); leaf(ctx, 0.1, 0.04); ctx.restore(); break;
    }
    case 'alho': case 'cebola': {
      const big = key === 'cebola';
      ctx.beginPath(); ctx.moveTo(0, -0.47);
      ctx.bezierCurveTo(0.06, -0.32, big ? 0.5 : 0.46, -0.16, big ? 0.42 : 0.38, 0.14);
      ctx.bezierCurveTo(big ? 0.38 : 0.34, 0.5, big ? -0.38 : -0.34, 0.5, big ? -0.42 : -0.38, 0.14);
      ctx.bezierCurveTo(big ? -0.5 : -0.46, -0.16, -0.06, -0.32, 0, -0.47); ctx.fill();
      ctx.strokeStyle = bg; ctx.lineWidth = 0.035;
      [-1, 1].forEach(sg => { ctx.beginPath(); ctx.moveTo(0, -0.3); ctx.quadraticCurveTo(sg * (big ? 0.34 : 0.26), 0.05, sg * 0.05, 0.43); ctx.stroke(); });
      if (big) {
        ctx.beginPath(); ctx.moveTo(0, -0.3); ctx.lineTo(0, 0.43); ctx.stroke();
        ctx.strokeStyle = fg; ctx.lineWidth = 0.035;
        ctx.beginPath(); ctx.moveTo(-0.07, 0.5); ctx.lineTo(-0.1, 0.57); ctx.moveTo(0, 0.5); ctx.lineTo(0, 0.58); ctx.moveTo(0.07, 0.5); ctx.lineTo(0.1, 0.57); ctx.stroke();
      }
      break;
    }
    case 'tomate':
      ctx.beginPath(); ctx.ellipse(0, 0.08, 0.42, 0.35, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = bg; star(ctx, 0, -0.1, 0.2); ctx.fillStyle = fg;
      ctx.lineWidth = 0.06; ctx.beginPath(); ctx.moveTo(0, -0.12); ctx.lineTo(0.03, -0.42); ctx.stroke(); break;
    case 'cenoura':
      ctx.save(); ctx.rotate(0.65);
      ctx.beginPath(); ctx.moveTo(-0.15, -0.14); ctx.lineTo(0.15, -0.14); ctx.lineTo(0, 0.52); ctx.closePath(); ctx.fill(); ctx.lineWidth = 0.06; ctx.stroke();
      ctx.strokeStyle = bg; ctx.lineWidth = 0.035;
      [[-0.07, 0.0, 0.0], [0.0, 0.14, 0.09], [-0.03, 0.27, 0.04]].forEach(([a, y, b]) => { ctx.beginPath(); ctx.moveTo(-0.12 + (y * 0.2), y); ctx.lineTo(-0.02 + (y * 0.2), y); ctx.stroke(); });
      ctx.restore();
      [-0.5, -0.1, 0.3].forEach(d => { ctx.save(); ctx.translate(-0.03, -0.22); ctx.rotate(-Math.PI / 2 + d); leaf(ctx, 0.3, 0.07); ctx.restore(); }); break;
    case 'limao':
      circ(0, 0, 0.44); ctx.strokeStyle = bg; ctx.lineWidth = 0.04; ctx.beginPath(); ctx.arc(0, 0, 0.35, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 0.06, Math.sin(a) * 0.06); ctx.lineTo(Math.cos(a) * 0.33, Math.sin(a) * 0.33); ctx.stroke(); } break;
    case 'pimentao':
      ctx.beginPath(); ctx.ellipse(-0.17, 0.1, 0.19, 0.33, 0, 0, Math.PI * 2); ctx.ellipse(0.17, 0.1, 0.19, 0.33, 0, 0, Math.PI * 2); ctx.ellipse(0, 0.14, 0.2, 0.34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 0.09; ctx.beginPath(); ctx.moveTo(0, -0.16); ctx.lineTo(0.05, -0.42); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, -0.17, 0.15, 0.05, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = bg; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(-0.09, -0.08); ctx.quadraticCurveTo(-0.1, 0.2, -0.03, 0.43); ctx.moveTo(0.09, -0.08); ctx.quadraticCurveTo(0.1, 0.2, 0.03, 0.43); ctx.stroke(); break;
    case 'cogumelo':
      ctx.beginPath(); ctx.ellipse(0, 0.02, 0.47, 0.42, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
      ctx.fillRect(-0.14, 0.0, 0.28, 0.42); ctx.beginPath(); ctx.ellipse(0, 0.42, 0.14, 0.04, 0, 0, Math.PI * 2); ctx.fill();
      circ(-0.2, -0.12, 0.06, bg); circ(0.04, -0.26, 0.07, bg); circ(0.26, -0.08, 0.05, bg); break;
    case 'milho':
      ctx.save(); ctx.rotate(0.35); ctx.beginPath(); ctx.ellipse(0, -0.04, 0.17, 0.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = bg; ctx.lineWidth = 0.03;
      [-0.06, 0.06].forEach(x => { ctx.beginPath(); ctx.moveTo(x, -0.38); ctx.lineTo(x, 0.3); ctx.stroke(); });
      [-0.24, -0.1, 0.04, 0.18].forEach(y => { ctx.beginPath(); ctx.moveTo(-0.15, y); ctx.lineTo(0.15, y); ctx.stroke(); });
      ctx.restore();
      ctx.save(); ctx.translate(-0.02, 0.28); ctx.rotate(-2.2); leaf(ctx, 0.5, 0.11); ctx.restore();
      ctx.save(); ctx.translate(-0.02, 0.28); ctx.rotate(-0.95); leaf(ctx, 0.5, 0.11); ctx.restore(); break;
    case 'cafe':
      ctx.save(); ctx.rotate(0.5); ctx.beginPath(); ctx.ellipse(0, 0, 0.3, 0.44, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = bg; ctx.lineWidth = 0.06; ctx.beginPath(); ctx.moveTo(0, -0.4); ctx.bezierCurveTo(0.24, -0.14, -0.24, 0.14, 0, 0.4); ctx.stroke(); ctx.restore(); break;
    case 'canela':
      ctx.lineWidth = 0.18; ctx.beginPath(); ctx.moveTo(-0.4, 0.14); ctx.lineTo(0.2, -0.42); ctx.moveTo(-0.2, 0.42); ctx.lineTo(0.4, -0.18); ctx.stroke();
      circ(0.2, -0.42, 0.075, bg); circ(0.2, -0.42, 0.03); circ(0.4, -0.18, 0.075, bg); circ(0.4, -0.18, 0.03); break;
    case 'anis':
      for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i * Math.PI / 4); poly([[0, 0], [0.1, -0.2], [0, -0.48], [-0.1, -0.2]]); ctx.restore(); }
      circ(0, 0, 0.12, bg); circ(0, 0, 0.06); break;
    case 'saleiro':
      ctx.beginPath(); ctx.ellipse(0, -0.16, 0.25, 0.3, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
      poly([[-0.26, -0.12], [0.26, -0.12], [0.32, 0.48], [-0.32, 0.48]]);
      ctx.fillStyle = bg; ctx.fillRect(-0.34, -0.17, 0.68, 0.04);
      [[-0.09, -0.34], [0.09, -0.34], [0, -0.26]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 0.035, 0, Math.PI * 2); ctx.fill(); }); ctx.fillStyle = fg; break;
    case 'borboleta':
      [-1, 1].forEach(sg => {
        ctx.save(); ctx.scale(sg, 1);
        ctx.save(); ctx.translate(0.27, -0.14); ctx.rotate(-0.5); ctx.beginPath(); ctx.ellipse(0, 0, 0.18, 0.29, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.save(); ctx.translate(0.2, 0.22); ctx.rotate(0.45); ctx.beginPath(); ctx.ellipse(0, 0, 0.12, 0.19, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        circ(0.29, -0.17, 0.05, bg); circ(0.2, 0.22, 0.035, bg);
        ctx.restore();
      });
      ctx.strokeStyle = bg; ctx.lineWidth = 0.14; ctx.beginPath(); ctx.moveTo(0, -0.26); ctx.lineTo(0, 0.34); ctx.stroke();
      ctx.strokeStyle = fg; ctx.lineWidth = 0.07; ctx.beginPath(); ctx.moveTo(0, -0.26); ctx.lineTo(0, 0.34); ctx.stroke();
      ctx.lineWidth = 0.035; ctx.beginPath(); ctx.moveTo(0, -0.26); ctx.lineTo(-0.1, -0.46); ctx.moveTo(0, -0.26); ctx.lineTo(0.1, -0.46); ctx.stroke(); break;
    case 'sol':
      circ(0, 0, 0.2);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 0.3, Math.sin(a) * 0.3); ctx.lineTo(Math.cos(a) * 0.48, Math.sin(a) * 0.48); ctx.stroke(); }
      break;
  }
  ctx.restore();
}

/* ------------------------------------------------------------ desenho: texto */
function fitLines(ctx, text, maxW, maxH, family, weight) {
  const measure = (lines, size) => { ctx.font = `${weight} ${size}px ${family}`; return Math.max(...lines.map(l => ctx.measureText(l).width)); };
  const sizeFor = (lines) => {
    const w100 = measure(lines, 100);
    return Math.max(6, Math.min(maxH / (lines.length * 1.1), 100 * maxW / (w100 || 1)));
  };
  let best = { lines: [text], size: sizeFor([text]) };
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    let split = null, diff = Infinity;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
      ctx.font = `${weight} 100px ${family}`;
      const d = Math.abs(ctx.measureText(a).width - ctx.measureText(b).width);
      if (d < diff) { diff = d; split = [a, b]; }
    }
    const s2 = sizeFor(split);
    if (s2 > best.size * 1.25) best = { lines: split, size: s2 };
  }
  return best;
}

function drawLabel(ctx, x, y, w, h, item, o) {
  ctx.save(); ctx.translate(x, y);
  const m = 2, r = { x: m, y: m, w: w - 2 * m, h: h - 2 * m };
  const solid = o.style === 'solid', fg = solid ? '#fff' : '#000';
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.setLineDash([]);
  let extra = 0;

  if (solid) { shapePath(ctx, o.shape, r); ctx.fillStyle = '#000'; ctx.fill(); }
  else if (o.style === 'outline') { shapePath(ctx, o.shape, r); ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.stroke(); }
  else if (o.style === 'double') {
    ctx.strokeStyle = '#000';
    shapePath(ctx, o.shape, r); ctx.lineWidth = 3; ctx.stroke();
    const r2 = { x: r.x + 6, y: r.y + 6, w: r.w - 12, h: r.h - 12 };
    shapePath(ctx, o.shape, r2); ctx.lineWidth = 1.6; ctx.stroke(); extra = 7;
  } else { // dashed
    shapePath(ctx, o.shape, r); ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.setLineDash([9, 6]); ctx.stroke(); ctx.setLineDash([]);
  }

  if (o.shape === 'tag') {
    ctx.beginPath(); ctx.arc(r.x + r.h * 0.5, r.y + r.h / 2, r.h * 0.09, 0, Math.PI * 2);
    if (solid) { ctx.fillStyle = '#fff'; ctx.fill(); } else { ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke(); }
  }

  let ir = innerRect(o.shape, r, extra);
  const iconKey = o.icon || 'none';
  if (iconKey !== 'none' && ir.w >= 70) {
    const both = o.iconPos === 'both';
    const sz = Math.min(ir.h * 0.88, ir.w * (both ? 0.2 : 0.24)), gap = sz * 0.18;
    const cy = ir.y + ir.h / 2;
    drawIcon(ctx, iconKey, ir.x + sz / 2, cy, sz, fg, solid ? '#000' : '#fff');
    if (both) drawIcon(ctx, iconKey, ir.x + ir.w - sz / 2, cy, sz, fg, solid ? '#000' : '#fff');
    ir = { x: ir.x + sz + gap, y: ir.y, w: ir.w - (sz + gap) * (both ? 2 : 1), h: ir.h };
  }
  let ty = ir.y, th = ir.h;
  if (o.orn !== 'none' && ir.h >= 44) {
    const oh = Math.min(ir.h * 0.17, 18), ow = Math.min(ir.w * 0.62, oh * 10);
    ornament(ctx, o.orn, ir.x + ir.w / 2, ir.y + oh * 0.7, ow, oh, fg, false);
    ornament(ctx, o.orn, ir.x + ir.w / 2, ir.y + ir.h - oh * 0.7, ow, oh, fg, true);
    ty = ir.y + oh * 1.5; th = ir.h - oh * 3;
  }

  const family = FONTS[o.font] || FONTS.sans, weight = o.bold ? '700' : '400';
  let main = (item.text || '').trim(), sub = (item.sub || '').trim();
  if (o.upper) { main = main.toUpperCase(); sub = sub.toUpperCase(); }
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  const mainH = sub ? th * 0.68 : th, subH = sub ? th * 0.27 : 0;
  if (main) {
    const f = fitLines(ctx, main, ir.w, mainH, family, weight);
    ctx.font = `${weight} ${f.size}px ${family}`;
    const lh = f.size * 1.1, cy = ty + mainH / 2 - (sub ? th * 0.02 : 0);
    f.lines.forEach((ln, i) => ctx.fillText(ln, ir.x + ir.w / 2, cy + (i - (f.lines.length - 1) / 2) * lh));
  }
  if (sub) {
    const f2 = fitLines(ctx, sub, ir.w, subH, family, '400');
    ctx.font = `400 ${Math.min(f2.size, mainH * 0.5)}px ${family}`;
    ctx.fillText(f2.lines[0], ir.x + ir.w / 2, ty + th - subH / 2);
  }
  ctx.restore();
}

function lookOf(src) { return { shape: src.shape, style: src.style, orn: src.orn, icon: src.icon || 'none', iconPos: src.iconPos || 'left', font: src.font, upper: src.upper, bold: src.bold }; }
function dims() { return { w: Math.min(PAPER, Math.round(S.wmm * DPMM)), h: Math.round(S.hmm * DPMM) }; }

function renderLabelCanvas(cv, item, look) {
  const { w, h } = dims();
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  drawLabel(ctx, 0, 0, w, h, item, look || lookOf(S));
}

/* ----------------------------------------------------------- folha p/ imprimir */
function buildSheet(items) {
  const { w, h } = dims();
  const cols = Math.max(1, Math.floor((PAPER + GAP_X) / (w + GAP_X)));
  const flat = [];
  items.forEach(it => { for (let i = 0; i < it.qty; i++) flat.push(it); });
  const rows = Math.ceil(flat.length / cols);
  const cv = document.createElement('canvas');
  cv.width = PAPER; cv.height = Math.max(8, TOP + rows * (h + GAP_Y));
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
  const rowW = cols * w + (cols - 1) * GAP_X, x0 = Math.floor((PAPER - rowW) / 2);
  flat.forEach((it, i) => {
    const c = i % cols, rIdx = Math.floor(i / cols);
    drawLabel(ctx, x0 + c * (w + GAP_X), TOP + rIdx * (h + GAP_Y), w, h, it, it.look || lookOf(S));
  });
  return { canvas: cv, count: flat.length, cols, rows };
}

/* ----------------------------------------------------------------- ESC/POS */
function canvasToEscpos(cv) {
  const W = cv.width, H = cv.height, wb = W / 8, BAND = 96;
  const px = cv.getContext('2d').getImageData(0, 0, W, H).data;
  const parts = [Uint8Array.from([0x1B, 0x40])];                       // ESC @ (reset)
  for (let y0 = 0; y0 < H; y0 += BAND) {
    const bh = Math.min(BAND, H - y0);
    const buf = new Uint8Array(8 + wb * bh);
    buf.set([0x1D, 0x76, 0x30, 0x00, wb & 255, wb >> 8, bh & 255, bh >> 8]);   // GS v 0
    let p = 8;
    for (let y = 0; y < bh; y++) {
      for (let xb = 0; xb < wb; xb++) {
        let b = 0;
        for (let k = 0; k < 8; k++) {
          const i = ((y0 + y) * W + xb * 8 + k) * 4;
          const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
          if (lum < 128) b |= 0x80 >> k;
        }
        buf[p++] = b;
      }
    }
    parts.push(buf);
  }
  if (S.feed > 0) parts.push(Uint8Array.from([0x1B, 0x64, S.feed]));  // ESC d n
  if (S.ff) parts.push(Uint8Array.from([0x0C]));                      // FF
  const total = parts.reduce((a, b) => a + b.length, 0), out = new Uint8Array(total);
  let o = 0; parts.forEach(b => { out.set(b, o); o += b.length; });
  return out;
}

/* --------------------------------------------------------------- Bluetooth */
const BT_SERVICES = [0xFFE0, 0xFF00, 0xFFF0, 0xFEE7, 0xAE30, 0xAF30, 0x18F0, 0xFFB0, 0x1101,
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', '49535343-fe7d-4ae5-8fa9-9fafd205e455', '0000ff00-0000-1000-8000-00805f9b34fb'];
const BT = { device: null, char: null, name: '' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function setBtUi(state, detail) {
  const dot = $('#btDot');
  dot.className = 'dot' + (state === 'on' ? ' on' : state === 'busy' ? ' busy' : '');
  $('#btLabel').textContent = state === 'on' ? (BT.name || 'Conectada') : state === 'busy' ? 'Conectando…' : 'Conectar';
  $('#btDetail').textContent = detail || (state === 'on' ? `Conectada a “${BT.name}”.` : 'Nenhuma impressora conectada.');
}

function onDisconnected() { BT.char = null; setBtUi('off', 'Impressora desconectada.'); }

async function attach(device) {
  BT.device = device; BT.name = device.name || 'Impressora';
  device.removeEventListener('gattserverdisconnected', onDisconnected);
  device.addEventListener('gattserverdisconnected', onDisconnected);
  const server = await device.gatt.connect();
  const services = await server.getPrimaryServices();
  let withoutResp = null, withResp = null;
  for (const sv of services) {
    if (/^0000180[01]-/.test(sv.uuid)) continue;
    let chars = [];
    try { chars = await sv.getCharacteristics(); } catch { continue; }
    for (const c of chars) {
      if (c.properties.writeWithoutResponse && !withoutResp) withoutResp = c;
      else if (c.properties.write && !withResp) withResp = c;
    }
  }
  BT.char = withoutResp || withResp;
  if (!BT.char) { try { device.gatt.disconnect(); } catch {} throw new Error('Não achei um canal de escrita nessa impressora. Ela pode ser só Bluetooth clássico (sem BLE).'); }
  setBtUi('on');
}

async function btConnect() {
  if (!navigator.bluetooth) throw new Error('Este navegador não tem Web Bluetooth. Use o Chrome no Android ou no computador.');
  setBtUi('busy');
  try {
    const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: BT_SERVICES });
    await attach(device);
  } catch (e) { setBtUi(BT.char ? 'on' : 'off'); throw e; }
}

async function btEnsure() {
  if (BT.char && BT.device && BT.device.gatt.connected) return;
  if (BT.device) {
    try { setBtUi('busy'); await attach(BT.device); return; } catch { /* cai para o seletor */ }
  }
  await btConnect();
}

async function btSend(bytes, onProgress) {
  const c = BT.char; if (!c) throw new Error('Impressora não conectada.');
  let chunk = S.chunk, off = 0;
  const fast = !!c.properties.writeWithoutResponse;
  while (off < bytes.length) {
    const piece = bytes.subarray(off, off + chunk);
    try { await (fast ? c.writeValueWithoutResponse(piece) : c.writeValue(piece)); }
    catch (e) {
      if (chunk > 20) { chunk = 20; await sleep(120); continue; }
      throw e;
    }
    off += piece.length;
    if (onProgress) onProgress(off / bytes.length);
    if (S.delay) await sleep(S.delay);
  }
}

/* --------------------------------------------------------------------- UI */
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400);
}
function saveSettings() { store.set('rotule.settings', S); }
function saveQueue() { store.set('rotule.queue', queue); updateBadge(); }
function updateBadge() {
  const n = queue.reduce((a, b) => a + b.qty, 0), el = $('#queueBadge');
  el.hidden = n === 0; el.textContent = n;
}
const uid = () => Math.random().toString(36).slice(2, 9);

function addToQueue(text, sub, qty) {
  text = (text || '').trim(); if (!text) return false;
  const ex = queue.find(q => q.text === text && (q.sub || '') === (sub || '') && JSON.stringify(q.look) === JSON.stringify(lookOf(S)));
  if (ex) ex.qty += qty; else queue.push({ id: uid(), text, sub: sub || '', qty, look: lookOf(S) });
  saveQueue(); return true;
}

function setTab(name) {
  $$('.tab').forEach(t => t.classList.toggle('active', t.id === 'tab-' + name));
  $$('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  $('#selBar').hidden = !(name === 'criar' && selected.size);
  if (name === 'fila') renderQueue();
  window.scrollTo({ top: 0 });
}

function syncControls() {
  $$('#shapes button').forEach(b => b.classList.toggle('on', b.dataset.v === S.shape));
  [['#styleSeg', 'style'], ['#ornPills', 'orn'], ['#fontSeg', 'font'], ['#iconPosSeg', 'iconPos']].forEach(([sel, key]) =>
    $$(sel + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === S[key])));
  $$('#iconRow button').forEach(b => b.classList.toggle('on', b.dataset.v === S.icon));
  $('#iconPosSeg').hidden = S.icon === 'none';
  $('#optUpper').checked = S.upper; $('#optBold').checked = S.bold;
  $('#wmm').value = S.wmm; $('#hmm').value = S.hmm;
  $('#wOut').textContent = S.wmm + ' mm'; $('#hOut').textContent = S.hmm + ' mm';
  const cols = Math.max(1, Math.floor((PAPER + GAP_X) / (Math.min(PAPER, S.wmm * DPMM) + GAP_X)));
  $('#fitHint').textContent = `${cols} etiqueta${cols > 1 ? 's' : ''} por linha no papel de 58 mm (área útil 48 mm).`;
  $('#optFeed').value = S.feed; $('#optFF').checked = S.ff; $('#optChunk').value = S.chunk;
  $('#optDelay').value = S.delay; $('#delayOut').textContent = S.delay + ' ms';
}

function buildShapeButtons() {
  const box = $('#shapes'); box.innerHTML = '';
  SHAPES.forEach(([id, name]) => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.v = id; b.setAttribute('role', 'radio'); b.title = name;
    const c = document.createElement('canvas'); c.width = 128; c.height = 80;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 128, 80);
    shapePath(ctx, id, { x: 6, y: 8, w: 116, h: 64 }); ctx.fillStyle = '#1b1f2a'; ctx.fill();
    if (id === 'tag') { ctx.beginPath(); ctx.arc(6 + 64 * 0.5, 40, 6, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); }
    const s = document.createElement('span'); s.textContent = name;
    b.append(c, s); box.append(b);
  });
}

function buildIconButtons() {
  const box = $('#iconRow'); box.innerHTML = '';
  ICONS.forEach(([id, name]) => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.v = id; b.title = name; b.setAttribute('role', 'radio');
    const c = document.createElement('canvas'); c.width = 96; c.height = 96;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 96, 96);
    if (id === 'none') { ctx.strokeStyle = '#9aa0ab'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(48, 48, 26, 0, 7); ctx.moveTo(30, 66); ctx.lineTo(66, 30); ctx.stroke(); }
    else drawIcon(ctx, id, 48, 48, 66, '#1b1f2a', '#fff');
    const s = document.createElement('span'); s.textContent = name;
    b.append(c, s); box.append(b);
  });
}

function loadFonts() {
  const list = ['700 24px "Cinzel Decorative"', '400 24px "Cinzel Decorative"', '400 24px "MedievalSharp"'];
  return Promise.all(list.map(f => document.fonts.load(f, 'AaÁçã'))).catch(() => {});
}

function buildCategoryPills() {
  const box = $('#catPills'); box.innerHTML = '';
  CATS.forEach(c => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.dataset.v = c;
    b.classList.toggle('on', c === category); box.append(b);
  });
}

let gridTimer = null;
function renderGrid() {
  const list = category === 'Meus' ? mine : PRESETS[category] || [];
  const grid = $('#presetGrid'); grid.innerHTML = '';
  if (!list.length) { grid.innerHTML = '<p class="empty" style="grid-column:1/-1">Você ainda não salvou nenhum texto. Escreva acima e toque em “Salvar em Meus”.</p>'; return; }
  const look = lookOf(S);
  list.forEach(text => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.text = text;
    b.classList.toggle('on', selected.has(text)); b.setAttribute('aria-pressed', selected.has(text));
    const c = document.createElement('canvas'); renderLabelCanvas(c, { text, sub: '' }, look);
    b.append(c); grid.append(b);
  });
}
function scheduleGrid() { clearTimeout(gridTimer); gridTimer = setTimeout(() => { renderGrid(); renderLive(); }, 40); }

function renderLive() {
  const text = $('#txtMain').value.trim() || 'Seu texto';
  renderLabelCanvas($('#livePreview'), { text, sub: $('#txtSub').value }, lookOf(S));
}

function updateSelBar() {
  const bar = $('#selBar'), active = $('#tab-criar').classList.contains('active');
  bar.hidden = !(selected.size && active);
  $('#selCount').textContent = selected.size; $('#selQty').textContent = selQty;
}

function renderQueue() {
  const ul = $('#queueList'); ul.innerHTML = '';
  $('#queueEmpty').hidden = queue.length > 0;
  queue.forEach(it => {
    const li = document.createElement('li');
    const c = document.createElement('canvas'); renderLabelCanvas(c, it, it.look);
    const info = document.createElement('div');
    info.innerHTML = '<div class="t"></div><div class="s"></div>';
    info.firstChild.textContent = it.text; info.lastChild.textContent = it.sub || (SHAPES.find(s => s[0] === it.look.shape) || [0, ''])[1];
    const ctl = document.createElement('div'); ctl.className = 'ctl';
    ctl.innerHTML = '<button type="button" data-a="minus" aria-label="Menos">−</button><b></b><button type="button" data-a="plus" aria-label="Mais">+</button><button type="button" data-a="rm" class="rm" aria-label="Remover">✕</button>';
    ctl.querySelector('b').textContent = it.qty;
    li.dataset.id = it.id; li.append(c, info, ctl); ul.append(li);
  });
  const sheet = $('#sheetCanvas'), has = queue.length > 0;
  if (!has) { sheet.width = PAPER; sheet.height = 40; const x = sheet.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, PAPER, 40); $('#sheetInfo').textContent = 'Fila vazia.'; }
  else {
    const { canvas, count, cols, rows } = buildSheet(queue);
    sheet.width = canvas.width; sheet.height = canvas.height; sheet.getContext('2d').drawImage(canvas, 0, 0);
    const cm = (canvas.height / DPMM / 10).toFixed(1);
    $('#sheetInfo').textContent = `${count} etiqueta${count > 1 ? 's' : ''} · ${cols} por linha · ${rows} linha${rows > 1 ? 's' : ''} · ≈ ${cm} cm de papel`;
  }
  ['#btnPrint', '#btnPng', '#btnShare', '#btnClearQueue'].forEach(s => $(s).disabled = !has);
}

function setStatus(msg, cls) { const p = $('#printStatus'); p.textContent = msg || ''; p.className = 'status ' + (cls || ''); }
function setProgress(f) { const box = $('#progress'); box.hidden = f == null; if (f != null) $('#progressBar').style.width = Math.round(f * 100) + '%'; }

async function doPrint(items, label) {
  if (!items.length) return;
  const btn = $('#btnPrint'); btn.disabled = true; $('#btnTest').disabled = true;
  try {
    setStatus('Conectando à impressora…');
    await btEnsure();
    const { canvas } = buildSheet(items);
    const data = canvasToEscpos(canvas);
    setStatus(`Enviando ${label}…`); setProgress(0);
    await btSend(data, setProgress);
    setProgress(1); setStatus('Pronto! Destaque as etiquetas. ✔', 'ok');
    setTimeout(() => setProgress(null), 1200);
  } catch (e) {
    if (e && e.name === 'NotFoundError') setStatus('Nenhuma impressora escolhida.', 'err');
    else setStatus('Falhou: ' + (e.message || e) + ' — veja os Ajustes (pacote menor / pausa maior).', 'err');
    setProgress(null);
  } finally { btn.disabled = queue.length === 0; $('#btnTest').disabled = false; }
}

async function sheetBlob() {
  const { canvas } = buildSheet(queue);
  const big = document.createElement('canvas'); big.width = canvas.width * 2; big.height = canvas.height * 2;
  const x = big.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(canvas, 0, 0, big.width, big.height);
  return new Promise(res => big.toBlob(res, 'image/png'));
}

/* --------------------------------------------------------------- eventos */
function bind() {
  $$('.tabbar button').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  $('#btChip').addEventListener('click', () => { setTab('ajustes'); });

  $('#shapes').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.shape = b.dataset.v; saveSettings(); syncControls(); scheduleGrid(); });
  [['#styleSeg', 'style'], ['#ornPills', 'orn'], ['#fontSeg', 'font'], ['#iconPosSeg', 'iconPos']].forEach(([sel, key]) =>
    $(sel).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S[key] = b.dataset.v; saveSettings(); syncControls(); scheduleGrid(); }));
  $('#iconRow').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.icon = b.dataset.v; saveSettings(); syncControls(); scheduleGrid(); });
  $('#btnMagic').addEventListener('click', () => {
    Object.assign(S, { shape: 'cloud', style: 'solid', orn: 'faiscas', icon: 'varinha', iconPos: 'left', font: 'magic', upper: true, bold: true });
    saveSettings(); syncControls(); category = 'Magia'; buildCategoryPills(); loadFonts().then(renderGrid); renderGrid(); renderLive(); toast('Tema mágico aplicado ✨');
  });
  $('#optUpper').addEventListener('change', e => { S.upper = e.target.checked; saveSettings(); scheduleGrid(); });
  $('#optBold').addEventListener('change', e => { S.bold = e.target.checked; saveSettings(); scheduleGrid(); });
  $('#wmm').addEventListener('input', e => { S.wmm = +e.target.value; saveSettings(); syncControls(); scheduleGrid(); });
  $('#hmm').addEventListener('input', e => { S.hmm = +e.target.value; saveSettings(); syncControls(); scheduleGrid(); });
  $('#txtMain').addEventListener('input', renderLive);
  $('#txtSub').addEventListener('input', renderLive);
  $('#txtMain').addEventListener('keydown', e => { if (e.key === 'Enter') $('#btnAddCustom').click(); });

  $('#btnAddCustom').addEventListener('click', () => {
    const t = $('#txtMain').value;
    if (!t.trim()) { toast('Digite um texto primeiro'); $('#txtMain').focus(); return; }
    addToQueue(t, $('#txtSub').value, 1); toast('Adicionado à fila ✔');
  });
  $('#btnSaveMine').addEventListener('click', () => {
    const t = $('#txtMain').value.trim();
    if (!t) { toast('Digite um texto primeiro'); return; }
    if (!mine.includes(t)) { mine.unshift(t); store.set('rotule.mine', mine); }
    category = 'Meus'; buildCategoryPills(); renderGrid(); toast('Salvo em “Meus”');
  });

  $('#catPills').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; category = b.dataset.v; buildCategoryPills(); renderGrid(); });
  $('#presetGrid').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const t = b.dataset.text;
    if (selected.has(t)) selected.delete(t); else selected.add(t);
    b.classList.toggle('on', selected.has(t)); b.setAttribute('aria-pressed', selected.has(t)); updateSelBar();
  });
  $('#selMinus').addEventListener('click', () => { selQty = Math.max(1, selQty - 1); updateSelBar(); });
  $('#selPlus').addEventListener('click', () => { selQty = Math.min(20, selQty + 1); updateSelBar(); });
  $('#selClear').addEventListener('click', () => { selected.clear(); renderGrid(); updateSelBar(); });
  $('#selAdd').addEventListener('click', () => {
    const n = selected.size; selected.forEach(t => addToQueue(t, '', selQty));
    selected.clear(); selQty = 1; renderGrid(); updateSelBar(); toast(`${n} adicionada${n > 1 ? 's' : ''} à fila ✔`);
  });

  $('#queueList').addEventListener('click', e => {
    const b = e.target.closest('button[data-a]'); if (!b) return;
    const id = b.closest('li').dataset.id, it = queue.find(q => q.id === id); if (!it) return;
    if (b.dataset.a === 'plus') it.qty = Math.min(99, it.qty + 1);
    else if (b.dataset.a === 'minus') it.qty = Math.max(1, it.qty - 1);
    else queue = queue.filter(q => q.id !== id);
    saveQueue(); renderQueue();
  });
  $('#btnClearQueue').addEventListener('click', () => { if (confirm('Esvaziar a fila?')) { queue = []; saveQueue(); renderQueue(); } });

  $('#btnPrint').addEventListener('click', () => doPrint(queue, 'a fila'));
  $('#btnTest').addEventListener('click', () => doPrint([{ id: 't', text: 'Teste', sub: 'Rotulê ok', qty: 1, look: lookOf(S) }], 'o teste'));
  $('#btnPng').addEventListener('click', async () => {
    const blob = await sheetBlob(), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'rotule-etiquetas.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
  $('#btnShare').addEventListener('click', async () => {
    const blob = await sheetBlob(), file = new File([blob], 'rotule-etiquetas.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Etiquetas Rotulê' }); } catch {} }
    else toast('Este navegador não compartilha arquivos — use “Baixar PNG”.');
  });

  $('#btnConnect').addEventListener('click', async () => {
    try { await btConnect(); toast('Impressora conectada ✔'); }
    catch (e) { if (e && e.name !== 'NotFoundError') toast(e.message || 'Não foi possível conectar'); }
  });
  $('#btnDisconnect').addEventListener('click', () => { try { BT.device && BT.device.gatt.disconnect(); } catch {} BT.char = null; setBtUi('off'); });
  $('#optFeed').addEventListener('change', e => { S.feed = +e.target.value; saveSettings(); });
  $('#optFF').addEventListener('change', e => { S.ff = e.target.checked; saveSettings(); });
  $('#optChunk').addEventListener('change', e => { S.chunk = +e.target.value; saveSettings(); });
  $('#optDelay').addEventListener('input', e => { S.delay = +e.target.value; $('#delayOut').textContent = S.delay + ' ms'; saveSettings(); });
  $('#btnResetAll').addEventListener('click', () => {
    if (!confirm('Apagar fila, textos salvos e ajustes?')) return;
    ['rotule.settings', 'rotule.queue', 'rotule.mine'].forEach(store.del);
    S = Object.assign({}, DEFAULTS); queue = []; mine = []; selected.clear(); saveQueue(); syncControls(); renderGrid(); renderLive(); toast('Tudo limpo');
  });

  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#btnInstall').hidden = false; });
  $('#btnInstall').addEventListener('click', async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#btnInstall').hidden = true; });
}

function init() {
  if (!navigator.bluetooth) {
    const b = $('#compat'); b.hidden = false;
    b.textContent = 'Este navegador não suporta Bluetooth na web (iPhone/Safari não suporta). Use o Chrome no Android ou no computador para imprimir. Você ainda pode criar as etiquetas e baixar o PNG.';
  }
  buildShapeButtons(); buildIconButtons(); buildCategoryPills(); syncControls(); bind();
  loadFonts().then(() => { renderGrid(); renderLive(); if ($('#tab-fila').classList.contains('active')) renderQueue(); });
  renderGrid(); renderLive(); updateBadge(); updateSelBar(); setBtUi('off');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
document.fonts && document.fonts.ready ? document.fonts.ready.then(init) : init();
