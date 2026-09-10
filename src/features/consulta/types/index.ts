import type { ComponentType } from 'react';
import type { Expediente } from '@/types/expediente';

export type ModuloId =
  | 'tiles' | 'since' | 'gdmt' | 'lim' | 'flags' | 'over' | 'estud' | 'periop'
  | 'obs' | 'conf' | 'ecg' | 'ante' | 'riesgo' | 'tend' | 'patro' | 'pub' | 'prep';

export type AnchoModulo = 'full' | 'half' | 'third' | 'two-thirds';

/** Lo que recibe cada componente de módulo — su propio contenido, incluida su ModuloCard. */
export type ContextoModulo = {
  expediente: Expediente;
  /** Solo lo usa "since". */
  refDate: string;
  setRefDate: (f: string) => void;
  esPrimero: boolean;
  esUltimo: boolean;
  onSubir: () => void;
  onBajar: () => void;
  onQuitar: () => void;
};

export type ModuloDef = {
  id: ModuloId;
  /** Nombre para los chips de selección — no depende de que el módulo esté activo. */
  n: string;
  Componente: ComponentType<ContextoModulo>;
};

export type PresetKey = 'cardio' | 'hema' | 'hepato' | 'full';
export type Preset = { n: string; icono: string; d: string; m: ModuloId[] };
