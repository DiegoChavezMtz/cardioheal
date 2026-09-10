// Reglas de dependencia de la arquitectura por features.
// Importar en eslint.config.mjs: `import boundaries from './eslint-boundaries.mjs'` y hacer spread.
import boundaries from 'eslint-plugin-boundaries';

const boundariesConfig = [
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*'],
      // 'feature-index' va antes que 'feature': el matching es por primer
      // patrón que aplica, y src/features/*/** también matchea index.ts.
      // Con el orden original (feature antes de feature-index) todo index.ts
      // se clasificaba como 'feature' a secas, rompiendo el chequeo de la
      // regla 6 (solo se entra a una feature por su index.ts).
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'feature-index', pattern: 'src/features/*/index.ts', capture: ['name'], mode: 'file' },
        { type: 'feature', pattern: 'src/features/*/**', capture: ['name'] },
        { type: 'shared-services', pattern: 'src/services/**' },
        { type: 'shared', pattern: 'src/(components|hooks|utils|context|types|lib|styles)/**' },
      ],
    },
    rules: {
      // Regla 2 y 3: features no se importan entre sí; shared no importa features.
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          // app solo importa la API pública de features y lo compartido
          { from: 'app', allow: ['feature-index', 'shared', 'shared-services'] },
          // una feature solo se importa a sí misma y lo compartido
          { from: 'feature', allow: [['feature', { name: '${from.name}' }], 'shared', 'shared-services'] },
          { from: 'feature-index', allow: [['feature', { name: '${from.name}' }]] },
          { from: 'shared', allow: ['shared', 'shared-services'] },
          { from: 'shared-services', allow: ['shared', 'shared-services'] },
        ],
      }],
      // Regla 6 (nadie entra a una feature salvo por su index.ts) queda
      // cubierta arriba, no por 'boundaries/entry-point': esa regla está
      // deprecada en v7 y, además, no distingue "importar desde dentro de la
      // misma feature" de "importar desde fuera" — bloqueaba también los
      // imports internos legítimos como PaymentsList.tsx -> ../../services.
      // 'boundaries/element-types' ya la cubre sola: 'app' y cualquier otra
      // feature solo pueden alcanzar el tipo 'feature-index' (el index.ts),
      // nunca 'feature' a secas; una feature solo alcanza 'feature' cuando
      // el nombre capturado coincide consigo misma (import interno).
    },
  },
  // Regla 5: solo services/ puede usar fetch directamente; el resto usa el service.
  // src/lib/ se agrega a la excepción: ahí vive la config de infraestructura
  // de terceros (Supabase, MiniMax) y, sin SDK oficial de MiniMax, su cliente
  // es un wrapper de fetch hecho a mano — el mismo rol que ya cumple
  // src/services/http.ts, solo que fuera de services/ por convención de lib/.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/services/**', 'src/features/*/services/**', 'src/lib/**'],
    rules: {
      'no-restricted-globals': ['error', {
        name: 'fetch',
        message: 'No llames fetch fuera de services/. Usa el service correspondiente o agrega un método a http.ts.',
      }],
    },
  },
  // Regla 1 y 4: nada de estado en app/, nada de React en utils/services.
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          { name: 'react', importNames: ['useState', 'useEffect', 'useReducer', 'useContext'], message: 'app/ solo enruta. Mueve el estado a una feature.' },
        ],
      }],
    },
  },
  {
    files: ['src/**/utils/**/*.ts', 'src/**/services/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'react', message: 'utils/ y services/ son puros: sin React.' }],
      }],
    },
  },
];

export default boundariesConfig;
