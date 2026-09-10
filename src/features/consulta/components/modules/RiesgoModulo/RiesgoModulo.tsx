import { Hint } from '@/components/atoms/Hint';
import { fmtD } from '@/utils/expediente.utils';
import type { ContextoModulo } from '../../../types';
import { ModuloCard } from '../../ModuloCard';
import styles from './RiesgoModulo.module.css';

export function RiesgoModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  const R = expediente.riesgo;
  return (
    <ModuloCard
      titulo="Riesgo quirúrgico"
      ancho="half"
      nota={R.f ? `calculado por cardiología el ${fmtD(R.f)}` : undefined}
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      {R.scores.map((s) => (
        <div key={s.n} className={styles.score}>
          <span className={styles.sn}>
            {s.n}
            <span className={styles.si}>{s.i}</span>
          </span>
          <span className={styles.sv}>{s.v}</span>
        </div>
      ))}
      <h4 className={styles.h4}>Preparación indicada</h4>
      <ul className={styles.ul}>
        {R.prep.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <Hint className={styles.pie}>
        Estos puntajes los calculó el cardiólogo para la hernioplastia del 25 abr 2026. Se muestran tal cual, con su
        fecha: no se recalcularon aquí.
      </Hint>
    </ModuloCard>
  );
}
