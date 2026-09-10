import type { Expediente } from '@/types/expediente';
import { EscenaLineaTiempo } from '../EscenaLineaTiempo';

export function LineaDeTiempoView({ expediente }: { expediente: Expediente }) {
  return <EscenaLineaTiempo expediente={expediente} />;
}
