import type { EstudioLab } from '@/types/expediente';
import { categoriaDe, ordenarCategorias } from './categorias.utils';

export type ResumenEstudioLab = {
  fecha: string;
  total: number;
  fueraDeRango: number;
  categorias: string[];
  archivos: string[];
};

/** Portado de la idea de "un estudio por fecha" de la referencia visual: se
 * arma de expediente.estudiosLab, ya agrupado por fecha en el service. */
export function calcularResumenes(estudiosLab: EstudioLab[]): ResumenEstudioLab[] {
  return [...estudiosLab]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((e) => ({
      fecha: e.fecha,
      total: e.resultados.length,
      fueraDeRango: e.resultados.filter((r) => r.flag === 'sobre' || r.flag === 'bajo').length,
      categorias: ordenarCategorias([...new Set(e.resultados.map((r) => categoriaDe(r.panel, r.analito)))]),
      archivos: [...new Set(e.resultados.map((r) => r.archivo))],
    }));
}
