/**
 * Tests unitarios y de propiedades para ProjectileGroup.
 * Verifica el límite de proyectiles activos y el comportamiento de disparo por dirección.
 */

import fc from 'fast-check';
import { ProjectileGroup } from '../../src/entities/ProjectileGroup.js';
import { CONSTANTS } from '../../src/config/constants.js';

test('fire() con 0 activos: crea 1 proyectil activo', () => {
  const group = new ProjectileGroup(null);
  group.fire(0, 0, 'right');
  const active = group.getChildren().filter(p => p.active);
  expect(active.length).toBe(1);
});

test('fire() 3 veces: crea exactamente 3 proyectiles activos', () => {
  const group = new ProjectileGroup(null);
  group.fire(0, 0, 'right');
  group.fire(0, 0, 'right');
  group.fire(0, 0, 'right');
  const active = group.getChildren().filter(p => p.active);
  expect(active.length).toBe(3);
});

test('fire() 4ta vez: sigue habiendo solo 3 proyectiles activos (no-op)', () => {
  const group = new ProjectileGroup(null);
  group.fire(0, 0, 'right');
  group.fire(0, 0, 'right');
  group.fire(0, 0, 'right');
  group.fire(0, 0, 'right');
  const active = group.getChildren().filter(p => p.active);
  expect(active.length).toBe(3);
});

test('fire() con dirección "up": el proyectil tiene velocidad Y negativa', () => {
  const group = new ProjectileGroup(null);
  group.fire(0, 0, 'up');
  const projectile = group.getChildren()[0];
  expect(projectile.body.velocity.y).toBe(-CONSTANTS.PROJECTILE_SPEED);
  expect(projectile.body.velocity.x).toBe(0);
});

test('fire() con dirección "right": el proyectil tiene velocidad X positiva', () => {
  const group = new ProjectileGroup(null);
  group.fire(0, 0, 'right');
  const projectile = group.getChildren()[0];
  expect(projectile.body.velocity.x).toBe(CONSTANTS.PROJECTILE_SPEED);
  expect(projectile.body.velocity.y).toBe(0);
});

test('Property 7: el conteo de proyectiles activos nunca supera 3', () => {
  // Feature: bug-busters, Property 7: Active projectile count never exceeds 3
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 50 }),
      (fireCount) => {
        const group = new ProjectileGroup(null);
        for (let i = 0; i < fireCount; i++) {
          group.fire(0, 0, 'right');
        }
        const activeCount = group.getChildren().filter(p => p.active).length;
        return activeCount <= 3;
      }
    ),
    { numRuns: 100 }
  );
});
