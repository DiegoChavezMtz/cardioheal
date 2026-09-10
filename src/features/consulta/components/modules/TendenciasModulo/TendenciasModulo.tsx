import clsx from 'clsx';
import { Hint } from '@/components/atoms/Hint';
import type { ContextoModulo } from '../../../types';
import { tendFarmacos } from '../../../utils/modulos/tendencias/tendFarmacos.utils';
import { tendIndice } from '../../../utils/modulos/tendencias/tendIndice.utils';
import { tendPAM } from '../../../utils/modulos/tendencias/tendPAM.utils';
import { tendPulso } from '../../../utils/modulos/tendencias/tendPulso.utils';
import { ModuloCard } from '../../ModuloCard';
import styles from './TendenciasModulo.module.css';

type ItemLeyenda = { t: string; col: string; tipo?: 'ln' | 'dash' | 'bar' | 'hatch' };

function Leyenda({ items }: { items: ItemLeyenda[] }) {
  return (
    <div className={styles.leg}>
      {items.map((x) => {
        const claseTipo = x.tipo === 'ln' ? styles.swLn : x.tipo === 'dash' ? styles.swDash : x.tipo === 'bar' ? styles.swBar : x.tipo === 'hatch' ? styles.swHatch : undefined;
        const esBorde = x.tipo === 'ln' || x.tipo === 'dash';
        return (
          <i key={x.t}>
            <span className={clsx(styles.sw, claseTipo)} style={x.tipo === 'hatch' ? undefined : esBorde ? { borderColor: x.col } : { background: x.col }} />
            {x.t}
          </i>
        );
      })}
    </div>
  );
}

function Panel({ titulo, sub, svgInner, alto, leyenda, mirar, noPrueba }: {
  titulo: string; sub: string; svgInner: string; alto: number; leyenda: ItemLeyenda[]; mirar: string; noPrueba: string;
}) {
  if (!svgInner) return null;
  return (
    <div className={styles.tend}>
      <h3>{titulo}</h3>
      <p className={styles.ts}>{sub}</p>
      <div className={styles.tsvg}>
        {/* SVG generado por nosotros mismos (ver tend*.utils.ts), no viene de entrada de usuario */}
        <svg viewBox={`0 0 1000 ${alto}`} preserveAspectRatio="none" style={{ height: alto }} dangerouslySetInnerHTML={{ __html: svgInner }} />
      </div>
      <Leyenda items={leyenda} />
      <p className={styles.tm}>
        <b>Qué mirar</b>
        {mirar}
      </p>
      <p className={styles.tn}>
        <b>Qué no prueba</b>
        {noPrueba}
      </p>
    </div>
  );
}

export function TendenciasModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  return (
    <ModuloCard
      titulo="Tendencias"
      sub="qué se movió junto con qué, mes a mes"
      ancho="full"
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      <Panel
        titulo="Presión: proporción de tomas bajo el umbral de perfusión, mes a mes"
        sub="Cada barra es el porcentaje de tomas caseras de ese mes con PAM menor a 65 mmHg. El rayado son meses sin registro suficiente; la línea ámbar es la última consulta."
        svgInner={tendPAM(expediente)}
        alto={150}
        leyenda={[
          { t: 'menos de 15% de las tomas bajo 65', col: 'var(--ok)' },
          { t: 'entre 15% y 39%', col: 'var(--amber)' },
          { t: '40% o más', col: 'var(--red)' },
          { t: 'mes sin registro suficiente', tipo: 'hatch', col: '' },
          { t: 'última consulta con cardiología', tipo: 'dash', col: 'var(--amber)' },
        ]}
        mirar="El desplome de septiembre de 2025 coincide con la titulación de sacubitrilo/valsartán y vericiguat, y con la suspensión de dosis del 11 de septiembre. La recuperación es progresiva y en agosto y septiembre de 2026 ninguna toma cae por debajo de 65."
        noPrueba="Que la titulación causara la caída. Coinciden en el tiempo, y hubo más cambios simultáneos; el orden temporal no separa la causa."
      />
      <Panel
        titulo="Pulso en reposo: media mensual y rango del mes"
        sub="Solo tomas matutinas. La barra gruesa es el rango del mes, el punto la media."
        svgInner={tendPulso(expediente)}
        alto={140}
        leyenda={[
          { t: 'rango de todas las tomas matutinas del mes', tipo: 'bar', col: 'var(--blue-deep)' },
          { t: 'media del mes', tipo: 'ln', col: 'var(--blue)' },
        ]}
        mirar="Noviembre de 2025 se sale del resto del año: la media sube alrededor de 20 lpm y vuelve a su nivel en enero. Es un pico acotado, no una tendencia."
        noPrueba="Que sea un cambio clínico. Puede ser un cambio de aparato, de hora de medición o de quien registra; nada en el expediente lo explica."
      />
      <Panel
        titulo="Colestasis y plaquetas: ¿se mueven juntas?"
        sub="Cada serie en índice, con su primera medición igual a 100, para comparar la forma y no la escala. El nombre va al final de cada línea."
        svgInner={tendIndice(expediente, ['GGT', 'Fosfatasa alcalina', 'Plaquetas'], ['var(--blue)', 'var(--amber)', 'var(--ok)'])}
        alto={150}
        leyenda={[
          { t: 'GGT', tipo: 'ln', col: 'var(--blue)' },
          { t: 'Fosfatasa alcalina', tipo: 'ln', col: 'var(--amber)' },
          { t: 'Plaquetas', tipo: 'ln', col: 'var(--ok)' },
          { t: 'línea gris: valor inicial (100)', tipo: 'ln', col: 'var(--ink-2)' },
        ]}
        mirar="Si la trombocitopenia siguiera al hígado —hiperesplenismo por hipertensión portal— las curvas deberían moverse en espejo. Compararlas es la manera rápida de ver si el descenso de plaquetas acompaña a la colestasis o va por su cuenta."
        noPrueba="Nada sobre el mecanismo. Dos curvas que se parecen no comparten causa, y la trombocitopenia es previa a la hepatopatía documentada."
      />
      <Panel
        titulo="Carga de tratamiento: fármacos activos cada mes"
        sub="Conteo de fármacos con intervalo abierto a mitad de cada mes, según el expediente."
        svgInner={tendFarmacos(expediente)}
        alto={130}
        leyenda={[{ t: 'fármacos con intervalo abierto a mitad del mes', col: 'var(--blue)' }]}
        mirar="Cuántos frentes abiertos hay a la vez. Los meses con más fármacos son también los meses con más cambios simultáneos, y por eso los más difíciles de atribuir."
        noPrueba="Que más fármacos sea peor ni mejor. Es una medida de complejidad del esquema, no de calidad del tratamiento."
      />
      <Hint className={styles.pie}>
        Estas cuatro vistas son aritmética sobre el expediente: agrupan por mes lo que ya está en la línea de tiempo.
        Sirven para formular una pregunta en segundos, no para responderla.
      </Hint>
    </ModuloCard>
  );
}
