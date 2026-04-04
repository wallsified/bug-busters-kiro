/**
 * Tests unitarios y de propiedades para la entidad Wanderer.
 * Verifica que el intervalo de cambio de dirección esté dentro de los límites,
 * la dirección inicial, el valor en puntos y el comportamiento del update().
 */

import fc from 'fast-check';
import { Wanderer } from '../../src/entities/Wanderer.js';
import { CONSTANTS } from '../../src/config/constants.js';

function createMockScene(now = 0) {
  return {
    time: { now },
    add: { existing: jest.fn() },
    physics: { add: { existing: jest.fn() } },
  };
}

test('Property 1: _dirChangeInterval siempre está dentro de [WANDERER_DIR_CHANGE_MIN, WANDERER_DIR_CHANGE_MAX]', () => {
  // Feature: bug-busters, Property 1: Wanderer direction-change interval is within bounds
  fc.assert(
    fc.property(fc.constant(null), () => {
      const scene = createMockScene(0);
      const wanderer = new Wanderer(scene, 0, 0);
      return (
        wanderer._dirChangeInterval >= CONSTANTS.WANDERER_DIR_CHANGE_MIN &&
        wanderer._dirChangeInterval <= CONSTANTS.WANDERER_DIR_CHANGE_MAX
      );
    }),
    { numRuns: 100 }
  );
});

test('Property 1b: _pickNewDirection() siempre produce intervalos dentro de los límites', () => {
  // Feature: bug-busters, Property 1: Wanderer direction-change interval is within bounds
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 20 }), (callCount) => {
      const scene = createMockScene(0);
      const wanderer = new Wanderer(scene, 0, 0);
      for (let i = 0; i < callCount; i++) {
        wanderer._pickNewDirection();
        if (
          wanderer._dirChangeInterval < CONSTANTS.WANDERER_DIR_CHANGE_MIN ||
          wanderer._dirChangeInterval > CONSTANTS.WANDERER_DIR_CHANGE_MAX
        ) {
          return false;
        }
      }
      return true;
    }),
    { numRuns: 100 }
  );
});

test('Wanderer se inicializa con una dirección válida (velocidad no-cero en exactamente un eje)', () => {
  const scene = createMockScene(0);
  const wanderer = new Wanderer(scene, 0, 0);
  const xNonZero = wanderer.body.velocity.x !== 0;
  const yNonZero = wanderer.body.velocity.y !== 0;
  expect(xNonZero !== yNonZero).toBe(true);
});

test('pointValue retorna 10', () => {
  const scene = createMockScene(0);
  const wanderer = new Wanderer(scene, 0, 0);
  expect(wanderer.pointValue).toBe(10);
});

test('update() dispara un cambio de dirección cuando el tiempo supera _nextDirectionChange', () => {
  const scene = createMockScene(0);
  const wanderer = new Wanderer(scene, 0, 0);

  scene.time.now = wanderer._nextDirectionChange + 1;
  wanderer.update();

  expect(wanderer._nextDirectionChange).toBeGreaterThan(scene.time.now - 1);
  expect(wanderer._dirChangeInterval).toBeGreaterThanOrEqual(CONSTANTS.WANDERER_DIR_CHANGE_MIN);
  expect(wanderer._dirChangeInterval).toBeLessThanOrEqual(CONSTANTS.WANDERER_DIR_CHANGE_MAX);
});
