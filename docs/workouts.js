const REPEX = [
  ["flexion", "Flexiones de brazos", "rep", 2.5, 8],
  ["crunch", "Abdominales (crunch)", "rep", 2, 5],
  ["sentadilla", "Sentadillas", "rep", 3, 5.5],
  ["zancada", "Zancadas", "rep", 3, 5.5],
  ["burpee", "Burpees", "rep", 4, 8],
  ["sent_salto", "Sentadillas con salto", "rep", 2.5, 8],
  ["jumping", "Jumping jacks", "rep", 1, 7.7],
  ["escalador", "Escaladores", "rep", 1, 8],
  ["fondos", "Fondos de tríceps", "rep", 2.5, 5],
  ["pica", "Flexiones pica", "rep", 3, 6],
  ["dominada", "Dominadas", "rep", 4, 8],
  ["puente", "Puentes de glúteo", "rep", 2.5, 4],
  ["bulgara", "Sentadillas búlgaras", "rep", 3, 5.5],
  ["talones", "Elevaciones de talones", "rep", 1.5, 3.5],
  ["bici_abd", "Bicicleta abdominal", "rep", 1.5, 5],
  ["elev_piernas", "Elevaciones de piernas", "rep", 3, 4.5],
  ["remo", "Remo con mochila", "rep", 2.5, 4.5],
  ["toque_hombros", "Toques de hombro", "rep", 1.5, 5],
  ["plancha", "Plancha", "s", 1, 4],
  ["plancha_lat", "Plancha lateral", "s", 1, 4],
  ["skipping", "Skipping / trote en el lugar", "s", 1, 8]
].map(([x, n, u, spr, met]) => ({ x, n, u, spr, met }));
const repex = (x) => REPEX.find((e) => e.x === x);
const isSecs = (it) => {
  var _a;
  return ((_a = repex(it.x)) == null ? void 0 : _a.u) === "s";
};
const itemSecs = (it) => isSecs(it) ? it.secs * it.sets : it.reps * it.sets * repex(it.x).spr;
const itemKcal = (it) => exK(repex(it.x).met, itemSecs(it) / 60);
const itemTxt = (it) => "".concat(it.sets, " × ").concat(isSecs(it) ? it.secs + " s" : it.reps);
const mmss = (s) => "".concat(Math.floor(s / 60), ":").concat(String(s % 60).padStart(2, "0"));
function routineStats(r) {
  const work = r.items.reduce((a, it) => a + itemSecs(it), 0);
  const sets = r.items.reduce((a, it) => a + it.sets, 0);
  return { sets, min: Math.max(1, R((work + r.rest * Math.max(0, sets - 1)) / 60)), k: r.items.reduce((a, it) => a + itemKcal(it), 0) };
}
function exDesc(e) {
  var _a;
  if (e.km) return "".concat(fmtKm(e.km), " km · ").concat(e.min, " min · ").concat(pace(e.min, e.km), " min/km").concat(e.appK ? " · app" : "");
  if ((_a = e.items) == null ? void 0 : _a.length) return (e.items.length === 1 ? itemTxt(e.items[0]) + (isSecs(e.items[0]) ? "" : " reps") : "".concat(e.items.length, " ejercicios")) + (e.min ? " · ".concat(e.min, " min") : "");
  return e.min ? e.min + " min" : "manual";
}
let QL = null;
function openRepList() {
  openSheet(head("Registrar repeticiones") + '<p class="small muted">Elige el ejercicio. Después pones cuántas hiciste y cuántas series.</p>' + REPEX.map((e) => '<button class="item btnitem" onclick="openQuick(\''.concat(e.x, "', 'openRepList()')\"><div class=\"grow\">").concat(esc(e.n), '</div><div class="small muted">').concat(e.u === "s" ? "por tiempo" : "repeticiones", " ›</div></button>")).join(""));
}
function openQuick(x, back = "openEx()") {
  const e = repex(x);
  QL = { x, sets: 1, ...e.u === "s" ? { secs: 30 } : { reps: 20 } };
  const opts = e.u === "s" ? [20, 30, 45, 60, 90] : [5, 10, 15, 20, 25, 30, 50];
  const k = e.u === "s" ? "secs" : "reps";
  openSheet(head(esc(e.n), back) + exImg(x) + '\n    <div class="label">'.concat(e.u === "s" ? "Segundos por serie" : "Repeticiones por serie", '</div>\n    <div class="chips">').concat(opts.map((v) => chip(e.u === "s" ? v + " s" : v, v === QL[k], "qlSet('".concat(k, "',").concat(v, ",this)"))).join(""), '<input type="number" class="mini" placeholder="otra" inputmode="numeric" oninput="this.parentNode.querySelectorAll(\'.chip\').forEach(c=>c.classList.remove(\'on\'));qlSet(\'').concat(k, '\',+this.value||0)"></div>\n    <div class="label">Series</div>\n    <div class="chips">').concat([1, 2, 3, 4, 5].map((v) => chip(v, v === 1, "qlSet('sets',".concat(v, ",this)"))).join(""), '<input type="number" class="mini" placeholder="otra" inputmode="numeric" oninput="this.parentNode.querySelectorAll(\'.chip\').forEach(c=>c.classList.remove(\'on\'));qlSet(\'sets\',+this.value||0)"></div>\n    <div class="preview" id="qlpv"></div>\n    <button class="btn" onclick="qlAdd()">Agregar a ').concat(dayLabel(cur).toLowerCase(), "</button>"));
  qlPv();
}
function qlSet(k, v, el) {
  QL[k] = v;
  if (el) setOn(el);
  qlPv();
}
function qlPv() {
  const total = isSecs(QL) ? mmss(QL.secs * QL.sets) + " en total" : "".concat(QL.reps * QL.sets, " repeticiones en total");
  $("#qlpv").innerHTML = "<b>".concat(fmt(itemKcal(QL)), " kcal</b><span>").concat(total, "</span>");
}
function qlAdd() {
  if (!QL.sets || !(QL.reps || QL.secs)) return toast("Completa cantidad y series");
  const k = R(itemKcal(QL));
  ensureDay(cur).ex.push({ n: repex(QL.x).n, min: Math.max(1, R(itemSecs(QL) / 60)), k, items: [{ ...QL }] });
  save();
  closeSheet();
  render();
  toast("".concat(repex(QL.x).n, ": -").concat(k, " kcal"));
}
let RB = null;
function newRoutine(id) {
  const r = id && S.myRoutines.find((x) => x.id === id);
  RB = r ? JSON.parse(JSON.stringify(r)) : { n: "", rest: 60, items: [] };
  rbRender();
}
function rbRender() {
  openSheet(head(RB.id ? "Editar rutina" : "Crear rutina") + '\n    <label class="fl">Nombre<input id="rbn" value="'.concat(esc(RB.n), '" placeholder="Ej: Pecho y abdomen" oninput="RB.n=this.value"></label>\n    <div class="label">Ejercicios</div>\n    ').concat(RB.items.map((it, i) => {
    const e = repex(it.x), k = e.u === "s" ? "secs" : "reps";
    return '<div class="rbi"><div class="grow"><b>'.concat(i + 1, ". ").concat(esc(e.n), "</b></div>\n        <label>").concat(e.u === "s" ? "Seg." : "Reps", '<input type="number" inputmode="numeric" value="').concat(it[k], '" oninput="RB.items[').concat(i, "].").concat(k, '=+this.value||0;rbSum()"></label>\n        <label>Series<input type="number" inputmode="numeric" value="').concat(it.sets, '" oninput="RB.items[').concat(i, '].sets=+this.value||0;rbSum()"></label>\n        <button class="x" onclick="RB.items.splice(').concat(i, ',1);rbRender()" aria-label="Quitar">×</button></div>');
  }).join("") || '<p class="small muted">Aún no agregas ejercicios. Tócalos abajo.</p>', '\n    <div class="label">+ Agregar ejercicio (desliza)</div>\n    <div class="chips scroll">').concat(REPEX.map((e) => chip(esc(e.n), false, "rbAdd('".concat(e.x, "')"))).join(""), '</div>\n    <div class="label">Descanso entre series</div>\n    <div class="chips">').concat([30, 45, 60, 90, 120].map((s) => chip(s + " s", s === RB.rest, "RB.rest=".concat(s, ";setOn(this);rbSum()"))).join(""), '</div>\n    <div class="preview" id="rbsum"></div>\n    <button class="btn" onclick="rbSave()">Guardar rutina</button>\n    ').concat(RB.id ? '<button class="btn ghost" onclick="rbDelete()">Eliminar rutina</button>' : ""));
  rbSum();
}
function rbAdd(x) {
  var _a;
  RB.n = $("#rbn").value;
  RB.items.push({ x, sets: 3, ...repex(x).u === "s" ? { secs: 30 } : { reps: 10 } });
  rbRender();
  $("#sheetBody").scrollTop = ((_a = $(".rbi:last-of-type")) == null ? void 0 : _a.offsetTop) - 80 || 0;
}
function rbSum() {
  if (!RB.items.length) return $("#rbsum").innerHTML = "<span>Agrega al menos un ejercicio</span>";
  const s = routineStats(RB);
  $("#rbsum").innerHTML = "<b>≈ ".concat(fmt(s.k), " kcal</b><span>").concat(RB.items.length, " ejercicios · ").concat(s.sets, " series · ~").concat(s.min, " min</span>");
}
function rbSave() {
  RB.n = $("#rbn").value.trim();
  if (!RB.n) return toast("Ponle un nombre");
  if (!RB.items.length || RB.items.some((it) => !it.sets || !(it.reps || it.secs))) return toast("Revisa repeticiones y series");
  if (RB.id) S.myRoutines = S.myRoutines.map((r) => r.id === RB.id ? RB : r);
  else S.myRoutines.unshift({ ...RB, id: "u" + Date.now(), custom: true });
  save();
  closeSheet();
  goTab("rutinas");
  toast("Rutina guardada");
}
function rbDelete() {
  if (!confirm("¿Eliminar esta rutina?")) return;
  S.myRoutines = S.myRoutines.filter((r) => r.id !== RB.id);
  save();
  closeSheet();
  render();
}
function openMyRoutine(id) {
  const r = S.myRoutines.find((x) => x.id === id), s = routineStats(r);
  openSheet(head("🏋️ " + esc(r.n)) + '\n    <p class="muted">'.concat(r.items.length, " ejercicios · ").concat(s.sets, " series · descanso ").concat(r.rest, " s · ~").concat(s.min, " min · ≈ ").concat(fmt(s.k), ' kcal</p>\n    <div class="label">Ejercicios · toca para ver cómo se hace</div>\n    ').concat(r.items.map((it) => {
    var _a;
    return '<details class="exd"><summary>'.concat(esc(repex(it.x).n), ' <span class="muted">— ').concat(itemTxt(it)).concat(isSecs(it) ? "" : " reps", "</span></summary>").concat(exImg(it.x), '<p class="small">').concat(esc(((_a = EXINFO[it.x]) == null ? void 0 : _a.es) || ""), "</p></details>");
  }).join(""), '\n    <button class="btn" onclick="startTimer(\'').concat(id, '\')">▶️ Empezar (contador de series)</button>\n    <button class="btn sec full" onclick="logMyRoutine(\'').concat(id, "')\">✅ Ya la hice completa · registrar en ").concat(dayLabel(cur).toLowerCase(), '</button>\n    <button class="btn sec full" onclick="newRoutine(\'').concat(id, "')\">✏️ Editar</button>"));
}
function logMyRoutine(id) {
  const r = S.myRoutines.find((x) => x.id === id), s = routineStats(r);
  ensureDay(cur).ex.push({ n: "Rutina: " + r.n, min: s.min, k: R(s.k), items: r.items.map((it) => ({ ...it })) });
  save();
  closeSheet();
  toast("¡Bien! -".concat(R(s.k), " kcal"));
  openDay(cur);
}
function presetItems(r, rounds = r.rounds) {
  if (r.mode !== "reps" || !rounds) return [];
  return r.items.map(([t, x]) => {
    const m = t.match(/^(\d+)\s*(s\b)?/);
    if (!m || !repex(x)) return null;
    return isSecs({ x }) || m[2] ? { x, secs: +m[1], sets: rounds } : { x, reps: +m[1], sets: rounds };
  }).filter(Boolean);
}
function repTotals() {
  const today = TODAY(), w = addDays(today, -6), m = addDays(today, -29), T = {};
  Object.entries(S.days).forEach(([d, D]) => D.ex.forEach((e) => (e.items || []).forEach((it) => {
    var _a;
    if (!repex(it.x)) return;
    const t = T[_a = it.x] || (T[_a] = { hoy: 0, sem: 0, mes: 0, rec: 0 });
    const n = isSecs(it) ? it.secs * it.sets : it.reps * it.sets;
    if (d === today) t.hoy += n;
    if (d >= w) t.sem += n;
    if (d >= m) t.mes += n;
    t.rec = Math.max(t.rec, isSecs(it) ? it.secs : it.reps);
  })));
  return T;
}
function totalsCard() {
  const T = repTotals(), keys = REPEX.map((e) => e.x).filter((x) => T[x]);
  if (!keys.length) return "";
  const f = (x, v) => repex(x).u === "s" ? mmss(v) : fmt(v);
  return '<section class="card"><h3>📊 Tus totales</h3>\n    <table class="tot"><thead><tr><th></th><th>Hoy</th><th>7 días</th><th>30 días</th><th>Récord<br><span>por serie</span></th></tr></thead><tbody>\n    '.concat(keys.map((x) => "<tr><td>".concat(esc(repex(x).n), "</td><td>").concat(f(x, T[x].hoy), "</td><td>").concat(f(x, T[x].sem), "</td><td>").concat(f(x, T[x].mes), "</td><td>").concat(f(x, T[x].rec), "</td></tr>")).join(""), "\n    </tbody></table></section>");
}
