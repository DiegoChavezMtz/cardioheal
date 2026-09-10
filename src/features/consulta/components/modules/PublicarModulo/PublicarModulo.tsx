import type { ContextoModulo } from '../../../types';
import { calcularCasosPublicables } from '../../../utils/modulos/publicar.utils';
import { ModuloCard } from '../../ModuloCard';
import styles from './PublicarModulo.module.css';

export function PublicarModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  const casos = calcularCasosPublicables(expediente);
  return (
    <ModuloCard
      titulo="Material que podría publicarse"
      sub="observaciones de este caso con hipótesis explícita · n = 1"
      ancho="full"
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      <p className={styles.litnote}>
        <b>Qué es esta sección y qué no es.</b>
        <br />
        Aquí no hay hallazgos. Hay tres observaciones de este expediente que <b>podrían</b> sostener un reporte de
        caso, cada una con su hipótesis escrita como pregunta comprobable, lo que haría falta para sostenerla y lo
        que no establece. Todo esto es <b>n = 1</b>: un caso no demuestra nada, genera hipótesis. La decisión de
        escribir, la autoría, la validación metodológica y el consentimiento del paciente son del médico. Las
        referencias se localizaron y verificaron por búsqueda; los textos completos no se leyeron desde aquí.
      </p>
      {casos.map((c, i) => (
        <div key={c.t} className={styles.pat}>
          <h3>
            <span className={styles.pn}>{i + 1}</span>
            {c.t}
          </h3>
          <h4>Lo que muestra el expediente</h4>
          <ul>
            {c.obs.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <h4>Hipótesis que se podría poner a prueba</h4>
          <p className={styles.q}>{c.hip}</p>
          <h4>Qué haría falta para sostenerla</h4>
          <ul>
            {c.falta.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <h4>Referencias localizadas</h4>
          {c.refs.map((r) => (
            <div key={r.id} className={styles.ref}>
              {r.c}
              <br />
              <span className={styles.refId}>{r.id}</span>
            </div>
          ))}
          <h4>Formato probable</h4>
          <p className={styles.tipo}>{c.tipo}</p>
          <div className={styles.no}>
            <b>Qué NO establece:</b> {c.no}
          </div>
        </div>
      ))}
    </ModuloCard>
  );
}
