// Temporizador de rutinas (idea de OpenHIIT): intervalos con sonido, vibración y pantalla encendida.
let TM = null;

function exImg(x) {
  const e = EXINFO[x];
  return e?.img ? `<div class="exanim"><img src="img/ex/${e.img}_0.jpg" alt="${esc(e.n)}" loading="lazy"><img src="img/ex/${e.img}_1.jpg" alt="" loading="lazy"></div>` : '';
}

// Rutina propia: cada serie es un paso (reps → botón "Serie lista"; segundos → cuenta regresiva) + descanso
function buildCustomSteps(r) {
  const s = [{ type: 'prep', label: 'Prepárate', secs: 10, x: r.items[0].x, next: repex(r.items[0].x).n }];
  r.items.forEach((it, i) => {
    const e = repex(it.x);
    for (let k = 1; k <= it.sets; k++) {
      const base = { label: e.n, x: it.x, set: k, sets: it.sets, item: i };
      s.push(e.u === 's' ? { ...base, type: 'work', secs: it.secs } : { ...base, type: 'set', secs: 0, reps: it.reps });
      if (i === r.items.length - 1 && k === it.sets) continue;
      const nxt = k < it.sets ? it : r.items[i + 1];
      s.push({ type: 'rest', label: 'Descanso', secs: r.rest, x: nxt.x, next: k < it.sets ? `${e.n} · serie ${k + 1} de ${it.sets}` : `${repex(nxt.x).n} (${itemTxt(nxt)})` });
    }
  });
  return s;
}

function buildSteps(r) {
  if (r.custom) return buildCustomSteps(r);
  const s = [{ type: 'prep', label: 'Prepárate', secs: 10, x: r.items[0][1], next: r.items[0][0] }];
  for (let k = 1; k <= r.rounds; k++) {
    if (r.mode === 'int') {
      r.items.forEach(([t, x], i) => {
        s.push({ type: 'work', label: t, x, secs: r.work, round: k });
        if (k === r.rounds && i === r.items.length - 1) return;
        const nx = r.items[(i + 1) % r.items.length];
        s.push({ type: 'rest', label: 'Descanso', secs: r.rest, x: nx[1], next: nx[0], round: k });
      });
    } else {
      s.push({ type: 'round', label: `Ronda ${k} de ${r.rounds}`, secs: 0, round: k });
      if (k < r.rounds) s.push({ type: 'rest', label: 'Descanso', secs: r.rest, next: `Ronda ${k + 1}`, round: k });
    }
  }
  return s;
}

function beep(freq, dur) {
  try {
    const a = TM.ac, o = a.createOscillator(), g = a.createGain();
    o.frequency.value = freq; g.gain.value = 0.25; o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + dur);
  } catch {}
}

async function startTimer(id) {
  const r = ROUTINES.find(x => x.id === id) || S.myRoutines.find(x => x.id === id), steps = buildSteps(r);
  TM = { r, steps, i: 0, left: steps[0].secs, paused: false, active: 0, last: Date.now() };
  try { TM.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  openSheet(`<div id="tmBody"></div>`);
  sheetCleanup = stopTimer;
  TM.iv = setInterval(tick, 250);
  try { TM.wl = await navigator.wakeLock?.request('screen'); } catch {}
  renderTimer();
}
function stopTimer() {
  if (!TM) return;
  clearInterval(TM.iv); TM.wl?.release?.().catch(() => {}); TM.ac?.close?.().catch(() => {});
}
function tick() {
  if (!TM || TM.done) return;
  const now = Date.now(), dt = now - TM.last; TM.last = now;
  if (TM.paused) return;
  TM.active += dt;
  const st = TM.steps[TM.i];
  if (!st.secs) return; // ronda de repeticiones: avanza con "Listo"
  const before = Math.ceil(TM.left);
  TM.left -= dt / 1000;
  const after = Math.ceil(TM.left);
  if (after !== before && after > 0 && after <= 3) beep(660, 0.08);
  if (TM.left <= 0) return nextStep();
  const c = document.getElementById('tmClock'); if (c) c.textContent = after;
  const b = document.getElementById('tmBar'); if (b) b.style.width = (100 - TM.left / st.secs * 100) + '%';
}
function nextStep() {
  TM.i++;
  if (TM.i >= TM.steps.length) return finishTimer();
  const st = TM.steps[TM.i];
  TM.left = st.secs;
  beep(st.type === 'rest' ? 440 : 880, 0.3);
  navigator.vibrate?.(st.type === 'rest' ? 150 : [100, 60, 100]);
  renderTimer();
}
function togglePause() { TM.paused = !TM.paused; renderTimer(); }

function renderTimer() {
  const st = TM.steps[TM.i], r = TM.r, info = EXINFO[st.x];
  const total = TM.steps.length;
  let h = head(`${r.emoji || '🏋️'} ${esc(r.n)}`) + `<div class="tm ${st.type}">
    <div class="small muted">${st.round ? `Ronda ${st.round} de ${r.rounds} · ` : ''}paso ${TM.i + 1} de ${total}</div>
    ${st.set ? `<div class="tm-set">Serie ${st.set} de ${st.sets}</div>` : ''}`;
  if (st.type === 'set') {
    h += `<div class="tm-label">${esc(st.label)}</div>
      <div class="tm-clock">${st.reps}</div><div class="muted">repeticiones</div>
      ${exImg(st.x)}
      <button class="btn" onclick="nextStep()">✓ Serie lista</button>`;
  } else if (st.type === 'round') {
    h += `<div class="tm-label">${esc(st.label)}</div>
      <ol class="rlist">${r.items.map(([t]) => `<li>${esc(t)}</li>`).join('')}</ol>
      <button class="btn" onclick="nextStep()">✓ Listo, terminé la ronda</button>`;
  } else {
    h += `<div class="tm-label">${esc(st.label)}</div>
      <div class="tm-clock" id="tmClock">${Math.ceil(TM.left)}</div>
      <div class="bar"><i id="tmBar" style="width:${100 - TM.left / st.secs * 100}%"></i></div>
      ${st.next ? `<div class="muted tm-next">Sigue: <b>${esc(st.next)}</b></div>` : ''}
      ${st.x ? exImg(st.x) : ''}
      ${st.type === 'work' && info && !st.set ? `<p class="small muted">${esc(info.es)}</p>` : ''}`;
  }
  h += `<div class="row gap">
      <button class="btn sec" onclick="togglePause()">${TM.paused ? '▶️ Seguir' : '⏸ Pausa'}</button>
      <button class="btn sec" onclick="nextStep()">⏭ Saltar</button>
      <button class="btn sec" onclick="finishTimer()">■ Terminar</button></div></div>`;
  document.getElementById('tmBody').innerHTML = h;
}

function finishTimer() {
  TM.done = true; stopTimer();
  const min = Math.max(1, R(TM.active / 60000)), r = TM.r;
  // Pasos completados (si terminaste antes, el paso actual no cuenta)
  const doneSteps = TM.steps.slice(0, Math.min(TM.i, TM.steps.length));
  let items, k;
  if (r.custom) {
    items = r.items.map((it, i) => ({ ...it, sets: doneSteps.filter(s => s.item === i && (s.type === 'set' || s.type === 'work')).length })).filter(it => it.sets);
    k = items.reduce((a, it) => a + itemKcal(it), 0);
  } else {
    items = presetItems(r, doneSteps.filter(s => s.type === 'round').length);
    k = exK(r.met, min);
  }
  TM.res = { min, k: R(k), items };
  beep(1046, 0.5); navigator.vibrate?.([200, 100, 200]);
  document.getElementById('tmBody').innerHTML = head('¡Terminaste! 💪') + `
    <p>${esc(r.n)} · ${min} min.${items.length ? '<br>' + items.map(it => `${esc(repex(it.x).n)}: ${itemTxt(it)}`).join(' · ') : ''}</p>
    <div class="preview"><b>${fmt(k)} kcal</b><span>quemadas extra (aprox.)</span></div>
    <button class="btn" onclick="logTimer(${min})">Registrar en ${dayLabel(cur).toLowerCase()}</button>
    <button class="btn ghost" onclick="closeSheet()">No registrar</button>`;
}
function logTimer() {
  const { min, k, items } = TM.res;
  ensureDay(cur).ex.push({ n: 'Rutina: ' + TM.r.n, min, k, items });
  save(); closeSheet(); toast(`¡Bien! -${k} kcal`); openDay(cur);
}
