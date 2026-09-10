// Nube de puntos esquemática del cuerpo, portada 1:1 de la IIFE `const BODY`
// en app/consola.html original. No es una imagen anatómica: son puntos
// aleatorios dentro de elipsoides/tubos que aproximan cabeza, tronco,
// pelvis, brazos y piernas. `sistema` es 0 si el punto no pertenece a
// ningún sistema clínico marcado, o el índice+1 del sistema (ver sistemas.utils.ts).
export type PuntoCuerpo = [x: number, y: number, z: number, sistema: number];

function elipsoide(P: PuntoCuerpo[], cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, n: number) {
  for (let i = 0; i < n; i++) {
    const u = Math.acos(2 * Math.random() - 1);
    const v = Math.random() * Math.PI * 2;
    P.push([cx + rx * Math.sin(u) * Math.cos(v), cy + ry * Math.cos(u), cz + rz * Math.sin(u) * Math.sin(v), 0]);
  }
}

function tubo(P: PuntoCuerpo[], x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, r0: number, r1: number, n: number) {
  for (let i = 0; i < n; i++) {
    const k = Math.random();
    const a = Math.random() * Math.PI * 2;
    const r = r0 + (r1 - r0) * k;
    P.push([x0 + (x1 - x0) * k + r * Math.cos(a), y0 + (y1 - y0) * k, z0 + (z1 - z0) * k + r * 0.62 * Math.sin(a), 0]);
  }
}

function tronco(P: PuntoCuerpo[], n: number) {
  for (let i = 0; i < n; i++) {
    const k = Math.random();
    const y = 0.86 + k * 0.6;
    const a = Math.random() * Math.PI * 2;
    const w = 0.205 + 0.055 * Math.sin(k * 2.6) - 0.045 * k * k;
    const d = 0.115 + 0.02 * Math.sin(k * 3.1);
    P.push([w * Math.cos(a), y, d * Math.sin(a), 0]);
  }
}

export function generarCuerpo(): PuntoCuerpo[] {
  const P: PuntoCuerpo[] = [];
  elipsoide(P, 0, 1.66, 0, 0.105, 0.128, 0.108, 240); // cabeza
  tubo(P, 0, 1.5, 0, 0, 1.56, 0, 0.045, 0.052, 40); // cuello
  tronco(P, 560); // tórax y abdomen
  elipsoide(P, 0, 0.855, 0, 0.155, 0.075, 0.105, 150); // pelvis
  tubo(P, -0.2, 1.44, 0, -0.255, 1.1, 0.01, 0.052, 0.042, 110); // brazo izq
  tubo(P, -0.255, 1.1, 0.01, -0.285, 0.83, 0.02, 0.042, 0.03, 95);
  tubo(P, 0.2, 1.44, 0, 0.255, 1.1, 0.01, 0.052, 0.042, 110); // brazo der
  tubo(P, 0.255, 1.1, 0.01, 0.285, 0.83, 0.02, 0.042, 0.03, 95);
  tubo(P, -0.085, 0.86, 0, -0.1, 0.45, 0, 0.078, 0.055, 150); // pierna izq
  tubo(P, -0.1, 0.45, 0, -0.105, 0.045, 0.01, 0.055, 0.036, 130);
  tubo(P, 0.085, 0.86, 0, 0.1, 0.45, 0, 0.078, 0.055, 150); // pierna der
  tubo(P, 0.1, 0.45, 0, 0.105, 0.045, 0.01, 0.055, 0.036, 130);
  return P;
}
