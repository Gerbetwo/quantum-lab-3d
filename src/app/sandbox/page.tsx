import { CircuitWorkbench } from '@/components/circuit/CircuitWorkbench';

export const metadata = {
  title: 'QuantumLab 3D - Workbench Interactivo',
  description: 'Editor interactivo de circuitos cuánticos con simulación 3D en tiempo real.',
};

export default function SandboxPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-8">
      <CircuitWorkbench />
    </main>
  );
}
