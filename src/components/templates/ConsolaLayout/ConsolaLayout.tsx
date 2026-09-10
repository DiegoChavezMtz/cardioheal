import type { ReactNode } from 'react';
import { EncabezadoExpediente } from '@/components/organisms/EncabezadoExpediente';
import { NavPrincipal } from '@/components/organisms/NavPrincipal';
import { DetalleProvider } from '@/context/DetalleContext';
import type { Expediente } from '@/types/expediente';
import styles from './ConsolaLayout.module.css';

/** Portado del contenedor #consola (.wrap) + .brand + nav en app/consola.html original. */
export function ConsolaLayout({ expediente, vistaActiva, children }: { expediente: Expediente; vistaActiva: string; children: ReactNode }) {
  return (
    <DetalleProvider expediente={expediente}>
      <div className={styles.wrap}>
        <EncabezadoExpediente expediente={expediente} />
        <NavPrincipal activo={vistaActiva} />
        {children}
      </div>
    </DetalleProvider>
  );
}
