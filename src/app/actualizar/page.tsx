import { ConsolaLayout } from '@/components/templates/ConsolaLayout';
import { ActualizarView } from '@/features/actualizar';
import { expedienteService } from '@/services/expediente.service';

export const dynamic = 'force-dynamic';

export default async function ActualizarPage() {
  const expediente = await expedienteService.cargar();
  return (
    <ConsolaLayout expediente={expediente} vistaActiva="/actualizar">
      <ActualizarView expediente={expediente} />
    </ConsolaLayout>
  );
}
