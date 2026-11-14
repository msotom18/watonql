// Ejercicios por repeticiones / series, rutinas propias y totales acumulados.
// u: 'rep' (repeticiones) o 's' (segundos) · spr: segundos estimados por repetición · met: intensidad (Compendium)
// kcal = (MET - 1) × kg × tiempo de trabajo / 3600
const REPEX = [
  ['flexion', 'Flexiones de brazos', 'rep', 2.5, 8],
  ['crunch', 'Abdominales (crunch)', 'rep', 2, 5],
  ['sentadilla', 'Sentadillas', 'rep', 3, 5.5],
  ['zancada', 'Zancadas', 'rep', 3, 5.5],
  ['burpee', 'Burpees', 'rep', 4, 8],
  ['sent_salto', 'Sentadillas con salto', 'rep', 2.5, 8],
  ['jumping', 'Jumping jacks', 'rep', 1, 7.7],
  ['escalador', 'Escaladores', 'rep', 1, 8],
  ['fondos', 'Fondos de tríceps', 'rep', 2.5, 5],
  ['pica', 'Flexiones pica', 'rep', 3, 6],
  ['dominada', 'Dominadas', 'rep', 4, 8],
  ['puente', 'Puentes de glúteo', 'rep', 2.5, 4],
  ['bulgara', 'Sentadillas búlgaras', 'rep', 3, 5.5],
  ['talones', 'Elevaciones de talones', 'rep', 1.5, 3.5],
  ['bici_abd', 'Bicicleta abdominal', 'rep', 1.5, 5],
  ['elev_piernas', 'Elevaciones de piernas', 'rep', 3, 4.5],
  ['remo', 'Remo con mochila', 'rep', 2.5, 4.5],
  ['toque_hombros', 'Toques de hombro', 'rep', 1.5, 5],
  ['plancha', 'Plancha', 's', 1, 4],
  ['plancha_lat', 'Plancha lateral', 's', 1, 4],
  ['skipping', 'Skipping / trote en el lugar', 's', 1, 8],
].map(([x, n, u, spr, met]) => ({ x, n, u, spr, met }));

const repex = x => REPEX.find(e => e.x === x);
const isSecs = it => repex(it.x)?.u === 's';
const itemSecs = it => (isSecs(it) ? it.secs * it.sets : it.reps * it.sets * repex(it.x).spr);
const itemKcal = it => exK(repex(it.x).met, itemSecs(it) / 60);
const itemTxt = it => `${it.sets} × ${isSecs(it) ? it.secs + ' s' : it.reps}`;
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function routineStats(r) {
  const work = r.items.reduce((a, it) => a + itemSecs(it), 0);
  const sets = r.items.reduce((a, it) => a + it.sets, 0);
  return { sets, min: Math.max(1, R((work + r.rest * Math.max(0, sets - 1)) / 60)), k: r.items.reduce((a, it) => a + itemKcal(it), 0) };
}
function exDesc(e) {
  if (e.items?.length) return (e.items.length === 1 ? itemTxt(e.items[0]) + (isSecs(e.items[0]) ? '' : ' reps') : `${e.items.length} ejercicios`) + (e.min ? ` · ${e.min} min` : '');
  return e.min ? e.min + ' min' : 'manual';
}

// ---------- Registro rápido ----------
let QL = null;
function openRepList() {
  openSheet(head('Registrar repeticiones') + `<p class="small muted">Elige el ejercicio. Después pones cuántas hiciste y cuántas series.</p>` +
    REPEX.map(e => `<button class="item btnitem" onclick="openQuick('${e.x}', 'openRepList()')"><div class="grow">${esc(e.n)}</div><div class="small muted">${e.u === 's' ? 'por tiempo' : 'repeticiones'} ›</div></button>`).join(''));
}
function openQuick(x, back = 'openEx()') {
  const e = repex(x);
  QL = { x, sets: 1, ...(e.u === 's' ? { secs: 30 } : { reps: 20 }) };
  const opts = e.u === 's' ? [20, 30, 45, 60, 90] : [5, 10, 15, 20, 25, 30, 50];
  const k = e.u === 's' ? 'secs' : 'reps';
  openSheet(head(esc(e.n), back) + exImg(x) + `
    <div class="label">${e.u === 's' ? 'Segundos por serie' : 'Repeticiones por serie'}</div>
    <div class="chips">${opts.map(v => chip(e.u === 's' ? v + ' s' : v, v === QL[k], `qlSet('${k}',${v},this)`)).join('')}<input type="number" class="mini" placeholder="otra" inputmode="numeric" oninput="this.parentNode.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));qlSet('${k}',+this.value||0)"></div>
    <div class="label">Series</div>
    <div class="chips">${[1, 2, 3, 4, 5].map(v => chip(v, v === 1, `qlSet('sets',${v},this)`)).join('')}<input type="number" class="mini" placeholder="otra" inputmode="numeric" oninput="this.parentNode.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));qlSet('sets',+this.value||0)"></div>
    <div class="preview" id="qlpv"></div>
    <button class="btn" onclick="qlAdd()">Agregar a ${dayLabel(cur).toLowerCase()}</button>`);
  qlPv();
}
function qlSet(k, v, el) { QL[k] = v; if (el) setOn(el); qlPv(); }
function qlPv() {
  const total = isSecs(QL) ? mmss(QL.secs * QL.sets) + ' en total' : `${QL.reps * QL.sets} repeticiones en total`;
  $('#qlpv').innerHTML = `<b>${fmt(itemKcal(QL))} kcal</b><span>${total}</span>`;
}
function qlAdd() {
  if (!QL.sets || !(QL.reps || QL.secs)) return toast('Completa cantidad y series');
  const k = R(itemKcal(QL));
  ensureDay(cur).ex.push({ n: repex(QL.x).n, min: Math.max(1, R(itemSecs(QL) / 60)), k, items: [{ ...QL }] });
  save(); closeSheet(); render(); toast(`${repex(QL.x).n}: -${k} kcal`);
}

// ---------- Crear / editar rutinas propias ----------
let RB = null;
function newRoutine(id) {
  const r = id && S.myRoutines.find(x => x.id === id);
  RB = r ? JSON.parse(JSON.stringify(r)) : { n: '', rest: 60, items: [] };
  rbRender();
}
function rbRender() {
  openSheet(head(RB.id ? 'Editar rutina' : 'Crear rutina') + `
    <label class="fl">Nombre<input id="rbn" value="${esc(RB.n)}" placeholder="Ej: Pecho y abdomen" oninput="RB.n=this.value"></label>
    <div class="label">Ejercicios</div>
    ${RB.items.map((it, i) => {
      const e = repex(it.x), k = e.u === 's' ? 'secs' : 'reps';
      return `<div class="rbi"><div class="grow"><b>${i + 1}. ${esc(e.n)}</b></div>
        <label>${e.u === 's' ? 'Seg.' : 'Reps'}<input type="number" inputmode="numeric" value="${it[k]}" oninput="RB.items[${i}].${k}=+this.value||0;rbSum()"></label>
        <label>Series<input type="number" inputmode="numeric" value="${it.sets}" oninput="RB.items[${i}].sets=+this.value||0;rbSum()"></label>
        <button class="x" onclick="RB.items.splice(${i},1);rbRender()" aria-label="Quitar">×</button></div>`;
    }).join('') || '<p class="small muted">Aún no agregas ejercicios. Tócalos abajo.</p>'}
    <div class="label">+ Agregar ejercicio (desliza)</div>
    <div class="chips scroll">${REPEX.map(e => chip(esc(e.n), false, `rbAdd('${e.x}')`)).join('')}</div>
    <div class="label">Descanso entre series</div>
    <div class="chips">${[30, 45, 60, 90, 120].map(s => chip(s + ' s', s === RB.rest, `RB.rest=${s};setOn(this);rbSum()`)).join('')}</div>
    <div class="preview" id="rbsum"></div>
    <button class="btn" onclick="rbSave()">Guardar rutina</button>
    ${RB.id ? `<button class="btn ghost" onclick="rbDelete()">Eliminar rutina</button>` : ''}`);
  rbSum();
}
function rbAdd(x) {
  RB.n = $('#rbn').value;
  RB.items.push({ x, sets: 3, ...(repex(x).u === 's' ? { secs: 30 } : { reps: 10 }) });
  rbRender();
  $('#sheetBody').scrollTop = $('.rbi:last-of-type')?.offsetTop - 80 || 0;
}
function rbSum() {
  if (!RB.items.length) return ($('#rbsum').innerHTML = '<span>Agrega al menos un ejercicio</span>');
  const s = routineStats(RB);
  $('#rbsum').innerHTML = `<b>≈ ${fmt(s.k)} kcal</b><span>${RB.items.length} ejercicios · ${s.sets} series · ~${s.min} min</span>`;
}
function rbSave() {
  RB.n = $('#rbn').value.trim();
  if (!RB.n) return toast('Ponle un nombre');
  if (!RB.items.length || RB.items.some(it => !it.sets || !(it.reps || it.secs))) return toast('Revisa repeticiones y series');
  if (RB.id) S.myRoutines = S.myRoutines.map(r => (r.id === RB.id ? RB : r));
  else S.myRoutines.unshift({ ...RB, id: 'u' + Date.now(), custom: true });
  save(); closeSheet(); goTab('rutinas'); toast('Rutina guardada');
}
function rbDelete() {
  if (!confirm('¿Eliminar esta rutina?')) return;
  S.myRoutines = S.myRoutines.filter(r => r.id !== RB.id); save(); closeSheet(); render();
}
function openMyRoutine(id) {
  const r = S.myRoutines.find(x => x.id === id), s = routineStats(r);
  openSheet(head('🏋️ ' + esc(r.n)) + `
    <p class="muted">${r.items.length} ejercicios · ${s.sets} series · descanso ${r.rest} s · ~${s.min} min · ≈ ${fmt(s.k)} kcal</p>
    <div class="label">Ejercicios · toca para ver cómo se hace</div>
    ${r.items.map(it => `<details class="exd"><summary>${esc(repex(it.x).n)} <span class="muted">— ${itemTxt(it)}${isSecs(it) ? '' : ' reps'}</span></summary>${exImg(it.x)}<p class="small">${esc(EXINFO[it.x]?.es || '')}</p></details>`).join('')}
    <button class="btn" onclick="startTimer('${id}')">▶️ Empezar (contador de series)</button>
    <button class="btn sec full" onclick="logMyRoutine('${id}')">✅ Ya la hice completa · registrar en ${dayLabel(cur).toLowerCase()}</button>
    <button class="btn sec full" onclick="newRoutine('${id}')">✏️ Editar</button>`);
}
function logMyRoutine(id) {
  const r = S.myRoutines.find(x => x.id === id), s = routineStats(r);
  ensureDay(cur).ex.push({ n: 'Rutina: ' + r.n, min: s.min, k: R(s.k), items: r.items.map(it => ({ ...it })) });
  save(); closeSheet(); toast(`¡Bien! -${R(s.k)} kcal`); openDay(cur);
}

// Rutinas sugeridas por rondas: "12 sentadillas" → 12 reps por ronda (para los totales)
function presetItems(r, rounds = r.rounds) {
  if (r.mode !== 'reps' || !rounds) return [];
  return r.items.map(([t, x]) => {
    const m = t.match(/^(\d+)\s*(s\b)?/); if (!m || !repex(x)) return null;
    return isSecs({ x }) || m[2] ? { x, secs: +m[1], sets: rounds } : { x, reps: +m[1], sets: rounds };
  }).filter(Boolean);
}

// ---------- Totales acumulados ----------
function repTotals() {
  const today = TODAY(), w = addDays(today, -6), m = addDays(today, -29), T = {};
  Object.entries(S.days).forEach(([d, D]) => D.ex.forEach(e => (e.items || []).forEach(it => {
    if (!repex(it.x)) return;
    const t = (T[it.x] ||= { hoy: 0, sem: 0, mes: 0, rec: 0 });
    const n = isSecs(it) ? it.secs * it.sets : it.reps * it.sets;
    if (d === today) t.hoy += n;
    if (d >= w) t.sem += n;
    if (d >= m) t.mes += n;
    t.rec = Math.max(t.rec, isSecs(it) ? it.secs : it.reps);
  })));
  return T;
}
function totalsCard() {
  const T = repTotals(), keys = REPEX.map(e => e.x).filter(x => T[x]);
  if (!keys.length) return '';
  const f = (x, v) => (repex(x).u === 's' ? mmss(v) : fmt(v));
  return `<section class="card"><h3>📊 Tus totales</h3>
    <table class="tot"><thead><tr><th></th><th>Hoy</th><th>7 días</th><th>30 días</th><th>Récord<br><span>por serie</span></th></tr></thead><tbody>
    ${keys.map(x => `<tr><td>${esc(repex(x).n)}</td><td>${f(x, T[x].hoy)}</td><td>${f(x, T[x].sem)}</td><td>${f(x, T[x].mes)}</td><td>${f(x, T[x].rec)}</td></tr>`).join('')}
    </tbody></table></section>`;
}
