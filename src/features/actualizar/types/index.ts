/** Un valor leído del estudio, todavía sin confirmar — no forma parte del expediente. */
export type Propuesta = {
  marcador: string;
  valor: number;
  unidad: string;
  fecha: string | null;
  /** Por qué se ve así: "marcador nuevo", "último registrado el...", o el conflicto con un valor existente. */
  why: string;
};

export type ResultadoExtraccion = { propuestas: Propuesta[] } | { error: string };
export type ResultadoConfirmar = { ok: true } | { error: string };
