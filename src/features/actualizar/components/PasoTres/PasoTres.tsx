import { Hint } from '@/components/atoms/Hint';
import { fmtD, nf, U } from '@/utils/expediente.utils';
import type { Propuesta } from '../../types';
import styles from './PasoTres.module.css';

export function PasoTres({ confirmados }: { confirmados: Propuesta[] }) {
  if (!confirmados.length) {
    return (
      <div className={styles.vacio}>
        <b>Nada confirmado en esta sesión.</b>
        <span>Aquí se acumula lo que apruebes en el paso 2. Es el único camino por el que un dato nuevo entra al expediente: ninguna lectura automática lo hace sola.</span>
      </div>
    );
  }
  return (
    <div className={styles.mod}>
      <div className={styles.body}>
        {confirmados.map((a, i) => (
          <div key={`${a.marcador}-${i}`} className={styles.kv}>
            <span className={styles.k}>{a.marcador} · {a.fecha ? fmtD(a.fecha) : 'sin fecha'}</span>
            <span className={styles.v}>{nf(a.valor)} {a.unidad || U(a.marcador)}</span>
          </div>
        ))}
        <Hint className={styles.pie}>Confirmados en esta sesión y ya guardados en el expediente.</Hint>
      </div>
    </div>
  );
}
