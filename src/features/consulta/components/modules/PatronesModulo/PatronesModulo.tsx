import type { ContextoModulo } from '../../../types';
import { ModuloCard } from '../../ModuloCard';
import styles from './PatronesModulo.module.css';

export function PatronesModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  return (
    <ModuloCard
      titulo="Patrones y literatura"
      sub="los datos del caso puestos junto a la literatura pertinente"
      ancho="full"
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      <p className={styles.litnote}>{expediente.lit_nota}</p>
      {expediente.patrones.map((p) => (
        <article key={p.t} className={styles.pat}>
          <h3>{p.t}</h3>
          <h4>Lo que muestran sus datos</h4>
          <ul>
            {p.datos.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <h4>Por qué importa aquí</h4>
          <p className={styles.q}>{p.q}</p>
          <h4>Dónde leerlo</h4>
          {p.refs.map((r) => (
            <div key={r.id} className={styles.ref}>
              {r.c}
              <br />
              <span className={styles.refId}>{r.id}</span>
            </div>
          ))}
          <div className={styles.no}>
            <b>Lo que esto NO establece.</b> {p.no}
          </div>
        </article>
      ))}
    </ModuloCard>
  );
}
