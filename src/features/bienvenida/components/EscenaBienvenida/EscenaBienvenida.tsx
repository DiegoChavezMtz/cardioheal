'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Expediente } from '@/types/expediente';
import { fmtS, pamStats, ultimo } from '@/utils/expediente.utils';
import { calcularFirmaPam } from '../../utils/firmaPam.utils';
import { generarCuerpo, type PuntoCuerpo } from '../../utils/cuerpoGeometria.utils';
import { generarPuntosSistemas, SISTEMAS } from '../../utils/sistemas.utils';
import { calcularEstadisticas } from '../../utils/estadisticas.utils';
import styles from './EscenaBienvenida.module.css';

const NLAB_POS = [styles.nlab0, styles.nlab1, styles.nlab2];

type Camara = { rot: number; tilt: number; zoom: number; cx: number; cy: number };
const CAMARA_BASE: Camara = { rot: -0.35, tilt: 0.06, zoom: 0.45, cx: 0, cy: 0.86 };

function proj(p: readonly number[], cam: Camara, W: number, H: number): [number, number, number, number] {
  const ca = Math.cos(cam.rot);
  const sa = Math.sin(cam.rot);
  const x = p[0] * ca - p[2] * sa;
  const z = p[0] * sa + p[2] * ca;
  const y = p[1];
  const ct = Math.cos(cam.tilt);
  const st = Math.sin(cam.tilt);
  const y2 = y * ct - z * st;
  const z2 = y * st + z * ct;
  const f = 3.2;
  const sc = f / (f - z2);
  const S = cam.zoom * H;
  return [W / 2 + (x - cam.cx) * sc * S, H / 2 - (y2 - cam.cy) * sc * S, z2, sc];
}

/**
 * Puerto de la "escena 1 · el cuerpo del paciente" de app/consola.html
 * original (líneas ~1702-1963): la nube de puntos en canvas, la selección
 * de sistema y el panel que alterna entre el titular general y el detalle
 * del sistema elegido.
 *
 * "Abrir el expediente" / "Ver el caso completo" llevan a /consulta con el
 * preset del sistema elegido (o "full") ya seleccionado.
 */
export function EscenaBienvenida({ expediente }: { expediente: Expediente }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rafRef = useRef<number | null>(null);

  const body = useMemo<PuntoCuerpo[]>(() => [...generarCuerpo(), ...generarPuntosSistemas()], []);

  const camRef = useRef<Camara>({ ...CAMARA_BASE });
  const metaRef = useRef<Camara>({ ...CAMARA_BASE });
  const girandoRef = useRef(false);
  const gxRef = useRef(0);
  const grotRef = useRef(0);
  const ultimoTRef = useRef(0);

  const [sistemaSel, setSistemaSel] = useState<number | null>(null);
  const sistemaSelRef = useRef<number | null>(null);

  const reduceMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const bpm = useMemo(() => {
    const fc = ultimo(expediente, 'Pulso en reposo');
    return fc ? Math.max(45, Math.min(140, fc.v)) : 72;
  }, [expediente]);
  const firma = useMemo(() => calcularFirmaPam(expediente), [expediente]);
  const stats = useMemo(() => calcularEstadisticas(expediente), [expediente]);
  const checks = useMemo(() => {
    const ps = pamStats(expediente);
    const casa = expediente.presion.filter((r) => r.src === 'casa').map((r) => r.f).sort();
    return [
      '63 PDFs de laboratorio leídos',
      '241 de 245 valores cruzados coinciden',
      `PAM verificada en las ${ps.n} tomas caseras`,
      casa.length ? `signos de casa: ${fmtS(casa[0])} a ${fmtS(casa[casa.length - 1])}` : null,
      `${expediente.conflictos.length} contradicciones marcadas`,
    ].filter((t): t is string => !!t);
  }, [expediente]);

  const eligeSistema = useCallback((i: number) => {
    sistemaSelRef.current = i;
    setSistemaSel(i);
    const s = SISTEMAS[i];
    metaRef.current.zoom = 1.35;
    metaRef.current.cx = s.pos[0] * Math.cos(metaRef.current.rot) - s.pos[2] * Math.sin(metaRef.current.rot);
    metaRef.current.cy = s.pos[1];
    metaRef.current.tilt = 0;
  }, []);

  const volverCuerpo = useCallback(() => {
    sistemaSelRef.current = null;
    setSistemaSel(null);
    metaRef.current = { ...CAMARA_BASE };
  }, []);

  // Loop de dibujo: un solo rAF para la vida del componente, leyendo refs
  // (no estado de React) para no reprogramar el loop en cada frame.
  useEffect(() => {
    const dibuja = (ts: number) => {
      rafRef.current = requestAnimationFrame(dibuja);
      const cv = canvasRef.current;
      const stage = stageRef.current;
      if (!cv || !stage) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      if (!W || !H) return;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
      }
      const g = cv.getContext('2d');
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);

      const dt = Math.min(50, ts - (ultimoTRef.current || ts));
      ultimoTRef.current = ts;
      const k = reduceMotion ? 1 : Math.min(1, dt / 140);
      const cam = camRef.current;
      const meta = metaRef.current;
      (Object.keys(cam) as Array<keyof Camara>).forEach((p) => {
        cam[p] += (meta[p] - cam[p]) * k;
      });
      if (!girandoRef.current && sistemaSelRef.current === null && !reduceMotion) meta.rot += dt * 0.00016;

      const lat = reduceMotion ? 0 : Math.pow(Math.max(0, Math.sin((ts / 1000) * (bpm / 60) * Math.PI * 2)), 12);

      const pts = body.map((p) => {
        const q = proj(p, cam, W, H);
        return [q[0], q[1], q[2], q[3], p[3]] as [number, number, number, number, number];
      });
      pts.sort((a, b) => a[2] - b[2]);
      pts.forEach((q) => {
        const t = q[4];
        const prof = (q[2] + 0.35) / 0.7;
        let a = 0.14 + 0.5 * Math.max(0, Math.min(1, prof));
        let r = (t ? 1.9 : 1.15) * q[3] * (cam.zoom / 0.45);
        const col = t ? SISTEMAS[t - 1].col : '#8fc0ff';
        if (t) {
          a = Math.min(1, a * 1.9);
          if (SISTEMAS[t - 1].latido) r *= 1 + 0.45 * lat;
          if (sistemaSelRef.current !== null) a *= sistemaSelRef.current === t - 1 ? 1 : 0.1;
        } else if (sistemaSelRef.current !== null) {
          a *= 0.16;
        }
        g.globalAlpha = a;
        g.fillStyle = col;
        g.beginPath();
        g.arc(q[0], q[1], Math.max(0.5, r), 0, 6.283);
        g.fill();
      });
      g.globalAlpha = 1;

      const sr = stage.getBoundingClientRect();
      SISTEMAS.forEach((s, i) => {
        const q = proj(s.pos, cam, W, H);
        const el = labelRefs.current[i];
        const oculto = sistemaSelRef.current !== null && sistemaSelRef.current !== i;
        if (!el || oculto) return;
        const r = el.getBoundingClientRect();
        const ax = (s.pos[0] >= 0 ? r.left : r.right) - sr.left;
        const ay = r.top - sr.top + r.height / 2;
        g.globalAlpha = 0.45;
        g.strokeStyle = s.col;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(ax, ay);
        g.lineTo(q[0], q[1]);
        g.stroke();
        g.globalAlpha = 0.9;
        g.fillStyle = s.col;
        g.beginPath();
        g.arc(q[0], q[1], 2.6, 0, 6.283);
        g.fill();
        g.globalAlpha = 1;
      });
    };
    rafRef.current = requestAnimationFrame(dibuja);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [bpm, reduceMotion, body]);

  // Arrastrar para girar la cámara.
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const abajo = (e: MouseEvent | TouchEvent) => {
      girandoRef.current = true;
      gxRef.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
      grotRef.current = metaRef.current.rot;
    };
    const mueve = (e: MouseEvent | TouchEvent) => {
      if (!girandoRef.current) return;
      const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
      metaRef.current.rot = grotRef.current + (cx - gxRef.current) * 0.009;
      if (e.cancelable) e.preventDefault();
    };
    const arriba = () => {
      girandoRef.current = false;
    };
    cv.addEventListener('mousedown', abajo);
    window.addEventListener('mousemove', mueve);
    window.addEventListener('mouseup', arriba);
    cv.addEventListener('touchstart', abajo, { passive: true });
    cv.addEventListener('touchmove', mueve, { passive: false });
    cv.addEventListener('touchend', arriba);
    return () => {
      cv.removeEventListener('mousedown', abajo);
      window.removeEventListener('mousemove', mueve);
      window.removeEventListener('mouseup', arriba);
      cv.removeEventListener('touchstart', abajo);
      cv.removeEventListener('touchmove', mueve);
      cv.removeEventListener('touchend', arriba);
    };
  }, []);

  const sistemaActivo = sistemaSel !== null ? SISTEMAS[sistemaSel] : null;
  const nuevo = sistemaActivo ? sistemaActivo.nuevo(expediente) : null;
  const C = expediente.consulta_cardio;

  return (
    <div className={styles.wgrid}>
      <div className={clsx(styles.wleft, sistemaSel !== null && styles.zoom)}>
        <div className={styles.wintro}>
          <h1 className={styles.titulo}>
            <span className={styles.num}>{stats.totalDatos.toLocaleString('es-MX')}</span> datos dispersos.
            <span className={styles.acento}>Un solo eje.</span>
          </h1>
          <p className={styles.sub}>
            Trece meses de <b>{stats.nombrePaciente}</b> —63 PDFs de laboratorio, la hoja de signos de casa y once
            documentos clínicos— reunidos en una sola línea de tiempo. <b>Toca el sistema desde el que vas a leer el
            caso</b> y entras con la vista ya armada.
          </p>
          <div className={styles.wstats}>
            <div className={styles.wstat}>
              <b>{stats.valoresLab}</b>
              <span>valores de laboratorio</span>
            </div>
            <div className={styles.wstat}>
              <b>{stats.marcadores}</b>
              <span>marcadores</span>
            </div>
            <div className={styles.wstat}>
              <b>{stats.tomasPresion}</b>
              <span>tomas de presión</span>
            </div>
            <div className={styles.wstat}>
              <b>{stats.estudiosEInformes}</b>
              <span>estudios e informes</span>
            </div>
          </div>
          <div className={styles.wchecks}>
            {checks.map((t) => (
              <i key={t}>{t}</i>
            ))}
          </div>
        </div>

        {sistemaActivo && (
          <div className={clsx(styles.wsys, styles.on)}>
            <div className={styles.sysh}>
              <span className={styles.sysDot} style={{ background: sistemaActivo.col }} />
              <h2>{sistemaActivo.n}</h2>
            </div>
            <p className={styles.sysq}>
              {C?.f && <span className={styles.et}>En la última consulta · {fmtS(C.f)}</span>}
              {sistemaActivo.estado}
              <span className={styles.fu}>{sistemaActivo.fuente}</span>
              {nuevo && (
                <span className={clsx(styles.nv, nuevo.ok && styles.ok)}>
                  <b>Desde entonces · {nuevo.t}</b>
                  {nuevo.d}
                </span>
              )}
            </p>
            <div className={styles.sysn}>
              {sistemaActivo.nums(expediente).map(([valor, etiqueta, malo]) => (
                <div key={etiqueta}>
                  <b className={malo ? styles.bad : undefined}>{valor}</b>
                  <span>{etiqueta}</span>
                </div>
              ))}
            </div>
            <div className={styles.wgo}>
              <Link href={`/consulta?preset=${sistemaActivo.k}`} className={styles.btn}>
                Abrir el expediente
              </Link>
              <button className={clsx(styles.btn, styles.btnGhost)} onClick={volverCuerpo}>
                ← elegir otro sistema
              </button>
            </div>
          </div>
        )}

        {sistemaSel === null && (
          <div className={styles.wgo}>
            <Link href="/consulta?preset=full" className={clsx(styles.btn, styles.btnGhost)}>
              Ver el caso completo, sin filtrar
            </Link>
          </div>
        )}

        <p className={styles.fine}>
          Cada valor conserva su fecha y el archivo del que salió, y se puede abrir en pantalla. Las contradicciones
          entre documentos se muestran, no se resuelven en silencio. <b>No es un diagnóstico ni sustituye la
          valoración médica.</b>
        </p>
      </div>

      <div className={styles.wstage} ref={stageRef}>
        <canvas ref={canvasRef} className={styles.canvas} />
        <div className={styles.stg}>
          {sistemaActivo ? `${sistemaActivo.n} · vista ampliada` : 'Antonio · 61 a · reconstrucción esquemática'}
        </div>
        <div>
          {SISTEMAS.map((s, i) => (
            <button
              key={s.k}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              className={clsx(
                styles.nlab,
                NLAB_POS[i],
                sistemaSel === i && styles.on,
                sistemaSel !== null && sistemaSel !== i && styles.oculto,
              )}
              onClick={() => eligeSistema(i)}
            >
              <span className={styles.nlabDot} style={{ background: s.col }} />
              <span className={styles.nlabTx}>{s.n}</span>
              <span className={styles.nlabVl}>{s.nums(expediente)[0]?.[0] ?? '—'}</span>
            </button>
          ))}
        </div>
        <div className={styles.whint}>
          {sistemaActivo ? `Sistema ${sistemaActivo.n.toLowerCase()}` : 'Toca un sistema · arrastra para girar'}
        </div>
        <div className={styles.wsign}>
          <svg viewBox="0 0 1000 56" preserveAspectRatio="none">
            {firma && (
              <>
                <rect x={0} y={firma.yUmbral} width={1000} height={firma.altoBanda} fill="rgba(226,58,58,.13)" />
                <line
                  x1={0}
                  y1={firma.yUmbral}
                  x2={1000}
                  y2={firma.yUmbral}
                  stroke="#e23a3a"
                  strokeWidth={0.8}
                  strokeDasharray="4 5"
                  opacity={0.55}
                />
                {firma.tramos.map((pts, i) => (
                  <polyline key={i} points={pts} fill="none" stroke="#3b8ef5" strokeWidth={1.4} opacity={0.9} strokeLinejoin="round" />
                ))}
              </>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
