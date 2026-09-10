import type { ModuloDef } from '../types';
import { TilesModulo } from '../components/modules/TilesModulo';
import { SinceModulo } from '../components/modules/SinceModulo';
import { GdmtModulo } from '../components/modules/GdmtModulo';
import { LimitesModulo } from '../components/modules/LimitesModulo';
import { FlagsModulo } from '../components/modules/FlagsModulo';
import { OverdueModulo } from '../components/modules/OverdueModulo';
import { EstudiosModulo } from '../components/modules/EstudiosModulo';
import { PeriopModulo } from '../components/modules/PeriopModulo';
import { ObsModulo } from '../components/modules/ObsModulo';
import { ConflictosModulo } from '../components/modules/ConflictosModulo';
import { EcgModulo } from '../components/modules/EcgModulo';
import { AntecedentesModulo } from '../components/modules/AntecedentesModulo';
import { RiesgoModulo } from '../components/modules/RiesgoModulo';
import { TendenciasModulo } from '../components/modules/TendenciasModulo';
import { PatronesModulo } from '../components/modules/PatronesModulo';
import { PublicarModulo } from '../components/modules/PublicarModulo';
import { PrepararModulo } from '../components/modules/PrepararModulo';

// Portado de const MODULES en el consola.html original. El ancho y el
// subtítulo de cada uno ya viven dentro de su propio componente (ver
// ModuloCard dentro de cada Modulo); aquí solo hace falta lo que necesitan
// los chips de selección: id y nombre, en el orden del preset "Completa".
export const MODULOS: ModuloDef[] = [
  { id: 'tiles', n: 'Estado actual', Componente: TilesModulo },
  { id: 'since', n: 'Desde la última consulta', Componente: SinceModulo },
  { id: 'gdmt', n: 'Tratamiento dirigido por guías', Componente: GdmtModulo },
  { id: 'lim', n: 'Límites para titular', Componente: LimitesModulo },
  { id: 'flags', n: 'Puntos de atención', Componente: FlagsModulo },
  { id: 'over', n: 'Estudios sin control reciente', Componente: OverdueModulo },
  { id: 'estud', n: 'Estudios e informes', Componente: EstudiosModulo },
  { id: 'periop', n: 'Si se plantea una intervención', Componente: PeriopModulo },
  { id: 'obs', n: 'Observaciones calculadas', Componente: ObsModulo },
  { id: 'conf', n: 'Contradicciones entre documentos', Componente: ConflictosModulo },
  { id: 'ecg', n: 'Electrocardiogramas', Componente: EcgModulo },
  { id: 'ante', n: 'Antecedentes', Componente: AntecedentesModulo },
  { id: 'riesgo', n: 'Riesgo quirúrgico', Componente: RiesgoModulo },
  { id: 'tend', n: 'Tendencias', Componente: TendenciasModulo },
  { id: 'patro', n: 'Patrones y literatura', Componente: PatronesModulo },
  { id: 'pub', n: 'Material que podría publicarse', Componente: PublicarModulo },
  { id: 'prep', n: 'Preparar publicación', Componente: PrepararModulo },
];

export const MODULO_POR_ID = new Map(MODULOS.map((m) => [m.id, m]));
