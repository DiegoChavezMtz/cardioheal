import { Logo } from '@/components/atoms/Logo';
import type { Expediente } from '@/types/expediente';
import { fmtS } from '@/utils/expediente.utils';
import { EscenaBienvenida } from '../EscenaBienvenida';
import { calcularEstadisticas } from '../../utils/estadisticas.utils';
import styles from './BienvenidaView.module.css';

/**
 * Puerto de #welcome en app/consola.html (proyecto original). La escena
 * interactiva (cuerpo en canvas, selección de sistema) vive en
 * EscenaBienvenida porque necesita ser un client component; esta vista
 * solo pone la marca y arma el dato inicial en servidor.
 */
export function BienvenidaView({ expediente }: { expediente: Expediente }) {
  const stats = calcularEstadisticas(expediente);

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <Logo />
          <div className={styles.kick}>
            <span className={styles.dot} />
            <span>
              expediente 6 ago 2025 → {fmtS(expediente.hoy)} · {stats.totalDatos.toLocaleString('es-MX')} datos con
              fuente
            </span>
            <span className={styles.version}>v13</span>
          </div>
        </div>

        <EscenaBienvenida expediente={expediente} />
      </div>
    </div>
  );
}
