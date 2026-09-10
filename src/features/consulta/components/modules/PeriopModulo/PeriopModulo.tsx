import { Hint } from '@/components/atoms/Hint';
import type { ContextoModulo } from '../../../types';
import { calcularPeriop } from '../../../utils/modulos/periop.utils';
import { ModuloCard } from '../../ModuloCard';
import styles from './PeriopModulo.module.css';

export function PeriopModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  const filas = calcularPeriop(expediente);
  if (!filas) return null;
  return (
    <ModuloCard
      titulo="Si se plantea una intervención"
      ancho="half"
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      <table className={styles.t}>
        <tbody>
          {filas.map(([k, v]) => (
            <tr key={k}>
              <td className={styles.k}>{k}</td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Hint className={styles.pie}>
        Los datos que suele pedir cardiología para valorar riesgo, reunidos. La decisión y su ponderación son del
        médico.
      </Hint>
    </ModuloCard>
  );
}
