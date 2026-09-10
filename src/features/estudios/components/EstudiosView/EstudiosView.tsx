import type { Expediente } from '@/types/expediente';
import { EscenaEstudios } from '../EscenaEstudios';

export function EstudiosView({ expediente }: { expediente: Expediente }) {
  return <EscenaEstudios expediente={expediente} />;
}
