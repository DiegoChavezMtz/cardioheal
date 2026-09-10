'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import type { Expediente } from '@/types/expediente';
import { fmtD, U, todosLosMarcadores } from '@/utils/expediente.utils';
import { calcularDetalle, DIMENSIONES_DETALLE, type PuntoDetalle } from '@/utils/detalleMarcador.utils';
import styles from './ModalDetalle.module.css';

const { DW, DH } = DIMENSIONES_DETALLE;

type Lectura = { fecha: string; valor: number; fuera: boolean; fuente: string } | null;

/**
 * Puerto de #detail en app/consola.html original — el modal de "ver a
 * detalle" que comparten los tiles de Consulta y las filas de Línea de
 * tiempo. Vive en src/components/ (no en ninguna feature) porque ninguna de
 * las dos puede importar de la otra; se monta una sola vez desde
 * ConsolaLayout vía DetalleProvider.
 */
export function ModalDetalle({
  expediente, nombre, onCerrar, onNavegar,
}: {
  expediente: Expediente;
  nombre: string;
  onCerrar: () => void;
  onNavegar: (nombre: string) => void;
}) {
  const detalle = calcularDetalle(expediente, nombre);
  const [lectura, setLectura] = useState<Lectura>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const mover = (delta: 1 | -1) => {
    const lista = todosLosMarcadores(expediente);
    const i = lista.indexOf(nombre);
    if (i < 0) return;
    onNavegar(lista[(i + delta + lista.length) % lista.length]);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCerrar();
      if (e.key === 'ArrowLeft') mover(-1);
      if (e.key === 'ArrowRight') mover(1);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mover() se recrea cada render con `nombre` ya capturado, no hace falta re-suscribir
  }, [nombre, onCerrar]);

  // Limpia la lectura del cursor al navegar a otro marcador — ajustado
  // durante el render (no en un efecto) para no disparar un segundo pase.
  const [nombreLectura, setNombreLectura] = useState(nombre);
  if (nombreLectura !== nombre) {
    setNombreLectura(nombre);
    setLectura(null);
  }

  if (!detalle) return null;

  function leer(clientX: number) {
    const svg = svgRef.current;
    if (!svg || !detalle) return;
    const box = svg.getBoundingClientRect();
    const px = ((clientX - box.left) / box.width) * DW;
    let mejor: PuntoDetalle | null = null;
    let mejorDist = Infinity;
    detalle.puntos.forEach((p) => {
      const d = Math.abs(p.x - px);
      if (d < mejorDist) { mejorDist = d; mejor = p; }
    });
    if (!mejor) return;
    const m = mejor as PuntoDetalle;
    const fuente = (expediente.labs[nombre] && expediente.labs[nombre].puntos.find((x) => x.f === m.fecha)?.src) || '';
    setLectura({ fecha: m.fecha, valor: m.valor, fuera: m.fuera, fuente: String(fuente).split('/').pop() || '' });
  }

  const puntoLeido = lectura ? detalle.puntos.find((p) => p.fecha === lectura.fecha) : null;

  return (
    <div className={styles.detail} onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className={styles.dcard}>
        <div className={styles.dhead}>
          <div>
            <h2>{detalle.nombre}</h2>
            <div className={styles.du}>{detalle.unidadTexto}</div>
          </div>
          <div className={styles.dnav}>
            <button type="button" title="Marcador anterior (←)" onClick={() => mover(-1)}>← anterior</button>
            <button type="button" title="Marcador siguiente (→)" onClick={() => mover(1)}>siguiente →</button>
            <button type="button" className={styles.close} title="Cerrar (Esc)" onClick={onCerrar}>Cerrar</button>
          </div>
        </div>

        <div className={styles.dstats}>
          {detalle.stats.map((s) => (
            <div key={s.etiqueta} className={styles.dstat}>
              <div className={styles.k}>{s.etiqueta}</div>
              <div className={clsx(styles.v, s.malo && styles.bad)}>{s.valor}</div>
            </div>
          ))}
        </div>

        <div className={styles.dplot}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${DW} ${DH}`}
            role="img"
            aria-label="Serie de tiempo del marcador"
            onMouseMove={(e) => leer(e.clientX)}
            onTouchMove={(e) => { e.preventDefault(); leer(e.touches[0].clientX); }}
            onMouseLeave={() => setLectura(null)}
          >
            <g dangerouslySetInnerHTML={{ __html: detalle.svgFondo }} />
            {puntoLeido && (
              <line x1={puntoLeido.x} y1={20} x2={puntoLeido.x} y2={DH - 38} stroke="var(--blue-2)" strokeWidth={1} opacity={0.8} />
            )}
          </svg>
        </div>
        <div className={styles.dread}>
          {lectura ? (
            <>
              {fmtD(lectura.fecha)} ·{' '}
              <b style={lectura.fuera ? { color: 'var(--red)' } : undefined}>
                {lectura.valor} {U(nombre)}
              </b>
              {lectura.fuera && <span style={{ color: 'var(--red)' }}> fuera de rango</span>}
              {lectura.fuente && <span className={styles.src}> · {lectura.fuente}</span>}
            </>
          ) : (
            <span className={styles.src}>Pasa el cursor sobre la gráfica para leer cada punto.</span>
          )}
        </div>

        <div className={styles.dtable}>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th className={styles.n}>Valor</th>
                <th>Estado</th>
                <th>Archivo fuente</th>
              </tr>
            </thead>
            <tbody>
              {detalle.filas.map((f) => (
                <tr key={f.fecha} className={clsx(f.fuera && styles.out, lectura?.fecha === f.fecha && styles.hl)}>
                  <td className="num">{f.fechaCorta}</td>
                  <td className={styles.n}>{f.valor}</td>
                  <td>{f.fuera ? f.estado : <span className={styles.enRango}>en rango</span>}</td>
                  <td className={styles.tdSrc}>{f.fuente}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {detalle.totalFilas > 200 && <p className={styles.hint}>Se muestran los 200 más recientes de {detalle.totalFilas}.</p>}
          {detalle.agregadaTexto && <p className={styles.hint}>{detalle.agregadaTexto}. Las tomas individuales de cada día se ven al fijar esa fecha en la línea de tiempo.</p>}
          {detalle.tieneCorte && <p className={styles.hint}>La línea se corta donde no hay mediciones: los huecos no se rellenan con una recta.</p>}
        </div>
      </div>
    </div>
  );
}
