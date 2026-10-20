import { describe, it, expect, beforeEach } from 'vitest';
import { t, DICTIONARY } from '@/lib/i18n';
import { useQuantumStore } from '@/store/useQuantumStore';

describe('i18n Localization Registry (src/lib/i18n.ts)', () => {
  it('exposes translations dictionary for both en and es', () => {
    expect(DICTIONARY).toBeDefined();
    expect(DICTIONARY.en).toBeDefined();
    expect(DICTIONARY.es).toBeDefined();
  });

  describe('HUD Labels Translations', () => {
    it('translates HUD pause and resume labels in EN and ES', () => {
      expect(t('hud.pause', 'en')).toBe('System Pause');
      expect(t('hud.pause', 'es')).toBe('Pausa del Sistema');

      expect(t('hud.resume', 'en')).toBe('Resume Simulation');
      expect(t('hud.resume', 'es')).toBe('Reanudar Simulación');
    });

    it('translates HUD options and theme labels in EN and ES', () => {
      expect(t('hud.theme', 'en')).toBe('Theme');
      expect(t('hud.theme', 'es')).toBe('Tema');

      expect(t('hud.options', 'en')).toBe('System Options');
      expect(t('hud.options', 'es')).toBe('Opciones del Sistema');
    });

    it('replaces template parameters in HUD strings', () => {
      const en = t('hud.mastered', 'en', { count: 3, total: 7 });
      const es = t('hud.mastered', 'es', { count: 3, total: 7 });
      expect(en).toBe('3 / 7 Mastered');
      expect(es).toBe('3 / 7 Dominadas');
    });
  });

  describe('Gate Descriptions Translations', () => {
    it('translates Pauli-X (NOT) gate description in EN and ES', () => {
      const enDesc = t('gates.X.description', 'en');
      const esDesc = t('gates.X.description', 'es');

      expect(enDesc).toContain('Bit-flip');
      expect(esDesc).toContain('inversión de bit');
    });

    it('translates Hadamard (H) gate description in EN and ES', () => {
      const enDesc = t('gates.H.description', 'en');
      const esDesc = t('gates.H.description', 'es');

      expect(enDesc).toContain('superposition');
      expect(esDesc).toContain('superposición');
    });

    it('translates Pauli-Z and Phase (S, T) gates', () => {
      expect(t('gates.Z.description', 'en')).toContain('Phase-flip');
      expect(t('gates.Z.description', 'es')).toContain('cambio de fase');
      expect(t('gates.S.name', 'es')).toBe('Puerta de Fase (S)');
      expect(t('gates.T.name', 'en')).toBe('π/8 Gate (T)');
    });
  });

  describe('Dirac Math Docks Translations', () => {
    it('translates Dirac state vector dock titles', () => {
      expect(t('math_dock.dirac_title', 'en')).toBe('Dirac State Vector');
      expect(t('math_dock.dirac_title', 'es')).toBe('Vector de Estado Dirac');
    });

    it('translates Born measurement dock zero-spoiler messages', () => {
      expect(t('math_dock.zero_spoiler_badge', 'en')).toBe('Zero-Spoiler');
      expect(t('math_dock.zero_spoiler_badge', 'es')).toBe('Cero-Spoiler');
      expect(t('math_dock.locked_prediction', 'en')).toContain('Submit prediction to reveal Born probabilities');
      expect(t('math_dock.locked_prediction', 'es')).toContain('Envía tu predicción para revelar las probabilidades de Born');
    });

    it('translates cryogenic decoherence dock titles', () => {
      expect(t('math_dock.cryo_title', 'en')).toBe('Cryogenic Environment');
      expect(t('math_dock.cryo_title', 'es')).toBe('Entorno Criogénico');
      expect(t('math_dock.decoherence_badge', 'en')).toBe('Decoherence');
      expect(t('math_dock.decoherence_badge', 'es')).toBe('Decoherencia');
    });
  });

  describe('Mission Objectives Translations', () => {
    it('translates mission titles and learning objectives for core missions', () => {
      const missions = ['superposition', 'entanglement', 'decoherence', 'gates', 'grover', 'applications', 'error-correction'];

      for (const mId of missions) {
        const enTitle = t(`missions.${mId}.title`, 'en');
        const esTitle = t(`missions.${mId}.title`, 'es');
        const enObj = t(`missions.${mId}.learningObjective`, 'en');
        const esObj = t(`missions.${mId}.learningObjective`, 'es');

        expect(enTitle).toBeTruthy();
        expect(esTitle).toBeTruthy();
        expect(enObj).toBeTruthy();
        expect(esObj).toBeTruthy();
        expect(enTitle).not.toBe(esTitle);
      }
    });

    it('normalizes hyphenated mission keys like error_correction vs error-correction', () => {
      const titleHyphen = t('missions.error-correction.title', 'es');
      const titleUnderscore = t('missions.error_correction.title', 'es');

      expect(titleHyphen).toBe('7. Corrección de Errores');
      expect(titleUnderscore).toBe('7. Corrección de Errores');
    });
  });

  describe('Fallback and Safety Behavior', () => {
    it('returns the raw key if key is entirely non-existent', () => {
      expect(t('unknown.non.existent.key', 'es')).toBe('unknown.non.existent.key');
    });
  });

  describe('Tactical Telemetry & Emoji-Free Invariant', () => {
    it('returns clean uppercase telemetry tags for locked and editable states', () => {
      expect(t('workspace.locked', 'en')).toBe('LOCKED');
      expect(t('workspace.unlocked', 'en')).toBe('EDITABLE');
      expect(t('workspace.locked', 'es')).toBe('BLOQUEADO');
      expect(t('workspace.unlocked', 'es')).toBe('EDITABLE');
    });

    it('returns uppercase confirmed status for prediction matches', () => {
      expect(t('workspace.match', 'en')).toBe('MATCH CONFIRMED');
      expect(t('workspace.match', 'es')).toBe('COINCIDENCIA CONFIRMADA');
    });

    it('returns clean titles without emojis for Bell pair, Spin-Flip wave, and Mastery', () => {
      expect(t('workspace.bell_pair_active', 'en')).toBe('Bell Pair |Φ⁺⟩ Active');
      expect(t('workspace.bell_pair_active', 'es')).toBe('Par Bell |Φ⁺⟩ Activo');
      expect(t('entanglement_3d.spin_flip_wave', 'en')).toBe('Spin-Flip Wave');
      expect(t('entanglement_3d.spin_flip_wave', 'es')).toBe('Onda Spin-Flip');
      expect(t('celebration.mastery_title', 'en')).toBe('Quantum Mastery Achieved!');
      expect(t('celebration.mastery_title', 'es')).toBe('¡Dominio Cuántico Alcanzado!');
    });

    it('verifies that the entire translations dictionary contains zero Unicode emojis', () => {
      const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
      const json = JSON.stringify(DICTIONARY);
      const matches: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = emojiRegex.exec(json)) !== null) {
        if (m[0].codePointAt(0) !== 0x2194) {
          matches.push(m[0]);
        }
      }
      expect(matches).toEqual([]);
    });
  });
});

describe('Quantum Store Language State (src/store/useQuantumStore.ts)', () => {
  beforeEach(() => {
    useQuantumStore.getState().setLanguage('es');
  });

  it('provides language in store and defaults to es or persisted locale', () => {
    const lang = useQuantumStore.getState().language;
    expect(['en', 'es']).toContain(lang);
  });

  it('updates language via setLanguage selector', () => {
    useQuantumStore.getState().setLanguage('en');
    expect(useQuantumStore.getState().language).toBe('en');

    useQuantumStore.getState().setLanguage('es');
    expect(useQuantumStore.getState().language).toBe('es');
  });

  it('t() without explicit lang defaults to current store language', () => {
    useQuantumStore.getState().setLanguage('en');
    expect(t('hud.resume')).toBe('Resume Simulation');

    useQuantumStore.getState().setLanguage('es');
    expect(t('hud.resume')).toBe('Reanudar Simulación');
  });
});
