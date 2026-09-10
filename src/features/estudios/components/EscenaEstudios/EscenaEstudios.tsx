'use client';

import { useMemo, useState } from 'react';
import type { Expediente } from '@/types/expediente';
import { DetalleEstudio } from '../DetalleEstudio';
import { TarjetaEstudio } from '../TarjetaEstudio';
import { calcularResumenes } from '../../utils/resumen.utils';
import styles from './EscenaEstudios.module.css';

/**
 * Puerto de la referencia visual "v15 · comparar estudios": una tarjeta por
 * fecha de estudio de laboratorio (agrupadas en expediente.estudiosLab, ver
 * expediente.service.ts) y, al elegir una, el detalle completo con opción de
 * comparar contra otra fecha.
 */
export function EscenaEstudios({ expediente }: { expediente: Expediente }) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);

  const resumenes = useMemo(() => calcularResumenes(expediente.estudiosLab), [expediente.estudiosLab]);
  const estudioActivo = expediente.estudiosLab.find((e) => e.fecha === fechaSeleccionada) ?? null;

  if (estudioActivo) {
    return (
      <DetalleEstudio
        expediente={expediente}
        estudio={estudioActivo}
        todos={expediente.estudiosLab}
        onVolver={() => setFechaSeleccionada(null)}
      />
    );
  }

  return (
    <div>
      <h3 className={styles.sec}>Estudios del expediente</h3>
      <p className={styles.hint}>Cada control de laboratorio con fecha. Elige uno para verlo completo.</p>
      {!resumenes.length && <p className={styles.vacio}>Todavía no hay estudios de laboratorio cargados.</p>}
      <div className={styles.grid}>
        {resumenes.map((r) => (
          <TarjetaEstudio key={r.fecha} resumen={r} seleccionada={false} onClick={() => setFechaSeleccionada(r.fecha)} />
        ))}
      </div>
    </div>
  );
}
