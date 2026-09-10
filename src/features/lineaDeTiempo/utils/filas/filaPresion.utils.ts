import type { Expediente } from '@/types/expediente';
import { day, MS, fmtS, serie, tramos } from '@/utils/expediente.utils';
import { W, X, type Dominio } from '../rango.utils';

export const ALTO_PRESION = 78;

/** Portado de rowPresion(): barras sistólica–diastólica por día, PAM en línea, huecos sombreados. */
export function filaPresion(D: Expediente, dom: Dominio): string {
  const h = ALTO_PRESION;
  const pt = 8;
  const pb = 10;
  const ih = h - pt - pb;
  const lo = 40;
  const hi = 130;
  const Y = (v: number) => pt + ih * (1 - (v - lo) / (hi - lo));

  let s = `<rect x="0" y="${Y(130)}" width="${W}" height="${Y(70) - Y(130)}" fill="rgba(59,142,245,.07)"/>`;

  const by: Record<string, typeof D.presion> = {};
  D.presion.forEach((r) => { (by[r.f] ??= []).push(r); });
  Object.keys(by).forEach((f) => {
    const x = X(dom, day(f));
    if (x < -2 || x > W + 2) return;
    const rs = by[f];
    const smax = Math.max(...rs.map((r) => r.s));
    const dmin = Math.min(...rs.map((r) => r.d));
    const cons = rs.some((r) => r.src === 'consulta');
    s += `<line x1="${x.toFixed(1)}" y1="${Y(smax).toFixed(1)}" x2="${x.toFixed(1)}" y2="${Y(dmin).toFixed(1)}" stroke="${cons ? 'var(--amber)' : 'var(--blue)'}" stroke-width="1.8" opacity=".55" stroke-linecap="round"/>`;
    const am = rs.filter((r) => r.m === 'mañana');
    if (am.length) {
      s += `<circle cx="${x.toFixed(1)}" cy="${Y(am.reduce((a, r) => a + r.s, 0) / am.length).toFixed(1)}" r="${cons ? 2.6 : 1.7}" fill="${cons ? 'var(--amber)' : 'var(--blue-2)'}"/>`;
    }
  });

  const pamS = serie(D, 'PAM').filter((p) => { const x = X(dom, day(p.f)); return x >= -40 && x <= W + 40; });
  if (pamS.length > 1) {
    tramos(pamS).forEach((t) => {
      if (t.length < 2) return;
      s += `<polyline points="${t.map((p) => `${X(dom, day(p.f)).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--ok)" stroke-width="1.1" opacity=".85" stroke-linejoin="round"/>`;
    });
    s += `<line x1="0" y1="${Y(65).toFixed(1)}" x2="${W}" y2="${Y(65).toFixed(1)}" stroke="var(--ok)" stroke-width=".8" stroke-dasharray="3 3" opacity=".5"/>`;
  }

  [120, 90, 60].forEach((v) => {
    s += `<line x1="0" y1="${Y(v)}" x2="${W}" y2="${Y(v)}" stroke="var(--line)" stroke-width=".6" stroke-dasharray="2 4"/>` +
      `<text x="2" y="${Y(v) - 2}" font-size="7.5" fill="var(--muted)" font-family="IBM Plex Mono,monospace">${v}</text>`;
  });

  (D.huecos || []).forEach((g) => {
    const x1 = X(dom, day(g.desde));
    const x2 = X(dom, day(g.hasta));
    if (x2 <= x1 + 8 || x2 < 0 || x1 > W) return;
    s += `<rect x="${Math.max(0, x1).toFixed(1)}" y="${pt}" width="${(Math.min(W, x2) - Math.max(0, x1)).toFixed(1)}" height="${ih}" fill="var(--void)" opacity=".6"/>` +
      `<text x="${(Math.max(0, x1) + 6).toFixed(1)}" y="${pt + ih / 2}" font-size="9" fill="var(--muted)" font-family="Nunito,sans-serif">sin registro · ${g.dias} d</text>`;
  });

  const ultimaCasa = D.presion.filter((r) => r.src === 'casa').map((r) => r.f).sort().pop();
  if (ultimaCasa) {
    const xf = X(dom, day(ultimaCasa) + MS);
    if (xf < W - 20) {
      s += `<rect x="${(xf + 2).toFixed(1)}" y="${pt}" width="${(W - xf - 2).toFixed(1)}" height="${ih}" fill="var(--void)" opacity=".6"/>` +
        `<text x="${(xf + 8).toFixed(1)}" y="${pt + ih / 2}" font-size="9" fill="var(--muted)" font-family="Nunito,sans-serif">sin registro casero desde ${fmtS(ultimaCasa)}</text>`;
    }
  }

  return `<svg viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" style="height:${h}px">${s}</svg>`;
}
