Here is the updated and streamlined top-level project documentation (`README.md`), revised to reflect the current Next.js version, seven guided missions, actual route structure, persistence behavior, and available scripts while removing obsolete or unverified claims.

---

# QuantumLab 3D — Experimental Interactive Platform

> A high-performance interactive 3D WebGL platform for educational experimentation in Quantum Computing basics. Built with **Next.js 16**, **Three.js**, **Tailwind CSS**, and **TypeScript**.
> 
> 

---

## 🔬 Guided Missions

The platform features **seven guided quantum missions** designed for active discovery learning:

* **Missions 0–3:** Core quantum foundations including superposition, Bloch sphere representation, entanglement, and thermal decoherence.
* **Missions 4–6:** Advanced quantum concepts and algorithmic explorations.

---

## 🚀 Technical Highlights

* **Persistence:** Session tracking and user progress managed via local cookies (`js-cookie`).


* **Audio Engine:** Web Audio API synthesized procedural sound effects.
* **Architecture:** Built on the Next.js App Router and Three.js 3D WebGL rendering pipeline.



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
|-- app/                       # Next.js App Router (layout.tsx, page.tsx)
|-- components/                # UI components and 3D mission modules
|-- domain/quantum/            # Pure domain logic for quantum calculations
|-- hooks/                     # Custom React hooks (e.g., useThreeScene)
\-- lib/                       # Utilities, cookies persistence, sound engine, Three.js setup

```

---

## 📜 Available Scripts

* `npm run dev` — Starts the local development server.
* `npm run build` — Compiles the application for production.
* `npm run lint` — Runs ESLint code quality checks.