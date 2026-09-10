'use client';

import { Chip } from '@/components/atoms/Chip';
import type { Expediente } from '@/types/expediente';
import type { PresetKey } from '../../types';
import { useTablero } from '../../hooks/useTablero';
import { MODULO_POR_ID, MODULOS } from '../../utils/modulos.registry';
import { PRESETS } from '../../utils/presets.utils';
import styles from './Tablero.module.css';

const CLAVES_PRESET = Object.keys(PRESETS) as PresetKey[];

export function Tablero({ expediente, presetInicial }: { expediente: Expediente; presetInicial?: PresetKey }) {
  const { preset, activos, refDate, setRefDate, elegirPreset, alternar, mover } = useTablero(expediente, presetInicial);

  return (
    <div>
      <div className={styles.custom}>
        <div className={styles.ch}>
          <b>
            Tu vista{' '}
            <span className={styles.presetName}>
              {preset === 'custom' ? '· personalizada' : `· ${PRESETS[preset].n}`}
            </span>
          </b>
          <div className={styles.presetsMini}>
            {CLAVES_PRESET.map((k) => (
              <Chip key={k} variante="solido" presionado={preset === k} onClick={() => elegirPreset(k)}>
                {PRESETS[k].n}
              </Chip>
            ))}
          </div>
        </div>
        <div className={styles.cb}>
          {MODULOS.map((m) => (
            <Chip key={m.id} variante="toggle" presionado={activos.includes(m.id)} onClick={() => alternar(m.id)}>
              {m.n}
            </Chip>
          ))}
        </div>
      </div>

      <div className={styles.board}>
        {activos.map((id, i) => {
          const def = MODULO_POR_ID.get(id);
          if (!def) return null;
          const { Componente } = def;
          return (
            <Componente
              key={id}
              expediente={expediente}
              refDate={refDate}
              setRefDate={setRefDate}
              esPrimero={i === 0}
              esUltimo={i === activos.length - 1}
              onSubir={() => mover(id, -1)}
              onBajar={() => mover(id, 1)}
              onQuitar={() => alternar(id)}
            />
          );
        })}
      </div>
    </div>
  );
}
