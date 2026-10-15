import React, { createRef } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, test, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import '@testing-library/jest-dom';

import CelebrationModal from '@/shared/layout/CelebrationModal';
import CircuitGrid from '@/features/circuit/components/CircuitGrid';
import CommandPalette, { type Command } from '@/shared/layout/CommandPalette';
import GatePalette from '@/features/circuit/components/GatePalette';
import { Header } from '@/shared/layout/Header';
import {
  MeasurementParticles,
  MeasurementParticlesHandle,
} from '@/features/quantum-3d/canvas/MeasurementParticles';
import { MissionShell } from '@/features/missions/components/MissionShell';
import { MISSIONS } from '@/features/missions/config/missions';
import PhaseDiskView from '@/features/circuit/components/viewports/PhaseDiskView';
import Tooltip from '@/shared/ui/Tooltip';
import { AppShell } from '@/shared/layout/AppShell';
import { SceneStage } from '@/features/quantum-3d/components/SceneStage';
import { BlochSphereScene } from '@/features/quantum-3d/scenes/BlochSphereScene';
import { Button } from '@/shared/ui/Button';
import { RangeControl } from '@/shared/ui/RangeControl';
import { StatusMessage } from '@/shared/ui/StatusMessage';

import { createEmptyCircuit, placeGate } from '@/core/math/circuit';
import { createZeroState } from '@/core/math/statevector';

vi.mock('@/features/session/components/SessionProvider', () => ({
  useSession: () => ({
    session: {
      userId: 'QL-ABCD',
      completed: [],
      missionState: {},
      timerSeconds: 600,
      timerRunning: false,
    },
    updateMissionState: vi.fn(),
    completeMission: vi.fn(),
    updateTimer: vi.fn(),
    toggleTimer: vi.fn(),
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/shared/lib/sound', () => ({ playChimeSuccess: vi.fn() }));
vi.mock('@/features/session/lib/sessionService', () => ({
  getOrCreateUserId: vi.fn(() => 'QL-ABCD'),
  updateStoredMetrics: vi.fn(),
  downloadSessionJSON: vi.fn(),
}));

const { confettiFnMock, confettiResetMock } = vi.hoisted(() => ({
  confettiFnMock: vi.fn(),
  confettiResetMock: vi.fn(),
}));

vi.mock('canvas-confetti', () => ({
  default: Object.assign(confettiFnMock, { reset: confettiResetMock }),
}));

vi.mock('@/features/quantum-3d/lib/sceneManager', () => ({
  prefersReducedMotion: vi.fn(() => false),
}));

describe('Phase 4 - CelebrationModal cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when closed', () => {
    render(<CelebrationModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('celebration-modal')).not.toBeInTheDocument();
  });

  it('renders userId and default CTA when open without formUrl', () => {
    render(<CelebrationModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('celebration-modal')).toBeInTheDocument();
    expect(screen.getByTestId('celebration-user-id')).toHaveTextContent('QL-ABCD');
    expect(screen.getByRole('button', { name: /Cerrar y Revisar Módulos/i })).toBeInTheDocument();
  });

  it('autofocuses the first focusable element', () => {
    render(<CelebrationModal isOpen={true} onClose={vi.fn()} />);
    const close = screen.getByRole('button', { name: /Cerrar y Revisar Módulos/i });
    expect(close).toHaveFocus();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<CelebrationModal isOpen={true} onClose={onClose} />);
    const close = screen.getByRole('button', { name: /Cerrar y Revisar Módulos/i });
    fireEvent.keyDown(close, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls confetti.reset on unmount', () => {
    const { unmount } = render(<CelebrationModal isOpen={true} onClose={vi.fn()} />);
    unmount();
    expect(confettiResetMock).toHaveBeenCalled();
  });
});


describe('CircuitGrid', () => {
  it('renders 6x16 gridcells for a 6-qubit 16-depth circuit', () => {
    const circuit = createEmptyCircuit(6, 16);
    render(
      <CircuitGrid
        circuit={circuit}
        activeGate={null}
        playhead={0}
        onPlaceGate={vi.fn()}
        onRemoveGate={vi.fn()}
        onSetPlayhead={vi.fn()}
      />,
    );
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell')).toHaveLength(96);
  });
  it('invokes onPlaceGate with (step, qubit) on click', () => {
    const circuit = createEmptyCircuit(2, 4);
    const onPlaceGate = vi.fn();
    render(
      <CircuitGrid
        circuit={circuit}
        activeGate="H"
        playhead={0}
        onPlaceGate={onPlaceGate}
        onRemoveGate={vi.fn()}
        onSetPlayhead={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('cell-0-0'));
    expect(onPlaceGate).toHaveBeenCalledWith(0, 0);
  });
  it('highlights the playhead column', () => {
    const circuit = createEmptyCircuit(2, 4);
    render(
      <CircuitGrid
        circuit={circuit}
        activeGate={null}
        playhead={2}
        onPlaceGate={vi.fn()}
        onRemoveGate={vi.fn()}
        onSetPlayhead={vi.fn()}
      />,
    );
    expect(screen.getByTestId('playhead-2')).toHaveAttribute('data-playhead', 'true');
    expect(screen.getByTestId('playhead-1')).not.toHaveAttribute('data-playhead');
  });
  it('invokes onSetPlayhead on header click', () => {
    const circuit = createEmptyCircuit(2, 4);
    const onSetPlayhead = vi.fn();
    render(
      <CircuitGrid
        circuit={circuit}
        activeGate={null}
        playhead={0}
        onPlaceGate={vi.fn()}
        onRemoveGate={vi.fn()}
        onSetPlayhead={onSetPlayhead}
      />,
    );
    fireEvent.click(screen.getByTestId('playhead-3'));
    expect(onSetPlayhead).toHaveBeenCalledWith(3);
  });
  it('invokes onRemoveGate on Delete key over an occupied cell', () => {
    let circuit = createEmptyCircuit(2, 4);
    circuit = placeGate(circuit, { type: 'H', step: 0, targets: [0] });
    const onRemoveGate = vi.fn();
    render(
      <CircuitGrid
        circuit={circuit}
        activeGate={null}
        playhead={0}
        onPlaceGate={vi.fn()}
        onRemoveGate={onRemoveGate}
        onSetPlayhead={vi.fn()}
      />,
    );
    fireEvent.keyDown(screen.getByTestId('cell-0-0'), { key: 'Delete' });
    expect(onRemoveGate).toHaveBeenCalledTimes(1);
  });
});


function noop() {}

describe('Phase 3 - CircuitGrid micro-interactions', () => {
  it('renders gridcells for 6x16 circuit', () => {
    render(
      <CircuitGrid
        circuit={createEmptyCircuit(6, 16)}
        activeGate={null}
        playhead={0}
        onPlaceGate={noop}
        onRemoveGate={noop}
        onSetPlayhead={noop}
      />
    );
    expect(screen.getAllByRole('gridcell')).toHaveLength(96);
  });

  it('marks the current playhead column with data-playhead=true', () => {
    render(
      <CircuitGrid
        circuit={createEmptyCircuit(2, 4)}
        activeGate={null}
        playhead={2}
        onPlaceGate={noop}
        onRemoveGate={noop}
        onSetPlayhead={noop}
      />
    );
    expect(screen.getByTestId('playhead-2')).toHaveAttribute('data-playhead', 'true');
    expect(screen.getByTestId('playhead-1')).not.toHaveAttribute('data-playhead', 'true');
  });

  it('does not crash when activeGate is null', () => {
    render(
      <CircuitGrid
        circuit={createEmptyCircuit(2, 4)}
        activeGate={null}
        playhead={0}
        onPlaceGate={noop}
        onRemoveGate={noop}
        onSetPlayhead={noop}
      />
    );
    expect(screen.getByTestId('circuit-grid')).toBeInTheDocument();
  });

  it('invokes onPlaceGate when clicking a cell with activeGate', () => {
    const onPlaceGate = vi.fn();
    render(
      <CircuitGrid
        circuit={createEmptyCircuit(2, 4)}
        activeGate="H"
        playhead={0}
        onPlaceGate={onPlaceGate}
        onRemoveGate={noop}
        onSetPlayhead={noop}
      />
    );
    fireEvent.click(screen.getByTestId('cell-0-0'));
    expect(onPlaceGate).toHaveBeenCalledWith(0, 0);
  });

  it('invokes onSetPlayhead when clicking header column', () => {
    const onSet = vi.fn();
    render(
      <CircuitGrid
        circuit={createEmptyCircuit(2, 4)}
        activeGate={null}
        playhead={0}
        onPlaceGate={noop}
        onRemoveGate={noop}
        onSetPlayhead={onSet}
      />
    );
    fireEvent.click(screen.getByTestId('playhead-3'));
    expect(onSet).toHaveBeenCalledWith(3);
  });
});


function makeCommands(handlers = { a: vi.fn(), b: vi.fn(), c: vi.fn() }): Command[] {
  return [
    { id: 'a', title: 'Ir a Tarea 1', keywords: ['mision', 'superposicion'], action: handlers.a },
    { id: 'b', title: 'Reiniciar laboratorio', keywords: ['restart', 'reset'], action: handlers.b },
    { id: 'c', title: 'Pantalla completa', keywords: ['fullscreen'], action: handlers.c },
  ];
}

describe('Phase 3 - CommandPalette', () => {
  it('renders nothing when closed', () => {
    render(<CommandPalette isOpen={false} onClose={vi.fn()} commands={makeCommands()} />);
    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
  });

  it('renders dialog with combobox and all options when open', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={makeCommands()} />);
    expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /buscar comandos/i })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('autofocuses the search input', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={makeCommands()} />);
    // Focus is deferred via setTimeout(0); jsdom runs it synchronously enough for this assertion.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(screen.getByRole('combobox')).toHaveFocus();
        resolve();
      }, 5);
    });
  });

  it('filters options by query', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={makeCommands()} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'restart' } });
    const opts = screen.getAllByRole('option');
    expect(opts).toHaveLength(1);
    expect(opts[0]).toHaveTextContent(/Reiniciar/i);
  });

  it('shows empty state when no matches', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={makeCommands()} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzzz' } });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText(/Sin coincidencias/i)).toBeInTheDocument();
  });

  it('executes command on click', () => {
    const handlers = { a: vi.fn(), b: vi.fn(), c: vi.fn() };
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} commands={makeCommands(handlers)} />);
    fireEvent.click(screen.getByRole('option', { name: /Reiniciar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(handlers.b).toHaveBeenCalledTimes(1);
  });

  it('executes command on Enter', () => {
    const handlers = { a: vi.fn(), b: vi.fn(), c: vi.fn() };
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} commands={makeCommands(handlers)} />);
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(handlers.a).toHaveBeenCalledTimes(1);
  });

  it('navigates with ArrowDown/ArrowUp and wraps', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={makeCommands()} />);
    const input = screen.getByRole('combobox');
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(screen.getAllByRole('option')[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onClose on Escape', () => {
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} commands={makeCommands()} />);
    fireEvent.keyDown(screen.getByTestId('command-palette'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking the backdrop', () => {
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} commands={makeCommands()} />);
    fireEvent.mouseDown(screen.getByTestId('command-palette'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});


describe('GatePalette', () => {
  it('renders a listbox with 9 default gates', () => {
    render(<GatePalette selected={null} onSelect={vi.fn()} />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(9);
  });
  it('invokes onSelect with the clicked gate', () => {
    const onSelect = vi.fn();
    render(<GatePalette selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('gate-option-H'));
    expect(onSelect).toHaveBeenCalledWith('H');
  });
  it('marks the selected gate with aria-selected=true', () => {
    render(<GatePalette selected="X" onSelect={vi.fn()} />);
    expect(screen.getByTestId('gate-option-X')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('gate-option-H')).toHaveAttribute('aria-selected', 'false');
  });
  it('does not invoke onSelect when a gate is disabled', () => {
    const onSelect = vi.fn();
    render(<GatePalette selected={null} onSelect={onSelect} disabled={['H']} />);
    fireEvent.click(screen.getByTestId('gate-option-H'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});


describe('Phase 3 - GatePalette iconographic', () => {
  it('renders one option per gate (9 by default)', () => {
    render(<GatePalette selected={null} onSelect={vi.fn()} />);
    expect(screen.getAllByRole('option')).toHaveLength(9);
  });

  it('every option has an accessible name (aria-label / text)', () => {
    render(<GatePalette selected={null} onSelect={vi.fn()} />);
    const opts = screen.getAllByRole('option');
    for (const o of opts) {
      const label = o.getAttribute('aria-label') || o.textContent || '';
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('renders an svg icon inside each option', () => {
    render(<GatePalette selected={null} onSelect={vi.fn()} />);
    for (const o of screen.getAllByRole('option')) {
      expect(o.querySelector('svg')).toBeTruthy();
    }
  });

  it('preserves data-testid=gate-option-H (no regression)', () => {
    render(<GatePalette selected={null} onSelect={vi.fn()} />);
    expect(screen.getByTestId('gate-option-H')).toBeInTheDocument();
  });

  it('click on option fires onSelect with the gate key', () => {
    const onSelect = vi.fn();
    render(<GatePalette selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('gate-option-X'));
    expect(onSelect).toHaveBeenCalledWith('X');
  });

  it('marks selected gate with aria-selected=true', () => {
    render(<GatePalette selected="CNOT" onSelect={vi.fn()} />);
    expect(screen.getByTestId('gate-option-CNOT')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('gate-option-H')).toHaveAttribute('aria-selected', 'false');
  });
});


vi.mock('@/features/session/components/SessionProvider', () => ({
  useSession: () => ({
    session: {
      userId: 'QL-ABCD',
      completed: [],
      missionState: {},
      timerSeconds: 600,
      timerRunning: false,
    },
    updateMissionState: vi.fn(),
    completeMission: vi.fn(),
    updateTimer: vi.fn(),
    toggleTimer: vi.fn(),
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Phase 4 - Header (memoization + a11y)', () => {
  it('renders formatted timer and user id', () => {
    render(<Header timeLeft={600} isRunning={false} onToggleTimer={vi.fn()} />);
    expect(screen.getByTestId('timer-display')).toHaveTextContent('10:00');
    expect(screen.getByTestId('user-id-skeleton')).toBeInTheDocument();
  });

  it('formats sub-minute time correctly', () => {
    render(<Header timeLeft={45} isRunning={true} onToggleTimer={vi.fn()} />);
    expect(screen.getByTestId('timer-display')).toHaveTextContent('00:45');
  });

  it('invokes onToggleTimer when pause/play is clicked', () => {
    const onToggle = vi.fn();
    render(<Header timeLeft={600} isRunning={false} onToggleTimer={onToggle} />);
    const btn = screen.getByRole('button', { name: /Reanudar|Pausar/i });
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});


/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Phase 3 - MeasurementParticles', () => {
  test('mounts without throwing and exposes trigger/dispose via ref', () => {
    const sceneRef = {
      current: {
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(),
        renderer: new THREE.WebGLRenderer(),
        tracker: { track: (r: any) => r, dispose: vi.fn() },
        onFrame: vi.fn().mockReturnValue(() => {}),
        add: vi.fn().mockReturnValue(() => {}),
        detach: vi.fn(),
        setVisible: vi.fn(),
        resize: vi.fn(),
        update: vi.fn(),
        cleanup: vi.fn(),
        dispose: vi.fn(),
      }
    };

    const handle = createRef<MeasurementParticlesHandle>();
    render(<MeasurementParticles ref={handle} sceneRef={sceneRef as any} />);

    expect(handle.current).not.toBeNull();
    expect(typeof handle.current?.trigger).toBe('function');
    expect(typeof handle.current?.dispose).toBe('function');
  });

  test('trigger with count=500 clamps to maxInstances', () => {
    const scene = new THREE.Scene();
    const sceneRef = {
      current: {
        scene,
        camera: new THREE.PerspectiveCamera(),
        renderer: new THREE.WebGLRenderer(),
        tracker: { track: (r: any) => r, dispose: vi.fn() },
        onFrame: vi.fn().mockReturnValue(() => {}),
        add: (obj: THREE.Object3D, id?: string) => {
          scene.add(obj);
          if (id) scene.name = id;
          return () => { scene.remove(obj); };
        },
        detach: vi.fn(),
        setVisible: vi.fn(),
        resize: vi.fn(),
        update: vi.fn(),
        cleanup: vi.fn(),
        dispose: vi.fn(),
      }
    };

    const handle = createRef<MeasurementParticlesHandle>();
    render(<MeasurementParticles ref={handle} sceneRef={sceneRef as any} maxInstances={100} />);

    expect(() => handle.current?.trigger({ count: 500, origin: [0, 0, 0] })).not.toThrow();
  });

  test('dispose is idempotent (calling twice does not throw)', () => {
    const sceneRef = {
      current: {
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(),
        renderer: new THREE.WebGLRenderer(),
        tracker: { track: (r: any) => r, dispose: vi.fn() },
        onFrame: vi.fn().mockReturnValue(() => {}),
        add: () => () => {},
        detach: vi.fn(),
        setVisible: vi.fn(),
        resize: vi.fn(),
        update: vi.fn(),
        cleanup: vi.fn(),
        dispose: vi.fn(),
      }
    };

    const handle = createRef<MeasurementParticlesHandle>();
    render(<MeasurementParticles ref={handle} sceneRef={sceneRef as any} />);

    expect(() => {
      handle.current?.dispose();
      handle.current?.dispose();
    }).not.toThrow();
  });

  test('registers a frame callback on mount', () => {
    const onFrameMock = vi.fn().mockReturnValue(() => {});
    const sceneRef = {
      current: {
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(),
        renderer: new THREE.WebGLRenderer(),
        tracker: { track: (r: any) => r, dispose: vi.fn() },
        onFrame: onFrameMock,
        add: () => () => {},
        detach: vi.fn(),
        setVisible: vi.fn(),
        resize: vi.fn(),
        update: vi.fn(),
        cleanup: vi.fn(),
        dispose: vi.fn(),
      }
    };

    const handle = createRef<MeasurementParticlesHandle>();
    render(<MeasurementParticles ref={handle} sceneRef={sceneRef as any} />);

    expect(onFrameMock).toHaveBeenCalled();
  });

  test('trigger is a safe no-op when sceneRef is null', () => {
    const sceneRef = { current: null };
    const handle = createRef<MeasurementParticlesHandle>();
    render(<MeasurementParticles ref={handle} sceneRef={sceneRef as any} />);
    expect(() => handle.current?.trigger({ origin: [0, 0, 0] })).not.toThrow();
  });
});


describe('Suite de Integración Parametrizada de Misiones', () => {
  test.each(MISSIONS)(
    'renderiza correctamente la misión $id ($title)',
    (mission) => {
      render(<MissionShell mission={mission} />);
      expect(screen.getByText(new RegExp(mission.title, 'i'))).toBeInTheDocument();
    }
  );
});


describe('PhaseDiskView', () => {
  it('renders a canvas with role=img and aria-label', () => {
    render(<PhaseDiskView state={createZeroState(6)} />);
    const canvas = screen.getByTestId('phase-disk-view');
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName.toLowerCase()).toBe('canvas');
    expect(canvas).toHaveAttribute('role', 'img');
    expect(canvas.getAttribute('aria-label')).toBeTruthy();
  });
  it('renders without crashing for small states', () => {
    render(<PhaseDiskView state={createZeroState(2)} />);
    expect(screen.getByTestId('phase-disk-view')).toBeInTheDocument();
  });
  it('is accessible by role img with name match', () => {
    render(<PhaseDiskView state={createZeroState(3)} />);
    expect(screen.getByRole('img', { name: /fase|amplitud/i })).toBeInTheDocument();
  });
});


describe("Phase 3 - Tooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not render tooltip before delay elapses", () => {
    render(
      <Tooltip content="hello" delayDuration={200}>
        <button>trigger</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByRole("button", { name: /trigger/i }));
    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("renders tooltip after delay elapses", () => {
    render(
      <Tooltip content="hello" delayDuration={200}>
        <button>trigger</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByRole("button", { name: /trigger/i }));
    act(() => {
      vi.advanceTimersByTime(201);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent("hello");
  });

  it("renders immediately when delayDuration=0", () => {
    render(
      <Tooltip content="instant" delayDuration={0}>
        <button>trigger</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByRole("button", { name: /trigger/i }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("closes on mouse leave", () => {
    render(
      <Tooltip content="x" delayDuration={0}>
        <button>t</button>
      </Tooltip>,
    );
    const btn = screen.getByRole("button", { name: /t/i });
    fireEvent.mouseEnter(btn);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.mouseLeave(btn);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(
      <Tooltip content="x" delayDuration={0}>
        <button>t</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByRole("button", { name: /t/i }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("sets aria-describedby on the trigger when open", () => {
    render(
      <Tooltip content="desc" delayDuration={0}>
        <button>t</button>
      </Tooltip>,
    );
    const btn = screen.getByRole("button", { name: /t/i });
    const wrapper = btn.parentElement!;

    expect(wrapper.getAttribute("aria-describedby")).toBeNull();
    fireEvent.mouseEnter(wrapper);
    expect(wrapper.getAttribute("aria-describedby")).toBeTruthy();
  });
});


describe('AppShell Component', () => {
  test('renders header, main content, and footer slots correctly', () => {
    render(
      <AppShell
        header={<header>Header Content</header>}
        footer={<footer>Footer Content</footer>}
      >
        <div>Main Content Area</div>
      </AppShell>
    );

    // Verify main landmark element exists
    const mainEl = screen.getByRole('main');
    expect(mainEl).toBeInTheDocument();

    // Verify slot content rendering
    expect(screen.getByText('Header Content')).toBeInTheDocument();
    expect(screen.getByText('Main Content Area')).toBeInTheDocument();
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  test('applies custom className to the shell container', () => {
    const { container } = render(
      <AppShell className="custom-shell-class">
        <div>Content</div>
      </AppShell>
    );

    expect(container.firstChild).toHaveClass('custom-shell-class');
  });
});


describe('SceneStage Component', () => {
  test('renderiza etiqueta y children correctamente', () => {
    render(
      <SceneStage label="Test Stage">
        <div data-testid="child-canvas">Canvas Mock</div>
      </SceneStage>
    );

    expect(screen.getByText(/Test Stage/i)).toBeInTheDocument();
    expect(screen.getByTestId('child-canvas')).toBeInTheDocument();
  });

  test('muestra fallback cuando hasWebGL es falso', () => {
    render(
      <SceneStage label="Test Stage" hasWebGL={false}>
        <div>Canvas Mock</div>
      </SceneStage>
    );

    expect(screen.getByText(/WebGL Simulation Unavailable/i)).toBeInTheDocument();
  });
});


describe('BlochSphereScene Component', () => {
  test('renderiza el contenedor con rol img y aria-label', () => {
    const { container } = render(<BlochSphereScene theta={Math.PI / 2} />);
    const stage = container.querySelector('[role="img"]');
    expect(stage).toBeInTheDocument();
    expect(stage).toHaveAttribute('aria-label', 'Representación 3D interactiva de la Esfera de Bloch');
  });
});


describe('Button Component', () => {
  test('ejecuta onClick cuando es presionado', () => {
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Acción</Button>);

    const btn = screen.getByRole('button', { name: /acción/i });
    fireEvent.click(btn);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('respeta el estado disabled', () => {
    render(<Button disabled>Deshabilitado</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});


describe('RangeControl Component', () => {
  test('muestra la etiqueta y el valor actual con unidad', () => {
    render(
      <RangeControl
        label="Ángulo Theta"
        value={1.57}
        min={0}
        max={3.14}
        unit="rad"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Ángulo Theta')).toBeInTheDocument();
    expect(screen.getByText('1.57 rad')).toBeInTheDocument();
  });
});


describe('StatusMessage Component', () => {
  test('renderiza el mensaje con región accesible', () => {
    render(<StatusMessage variant="success">Operación exitosa</StatusMessage>);

    const region = screen.getByRole('region');
    expect(region).toHaveTextContent('Operación exitosa');
  });
});