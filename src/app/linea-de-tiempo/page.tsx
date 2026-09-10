import { ConsolaLayout } from '@/components/templates/ConsolaLayout';
import { LineaDeTiempoView } from '@/features/lineaDeTiempo';
import { expedienteService } from '@/services/expediente.service';

// El expediente es un dato clínico vivo: sin prerender estático ni caché.
export const dynamic = 'force-dynamic';

export default async function LineaDeTiempoPage() {
  const expediente = await expedienteService.cargar();
  return (
    <ConsolaLayout expediente={expediente} vistaActiva="/linea-de-tiempo">
      <LineaDeTiempoView expediente={expediente} />
    </ConsolaLayout>
  );
}
