'use client';

import { useState } from 'react';
import { fmtD, nf, U } from '@/utils/expediente.utils';
import { confirmarPropuesta } from '../../services/actualizar.actions';
import type { Propuesta } from '../../types';
import styles from './PasoDos.module.css';

type Props = {
  propuestas: Propuesta[];
  onDescartar: (i: number) => void;
  onConfirmada: (p: Propuesta, i: number) => void;
};

export function PasoDos({ propuestas, onDescartar, onConfirmada }: Props) {
  const [guardando, setGuardando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmar(p: Propuesta, i: number) {
    setGuardando(i);
    setError(null);
    const res = await confirmarPropuesta(p);
    setGuardando(null);
    if ('error' in res) { setError(res.error); return; }
    onConfirmada(p, i);
  }

  if (!propuestas.length) {
    return (
      <div className={styles.vacio}>
        <b>Todavía no hay propuestas.</b>
        <span>
          En cuanto leas un texto en el paso 1, cada valor que se reconozca va a aparecer aquí con dos botones:
          Confirmar lo mete al expediente, Descartar lo tira. Mientras esta lista esté vacía, el expediente no ha
          cambiado.
        </span>
      </div>
    );
  }

  return (
    <>
      {error && <p style={{ color: '#ff9c9c', fontSize: 12.5, margin: '0 0 9px' }}>{error}</p>}
      {propuestas.map((p, i) => (
        <div key={`${p.marcador}-${p.fecha}-${i}`} className={styles.prop}>
          <div className={styles.r}>
            <b>{p.marcador}</b>
            <span className={styles.num}>{nf(p.valor)} {p.unidad || U(p.marcador)}</span>
          </div>
          <div className={styles.why}>
            {p.fecha ? fmtD(p.fecha) : 'sin fecha detectada'} · {p.why}
          </div>
          <div className={styles.acts}>
            <button type="button" className={styles.yes} disabled={guardando === i} onClick={() => confirmar(p, i)}>
              {guardando === i ? 'Guardando…' : 'Confirmar y agregar'}
            </button>
            <button type="button" disabled={guardando === i} onClick={() => onDescartar(i)}>
              Descartar
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
