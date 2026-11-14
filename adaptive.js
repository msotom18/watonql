// Gasto real adaptativo (idea de Energy Map / tdeemon / 3-Suns Adaptive TDEE):
// si comiste X kcal en promedio y tu peso cambió Y kg, tu gasto real fue X - Y·7700/días.
// La diferencia con lo que estima la fórmula se suma como "ajuste" a tu gasto diario.
const dayDiff = (a, b) => R((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);

// Tendencia de peso: promedio de los pesajes de los últimos 7 días de cada fecha
function weightTrend() {
  const W = S.weights.slice().sort((a, b) => (a.d < b.d ? -1 : 1));
  return W.map(w => {
    const win = W.filter(x => x.d <= w.d && dayDiff(x.d, w.d) < 7);
    return { d: w.d, kg: w.kg, t: win.reduce((a, x) => a + x.kg, 0) / win.length };
  });
}

function adaptive() {
  const end = addDays(TODAY(), -1), start = addDays(end, -27); // últimos 28 días completos
  const W = S.weights.filter(w => w.d >= start && w.d <= TODAY()).sort((a, b) => (a.d < b.d ? -1 : 1));
  const logged = [];
  for (let d = start; d <= end; d = addDays(d, 1)) if ((S.days[d]?.foods.length || 0) >= 2) logged.push(d);
  const span = W.length ? dayDiff(W[0].d, W[W.length - 1].d) : 0;
  if (W.length < 3 || span < 10 || logged.length < 10) {
    return { ok: false, days: logged.length, n: W.length, span };
  }
  // pendiente del peso (kg/día) por regresión lineal: menos sensible a un pesaje suelto
  const xs = W.map(w => dayDiff(start, w.d)), ys = W.map(w => w.kg);
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  let num = 0, den = 0;
  xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2; });
  const slope = den ? num / den : 0;
  let intake = 0, est = 0;
  logged.forEach(d => { const t = calc(d, true); intake += t.eat.k; est += t.burn; });
  intake /= logged.length; est /= logged.length;
  const real = intake - slope * 7700;
  const adj = Math.max(-700, Math.min(700, R(real - est)));
  return { ok: true, adj, real, est, intake, slope, days: logged.length, n: W.length, span };
}

function adaptiveText(A) {
  if (!A) return 'Desactivado.';
  if (!A.ok) {
    const faltan = [];
    if (A.days < 10) faltan.push(`registrar comidas en ${10 - A.days} día(s) más`);
    if (A.n < 3) faltan.push(`pesarte ${3 - A.n} vez/veces más`);
    else if (A.span < 10) faltan.push('que tus pesajes cubran al menos 10 días');
    return `Aún aprendiendo: falta ${faltan.join(' y ')} (últimas 4 semanas).`;
  }
  const s = A.adj > 0 ? '+' : '';
  return `Con ${A.days} días registrados y ${A.n} pesajes: comiste ~${fmt(A.intake)} kcal/día y tu peso cambió ${(A.slope * 7).toFixed(2).replace('.', ',')} kg/semana → tu gasto real es ~${fmt(A.real)} kcal/día. Ajuste aplicado: ${s}${fmt(A.adj)} kcal.`;
}
