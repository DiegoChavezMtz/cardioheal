import { fmtD } from '@/utils/expediente.utils';
import type { ContextoModulo } from '../../../types';
import { ModuloCard } from '../../ModuloCard';
import styles from './EcgModulo.module.css';

export function EcgModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  const ecg = [...expediente.ecg].reverse();
  return (
    <ModuloCard
      titulo="Electrocardiogramas"
      ancho="half"
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      {ecg.map((e) => (
        <div key={e.f} className={styles.study}>
          <div className={styles.sh}>
            <span className={styles.st}>ECG</span>
            <span className={styles.sd}>{fmtD(e.f)}</span>
          </div>
          <ul>
            <li>{e.txt}</li>
          </ul>
        </div>
      ))}
    </ModuloCard>
  );
}
