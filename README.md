# QuantumLab 3D — Experimental Interactive Platform

> A high-performance interactive 3D WebGL platform for educational experimentation in Quantum Computing basics. Built with **Next.js 16**, **Three.js**, **Tailwind CSS**, and **TypeScript**.

---

## 🔬 Guided Missions

The platform features **seven guided quantum missions** designed for active discovery learning:

* **Missions 0–3:** Core quantum foundations including superposition, Bloch sphere representation, entanglement, and thermal decoherence.
* **Missions 4–6:** Advanced quantum algorithms (Grover search, Shor factorization, 3-qubit bit-flip QEC).

---

## 🚀 Technical Highlights

* **Persistence:** Session tracking and user progress managed via local cookies (`js-cookie`) and Zustand storage.
* **Audio Engine:** Web Audio API synthesized procedural sound effects without external audio assets.
* **Unified State & Single WebGL Context:** Centralized Zustand store routing with persistent singleton WebGLRenderer canvas.
* **Built-in i18n:** Zero-dependency ES/EN dictionary and translation selector.

---

## 🛠️ Getting Started Locally

```bash
# Clone the repository
git clone https://github.com/<your-username>/quantum-lab-3d.git

# Enter project directory
cd quantum-lab-3d

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗂️ Route & Code Structure

```text
src/
|-- app/                       # Next.js App Router (layout.tsx, page.tsx, learn/, sandbox/, missions/)
|-- components/                # Tactical HUD overlays, App Shell, modals, and design tokens
|-- core/                      # Pure quantum math & algorithms (qubitMath, decoherenceMath, algorithms)
|-- features/
|   |-- quantum-core/          # WebGL Bloch viewport, raycasting gizmos, shader overlays, particles
|   \-- missions/              # Mission registry, in-mission workspace, and algorithm controls
|-- lib/                       # Web Audio procedural sound engine, i18n dictionary, utilities
|-- store/                     # Unified Zustand store (useQuantumStore.ts)
\-- tests/                     # Vitest unit & component integration test suites
```

---

## 📜 Available Scripts

* `npm run dev` — Starts the local development server.
* `npm run build` — Compiles the application for production.
* `npm run test` — Runs the Vitest test suites.
* `npm run lint` — Runs ESLint code quality checks.
* `npm run test:e2e` — Runs Playwright end-to-end flight-deck tests.