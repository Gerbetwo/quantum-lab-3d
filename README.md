# QuantumLab 3D — Experimental Interactive Platform

> A high-performance, interactive 3D WebGL platform for educational experimentation in Quantum Computing basics (Qubits, Superposition, Entanglement, and Decoherence). Built with **Next.js 15**, **Three.js**, **Tailwind CSS**, and **TypeScript**.

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.171-orange?logo=three.js)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🔬 Experimental Research Overview

This application serves as the **Experimental Intervention Condition** for an empirical study comparing traditional lecture instruction (Master Class) against **Active 3D Interactive Discovery Learning**.

### Pedagogical Strategy: Active Discovery (Zero Spoilers)
Rather than displaying passive walls of text that spoon-feed exam answers, students directly manipulate quantum variables in real-time 3D:
1. **Mission 1: Superposition & Wavefunction Collapse** — Interactive 3D Bloch sphere and quantum coin. Students adjust angle $\theta$ and trigger the measurement scanner to observe physical state collapse to $|0\rangle$ or $|1\rangle$.
2. **Mission 2: Quantum Entanglement (Bell States)** — Interplanetary space orbit featuring Station Alice (Earth) and Station Bob (Andromeda). Students measure Alice's qubit and observe instantaneous non-local correlation across light-years without signal travel.
3. **Mission 3: Cryogenics & Thermal Decoherence** — 3D Dilution Refrigerator cryostat chandelier. A temperature slider ($0.015\text{ K} \to 300\text{ K}$) allows students to witness thermal particle bombardment destroying quantum coherence.
4. **Mission 4: Real-World Applications Matrix** — Holographic 3D models of molecular drug simulation, combinatorial route optimization, and quantum cryptography.

---

## 🚀 Technical Highlights

- **Session & Metrics Tracking (Cookies):** Each student is assigned a persistent unique identifier (`QL-XXXXX`). Time spent, interaction counts, and stage progression are recorded automatically for post-hoc empirical analysis.
- **Web Audio API Sound Engine:** 100% synthesized procedural sound effects (laser scan, quantum collapse, chime alerts) with zero external audio assets.
- **10-Minute Timed Session:** Integrated countdown timer to ensure controlled 10-minute intervention windows.
- **Ultra-Lightweight & Responsive:** Static build bundle size $< 250\text{ KB}$ running at a smooth 60 FPS on both mobile and desktop.

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

## ☁️ Deployment on Vercel

The application is optimized for zero-configuration deployment on **Vercel**:

```bash
npx vercel
```
