// Gráficos SVG livianos (sin librerías, funcionan sin internet).
const CW = 340, CH = 170, PL = 36, PR = 8, PT = 10, PB = 22;
const shortDate = d => new Date(d + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
const CHARTS = {};

function niceTicks(lo, hi, n = 3) {
  const step = (hi - lo) / n;
  return [...Array(n + 1)].map((_, i) => lo + step * i);
}

// Peso: puntos = pesajes, línea = tendencia 7 días
function chartWeight() {
  const all = weightTrend(), from = addDays(TODAY(), -59);
  const P = all.filter(p => p.d >= from);
  if (P.length < 2) return '<p class="small muted">Registra tu peso al menos 2 veces para ver el gráfico.</p>';
  const x0 = P[0].d, span = Math.max(1, dayDiff(x0, P[P.length - 1].d));
  let lo = Math.min(...P.map(p => Math.min(p.kg, p.t))), hi = Math.max(...P.map(p => Math.max(p.kg, p.t)));
  const pad = Math.max(0.5, (hi - lo) * 0.15); lo = Math.floor((lo - pad) * 2) / 2; hi = Math.ceil((hi + pad) * 2) / 2;
  const X = d => PL + dayDiff(x0, d) / span * (CW - PL - PR);
  const Y = v => PT + (hi - v) / (hi - lo) * (CH - PT - PB);
  const grid = niceTicks(lo, hi).map(v => `<line x1="${PL}" x2="${CW - PR}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${PL - 6}" y="${Y(v) + 4}" class="axis" text-anchor="end">${v.toFixed(1).replace('.', ',')}</text>`).join('');
  const line = P.map((p, i) => `${i ? 'L' : 'M'}${X(p.d).toFixed(1)},${Y(p.t).toFixed(1)}`).join('');
  const dots = P.map(p => `<circle cx="${X(p.d)}" cy="${Y(p.kg)}" r="4" class="dot"/>`).join('');
  CHARTS.w = P.map(p => ({ x: X(p.d), y: Y(p.kg), html: `<b>${shortDate(p.d)}</b><br>Peso ${p.kg.toFixed(1).replace('.', ',')} kg<br>Tendencia ${p.t.toFixed(1).replace('.', ',')} kg` }));
  return `<div class="legend"><span><i class="lg-dot"></i>Peso</span><span><i class="lg-line"></i>Tendencia (7 días)</span></div>
    <div class="chart" data-chart="w"><svg viewBox="0 0 ${CW} ${CH}" role="img" aria-label="Peso de los últimos 60 días">
      ${grid}<path d="${line}" class="trend"/>${dots}
      <text x="${PL}" y="${CH - 4}" class="axis">${shortDate(P[0].d)}</text><text x="${CW - PR}" y="${CH - 4}" class="axis" text-anchor="end">${shortDate(P[P.length - 1].d)}</text>
      <line class="cross" y1="${PT}" y2="${CH - PB}" x1="-10" x2="-10"/>
    </svg><div class="tip"></div></div>`;
}

// Balance diario (últimos 14 días): barras hacia abajo = déficit, hacia arriba = superávit
function chartBalance() {
  const days = [...Array(14)].map((_, i) => addDays(TODAY(), i - 13));
  const vals = days.map(d => (S.days[d]?.foods.length ? calc(d).bal : null));
  if (vals.every(v => v === null)) return '<p class="small muted">Aún no hay días con comidas registradas.</p>';
  const m = Math.max(300, ...vals.filter(v => v !== null).map(Math.abs)) * 1.1;
  const Y = v => PT + (m - v) / (2 * m) * (CH - PT - PB), y0 = Y(0);
  const slot = (CW - PL - PR) / days.length, w = slot - 2;
  const grid = [m * 0.66, -m * 0.66].map(v => `<line x1="${PL}" x2="${CW - PR}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${PL - 6}" y="${Y(v) + 4}" class="axis" text-anchor="end">${v > 0 ? '+' : ''}${fmt(v)}</text>`).join('');
  const bars = [];
  CHARTS.b = [];
  days.forEach((d, i) => {
    const v = vals[i], x = PL + i * slot + 1;
    if (i % 3 === 1 || i === 13) bars.push(`<text x="${x + w / 2}" y="${CH - 4}" class="axis" text-anchor="middle">${new Date(d + 'T12:00').getDate()}</text>`);
    if (v === null) return;
    const y1 = Y(v), h = Math.abs(y1 - y0), r = Math.min(4, h, w / 2), up = v > 0;
    // extremo de dato redondeado, base recta sobre el cero
    const path = up
      ? `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`
      : `M${x},${y0}V${y1 - r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 - r}V${y0}Z`;
    bars.push(`<path d="${path}" class="${up ? 'sup' : 'def'}"/>`);
    CHARTS.b.push({ x: x + w / 2, y: y1, html: `<b>${dayLabel(d)}</b><br>${up ? 'Superávit +' : 'Déficit '}${fmt(v)} kcal` });
  });
  return `<div class="legend"><span><i class="lg-sq def"></i>Déficit (gastaste más)</span><span><i class="lg-sq sup"></i>Superávit</span></div>
    <div class="chart" data-chart="b"><svg viewBox="0 0 ${CW} ${CH}" role="img" aria-label="Balance diario de los últimos 14 días">
      ${grid}<line x1="${PL}" x2="${CW - PR}" y1="${y0}" y2="${y0}" class="zero"/>${bars.join('')}
      <line class="cross" y1="${PT}" y2="${CH - PB}" x1="-10" x2="-10"/>
    </svg><div class="tip"></div></div>`;
}

// Tooltip al pasar el dedo / mouse: punto más cercano en X
function bindCharts() {
  document.querySelectorAll('.chart').forEach(el => {
    const pts = CHARTS[el.dataset.chart]; if (!pts?.length) return;
    const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), cross = el.querySelector('.cross');
    const show = e => {
      const r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * CW;
      const p = pts.reduce((a, b) => (Math.abs(b.x - sx) < Math.abs(a.x - sx) ? b : a));
      cross.setAttribute('x1', p.x); cross.setAttribute('x2', p.x);
      tip.innerHTML = p.html; tip.style.display = 'block';
      const left = p.x / CW * r.width, top = p.y / CH * r.height;
      tip.style.left = Math.min(Math.max(left, 60), r.width - 60) + 'px';
      tip.style.top = Math.max(top - 8, 0) + 'px';
    };
    const hide = () => { tip.style.display = 'none'; cross.setAttribute('x1', -10); cross.setAttribute('x2', -10); };
    svg.addEventListener('pointermove', show); svg.addEventListener('pointerdown', show);
    svg.addEventListener('pointerleave', hide);
  });
}
