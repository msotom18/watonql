const CW = 340, CH = 170, PL = 36, PR = 8, PT = 10, PB = 22;
const shortDate = (d) => (/* @__PURE__ */ new Date(d + "T12:00")).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
const CHARTS = {};
function niceTicks(lo, hi, n = 3) {
  const step = (hi - lo) / n;
  return [...Array(n + 1)].map((_, i) => lo + step * i);
}
function chartWeight() {
  const all = weightTrend(), from = addDays(TODAY(), -59);
  const P = all.filter((p) => p.d >= from);
  if (P.length < 2) return '<p class="small muted">Registra tu peso al menos 2 veces para ver el gráfico.</p>';
  const x0 = P[0].d, span = Math.max(1, dayDiff(x0, P[P.length - 1].d));
  let lo = Math.min(...P.map((p) => Math.min(p.kg, p.t))), hi = Math.max(...P.map((p) => Math.max(p.kg, p.t)));
  const pad = Math.max(0.5, (hi - lo) * 0.15);
  lo = Math.floor((lo - pad) * 2) / 2;
  hi = Math.ceil((hi + pad) * 2) / 2;
  const X = (d) => PL + dayDiff(x0, d) / span * (CW - PL - PR);
  const Y = (v) => PT + (hi - v) / (hi - lo) * (CH - PT - PB);
  const grid = niceTicks(lo, hi).map((v) => '<line x1="'.concat(PL, '" x2="').concat(CW - PR, '" y1="').concat(Y(v), '" y2="').concat(Y(v), '" class="grid"/><text x="').concat(PL - 6, '" y="').concat(Y(v) + 4, '" class="axis" text-anchor="end">').concat(v.toFixed(1).replace(".", ","), "</text>")).join("");
  const line = P.map((p, i) => "".concat(i ? "L" : "M").concat(X(p.d).toFixed(1), ",").concat(Y(p.t).toFixed(1))).join("");
  const dots = P.map((p) => '<circle cx="'.concat(X(p.d), '" cy="').concat(Y(p.kg), '" r="4" class="dot"/>')).join("");
  CHARTS.w = P.map((p) => ({ x: X(p.d), y: Y(p.kg), html: "<b>".concat(shortDate(p.d), "</b><br>Peso ").concat(p.kg.toFixed(1).replace(".", ","), " kg<br>Tendencia ").concat(p.t.toFixed(1).replace(".", ","), " kg") }));
  return '<div class="legend"><span><i class="lg-dot"></i>Peso</span><span><i class="lg-line"></i>Tendencia (7 días)</span></div>\n    <div class="chart" data-chart="w"><svg viewBox="0 0 '.concat(CW, " ").concat(CH, '" role="img" aria-label="Peso de los últimos 60 días">\n      ').concat(grid, '<path d="').concat(line, '" class="trend"/>').concat(dots, '\n      <text x="').concat(PL, '" y="').concat(CH - 4, '" class="axis">').concat(shortDate(P[0].d), '</text><text x="').concat(CW - PR, '" y="').concat(CH - 4, '" class="axis" text-anchor="end">').concat(shortDate(P[P.length - 1].d), '</text>\n      <line class="cross" y1="').concat(PT, '" y2="').concat(CH - PB, '" x1="-10" x2="-10"/>\n    </svg><div class="tip"></div></div>');
}
function chartBalance() {
  const days = [...Array(14)].map((_, i) => addDays(TODAY(), i - 13));
  const vals = days.map((d) => {
    var _a;
    return ((_a = S.days[d]) == null ? void 0 : _a.foods.length) ? calc(d).bal : null;
  });
  if (vals.every((v) => v === null)) return '<p class="small muted">Aún no hay días con comidas registradas.</p>';
  const m = Math.max(300, ...vals.filter((v) => v !== null).map(Math.abs)) * 1.1;
  const Y = (v) => PT + (m - v) / (2 * m) * (CH - PT - PB), y0 = Y(0);
  const slot = (CW - PL - PR) / days.length, w = slot - 2;
  const grid = [m * 0.66, -m * 0.66].map((v) => '<line x1="'.concat(PL, '" x2="').concat(CW - PR, '" y1="').concat(Y(v), '" y2="').concat(Y(v), '" class="grid"/><text x="').concat(PL - 6, '" y="').concat(Y(v) + 4, '" class="axis" text-anchor="end">').concat(v > 0 ? "+" : "").concat(fmt(v), "</text>")).join("");
  const bars = [];
  CHARTS.b = [];
  days.forEach((d, i) => {
    const v = vals[i], x = PL + i * slot + 1;
    if (i % 3 === 1 || i === 13) bars.push('<text x="'.concat(x + w / 2, '" y="').concat(CH - 4, '" class="axis" text-anchor="middle">').concat((/* @__PURE__ */ new Date(d + "T12:00")).getDate(), "</text>"));
    if (v === null) return;
    const y1 = Y(v), h = Math.abs(y1 - y0), r = Math.min(4, h, w / 2), up = v > 0;
    const path = up ? "M".concat(x, ",").concat(y0, "V").concat(y1 + r, "Q").concat(x, ",").concat(y1, " ").concat(x + r, ",").concat(y1, "H").concat(x + w - r, "Q").concat(x + w, ",").concat(y1, " ").concat(x + w, ",").concat(y1 + r, "V").concat(y0, "Z") : "M".concat(x, ",").concat(y0, "V").concat(y1 - r, "Q").concat(x, ",").concat(y1, " ").concat(x + r, ",").concat(y1, "H").concat(x + w - r, "Q").concat(x + w, ",").concat(y1, " ").concat(x + w, ",").concat(y1 - r, "V").concat(y0, "Z");
    bars.push('<path d="'.concat(path, '" class="').concat(up ? "sup" : "def", '"/>'));
    CHARTS.b.push({ x: x + w / 2, y: y1, html: "<b>".concat(dayLabel(d), "</b><br>").concat(up ? "Superávit +" : "Déficit ").concat(fmt(v), " kcal") });
  });
  return '<div class="legend"><span><i class="lg-sq def"></i>Déficit (gastaste más)</span><span><i class="lg-sq sup"></i>Superávit</span></div>\n    <div class="chart" data-chart="b"><svg viewBox="0 0 '.concat(CW, " ").concat(CH, '" role="img" aria-label="Balance diario de los últimos 14 días">\n      ').concat(grid, '<line x1="').concat(PL, '" x2="').concat(CW - PR, '" y1="').concat(y0, '" y2="').concat(y0, '" class="zero"/>').concat(bars.join(""), '\n      <line class="cross" y1="').concat(PT, '" y2="').concat(CH - PB, '" x1="-10" x2="-10"/>\n    </svg><div class="tip"></div></div>');
}
function bindCharts() {
  document.querySelectorAll(".chart").forEach((el) => {
    const pts = CHARTS[el.dataset.chart];
    if (!(pts == null ? void 0 : pts.length)) return;
    const svg = el.querySelector("svg"), tip = el.querySelector(".tip"), cross = el.querySelector(".cross");
    const show = (e) => {
      const r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * CW;
      const p = pts.reduce((a, b) => Math.abs(b.x - sx) < Math.abs(a.x - sx) ? b : a);
      cross.setAttribute("x1", p.x);
      cross.setAttribute("x2", p.x);
      tip.innerHTML = p.html;
      tip.style.display = "block";
      const left = p.x / CW * r.width, top = p.y / CH * r.height;
      tip.style.left = Math.min(Math.max(left, 60), r.width - 60) + "px";
      tip.style.top = Math.max(top - 8, 0) + "px";
    };
    const hide = () => {
      tip.style.display = "none";
      cross.setAttribute("x1", -10);
      cross.setAttribute("x2", -10);
    };
    svg.addEventListener("pointermove", show);
    svg.addEventListener("pointerdown", show);
    svg.addEventListener("pointerleave", hide);
  });
}
