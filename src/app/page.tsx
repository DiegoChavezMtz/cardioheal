import { BienvenidaView } from '@/features/bienvenida';
import { expedienteService } from '@/services/expediente.service';

// El expediente es un dato clínico vivo (el pipeline y "Actualizar" lo
// cambian) y la página ya vive detrás del gate de contraseña en src/proxy.ts:
// no tiene sentido pre-renderizarla estática en build ni cachearla.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const expediente = await expedienteService.cargar();
  return <BienvenidaView expediente={expediente} />;
}
