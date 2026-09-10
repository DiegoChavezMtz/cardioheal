import type { HTMLAttributes } from 'react';
import clsx from 'clsx';
import styles from './Hint.module.css';

export function Hint({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={clsx(styles.root, className)} {...rest} />;
}
