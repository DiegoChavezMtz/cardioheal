import clsx from 'clsx';
import type { ContextoModulo } from '../../../types';
import { calcularObservaciones } from '../../../utils/modulos/obs.utils';
import { ModuloCard } from '../../ModuloCard';
import styles from './ObsModulo.module.css';

export function ObsModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  const obs = calcularObservaciones(expediente);
  return (
    <ModuloCard
      titulo="Observaciones calculadas"
      sub="aritmética verificable"
      ancho="half"
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      {obs.map((o) => (
        <div key={o.t} className={clsx(styles.flag, styles[o.c])}>
          <i className={styles.bar} />
          <div>
            <div className={styles.t}>{o.t}</div>
            <div className={styles.d}>{o.d}</div>
            <div className={styles.s}>{o.s}</div>
          </div>
        </div>
      ))}
    </ModuloCard>
  );
}
