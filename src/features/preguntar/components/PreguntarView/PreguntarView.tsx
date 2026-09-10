import { Hint } from '@/components/atoms/Hint';
import { Chat } from '../Chat';
import styles from './PreguntarView.module.css';

/** Puerto de #v-ask en app/consola.html original. */
export function PreguntarView() {
  return (
    <div className={styles.chat}>
      <Chat />
      <div className={styles.mod}>
        <h2>Lo que no hace</h2>
        <div className={styles.body}>
          <Hint>No consulta literatura médica: esta página no tiene acceso a internet, así que no cita fuentes y no lo intenta.</Hint>
          <Hint>No diagnostica ni indica tratamiento. Lee el expediente y hace aritmética sobre él.</Hint>
          <Hint>No inventa lo que falta. Si preguntas por la HbA1c de este año, responde que no se ha medido.</Hint>
        </div>
      </div>
    </div>
  );
}
