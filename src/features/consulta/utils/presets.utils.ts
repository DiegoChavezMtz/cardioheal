import type { Preset, PresetKey } from '../types';

// Portado de const PRESETS en el consola.html original.
export const PRESETS: Record<PresetKey, Preset> = {
  cardio: {
    n: 'Cardiología', icono: '❤', d: 'Función ventricular, terapia de guías, arritmia y límites para titular.',
    m: ['tiles', 'since', 'tend', 'flags', 'obs', 'estud', 'riesgo', 'periop'],
  },
  hema: {
    n: 'Hematología', icono: '◍', d: 'Citopenias, coagulación, antecedentes y las contradicciones del expediente.',
    m: ['tiles', 'since', 'tend', 'flags', 'obs', 'ante', 'conf', 'over'],
  },
  hepato: {
    n: 'Hepatología', icono: '◆', d: 'Patrón colestásico, hipertensión portal y los estudios de imagen.',
    m: ['tiles', 'since', 'estud', 'flags', 'obs', 'over'],
  },
  full: {
    n: 'Completa', icono: '◈', d: 'Todos los módulos disponibles, en orden.',
    m: [
      'tiles', 'since', 'gdmt', 'lim', 'flags', 'over', 'estud', 'periop', 'obs', 'conf',
      'ecg', 'ante', 'riesgo', 'tend', 'patro', 'pub', 'prep',
    ],
  },
};

export const PRESET_POR_DEFECTO: PresetKey = 'cardio';
