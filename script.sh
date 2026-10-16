#!/usr/bin/env bash
set -e

echo "=== [1/5] Creating Archive and Target Directories ==="
mkdir -p tests/archive
mkdir -p src/archive
mkdir -p src/lib/audio
mkdir -p src/lib/three

echo "=== [2/5] Archiving Obsolete Test Helpers & Unreferenced UI Components ==="
# Move unreferenced test helpers to archive
[ -f tests/helpers/queries.ts ] && mv tests/helpers/queries.ts tests/archive/
[ -f tests/helpers/renderWithProviders.tsx ] && mv tests/helpers/renderWithProviders.tsx tests/archive/
[ -f tests/helpers/rng.ts ] && mv tests/helpers/rng.ts tests/archive/

# Move orphan UI components to archive
[ -f src/components/UI.tsx ] && mv src/components/UI.tsx src/archive/
[ -f src/components/Views.tsx ] && mv src/components/Views.tsx src/archive/

# Move orphan E2E pages to archive if present
[ -f tests/e2e/pages/LandingPage.ts ] && mv tests/e2e/pages/LandingPage.ts tests/archive/
[ -f tests/e2e/pages/CelebrationPage.ts ] && mv tests/e2e/pages/CelebrationPage.ts tests/archive/
[ -f tests/e2e/pages/MissionPage.ts ] && mv tests/e2e/pages/MissionPage.ts tests/archive/
[ -f tests/e2e/pages/LabPage.ts ] && mv tests/e2e/pages/LabPage.ts tests/archive/

echo "=== [3/5] Updating Test Configuration Files ==="

# Patch vite.config.ts for proper vitest test matching
node -e '
const fs = require("fs");
if (fs.existsSync("vite.config.ts")) {
  let content = fs.readFileSync("vite.config.ts", "utf8");
  if (!content.includes(`include: ["tests/**/*.{test,spec}.{ts,tsx}"]`)) {
    content = content.replace(/test:\s*\{/, `test: {\n    include: ["tests/**/*.{test,spec}.{ts,tsx}"],`);
    fs.writeFileSync("vite.config.ts", content);
  }
}
'

# Patch vitest.setup.ts to install WebGL stubs
node -e '
const fs = require("fs");
if (fs.existsSync("vitest.setup.ts")) {
  let content = fs.readFileSync("vitest.setup.ts", "utf8");
  if (!content.includes("installWebStubs")) {
    content = `import { installWebStubs } from "./tests/helpers/webgl-stub";\ninstallWebStubs();\n` + content;
    fs.writeFileSync("vitest.setup.ts", content);
  }
}
'

# Patch playwright.config.ts to match root test files
node -e '
const fs = require("fs");
if (fs.existsSync("playwright.config.ts")) {
  let content = fs.readFileSync("playwright.config.ts", "utf8");
  content = content.replace(/testDir:\s*["\x27][^"\x27]+["\x27]/, `testDir: "./tests"`);
  if (!content.includes("testMatch")) {
    content = content.replace(/testDir:\s*["\x27]\.\/tests["\x27]/, `testDir: "./tests",\n  testMatch: "e2e.spec.ts"`);
  }
  fs.writeFileSync("playwright.config.ts", content);
}
'

echo "=== [4/5] Creating Skeleton Files ==="
touch src/lib/audio/sonification.ts
touch src/lib/audio/audioEngine.ts
touch src/lib/three/rendererSingleton.ts

echo "=== [5/5] Staging Phase 1 Infrastructure Commit ==="
git add .
git commit -m "fix(test): align test harness, webgl stubs, archive orphan files, and update test configs" || true

echo "=== Phase 1 Environment Preparation Complete ==="