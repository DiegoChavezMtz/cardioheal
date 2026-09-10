'use client';

import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';
import styles from './Chip.module.css';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'toggle' | 'solido';
  presionado?: boolean;
};

export function Chip({ variante = 'solido', presionado, className, ...rest }: Props) {
  return (
    <button
      type="button"
      className={clsx(styles.root, variante === 'toggle' ? styles.toggle : styles.solido, className)}
      aria-pressed={presionado}
      {...rest}
    />
  );
}
