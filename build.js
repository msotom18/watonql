// Genera docs/ (lo que publica GitHub Pages) con el JavaScript traducido para
// iPhones antiguos (Safari 12+) y Androids antiguos. Uso: npm run build
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const OUT = path.join(__dirname, 'docs');
const TARGET = ['safari12', 'ios12', 'chrome70', 'firefox68'];
const COPY = ['index.html', 'styles.css', 'manifest.json', 'icon-192.png', 'icon-512.png', 'img', 'lib'];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
for (const f of COPY) fs.cpSync(path.join(__dirname, f), path.join(OUT, f), { recursive: true });

const js = fs.readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== 'build.js');
for (const f of js) {
  const src = fs.readFileSync(path.join(__dirname, f), 'utf8');
  // Sin minificar ni renombrar: las funciones siguen siendo globales para los onclick del HTML
  const { code } = esbuild.transformSync(src, { target: TARGET, loader: 'js', charset: 'utf8' });
  fs.writeFileSync(path.join(OUT, f), code);
}
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log(`docs/ listo: ${js.length} archivos JS traducidos para ${TARGET.join(', ')}`);
