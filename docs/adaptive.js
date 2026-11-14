const dayDiff = (a, b) => R((/* @__PURE__ */ new Date(b + "T12:00") - /* @__PURE__ */ new Date(a + "T12:00")) / 864e5);
function weightTrend() {
  const W = S.weights.slice().sort((a, b) => a.d < b.d ? -1 : 1);
  return W.map((w) => {
    const win = W.filter((x) => x.d <= w.d && dayDiff(x.d, w.d) < 7);
    return { d: w.d, kg: w.kg, t: win.reduce((a, x) => a + x.kg, 0) / win.length };
  });
}
function adaptive() {
  var _a;
  const end = addDays(TODAY(), -1), start = addDays(end, -27);
  const W = S.weights.filter((w) => w.d >= start && w.d <= TODAY()).sort((a, b) => a.d < b.d ? -1 : 1);
  const logged = [];
  for (let d = start; d <= end; d = addDays(d, 1)) if ((((_a = S.days[d]) == null ? void 0 : _a.foods.length) || 0) >= 2) logged.push(d);
  const span = W.length ? dayDiff(W[0].d, W[W.length - 1].d) : 0;
  if (W.length < 3 || span < 10 || logged.length < 10) {
    return { ok: false, days: logged.length, n: W.length, span };
  }
  const xs = W.map((w) => dayDiff(start, w.d)), ys = W.map((w) => w.kg);
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  let num = 0, den = 0;
  xs.forEach((x, i) => {
    num += (x - mx) * (ys[i] - my);
    den += (x - mx) ** 2;
  });
  const slope = den ? num / den : 0;
  let intake = 0, est = 0;
  logged.forEach((d) => {
    const t = calc(d, true);
    intake += t.eat.k;
    est += t.burn;
  });
  intake /= logged.length;
  est /= logged.length;
  const real = intake - slope * 7700;
  const adj = Math.max(-700, Math.min(700, R(real - est)));
  return { ok: true, adj, real, est, intake, slope, days: logged.length, n: W.length, span };
}
function adaptiveText(A) {
  if (!A) return "Desactivado.";
  if (!A.ok) {
    const faltan = [];
    if (A.days < 10) faltan.push("registrar comidas en ".concat(10 - A.days, " día(s) más"));
    if (A.n < 3) faltan.push("pesarte ".concat(3 - A.n, " vez/veces más"));
    else if (A.span < 10) faltan.push("que tus pesajes cubran al menos 10 días");
    return "Aún aprendiendo: falta ".concat(faltan.join(" y "), " (últimas 4 semanas).");
  }
  const s = A.adj > 0 ? "+" : "";
  return "Con ".concat(A.days, " días registrados y ").concat(A.n, " pesajes: comiste ~").concat(fmt(A.intake), " kcal/día y tu peso cambió ").concat((A.slope * 7).toFixed(2).replace(".", ","), " kg/semana → tu gasto real es ~").concat(fmt(A.real), " kcal/día. Ajuste aplicado: ").concat(s).concat(fmt(A.adj), " kcal.");
}
