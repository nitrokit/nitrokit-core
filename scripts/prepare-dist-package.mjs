import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const distDir = resolve(root, 'dist');

function transformExports(exports) {
  if (!exports || typeof exports !== 'object') return exports;
  const transformPath = (p) => (typeof p === 'string' ? p.replace(/^\.\/dist\//, './') : p);

  const out = {};
  for (const [key, value] of Object.entries(exports)) {
    if (typeof value === 'string') {
      out[key] = transformPath(value);
    } else if (value && typeof value === 'object') {
      const sub = {};
      for (const [k, v] of Object.entries(value)) {
        sub[k] = transformPath(v);
      }
      out[key] = sub;
    } else {
      out[key] = value;
    }
  }
  return out;
}

(function main() {
  const pkgPath = resolve(root, 'package.json');
  const raw = readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(raw);

  // Ensure dist dir exists
  mkdirSync(distDir, { recursive: true });

  // Prepare a copy for dist publish root
  const distPkg = { ...pkg };

  // Since pkgRoot is 'dist', the package root becomes dist/.
  // Fix entry points to point to files at the new root.
  distPkg.main = './index.js';
  distPkg.types = './index.d.ts';
  if (distPkg.module && typeof distPkg.module === 'string') {
    distPkg.module = distPkg.module.replace(/^\.\/dist\//, './');
  }

  // Fix exports paths by removing leading './dist/'
  distPkg.exports = transformExports(distPkg.exports);

  // 'files' inside dist should include everything at new root; drop or broaden it
  // Remove to let npm include all (dist is already minimal)
  delete distPkg.files;

  // Optional: remove scripts that are irrelevant for consumers (not required)
  // Keep as-is to avoid surprises

  const outPath = resolve(distDir, 'package.json');
  writeFileSync(outPath, JSON.stringify(distPkg, null, 4) + '\n', 'utf8');
  console.log('Prepared dist/package.json');
})();
