import 'server-only';
import { supabase } from '@/lib/supabase';
import type {
  Antecedentes,
  ConsultaCardio,
  Estudio,
  EstudioLab,
  Evento,
  Expediente,
  FeviValor,
  FlagLab,
  GdmtFila,
  GlucosaLectura,
  Hueco,
  Labs,
  LabsNotas,
  Medicamento,
  NotaCasa,
  NuevaObservacion,
  NuevoSignoConsulta,
  NuevoTratamiento,
  Patron,
  PesoLectura,
  PresionLectura,
  Riesgo,
  SignoConsulta,
} from '@/types/expediente';

// Shape exacto de cada tabla (ver supabase/migrations/0001_init.sql). Vive
// aquí porque es un detalle de infraestructura de este service, no del
// dominio: la UI nunca ve estos tipos, solo los de @/types/expediente.
type LabReferenciaRow = { marcador: string; ref_bajo: number | null; ref_alto: number | null };
type LabActualRow = { marcador: string; fecha: string; valor: number; origen: string };
type PresionRow = {
  fecha: string; hora: string; momento: string; sistolica: number; diastolica: number;
  pulso: number | null; saturacion: number | null; pam: number; presion_pulso: number;
  origen: string; nota: string | null;
};
type GlucosaRow = { fecha: string; valor: number };
type PesoRow = { fecha: string; valor: number };
type MedicamentoRow = {
  grupo: string; farmaco: string; dosis: string; inicio: string; fin: string | null;
  fuente: string; confianza: string;
};
type EventoRow = { fecha: string; titulo: string; detalle: string; peso: string; fuente: string };
type FeviRow = { fecha: string; valor: number; fuente: string };
type EstudioRow = {
  fecha: string; titulo: string; categoria: string; hallazgos: string[]; conclusion: string; fuente: string;
};
type EcgRow = { fecha: string; texto: string; fuente: string };
type SignoConsultaRow = {
  fecha: string; sistolica: number | null; diastolica: number | null; pulso: number | null; saturacion: number | null;
  peso: number | null; fuente: string;
};
type HuecoRow = { desde: string; hasta: string; dias: number };
type NotaCasaRow = { fecha: string; hora: string; texto: string };
type EstudioLabRow = {
  fecha: string; panel: string; analito: string; valor: string; unidad: string | null;
  ref_bajo: string | null; ref_alto: string | null; flag: FlagLab; archivo: string;
};

async function capaClinica<T>(clave: string, porDefecto: T): Promise<T> {
  const { data, error } = await supabase()
    .from('capa_clinica')
    .select('valor')
    .eq('clave', clave)
    .maybeSingle()
    .overrideTypes<{ valor: T } | null, { merge: false }>();
  if (error) throw error;
  return data?.valor ?? porDefecto;
}

async function cargarLabs(): Promise<Labs> {
  const db = supabase();
  const [refs, valores] = await Promise.all([
    db.from('lab_referencias').select('marcador, ref_bajo, ref_alto').overrideTypes<LabReferenciaRow[], { merge: false }>(),
    db
      .from('v_labs_actuales')
      .select('marcador, fecha, valor, origen')
      .order('fecha', { ascending: true })
      .overrideTypes<LabActualRow[], { merge: false }>(),
  ]);
  if (refs.error) throw refs.error;
  if (valores.error) throw valores.error;

  const labs: Labs = {};
  for (const r of refs.data ?? []) {
    labs[r.marcador] = {
      ref: r.ref_bajo != null && r.ref_alto != null ? [r.ref_bajo, r.ref_alto] : null,
      puntos: [],
    };
  }
  for (const v of valores.data ?? []) {
    if (!labs[v.marcador]) labs[v.marcador] = { ref: null, puntos: [] };
    labs[v.marcador].puntos.push({ f: v.fecha, v: v.valor, src: v.origen });
  }
  return labs;
}

// PostgREST limita cada respuesta a 1000 filas por defecto; estudios_lab ya
// tiene ~1400. Pagina con .range() hasta agotar la tabla en vez de asumir
// que un solo select trae todo (con una sola página se veían truncados los
// estudios más viejos, a mitad de la fecha donde caía la fila 1000).
const TAMANO_PAGINA = 1000;

// La columna `flag` de estudios_lab viene del PDF del laboratorio y casi
// siempre llega vacía (solo ~130 de 1400 filas la traen), aunque el rango de
// referencia sí esté capturado en ref_bajo/ref_alto. Sin este cálculo, "solo
// fuera de rango" y los contadores de "N fuera de rango" quedan casi
// siempre en cero aunque sí haya con qué comparar.
function calcularFlag(valor: string, refBajo: string | null, refAlto: string | null): FlagLab {
  if (refBajo === null || refAlto === null) return null;
  const v = Number.parseFloat(valor);
  const bajo = Number.parseFloat(refBajo);
  const alto = Number.parseFloat(refAlto);
  if (!Number.isFinite(v) || !Number.isFinite(bajo) || !Number.isFinite(alto)) return null;
  if (v < bajo) return 'bajo';
  if (v > alto) return 'sobre';
  return 'dentro';
}

async function cargarEstudiosLab(): Promise<EstudioLab[]> {
  const db = supabase();
  const filas: EstudioLabRow[] = [];
  for (let desde = 0; ; desde += TAMANO_PAGINA) {
    const { data, error } = await db
      .from('estudios_lab')
      .select('fecha, panel, analito, valor, unidad, ref_bajo, ref_alto, flag, archivo')
      .order('fecha', { ascending: false })
      .range(desde, desde + TAMANO_PAGINA - 1)
      .overrideTypes<EstudioLabRow[], { merge: false }>();
    if (error) throw error;
    filas.push(...(data ?? []));
    if (!data || data.length < TAMANO_PAGINA) break;
  }

  const porFecha = new Map<string, EstudioLab>();
  for (const r of filas) {
    if (!porFecha.has(r.fecha)) porFecha.set(r.fecha, { fecha: r.fecha, resultados: [] });
    porFecha.get(r.fecha)!.resultados.push({
      panel: r.panel, analito: r.analito, valor: r.valor, unidad: r.unidad,
      refBajo: r.ref_bajo, refAlto: r.ref_alto,
      flag: r.flag ?? calcularFlag(r.valor, r.ref_bajo, r.ref_alto),
      archivo: r.archivo,
    });
  }
  return [...porFecha.values()];
}

/**
 * Reconstruye el mismo objeto `D` que hoy consume consola.html, leyendo de
 * Supabase en vez de datos/datos.json. Se invoca una sola vez desde el
 * server component raíz (app/page.tsx) — patrón SSR-first: la carga inicial
 * completa del expediente es lectura de servidor, no un useEffect en cliente.
 */
export const expedienteService = {
  async cargar(): Promise<Expediente> {
    const db = supabase();
    const [
      labs,
      presion,
      glucosa,
      peso,
      meds,
      eventos,
      fevi,
      estudios,
      estudiosLab,
      ecg,
      signosConsulta,
      huecos,
      notasCasa,
      antecedentes,
      conflictos,
      gdmt,
      riesgo,
      patrones,
      litNota,
      hoy,
      labsNotas,
      consultaCardio,
    ] = await Promise.all([
      cargarLabs(),
      db.from('presion_lecturas').select('*').order('fecha', { ascending: true }).overrideTypes<PresionRow[], { merge: false }>(),
      db.from('glucosa_lecturas').select('fecha, valor').order('fecha', { ascending: true }).overrideTypes<GlucosaRow[], { merge: false }>(),
      db.from('peso_lecturas').select('fecha, valor').order('fecha', { ascending: true }).overrideTypes<PesoRow[], { merge: false }>(),
      db.from('medicamentos').select('*').order('inicio', { ascending: true }).overrideTypes<MedicamentoRow[], { merge: false }>(),
      db.from('eventos').select('*').order('fecha', { ascending: true }).overrideTypes<EventoRow[], { merge: false }>(),
      db.from('fevi_valores').select('*').order('fecha', { ascending: true }).overrideTypes<FeviRow[], { merge: false }>(),
      db.from('estudios').select('*').order('fecha', { ascending: true }).overrideTypes<EstudioRow[], { merge: false }>(),
      cargarEstudiosLab(),
      db.from('ecg_lecturas').select('*').order('fecha', { ascending: true }).overrideTypes<EcgRow[], { merge: false }>(),
      db.from('signos_consulta').select('*').order('fecha', { ascending: true }).overrideTypes<SignoConsultaRow[], { merge: false }>(),
      db.from('huecos_registro').select('desde, hasta, dias').order('desde', { ascending: true }).overrideTypes<HuecoRow[], { merge: false }>(),
      db.from('notas_casa').select('fecha, hora, texto').order('fecha', { ascending: true }).overrideTypes<NotaCasaRow[], { merge: false }>(),
      capaClinica<Antecedentes>('antecedentes', { Personales: [], Familiares: [], 'Exposiciones y estilo de vida': [] }),
      capaClinica<Array<{ t: string; a: string; b: string; n: string }>>('conflictos', []),
      capaClinica<GdmtFila[]>('gdmt', []),
      capaClinica<Riesgo>('riesgo', { f: '', src: '', scores: [], prep: [] }),
      capaClinica<Patron[]>('patrones', []),
      capaClinica<string>('lit_nota', ''),
      capaClinica<string>('hoy', new Date().toISOString().slice(0, 10)),
      capaClinica<LabsNotas>('labs_notas', {}),
      capaClinica<ConsultaCardio>('consulta_cardio', { f: '', quien: '', fuente: '' }),
    ]);

    for (const [nombre, res] of Object.entries({
      presion, glucosa, peso, meds, eventos, fevi, estudios, ecg, signosConsulta, huecos, notasCasa,
    })) {
      if (res.error) throw new Error(`expedienteService.cargar: ${nombre} — ${res.error.message}`);
    }

    return {
      labs,
      presion: (presion.data ?? []).map(
        (r): PresionLectura => ({
          f: r.fecha, h: r.hora, m: r.momento, s: r.sistolica, d: r.diastolica,
          p: r.pulso, o: r.saturacion, a: r.pam, pp: r.presion_pulso, src: r.origen,
          nota: r.nota ?? undefined,
        }),
      ),
      glucosa: (glucosa.data ?? []).map((r): GlucosaLectura => ({ f: r.fecha, v: r.valor })),
      peso: (peso.data ?? []).map((r): PesoLectura => ({ f: r.fecha, v: r.valor })),
      meds: (meds.data ?? []).map(
        (r): Medicamento => ({
          grupo: r.grupo, farmaco: r.farmaco, dosis: r.dosis, inicio: r.inicio, fin: r.fin,
          fuente: r.fuente, confianza: r.confianza,
        }),
      ),
      eventos: (eventos.data ?? []).map(
        (r): Evento => ({ fecha: r.fecha, titulo: r.titulo, detalle: r.detalle, peso: r.peso, fuente: r.fuente }),
      ),
      fevi: (fevi.data ?? []).map((r): FeviValor => ({ fecha: r.fecha, valor: r.valor, fuente: r.fuente })),
      estudios: (estudios.data ?? []).map(
        (r): Estudio => ({ f: r.fecha, t: r.titulo, cat: r.categoria, hall: r.hallazgos, concl: r.conclusion, src: r.fuente }),
      ),
      estudiosLab,
      ecg: (ecg.data ?? []).map((r) => ({ f: r.fecha, txt: r.texto, src: r.fuente })),
      antecedentes,
      conflictos,
      gdmt,
      riesgo,
      patrones,
      lit_nota: litNota,
      hoy,
      signos_consulta: (signosConsulta.data ?? []).map(
        (r): SignoConsulta => ({ f: r.fecha, s: r.sistolica, d: r.diastolica, p: r.pulso, o: r.saturacion, peso: r.peso, src: r.fuente }),
      ),
      huecos: (huecos.data ?? []).map((r): Hueco => ({ desde: r.desde, hasta: r.hasta, dias: r.dias })),
      notas_casa: (notasCasa.data ?? []).map((r): NotaCasa => ({ f: r.fecha, h: r.hora, txt: r.texto })),
      labs_notas: labsNotas,
      consulta_cardio: consultaCardio,
    };
  },

  /** Escritura del paso "Confirmar y agregar" de Actualizar (Server Action). */
  async confirmarValor(input: { marcador: string; fecha: string | null; valor: number; unidad: string; origen: string }) {
    const { error } = await supabase().from('mediciones_confirmadas').insert({
      marcador: input.marcador,
      fecha: input.fecha,
      valor: input.valor,
      unidad: input.unidad,
      origen: input.origen,
    });
    if (error) throw error;
  },

  /** Escritura de la pestaña "Signos de hoy" de Registrar en consulta. */
  async registrarSignos(input: NuevoSignoConsulta) {
    const { error } = await supabase().from('signos_consulta').insert({
      fecha: input.fecha,
      sistolica: input.sistolica,
      diastolica: input.diastolica,
      pulso: input.pulso,
      saturacion: input.saturacion,
      peso: input.peso,
      fuente: 'Registrado en consulta',
    });
    if (error) throw error;
  },

  /** Escritura de la pestaña "Observación": se refleja en la línea de tiempo como evento. */
  async registrarObservacion(input: NuevaObservacion) {
    const { error } = await supabase().from('eventos').insert({
      fecha: input.fecha,
      titulo: input.tipo,
      detalle: input.detalle,
      peso: 'medio',
      fuente: 'Registrado en consulta',
    });
    if (error) throw error;
  },

  /**
   * Escritura de la pestaña "Tratamiento". Para que la línea de tiempo no
   * dibuje dos barras vigentes del mismo fármaco a la vez, cierra la fila
   * activa (fin = null) antes de abrir una nueva — salvo "inicia", que no
   * tiene fila previa que cerrar. "suspende" solo cierra, no inserta.
   * "mantiene" no toca medicamentos (no hay nada que cerrar ni insertar):
   * solo deja constancia como evento, para no perder el motivo de la revisión.
   */
  async registrarTratamiento(input: NuevoTratamiento) {
    const db = supabase();

    if (input.accion === 'mantiene') {
      const { error } = await db.from('eventos').insert({
        fecha: input.fecha,
        titulo: 'Tratamiento sin cambios',
        detalle: input.porQue ? `${input.farmaco} — ${input.porQue}` : `${input.farmaco}: se revisó y se mantiene.`,
        peso: 'bajo',
        fuente: 'Registrado en consulta',
      });
      if (error) throw error;
      return;
    }

    if (input.accion !== 'inicia') {
      const { data: activa, error: eBusca } = await db
        .from('medicamentos')
        .select('id')
        .eq('farmaco', input.farmaco)
        .is('fin', null)
        .limit(1);
      if (eBusca) throw eBusca;
      if (activa?.[0]) {
        const { error: eCierra } = await db.from('medicamentos').update({ fin: input.fecha }).eq('id', activa[0].id);
        if (eCierra) throw eCierra;
      }
    }

    if (input.accion === 'suspende') return;

    let grupo = input.grupo;
    if (!grupo) {
      const { data: previo, error: eGrupo } = await db
        .from('medicamentos')
        .select('grupo')
        .eq('farmaco', input.farmaco)
        .order('inicio', { ascending: false })
        .limit(1);
      if (eGrupo) throw eGrupo;
      grupo = previo?.[0]?.grupo ?? 'Sin clasificar';
    }

    const { error: eInserta } = await db.from('medicamentos').insert({
      grupo,
      farmaco: input.farmaco,
      dosis: input.dosis ?? '',
      inicio: input.fecha,
      fin: null,
      fuente: input.porQue ? `Registrado en consulta — ${input.porQue}` : 'Registrado en consulta',
      confianza: 'documentado',
    });
    if (eInserta) throw eInserta;
  },
};
