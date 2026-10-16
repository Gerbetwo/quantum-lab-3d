// @ts-nocheck
/* eslint-disable */
// Archived from src/components/AppLayout.tsx

// Symbol: GlobalListeners
export function GlobalListeners() {
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);

  useEffect(() => {
    // Unlock Web Audio API upon first user interaction
    const handleUnlock = () => {
      audioEngine
        .unlock()
        .then(() => {
          window.removeEventListener('pointerdown', handleUnlock);
          window.removeEventListener('keydown', handleUnlock);
        })
        .catch(() => {
          // Handled safely within audioEngine
        });
    };

    window.addEventListener('pointerdown', handleUnlock);
    window.addEventListener('keydown', handleUnlock);

    // Evaluate mission completion status from browser storage
    const alreadyCelebrated = localStorage.getItem('quantum_lab_celebration_shown') === 'true';
    if (!alreadyCelebrated) {
      try {
        const completedMissionsStr = localStorage.getItem('quantum_lab_completed_missions');
        const completed: string[] = completedMissionsStr ? JSON.parse(completedMissionsStr) : [];

        const allSevenComplete = CANONICAL_MISSIONS.every((id) => {
          const inArray = completed.includes(id);
          const byKey =
            localStorage.getItem(`mission_completed_${id}`) === 'true' ||
            localStorage.getItem(`quantum-lab-mission-${id}-completed`) === 'true';
          return inArray || byKey;
        });

        if (allSevenComplete) {
          // Schedule state update in the microtask queue to avoid synchronous cascading renders
          queueMicrotask(() => {
            setIsCelebrationOpen(true);
          });
        }
      } catch (error) {
        console.error('Error evaluating mission completion status:', error);
      }
    }

    return () => {
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
    };
  }, []);

  const handleCloseCelebration = () => {
    setIsCelebrationOpen(false);
    localStorage.setItem('quantum_lab_celebration_shown', 'true');
  };

  return <CelebrationModal isOpen={isCelebrationOpen} onClose={handleCloseCelebration} />;
}

// Symbol: AppShellComponent
export function AppShellComponent({ children, header, footer, className = '' }: AppShellComponentProps) {
  const activeMissionId = useQuantumStore((_s: any) => _s.activeMissionId);
  const selectMission = useQuantumStore((_s: any) => _s.selectMission);
  const resetState = useQuantumStore((_s: any) => _s.resetState);

  const missionList = MISSIONS.slice(0, 7);

  const defaultTopBar = (
    <header className="w-full border-b border-border bg-background-80/90 backdrop-blur-md px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold text-accent tracking-wider uppercase">
          QUANTUM LAB 3D
        </span>
      </div>

      {/* 7 Unlocked Mission Buttons (M0 to M6) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {missionList.map((m, index) => {
          const isSelected = activeMissionId === index;
          return (
            <button
              key={m.id || index}
              type="button"
              onClick={() => selectMission(index)}
              title={m.title}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-accent text-accent-foreground shadow-md shadow-accent/20 border border-accent'
                  : 'bg-card/70 hover:bg-card text-foreground hover:text-accent border border-border/80'
              }`}
            >
              M{index}
            </button>
          );
        })}
      </div>

      {/* Prominent Reset State Button */}
      <div>
        <button
          type="button"
          onClick={() => resetState()}
          className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/50 transition-all cursor-pointer shadow-sm shadow-destructive/20"
        >
          Reset State
        </button>
      </div>
    </header>
  );

  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col ${className ?? ''}`}>
      {header ?? defaultTopBar}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      {footer}
    </div>
  );
}

// Symbol: AppNavigation
export const AppNavigation: React.FC<AppNavigationProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 px-6 py-2 border-b border-[#29364d] bg-[#0b1020]" role="navigation" aria-label="Navegación principal">
      {items.map(item => (
        <button
          key={item.id}
          onClick={item.onClick ?? undefined}
          aria-current={item.active ? 'page' : undefined}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            item.active
              ? 'bg-[#172238] text-[#53d8e8] border border-[#53d8e8]/30'
              : 'text-[#a6b2c6] hover:text-[#f3f6fc] hover:bg-[#111a2c]'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
};

// Symbol: AppShellComponentProps
export interface AppShellComponentProps {
  children?: React.ReactNode | null;
  header?: React.ReactNode | null;
  footer?: React.ReactNode | null;
  className?: string | null;
}
