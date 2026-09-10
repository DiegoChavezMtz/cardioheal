'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';
import type { AnchoModulo } from '../../types';
import styles from './ModuloCard.module.css';

const ANCHO: Record<AnchoModulo, string | undefined> = {
  full: undefined,
  half: styles.half,
  third: styles.third,
  'two-thirds': styles.twoThirds,
};

export type ModuloCardProps = {
  titulo: string;
  sub?: string;
  nota?: string;
  ancho: AnchoModulo;
  /** Sin el padding estándar de .body — lo usa "tiles", que arma su propia cuadrícula. */
  raw?: boolean;
  /** Clase extra en el contenedor, ej. "since" para su tipografía particular. */
  claseExtra?: string;
  esPrimero: boolean;
  esUltimo: boolean;
  onSubir: () => void;
  onBajar: () => void;
  onQuitar: () => void;
  children: ReactNode;
};

export function ModuloCard({
  titulo, sub, nota, ancho, raw, claseExtra, esPrimero, esUltimo, onSubir, onBajar, onQuitar, children,
}: ModuloCardProps) {
  const etiqueta = nota || sub;
  return (
    <section className={clsx(styles.mod, ANCHO[ancho], claseExtra)}>
      <h2 className={styles.h2}>
        <span>
          {titulo}
          {etiqueta && <em> {etiqueta}</em>}
        </span>
        <span className={styles.mtools}>
          {!esPrimero && (
            <button type="button" title="Subir" aria-label={`Subir ${titulo}`} onClick={onSubir}>
              ↑
            </button>
          )}
          {!esUltimo && (
            <button type="button" title="Bajar" aria-label={`Bajar ${titulo}`} onClick={onBajar}>
              ↓
            </button>
          )}
          <button type="button" title="Quitar" aria-label={`Quitar ${titulo}`} onClick={onQuitar}>
            ✕
          </button>
        </span>
      </h2>
      {raw ? children : <div className={styles.body}>{children}</div>}
    </section>
  );
}
