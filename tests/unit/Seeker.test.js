/**
 * Tests unitarios para la entidad Seeker.
 */

import fc from 'fast-check';
import { Seeker } from '../../src/entities/Seeker.js';
import { CONSTANTS } from '../../src/config/constants.js';

function createMockScene(now = 0) {
  return {
    time: { now },
    add: { existing: jest.fn() },
    physics: { add: { existing: jest.fn() } },
  };
}

test('pointValue retorna 20', () => {
  const scene = createMockScene(0);
  const seeker = new Seeker(scene, 0, 0);
  expect(seeker.pointValue).toBe(20);
});

test('update() calcula la dirección correcta hacia Kiro en el primer frame', () => {
  const scene = createMockScene(0);
  const seeker = new Seeker(scene, 0, 0);
  seeker.update(100, 0);
  expect(seeker.body.velocity.x).toBeCloseTo(100);
  expect(seeker.body.velocity.y).toBeCloseTo(0);
});

test('update() normaliza la velocidad correctamente en diagonal', () => {
  const scene = createMockScene(0);
  const seeker = new Seeker(scene, 0, 0);
  seeker.update(3, 4);
  expect(seeker.body.velocity.x).toBeCloseTo(60);
  expect(seeker.body.velocity.y).toBeCloseTo(80);
});

test('update() no cambia la velocidad antes de que expire _nextRecalc', () => {
  const scene = createMockScene(0);
  const seeker = new Seeker(scene, 0, 0);
  seeker.update(100, 0);
  const vxAfterFirst = seeker.body.velocity.x;
  scene.time.now = CONSTANTS.SEEKER_RECALC_INTERVAL - 1;
  seeker.update(0, 100);
  expect(seeker.body.velocity.x).toBeCloseTo(vxAfterFirst);
});

test('update() recalcula la dirección cuando expira _nextRecalc', () => {
  const scene = createMockScene(0);
  const seeker = new Seeker(scene, 0, 0);
  seeker.update(100, 0);
  scene.time.now = CONSTANTS.SEEKER_RECALC_INTERVAL + 1;
  seeker.update(0, 100);
  expect(seeker.body.velocity.x).toBeCloseTo(0);
  expect(seeker.body.velocity.y).toBeCloseTo(100);
});

test('update() no modifica la velocidad si Kiro está en la misma posición (dist = 0)', () => {
  const scene = createMockScene(0);
  const seeker = new Seeker(scene, 50, 50);
  seeker.update(50, 50);
  expect(seeker.body.velocity.x).toBe(0);
  expect(seeker.body.velocity.y).toBe(0);
});

test('_nextRecalc se actualiza correctamente tras cada recálculo', () => {
  const scene = createMockScene(0);
  const seeker = new Seeker(scene, 0, 0);
  seeker.update(100, 0);
  expect(seeker._nextRecalc).toBe(CONSTANTS.SEEKER_RECALC_INTERVAL);
  scene.time.now = CONSTANTS.SEEKER_RECALC_INTERVAL;
  seeker.update(100, 0);
  expect(seeker._nextRecalc).toBe(CONSTANTS.SEEKER_RECALC_INTERVAL * 2);
});

test('Property: la velocidad resultante siempre tiene magnitud igual a ENEMY_SPEED cuando dist > 0', () => {
  fc.assert(
    fc.property(
      fc.float({ min: -500, max: 500, noNaN: true }),
      fc.float({ min: -500, max: 500, noNaN: true }),
      fc.float({ min: -500, max: 500, noNaN: true }),
      fc.float({ min: -500, max: 500, noNaN: true }),
      (sx, sy, kx, ky) => {
        const dx = kx - sx;
        const dy = ky - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return true;

        const scene = createMockScene(0);
        const seeker = new Seeker(scene, sx, sy);
        seeker.update(kx, ky);

        const speed = Math.sqrt(seeker.body.velocity.x ** 2 + seeker.body.velocity.y ** 2);
        return Math.abs(speed - 100) < 0.001;
      }
    ),
    { numRuns: 100 }
  );
});
