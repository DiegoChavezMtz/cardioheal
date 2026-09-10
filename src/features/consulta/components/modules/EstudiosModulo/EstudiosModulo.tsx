import { fmtD } from '@/utils/expediente.utils';
import type { ContextoModulo } from '../../../types';
import { ModuloCard } from '../../ModuloCard';
import styles from './EstudiosModulo.module.css';

export function EstudiosModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  const estudios = [...expediente.estudios].sort((a, b) => b.f.localeCompare(a.f));
  return (
    <ModuloCard
      titulo="Estudios e informes"
      sub="hallazgos textuales, con su conclusión"
      ancho="full"
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      {estudios.map((s) => (
        <div key={`${s.f}-${s.t}`} className={styles.study}>
          <div className={styles.sh}>
            <span className={styles.st}>{s.t}</span>
            <span className={styles.sd}>
              {fmtD(s.f)} · {s.cat}
            </span>
          </div>
          <ul>
            {s.hall.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <div className={styles.sc}>{s.concl}</div>
        </div>
      ))}
    </ModuloCard>
  );
}
