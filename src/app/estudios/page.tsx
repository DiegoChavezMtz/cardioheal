import { ConsolaLayout } from '@/components/templates/ConsolaLayout';
import { EstudiosView } from '@/features/estudios';
import { expedienteService } from '@/services/expediente.service';

// El expediente es un dato clínico vivo: sin prerender estático ni caché.
export const dynamic = 'force-dynamic';

export default async function EstudiosPage() {
  const expediente = await expedienteService.cargar();
  return (
    <ConsolaLayout expediente={expediente} vistaActiva="/estudios">
      <EstudiosView expediente={expediente} />
    </ConsolaLayout>
  );
}
