#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const TARGETS = ['src/components', 'src/features', 'src/app'];
const ALLOW = [
  /^\s*$/,
  /^[\s\p{P}\p{S}]+$/u,
  /^[|·•<>⟨⟩⁺⁻₀₁√±×→←↑↓⚡✨🎉🖥🌡⚛]+$/u,
  /^\[.*\]$/,
  /^[0-9.]+\s*[a-zA-Zμ]?$/,
  /^[0-9]+\s*\/\s*[0-9]+$/,
  /^[A-Z]{2,3}$/,
  /^[XYZ]:$/,
  /^SU\(\d+\)$/,
  /^P\(\|[01]⟩\):?$/,
  /^\d+(\.\d+)?°.*$/,
  /^\d+\s*(mK|K)$/,
  /^\d+\s*mK\s*\(.*\)$/,
  /^\d+(,\d+)*\s*(mK|K)\s*\(.*\)$/,
];
const ATTRS = ['title', 'aria-label', 'aria-description', 'placeholder', 'label'];

function walk(d) {
  const out = [];
  try {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (
        n === 'node_modules' ||
        n.startsWith('.') ||
        n === '__tests__' ||
        n.includes('.test.') ||
        n.includes('.spec.')
      ) {
        continue;
      }
      const s = statSync(p);
      if (s.isDirectory()) out.push(...walk(p));
      else if (/\.(tsx|jsx)$/.test(n)) out.push(p);
    }
  } catch { /* ignore */ }
  return out;
}
const ok = (t) => ALLOW.some((re) => re.test(t));

function strip(src) {
  let o = src.replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
  o = o.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  return o;
}

let v = 0;
for (const file of TARGETS.flatMap((d) => walk(join(ROOT, d)))) {
  const raw = readFileSync(file, 'utf8');
  const src = strip(raw);

  const re = />([^<>{}\n]+)</g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const t = m[1].trim();
    if (!t || ok(t)) continue;
    const ln = src.slice(0, m.index).split('\n').length;
    console.error(`${relative(ROOT, file)}:${ln}: raw JSX text -> "${t.slice(0, 60)}"`);
    v++;
  }

  for (const attr of ATTRS) {
    const r = new RegExp(`\\b${attr}\\s*=\\s*"([^"]*)"`, 'g');
    let am;
    while ((am = r.exec(src)) !== null) {
      const t = am[1].trim();
      if (!t || ok(t)) continue;
      const ln = src.slice(0, am.index).split('\n').length;
      console.error(`${relative(ROOT, file)}:${ln}: attr ${attr} -> "${t.slice(0, 60)}"`);
      v++;
    }
  }
}

if (v > 0) {
  console.error(`\n❌ ${v} hardcoded UI strings.`);
  process.exit(1);
}
console.log('✅ i18n audit passed.');
