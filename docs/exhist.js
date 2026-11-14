const PACE = { "Caminar tranquilo": 13, "Caminar rápido": 10, "Trotar": 7.5, "Correr": 6, "Andar en bici (paseo)": 4, "Andar en bici (intenso)": 2.5, "Trekking": 15 };
const RUN = ["Trotar", "Correr"], WALK = ["Caminar tranquilo", "Caminar rápido"];
const fmtKm = (km) => (Math.round(km * 100) / 100).toString().replace(".", ",");
const pace = (min, km) => {
  const s = R(min * 60 / km);
  return "".concat(Math.floor(s / 60), ":").concat(String(s % 60).padStart(2, "0"));
};
function distMet(e, km, min) {
  const v = km * 1e3 / min;
  if (RUN.includes(e.n)) return (0.2 * v + 3.5) / 3.5;
  if (WALK.includes(e.n)) return (0.1 * v + 3.5) / 3.5;
  return e.met;
}
let DP = null;
function pickDist(e) {
  DP = { e, km: 0, min: 0, appK: 0 };
  openSheet(head(esc(e.n), "openEx()") + '\n    <div class="grid3 dist">\n      <label class="fl">Km<input id="dkm" type="number" step="0.01" inputmode="decimal" placeholder="5,2" oninput="DP.km=+this.value.replace(\',\',\'.\')||0;dpv()"></label>\n      <label class="fl">Minutos<input id="dmin" type="number" inputmode="numeric" placeholder="opcional" oninput="DP.min=+this.value||0;dpv()"></label>\n      <label class="fl">kcal de tu app<input id="dk" type="number" inputmode="numeric" placeholder="opcional" oninput="DP.appK=+this.value||0;dpv()"></label>\n    </div>\n    <p class="small muted">Si usas una app (Strava, Nike Run, reloj…), copia sus km, minutos y kcal. Sin minutos, los estimo con un ritmo típico de '.concat(PACE[e.n], ' min/km.</p>\n    <div class="preview" id="dpv"></div>\n    <button class="btn" onclick="addDist()">Agregar a ').concat(dayLabel(cur).toLowerCase(), "</button>"));
  dpv();
  $("#dkm").focus();
}
function distCalc() {
  const { e, km, appK } = DP;
  const min = DP.min || (km ? km * PACE[e.n] : 0);
  if (!min) return null;
  const rest = S.profile.weight * min / 60;
  const k = appK ? Math.max(0, appK - rest) : km ? exK(distMet(e, km, min), min) : 0;
  return { min: R(min), k: R(k), rest: R(rest), est: !DP.min };
}
function dpv() {
  const r = distCalc();
  if (!r) return $("#dpv").innerHTML = "<span>Pon los km (y si quieres, minutos y kcal de tu app)</span>";
  const sp = DP.km ? "".concat(pace(r.min, DP.km), " min/km · ").concat((DP.km / (r.min / 60)).toFixed(1).replace(".", ","), " km/h").concat(r.est ? " (estimado)" : "") : "";
  $("#dpv").innerHTML = "<b>".concat(fmt(r.k), " kcal</b><span>").concat(sp).concat(DP.appK ? "<br>Tu app: ".concat(fmt(DP.appK), " kcal − ").concat(fmt(r.rest), " que gastarías igual en reposo") : "", "</span>");
}
function addDist() {
  const r = distCalc();
  if (!r || !DP.km) return toast("Pon los km");
  ensureDay(cur).ex.push({ n: DP.e.n, min: r.min, k: r.k, km: DP.km, ...DP.appK ? { appK: DP.appK } : {} });
  save();
  closeSheet();
  render();
  toast("".concat(DP.e.n, ": ").concat(fmtKm(DP.km), " km · -").concat(r.k, " kcal"));
}
const exDays = () => Object.keys(S.days).filter((d) => {
  var _a;
  return (_a = S.days[d].ex) == null ? void 0 : _a.length;
}).sort();
function exStats(from, to) {
  var _a;
  let active = 0, ses = 0, k = 0, min = 0, km = 0;
  const count = {};
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const ex = ((_a = S.days[d]) == null ? void 0 : _a.ex) || [];
    if (ex.length) active++;
    ex.forEach((e) => {
      ses++;
      k += e.k;
      min += e.min || 0;
      km += e.km || 0;
      const n = e.n.replace(/^Rutina: /, "");
      count[n] = (count[n] || 0) + 1;
    });
  }
  const top = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return { active, ses, k, min, km, top, days: dayDiff(from, to) + 1 };
}
function streak() {
  var _a, _b, _c, _d;
  let d = TODAY(), n = 0;
  if (!((_b = (_a = S.days[d]) == null ? void 0 : _a.ex) == null ? void 0 : _b.length)) d = addDays(d, -1);
  while ((_d = (_c = S.days[d]) == null ? void 0 : _c.ex) == null ? void 0 : _d.length) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
const mondayOf = (d) => {
  const x = /* @__PURE__ */ new Date(d + "T12:00");
  return addDays(d, -((x.getDay() + 6) % 7));
};
function activeWeeks(n) {
  var _a, _b;
  let ok = 0;
  const m0 = mondayOf(TODAY());
  for (let w = 0; w < n; w++) {
    const mon = addDays(m0, -7 * w);
    let a = 0;
    for (let i = 0; i < 7; i++) if ((_b = (_a = S.days[addDays(mon, i)]) == null ? void 0 : _a.ex) == null ? void 0 : _b.length) a++;
    if (a >= 3) ok++;
  }
  return ok;
}
function heatmap() {
  var _a;
  const weeks = 12, start = addDays(mondayOf(TODAY()), -7 * (weeks - 1)), t = TODAY();
  let cells = "";
  for (let r = 0; r < 7; r++) {
    cells += '<span class="hm-l">'.concat(["L", "M", "Mi", "J", "V", "S", "D"][r], "</span>");
    for (let w = 0; w < weeks; w++) {
      const d = addDays(start, w * 7 + r);
      if (d > t) {
        cells += '<span class="hm-c"></span>';
        continue;
      }
      const k = (((_a = S.days[d]) == null ? void 0 : _a.ex) || []).reduce((a, e) => a + e.k, 0);
      const lv = !k ? 0 : k < 100 ? 1 : k < 250 ? 2 : 3;
      cells += '<button class="hm-c l'.concat(lv).concat(d === t ? " today" : "", '" onclick="openDay(\'').concat(d, '\')" aria-label="').concat(dayLabel(d), ": ").concat(k ? fmt(k) + " kcal de ejercicio" : "sin ejercicio", '" title="').concat(dayLabel(d)).concat(k ? " · " + fmt(k) + " kcal" : "", '"></button>');
    }
  }
  return '<div class="hm">'.concat(cells, '</div>\n    <div class="hm-legend"><span>').concat(shortDate(start), '</span><span class="grow"></span>Menos <i class="hm-c l0"></i><i class="hm-c l1"></i><i class="hm-c l2"></i><i class="hm-c l3"></i> Más</div>');
}
function exHistoryCard() {
  if (!exDays().length) return "";
  const t = TODAY(), wk = exStats(mondayOf(t), t), m = exStats(addDays(t, -29), t), st = streak();
  return '<section class="card"><div class="row"><h3>📅 Tu constancia</h3><button class="link" onclick="openExHistory()">Ver historial ›</button></div>\n    '.concat(heatmap(), '\n    <div class="grid3 stats"><div><b>').concat(wk.active, "/7</b><span>días esta semana</span></div><div><b>").concat(st, "</b><span>día").concat(st === 1 ? "" : "s", " de racha</span></div><div><b>").concat(m.active, "</b><span>días activos (30 d)</span></div></div>\n  </section>");
}
const EH_OPTS = [["7", "7 días"], ["30", "30 días"], ["90", "3 meses"], ["all", "Todo"]];
let EH = "30";
function openExHistory(p) {
  if (p) EH = p;
  const t = TODAY(), from = EH === "all" ? exDays()[0] || t : addDays(t, -(+EH - 1));
  const s = exStats(from, t), weeks = Math.max(1, Math.ceil(s.days / 7));
  const list = exDays().filter((d) => d >= from).reverse();
  openSheet(head("📅 Historial de ejercicio") + '\n    <div class="chips">'.concat(EH_OPTS.map(([v, l]) => chip(l, v === EH, "openExHistory('".concat(v, "')"))).join(""), '</div>\n    <div class="card stats-card">\n      <div class="grid3 stats"><div><b>').concat(s.active, "</b><span>días activos de ").concat(s.days, "</span></div><div><b>").concat(R(s.active / s.days * 100), "%</b><span>de los días</span></div><div><b>").concat((s.active / weeks).toFixed(1).replace(".", ","), '</b><span>días / semana</span></div></div>\n      <div class="grid3 stats"><div><b>').concat(fmt(s.k), "</b><span>kcal</span></div><div><b>").concat((s.min / 60).toFixed(1).replace(".", ","), " h</b><span>de ejercicio</span></div><div><b>").concat(fmtKm(s.km), '</b><span>km</span></div></div>\n      <p class="small muted">Semanas con 3+ días activos: ').concat(activeWeeks(Math.min(weeks, 52)), " de ").concat(Math.min(weeks, 52)).concat(s.top.length ? " · Lo que más haces: ".concat(s.top.map(([n, c]) => "".concat(esc(n), " (").concat(c, ")")).join(", ")) : "", "</p>\n    </div>\n    ").concat(list.map((d) => {
    const ex = S.days[d].ex, k = ex.reduce((a, e) => a + e.k, 0);
    return '<button class="exday" onclick="closeSheet();openDay(\''.concat(d, '\')"><div class="row"><b>').concat(dayLabel(d), '</b><span class="muted small">').concat(fmt(k), " kcal</span></div>\n        ").concat(ex.map((e) => '<div class="small"><span>'.concat(esc(e.n), '</span> <span class="muted">· ').concat(esc(exDesc(e)), "</span></div>")).join(""), "</button>");
  }).join("") || '<p class="muted">Sin ejercicio en este período.</p>'));
}
