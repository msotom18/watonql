// Calculadora por gramos: sumas ingredientes (lechuga 100 g + arroz 200 g + pollo 150 g) y ves el total.
let CALC = []; // [{ id, g }]  se mantiene mientras la app esté abierta
const INGR = () => [...S.custom.filter(f => f.per100), ...FOODS.filter(f => f.per100)];
const calcLine = l => { const f = findFood(l.id), m = l.g / 100; return { f, k: f.k * m, p: f.p * m, c: f.c * m, fat: f.f * m }; };

function openCalc() {
  openSheet(head('🧮 Calculadora por gramos', 'openFood(fMeal)') + `
    <p class="small muted">Agrega cada ingrediente con sus gramos. Ej: lechuga 100, arroz 200, pollo 150.</p>
    <div id="calcList"></div>
    <input id="cq" type="search" placeholder="+ Buscar ingrediente: lechuga, arroz, pollo…" oninput="calcSearch()" autocomplete="off">
    <div id="cres"></div>
    <div id="calcTot"></div>`);
  calcRender(); calcSearch();
}
function calcSearch() {
  const q = norm($('#cq').value.trim()), words = q.split(/\s+/);
  const list = INGR().filter(f => words.every(w => norm(f.n + ' ' + f.syn).includes(w)));
  $('#cres').innerHTML = (q ? list : []).map(f =>
    `<button class="item btnitem" onclick="calcAdd('${f.id}')"><div class="grow">${esc(f.n)}</div><div class="small muted">${fmt(f.k)} kcal / 100 ${f.per100}</div></button>`).join('')
    + (q && !list.length ? '<p class="small muted">No está. Prueba con otro nombre (ej: "pollo", "arroz", "carne").</p>' : '');
}
function calcAdd(id) {
  CALC.push({ id, g: 100 });
  $('#cq').value = ''; calcSearch(); calcRender();
  const inputs = document.querySelectorAll('#calcList input'); inputs[inputs.length - 1]?.select();
}
function calcRender() {
  $('#calcList').innerHTML = CALC.map((l, i) => {
    const r = calcLine(l);
    return `<div class="rbi"><div class="grow"><b>${esc(r.f.n)}</b><div class="small muted" id="ck${i}">${fmt(r.k)} kcal</div></div>
      <label>${r.f.per100 === 'ml' ? 'ml' : 'Gramos'}<input type="number" inputmode="numeric" value="${l.g}" oninput="CALC[${i}].g=+this.value||0;calcTotals()"></label>
      <button class="x" onclick="CALC.splice(${i},1);calcRender()" aria-label="Quitar">×</button></div>`;
  }).join('');
  calcTotals();
}
function calcTotals() {
  CALC.forEach((l, i) => { const e = document.getElementById('ck' + i); if (e) e.textContent = fmt(calcLine(l).k) + ' kcal'; });
  if (!CALC.length) return ($('#calcTot').innerHTML = '');
  const t = CALC.map(calcLine).reduce((a, r) => ({ k: a.k + r.k, p: a.p + r.p, c: a.c + r.c, f: a.f + r.fat }), { k: 0, p: 0, c: 0, f: 0 });
  const g = CALC.reduce((a, l) => a + l.g, 0);
  $('#calcTot').innerHTML = `
    <div class="preview"><b>${fmt(t.k)} kcal</b><span>${fmt(g)} g en total · P ${R(t.p)} g · C ${R(t.c)} g · G ${R(t.f)} g</span></div>
    <div class="label">Agregar a</div><div class="chips">${MEALS.map(([m, l]) => chip(l, m === fMeal, `fMeal='${m}';setOn(this)`)).join('')}</div>
    <button class="btn" onclick="calcAddAll()">Agregar a ${dayLabel(cur).toLowerCase()}</button>
    <div class="row gap"><button class="btn sec" onclick="calcCombo()">⭐ Guardar como combo</button><button class="btn sec" onclick="CALC=[];calcRender()">Vaciar</button></div>`;
}
const calcEntries = () => CALC.filter(l => l.g > 0).map(l => {
  const r = calcLine(l);
  return { ref: l.id, n: r.f.n, q: `${l.g} ${r.f.per100}`, k: R(r.k), p: r1(r.p), c: r1(r.c), f: r1(r.fat) };
});
function calcAddAll() {
  const items = calcEntries(); if (!items.length) return toast('Agrega al menos un ingrediente');
  CALC = []; closeSheet(); addItems(items, fMeal);
}
function calcCombo() {
  const items = calcEntries(); if (!items.length) return toast('Agrega al menos un ingrediente');
  const name = prompt('Nombre del combo', 'Mi plato');
  if (!name?.trim()) return;
  S.combos.unshift({ id: 'k' + Date.now(), n: name.trim(), items });
  save(); toast('Combo guardado ⭐');
}
