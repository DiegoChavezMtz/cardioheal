import type { ContextoModulo } from '../../../types';
import { ModuloCard } from '../../ModuloCard';
import styles from './AntecedentesModulo.module.css';

export function AntecedentesModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  return (
    <ModuloCard
      titulo="Antecedentes"
      ancho="half"
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      {Object.entries(expediente.antecedentes).map(([grupo, items]) => (
        <div key={grupo} className={styles.agroup}>
          <h4>{grupo}</h4>
          {items.map((a) => (
            <p key={a} className={styles.acol}>
              {a}
            </p>
          ))}
        </div>
      ))}
    </ModuloCard>
  );
}
