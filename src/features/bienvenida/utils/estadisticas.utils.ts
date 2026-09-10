import type { Expediente } from '@/types/expediente';
import type { EstadisticasBienvenida } from '../types';

// Mismo cálculo que welcome() en el consola.html original (líneas ~1923-1935):
// total = valores de laboratorio + presión + glucosa + peso + medicamentos +
// eventos + estudios + ecg + fevi.
export function calcularEstadisticas(expediente: Expediente): EstadisticasBienvenida {
  const valoresLab = Object.values(expediente.labs).reduce((total, serie) => total + serie.puntos.length, 0);
  const total =
    valoresLab +
    expediente.presion.length +
    expediente.glucosa.length +
    expediente.peso.length +
    expediente.meds.length +
    expediente.eventos.length +
    expediente.estudios.length +
    expediente.ecg.length +
    expediente.fevi.length;

  return {
    totalDatos: total,
    valoresLab,
    marcadores: Object.keys(expediente.labs).length,
    tomasPresion: expediente.presion.length,
    estudiosEInformes: expediente.estudios.length + expediente.ecg.length,
    nombrePaciente: 'Antonio Velázquez Rocha',
  };
}
