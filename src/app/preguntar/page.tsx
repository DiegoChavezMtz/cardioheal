import { ConsolaLayout } from '@/components/templates/ConsolaLayout';
import { PreguntarView } from '@/features/preguntar';
import { expedienteService } from '@/services/expediente.service';

// El chat llama a su propio endpoint (/api/preguntar), que relee el
// expediente en cada pregunta — aquí solo hace falta para el encabezado.
export const dynamic = 'force-dynamic';

export default async function PreguntarPage() {
  const expediente = await expedienteService.cargar();
  return (
    <ConsolaLayout expediente={expediente} vistaActiva="/preguntar">
      <PreguntarView />
    </ConsolaLayout>
  );
}
