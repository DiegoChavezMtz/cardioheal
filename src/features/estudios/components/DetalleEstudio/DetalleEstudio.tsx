'use client';

import { useMemo, useState } from 'react';
import { Chip } from '@/components/atoms/Chip';
import type { Expediente, EstudioLab, FlagLab } from '@/types/expediente';
import { ago, fmtD, nf } from '@/utils/expediente.utils';
import { iconoCategoria } from '../../utils/categorias.utils';
import { compararEstudios } from '../../utils/comparar.utils';
import styles from './DetalleEstudio.module.css';

function EstadoFlag({ flag }: { flag: FlagLab }) {
  if (flag === 'sobre') return <span className={styles.badgeFuera}>▲ sobre</span>;
  if (flag === 'bajo') return <span className={styles.badgeFuera}>▼ bajo</span>;
  if (flag === 'dentro') return <span className={styles.badgeOk}>en rango</span>;
  return <span className={styles.badgeNeutro}>sin referencia</span>;
}

export function DetalleEstudio({
  expediente,
  estudio,
  todos,
  onVolver,
}: {
  expediente: Expediente;
  estudio: EstudioLab;
  todos: EstudioLab[];
  onVolver: () => void;
}) {
  const [fechaComparar, setFechaComparar] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('todo');
  const [soloFuera, setSoloFuera] = useState(false);

  const otrasFechas = useMemo(
    () => todos.filter((e) => e.fecha !== estudio.fecha).sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [todos, estudio.fecha],
  );
  const comparar = fechaComparar ? (todos.find((e) => e.fecha === fechaComparar) ?? null) : null;
  const grupos = useMemo(() => compararEstudios(estudio, comparar), [estudio, comparar]);

  const total = estudio.resultados.length;
  const fueraDeRango = estudio.resultados.filter((r) => r.flag === 'sobre' || r.flag === 'bajo').length;
  const archivos = [...new Set(estudio.resultados.map((r) => r.archivo))];
  const categorias = grupos.map((g) => g.categoria);

  const gruposFiltrados = grupos
    .filter((g) => categoriaActiva === 'todo' || g.categoria === categoriaActiva)
    .map((g) => ({ ...g, filas: soloFuera ? g.filas.filter((f) => f.flag === 'sobre' || f.flag === 'bajo') : g.filas }))
    .filter((g) => g.filas.length > 0);

  return (
    <div className={styles.root}>
      <button type="button" className={styles.volver} onClick={onVolver}>
        ← Estudios del expediente
      </button>

      <div className={styles.header}>
        <div className={styles.headTop}>
          <span className={styles.fecha}>{fmtD(estudio.fecha)}</span>
          <span className={styles.hace}>hace {ago(expediente, estudio.fecha)} días</span>
        </div>
        <div className={styles.headMeta}>
          {total} resultados · <b className={fueraDeRango > 0 ? styles.fuera : undefined}>{fueraDeRango}</b> fuera de rango ·{' '}
          {archivos.join(' · ')}
        </div>

        <label className={styles.compararLabel}>Comparar contra</label>
        <select className={styles.select} value={fechaComparar} onChange={(e) => setFechaComparar(e.target.value)}>
          <option value="">— sin comparar —</option>
          {otrasFechas.map((e) => (
            <option key={e.fecha} value={e.fecha}>
              {fmtD(e.fecha)}
            </option>
          ))}
        </select>
        <p className={styles.hint}>
          {comparar ? 'qué se movió entre estos dos controles' : 'para ver qué se movió entre dos controles'}
        </p>
      </div>

      <div className={styles.chips}>
        <Chip variante="solido" presionado={categoriaActiva === 'todo'} onClick={() => setCategoriaActiva('todo')}>
          Todo el estudio
        </Chip>
        {categorias.map((c) => (
          <Chip key={c} variante="solido" presionado={categoriaActiva === c} onClick={() => setCategoriaActiva(c)}>
            {iconoCategoria(c)} {c}
          </Chip>
        ))}
        <Chip variante="toggle" presionado={soloFuera} onClick={() => setSoloFuera((v) => !v)}>
          Solo fuera de rango
        </Chip>
      </div>

      {!gruposFiltrados.length && <p className={styles.vacio}>Ningún resultado con este filtro.</p>}

      {gruposFiltrados.map((g) => (
        <section key={g.categoria} className={styles.grupo}>
          <h4>
            <span>{iconoCategoria(g.categoria)}</span> {g.categoria}
            <span className={styles.grupoN}>{g.filas.length} resultados</span>
          </h4>
          <div className={styles.tWrap}>
            <table className={styles.t}>
              <thead>
                <tr>
                  <th>Resultado</th>
                  <th className={styles.n}>Valor</th>
                  {comparar && <th className={styles.n}>{fmtD(comparar.fecha)}</th>}
                  <th className={styles.n}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {g.filas.map((f, i) => (
                  <tr key={`${f.analito}-${i}`}>
                    <td>{f.analito}</td>
                    <td className={styles.n}>
                      {f.valor}
                      {f.unidad && <span className={styles.u}> {f.unidad}</span>}
                    </td>
                    {comparar && (
                      <td className={styles.n}>
                        {f.comparado ? (
                          <>
                            {f.comparado.valor}
                            {f.delta !== null && f.delta !== 0 && (
                              <span className={f.delta > 0 ? styles.dUp : styles.dDn}>
                                {' '}
                                {f.delta > 0 ? '▲' : '▼'} {nf(Math.abs(f.delta))}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className={styles.sinDato}>sin dato</span>
                        )}
                      </td>
                    )}
                    <td className={styles.n}>
                      <EstadoFlag flag={f.flag} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
