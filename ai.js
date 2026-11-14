// Registrar comida describiéndola o con foto, usando Claude (Anthropic) con la API key del usuario
// (idea de fud-ai: "bring your own key"). La key se guarda solo en este dispositivo, fuera del respaldo.
const AI_KEY = 'watonql.aikey';
const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.3.0/+esm';
const getKey = () => { try { return localStorage.getItem(AI_KEY) || ''; } catch { return ''; } };
let aiImg = null, aiItems = [];

const AI_SYSTEM = `Eres un nutricionista chileno. La persona describe (o fotografía) lo que comió, estimado "al ojo", sin pesar nada.
Separa la comida en alimentos o preparaciones individuales y, para cada uno, estima la porción en palabras simples (ej. "1 plato", "1 marraqueta", "2 cucharadas", "1 vaso"), sus kcal y sus gramos de proteína, carbohidratos y grasas.
Si no se indica la cantidad, asume una porción típica en Chile. Usa nombres chilenos (palta, marraqueta, porotos, bebida, once).
Si la preparación suele llevar aceite, mayonesa o azúcar y se menciona o se ve, inclúyelo como alimento aparte. Responde en español.`;

const AI_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['alimentos'],
  properties: {
    alimentos: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['nombre', 'porcion', 'kcal', 'proteina', 'carbohidratos', 'grasas'],
        properties: {
          nombre: { type: 'string' }, porcion: { type: 'string' }, kcal: { type: 'number' },
          proteina: { type: 'number' }, carbohidratos: { type: 'number' }, grasas: { type: 'number' },
        },
      },
    },
  },
};

function openAI() {
  if (!getKey()) {
    return openSheet(head('✨ Describir con IA', 'openFood(fMeal)') + `
      <p>Para usar la IA necesitas una API key de Anthropic (Claude). Se configura una sola vez en <b>Perfil → IA</b>.</p>
      <button class="btn" onclick="closeSheet();goTab('perfil')">Ir a Perfil</button>`);
  }
  aiImg = null; aiItems = [];
  openSheet(head('✨ Describir con IA', 'openFood(fMeal)') + `
    <p class="small muted">Escribe lo que comiste como lo dirías. Ej: "un plato de porotos con riendas, una marraqueta con palta y un vaso de bebida".</p>
    <textarea id="aiq" rows="3" placeholder="¿Qué comiste?"></textarea>
    <label class="btn sec photo">📷 Agregar foto (opcional)<input type="file" accept="image/*" capture="environment" hidden onchange="aiPhoto(this.files[0])"></label>
    <div id="aiprev"></div>
    <button class="btn" id="aigo" onclick="aiRun()">Calcular</button>
    <div id="aires"></div>`);
  $('#aiq').focus();
}

// Reduce la foto a máx. 1024 px (JPEG) para que sea rápida y barata
function aiPhoto(file) {
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    const s = Math.min(1, 1024 / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = R(img.width * s); c.height = R(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const url = c.toDataURL('image/jpeg', 0.8);
    aiImg = url.split(',')[1];
    $('#aiprev').innerHTML = `<img src="${url}" class="aithumb" alt="Foto de la comida">`;
    URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(file);
}

async function aiRun() {
  const q = $('#aiq').value.trim();
  if (!q && !aiImg) return toast('Describe tu comida o agrega una foto');
  const btn = $('#aigo'); btn.disabled = true; btn.textContent = 'Calculando…';
  $('#aires').innerHTML = '';
  let Anthropic;
  try {
    ({ default: Anthropic } = await import(SDK_URL));
  } catch {
    btn.disabled = false; btn.textContent = 'Calcular';
    return ($('#aires').innerHTML = '<p class="neg">Sin conexión a internet.</p>');
  }
  try {
    const client = new Anthropic({ apiKey: getKey(), dangerouslyAllowBrowser: true });
    const content = [];
    if (aiImg) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: aiImg } });
    content.push({ type: 'text', text: q ? `Lo que comí: ${q}` : 'Estima lo que hay en la foto.' });
    const res = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: AI_SYSTEM,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: AI_SCHEMA } },
      messages: [{ role: 'user', content }],
    });
    if (res.stop_reason === 'refusal') throw new Error('La IA no pudo responder esta consulta. Prueba describiéndola de otra forma.');
    const txt = res.content.find(b => b.type === 'text')?.text;
    aiItems = JSON.parse(txt).alimentos || [];
    if (!aiItems.length) throw new Error('No reconocí alimentos. Prueba con más detalle.');
    aiShow();
  } catch (e) {
    let msg = e.message || 'Error desconocido';
    if (e instanceof Anthropic.AuthenticationError) msg = 'La API key no es válida. Revísala en Perfil → IA.';
    else if (e instanceof Anthropic.PermissionDeniedError) msg = 'La API key no tiene permiso o la cuenta no tiene saldo.';
    else if (e instanceof Anthropic.RateLimitError) msg = 'Demasiadas consultas seguidas. Espera un momento.';
    else if (e instanceof Anthropic.APIConnectionError) msg = 'Sin conexión con Anthropic.';
    else if (e instanceof Anthropic.APIError) msg = `Error de la API (${e.status}). Intenta de nuevo.`;
    $('#aires').innerHTML = `<p class="neg">${esc(msg)}</p>`;
  }
  btn.disabled = false; btn.textContent = 'Calcular de nuevo';
}

function aiShow() {
  const tot = aiItems.reduce((a, f) => a + f.kcal, 0);
  $('#aires').innerHTML = `<div class="label">Resultado (revisa y desmarca lo que no corresponda)</div>
    ${aiItems.map((f, i) => `<label class="item"><input type="checkbox" class="aick" data-i="${i}" checked><div class="grow"><div>${esc(f.nombre)}</div><div class="small muted">${esc(f.porcion)} · P ${R(f.proteina)} · C ${R(f.carbohidratos)} · G ${R(f.grasas)}</div></div><div class="kc">${fmt(f.kcal)}</div></label>`).join('')}
    <div class="row"><b>Total</b><b>${fmt(tot)} kcal</b></div>
    <div class="label">Agregar a</div><div class="chips">${MEALS.map(([m, l]) => chip(l, m === fMeal, `fMeal='${m}';setOn(this)`)).join('')}</div>
    <button class="btn" onclick="aiAdd()">Agregar</button>`;
}

function aiAdd() {
  const sel = [...document.querySelectorAll('.aick')].filter(c => c.checked).map(c => aiItems[+c.dataset.i]);
  if (!sel.length) return toast('No hay nada marcado');
  sel.forEach(f => ensureDay(cur).foods.push({
    ref: null, n: f.nombre, meal: fMeal, q: f.porcion + ' · IA',
    k: R(f.kcal), p: r1(f.proteina), c: r1(f.carbohidratos), f: r1(f.grasas),
  }));
  save(); closeSheet(); render(); toast(`Agregado: ${fmt(sel.reduce((a, f) => a + f.kcal, 0))} kcal`);
}

function saveKey() {
  const k = $('#aik').value.trim();
  if (!k.startsWith('sk-ant-')) return toast('La key debe empezar con sk-ant-');
  try { localStorage.setItem(AI_KEY, k); } catch {}
  render(); toast('API key guardada');
}
function delKey() { try { localStorage.removeItem(AI_KEY); } catch {} render(); toast('API key borrada'); }
