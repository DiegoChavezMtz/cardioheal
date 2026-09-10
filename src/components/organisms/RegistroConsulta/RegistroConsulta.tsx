'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ComboInput } from '@/components/atoms/ComboInput';
import {
  registrarObservacionConsulta,
  registrarSignosHoy,
  registrarTratamientoConsulta,
} from '@/services/registroConsulta.actions';
import type { AccionTratamiento, Expediente } from '@/types/expediente';
import { pam } from '@/utils/expediente.utils';
import styles from './RegistroConsulta.module.css';

type Tab = 'signos' | 'observacion' | 'tratamiento';

const TIPOS_OBSERVACION = ['Exploración física', 'Interrogatorio dirigido', 'Revisión de estudios', 'Plan/decisión clínica'];

const ACCIONES: Array<{ v: AccionTratamiento; n: string }> = [
  { v: 'inicia', n: 'se inicia' },
  { v: 'sube', n: 'se sube la dosis' },
  { v: 'baja', n: 'se baja la dosis' },
  { v: 'suspende', n: 'se suspende' },
];

type Capturado = { id: string; texto: string };

/**
 * Botón + modal "Registrar en consulta": captura en vivo durante la visita
 * (signos, observación, cambio de tratamiento), directo a las tablas del
 * expediente. Vive en src/components/ (no en una feature) porque aparece en
 * el encabezado de toda la app — ver EncabezadoExpediente.
 *
 * "Pendiente" (visto en la referencia visual) queda fuera de esta versión.
 */
export function RegistroConsulta({ expediente }: { expediente: Expediente }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button type="button" className={styles.abrir} onClick={() => setAbierto(true)}>
        + Registrar en consulta
      </button>
      {abierto && <ModalRegistro expediente={expediente} onCerrar={() => setAbierto(false)} />}
    </>
  );
}

function ModalRegistro({ expediente, onCerrar }: { expediente: Expediente; onCerrar: () => void }) {
  const [tab, setTab] = useState<Tab>('signos');
  const [capturado, setCapturado] = useState<Capturado[]>([]);
  const router = useRouter();

  function agregarCapturado(texto: string) {
    setCapturado((prev) => [{ id: `${Date.now()}`, texto }, ...prev]);
    router.refresh();
  }

  async function copiarNota() {
    const texto = capturado.map((c) => c.texto).join('\n');
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // portapapeles no disponible (permiso denegado, contexto no seguro): sin feedback bloqueante
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className={styles.card}>
        <div className={styles.head}>
          <div>
            <h2>Registrar en consulta</h2>
            <p className={styles.desc}>
              Lo que captures aquí entra al expediente <b>de esta sesión</b> y se refleja de inmediato en la línea de
              tiempo y en los números. Queda marcado como capturado en consulta, aparte de los documentos.
            </p>
          </div>
          <button type="button" className={styles.cerrar} onClick={onCerrar}>
            Cerrar
          </button>
        </div>

        <div className={styles.tabs}>
          <button type="button" className={tab === 'signos' ? styles.tabActivo : styles.tab} onClick={() => setTab('signos')}>
            Signos de hoy
          </button>
          <button type="button" className={tab === 'observacion' ? styles.tabActivo : styles.tab} onClick={() => setTab('observacion')}>
            Observación
          </button>
          <button type="button" className={tab === 'tratamiento' ? styles.tabActivo : styles.tab} onClick={() => setTab('tratamiento')}>
            Tratamiento
          </button>
        </div>

        {tab === 'signos' && <FormSignos expediente={expediente} onGuardado={agregarCapturado} />}
        {tab === 'observacion' && <FormObservacion expediente={expediente} onGuardado={agregarCapturado} />}
        {tab === 'tratamiento' && <FormTratamiento expediente={expediente} onGuardado={agregarCapturado} />}

        <hr className={styles.sep} />
        <div className={styles.capturadoHead}>
          <span className={styles.capturadoTitulo}>Capturado en esta sesión</span>
          <div className={styles.capturadoAcciones}>
            <button type="button" onClick={copiarNota} disabled={!capturado.length}>
              Copiar la nota
            </button>
            <button type="button" onClick={() => setCapturado([])} disabled={!capturado.length}>
              Borrar todo
            </button>
          </div>
        </div>
        {capturado.length ? (
          <ul className={styles.capturadoLista}>
            {capturado.map((c) => (
              <li key={c.id}>{c.texto}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.capturadoVacio}>Todavía no hay nada. Lo que guardes aparece aquí.</p>
        )}
      </div>
    </div>
  );
}

function FormSignos({ expediente, onGuardado }: { expediente: Expediente; onGuardado: (texto: string) => void }) {
  const [fecha, setFecha] = useState(expediente.hoy);
  const [sistolica, setSistolica] = useState('');
  const [diastolica, setDiastolica] = useState('');
  const [pulso, setPulso] = useState('');
  const [peso, setPeso] = useState('');
  const [saturacion, setSaturacion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const s = sistolica ? Number(sistolica) : null;
  const d = diastolica ? Number(diastolica) : null;
  const pamPreview = s != null && d != null ? pam(s, d) : null;
  const hayAlgo = [sistolica, diastolica, pulso, peso, saturacion].some((v) => v.trim());

  async function guardar() {
    setError('');
    setGuardando(true);
    const input = {
      fecha,
      sistolica: s,
      diastolica: d,
      pulso: pulso ? Number(pulso) : null,
      saturacion: saturacion ? Number(saturacion) : null,
      peso: peso ? Number(peso) : null,
    };
    const r = await registrarSignosHoy(input);
    setGuardando(false);
    if ('error' in r) return setError(r.error);
    const partes = [
      s != null && d != null ? `${s}/${d} mmHg (PAM ${pam(s, d)})` : null,
      pulso ? `${pulso} lpm` : null,
      saturacion ? `SatO₂ ${saturacion}%` : null,
      peso ? `${peso} kg` : null,
    ].filter(Boolean);
    onGuardado(`Signos ${fecha}: ${partes.join(' · ')}`);
    setSistolica(''); setDiastolica(''); setPulso(''); setPeso(''); setSaturacion('');
  }

  return (
    <div className={styles.form}>
      <div className={styles.grid2}>
        <Campo etiqueta="Fecha">
          <input type="date" className={styles.input} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
        <Campo etiqueta="Sistólica" unidad="mmHg">
          <input type="number" className={styles.input} value={sistolica} placeholder="—" onChange={(e) => setSistolica(e.target.value)} />
        </Campo>
        <Campo etiqueta="Diastólica" unidad="mmHg">
          <input type="number" className={styles.input} value={diastolica} placeholder="—" onChange={(e) => setDiastolica(e.target.value)} />
        </Campo>
        <Campo etiqueta="Pulso" unidad="lpm">
          <input type="number" className={styles.input} value={pulso} placeholder="—" onChange={(e) => setPulso(e.target.value)} />
        </Campo>
        <Campo etiqueta="Peso" unidad="kg">
          <input type="number" className={styles.input} value={peso} placeholder="—" onChange={(e) => setPeso(e.target.value)} />
        </Campo>
        <Campo etiqueta="SatO₂" unidad="%">
          <input type="number" className={styles.input} value={saturacion} placeholder="—" onChange={(e) => setSaturacion(e.target.value)} />
        </Campo>
      </div>
      <p className={styles.hint}>
        {pamPreview != null ? `PAM ${pamPreview} mmHg.` : 'La PAM se calcula sola en cuanto pongas sistólica y diastólica.'}
      </p>
      {error && <p className={styles.error}>{error}</p>}
      <button type="button" className={styles.guardar} disabled={!hayAlgo || guardando} onClick={guardar}>
        {guardando ? 'Guardando…' : 'Guardar los signos'}
      </button>
    </div>
  );
}

function FormObservacion({ expediente, onGuardado }: { expediente: Expediente; onGuardado: (texto: string) => void }) {
  const [fecha, setFecha] = useState(expediente.hoy);
  const [tipo, setTipo] = useState('');
  const [detalle, setDetalle] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function guardar() {
    setError('');
    setGuardando(true);
    const r = await registrarObservacionConsulta({ fecha, tipo: tipo.trim(), detalle: detalle.trim() });
    setGuardando(false);
    if ('error' in r) return setError(r.error);
    onGuardado(`Observación ${fecha} (${tipo.trim()}): ${detalle.trim()}`);
    setTipo(''); setDetalle('');
  }

  return (
    <div className={styles.form}>
      <div className={styles.grid2}>
        <Campo etiqueta="Fecha">
          <input type="date" className={styles.input} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
        <Campo etiqueta="Tipo">
          <ComboInput value={tipo} onChange={setTipo} opciones={TIPOS_OBSERVACION} placeholder="elegir o escribir…" />
        </Campo>
      </div>
      <Campo etiqueta="Qué se observó">
        <textarea
          className={styles.textarea}
          value={detalle}
          placeholder="Se escribe tal cual quedará en el expediente."
          onChange={(e) => setDetalle(e.target.value)}
        />
      </Campo>
      {error && <p className={styles.error}>{error}</p>}
      <button type="button" className={styles.guardar} disabled={!tipo.trim() || !detalle.trim() || guardando} onClick={guardar}>
        {guardando ? 'Guardando…' : 'Guardar la observación'}
      </button>
    </div>
  );
}

function FormTratamiento({ expediente, onGuardado }: { expediente: Expediente; onGuardado: (texto: string) => void }) {
  const [fecha, setFecha] = useState(expediente.hoy);
  const [farmaco, setFarmaco] = useState('');
  const [accion, setAccion] = useState<AccionTratamiento>('sube');
  const [dosis, setDosis] = useState('');
  const [grupoNuevo, setGrupoNuevo] = useState('');
  const [porQue, setPorQue] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const farmacos = useMemo(() => [...new Set(expediente.meds.map((m) => m.farmaco))].sort(), [expediente.meds]);
  const grupos = useMemo(() => [...new Set(expediente.meds.map((m) => m.grupo))].sort(), [expediente.meds]);
  const esFarmacoNuevo = farmaco.trim() !== '' && !farmacos.some((f) => f.toLowerCase() === farmaco.trim().toLowerCase());
  const necesitaDosis = accion !== 'suspende';
  const puedeGuardar = farmaco.trim() && (!necesitaDosis || dosis.trim()) && (!esFarmacoNuevo || grupoNuevo.trim());

  async function guardar() {
    setError('');
    setGuardando(true);
    const r = await registrarTratamientoConsulta({
      fecha,
      farmaco: farmaco.trim(),
      grupo: esFarmacoNuevo ? grupoNuevo.trim() : null,
      accion,
      dosis: necesitaDosis ? dosis.trim() : null,
      porQue: porQue.trim(),
    });
    setGuardando(false);
    if ('error' in r) return setError(r.error);
    const accionTexto = ACCIONES.find((a) => a.v === accion)!.n;
    onGuardado(`Tratamiento ${fecha}: ${farmaco.trim()} — ${accionTexto}${dosis.trim() ? ` (${dosis.trim()})` : ''}`);
    setFarmaco(''); setDosis(''); setGrupoNuevo(''); setPorQue('');
  }

  return (
    <div className={styles.form}>
      <div className={styles.grid2}>
        <Campo etiqueta="Fecha">
          <input type="date" className={styles.input} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
        <Campo etiqueta="Fármaco">
          <ComboInput value={farmaco} onChange={setFarmaco} opciones={farmacos} placeholder="elegir o escribir uno nuevo…" />
        </Campo>
        <Campo etiqueta="Qué se hizo">
          <select className={styles.input} value={accion} onChange={(e) => setAccion(e.target.value as AccionTratamiento)}>
            {ACCIONES.map((a) => (
              <option key={a.v} value={a.v}>
                {a.n}
              </option>
            ))}
          </select>
        </Campo>
        {necesitaDosis && (
          <Campo etiqueta="Dosis que queda">
            <input type="text" className={styles.input} value={dosis} placeholder="p. ej. 6.25 mg c/24 h" onChange={(e) => setDosis(e.target.value)} />
          </Campo>
        )}
        {esFarmacoNuevo && (
          <Campo etiqueta="Grupo terapéutico">
            <ComboInput value={grupoNuevo} onChange={setGrupoNuevo} opciones={grupos} placeholder="elegir o escribir…" />
          </Campo>
        )}
      </div>
      <Campo etiqueta="Por qué">
        <textarea
          className={styles.textarea}
          value={porQue}
          placeholder="El motivo de este cambio."
          onChange={(e) => setPorQue(e.target.value)}
        />
      </Campo>
      {error && <p className={styles.error}>{error}</p>}
      <button type="button" className={styles.guardar} disabled={!puedeGuardar || guardando} onClick={guardar}>
        {guardando ? 'Guardando…' : 'Guardar el cambio'}
      </button>
    </div>
  );
}

function Campo({ etiqueta, unidad, children }: { etiqueta: string; unidad?: string; children: ReactNode }) {
  return (
    <label className={styles.campo}>
      <span className={styles.etiqueta}>
        {etiqueta}
        {unidad && <span className={styles.unidad}> {unidad}</span>}
      </span>
      {children}
    </label>
  );
}
