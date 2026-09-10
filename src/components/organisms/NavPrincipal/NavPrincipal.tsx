'use client';

import Link from 'next/link';
import clsx from 'clsx';
import styles from './NavPrincipal.module.css';

const TABS = [
  { href: '/consulta', ic: '▤', n: 'Consulta', sub: 'El caso en una pantalla. Los módulos se agregan y se quitan con los chips de arriba.', listo: true },
  { href: '/linea-de-tiempo', ic: '⎓', n: 'Línea de tiempo', sub: 'Todo el expediente sobre un mismo eje de tiempo: eventos, medicamentos, signos y laboratorios.', listo: true },
  { href: '/estudios', ic: '⚗', n: 'Estudios', sub: 'Cada estudio de laboratorio completo, como lo entrega el laboratorio, con opción de comparar contra otra fecha.', listo: true },
  { href: '/preguntar', ic: '?', n: 'Preguntar', sub: 'Preguntas en lenguaje natural, respondidas solo con los valores de este expediente.', listo: true },
  { href: '/actualizar', ic: '＋', n: 'Actualizar', sub: 'Agregar un estudio nuevo al expediente. Nada entra sin que lo confirmes.', listo: true },
] as const;

/** Portado de <nav role="tablist"> en app/consola.html original. */
export function NavPrincipal({ activo }: { activo: string }) {
  const actual = TABS.find((t) => t.href === activo) ?? TABS[0];
  return (
    <div className={styles.navwrap}>
      <nav className={styles.nav} role="tablist" aria-label="Vistas del expediente">
        {TABS.map((t) =>
          t.listo ? (
            <Link
              key={t.href}
              href={t.href}
              role="tab"
              aria-selected={t.href === activo}
              className={clsx(t.href === activo && styles.activo)}
            >
              <span className={styles.ic}>{t.ic}</span>
              {t.n}
            </Link>
          ) : (
            <span key={t.href} role="tab" aria-disabled title="Todavía no está migrada" className={styles.pendiente}>
              <span className={styles.ic}>{t.ic}</span>
              {t.n}
            </span>
          ),
        )}
      </nav>
      <p className={styles.navsub}>{actual.sub}</p>
    </div>
  );
}
