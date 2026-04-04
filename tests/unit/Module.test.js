/**
 * Tests unitarios y de propiedades para la entidad Module.
 */

import fc from 'fast-check';
import { Module } from '../../src/entities/Module.js';

function createMockScene() {
  return {
    add: { existing: jest.fn() },
    physics: { add: { existing: jest.fn() } },
  };
}

test('Module se inicializa con la integridad correcta', () => {
  const module = new Module(null, 0, 0, 5);
  expect(module.integrity).toBe(5);
});

test('Module se inicializa con integridad por defecto de 3', () => {
  const module = new Module(null, 0, 0);
  expect(module.integrity).toBe(3);
});

test('hit() reduce la integridad en 1', () => {
  const module = new Module(null, 0, 0, 3);
  module.hit();
  expect(module.integrity).toBe(2);
});

test('hit() cuando la integridad es 1 invoca el callback onDestroyed', () => {
  const onDestroyed = jest.fn();
  const module = new Module(null, 0, 0, 1, onDestroyed);
  module.hit();
  expect(onDestroyed).toHaveBeenCalledTimes(1);
});

test('onDestroyed NO se llama cuando la integridad es mayor que 1 después de hit()', () => {
  const onDestroyed = jest.fn();
  const module = new Module(null, 0, 0, 3, onDestroyed);
  module.hit();
  expect(onDestroyed).not.toHaveBeenCalled();
});

test('Property 4: hit() siempre reduce la integridad en exactamente 1', () => {
  // Feature: bug-busters, Property 4: Bug-Module collision reduces integrity by exactly one
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 100 }),
      (initialIntegrity) => {
        const module = new Module(null, 0, 0, initialIntegrity);
        const before = module.integrity;
        module.hit();
        const after = module.integrity;
        return after === before - 1;
      }
    ),
    { numRuns: 100 }
  );
});
