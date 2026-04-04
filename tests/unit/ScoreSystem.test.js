/**
 * Tests de propiedades y unitarios para ScoreSystem.
 */

import fc from 'fast-check';
import { ScoreSystem } from '../../src/managers/ScoreSystem.js';
import { CONSTANTS } from '../../src/config/constants.js';

test('getScore() inicia en 0', () => {
  const system = new ScoreSystem();
  expect(system.getScore()).toBe(0);
});

test('addPoints(10) incrementa el score en 10', () => {
  const system = new ScoreSystem();
  system.addPoints(10);
  expect(system.getScore()).toBe(10);
});

test('addPoints llamado múltiples veces acumula correctamente', () => {
  const system = new ScoreSystem();
  system.addPoints(10);
  system.addPoints(20);
  system.addPoints(30);
  expect(system.getScore()).toBe(60);
});

test('reset() reinicia el score a 0', () => {
  const system = new ScoreSystem();
  system.addPoints(100);
  system.reset();
  expect(system.getScore()).toBe(0);
});

test('onScoreChange callback es invocado con el nuevo score', () => {
  const callback = jest.fn();
  const system = new ScoreSystem(callback);
  system.addPoints(20);
  expect(callback).toHaveBeenCalledWith(20);
});

test('getLevelEnemyCounts(1) retorna los conteos correctos', () => {
  const counts = ScoreSystem.getLevelEnemyCounts(1);
  expect(counts).toEqual({ wanderers: 3, seekers: 1, replicators: 0 });
});

test('Property 5: Escalada de enemigos entre niveles consecutivos', () => {
  // Feature: bug-busters, Property 5: Enemy escalation across levels
  fc.assert(
    fc.property(
      fc.constantFrom([1, 2], [2, 3]),
      ([earlier, later]) => {
        const prev = ScoreSystem.getLevelEnemyCounts(earlier);
        const next = ScoreSystem.getLevelEnemyCounts(later);
        const seekersOk = next.seekers >= prev.seekers;
        const replicatorsOk = next.replicators >= prev.replicators;
        const atLeastOneStrictlyGreater =
          next.seekers > prev.seekers || next.replicators > prev.replicators;
        return seekersOk && replicatorsOk && atLeastOneStrictlyGreater;
      }
    ),
    { numRuns: 100 }
  );
});

test('Property 6: El incremento de score coincide con el valor del bug eliminado', () => {
  // Feature: bug-busters, Property 6: Score increment matches bug point value
  fc.assert(
    fc.property(
      fc.constantFrom(
        CONSTANTS.POINTS_WANDERER,
        CONSTANTS.POINTS_SEEKER,
        CONSTANTS.POINTS_REPLICATOR
      ),
      (pointValue) => {
        const system = new ScoreSystem();
        const before = system.getScore();
        system.addPoints(pointValue);
        return system.getScore() === before + pointValue;
      }
    ),
    { numRuns: 100 }
  );
});
