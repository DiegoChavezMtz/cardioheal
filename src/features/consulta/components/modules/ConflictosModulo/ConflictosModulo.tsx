import { Hint } from '@/components/atoms/Hint';
import type { ContextoModulo } from '../../../types';
import { ModuloCard } from '../../ModuloCard';
import styles from './ConflictosModulo.module.css';

export function ConflictosModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  return (
    <ModuloCard
      titulo="Contradicciones entre documentos"
      ancho="half"
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      {expediente.conflictos.map((c) => (
        <div key={c.t} className={styles.conf}>
          <div className={styles.ct}>{c.t}</div>
          <div className={styles.cv}>A · {c.a}</div>
          <div className={styles.cv}>B · {c.b}</div>
          <div className={styles.cn}>{c.n}</div>
        </div>
      ))}
      <Hint className={styles.pie}>
        Estas no son fallas de extracción: son documentos que se contradicen entre sí. La consola los muestra en vez
        de elegir uno.
      </Hint>
    </ModuloCard>
  );
}
