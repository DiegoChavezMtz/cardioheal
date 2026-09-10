'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { Logo } from '@/components/atoms/Logo';
import { RegistroConsulta } from '@/components/organisms/RegistroConsulta';
import type { Expediente } from '@/types/expediente';
import { fmtS } from '@/utils/expediente.utils';
import styles from './EncabezadoExpediente.module.css';

const DIAGNOSTICOS: Array<{ t: string; hot?: boolean }> = [
  { t: 'Cardiopatía isquémica crónica' },
  { t: 'Enfermedad microvascular' },
  { t: 'Ectasia Markis I · flujo lento' },
  { t: 'IC recuperada · CF I NYHA' },
  { t: 'Trombocitopenia crónica', hot: true },
  { t: 'Hepatopatía F3 · Child-Pugh A', hot: true },
  { t: 'Hipertensión portal · várices', hot: true },
  { t: 'TV no sostenida · FV en cateterismo' },
  { t: 'DM2 · HAS' },
  { t: 'Post hernioplastia bilateral' },
  { t: 'Enfermedad diverticular' },
];

/** Portado de .brand + .dx en app/consola.html original. */
export function EncabezadoExpediente({ expediente }: { expediente: Expediente }) {
  return (
    <>
      <div className={styles.brand}>
        <Link href="/" className={styles.logo}>
          <Logo size={30} />
        </Link>
        <button type="button" className={styles.print} onClick={() => window.print()}>
          Imprimir
        </button>
        <RegistroConsulta expediente={expediente} />
        <div className={styles.pt}>
          <div className={styles.nm}>Antonio Velázquez Rocha</div>
          <div className={styles.mt}>
            61 a · M · 13 jun 1965 · expediente 6 ago 2025 → {fmtS(expediente.hoy)} · <span className={styles.version}>v13</span>
          </div>
        </div>
      </div>
      <div className={styles.dx}>
        {DIAGNOSTICOS.map((d) => (
          <span key={d.t} className={clsx(d.hot && styles.hot)}>
            {d.t}
          </span>
        ))}
      </div>
    </>
  );
}
