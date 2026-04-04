/**
 * Tests de propiedades y unitarios para PowerManager.
 */

import fc from 'fast-check';
import { PowerManager } from '../../src/managers/PowerManager.js';
import { CONSTANTS } from '../../src/config/constants.js';

function createMockScene(now = 0) {
  return { time: { now } };
}

function createMockBug(x, y, vx = 0, vy = 0) {
  return {
    x, y,
    active: true,
    body: { velocity: { x: vx, y: vy } },
    setActive: jest.fn(),
  };
}

test('Property 8: Freeze establece la velocidad de todos los bugs a cero', () => {
  // Feature: bug-busters, Property 8: Freeze immobilizes all bugs
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          vx: fc.float({ min: -500, max: 500, noNaN: true }),
          vy: fc.float({ min: -500, max: 500, noNaN: true }),
        }),
        { minLength: 0, maxLength: 20 }
      ),
      (bugVelocities) => {
        const scene = createMockScene(0);
        const manager = new PowerManager(scene);
        manager.checkUnlocks(CONSTANTS.POWER_UNLOCK_FREEZE);
        const bugs = bugVelocities.map(({ vx, vy }) => createMockBug(100, 100, vx, vy));
        const activated = manager.activate('freeze', { x: 0, y: 0 }, bugs);
        if (!activated) return false;
        return bugs.every(bug => bug.body.velocity.x === 0 && bug.body.velocity.y === 0);
      }
    ),
    { numRuns: 100 }
  );
});

test('Property 9: Patch_Bomb elimina solo los bugs dentro del radio de 250px', () => {
  // Feature: bug-busters, Property 9: Patch_Bomb eliminates bugs within radius only
  fc.assert(
    fc.property(
      fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      }),
      fc.array(
        fc.record({
          x: fc.integer({ min: 0, max: 1000 }),
          y: fc.integer({ min: 0, max: 1000 }),
        }),
        { minLength: 1, maxLength: 20 }
      ),
      (kiroPos, bugPositions) => {
        const scene = createMockScene(0);
        const manager = new PowerManager(scene);
        manager.checkUnlocks(CONSTANTS.POWER_UNLOCK_PATCH_BOMB);
        const eliminated = new Set();
        const bugs = bugPositions.map(pos => createMockBug(pos.x, pos.y));
        manager.activate('patch_bomb', kiroPos, bugs, (bug) => { eliminated.add(bug); });
        return bugs.every(bug => {
          const dx = bug.x - kiroPos.x;
          const dy = bug.y - kiroPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return (dist < CONSTANTS.PATCH_BOMB_RADIUS) === eliminated.has(bug);
        });
      }
    ),
    { numRuns: 100 }
  );
});

test('checkUnlocks(149) no desbloquea freeze', () => {
  const manager = new PowerManager(createMockScene());
  manager.checkUnlocks(149);
  expect(manager.getState().freeze.unlocked).toBe(false);
});

test('checkUnlocks(150) desbloquea freeze', () => {
  const manager = new PowerManager(createMockScene());
  manager.checkUnlocks(150);
  expect(manager.getState().freeze.unlocked).toBe(true);
});

test('checkUnlocks(300) desbloquea patch_bomb', () => {
  const manager = new PowerManager(createMockScene());
  manager.checkUnlocks(300);
  expect(manager.getState().patch_bomb.unlocked).toBe(true);
});

test('activate("freeze") retorna false cuando freeze no está desbloqueado', () => {
  const manager = new PowerManager(createMockScene());
  expect(manager.activate('freeze', { x: 0, y: 0 }, [])).toBe(false);
});

test('activate("freeze") retorna true cuando está desbloqueado y no en cooldown', () => {
  const manager = new PowerManager(createMockScene(0));
  manager.checkUnlocks(150);
  expect(manager.activate('freeze', { x: 0, y: 0 }, [])).toBe(true);
});

test('activate("freeze") retorna false cuando está en cooldown', () => {
  const scene = createMockScene(0);
  const manager = new PowerManager(scene);
  manager.checkUnlocks(150);
  manager.activate('freeze', { x: 0, y: 0 }, []);
  scene.time.now = 1000;
  expect(manager.activate('freeze', { x: 0, y: 0 }, [])).toBe(false);
});

test('getState() retorna remainingCooldown correcto en segundos', () => {
  const scene = createMockScene(0);
  const manager = new PowerManager(scene);
  manager.checkUnlocks(150);
  manager.activate('freeze', { x: 0, y: 0 }, []);
  scene.time.now = 5000;
  const state = manager.getState();
  expect(state.freeze.onCooldown).toBe(true);
  expect(state.freeze.remainingCooldown).toBe(10);
});
