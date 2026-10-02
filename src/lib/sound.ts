// Módulo de Audio Resiliente con Fallback Automático
const getAudioEnabled = (): boolean => {
  if (typeof process !== "undefined" && process.env) {
    const envVal = process.env.NEXT_PUBLIC_ENABLE_AUDIO;
    if (envVal !== undefined) {
      return envVal === "true" || envVal === "1";
    }
  }
  return true; // Fallback por defecto en desarrollo / test
};

export const IS_AUDIO_ENABLED = getAudioEnabled();

export const playSound = (soundName: string): void => {
  if (!IS_AUDIO_ENABLED) return;
  try {
    // Lógica de reproducción con Web Audio API
  } catch (error) {
    console.warn(`[SoundEngine] No se pudo reproducir ${soundName}:`, error);
  }
};
