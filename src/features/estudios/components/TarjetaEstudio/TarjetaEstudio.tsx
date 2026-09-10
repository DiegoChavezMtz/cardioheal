'use client';

import clsx from 'clsx';
import { fmtD } from '@/utils/expediente.utils';
import { iconoCategoria } from '../../utils/categorias.utils';
import type { ResumenEstudioLab } from '../../utils/resumen.utils';
import styles from './TarjetaEstudio.module.css';

export function TarjetaEstudio({
  resumen,
  seleccionada,
  onClick,
}: {
  resumen: ResumenEstudioLab;
  seleccionada: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={clsx(styles.root, seleccionada && styles.seleccionada)} onClick={onClick}>
      <span className={styles.fecha}>{fmtD(resumen.fecha)}</span>
      <span className={styles.meta}>
        {resumen.total} resultados
        {resumen.fueraDeRango > 0 && (
          <>
            {' · '}
            <b className={styles.fuera}>{resumen.fueraDeRango}</b> fuera
          </>
        )}
      </span>
      <span className={styles.iconos}>
        {resumen.categorias.map((c) => (
          <span key={c} title={c}>
            {iconoCategoria(c)}
          </span>
        ))}
      </span>
    </button>
  );
}
