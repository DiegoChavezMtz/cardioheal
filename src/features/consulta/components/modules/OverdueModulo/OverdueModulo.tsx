import clsx from 'clsx';
import { Hint } from '@/components/atoms/Hint';
import type { ContextoModulo } from '../../../types';
import { ago } from '@/utils/expediente.utils';
import { calcularVencidos, fmtUltimo } from '../../../utils/modulos/overdue.utils';
import { ModuloCard } from '../../ModuloCard';
import styles from './OverdueModulo.module.css';

export function OverdueModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  const filas = calcularVencidos(expediente);
  return (
    <ModuloCard
      titulo="Estudios sin control reciente"
      ancho="half"
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      <table className={styles.t}>
        <thead>
          <tr>
            <th>Marcador</th>
            <th className={styles.n}>n</th>
            <th className={styles.n}>último</th>
            <th className={styles.n}>antigüedad</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((r) => (
            <tr key={r.n}>
              <td>{r.n}</td>
              <td className={styles.n}>{r.c}</td>
              <td className={styles.n}>{fmtUltimo(r.f)}</td>
              <td className={clsx(styles.n, (!r.f || ago(expediente, r.f) > 180) && styles.old)}>
                {r.f ? `${ago(expediente, r.f)} d` : 'nunca'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Hint className={styles.pie}>
        También sigue pendiente el Holter que el egreso de enero programó a un mes, y el PDF del perfil hepático del
        20 ago 2025 (GGT 677) nunca apareció.
      </Hint>
    </ModuloCard>
  );
}
