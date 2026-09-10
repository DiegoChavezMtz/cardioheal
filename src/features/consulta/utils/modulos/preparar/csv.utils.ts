import type { Expediente } from '@/types/expediente';
import { U } from '@/utils/expediente.utils';

export function csvEsc(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function filaCSV(campos: unknown[]): string {
  return campos.map(csvEsc).join(',');
}

export function csvLabs(D: Expediente): string {
  const marc = Object.keys(D.labs).sort();
  const fechas = [...new Set(marc.flatMap((n) => D.labs[n].puntos.map((p) => p.f)))].sort();
  const cab = ['fecha', ...marc.map((n) => n + (U(n) ? ` (${U(n)})` : ''))];
  const filas = fechas.map((f) => [f, ...marc.map((n) => D.labs[n].puntos.find((p) => p.f === f)?.v ?? '')]);
  const refs = ['referencia_baja', ...marc.map((n) => D.labs[n].ref?.[0] ?? '')];
  const refa = ['referencia_alta', ...marc.map((n) => D.labs[n].ref?.[1] ?? '')];
  return [cab, refs, refa, ...filas].map(filaCSV).join('\n');
}

export function csvPresion(D: Expediente): string {
  const cab = ['fecha', 'hora', 'franja', 'sistolica', 'diastolica', 'pam', 'presion_de_pulso', 'pulso', 'spo2', 'origen', 'nota'];
  const filas = D.presion.map((r) => [r.f, r.h || '', r.m || '', r.s, r.d, r.a, r.pp, r.p ?? '', r.o ?? '', r.src, r.nota ?? '']);
  return [cab, ...filas].map(filaCSV).join('\n');
}

export function csvMeds(D: Expediente): string {
  const cab = ['grupo', 'farmaco', 'dosis', 'inicio', 'fin', 'fuente', 'confianza'];
  const filas = D.meds.map((m) => [m.grupo, m.farmaco, m.dosis, m.inicio, m.fin ?? '', m.fuente, m.confianza]);
  return [cab, ...filas].map(filaCSV).join('\n');
}
