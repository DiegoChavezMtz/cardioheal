'use client';

import { useId } from 'react';
import styles from './ComboInput.module.css';

type Props = {
  value: string;
  onChange: (valor: string) => void;
  opciones: string[];
  placeholder?: string;
  id?: string;
};

/**
 * Input de texto con sugerencias nativas (<datalist>): a diferencia de un
 * <select>, siempre se puede escribir un valor que no esté en la lista — para
 * catálogos que crecen con el tiempo (fármacos, tipos de observación) en vez
 * de un vocabulario fijo cerrado (para eso sí usar <select> normal).
 */
export function ComboInput({ value, onChange, opciones, placeholder, id }: Props) {
  const listId = useId();
  return (
    <>
      <input
        id={id}
        className={styles.root}
        list={listId}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      <datalist id={listId}>
        {opciones.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  );
}
