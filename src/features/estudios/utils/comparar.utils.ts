import type { EstudioLab, FlagLab } from '@/types/expediente';
import { categoriaDe, ordenarCategorias } from './categorias.utils';

export type TipoEstado = 'ok' | 'fuera' | 'neutro';

export type Estado = { texto: string; tipo: TipoEstado };

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
  estado: Estado;
};

export type GrupoComparado = { categoria: string; filas: FilaComparada[] };

/** Describe el estado de una fila en una sola frase. Sin comparación, es
 * simplemente su flag (en rango / sobre / bajo / sin referencia). Comparando
 * contra otro estudio, prioriza contar qué pasó (sigue en rango, entró/salió
 * de rango, igual de lejos) sobre repetir "sin referencia" cuando sí hay
 * algo que decir (p. ej. el analito no se corrió antes, o no tiene rango de
 * referencia pero sí subió/bajó). */
function calcularEstado(
  flag: FlagLab,
  comparado: { valor: string; flag: FlagLab } | null,
  delta: number | null,
  comparando: boolean,
): Estado {
  if (!comparando) {
    if (flag === 'dentro') return { texto: 'en rango', tipo: 'ok' };
    if (flag === 'sobre') return { texto: '▲ sobre', tipo: 'fuera' };
    if (flag === 'bajo') return { texto: '▼ bajo', tipo: 'fuera' };
    return { texto: 'sin referencia', tipo: 'neutro' };
  }

  if (!comparado) return { texto: 'solo en un estudio', tipo: 'neutro' };

  if (flag === null && comparado.flag === null) {
    if (delta) return { texto: delta > 0 ? '▲ subió' : '▼ bajó', tipo: 'neutro' };
    return { texto: 'sin referencia', tipo: 'neutro' };
  }
  if (flag === null || comparado.flag === null) return { texto: 'sin referencia', tipo: 'neutro' };

  if (flag === 'dentro' && comparado.flag === 'dentro') return { texto: 'sigue en rango', tipo: 'ok' };
  if (flag !== 'dentro' && comparado.flag !== 'dentro') {
    return flag === comparado.flag ? { texto: 'igual de lejos', tipo: 'fuera' } : { texto: 'cambió de lado', tipo: 'fuera' };
  }
  if (flag === 'dentro') return { texto: 'entró a rango', tipo: 'ok' };
  return { texto: 'salió de rango', tipo: 'fuera' };
}

/** Une cada resultado del estudio actual con su contraparte (mismo analito)
 * en el estudio elegido para comparar, si lo hay. `contra: null` = "sin
 * comparar", cada fila sale con `comparado: null` y solo se muestra el valor
 * actual. */
export function compararEstudios(actual: EstudioLab, contra: EstudioLab | null): GrupoComparado[] {
  const comparando = contra !== null;
  const porCategoria = new Map<string, FilaComparada[]>();
  for (const r of actual.resultados) {
    const categoria = categoriaDe(r.panel, r.analito);
    const otro = contra?.resultados.find((x) => x.analito === r.analito) ?? null;
    const vNum = Number.parseFloat(r.valor);
    const oNum = otro ? Number.parseFloat(otro.valor) : NaN;
    const delta = otro && Number.isFinite(vNum) && Number.isFinite(oNum) ? vNum - oNum : null;
    const comparado = otro ? { valor: otro.valor, flag: otro.flag } : null;

    const fila: FilaComparada = {
      analito: r.analito,
      unidad: r.unidad,
      valor: r.valor,
      flag: r.flag,
      refBajo: r.refBajo,
      refAlto: r.refAlto,
      comparado,
      delta,
      estado: calcularEstado(r.flag, comparado, delta, comparando),
    };
    if (!porCategoria.has(categoria)) porCategoria.set(categoria, []);
    porCategoria.get(categoria)!.push(fila);
  }
  return ordenarCategorias([...porCategoria.keys()]).map((categoria) => ({ categoria, filas: porCategoria.get(categoria)! }));
}
