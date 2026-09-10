import type { Expediente } from '@/types/expediente';
import { day, MS } from '@/utils/expediente.utils';

// Franja de "signo vital" al pie de la escena: la PAM real del registro
// casero, portada de signSVG() en el consola.html original. Devuelve datos
// listos para JSX (<polyline points="...">) en vez de un string de SVG
// crudo, para no necesitar dangerouslySetInnerHTML.
export type FirmaPam = { yUmbral: number; altoBanda: number; tramos: string[] } | null;

const HW = 1000;
const HH = 56;
const LO = 45;
const HI = 100;
const Y = (v: number) => 6 + 40 * (1 - (Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO));

export function calcularFirmaPam(D: Expediente): FirmaPam {
  const by: Record<string, number[]> = {};
  D.presion.filter((r) => r.src === 'casa' && r.a).forEach((r) => { (by[r.f] ??= []).push(r.a); });
  const S = Object.keys(by)
    .sort()
    .map((f) => ({ f, v: by[f].reduce((a, b) => a + b, 0) / by[f].length }));
  if (S.length < 3) return null;

  const t0 = day(S[0].f);
  const t1 = day(S[S.length - 1].f);
  const span = t1 - t0 || 1;
  const Xs = (f: string) => ((day(f) - t0) / span) * HW;

  const tramos: string[] = [];
  let actual: typeof S = [S[0]];
  for (let i = 1; i < S.length; i++) {
    if ((day(S[i].f) - day(S[i - 1].f)) / MS > 7) {
      if (actual.length >= 2) tramos.push(actual.map((p) => `${Xs(p.f).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' '));
      actual = [];
    }
    actual.push(S[i]);
  }
  if (actual.length >= 2) tramos.push(actual.map((p) => `${Xs(p.f).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' '));

  return { yUmbral: Y(65), altoBanda: HH - Y(65), tramos };
}
