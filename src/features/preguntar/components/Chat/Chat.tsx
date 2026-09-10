'use client';

import { useEffect, useRef, useState } from 'react';
import { Chip } from '@/components/atoms/Chip';
import { ErrorPreguntar, preguntarService } from '../../services/preguntar.service';
import { formatearRespuesta } from '../../utils/formatoRespuesta.utils';
import type { Turno } from '../../types';
import styles from './Chat.module.css';

const SUGERENCIAS = [
  '¿Está tomando aspirina hoy?',
  '¿Qué mostró la coronariografía de enero?',
  '¿Qué pasó con las plaquetas al suspender el Xarelto?',
  '¿Hay datos de hipertensión portal y desde cuándo?',
  '¿Qué contradicciones hay entre documentos?',
  '¿Qué falta para valorar riesgo quirúrgico?',
  '¿Cómo se relacionan el bazo y las plaquetas?',
];

type Mensaje = { rol: 'you' | 'ai'; texto: string; pensando?: boolean };

const MENSAJE_INICIAL: Mensaje = {
  rol: 'ai',
  texto:
    'Pregunta lo que necesites sobre este paciente. Las respuestas se construyen solo con los valores del expediente que ves en esta consola: cada cifra viene con su fecha, y si el dato no existe se dice que no existe en vez de estimarlo.',
};

export function Chat() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([MENSAJE_INICIAL]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [pregunta, setPregunta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [mensajes]);

  async function preguntar(texto: string) {
    const q = texto.trim();
    if (!q || enviando) return;
    setPregunta('');
    setEnviando(true);
    setMensajes((prev) => [...prev, { rol: 'you', texto: q }, { rol: 'ai', texto: 'Pensando…', pensando: true }]);

    const turnosNuevos: Turno[] = [...turnos, { role: 'user', content: q }];
    try {
      const completa = await preguntarService.preguntar(turnosNuevos, (parcial) => {
        setMensajes((prev) => {
          const copia = prev.slice();
          copia[copia.length - 1] = { rol: 'ai', texto: parcial };
          return copia;
        });
      });
      setTurnos([...turnosNuevos, { role: 'assistant', content: completa }]);
    } catch (e) {
      const texto2 = e instanceof ErrorPreguntar ? e.message : 'No se pudo completar la respuesta.';
      setMensajes((prev) => {
        const copia = prev.slice();
        copia[copia.length - 1] = { rol: 'ai', texto: texto2 };
        return copia;
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className={styles.log} ref={logRef}>
        {mensajes.map((m, i) => (
          <div key={i} className={styles.msg}>
            <div className={styles.who2}>{m.rol === 'you' ? 'Médico' : i === 0 ? 'Cómo funciona' : 'Respuesta'}</div>
            <RespuestaBurbuja mensaje={m} />
          </div>
        ))}
      </div>
      <div className={styles.ask}>
        <input
          type="text"
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') preguntar(pregunta); }}
          placeholder="¿Qué mostró la coronariografía de enero?"
          autoComplete="off"
        />
        <button type="button" disabled={enviando} onClick={() => preguntar(pregunta)}>
          Preguntar
        </button>
      </div>
      <div className={styles.sug}>
        {SUGERENCIAS.map((s) => (
          <Chip key={s} variante="solido" onClick={() => preguntar(s)}>
            {s}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function RespuestaBurbuja({ mensaje }: { mensaje: Mensaje }) {
  if (mensaje.rol === 'you') return <div className={styles.bubYou}>{mensaje.texto}</div>;
  if (mensaje.pensando) return <div className={styles.bubAi}>{mensaje.texto}</div>;
  const { cuerpo, fuente } = formatearRespuesta(mensaje.texto);
  return (
    <div className={styles.bubAi}>
      {cuerpo}
      {fuente && <div className={styles.cite}>{fuente}</div>}
    </div>
  );
}
