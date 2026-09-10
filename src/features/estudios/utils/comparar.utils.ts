import type { EstudioLab, FlagLab } from '@/types/expediente';
import { categoriaDe, ordenarCategorias } from './categorias.utils';

export type FilaComparada = {
  analito: string;
  unidad: string | null;
  valor: string;
  flag: FlagLab;
  refBajo: string | null;
  refAlto: string | null;
  // null cuando ese analito no se corrió en el estudio con el que se compara
  comparado: { valor: string; flag: FlagLab } | null;
  // solo si valor y comparado.valor son ambos numéricos; null para
  // resultados cualitativos (ej. examen general de orina)
  delta: number | null;
};

export type GrupoComparado = { categoria: string; filas: FilaComparada[] };

/** Une cada resultado del estudio actual con su contraparte (mismo analito)
 * en el estudio elegido para comparar, si lo hay. `contra: null` = "sin
 * comparar", cada fila sale con `comparado: null` y solo se muestra el valor
 * actual. */
export function compararEstudios(actual: EstudioLab, contra: EstudioLab | null): GrupoComparado[] {
  const porCategoria = new Map<string, FilaComparada[]>();
  for (const r of actual.resultados) {
    const categoria = categoriaDe(r.panel);
    const otro = contra?.resultados.find((x) => x.analito === r.analito) ?? null;
    const vNum = Number.parseFloat(r.valor);
    const oNum = otro ? Number.parseFloat(otro.valor) : NaN;
    const delta = otro && Number.isFinite(vNum) && Number.isFinite(oNum) ? vNum - oNum : null;

    const fila: FilaComparada = {
      analito: r.analito,
      unidad: r.unidad,
      valor: r.valor,
      flag: r.flag,
      refBajo: r.refBajo,
      refAlto: r.refAlto,
      comparado: otro ? { valor: otro.valor, flag: otro.flag } : null,
      delta,
    };
    if (!porCategoria.has(categoria)) porCategoria.set(categoria, []);
    porCategoria.get(categoria)!.push(fila);
  }
  return ordenarCategorias([...porCategoria.keys()]).map((categoria) => ({ categoria, filas: porCategoria.get(categoria)! }));
}
