var _a, _b;
const KEY = "watonql.v1";
let S;
try {
  S = JSON.parse(localStorage.getItem(KEY)) || {};
} catch {
  S = {};
}
S.days || (S.days = {});
S.custom || (S.custom = []);
S.weights || (S.weights = []);
S.combos || (S.combos = []);
S.myRoutines || (S.myRoutines = []);
const save = () => localStorage.setItem(KEY, JSON.stringify(S));
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s != null ? s : "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const R = Math.round;
const fmt = (n) => R(n).toLocaleString("es-CL");
const r1 = (n) => Math.round(n * 10) / 10;
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const TODAY = () => iso(/* @__PURE__ */ new Date());
const addDays = (s, n) => {
  const d = /* @__PURE__ */ new Date(s + "T12:00");
  d.setDate(d.getDate() + n);
  return iso(d);
};
const qtyTxt = (q) => ({ 0.5: "½", 1.5: "1½", 2.5: "2½" })[q] || String(q);
function dayLabel(d) {
  if (d === TODAY()) return "Hoy";
  if (d === addDays(TODAY(), -1)) return "Ayer";
  return (/* @__PURE__ */ new Date(d + "T12:00")).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 2200);
}
const chip = (label, on, action) => '<button class="chip '.concat(on ? "on" : "", '" onclick="').concat(action, '">').concat(label, "</button>");
function setOn(el) {
  el.parentNode.querySelectorAll(".chip").forEach((c) => c.classList.remove("on"));
  el == null ? void 0 : el.classList.add("on");
}
const head = (title, back) => '<div class="sheet-head">'.concat(back ? '<button class="x" onclick="'.concat(back, '">‹</button>') : "<span></span>", "<h3>").concat(title, '</h3><button class="x" onclick="closeSheet()">×</button></div>');
let cur = TODAY(), tab = "hoy";
const ACT = [
  { v: 1.2, l: "Sedentario", d: "Estudias/trabajas sentado, caminas poco" },
  { v: 1.3, l: "Algo activo", d: "Caminas un rato al día, tareas de casa" },
  { v: 1.45, l: "Activo", d: "Trabajo de pie o caminas mucho" },
  { v: 1.6, l: "Muy activo", d: "Trabajo físico pesado" }
];
const GOALS = [
  { v: -750, l: "Bajar grasa rápido", d: "≈ -0,7 kg/semana" },
  { v: -500, l: "Bajar grasa", d: "≈ -0,45 kg/semana" },
  { v: -250, l: "Bajar grasa suave", d: "≈ -0,25 kg/semana" },
  { v: 0, l: "Mantener / recomposición", d: "Comer lo que gastas" },
  { v: 250, l: "Ganar músculo (limpio)", d: "≈ +0,25 kg/semana" },
  { v: 450, l: "Ganar músculo", d: "≈ +0,4 kg/semana" }
];
const MEALS = [["des", "Desayuno", "☕"], ["alm", "Almuerzo", "🍛"], ["onc", "Once", "🫖"], ["cen", "Cena", "🌙"], ["sna", "Colaciones", "🍎"], ["car", "Carrete", "🍻"]];
const SIZES = [["Chico", 0.75], ["Normal", 1], ["Grande", 1.35]];
const bmr = (p) => 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === "m" ? 5 : -161);
const getDay = (d) => S.days[d] || { foods: [], ex: [] };
const ensureDay = (d) => {
  var _a2;
  return (_a2 = S.days)[d] || (_a2[d] = { foods: [], ex: [] });
};
const exK = (met, min, int = 1) => Math.max(0, met * int - 1) * S.profile.weight * min / 60;
let ADJ = null;
function calc(d, raw) {
  const p = S.profile, D = getDay(d);
  const adj = !raw && (ADJ == null ? void 0 : ADJ.ok) ? ADJ.adj : 0;
  const b = bmr(p), base = b * p.activity + adj;
  const ex = D.ex.reduce((a, e) => a + e.k, 0);
  const eat = { k: 0, p: 0, c: 0, f: 0 };
  D.foods.forEach((f) => {
    eat.k += f.k;
    eat.p += f.p;
    eat.c += f.c;
    eat.f += f.f;
  });
  const burn = base + ex, target = burn + p.goal;
  const left = target - eat.k;
  const ok = p.goal > 0 ? left <= 150 : left >= -100;
  return { b, base, adj, ex, burn, eat, target, left, ok, bal: eat.k - burn, D };
}
function goTab(t) {
  tab = t;
  render();
  window.scrollTo(0, 0);
}
function moveDay(n) {
  const d = addDays(cur, n);
  if (d > TODAY()) return;
  cur = d;
  render();
}
function openDay(d) {
  cur = d;
  goTab("hoy");
}
function render() {
  var _a2;
  if (!S.profile) tab = "perfil";
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $("#top").classList.toggle("hidden", tab !== "hoy");
  $("#dayLabel").textContent = dayLabel(cur);
  $("#nextDay").disabled = cur >= TODAY();
  ADJ = S.profile && S.profile.adapt !== false ? adaptive() : null;
  $("#view").innerHTML = { hoy: viewHoy, rutinas: viewRutinas, hist: viewHist, perfil: viewPerfil }[tab]();
  if (tab === "hist") {
    bindCharts();
    (_a2 = document.querySelector("#view .chips.scroll .chip.on")) == null ? void 0 : _a2.scrollIntoView({ inline: "center", block: "nearest" });
  }
}
function viewHoy() {
  const t = calc(cur), p = S.profile;
  const over = t.left < 0;
  const pct = Math.min(100, t.eat.k / Math.max(1, t.target) * 100);
  const goal = GOALS.find((g) => g.v === p.goal);
  const pG = R(p.weight * 1.8), fG = R(t.target * 0.27 / 9), cG = Math.max(0, R((t.target - pG * 4 - fG * 9) / 4));
  const macro = (l, v, g, cls) => '<div class="macro"><div class="row"><span>'.concat(l, '</span><span class="muted">').concat(R(v), " / ").concat(g, ' g</span></div><div class="bar thin ').concat(cls, '"><i style="width:').concat(Math.min(100, v / Math.max(1, g) * 100), '%"></i></div></div>');
  let h = '<section class="card hero">\n    <div class="big '.concat(over ? "neg" : "", '">').concat(fmt(Math.abs(t.left)), '</div>\n    <div class="muted">').concat(over ? "kcal por encima de tu meta" : "kcal te quedan para tu meta", '</div>\n    <div class="bar"><i class="').concat(over ? "over" : "", '" style="width:').concat(pct, '%"></i></div>\n    <div class="grid3">\n      <div><b>').concat(fmt(t.eat.k), "</b><span>Comido</span></div>\n      <div><b>").concat(fmt(t.burn), '</b><span>Gastado</span></div>\n      <div><b class="').concat(t.ok ? "pos" : "neg", '">').concat(t.bal > 0 ? "+" : "").concat(fmt(t.bal), "</b><span>").concat(t.bal <= 0 ? "Déficit" : "Superávit", '</span></div>\n    </div>\n    <p class="small muted">Gastado = tu cuerpo y vida diaria ').concat(fmt(t.base)).concat(t.adj ? " (incluye ajuste ".concat(t.adj > 0 ? "+" : "").concat(fmt(t.adj), " según tu peso real)") : "", " + ejercicio ").concat(fmt(t.ex), ".<br>Meta: ").concat(fmt(t.target), " kcal · ").concat(esc((goal == null ? void 0 : goal.l) || ""), '</p>\n  </section>\n  <section class="card">').concat(macro("Proteína", t.eat.p, pG, "p")).concat(macro("Carbohidratos", t.eat.c, cG, "c")).concat(macro("Grasas", t.eat.f, fG, "f"), "</section>");
  const daysLogged = Object.values(S.days).filter((D) => D.foods.length).length;
  const sinceBk = S.lastBackup ? dayDiff(S.lastBackup, TODAY()) : null;
  if (daysLogged >= 3 && (sinceBk === null || sinceBk >= 7)) {
    h += '<section class="card warn"><div class="row"><div class="grow">💾 '.concat(sinceBk === null ? "Aún no respaldas tus datos" : "Hace ".concat(sinceBk, " días que no respaldas"), '<div class="small muted">Si borras el navegador o cambias de celular, se pierden.</div></div><button class="btn sm" onclick="exportData()">Respaldar</button></div></section>');
  }
  MEALS.forEach(([id, name, ic]) => {
    const items = t.D.foods.map((f, i) => [f, i]).filter(([f]) => f.meal === id);
    const sum = items.reduce((a, [f]) => a + f.k, 0);
    const prev = lastMeal(id);
    const nDr = id === "car" ? items.reduce((a, [f]) => {
      var _a2;
      return a + (isDrink(f) ? (_a2 = f.dr) != null ? _a2 : 1 : 0);
    }, 0) : 0;
    h += '<section class="card"><div class="row"><h3>'.concat(ic, " ").concat(name, '</h3><span class="muted">').concat(nDr ? "".concat(fmt(nDr), " trago").concat(nDr > 1 ? "s" : "", " · ") : "").concat(fmt(sum), " kcal</span></div>\n      ").concat(items.map(([f, i]) => '<div class="item"><div class="grow"><div>'.concat(esc(f.n), '</div><div class="small muted">').concat(esc(f.q), '</div></div><div class="kc">').concat(fmt(f.k), '</div><button class="x" onclick="delFood(').concat(i, ')" aria-label="Eliminar">×</button></div>')).join(""), '\n      <button class="add" onclick="openFood(\'').concat(id, "')\">+ Agregar</button>\n      ").concat(prev || items.length ? '<div class="actions">\n        '.concat(prev ? "<button onclick=\"repeatMeal('".concat(id, "','").concat(prev.d, "')\">↺ Repetir ").concat(prev.d === addDays(cur, -1) ? "de ayer" : "del " + dayLabel(prev.d), " · ").concat(fmt(prev.k), " kcal</button>") : "", "\n        ").concat(items.length ? "<button onclick=\"saveCombo('".concat(id, "')\">⭐ Guardar combo</button>") : "", "</div>") : "", "</section>");
  });
  h += '<section class="card"><div class="row"><h3>🏃 Ejercicio</h3><span class="muted">'.concat(fmt(t.ex), " kcal</span></div>\n    ").concat(t.D.ex.map((e, i) => '<div class="item"><div class="grow"><div>'.concat(esc(e.n), '</div><div class="small muted">').concat(esc(exDesc(e)), '</div></div><div class="kc pos">-').concat(fmt(e.k), '</div><button class="x" onclick="delEx(').concat(i, ')" aria-label="Eliminar">×</button></div>')).join(""), '\n    <div class="row gap"><button class="add" onclick="openEx()">+ Agregar ejercicio</button><button class="add" onclick="goTab(\'rutinas\')">💪 Rutinas</button></div></section>');
  return h;
}
function delFood(i) {
  getDay(cur).foods.splice(i, 1);
  save();
  render();
}
function lastMeal(meal) {
  var _a2;
  for (let i = 1; i <= 14; i++) {
    const d = addDays(cur, -i), items = (((_a2 = S.days[d]) == null ? void 0 : _a2.foods) || []).filter((f) => f.meal === meal);
    if (items.length) return { d, items, k: items.reduce((a, f) => a + f.k, 0) };
  }
  return null;
}
function addItems(items, meal) {
  const D = ensureDay(cur);
  items.forEach(({ meal: _, ...f }) => D.foods.push({ ...f, meal }));
  save();
  render();
  toast("Agregado: ".concat(fmt(items.reduce((a, f) => a + f.k, 0)), " kcal"));
}
function repeatMeal(meal, d) {
  addItems(S.days[d].foods.filter((f) => f.meal === meal), meal);
}
function saveCombo(meal) {
  const items = getDay(cur).foods.filter((f) => f.meal === meal);
  const name = prompt("Nombre del combo", "Mi ".concat(MEALS.find((m) => m[0] === meal)[1].toLowerCase()));
  if (!(name == null ? void 0 : name.trim())) return;
  S.combos.unshift({ id: "k" + Date.now(), n: name.trim(), items: items.map(({ meal: _, ...f }) => f) });
  save();
  toast("Combo guardado ⭐");
}
function addCombo(id) {
  const c = S.combos.find((x) => x.id === id);
  closeSheet();
  addItems(c.items, fMeal);
}
function delCombo(id) {
  if (!confirm("¿Eliminar este combo?")) return;
  S.combos = S.combos.filter((x) => x.id !== id);
  save();
  foodList();
}
function comboRow(c) {
  const k = c.items.reduce((a, f) => a + f.k, 0);
  return '<div class="item"><button class="grow btnitem plain" onclick="addCombo(\''.concat(c.id, "')\"><div>⭐ ").concat(esc(c.n), '</div><div class="small muted">').concat(esc(c.items.map((f) => f.n).join(", ")), '</div></button><div class="kc">').concat(fmt(k), '</div><button class="x" onclick="delCombo(\'').concat(c.id, '\')" aria-label="Eliminar combo">×</button></div>');
}
function delEx(i) {
  getDay(cur).ex.splice(i, 1);
  save();
  render();
}
let sheetCleanup = null;
function runCleanup() {
  if (sheetCleanup) {
    const f = sheetCleanup;
    sheetCleanup = null;
    f();
  }
}
function openSheet(html) {
  runCleanup();
  $("#sheetBody").innerHTML = html;
  $("#sheet").classList.remove("hidden");
  $("#sheetBody").scrollTop = 0;
}
function closeSheet() {
  runCleanup();
  $("#sheet").classList.add("hidden");
}
let fMeal = "alm", pick = null;
const allFoods = () => [...S.custom, ...FOODS];
const findFood = (id) => allFoods().find((f) => f.id === id);
const portions = (f) => [[f.u, 1], ...f.alt || []];
function defaultMeal() {
  const h = (/* @__PURE__ */ new Date()).getHours();
  return h < 11 ? "des" : h < 16 ? "alm" : h < 20 ? "onc" : h < 23 ? "cen" : "sna";
}
let fCat = null;
const mealName = (m) => MEALS.find((x) => x[0] === m)[1];
function openFood(meal) {
  if ($("#sheet").classList.contains("hidden") || meal && meal !== fMeal) fCat = null;
  fMeal = meal || defaultMeal();
  const cats = [[null, "✨ Para ".concat(mealName(fMeal).toLowerCase())], ...S.custom.length ? [["mine", "⭐ Mis alimentos"]] : [], ...FOOD_CATS];
  openSheet(head("Agregar a ".concat(mealName(fMeal).toLowerCase())) + '\n    <input id="q" type="search" placeholder="Buscar: arroz, pollo, pizza…" oninput="foodList()" autocomplete="off">\n    <div class="row gap tri"><button class="btn sec" onclick="openScan()">📷 Código</button><button class="btn sec" onclick="openCalc()">🧮 Por gramos</button><button class="btn sec" onclick="customForm()">✏️ Crear</button></div>\n    <div class="chips scroll">'.concat(cats.map(([k, l]) => chip(l, k === fCat, "setCat(".concat(k === null ? "null" : "'".concat(k.replace(/"/g, "&quot;"), "'"), ",this)"))).join(""), '</div>\n    <div id="flist"></div>'));
  foodList();
}
function setCat(k, el) {
  fCat = k;
  setOn(el);
  $("#q").value = "";
  foodList();
  $("#flist").scrollIntoView({ block: "nearest" });
}
function recents(meal) {
  const seen = /* @__PURE__ */ new Set(), out = [];
  Object.keys(S.days).sort().reverse().forEach((d) => S.days[d].foods.slice().reverse().forEach((f) => {
    if (f.ref && f.meal === meal && !seen.has(f.ref)) {
      seen.add(f.ref);
      const x = findFood(f.ref);
      if (x) out.push(x);
    }
  }));
  return out.slice(0, 10);
}
const catLabel = (k) => FOOD_CATS.find((c) => c[0] === k)[1];
function foodRow(f) {
  var _a2;
  return '<button class="item btnitem" onclick="pickFood(\''.concat(f.id, '\')"><div class="grow"><div>').concat(esc(f.n)).concat(f.id[0] === "c" ? ' <span class="tag">mío</span>' : "").concat(((_a2 = f.sellos) == null ? void 0 : _a2.length) ? ' <span class="tag sel">⬣ '.concat(f.sellos.length, " sello").concat(f.sellos.length > 1 ? "s" : "", "</span>") : "", '</div><div class="small muted">').concat(f.per100 ? "por 100 ".concat(f.per100) : "1 " + esc(f.u), '</div></div><div class="kc">').concat(fmt(f.k), "</div></button>");
}
function foodList() {
  const q = norm($("#q").value.trim());
  let h = "";
  if (!q && fCat === "mine") {
    h = S.custom.map(foodRow).join("");
  } else if (!q && fCat) {
    h = LIST_FOODS.filter((f) => f.cat === fCat).map(foodRow).join("");
  } else if (!q) {
    if (S.combos.length) h += '<div class="label">Mis combos · se agregan completos</div>' + S.combos.map(comboRow).join("");
    const rec = recents(fMeal);
    if (rec.length) h += '<div class="label">Lo que sueles comer en '.concat(mealName(fMeal).toLowerCase(), "</div>") + rec.map(foodRow).join("");
    MEAL_CATS[fMeal].forEach((k) => {
      h += '<div class="label">'.concat(catLabel(k), "</div>") + LIST_FOODS.filter((f) => f.cat === k).map(foodRow).join("");
    });
    h += '<p class="small muted center">¿No está? Búscalo arriba o elige otra categoría.</p>';
  } else {
    const words = q.split(/\s+/);
    const combos = S.combos.filter((c) => words.every((w) => norm(c.n).includes(w)));
    const list = [...S.custom, ...LIST_FOODS].filter((f) => {
      const t = norm(f.n + " " + (f.syn || ""));
      return words.every((w) => t.includes(w));
    });
    h = combos.length || list.length ? combos.map(comboRow).join("") + list.map(foodRow).join("") : '<p class="muted">No lo encontré. <a href="#" onclick="customForm(); return false">Créalo o ingresa las kcal directo</a>.</p>';
  }
  $("#flist").innerHTML = h;
}
function pickFood(id) {
  const f = findFood(id);
  const drink = f.cat === "Copete";
  pick = { f, por: 0, qty: 1, size: 1, lvl: 1, gr: 100, zero: !!(f.zero && S.lastZero) };
  const grams = f.per100 ? '\n    <div class="label">¿Cuántos '.concat(f.per100 === "ml" ? "ml" : "gramos", '?</div>\n    <div class="chips">').concat([50, 100, 150, 200, 250, 300].map((g) => chip(g + " " + f.per100, g === 100, "setPick('gr',".concat(g, ",this)"))).join(""), '<input type="number" class="mini" placeholder="otro" inputmode="numeric" oninput="this.parentNode.querySelectorAll(\'.chip\').forEach(c=>c.classList.remove(\'on\'));setPick(\'gr\',+this.value||0)"></div>') : "";
  const qtyChips = (drink ? [1, 2, 3, 4, 5] : [0.5, 1, 1.5, 2, 3]).map((q) => chip(qtyTxt(q), q === 1, "setPick('qty',".concat(q, ",this)"))).join("");
  openSheet(head(esc(f.n), "openFood(fMeal)") + sellosHtml(f) + (f.per100 ? grams : f.q ? '\n    <div class="label">¿Cuánto comiste? (al ojo)</div>\n    <div class="chips lv">'.concat(QTY_TYPES[f.q[0]].map(([l, , d], i) => chip("".concat(l, "<small>").concat(d, "</small>"), i === 1, "setPick('lvl',".concat(i, ",this)"))).join(""), "</div>") : "\n    ".concat(f.zero ? '<div class="label">¿La bebida fue zero?</div><div class="chips">'.concat(chip("Bebida normal", !pick.zero, "setPick('zero',false,this)")).concat(chip("Zero / light", pick.zero, "setPick('zero',true,this)"), "</div>") : "", '\n    <div class="label">').concat(drink ? "Tamaño" : "Porción", '</div><div class="chips">').concat(portions(f).map(([u], i) => chip(esc(u), !i, "setPick('por',".concat(i, ",this)"))).join(""), '</div>\n    <div class="label">').concat(drink ? "¿Cuántos?" : "Cantidad", '</div><div class="chips">').concat(qtyChips, '<input type="number" class="mini" min="0" step="0.5" placeholder="otra" inputmode="decimal" oninput="this.parentNode.querySelectorAll(\'.chip\').forEach(c=>c.classList.remove(\'on\'));setPick(\'qty\',+this.value||0)"></div>\n    ').concat(drink || f.code ? "" : '<div class="label">Tamaño (al ojo)</div><div class="chips">'.concat(SIZES.map(([l, v]) => chip(l, v === 1, "setPick('size',".concat(v, ",this)"))).join(""), "</div>"))) + '\n    <div class="label">Comida</div><div class="chips">'.concat(MEALS.map(([m, l]) => chip(l, m === fMeal, "fMeal='".concat(m, "';setOn(this)"))).join(""), '</div>\n    <div class="preview" id="pv"></div>\n    <button class="btn" onclick="addPicked()">Agregar</button>\n    ').concat(f.id[0] === "c" ? '<button class="btn ghost" onclick="delCustom(\''.concat(f.id, "')\">Eliminar de mis alimentos</button>") : ""));
  pv();
}
function setPick(k, v, el) {
  pick[k] = v;
  if (el) setOn(el);
  pv();
}
const pickMult = () => pick.f.per100 ? pick.gr / 100 : pick.f.q ? QTY_TYPES[pick.f.q[0]][pick.lvl][1] / pick.f.q[1] : portions(pick.f)[pick.por][1] * pick.qty * pick.size;
const pickBase = () => pick.zero && pick.f.zero ? { ...pick.f, ...pick.f.zero } : pick.f;
function pv() {
  const f = pickBase(), m = pickMult();
  $("#pv").innerHTML = "<b>".concat(fmt(f.k * m), " kcal</b><span>P ").concat(R(f.p * m), " g · C ").concat(R(f.c * m), " g · G ").concat(R(f.f * m), " g</span>");
}
function addPicked() {
  const f = pickBase(), m = pickMult();
  if (!m) return toast("Elige una cantidad");
  let q;
  if (f.per100) q = "".concat(pick.gr, " ").concat(f.per100);
  else if (f.q) {
    const [l, , d] = QTY_TYPES[f.q[0]][pick.lvl];
    q = "".concat(l, " · ").concat(d);
  } else {
    const size = SIZES.find((s) => s[1] === pick.size)[0];
    q = "".concat(qtyTxt(pick.qty), " ").concat(portions(f)[pick.por][0]).concat(pick.size !== 1 ? " · " + size.toLowerCase() : "");
  }
  const entry = { ref: f.id, n: f.n + (pick.zero && f.zero ? " (zero)" : ""), meal: fMeal, q, k: R(f.k * m), p: r1(f.p * m), c: r1(f.c * m), f: r1(f.f * m) };
  if (f.cat === "Copete") entry.dr = pick.qty;
  if (f.zero) S.lastZero = pick.zero;
  ensureDay(cur).foods.push(entry);
  save();
  closeSheet();
  render();
  toast("Agregado: ".concat(fmt(f.k * m), " kcal"));
}
const isDrink = (e) => {
  var _a2;
  return e.dr != null || ((_a2 = findFood(e.ref)) == null ? void 0 : _a2.cat) === "Copete";
};
function drinksBetween(from, to) {
  var _a2;
  let n = 0, k = 0, days = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const ds = (((_a2 = S.days[d]) == null ? void 0 : _a2.foods) || []).filter(isDrink);
    if (ds.length) days++;
    ds.forEach((e) => {
      var _a3;
      n += (_a3 = e.dr) != null ? _a3 : 1;
      k += e.k;
    });
  }
  return { n, k, days };
}
function drinksCard() {
  const t = TODAY(), w = drinksBetween(addDays(t, -6), t), m = drinksBetween(addDays(t, -29), t);
  if (!m.n) return "";
  return '<section class="card"><h3>🍻 Contador de copete</h3>\n    <table class="tot"><thead><tr><th></th><th>Tragos</th><th>kcal</th><th>Días</th></tr></thead><tbody>\n      <tr><td>Últimos 7 días</td><td>'.concat(fmt(w.n), "</td><td>").concat(fmt(w.k), "</td><td>").concat(w.days, "</td></tr>\n      <tr><td>Últimos 30 días</td><td>").concat(fmt(m.n), "</td><td>").concat(fmt(m.k), "</td><td>").concat(m.days, '</td></tr></tbody></table>\n    <p class="small muted">').concat(w.k ? "El copete de esta semana equivale a ~".concat(fmt(w.k / 270), " marraquetas.") : "", "</p></section>");
}
function delCustom(id) {
  if (!confirm("¿Eliminar este alimento de tu lista? (Lo ya registrado no se borra)")) return;
  S.custom = S.custom.filter((f) => f.id !== id);
  save();
  openFood(fMeal);
}
function customForm(name = "", code = "") {
  openSheet(head("Crear alimento", "openFood(fMeal)") + "\n    ".concat(code ? '<p class="small muted">No encontré el código '.concat(esc(code), ". Créalo a mano y quedará guardado.</p>") : '<p class="small muted">Si no sabes los macros, pon solo las kcal (mira la etiqueta o estima).</p>', '\n    <label class="fl">Nombre<input id="cn" value="').concat(esc(name), '" placeholder="Ej: Sándwich de mi casa"></label>\n    <label class="fl">Porción<input id="cu" value="porción" placeholder="plato, unidad, vaso…"></label>\n    <div class="grid2">\n      <label class="fl">kcal *<input id="ck" type="number" inputmode="decimal"></label>\n      <label class="fl">Proteína g<input id="cp" type="number" inputmode="decimal"></label>\n      <label class="fl">Carbohidratos g<input id="cc" type="number" inputmode="decimal"></label>\n      <label class="fl">Grasas g<input id="cf" type="number" inputmode="decimal"></label>\n    </div>\n    <label class="check"><input id="csave" type="checkbox" checked> Guardar en mis alimentos</label>\n    <button class="btn" onclick="saveCustom(\'').concat(esc(code), "')\">Agregar a ").concat(MEALS.find((m) => m[0] === fMeal)[1].toLowerCase(), "</button>"));
  $("#cn").focus();
}
function saveCustom(code) {
  const n = $("#cn").value.trim(), k = +$("#ck").value;
  if (!n || !(k >= 0) || $("#ck").value === "") return toast("Pon nombre y kcal");
  const f = { id: "c" + Date.now(), n, u: $("#cu").value.trim() || "porción", k, p: +$("#cp").value || 0, c: +$("#cc").value || 0, f: +$("#cf").value || 0, alt: [], syn: "" };
  if (code) f.code = code;
  if ($("#csave").checked) S.custom.unshift(f);
  ensureDay(cur).foods.push({ ref: $("#csave").checked ? f.id : null, n, meal: fMeal, q: "1 " + f.u, k: R(k), p: f.p, c: f.c, f: f.f });
  save();
  closeSheet();
  render();
  toast("Agregado");
}
function loadScript(src) {
  return new Promise((ok, ko) => {
    if (window.Html5Qrcode) return ok();
    const s = document.createElement("script");
    s.src = src;
    s.onload = ok;
    s.onerror = ko;
    document.head.appendChild(s);
  });
}
async function openScan() {
  openSheet(head("Escanear código", "openFood(fMeal)") + '\n    <div id="reader"></div><p class="small muted" id="scanMsg">Abriendo cámara…</p>\n    <div class="row gap"><input id="code" inputmode="numeric" placeholder="o escribe el número del código"><button class="btn sm" onclick="lookup($(\'#code\').value.trim())">Buscar</button></div>');
  let sc = null, stopped = false;
  const stop = () => {
    stopped = true;
    if (sc) sc.stop().catch(() => {
    });
  };
  sheetCleanup = stop;
  try {
    await loadScript("lib/html5-qrcode.min.js");
    if (stopped) return;
    const F = Html5QrcodeSupportedFormats;
    sc = new Html5Qrcode("reader", { formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E], verbose: false, experimentalFeatures: { useBarCodeDetectorIfSupported: true } });
    await sc.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 260, height: 130 } }, (txt) => {
      if (!stopped) {
        stop();
        lookup(txt);
      }
    }, () => {
    });
    if (stopped) sc.stop().catch(() => {
    });
    else $("#scanMsg").textContent = "Apunta al código de barras del envase.";
  } catch (e) {
    const m = $("#scanMsg");
    if (m) m.textContent = "No pude abrir la cámara (requiere permiso y HTTPS). Escribe el número abajo.";
  }
}
async function lookup(code) {
  var _a2;
  if (!/^\d{6,14}$/.test(code)) return toast("Código inválido");
  const local = S.custom.find((f) => f.code === code);
  if (local) return pickFood(local.id);
  openSheet(head("Buscando…", "openFood(fMeal)") + '<p class="muted">Consultando Open Food Facts…</p>');
  try {
    const r = await fetch("https://world.openfoodfacts.org/api/v2/product/".concat(code, ".json?fields=product_name,product_name_es,brands,nutriments,serving_quantity,product_quantity,product_quantity_unit,quantity"));
    const P = (await r.json()).product, N = (P == null ? void 0 : P.nutriments) || {};
    const k100 = (_a2 = N["energy-kcal_100g"]) != null ? _a2 : N["energy_100g"] != null ? N["energy_100g"] / 4.184 : null;
    if (!P || k100 == null) throw new Error("sin datos");
    const sq = +P.serving_quantity || 0, pq = +P.product_quantity || 0;
    const base = sq || pq || 100, b = base / 100;
    const alt = [];
    if (sq && pq > sq) alt.push(["envase completo (".concat(pq, " g)"), pq / sq]);
    if (base !== 100) alt.push(["100 g", 100 / base]);
    const name = (P.product_name_es || P.product_name || "Producto " + code) + (P.brands ? " · " + P.brands.split(",")[0] : "");
    const f = {
      id: "c" + Date.now(),
      code,
      n: name,
      syn: "",
      alt,
      sellos: sellosChile(P, N, k100),
      u: sq ? "porción (".concat(sq, " g)") : pq ? "envase (".concat(pq, " g)") : "100 g",
      k: R(k100 * b),
      p: r1((N.proteins_100g || 0) * b),
      c: r1((N.carbohydrates_100g || 0) * b),
      f: r1((N.fat_100g || 0) * b)
    };
    S.custom.unshift(f);
    save();
    pickFood(f.id);
  } catch {
    customForm("", code);
  }
}
function sellosChile(P, N, k100) {
  const liquid = /^(ml|cl|l)$/i.test(P.product_quantity_unit || "") || /\d\s*(ml|cc|cl|l)\b/i.test(P.quantity || "");
  const L = liquid ? { k: 70, na: 100, az: 5, gs: 3 } : { k: 275, na: 400, az: 10, gs: 4 };
  const s = [];
  if (k100 > L.k) s.push("CALORÍAS");
  if ((N.sugars_100g || 0) > L.az) s.push("AZÚCARES");
  if ((N["saturated-fat_100g"] || 0) > L.gs) s.push("GRASAS SATURADAS");
  if ((N.sodium_100g || 0) * 1e3 > L.na) s.push("SODIO");
  return s;
}
function sellosHtml(f) {
  if (!f.sellos) return "";
  return f.sellos.length ? '<div class="sellos">'.concat(f.sellos.map((s) => '<div class="sello">ALTO EN<b>'.concat(s, "</b></div>")).join(""), '</div><p class="small muted center">Sellos estimados con los valores por 100 g/ml del producto.</p>') : '<p class="small muted center">✓ Sin sellos "ALTO EN" según sus valores por 100 g/ml.</p>';
}
let exPick = null;
function openEx() {
  openSheet(head("Agregar ejercicio") + '\n    <div class="label">💪 Por repeticiones y series (desliza)</div>\n    <div class="chips scroll">'.concat(REPEX.map((e) => chip(esc(e.n), false, "openQuick('".concat(e.x, "')"))).join(""), '</div>\n    <div class="label">⏱️ Por tiempo</div>\n    <input id="qe" type="search" placeholder="Buscar: caminar, pichanga, bici…" oninput="exList()" autocomplete="off">\n    <div id="elist"></div>\n    <div class="label">¿Te lo midió un reloj o app? Ingresa las kcal directo</div>\n    <div class="row gap"><input id="exn" placeholder="Actividad"><input id="exk" type="number" class="mini" placeholder="kcal" inputmode="numeric"><button class="btn sm" onclick="addExManual()">+</button></div>'));
  exList();
}
function exList() {
  const q = norm($("#qe").value.trim());
  $("#elist").innerHTML = EXERCISES.filter((e) => norm(e.n).includes(q)).map((e) => '<button class="item btnitem" onclick="pickEx(\''.concat(e.id, '\')"><div class="grow">').concat(esc(e.n), '</div><div class="small muted">').concat(fmt(exK(e.met, 30)), " kcal / 30 min</div></button>")).join("");
}
function pickEx(id) {
  const e = EXERCISES.find((x) => x.id === id);
  if (PACE[e.n]) return pickDist(e);
  exPick = { e, min: 30, int: 1 };
  openSheet(head(esc(e.n), "openEx()") + '\n    <div class="label">Minutos</div><div class="chips">'.concat([10, 15, 20, 30, 45, 60].map((m) => chip(m, m === 30, "exSet('min',".concat(m, ",this)"))).join(""), '<input type="number" class="mini" placeholder="otro" inputmode="numeric" oninput="this.parentNode.querySelectorAll(\'.chip\').forEach(c=>c.classList.remove(\'on\'));exSet(\'min\',+this.value||0)"></div>\n    <div class="label">Intensidad</div><div class="chips">').concat([["Suave", 0.8], ["Moderada", 1], ["Intensa", 1.2]].map(([l, v]) => chip(l, v === 1, "exSet('int',".concat(v, ",this)"))).join(""), '</div>\n    <div class="preview" id="epv"></div>\n    <button class="btn" onclick="addEx()">Agregar</button>'));
  epv();
}
function exSet(k, v, el) {
  exPick[k] = v;
  if (el) setOn(el);
  epv();
}
function epv() {
  $("#epv").innerHTML = "<b>".concat(fmt(exK(exPick.e.met, exPick.min, exPick.int)), " kcal</b><span>quemadas extra (aprox.)</span>");
}
function addEx() {
  if (!exPick.min) return toast("Pon los minutos");
  const k = R(exK(exPick.e.met, exPick.min, exPick.int));
  ensureDay(cur).ex.push({ n: exPick.e.n, min: exPick.min, k });
  save();
  closeSheet();
  render();
  toast("Ejercicio: -".concat(k, " kcal"));
}
function addExManual() {
  const n = $("#exn").value.trim() || "Actividad", k = +$("#exk").value;
  if (!(k > 0)) return toast("Pon las kcal");
  ensureDay(cur).ex.push({ n, min: 0, k: R(k) });
  save();
  closeSheet();
  render();
}
function viewRutinas() {
  return '<h2>Ejercicio en casa</h2>\n    <div class="row gap"><button class="btn" onclick="openRepList()">+ Registrar repeticiones</button><button class="btn sec" onclick="newRoutine()">➕ Crear rutina</button></div>\n    '.concat(exHistoryCard(), "\n    ").concat(totalsCard(), "\n    ").concat(S.myRoutines.length ? '<h3 class="sec-title">Mis rutinas</h3>' + S.myRoutines.map((r) => {
    const s = routineStats(r);
    return '<button class="card rcard" onclick="openMyRoutine(\''.concat(r.id, '\')"><span class="emoji">🏋️</span><div class="grow"><b>').concat(esc(r.n), '</b><div class="small muted">').concat(esc(r.items.map((it) => repex(it.x).n).join(", ")), '</div><div class="small muted">').concat(s.sets, " series · ~").concat(s.min, " min · ≈ ").concat(fmt(s.k), ' kcal</div></div><span class="muted">›</span></button>');
  }).join("") : "", '\n    <h3 class="sec-title">Rutinas sugeridas</h3><p class="small muted">Sin equipamiento. Toca una para ver los ejercicios y registrarla.</p>') + ROUTINES.map((r) => '<button class="card rcard" onclick="openRoutine(\''.concat(r.id, '\')"><span class="emoji">').concat(r.emoji, '</span><div class="grow"><b>').concat(r.n, '</b><div class="small muted">').concat(r.min, " min · ≈ ").concat(fmt(exK(r.met, r.min)), ' kcal</div></div><span class="muted">›</span></button>')).join("");
}
function openRoutine(id) {
  const r = ROUTINES.find((x) => x.id === id);
  openSheet(head(r.emoji + " " + r.n) + '\n    <p class="muted">'.concat(esc(r.desc), '</p>\n    <div class="label">Ejercicios · toca para ver cómo se hace</div>\n    ').concat(r.items.map(([t, x]) => {
    var _a2;
    return '<details class="exd"><summary>'.concat(esc(t), "</summary>").concat(exImg(x), '<p class="small">').concat(esc(((_a2 = EXINFO[x]) == null ? void 0 : _a2.es) || ""), "</p></details>");
  }).join(""), '\n    <button class="btn" onclick="startTimer(\'').concat(id, '\')">▶️ Empezar con temporizador</button>\n    <div class="label">¿Ya la hiciste sin temporizador?</div>\n    <label class="fl">Minutos que hiciste<input id="rmin" type="number" inputmode="numeric" value="').concat(r.min, "\" oninput=\"$('#rpv').innerHTML='<b>'+fmt(exK(").concat(r.met, ',+this.value||0))+\' kcal</b><span>quemadas extra (aprox.)</span>\'"></label>\n    <div class="preview" id="rpv"><b>').concat(fmt(exK(r.met, r.min)), ' kcal</b><span>quemadas extra (aprox.)</span></div>\n    <button class="btn sec full" onclick="logRoutine(\'').concat(id, "')\">✅ La hice · registrar en ").concat(dayLabel(cur).toLowerCase(), "</button>"));
}
function logRoutine(id) {
  const r = ROUTINES.find((x) => x.id === id), min = +$("#rmin").value;
  if (!(min > 0)) return toast("Pon los minutos");
  const k = R(exK(r.met, min));
  ensureDay(cur).ex.push({ n: "Rutina: " + r.n, min, k, items: presetItems(r) });
  save();
  closeSheet();
  toast("¡Bien! -".concat(k, " kcal"));
  openDay(cur);
}
const HR_OPTS = [["7", "7 días"], ["14", "14 días"], ["30", "30 días"], ["90", "3 meses"], ["all", "Todo"], ["custom", "📅 Elegir fechas"]];
const HR = { p: "7", from: null, to: null };
function setHR(v, el) {
  HR.p = v;
  if (v === "custom" && !HR.from) {
    HR.from = addDays(TODAY(), -13);
    HR.to = TODAY();
  }
  render();
}
function histRange() {
  const t = TODAY();
  if (HR.p === "all") return { from: Object.keys(S.days).sort()[0] || t, to: t };
  if (HR.p === "custom") {
    const a = HR.from || t, b = HR.to || t;
    return a <= b ? { from: a, to: b } : { from: b, to: a };
  }
  return { from: addDays(t, -(+HR.p - 1)), to: t };
}
function viewHist() {
  var _a2;
  const days = [];
  for (let i = 0; i < 30; i++) {
    const d = addDays(TODAY(), -i);
    const D = S.days[d];
    if (D && (D.foods.length || D.ex.length)) days.push(d);
  }
  const { from, to } = histRange();
  const span = [];
  for (let d = from; d <= to; d = addDays(d, 1)) if ((_a2 = S.days[d]) == null ? void 0 : _a2.foods.length) span.push(d);
  const T = span.map((d) => calc(d)), n = span.length || 1;
  const wb = T.reduce((a, t) => a + t.bal, 0);
  const W = weightTrend().reverse();
  let h = '<h2>Historial</h2>\n    <div class="chips scroll">'.concat(HR_OPTS.map(([v, l]) => chip(l, v === HR.p, "setHR('".concat(v, "',this)"))).join(""), "</div>\n    ").concat(HR.p === "custom" ? '<div class="row gap"><label class="fl">Desde<input type="date" value="'.concat(from, '" max="').concat(TODAY(), '" onchange="HR.from=this.value;render()"></label><label class="fl">Hasta<input type="date" value="').concat(to, '" max="').concat(TODAY(), '" onchange="HR.to=this.value;render()"></label></div>') : "", '\n    <section class="card hero">\n      <div class="muted">').concat(HR.p === "custom" || HR.p === "all" ? "".concat(shortDate(from), " – ").concat(shortDate(to)) : HR_OPTS.find((o) => o[0] === HR.p)[1].replace(/^(\d)/, "Últimos $1"), " · ").concat(span.length, " día").concat(span.length === 1 ? "" : "s", ' con comidas registradas</div>\n      <div class="big ').concat(wb <= 0 ? "" : "neg", '">').concat(wb > 0 ? "+" : "").concat(fmt(wb), '</div>\n      <div class="muted">kcal de balance ≈ ').concat(wb > 0 ? "+" : "").concat((wb / 7700).toFixed(2).replace(".", ","), " kg de grasa</div>\n      ").concat(span.length ? '<div class="grid3"><div><b>'.concat(fmt(T.reduce((a, t) => a + t.eat.k, 0) / n), "</b><span>Comiste / día</span></div><div><b>").concat(fmt(T.reduce((a, t) => a + t.burn, 0) / n), '</b><span>Gastaste / día</span></div><div><b class="').concat(wb <= 0 ? "pos" : "neg", '">').concat(wb > 0 ? "+" : "").concat(fmt(wb / n), "</b><span>Balance / día</span></div></div>") : "", '\n    </section>\n    <section class="card"><h3>Balance diario (14 días)</h3>').concat(chartBalance(), "</section>\n    ").concat(drinksCard(), '\n    <section class="card"><h3>Peso (60 días)</h3>').concat(chartWeight(), '\n      <p class="small muted">🧠 Gasto real: ').concat(esc(adaptiveText(ADJ)), '</p></section>\n    <section class="card"><h3>Días</h3>').concat(days.length ? days.map((d) => {
    const t = calc(d);
    return '<button class="item btnitem" onclick="openDay(\''.concat(d, '\')"><div class="grow"><div>').concat(dayLabel(d), '</div><div class="small muted">Comido ').concat(fmt(t.eat.k), " · Gastado ").concat(fmt(t.burn), '</div></div><div class="kc ').concat(t.ok ? "pos" : "neg", '">').concat(t.bal > 0 ? "+" : "").concat(fmt(t.bal), " ").concat(t.ok ? "✓" : "", "</div></button>");
  }).join("") : '<p class="muted">Aún no hay registros.</p>', '</section>\n    <section class="card"><h3>⚖️ Peso</h3>\n      <div class="row gap"><input id="wkg" type="number" step="0.1" inputmode="decimal" placeholder="Peso de hoy (kg)"><button class="btn sm" onclick="addWeight()">Registrar</button></div>\n      ').concat(W.slice(0, 15).map((w, i) => {
    const prev = W[i + 1];
    const df = prev ? w.kg - prev.kg : 0;
    return '<div class="item"><div class="grow">'.concat(dayLabel(w.d), '<div class="small muted">tendencia ').concat(w.t.toFixed(1).replace(".", ","), ' kg</div></div><div class="kc">').concat(String(w.kg).replace(".", ","), " kg ").concat(prev ? '<span class="small '.concat(df <= 0 ? "pos" : "neg", '">').concat(df > 0 ? "+" : "").concat(df.toFixed(1).replace(".", ","), "</span>") : "", "</div></div>");
  }).join(""), '\n      <p class="small muted">El peso varía 1-2 kg de un día a otro por agua y comida: guíate por la tendencia. Pésate idealmente en ayunas, 3+ veces por semana.</p>\n    </section>');
  return h;
}
function addWeight() {
  const kg = +$("#wkg").value;
  if (!(kg > 25 && kg < 400)) return toast("Peso inválido");
  setWeight(kg);
  save();
  render();
  toast("Peso registrado");
}
function setWeight(kg) {
  const d = TODAY();
  S.weights = S.weights.filter((w) => w.d !== d);
  S.weights.push({ d, kg });
  S.profile.weight = kg;
}
function viewPerfil() {
  const first = !S.profile;
  const p = S.profile || { sex: "m", age: "", height: "", weight: "", activity: 1.2, goal: -500 };
  let h = first ? '<section class="card hero"><div class="big">👋</div><p>Completa tus datos para calcular cuánto gastas al día.</p></section>' : "<h2>Perfil</h2>";
  h += '<section class="card">\n    <div class="label">Sexo</div><div class="chips">'.concat(chip("Hombre", p.sex === "m", "pSex='m';setOn(this)")).concat(chip("Mujer", p.sex === "f", "pSex='f';setOn(this)"), '</div>\n    <div class="grid3">\n      <label class="fl">Edad<input id="pa" type="number" inputmode="numeric" value="').concat(p.age, '"></label>\n      <label class="fl">Altura (cm)<input id="ph" type="number" inputmode="numeric" value="').concat(p.height, '"></label>\n      <label class="fl">Peso (kg)<input id="pw" type="number" step="0.1" inputmode="decimal" value="').concat(p.weight, '"></label>\n    </div>\n    <label class="fl">Actividad diaria <span class="muted small">(sin contar ejercicio, ese se suma aparte)</span>\n      <select id="pact">').concat(ACT.map((a) => '<option value="'.concat(a.v, '" ').concat(a.v === p.activity ? "selected" : "", ">").concat(a.l, " — ").concat(a.d, "</option>")).join(""), '</select></label>\n    <label class="fl">Objetivo\n      <select id="pgoal">').concat(GOALS.map((g) => '<option value="'.concat(g.v, '" ').concat(g.v === p.goal ? "selected" : "", ">").concat(g.l, " (").concat(g.v > 0 ? "+" : "").concat(g.v, " kcal · ").concat(g.d, ")</option>")).join(""), '</select></label>\n    <button class="btn" onclick="saveProfile()">').concat(first ? "Empezar" : "Guardar", "</button>\n  </section>");
  if (!first) {
    const b = bmr(p), base = b * p.activity;
    h += '<section class="card"><h3>Tus números</h3>\n      <div class="item"><div class="grow">Metabolismo basal<div class="small muted">Lo que gastas en reposo total</div></div><div class="kc">'.concat(fmt(b), ' kcal</div></div>\n      <div class="item"><div class="grow">Gasto diario sin ejercicio<div class="small muted">Basal × actividad diaria</div></div><div class="kc">').concat(fmt(base), ' kcal</div></div>\n      <div class="item"><div class="grow">Meta en días sin ejercicio</div><div class="kc">').concat(fmt(base + p.goal), ' kcal</div></div>\n      <div class="item"><div class="grow">Proteína sugerida<div class="small muted">1,8 g por kg</div></div><div class="kc">').concat(R(p.weight * 1.8), ' g</div></div>\n      <p class="small muted">Los días que entrenas, lo que quemas se suma a tu gasto y tu meta sube.</p></section>\n    <section class="card"><h3>🧠 Ajustar con mi peso real</h3>\n      <p class="small muted">Como registras al ojo, la app compara lo que comiste con cómo cambió tu peso en las últimas 4 semanas y corrige tu gasto (±700 kcal máx.). Necesita 10 días con comidas y 3 pesajes.</p>\n      <label class="check"><input type="checkbox" ').concat(p.adapt !== false ? "checked" : "", ' onchange="S.profile.adapt=this.checked;save();render()"> Activado</label>\n      <p class="small">').concat(esc(adaptiveText(ADJ)), '</p></section>\n    <section class="card"><h3>💾 Respaldo</h3><p class="small muted">Tus datos viven solo en este teléfono. Al respaldar puedes guardarlo en Google Drive, mandártelo por WhatsApp o correo. Último respaldo: ').concat(S.lastBackup ? dayLabel(S.lastBackup) : "nunca", '.</p>\n      <div class="row gap"><button class="btn sec" onclick="exportData()">⬇️ Exportar</button><label class="btn sec">⬆️ Importar<input type="file" accept="application/json" hidden onchange="importData(this.files[0])"></label></div></section>\n    <p class="small muted center">Fotos de ejercicios: free-exercise-db (dominio público). Parte de las instrucciones: exercises-dataset (MIT). Productos: Open Food Facts (ODbL). Valores de alimentos aproximados.</p>');
  }
  pSex = p.sex;
  return h;
}
let pSex = "m";
function saveProfile() {
  var _a2, _b2, _c;
  const age = +$("#pa").value, height = +$("#ph").value, weight = +$("#pw").value;
  if (!(age >= 12 && age <= 100) || !(height >= 120 && height <= 230) || !(weight > 25 && weight < 400)) return toast("Revisa edad, altura y peso");
  const first = !S.profile;
  const oldW = (_a2 = S.profile) == null ? void 0 : _a2.weight;
  S.profile = { sex: pSex, age, height, weight, activity: +$("#pact").value, goal: +$("#pgoal").value, adapt: (_c = (_b2 = S.profile) == null ? void 0 : _b2.adapt) != null ? _c : true };
  if (weight !== oldW) setWeight(weight);
  save();
  if (first) goTab("hoy");
  else {
    render();
    toast("Perfil guardado");
  }
}
async function exportData() {
  var _a2;
  S.lastBackup = TODAY();
  const name = "watonql-respaldo-".concat(TODAY(), ".json");
  const file = new File([JSON.stringify(S)], name, { type: "application/json" });
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
  };
  try {
    if ((_a2 = navigator.canShare) == null ? void 0 : _a2.call(navigator, { files: [file] })) await navigator.share({ files: [file], title: "Respaldo watonql" });
    else download();
  } catch (e) {
    if (e.name === "AbortError") {
      delete S.lastBackup;
      return;
    }
    download();
  }
  save();
  render();
  toast("Respaldo listo");
}
async function importData(file) {
  if (!file) return;
  try {
    const d = JSON.parse(await file.text());
    if (!d.days || !d.profile) throw 0;
    if (!confirm("Esto reemplaza tus datos actuales. ¿Continuar?")) return;
    S = d;
    S.custom || (S.custom = []);
    S.weights || (S.weights = []);
    S.combos || (S.combos = []);
    S.myRoutines || (S.myRoutines = []);
    save();
    render();
    toast("Datos importados");
  } catch {
    toast("Archivo inválido");
  }
}
$("#sheet").addEventListener("click", (e) => {
  if (e.target.id === "sheet") closeSheet();
});
render();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {
});
(_b = (_a = navigator.storage) == null ? void 0 : _a.persist) == null ? void 0 : _b.call(_a).catch(() => {
});
