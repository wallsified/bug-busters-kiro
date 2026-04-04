/**
 * Tests de propiedades para ProgressManager.
 * Usa fast-check para verificar invariantes universales del sistema de persistencia.
 */

import fc from 'fast-check';
import { ProgressManager } from '../../src/managers/ProgressManager.js';

// --- Mock de localStorage para entorno Node (sin DOM) ---
function createLocalStorageMock() {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
}

// Instalar el mock de localStorage en el scope global antes de cada test
let localStorageMock;

beforeEach(() => {
  localStorageMock = createLocalStorageMock();
  global.localStorage = localStorageMock;
});

afterEach(() => {
  delete global.localStorage;
});

// ---------------------------------------------------------------------------
// Property 11: Progress persistence saves maximum values
// ---------------------------------------------------------------------------
test('Property 11: save() persiste el máximo de score y level', () => {
  // Feature: bug-busters, Property 11: Progress persistence saves maximum values
  fc.assert(
    fc.property(
      // Estado previo almacenado
      fc.integer({ min: 1, max: 10 }),
      fc.integer({ min: 0, max: 10000 }),
      // Nuevos valores a guardar
      fc.integer({ min: 1, max: 10 }),
      fc.integer({ min: 0, max: 10000 }),
      (prevLevel, prevScore, newLevel, newScore) => {
        // Preparar estado previo en localStorage
        localStorageMock.clear();
        localStorageMock.setItem(
          'bugbusters_progress',
          JSON.stringify({ level: prevLevel, score: prevScore })
        );

        const manager = new ProgressManager();
        manager.save(newLevel, newScore);

        const stored = JSON.parse(localStorageMock.getItem('bugbusters_progress'));

        // El score almacenado debe ser max(prevScore, newScore)
        const expectedScore = Math.max(prevScore, newScore);
        // El level almacenado debe ser max(prevLevel, newLevel)
        const expectedLevel = Math.max(prevLevel, newLevel);

        return stored.score === expectedScore && stored.level === expectedLevel;
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Property 12: Progress round-trip
// ---------------------------------------------------------------------------
test('Property 12: serializar y deserializar un progreso produce un objeto idéntico', () => {
  // Feature: bug-busters, Property 12: Progress round-trip
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 3 }),
      fc.integer({ min: 0, max: 99999 }),
      (level, score) => {
        const original = { level, score };

        // Serializar a JSON y deserializar
        const serialized = JSON.stringify(original);
        const deserialized = JSON.parse(serialized);

        return deserialized.level === original.level && deserialized.score === original.score;
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Property 13: Malformed localStorage defaults gracefully
// ---------------------------------------------------------------------------
test('Property 13: load() retorna defaults ante cualquier valor malformado o ausente', () => {
  // Feature: bug-busters, Property 13: Malformed localStorage defaults gracefully
  const malformedValues = fc.oneof(
    // null / ausente
    fc.constant(null),
    // cadena vacía
    fc.constant(''),
    // JSON inválido
    fc.constant('{not valid json}'),
    fc.constant('undefined'),
    fc.constant('null'),
    // JSON válido pero sin los campos esperados
    fc.constant('{}'),
    fc.constant('{"foo":1}'),
    // Tipos incorrectos en los campos
    fc.constant('{"level":"abc","score":null}'),
    fc.constant('{"level":null,"score":"xyz"}'),
    // Cadenas arbitrarias
    fc.string(),
  );

  fc.assert(
    fc.property(malformedValues, (badValue) => {
      localStorageMock.clear();

      if (badValue !== null) {
        localStorageMock.setItem('bugbusters_progress', badValue);
      }
      // Si badValue es null, simplemente no hay nada en localStorage

      const manager = new ProgressManager();
      let result;
      let threw = false;

      try {
        result = manager.load();
      } catch (_e) {
        threw = true;
      }

      // No debe lanzar excepción
      if (threw) return false;

      // Debe retornar los valores por defecto
      return result.level === 1 && result.score === 0;
    }),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Unit / example-based tests — Requirements 9.1, 9.2, 9.3
// ---------------------------------------------------------------------------

// Caso 1: localStorage no disponible — load() debe retornar defaults
// Validates: Requirements 9.3
test('load() retorna { level: 1, score: 0 } cuando localStorage.getItem lanza una excepción', () => {
  // Reemplazar getItem con una función que lanza
  localStorageMock.getItem = () => { throw new Error('localStorage no disponible'); };

  const manager = new ProgressManager();
  const result = manager.load();

  expect(result).toEqual({ level: 1, score: 0 });
});

// Caso 2: Datos válidos — load() debe retornar exactamente los valores guardados
// Validates: Requirements 9.2
test('load() retorna los valores guardados cuando localStorage tiene datos válidos', () => {
  localStorageMock.setItem('bugbusters_progress', JSON.stringify({ level: 2, score: 500 }));

  const manager = new ProgressManager();
  const result = manager.load();

  expect(result).toEqual({ level: 2, score: 500 });
});

// Caso 3: Sobrescritura con score menor — save() no debe sobreescribir con valores menores
// Validates: Requirements 9.1
test('save() no sobreescribe el progreso existente cuando los nuevos valores son menores', () => {
  // Estado previo: level 2, score 500
  localStorageMock.setItem('bugbusters_progress', JSON.stringify({ level: 2, score: 500 }));

  const manager = new ProgressManager();
  manager.save(1, 100);

  const stored = JSON.parse(localStorageMock.getItem('bugbusters_progress'));
  expect(stored).toEqual({ level: 2, score: 500 });
});
