import clsx from 'clsx';
import type { ContextoModulo } from '../../../types';
import { calcularLimites } from '../../../utils/modulos/limites.utils';
import { ModuloCard } from '../../ModuloCard';
import styles from './LimitesModulo.module.css';

export function LimitesModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  const limites = calcularLimites(expediente);
  return (
    <ModuloCard
      titulo="Límites para titular"
      ancho="third"
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      {limites.map((l) => (
        <div key={l.k} className={styles.lim}>
          <span className={styles.k}>
            {l.k}
            {l.e && <em>{l.e}</em>}
          </span>
          <span className={clsx(styles.v, l.old && styles.old)}>
            {l.v}
            <em>
              {l.d}
              {l.old ? ' ⚠' : ''}
            </em>
          </span>
        </div>
      ))}
    </ModuloCard>
  );
}
