import * as fs from 'fs';
import * as path from 'path';

const TARGET_DIR = path.resolve(process.cwd(), 'src');
const FORBIDDEN_PATTERNS = [
  /bg-\[#\w+\]/i,
  /text-\[#\w+\]/i,
  /border-\[#\w+\]/i,
  /ring-\[#\w+\]/i
];

let violationsFound = 0;

function auditFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  FORBIDDEN_PATTERNS.forEach((pattern) => {
    if (pattern.test(content)) {
      console.error(`[Token Violation] Hardcoded hex style detected in ${path.relative(process.cwd(), filePath)} matching pattern ${pattern}`);
      violationsFound++;
    }
  });
}

function walk(dir: string) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach((file) => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (full.endsWith('.tsx') || full.endsWith('.ts')) auditFile(full);
  });
}

walk(TARGET_DIR);

if (violationsFound > 0) {
  console.error(`\n❌ Found ${violationsFound} design token decentralization violation(s). Use centralized theme tokens.`);
  process.exit(1);
} else {
  console.log('✅ Design token audit passed: 100% centralized.');
}
