'use client';

import clsx from 'clsx';
import { fmtD } from '@/utils/expediente.utils';
import type { ContextoModulo } from '../../../types';
import { calcularDesde } from '../../../utils/modulos/since.utils';
import { ModuloCard } from '../../ModuloCard';
import styles from './SinceModulo.module.css';

export function SinceModulo({ expediente, refDate, setRefDate, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  const { parrafo, opciones, fuenteConsulta } = calcularDesde(expediente, refDate);

  return (
    <ModuloCard
      titulo="Desde la última consulta"
      ancho="full"
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      <p className={styles.parrafo}>
        {parrafo.map((frag, i) =>
          frag.b ? (
            <b key={i} className={clsx(styles.b, frag.up && styles.up)}>
              {frag.texto}
            </b>
          ) : (
            <span key={i}>{frag.texto}</span>
          ),
        )}
      </p>
      <p className={styles.pie}>
        Comparar contra{' '}
        <select value={refDate} onChange={(e) => setRefDate(e.target.value)}>
          {opciones.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>{' '}
        · {fmtD(refDate)}
        {fuenteConsulta && <span className={styles.fuente}> · {fuenteConsulta}</span>}
      </p>
    </ModuloCard>
  );
}
