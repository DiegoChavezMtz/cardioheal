import styles from './Logo.module.css';

// Marca "Cardioheal": ícono de corazón + pulso, portado 1:1 del SVG original
// (app/consola.html, .wmark). Server component: sin estado ni eventos.
export function Logo({ size = 38 }: { size?: number }) {
  return (
    <div className={styles.root}>
      <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true" className={styles.icon}>
        <path
          d="M15 26C15 26 3.5 18.6 3.5 11.2 3.5 7.2 6.5 4.4 10 4.4c2.1 0 4 1.1 5 2.8 1-1.7 2.9-2.8 5-2.8 3.5 0 6.5 2.8 6.5 6.8C26.5 18.6 15 26 15 26Z"
          fill="none"
          stroke="#3b8ef5"
          strokeWidth={1.3}
          opacity={0.85}
        />
        <polyline
          points="4,15.5 9,15.5 11,10.5 13.5,20 16,13 18,15.5 26,15.5"
          fill="none"
          stroke="#e23a3a"
          strokeWidth={1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span className={styles.wordmark}>
        Cardio<i>heal</i>
      </span>
    </div>
  );
}
