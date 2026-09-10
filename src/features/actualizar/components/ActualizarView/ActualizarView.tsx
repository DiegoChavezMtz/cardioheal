'use client';

import { useState } from 'react';
import { Hint } from '@/components/atoms/Hint';
import type { Expediente } from '@/types/expediente';
import { fmtD } from '@/utils/expediente.utils';
import { PasoUno } from '../PasoUno';
import { PasoDos } from '../PasoDos';
import { PasoTres } from '../PasoTres';
import type { Propuesta } from '../../types';
import styles from './ActualizarView.module.css';

function statsPie(D: Expediente) {
  const nVals = Object.values(D.labs).reduce((a, S) => a + S.puntos.length, 0);
  const nMarc = Object.keys(D.labs).length;
  const nFech = new Set(Object.values(D.labs).flatMap((S) => S.puntos.map((p) => p.f))).size;
  const casa = D.presion.filter((r) => r.src === 'casa').map((r) => r.f).sort();
  const nCasa = casa.length ? `${casa.length} tomas del ${fmtD(casa[0])} al ${fmtD(casa[casa.length - 1])}, más los signos tomados en consulta` : '—';
  const nPeso = D.peso.length ? `el ${fmtD(D.peso[D.peso.length - 1].f)}` : '—';
  return { nVals, nMarc, nFech, nCasa, nPeso };
}

/** Puerto de #v-upd en app/consola.html original. */
export function ActualizarView({ expediente }: { expediente: Expediente }) {
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [confirmados, setConfirmados] = useState<Propuesta[]>([]);
  const stats = statsPie(expediente);

  return (
    <div>
      <div className={styles.pasos}>
        <div className={styles.paso}>
          <b>1</b>
          <div>
            <h4>Traes un estudio nuevo</h4>
            <p>El texto del resultado, pegado tal como venga. La consola lo lee y saca los valores.</p>
          </div>
        </div>
        <div className={styles.paso}>
          <b>2</b>
          <div>
            <h4>Los revisas uno por uno</h4>
            <p>Cada valor aparece como <em>propuesta</em>: dice qué había antes en el expediente y si contradice algo. Nada se guarda todavía.</p>
          </div>
        </div>
        <div className={styles.paso}>
          <b>3</b>
          <div>
            <h4>Confirmas lo que sea correcto</h4>
            <p>Solo lo que confirmas entra al expediente. Lo que descartas desaparece sin dejar rastro en los datos.</p>
          </div>
        </div>
      </div>

      <h3 className={styles.sec}>Paso 1 · el estudio nuevo</h3>
      <PasoUno onExtraido={(nuevas) => setPropuestas((prev) => [...prev, ...nuevas])} />

      <h3 className={styles.sec}>Paso 2 · propuestas por confirmar</h3>
      <Hint className={styles.intro}>
        Una <b>propuesta</b> es un valor que la consola leyó del estudio y que <b>todavía no forma parte del
        expediente</b>. Aparece con lo que ya había registrado de ese marcador, para que puedas juzgarlo: si la fecha
        ya tiene un valor distinto, se marca el conflicto y <b>no se sobrescribe nada</b>. Cada propuesta se confirma
        o se descarta a mano.
      </Hint>
      <PasoDos
        propuestas={propuestas}
        onDescartar={(i) => setPropuestas((prev) => prev.filter((_, j) => j !== i))}
        onConfirmada={(p, i) => {
          setPropuestas((prev) => prev.filter((_, j) => j !== i));
          setConfirmados((prev) => [...prev, p]);
        }}
      />

      <h3 className={styles.sec}>Paso 3 · confirmado en esta sesión</h3>
      <Hint className={styles.intro}>Lo que confirmes se lista aquí, además de quedar guardado en el expediente.</Hint>
      <PasoTres confirmados={confirmados} />

      <p className={styles.foot}>
        <b>Prototipo con datos reales.</b> {stats.nVals} valores de laboratorio en {stats.nMarc} marcadores y{' '}
        {stats.nFech} fechas, extraídos de 63 PDFs, de la hoja de seguimiento y de quince documentos clínicos (notas
        de cardiología, valoración preoperatoria, coronariografía, dos egresos, hematología, dos TC, USG, tele de
        tórax, fibroscan, endoscopia y resonancia). Presión y pulso caseros: {stats.nCasa}. Peso semanal hasta{' '}
        {stats.nPeso}. Los medicamentos llevan fuente y nivel de confianza; en ámbar los aproximados o en conflicto.{' '}
        <b>No es un diagnóstico ni sustituye la valoración médica.</b>
      </p>
    </div>
  );
}
