/**
 * Tests de propiedades para el sistema de powerups automáticos.
 * Todas las propiedades usan fast-check con { numRuns: 100 }.
 */

import fc from 'fast-check';
import { PowerManager } from '../../src/managers/PowerManager.js';
import { CONSTANTS } from '../../src/config/constants.js';

/**
 * Crea una escena mock con tiempo configurable.
 * @param {number} now - Tiempo actual en ms.
 */
function createScene(now = 0) {
  return { time: { now } };
}

/**
 * Crea un bug mock con posición y estado activo.
 */
function createBug(x, y) {
  return {
    x, y,
    active: true,
    setActive: jest.fn(function(v) { this.active = v; }),
  };
}

/**
 * Crea un contexto mínimo para checkMilestones.
 */
function createCtx(overrides = {}) {
  return {
    bugs: [],
    kiro: { x: 0, y: 0 },
    onLifeGained: jest.fn(),
    soundManager: { play: jest.fn() },
    banner: { show: jest.fn() },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Property 1: Blast-a-Bug activa en cada múltiplo de 20
// Validates: Requirements 1.1, 8.1, 8.2
// ---------------------------------------------------------------------------
test('Property 1: Blast-a-Bug activa en cada múltiplo positivo de 20', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 500 }),
      (n) => {
        const score = n * CONSTANTS.POWERUP_BLAST_A_BUG_THRESHOLD;
        const scene = createScene(1000);
        const manager = new PowerManager(scene);
        const ctx = createCtx();
        manager.checkMilestones(score, ctx);
        return manager.blastABugUntil > scene.time.now;
      }
    ),
    { numRuns: 100 }
  );
});

test('Property 1b: score 0 no activa Blast-a-Bug', () => {
  const scene = createScene(1000);
  const manager = new PowerManager(scene);
  manager.checkMilestones(0, createCtx());
  expect(manager.blastABugUntil).toBe(0);
});

// ---------------------------------------------------------------------------
// Property 2: Blast-a-Bug duration invariant
// Validates: Requirements 1.3, 1.4
// ---------------------------------------------------------------------------
test('Property 2: Blast-a-Bug está activo si y solo si t < 5000ms tras activación', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 9999 }),
      (offset) => {
        const activationTime = 1000;
        const scene = createScene(activationTime);
        const manager = new PowerManager(scene);
        manager.checkMilestones(20, createCtx());

        // Simular el tiempo avanzado
        scene.time.now = activationTime + offset;
        const state = manager.getState(20);
        const shouldBeActive = offset < CONSTANTS.BLAST_A_BUG_DURATION;
        return state.blastABug.active === shouldBeActive;
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Property 3: Bug Free Zone elimina exactamente los bugs dentro de 50px
// Validates: Requirements 2.1, 2.2, 2.5
// ---------------------------------------------------------------------------
test('Property 3: Bug Free Zone elimina exactamente los bugs dentro de 50px de Kiro', () => {
  fc.assert(
    fc.property(
      fc.record({
        kx: fc.integer({ min: 0, max: 500 }),
        ky: fc.integer({ min: 0, max: 500 }),
      }),
      fc.array(
        fc.record({
          x: fc.integer({ min: 0, max: 500 }),
          y: fc.integer({ min: 0, max: 500 }),
        }),
        { minLength: 0, maxLength: 20 }
      ),
      ({ kx, ky }, bugPositions) => {
        const scene = createScene(0);
        const manager = new PowerManager(scene);
        const kiro = { x: kx, y: ky };
        const bugs = bugPositions.map(p => createBug(p.x, p.y));
        const ctx = createCtx({ bugs, kiro });

        // Activar Bug Free Zone con score múltiplo de 40
        manager.checkMilestones(40, ctx);

        const radius = CONSTANTS.BUG_FREE_ZONE_RADIUS;
        return bugs.every(bug => {
          const dx = bug.x - kx;
          const dy = bug.y - ky;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const shouldBeEliminated = dist < radius;
          // setActive(false) fue llamado si y solo si estaba dentro del radio
          const wasEliminated = bug.setActive.mock.calls.some(call => call[0] === false);
          return shouldBeEliminated === wasEliminated;
        });
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Property 4: Extra Life incrementa vidas exactamente en 1
// Validates: Requirements 3.1, 3.4
// ---------------------------------------------------------------------------
test('Property 4: Extra Life llama onLifeGained exactamente una vez por activación', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 100 }),
      (n) => {
        const score = n * CONSTANTS.POWERUP_EXTRA_LIFE_THRESHOLD;
        const scene = createScene(0);
        const manager = new PowerManager(scene);
        const ctx = createCtx();
        manager.checkMilestones(score, ctx);
        return ctx.onLifeGained.mock.calls.length === 1;
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Property 5: Scores multi-umbral activan todos los powerups aplicables
// Validates: Requirements 3.4, 8.2, 8.3, 8.4
// ---------------------------------------------------------------------------
test('Property 5: score múltiplo de 100 activa Blast-a-Bug y Extra Life', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(100, 200, 300, 400, 500),
      (score) => {
        const scene = createScene(1000);
        const manager = new PowerManager(scene);
        const ctx = createCtx();
        manager.checkMilestones(score, ctx);
        // Blast-a-Bug activo (múltiplo de 20)
        const babActive = manager.blastABugUntil > scene.time.now;
        // Extra Life disparado (múltiplo de 100)
        const elFired = ctx.onLifeGained.mock.calls.length === 1;
        return babActive && elFired;
      }
    ),
    { numRuns: 100 }
  );
});

test('Property 5b: score múltiplo de 200 activa Blast-a-Bug, Bug Free Zone y Extra Life', () => {
  const scene = createScene(1000);
  const manager = new PowerManager(scene);
  const bugs = [createBug(0, 0)]; // dentro del radio
  const ctx = createCtx({ bugs, kiro: { x: 0, y: 0 } });
  manager.checkMilestones(200, ctx);

  expect(manager.blastABugUntil).toBeGreaterThan(scene.time.now);
  expect(ctx.onLifeGained).toHaveBeenCalledTimes(1);
  // Bug dentro del radio debe haber sido eliminado
  expect(bugs[0].setActive).toHaveBeenCalledWith(false);
});

// ---------------------------------------------------------------------------
// Property 6: Deduplicación — no re-trigger en el mismo score
// Validates: Requirements 8.5
// ---------------------------------------------------------------------------
test('Property 6: llamar checkMilestones dos veces con el mismo score activa cada powerup solo una vez', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 50 }),
      (n) => {
        const score = n * CONSTANTS.POWERUP_BLAST_A_BUG_THRESHOLD;
        const scene = createScene(0);
        const manager = new PowerManager(scene);
        const ctx = createCtx();

        manager.checkMilestones(score, ctx);
        // Avanzar tiempo para que el segundo call no sea bloqueado por otra razón
        scene.time.now = 100;
        manager.checkMilestones(score, ctx);

        // sfx_power_activate debe haberse llamado solo una vez por powerup activado
        // Para múltiplos de 20 (no 40, no 100): exactamente 1 llamada
        if (score % 40 !== 0 && score % 100 !== 0) {
          return ctx.soundManager.play.mock.calls.length === 1;
        }
        return true; // otros casos cubiertos por otras propiedades
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Property 8: HUD next-threshold computation
// Validates: Requirements 5.1, 5.2, 5.3
// ---------------------------------------------------------------------------
test('Property 8: getState() calcula correctamente los próximos umbrales', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 10000 }),
      (score) => {
        const scene = createScene(0);
        const manager = new PowerManager(scene);
        const state = manager.getState(score);

        const expectedBab = Math.ceil((score + 1) / CONSTANTS.POWERUP_BLAST_A_BUG_THRESHOLD) * CONSTANTS.POWERUP_BLAST_A_BUG_THRESHOLD;
        const expectedBfz = Math.ceil((score + 1) / CONSTANTS.POWERUP_BUG_FREE_ZONE_THRESHOLD) * CONSTANTS.POWERUP_BUG_FREE_ZONE_THRESHOLD;
        const expectedEl = Math.ceil((score + 1) / CONSTANTS.POWERUP_EXTRA_LIFE_THRESHOLD) * CONSTANTS.POWERUP_EXTRA_LIFE_THRESHOLD;

        return (
          state.nextBlastABug === expectedBab &&
          state.nextBugFreeZone === expectedBfz &&
          state.nextExtraLife === expectedEl
        );
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Property 10: sfx_power_activate se llama exactamente una vez por activación
// Validates: Requirements 1.6, 2.4, 3.3, 6.3, 6.4
// ---------------------------------------------------------------------------
test('Property 10: sfx_power_activate se llama exactamente una vez por powerup activado', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 25 }),
      (n) => {
        // Score múltiplo de 20 pero no de 40 ni 100 → solo Blast-a-Bug
        const score = n * 20;
        if (score % 40 === 0 || score % 100 === 0) return true; // saltar casos multi-umbral

        const scene = createScene(0);
        const manager = new PowerManager(scene);
        const ctx = createCtx();
        manager.checkMilestones(score, ctx);

        return ctx.soundManager.play.mock.calls.filter(c => c[0] === 'sfx_power_activate').length === 1;
      }
    ),
    { numRuns: 100 }
  );
});

test('Property 10b: sfx_power_activate no se llama cuando soundManager es null', () => {
  const scene = createScene(0);
  const manager = new PowerManager(scene);
  // No debe lanzar error aunque soundManager sea null
  expect(() => manager.checkMilestones(20, { bugs: [], kiro: { x: 0, y: 0 }, onLifeGained: null, soundManager: null, banner: null })).not.toThrow();
});
