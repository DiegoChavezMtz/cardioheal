'use client';

import { useActionState } from 'react';
import { Logo } from '@/components/atoms/Logo';
import { iniciarSesion } from '../../services/auth.service';
import type { EstadoLogin } from '../../types';
import styles from './LoginView.module.css';

export function LoginView({ from }: { from: string }) {
  const [state, action, pending] = useActionState<EstadoLogin, FormData>(iniciarSesion, {});

  return (
    <div className={styles.root}>
      <form className={styles.card} action={action}>
        <Logo />
        <div className={styles.field}>
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" autoFocus autoComplete="current-password" required />
        </div>
        <input type="hidden" name="from" value={from} />
        {state.error && <p className={styles.error}>{state.error}</p>}
        <button className={styles.btn} type="submit" disabled={pending}>
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
