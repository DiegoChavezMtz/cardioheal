'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { Hint } from '@/components/atoms/Hint';
import type { ContextoModulo } from '../../../types';
import { CARE, contenidoExport, listaExportables, type Exportable } from '../../../utils/modulos/preparar/care.utils';
import { ModuloCard } from '../../ModuloCard';
import styles from './PrepararModulo.module.css';

const ICONO: Record<string, string> = { listo: '✓', parcial: '◐', pendiente: '✎', falta: '!' };
const ETIQUETA: Record<string, string> = { listo: 'sale del expediente', parcial: 'parcial', pendiente: 'lo escribe el médico', falta: 'falta y hace falta' };
const MIME: Record<Exportable['f'], string> = { markdown: 'text/markdown', csv: 'text/csv', json: 'application/json' };

/**
 * Portado de M_preparar(). La descarga real ya no depende de
 * claude.use("downloads") (solo existía dentro del Artifact de Claude):
 * usa un Blob + <a download> normal del navegador, que funciona igual de
 * bien fuera de ese entorno.
 */
export function PrepararModulo({ expediente, esPrimero, esUltimo, onSubir, onBajar, onQuitar }: ContextoModulo) {
  const [estado, setEstado] = useState('');
  const exportables = listaExportables(expediente);
  const listos = CARE.filter((c) => c.e === 'listo').length;
  const faltan = CARE.filter((c) => c.e === 'falta').length;

  function descargar(id: Exportable['id'], formato: Exportable['f']) {
    const { texto, archivo } = contenidoExport(expediente, id);
    setEstado(`Preparando ${archivo}…`);
    try {
      const blob = new Blob([texto], { type: MIME[formato] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = archivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setEstado(`Guardado: ${archivo}`);
    } catch {
      setEstado('No se pudo descargar. Usa «Copiar».');
    }
  }

  async function copiar(id: Exportable['id']) {
    const { texto, archivo } = contenidoExport(expediente, id);
    try {
      await navigator.clipboard.writeText(texto);
      setEstado(`Copiado al portapapeles: ${archivo} (${Math.round(texto.length / 1024)} KB).`);
    } catch {
      setEstado('El navegador no dejó copiar. Descárgalo.');
    }
  }

  return (
    <ModuloCard
      titulo="Preparar publicación"
      sub="exportar los datos y armar el borrador con la guía CARE"
      ancho="full"
      esPrimero={esPrimero}
      esUltimo={esUltimo}
      onSubir={onSubir}
      onBajar={onBajar}
      onQuitar={onQuitar}
    >
      <p className={styles.litnote}>
        <b>Para qué sirve esto.</b>
        <br />
        Un reporte de caso se atora casi siempre en lo mismo: reunir las fechas, las dosis y los valores dispersos en
        decenas de documentos. Eso ya está hecho. Aquí se descarga en formatos que sirven para escribir y para
        reanalizar, y se arma un borrador con la estructura que piden las revistas. <b>El texto es un andamio: la
        interpretación, la discusión y la firma son del médico.</b>
      </p>

      <h4 className={styles.sech}>Exportar</h4>
      <div className={styles.exp}>
        {exportables.map((a) => (
          <div key={a.id} className={styles.ex}>
            <div>
              <b>{a.n}</b>
              <span>{a.d}</span>
            </div>
            <div className={styles.exb}>
              <button type="button" className={styles.chip} onClick={() => descargar(a.id, a.f)}>
                Descargar {a.f}
              </button>
              <button type="button" className={styles.chip} onClick={() => copiar(a.id)}>
                Copiar
              </button>
            </div>
          </div>
        ))}
      </div>
      <Hint className={styles.estado}>{estado}</Hint>

      <h4 className={styles.sech}>
        Lista de verificación CARE <em>{listos} de {CARE.length} secciones ya salen del expediente · {faltan} dependen del paciente</em>
      </h4>
      <Hint className={styles.pie}>
        CARE es la guía de consenso para reportar casos clínicos (Gagnier y cols., 2013). Las revistas la piden cada
        vez más. Esto muestra qué punto ya está cubierto por los datos y cuál depende de ti.
      </Hint>
      <div className={styles.care}>
        {CARE.map((c) => (
          <div key={c.n} className={clsx(styles.ci, styles[c.e])}>
            <span className={styles.es}>{ICONO[c.e] ?? '○'}</span>
            <div>
              <b>{c.n}</b>
              <span>{c.q}</span>
            </div>
            <i className={styles.etiqueta}>{ETIQUETA[c.e] ?? c.e}</i>
          </div>
        ))}
      </div>
      <Hint className={styles.pie2}>
        <b>Antes de enviar nada:</b> el borrador contiene datos identificables (fecha de nacimiento, fechas exactas de
        atención). Hay que anonimizarlo y conseguir el consentimiento informado del paciente. Sin eso no hay
        publicación.
      </Hint>
    </ModuloCard>
  );
}
