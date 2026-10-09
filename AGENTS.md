# AGENTS.md - AI & Developer Operational Guidelines

## Architecture Principles
1. **Unified State Management**: All quantum physical state updates must route through `useQuantumStore.ts`.
2. **Strict TypeScript Typing**: Avoid implicit `any` parameters across store initializers and event handlers.
3. **Synchronized Mathematical Representation**: Any interactive visual element MUST render its mathematical equivalent ($|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$) concurrently.
4. **Zero-Spoiler Gamification UX**: Predictions and observations must remain strictly separated until the user triggers explicit measurement actions.

## Script Automation Protocol
- Executions follow the atomic `script-per-phase` protocol with automatic fallback backups in `.backup_roadmap/`.
- Commits must explicitly target modified paths; do NOT use `git add -A`.
