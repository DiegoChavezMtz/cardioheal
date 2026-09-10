import clsx from 'clsx';
import type { ContextoModulo } from '../../../types';
import { calcularFlags } from '../../../utils/modulos/flags.utils';
import { ModuloCard } from '../../ModuloCard';
import styles from './FlagsModulo.module.css';

export function FlagsModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  const flags = calcularFlags(expediente);
  return (
    <ModuloCard
      titulo="Puntos de atención"
      sub="hechos del expediente, no juicios"
      ancho="half"
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      {flags.map((f) => (
        <div key={f.t} className={clsx(styles.flag, styles[f.c])}>
          <i className={styles.bar} />
          <div>
            <div className={styles.t}>{f.t}</div>
            <div className={styles.d}>{f.d}</div>
            <div className={styles.s}>fuente: {f.s}</div>
          </div>
        </div>
      ))}
    </ModuloCard>
  );
}
