import { ConsolaLayout } from '@/components/templates/ConsolaLayout';
import { Tablero } from '@/features/consulta';
import { expedienteService } from '@/services/expediente.service';
import type { PresetKey } from '@/features/consulta';

const PRESETS_VALIDOS: PresetKey[] = ['cardio', 'hema', 'hepato', 'full'];

// El expediente es un dato clínico vivo: sin prerender estático ni caché.
export const dynamic = 'force-dynamic';

export default async function ConsultaPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>;
}) {
  const { preset } = await searchParams;
  const expediente = await expedienteService.cargar();
  const presetInicial = PRESETS_VALIDOS.includes(preset as PresetKey) ? (preset as PresetKey) : undefined;

  return (
    <ConsolaLayout expediente={expediente} vistaActiva="/consulta">
      <Tablero expediente={expediente} presetInicial={presetInicial} />
    </ConsolaLayout>
  );
}
