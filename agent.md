# Agent Directive: Centralized Design Tokens

## Rule 1: No Decentralized Styles
- **Never** hardcode raw hex values (e.g., `bg-[#0B0E14]`, `text-[#00F0FF]`, `border-[#1E293B]`) directly inside component files or Tailwind utility strings.
- Always use centralized design tokens defined in `src/app/globals.css` and mapped in Tailwind (`bg-background`, `text-quantum-cyan`, `border-border`, etc.).

## Rule 2: Validation
- Always run `npm run lint:tokens` and `npm run validate` before submitting changes to ensure design token centralization is strictly maintained.
