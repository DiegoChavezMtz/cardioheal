'use client';

import clsx from 'clsx';
import { useDetalle } from '@/context/DetalleContext';
import type { ContextoModulo } from '../../../types';
import { calcularSparkline, calcularTiles } from '../../../utils/modulos/tiles.utils';
import { ModuloCard } from '../../ModuloCard';
import styles from './TilesModulo.module.css';

const CLASE: Record<string, string | undefined> = { crit: styles.crit, warn: styles.warn, good: styles.good, '': undefined };

function Sparkline({ puntos }: { puntos: { x: number; y: number }[] }) {
  if (puntos.length < 2) return null;
  const ultimo = puntos[puntos.length - 1];
  return (
    <svg className={styles.spark} viewBox="0 0 120 20" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={puntos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke="var(--blue)"
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <circle cx={ultimo.x.toFixed(1)} cy={ultimo.y.toFixed(1)} r={2.1} fill="var(--blue-2)" />
    </svg>
  );
}

export function TilesModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  const { abrir } = useDetalle();
  const tiles = calcularTiles(expediente);
  if (!tiles) return null;
  const obsoletos = tiles.filter((t) => t.stale).length;

  return (
    <ModuloCard
      titulo="Estado actual"
      ancho="full"
      raw
      nota={(obsoletos ? `${obsoletos} valores con más de 3 meses · ` : '') + 'toca cualquiera para verlo a detalle'}
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      <div className={styles.tiles}>
        {tiles.map((t) => (
          <button
            key={t.k}
            type="button"
            className={clsx(styles.tile, CLASE[t.cls], t.stale && styles.stale)}
            title={`Ver ${t.k} a detalle`}
            onClick={() => abrir(t.sp)}
          >
            <div className={styles.k}>{t.k}</div>
            <div className={styles.v}>
              {t.v} <small>{t.u}</small>
            </div>
            <div className={styles.m}>
              {t.m}
              {t.stale ? ' ⚠' : ''}
            </div>
            <Sparkline puntos={calcularSparkline(expediente, t.sp, 120, 20)} />
          </button>
        ))}
      </div>
    </ModuloCard>
  );
}
