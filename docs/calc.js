let CALC = [];
const INGR = () => [...S.custom.filter((f) => f.per100), ...FOODS.filter((f) => f.per100)];
const calcLine = (l) => {
  const f = findFood(l.id), m = l.g / 100;
  return { f, k: f.k * m, p: f.p * m, c: f.c * m, fat: f.f * m };
};
function openCalc() {
  openSheet(head("🧮 Calculadora por gramos", "openFood(fMeal)") + '\n    <p class="small muted">Agrega cada ingrediente con sus gramos. Ej: lechuga 100, arroz 200, pollo 150.</p>\n    <div id="calcList"></div>\n    <input id="cq" type="search" placeholder="+ Buscar ingrediente: lechuga, arroz, pollo…" oninput="calcSearch()" autocomplete="off">\n    <div id="cres"></div>\n    <div id="calcTot"></div>');
  calcRender();
  calcSearch();
}
function calcSearch() {
  const q = norm($("#cq").value.trim()), words = q.split(/\s+/);
  const list = INGR().filter((f) => words.every((w) => norm(f.n + " " + f.syn).includes(w)));
  $("#cres").innerHTML = (q ? list : []).map((f) => '<button class="item btnitem" onclick="calcAdd(\''.concat(f.id, '\')"><div class="grow">').concat(esc(f.n), '</div><div class="small muted">').concat(fmt(f.k), " kcal / 100 ").concat(f.per100, "</div></button>")).join("") + (q && !list.length ? '<p class="small muted">No está. Prueba con otro nombre (ej: "pollo", "arroz", "carne").</p>' : "");
}
function calcAdd(id) {
  var _a;
  CALC.push({ id, g: 100 });
  $("#cq").value = "";
  calcSearch();
  calcRender();
  const inputs = document.querySelectorAll("#calcList input");
  (_a = inputs[inputs.length - 1]) == null ? void 0 : _a.select();
}
function calcRender() {
  $("#calcList").innerHTML = CALC.map((l, i) => {
    const r = calcLine(l);
    return '<div class="rbi"><div class="grow"><b>'.concat(esc(r.f.n), '</b><div class="small muted" id="ck').concat(i, '">').concat(fmt(r.k), " kcal</div></div>\n      <label>").concat(r.f.per100 === "ml" ? "ml" : "Gramos", '<input type="number" inputmode="numeric" value="').concat(l.g, '" oninput="CALC[').concat(i, '].g=+this.value||0;calcTotals()"></label>\n      <button class="x" onclick="CALC.splice(').concat(i, ',1);calcRender()" aria-label="Quitar">×</button></div>');
  }).join("");
  calcTotals();
}
function calcTotals() {
  CALC.forEach((l, i) => {
    const e = document.getElementById("ck" + i);
    if (e) e.textContent = fmt(calcLine(l).k) + " kcal";
  });
  if (!CALC.length) return $("#calcTot").innerHTML = "";
  const t = CALC.map(calcLine).reduce((a, r) => ({ k: a.k + r.k, p: a.p + r.p, c: a.c + r.c, f: a.f + r.fat }), { k: 0, p: 0, c: 0, f: 0 });
  const g = CALC.reduce((a, l) => a + l.g, 0);
  $("#calcTot").innerHTML = '\n    <div class="preview"><b>'.concat(fmt(t.k), " kcal</b><span>").concat(fmt(g), " g en total · P ").concat(R(t.p), " g · C ").concat(R(t.c), " g · G ").concat(R(t.f), ' g</span></div>\n    <div class="label">Agregar a</div><div class="chips">').concat(MEALS.map(([m, l]) => chip(l, m === fMeal, "fMeal='".concat(m, "';setOn(this)"))).join(""), '</div>\n    <button class="btn" onclick="calcAddAll()">Agregar a ').concat(dayLabel(cur).toLowerCase(), '</button>\n    <div class="row gap"><button class="btn sec" onclick="calcCombo()">⭐ Guardar como combo</button><button class="btn sec" onclick="CALC=[];calcRender()">Vaciar</button></div>');
}
const calcEntries = () => CALC.filter((l) => l.g > 0).map((l) => {
  const r = calcLine(l);
  return { ref: l.id, n: r.f.n, q: "".concat(l.g, " ").concat(r.f.per100), k: R(r.k), p: r1(r.p), c: r1(r.c), f: r1(r.fat) };
});
function calcAddAll() {
  const items = calcEntries();
  if (!items.length) return toast("Agrega al menos un ingrediente");
  CALC = [];
  closeSheet();
  addItems(items, fMeal);
}
function calcCombo() {
  const items = calcEntries();
  if (!items.length) return toast("Agrega al menos un ingrediente");
  const name = prompt("Nombre del combo", "Mi plato");
  if (!(name == null ? void 0 : name.trim())) return;
  S.combos.unshift({ id: "k" + Date.now(), n: name.trim(), items });
  save();
  toast("Combo guardado ⭐");
}
