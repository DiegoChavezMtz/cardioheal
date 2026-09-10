'use client';

import clsx from 'clsx';
import { useMemo, useRef, useState } from 'react';
import { Chip } from '@/components/atoms/Chip';
import { Hint } from '@/components/atoms/Hint';
import { useDetalle } from '@/context/DetalleContext';
import type { Expediente } from '@/types/expediente';
import { ago, day, fmtD, nf } from '@/utils/expediente.utils';
import { calcularCmp } from '../../utils/cmp.utils';
import { generarEje } from '../../utils/eje.utils';
import { calcularEtiquetaAhora, type EtiquetaAhora } from '../../utils/etiquetaAhora.utils';
import { filaEventos } from '../../utils/filas/filaEventos.utils';
import { filaGenerica, unidadFila } from '../../utils/filas/filaGenerica.utils';
import { filaMeds } from '../../utils/filas/filaMeds.utils';
import { filaPresion } from '../../utils/filas/filaPresion.utils';
import { PICKER_BASE, VARS_POR_DEFECTO, todosLosMarcadores } from '../../utils/marcadores.utils';
import { calcularPanel } from '../../utils/panel.utils';
import { fechaMasCercana, fechasCandidatas, rangoDe, W, X, type Dominio } from '../../utils/rango.utils';
import styles from './EscenaLineaTiempo.module.css';

const COLORS = ['var(--blue)', 'var(--amber)', 'var(--ok)', 'var(--blue-2)'];
const RANGOS = [
  { k: 'all' as const, n: 'Todo' },
  { k: '12' as const, n: '12 m' },
  { k: '6' as const, n: '6 m' },
  { k: '3' as const, n: '3 m' },
];

function EtiquetaNow({ etq }: { etq: EtiquetaAhora }) {
  return (
    <span className={clsx(styles.now, etq.vivo && styles.nowLive, etq.out && styles.nowOut)}>
      {etq.vacio ? <span style={{ color: 'var(--muted)' }}>{etq.texto}</span> : etq.texto}
      {etq.sub && <span className={styles.d}>{etq.sub}</span>}
    </span>
  );
}

/**
 * Puerto de la línea de tiempo de app/consola.html original (líneas
 * ~1966-2270): filas de eventos/medicamentos/marcadores sobre un eje común,
 * cursor que sigue al mouse/toque, panel de detalle por fecha y tabla de
 * comparación antes/después de cada cambio de tratamiento.
 *
 * El botón "detalle" de cada fila abre el modal compartido con los tiles de
 * Consulta (ver src/context/DetalleContext.tsx + src/components/organisms/ModalDetalle).
 */
export function EscenaLineaTiempo({ expediente: D }: { expediente: Expediente }) {
  const { abrir } = useDetalle();
  const [dom, setDom] = useState<Dominio>(() => rangoDe(D, 'all'));
  const [rango, setRango] = useState<'all' | '12' | '6' | '3'>('all');
  const [vars, setVars] = useState<string[]>(VARS_POR_DEFECTO);
  const [pinned, setPinned] = useState<string | null>(null);
  const [hoverT, setHoverT] = useState<number | null>(null);

  const stackRef = useRef<HTMLDivElement>(null);
  const candidatas = useMemo(() => fechasCandidatas(D), [D]);

  const t = pinned ? day(pinned) : hoverT;
  const fechaPanel = pinned ?? (hoverT !== null ? fechaMasCercana(candidatas, hoverT) : D.consulta_cardio?.f || D.hoy);

  const plotBox = () => {
    const stack = stackRef.current;
    const plot = stack?.querySelector<HTMLElement>('[data-plot]');
    if (!stack || !plot) return null;
    const pr = plot.getBoundingClientRect();
    const sr = stack.getBoundingClientRect();
    return { left: pr.left - sr.left, width: pr.width };
  };

  const scrubAt = (clientX: number) => {
    const b = plotBox();
    const stack = stackRef.current;
    if (!b || !stack) return;
    const sr = stack.getBoundingClientRect();
    const px = clientX - sr.left - b.left;
    const nt = dom[0] + (Math.max(0, Math.min(px, b.width)) / b.width) * (dom[1] - dom[0]);
    setHoverT(nt);
  };

  const cambiarRango = (k: typeof rango) => {
    setRango(k);
    setDom(rangoDe(D, k));
  };

  const alternarPicker = (n: string) => {
    setVars((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : prev.length < 7 ? [...prev, n] : prev));
  };

  const quitarVar = (n: string) => setVars((prev) => prev.filter((x) => x !== n));

  const onClickStack = () => {
    if (pinned) {
      setPinned(null);
    } else if (hoverT !== null) {
      setPinned(fechaMasCercana(candidatas, hoverT));
    }
  };

  const marcadoresDisponibles = useMemo(() => todosLosMarcadores(D), [D]);
  const opcionesAgregar = marcadoresDisponibles.filter((n) => !vars.includes(n));

  const eje = useMemo(() => generarEje(D, dom), [D, dom]);
  const cmp = useMemo(() => calcularCmp(D, vars, dom), [D, vars, dom]);
  // rowMeds mide el viewport real en el original para decidir el top de las
  // franjas; aquí ese ajuste angosto se resuelve con CSS (ver .lanes en
  // móvil), así que siempre se genera con el layout de escritorio.
  const meds = useMemo(() => filaMeds(D, dom, false), [D, dom]);

  // franja "sin consulta" — misma posición que placeTras(), pero calculada
  // como fracción del dominio en vez de medir píxeles reales.
  const C = D.consulta_cardio;
  const fraccionTras = C?.f && day(C.f) >= dom[0] && day(C.f) <= dom[1] ? (day(C.f) - dom[0]) / (dom[1] - dom[0]) : null;
  const diasSinConsulta = C?.f ? ago(D, C.f) : 0;

  return (
    <div>
      <div className={styles.barCtl}>
        <div className={styles.grp}>
          <label>Periodo</label>
          {RANGOS.map((r) => (
            <Chip key={r.k} variante="solido" presionado={rango === r.k} onClick={() => cambiarRango(r.k)}>
              {r.n}
            </Chip>
          ))}
        </div>
        <div className={styles.grp}>
          <label>Más marcadores</label>
          <select
            className={styles.select}
            value=""
            onChange={(e) => { if (e.target.value) alternarPicker(e.target.value); }}
          >
            <option value="">elegir…</option>
            {opcionesAgregar.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <Hint>Arrastra sobre el eje para leer cualquier fecha · toca para fijarla</Hint>
      </div>

      <div className={styles.picker}>
        {[...new Set(PICKER_BASE)].map((n) => (
          <button key={n} type="button" className={styles.pk} aria-pressed={vars.includes(n)} onClick={() => alternarPicker(n)}>
            {n}
          </button>
        ))}
      </div>

      <div className={styles.split}>
        <div>
          <div
            className={styles.stack}
            ref={stackRef}
            onMouseMove={(e) => { if (!pinned) scrubAt(e.clientX); }}
            onMouseLeave={() => { if (!pinned) setHoverT(null); }}
            onClick={onClickStack}
            onTouchStart={(e) => { setPinned(null); scrubAt(e.touches[0].clientX); }}
            onTouchMove={(e) => scrubAt(e.touches[0].clientX)}
          >
            {fraccionTras !== null && (
              <div className={styles.tras} style={{ left: `${fraccionTras * 100}%`, right: 0 }}>
                <span className={styles.trasEt}>
                  Sin ver por {C?.quien.toLowerCase()} desde el {C?.f && fmtD(C.f)} · <b>{diasSinConsulta} días</b>
                </span>
              </div>
            )}
            <div className={clsx(styles.cursor, pinned && styles.cursorPin)} style={t !== null ? { display: 'block', left: `${(X(dom, t) / W) * 100}%` } : undefined} />

            {/* fila: eventos */}
            <div className={styles.row}>
              <div className={styles.rlab}>
                <span className={styles.n}>Eventos</span>
                <span className={styles.u}>hitos del caso</span>
              </div>
              <div className={styles.plot} data-plot dangerouslySetInnerHTML={{ __html: filaEventos(D, dom) }} />
            </div>

            {/* fila: medicamentos */}
            <div className={styles.row}>
              <div className={styles.rlab} style={{ justifyContent: 'flex-start' }}>
                <span className={styles.n}>Medicamentos</span>
                <span className={styles.u}>azul documentado · ámbar aprox. · rojo en conflicto</span>
                <span className={styles.lanes}>
                  {meds.grupos.map((g) => <span key={g}>{g}</span>)}
                </span>
              </div>
              <div className={styles.plot} dangerouslySetInnerHTML={{ __html: meds.svg }} />
            </div>

            {/* filas de marcadores elegidos */}
            {vars.map((n, i) => {
              const svg = n === 'Presión arterial' ? filaPresion(D, dom) : filaGenerica(D, n, COLORS[i % COLORS.length], dom);
              if (!svg) return null;
              const etq = calcularEtiquetaAhora(D, n, t);
              return (
                <div key={n} className={styles.row}>
                  <div className={styles.rlab}>
                    <span className={styles.n}>{n}</span>
                    <span className={styles.u}>{n === 'Presión arterial' ? 'mmHg · barra S–D · verde: PAM del día (umbral 65)' : unidadFila(D, n)}</span>
                    <EtiquetaNow etq={etq} />
                    <button type="button" className={styles.x} onClick={(e) => { e.stopPropagation(); quitarVar(n); }}>
                      quitar
                    </button>
                    <button type="button" className={styles.x} style={{ marginLeft: 9 }} onClick={(e) => { e.stopPropagation(); abrir(n); }}>
                      detalle
                    </button>
                  </div>
                  <div className={styles.plot} dangerouslySetInnerHTML={{ __html: svg }} />
                </div>
              );
            })}
          </div>

          <div className={styles.axis}>
            <div className={styles.axisFirst} />
            <div className={styles.axisWrap}>
              <svg viewBox={`0 0 ${W} 34`} preserveAspectRatio="none" dangerouslySetInnerHTML={{ __html: eje }} />
            </div>
          </div>

          <h3 className={styles.sec}>Qué pasó alrededor de cada cambio de tratamiento</h3>
          <Hint style={{ margin: '0 0 4px' }}>Valor más cercano antes y después de cada inicio o suspensión. Coincidencia temporal no es causa.</Hint>
          <Hint style={{ margin: '0 0 8px', maxWidth: '92ch' }}>
            {cmp.multi
              ? <>Varias filas agrupan cambios simultáneos: cuando ese día se movieron varios fármacos, <b>el cambio del marcador no puede atribuirse a ninguno en particular</b>. Los días bajo cada valor indican qué tan lejos del cambio está la medición.</>
              : 'Los días bajo cada valor indican qué tan lejos del cambio está la medición.'}
          </Hint>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.t}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cambio de tratamiento</th>
                  {cmp.columnas.map((c) => <th key={c} className={styles.n2}>{c} antes → después</th>)}
                </tr>
              </thead>
              <tbody>
                {!cmp.filas.length && (
                  <tr>
                    <td colSpan={cmp.columnas.length + 2}><span className={styles.empty}>Ningún cambio en este periodo.</span></td>
                  </tr>
                )}
                {cmp.filas.map((f) => (
                  <tr key={f.fecha + f.cambios.join()}>
                    <td className={styles.num}>{f.fecha}</td>
                    <td>
                      {f.cambios.join(' · ')}
                      {f.cambios.length > 1 && <span className={styles.hint}> ({f.cambios.length} a la vez)</span>}
                    </td>
                    {f.celdas.map((c, i) => (
                      <td key={i} className={styles.n2}>
                        {c.sinDato ? (
                          <span className={styles.empty}>sin dato</span>
                        ) : (
                          <>
                            {nf(c.antes)} → {nf(c.despues)}{' '}
                            <span className={c.delta > 0 ? styles.dUp : styles.dDn}>{c.delta > 0 ? '+' : ''}{nf(c.delta)}</span>
                            <br />
                            <span className={styles.hint}>−{c.diasAntes} d / +{c.diasDespues} d</span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className={styles.panel}>
          <PanelLateral D={D} fecha={fechaPanel} />
        </aside>
      </div>
    </div>
  );
}

function PanelLateral({ D, fecha }: { D: Expediente; fecha: string }) {
  const p = calcularPanel(D, fecha);
  return (
    <>
      <div className={styles.ph}>
        <span className={styles.phD}>{fmtD(p.fecha)}</span>
        <span className={styles.phS}>{p.relativo}</span>
      </div>
      {!!p.eventos.length && (
        <div className={styles.pblock}>
          <h4>Ese día</h4>
          {p.eventos.map((e) => (
            <div key={e.titulo} className={styles.evt}>
              <b>{e.titulo}</b>
              <span>{e.detalle}</span>
            </div>
          ))}
        </div>
      )}
      {!!p.estudios.length && (
        <div className={styles.pblock}>
          <h4>Estudios</h4>
          {p.estudios.map((s) => (
            <div key={s.titulo} className={styles.evt}>
              <b>{s.titulo}</b>
              <span>{s.conclusion}</span>
            </div>
          ))}
        </div>
      )}
      {p.signos && (
        <div className={styles.pblock}>
          <h4>Signos</h4>
          {p.signos.filas.map((f, i) => (
            <div key={i} className={styles.kv}>
              <span className={styles.kvK}>{f.etiqueta}</span>
              <span className={clsx(styles.kvV, f.out && styles.kvOut)}>{f.valor}</span>
            </div>
          ))}
          {p.signos.masTomas > 0 && (
            <div className={styles.kv}>
              <span className={styles.kvK} />
              <span className={styles.kvV}><span className={styles.hint}>y {p.signos.masTomas} tomas más ese día</span></span>
            </div>
          )}
        </div>
      )}
      {p.labs && (
        <div className={styles.pblock}>
          <h4>Laboratorio ({p.labs.filas.length} resultados)</h4>
          {p.labs.filas.map((l) => (
            <div key={l.nombre} className={styles.kv}>
              <span className={styles.kvK}>{l.nombre}</span>
              <span className={clsx(styles.kvV, l.out && styles.kvOut)}>{l.valor}</span>
            </div>
          ))}
          {p.labs.masLabs > 0 && (
            <div className={styles.kv}>
              <span className={styles.kvK}>+ {p.labs.masLabs} más</span>
              <span className={styles.kvV} />
            </div>
          )}
        </div>
      )}
      <div className={styles.pblock}>
        <h4>Tratamiento activo ese día ({p.tratamiento.n})</h4>
        {!p.tratamiento.n && <p className={styles.empty}>Sin registro para esa fecha.</p>}
        {p.tratamiento.farmacos.map((m) => (
          <div key={m.nombre} className={styles.med}>
            <i className={styles.medDot} style={{ background: `var(--${m.color})` }} />
            <span>{m.nombre} <span className={styles.medDose}>{m.dosis}</span></span>
          </div>
        ))}
      </div>
    </>
  );
}
