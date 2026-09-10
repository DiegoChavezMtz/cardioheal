'use client';

import { useState } from 'react';
import { Hint } from '@/components/atoms/Hint';
import { extraerDeTexto } from '../../services/actualizar.actions';
import type { Propuesta } from '../../types';
import styles from './PasoUno.module.css';

export function PasoUno({ onExtraido }: { onExtraido: (propuestas: Propuesta[]) => void }) {
  const [texto, setTexto] = useState('');
  const [leyendo, setLeyendo] = useState(false);
  const [estado, setEstado] = useState('');

  async function leer() {
    if (!texto.trim()) { setEstado('Pega primero el texto.'); return; }
    setLeyendo(true);
    setEstado('Leyendo…');
    const res = await extraerDeTexto(texto);
    setLeyendo(false);
    if ('error' in res) {
      setEstado(res.error);
      return;
    }
    setEstado(`${res.propuestas.length} valores leídos. Revísalos abajo.`);
    onExtraido(res.propuestas);
  }

  return (
    <>
      <div className={styles.drop}>
        <div className={styles.big}>La lectura de fotos no está disponible en este plan</div>
        <div className={styles.sm}>El modelo conectado (MiniMax) solo lee texto. Pega abajo el texto del resultado.</div>
      </div>
      <Hint style={{ margin: '12px 0 6px' }}>O pega el texto del resultado, tal como venga:</Hint>
      <textarea
        className={styles.textarea}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={'Biometría hemática 2 sep 2026\nPlaquetas 78 mil/µL\nLeucocitos 4.2 mil/µL'}
      />
      <div className={styles.acciones}>
        <button type="button" className={styles.boton} disabled={leyendo} onClick={leer}>
          {leyendo ? 'Leyendo…' : 'Leer el texto'}
        </button>
        <span className={styles.estado}>{estado}</span>
      </div>
    </>
  );
}
