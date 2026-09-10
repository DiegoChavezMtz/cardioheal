'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { Expediente } from '@/types/expediente';
import { ModalDetalle } from '@/components/organisms/ModalDetalle';

type DetalleContextValue = { abrir: (nombre: string) => void };

const DetalleContext = createContext<DetalleContextValue | null>(null);

/**
 * Monta el modal de "ver a detalle" una sola vez (en ConsolaLayout) y expone
 * abrirDetalle(nombre) a cualquier feature vía useDetalle() — así Consulta y
 * Línea de tiempo comparten el mismo modal sin poder importarse entre sí.
 */
export function DetalleProvider({ expediente, children }: { expediente: Expediente; children: ReactNode }) {
  const [marcador, setMarcador] = useState<string | null>(null);
  const abrir = useCallback((n: string) => setMarcador(n), []);
  const cerrar = useCallback(() => setMarcador(null), []);

  return (
    <DetalleContext.Provider value={{ abrir }}>
      {children}
      {marcador && <ModalDetalle expediente={expediente} nombre={marcador} onCerrar={cerrar} onNavegar={setMarcador} />}
    </DetalleContext.Provider>
  );
}

export function useDetalle() {
  const ctx = useContext(DetalleContext);
  if (!ctx) throw new Error('useDetalle debe usarse dentro de <DetalleProvider>');
  return ctx;
}
