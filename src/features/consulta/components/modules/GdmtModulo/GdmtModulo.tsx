import clsx from 'clsx';
import { Hint } from '@/components/atoms/Hint';
import type { ContextoModulo } from '../../../types';
import { ModuloCard } from '../../ModuloCard';
import styles from './GdmtModulo.module.css';

export function GdmtModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  return (
    <ModuloCard
      titulo="Tratamiento dirigido por guías"
      sub="dosis actual contra objetivo de la clase"
      ancho="two-thirds"
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      {expediente.gdmt.map((g) => (
        <div key={g.farmaco} className={styles.gd}>
          <div className={styles.cls}>{g.clase}</div>
          <div className={styles.r1}>
            <span className={styles.fx}>{g.farmaco}</span>
            <span className={styles.ds}>{g.actual}</span>
          </div>
          <div className={clsx(styles.bar, g.pct === null ? styles.barUnk : g.pct >= 100 && styles.barFull)}>
            {g.pct !== null && <i style={{ width: `${Math.min(g.pct, 100)}%` }} />}
          </div>
          <div className={styles.pc}>
            {g.pct !== null ? `${g.pct}% de la dosis objetivo (${g.objetivo})` : `no calculable · objetivo ${g.objetivo}`}
          </div>
          {g.nota && <div className={styles.nt}>{g.nota}</div>}
        </div>
      ))}
      <Hint className={styles.pie}>
        Las dosis objetivo son un <b>valor de referencia estándar de la clase</b>, no una indicación: verifícalas
        contra la guía que uses. Cada barra es aritmética sobre la dosis registrada en el expediente.
      </Hint>
    </ModuloCard>
  );
}
