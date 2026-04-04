/**
 * Tests unitarios y de propiedades para la entidad Replicator.
 */

import fc from 'fast-check';
import { Replicator } from '../../src/entities/Replicator.js';
import { CONSTANTS } from '../../src/config/constants.js';

function createMockScene(now = 0) {
  return {
    time: { now },
    add: { existing: jest.fn() },
    physics: { add: { existing: jest.fn() } },
  };
}

test('Property 2: spawnCount nunca supera REPLICATOR_MAX_SPAWNS para cualquier número de updates', () => {
  // Feature: bug-busters, Property 2: Replicator spawn cap
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 100 }), (updateCount) => {
      const scene = createMockScene(0);
      const replicator = new Replicator(scene, 0, 0);
      for (let i = 0; i < updateCount; i++) {
        scene.time.now = i * CONSTANTS.REPLICATOR_SPAWN_INTERVAL;
        replicator.update(scene);
      }
      return replicator.spawnCount <= CONSTANTS.REPLICATOR_MAX_SPAWNS;
    }),
    { numRuns: 100 }
  );
});

test('pointValue retorna 30', () => {
  const scene = createMockScene(0);
  const replicator = new Replicator(scene, 0, 0);
  expect(replicator.pointValue).toBe(30);
});

test('spawnCount empieza en 0', () => {
  const scene = createMockScene(0);
  const replicator = new Replicator(scene, 0, 0);
  expect(replicator.spawnCount).toBe(0);
});

test('Después del primer update (time=0), spawnCount es 1', () => {
  const scene = createMockScene(0);
  const replicator = new Replicator(scene, 0, 0);
  replicator.update(scene);
  expect(replicator.spawnCount).toBe(1);
});

test('Después de 3 intervalos de spawn, spawnCount es 3', () => {
  const scene = createMockScene(0);
  const replicator = new Replicator(scene, 0, 0);
  for (let i = 0; i < 3; i++) {
    scene.time.now = i * CONSTANTS.REPLICATOR_SPAWN_INTERVAL;
    replicator.update(scene);
  }
  expect(replicator.spawnCount).toBe(3);
});

test('Después de 4 intervalos de spawn, spawnCount sigue siendo 3 (cap)', () => {
  const scene = createMockScene(0);
  const replicator = new Replicator(scene, 0, 0);
  for (let i = 0; i < 4; i++) {
    scene.time.now = i * CONSTANTS.REPLICATOR_SPAWN_INTERVAL;
    replicator.update(scene);
  }
  expect(replicator.spawnCount).toBe(3);
});

test('onSpawn callback es invocado al generar un Wanderer', () => {
  const scene = createMockScene(0);
  const onSpawn = jest.fn();
  const replicator = new Replicator(scene, 10, 20, onSpawn);
  replicator.update(scene);
  expect(onSpawn).toHaveBeenCalledTimes(1);
  expect(onSpawn).toHaveBeenCalledWith(10, 20);
});
