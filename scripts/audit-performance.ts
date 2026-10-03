#!/usr/bin/env tsx
/**
 * Phase 4 - Bundle size and memory-leak audit.
 * Runs standalone: npx tsx scripts/audit-performance.ts
 *
 * Requires: .next/ present (run `npm run build` first).
 * Exits 0 when all chunks under gzip budget; 1 otherwise.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';

const ROOT = process.cwd();
const NEXT_DIR = path.join(ROOT, '.next');
const STATIC_DIR = path.join(NEXT_DIR, 'static');
const CHUNKS_DIR = path.join(STATIC_DIR, 'chunks');
const BUDGET_GZIP = 250 * 1024;

interface ChunkInfo {
  path: string;
  raw: number;
  gzip: number;
  brotli: number;
  status: 'OK' | 'OVER';
}

function listJsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
    }
  };
  walk(dir);
  return out;
}

function gzipSize(buf: Buffer): number {
  return zlib.gzipSync(buf, { level: 9 }).length;
}

function brotliSize(buf: Buffer): number {
  return zlib.brotliCompressSync(buf, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
    },
  }).length;
}

function checkChunks(): ChunkInfo[] {
  const roots = [CHUNKS_DIR, STATIC_DIR].filter((d) => fs.existsSync(d));
  const seen = new Set<string>();
  const files: string[] = [];
  for (const r of roots) {
    for (const f of listJsFiles(r)) {
      if (!seen.has(f)) { seen.add(f); files.push(f); }
    }
  }
  const out: ChunkInfo[] = [];
  for (const f of files) {
    const buf = fs.readFileSync(f);
    const gz = gzipSize(buf);
    const br = brotliSize(buf);
    out.push({
      path: path.relative(ROOT, f),
      raw: buf.length,
      gzip: gz,
      brotli: br,
      status: gz > BUDGET_GZIP ? 'OVER' : 'OK',
    });
  }
  return out;
}

interface LeakFinding { id: string; file: string; detail: string; }

function auditLeaks(): LeakFinding[] {
  const findings: LeakFinding[] = [];
  const srcDir = path.join(ROOT, 'src');
  if (!fs.existsSync(srcDir)) return findings;

  const walk = (d: string): void => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = fs.readFileSync(full, 'utf-8');
        const rel = path.relative(ROOT, full);
        const adds = (content.match(/addEventListener\(/g) ?? []).length;
        const removes = (content.match(/removeEventListener\(/g) ?? []).length;
        if (adds > 0 && removes === 0) {
          findings.push({ id: 'LISTENER-LEAK', file: rel, detail: adds + ' add(s), 0 remove(s)' });
        }
        if (/new (AudioContext|webkitAudioContext)/.test(content) && !/\.close\(\)/.test(content)) {
          findings.push({ id: 'AUDIO-LEAK', file: rel, detail: 'AudioContext without .close()' });
        }
        if (/new WebGLRenderer/.test(content) && !rel.endsWith('createScene.ts')) {
          findings.push({ id: 'RENDERER-LEAK', file: rel, detail: 'WebGLRenderer outside createScene' });
        }
      }
    }
  };
  walk(srcDir);
  return findings;
}

function main(): void {
  if (!fs.existsSync(NEXT_DIR)) {
    console.error('[audit] .next/ not found. Run `npm run build` first.');
    process.exit(1);
  }
  const chunks = checkChunks();
  const leaks = auditLeaks();

  chunks.sort((a, b) => b.gzip - a.gzip);

  console.log('');
  console.log('== Chunk size audit (gzip budget ' + (BUDGET_GZIP / 1024).toFixed(0) + ' KB) ==');
  console.log('| Path | Raw | Gzip | Brotli | Status |');
  console.log('|---|---|---|---|---|');
  for (const c of chunks) {
    console.log('| ' + c.path + ' | ' + (c.raw / 1024).toFixed(1) + ' KB | ' +
      (c.gzip / 1024).toFixed(1) + ' KB | ' + (c.brotli / 1024).toFixed(1) + ' KB | ' + c.status + ' |');
  }

  console.log('');
  console.log('== Leak heuristics ==');
  if (leaks.length === 0) console.log('No leaks detected.');
  else for (const l of leaks) console.log('[' + l.id + '] ' + l.file + ': ' + l.detail);

  const report = {
    timestamp: new Date().toISOString(),
    budgetBytes: BUDGET_GZIP,
    totalChunks: chunks.length,
    overBudget: chunks.filter((c) => c.status === 'OVER').length,
    chunks,
    leaks,
  };

  const reportPath = path.join(ROOT, '.backup_phase-4', 'audit-performance.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const oversized = chunks.filter((c) => c.status === 'OVER');
  if (oversized.length > 0) {
    console.error('');
    console.error('FAIL: ' + oversized.length + ' chunk(s) exceed gzip budget');
    for (const c of oversized) {
      console.error('  - ' + c.path + ' => ' + (c.gzip / 1024).toFixed(1) + ' KB');
    }
    process.exit(1);
  }
  console.log('');
  console.log('OK: all chunks within budget.');
}

main();
