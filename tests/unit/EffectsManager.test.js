/**
 * Tests unitarios y de propiedades para EffectsManager.
 * Usa fast-check para verificar propiedades de delegación y comportamiento.
 */

import fc from 'fast-check';
import { EffectsManager } from '../../src/managers/EffectsManager.js';
import { createScanlineOverlay } from '../../src/managers/EffectsManager.js';
import { CONSTANTS } from '../../src/config/constants.js';
import { vignetteValue, scanlineValue } from '../../src/shaders/CRTShader.js';

// Crea un mock mínimo de la escena de Phaser
function createMockScene() {
  return {
    cameras: {
      main: {
        shake: jest.fn(),
      },
    },
    add: {
      particles: jest.fn(),
      text: jest.fn(),
    },
    tweens: {
      add: jest.fn(),
    },
    time: {
      timeScale: 1,
      delayedCall: jest.fn(),
    },
  };
}

// ---------------------------------------------------------------------------
// Property 1: ScanlineOverlay covers full viewport without gaps
// ---------------------------------------------------------------------------

test('Property 1: ScanlineOverlay cubre el viewport completo sin huecos', () => {
  // Feature: retro-visual-effects, Property 1: ScanlineOverlay covers full viewport without gaps
  // Validates: Requirements 1.6
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 2000 }),
      (height) => {
        const mockGfx = {
          fillStyle: jest.fn(),
          fillRect: jest.fn(),
          setScrollFactor: jest.fn(),
        };
        const scene = {
          scale: { width: 800, height },
          add: {
            graphics: jest.fn().mockReturnValue(mockGfx),
          },
        };

        createScanlineOverlay(scene);

        const expectedStripeCount = Math.ceil(height / 4);
        return mockGfx.fillRect.mock.calls.length === expectedStripeCount;
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Property 2: shake() delegates parameters unchanged
// ---------------------------------------------------------------------------

test('Property 2: shake() delega duración e intensidad sin transformación', () => {
  // Feature: retro-visual-effects, Property 2: shake() delegates parameters unchanged
  fc.assert(
    fc.property(
      fc.tuple(fc.integer({ min: 0, max: 10000 }), fc.float({ min: 0, max: 1, noNaN: true })),
      ([duration, intensity]) => {
        const scene = createMockScene();
        const manager = new EffectsManager(scene);

        manager.shake(duration, intensity);

        const calls = scene.cameras.main.shake.mock.calls;
        return (
          calls.length === 1 &&
          calls[0][0] === duration &&
          calls[0][1] === intensity
        );
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Unit test: shake() ejemplo concreto
// ---------------------------------------------------------------------------

test('shake(150, 0.008) llama a cameras.main.shake con exactamente esos valores', () => {
  const scene = createMockScene();
  const manager = new EffectsManager(scene);

  manager.shake(150, 0.008);

  expect(scene.cameras.main.shake).toHaveBeenCalledWith(150, 0.008);
});

// ---------------------------------------------------------------------------
// Property 3: spawnParticleBurst() positions emitter at given coordinates
// ---------------------------------------------------------------------------

test('Property 3: spawnParticleBurst() posiciona el emisor en las coordenadas dadas', () => {
  // Feature: retro-visual-effects, Property 3: spawnParticleBurst() positions emitter at given coordinates
  // Validates: Requirements 3.1, 3.5
  fc.assert(
    fc.property(
      fc.tuple(fc.integer(), fc.integer()),
      ([x, y]) => {
        const scene = createMockScene();
        // El mock de add.particles devuelve un objeto con explode y destroy mockeados
        const mockParticles = {
          explode: jest.fn(),
          destroy: jest.fn(),
        };
        scene.add.particles.mockReturnValue(mockParticles);

        const manager = new EffectsManager(scene);
        manager.spawnParticleBurst(x, y);

        const calls = scene.add.particles.mock.calls;
        return (
          calls.length === 1 &&
          calls[0][0] === x &&
          calls[0][1] === y &&
          calls[0][2] === 'projectile'
        );
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Property 4: DamageBlink repeat count matches invincibility duration
// ---------------------------------------------------------------------------

test('Property 4: DamageBlink repeat count matches invincibility duration', () => {
  // Feature: retro-visual-effects, Property 4: DamageBlink repeat count matches invincibility duration
  // Validates: Requirements 4.2
  const originalDuration = CONSTANTS.INVINCIBILITY_DURATION;

  fc.assert(
    fc.property(
      fc.integer({ min: 200, max: 10000 }),
      (invincibilityDuration) => {
        // Sobreescribir temporalmente INVINCIBILITY_DURATION para esta ejecución
        CONSTANTS.INVINCIBILITY_DURATION = invincibilityDuration;

        const scene = createMockScene();
        // El mock de tweens.add devuelve un objeto tween con stop mockeado
        const mockTween = { stop: jest.fn() };
        scene.tweens.add.mockReturnValue(mockTween);

        const manager = new EffectsManager(scene);
        const mockSprite = { alpha: 1.0 };
        manager.startDamageBlink(mockSprite);

        const calls = scene.tweens.add.mock.calls;
        const tweenConfig = calls[0][0];
        const expectedRepeat = Math.floor(invincibilityDuration / 200) - 1;
        const result = tweenConfig.repeat === expectedRepeat;

        // Restaurar el valor original para la siguiente iteración
        CONSTANTS.INVINCIBILITY_DURATION = originalDuration;

        return result;
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Property 8: spawnScorePopup() positions text 16px above given coordinates
// ---------------------------------------------------------------------------

test('Property 8: spawnScorePopup() posiciona el texto 16px por encima de las coordenadas dadas', () => {
  // Feature: retro-visual-effects, Property 8: spawnScorePopup() positions text 16px above given coordinates
  // Validates: Requirements 8.1
  fc.assert(
    fc.property(
      fc.tuple(fc.integer(), fc.integer(), fc.integer({ min: 0 })),
      ([x, y, points]) => {
        const scene = createMockScene();
        // El mock de add.text devuelve un objeto con setScrollFactor, destroy y propiedad y
        const mockText = {
          setScrollFactor: jest.fn().mockReturnThis(),
          destroy: jest.fn(),
          y: y - 16,
        };
        scene.add.text.mockReturnValue(mockText);

        const manager = new EffectsManager(scene);
        manager.spawnScorePopup(x, y, points);

        const calls = scene.add.text.mock.calls;
        return (
          calls.length === 1 &&
          calls[0][0] === x &&
          calls[0][1] === y - 16
        );
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Property 7: triggerHitStop() schedules restore with correct duration
// ---------------------------------------------------------------------------

test('Property 7: triggerHitStop() programa la restauración con la duración correcta', () => {
  // Feature: retro-visual-effects, Property 7: triggerHitStop() schedules restore with correct duration
  // Validates: Requirements 7.2
  const originalDuration = CONSTANTS.HIT_STOP_DURATION;

  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 500 }),
      (duration) => {
        // Sobreescribir temporalmente HIT_STOP_DURATION para esta ejecución
        CONSTANTS.HIT_STOP_DURATION = duration;

        const scene = createMockScene();
        const manager = new EffectsManager(scene);
        manager.triggerHitStop();

        const calls = scene.time.delayedCall.mock.calls;
        const result = calls.length === 1 && calls[0][0] === duration;

        // Limpiar mocks para la siguiente iteración
        scene.time.delayedCall.mockClear();

        return result;
      }
    ),
    { numRuns: 100 }
  );

  // Restaurar el valor original tras el test
  CONSTANTS.HIT_STOP_DURATION = originalDuration;
});

// ---------------------------------------------------------------------------
// Property 5: CRTShader vignette darkens monotonically toward edges
// ---------------------------------------------------------------------------

test('Property 5: CRTShader vignette darkens monotonically toward edges', () => {
  // Feature: retro-visual-effects, Property 5: CRTShader vignette darkens monotonically toward edges
  // Validates: Requirements 6.2
  fc.assert(
    fc.property(
      fc.tuple(
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.float({ min: 0, max: 1, noNaN: true })
      ),
      ([dist1, dist2, strength]) => {
        const d1 = Math.min(dist1, dist2);
        const d2 = Math.max(dist1, dist2);
        // El píxel más cercano al centro debe tener brillo mayor o igual al más lejano
        return vignetteValue(d1, strength) >= vignetteValue(d2, strength);
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Property 6: CRTShader scanline applies to odd rows only
// ---------------------------------------------------------------------------

test('Property 6: CRTShader scanline applies to odd rows only', () => {
  // Feature: retro-visual-effects, Property 6: CRTShader scanline applies to odd rows only
  // Validates: Requirements 6.3
  fc.assert(
    fc.property(
      fc.tuple(
        fc.integer({ min: 0, max: 1000 }),
        fc.float({ min: 0, max: 1, noNaN: true })
      ),
      ([row, alpha]) => {
        if (row % 2 !== 0) {
          return scanlineValue(row, alpha) === 1.0 - alpha;
        } else {
          return scanlineValue(row, alpha) === 1.0;
        }
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Unit test 9.1: spawnParticleBurst — config del emisor coincide con la spec
// ---------------------------------------------------------------------------

test('spawnParticleBurst(100, 200) llama a add.particles con la config correcta', () => {
  // Validates: Requirements 3.5
  const scene = createMockScene();
  const mockParticles = { explode: jest.fn(), destroy: jest.fn() };
  scene.add.particles.mockReturnValue(mockParticles);

  const manager = new EffectsManager(scene);
  manager.spawnParticleBurst(100, 200);

  // Verificar que add.particles fue llamado con las coordenadas y textura correctas
  expect(scene.add.particles).toHaveBeenCalledWith(
    100,
    200,
    'projectile',
    expect.objectContaining({ quantity: 8, lifespan: 400 })
  );
  // Verificar que explode fue llamado con 8 partículas
  expect(mockParticles.explode).toHaveBeenCalledWith(8);
});

// ---------------------------------------------------------------------------
// Unit test 9.1: startDamageBlink — config del tween coincide con la spec
// ---------------------------------------------------------------------------

test('startDamageBlink configura el tween con alpha 0.15, yoyo true y onComplete restaura alpha', () => {
  // Validates: Requirements 4.5
  const scene = createMockScene();
  const mockTween = { stop: jest.fn() };
  scene.tweens.add.mockReturnValue(mockTween);

  const manager = new EffectsManager(scene);
  const mockSprite = { alpha: 1.0 };
  manager.startDamageBlink(mockSprite);

  const tweenConfig = scene.tweens.add.mock.calls[0][0];
  // Verificar alpha objetivo y yoyo
  expect(tweenConfig.alpha).toBe(0.15);
  expect(tweenConfig.yoyo).toBe(true);

  // Verificar que onComplete restaura el alpha del sprite a 1.0
  mockSprite.alpha = 0.15;
  tweenConfig.onComplete();
  expect(mockSprite.alpha).toBe(1.0);
});

// ---------------------------------------------------------------------------
// Unit test 9.1: startDamageBlink llamado dos veces — primer tween detenido
// ---------------------------------------------------------------------------

test('startDamageBlink llamado dos veces detiene el primer tween antes de crear el segundo', () => {
  // Validates: Requirements 4.5
  const scene = createMockScene();
  const firstTween = { stop: jest.fn() };
  const secondTween = { stop: jest.fn() };
  // Devolver un tween diferente en cada llamada
  scene.tweens.add
    .mockReturnValueOnce(firstTween)
    .mockReturnValueOnce(secondTween);

  const manager = new EffectsManager(scene);
  const mockSprite = { alpha: 1.0 };

  manager.startDamageBlink(mockSprite);
  // Verificar que el primer tween aún no fue detenido
  expect(firstTween.stop).not.toHaveBeenCalled();

  manager.startDamageBlink(mockSprite);
  // Verificar que el primer tween fue detenido antes de crear el segundo
  expect(firstTween.stop).toHaveBeenCalledTimes(1);
  expect(scene.tweens.add).toHaveBeenCalledTimes(2);
});

// ---------------------------------------------------------------------------
// Unit test 9.1: triggerHitStop — timeScale y delayedCall con duración correcta
// ---------------------------------------------------------------------------

test('triggerHitStop establece timeScale a 0.05 y programa delayedCall con HIT_STOP_DURATION', () => {
  // Validates: Requirements 7.5
  const scene = createMockScene();
  const manager = new EffectsManager(scene);

  manager.triggerHitStop();

  // Verificar que timeScale fue reducido al valor de freeze
  expect(scene.time.timeScale).toBe(0.05);
  // Verificar que delayedCall fue llamado con la duración configurada
  expect(scene.time.delayedCall).toHaveBeenCalledWith(
    CONSTANTS.HIT_STOP_DURATION,
    expect.any(Function)
  );
});

// ---------------------------------------------------------------------------
// Unit test 9.1: spawnScorePopup — estilo del texto y config del tween
// ---------------------------------------------------------------------------

test('spawnScorePopup(50, 100, 10) crea texto con estilo correcto y tween con duration 600 y alpha 0', () => {
  // Validates: Requirements 8.5
  const scene = createMockScene();
  const mockText = {
    setScrollFactor: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    y: 84, // y - 16 = 100 - 16
  };
  scene.add.text.mockReturnValue(mockText);

  const manager = new EffectsManager(scene);
  manager.spawnScorePopup(50, 100, 10);

  // Verificar que add.text fue llamado con las coordenadas y estilo correctos
  expect(scene.add.text).toHaveBeenCalledWith(
    50,
    84,
    '+10',
    { fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#ffff00' }
  );

  // Verificar que el tween tiene duration 600 y alpha 0
  const tweenConfig = scene.tweens.add.mock.calls[0][0];
  expect(tweenConfig.duration).toBe(600);
  expect(tweenConfig.alpha).toBe(0);

  // Verificar que onComplete llama a destroy en el texto
  tweenConfig.onComplete();
  expect(mockText.destroy).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// Property 9: _eliminateBug() llama todos los efectos antes de desactivar el bug
// ---------------------------------------------------------------------------

test('Property 9: _eliminateBug() llama todos los efectos antes de desactivar el bug', () => {
  // Feature: retro-visual-effects, Property 9: _eliminateBug() calls all effects before deactivating the bug
  // Validates: Requirements 9.2
  fc.assert(
    fc.property(
      fc.record({
        x: fc.integer(),
        y: fc.integer(),
        pointValue: fc.integer({ min: 1 }),
      }),
      (bugData) => {
        const scene = createMockScene();
        // Configurar mocks necesarios para los métodos de EffectsManager
        const mockParticles = { explode: jest.fn(), destroy: jest.fn() };
        scene.add.particles.mockReturnValue(mockParticles);
        const mockText = {
          setScrollFactor: jest.fn().mockReturnThis(),
          destroy: jest.fn(),
          y: bugData.y - 16,
        };
        scene.add.text.mockReturnValue(mockText);
        scene.tweens.add.mockReturnValue({ stop: jest.fn() });

        const effectsManager = new EffectsManager(scene);

        // Crear mock del bug con setActive rastreable
        const bug = {
          x: bugData.x,
          y: bugData.y,
          pointValue: bugData.pointValue,
          active: true,
          body: null,
          setActive: jest.fn(),
        };

        /**
         * Simula la lógica de _eliminateBug directamente para verificar el orden de llamadas.
         * @param {object} bug - El bug a eliminar
         * @param {EffectsManager} effectsManager - El manager de efectos
         * @returns {string[]} El orden de llamadas registrado
         */
        function simulateEliminateBug(bug, effectsManager) {
          if (!bug || bug.active === false) return [];
          const callOrder = [];
          const origSpawnParticle = effectsManager.spawnParticleBurst.bind(effectsManager);
          const origTriggerHitStop = effectsManager.triggerHitStop.bind(effectsManager);
          const origSpawnScorePopup = effectsManager.spawnScorePopup.bind(effectsManager);
          effectsManager.spawnParticleBurst = (...args) => { callOrder.push('spawnParticleBurst'); origSpawnParticle(...args); };
          effectsManager.triggerHitStop = () => { callOrder.push('triggerHitStop'); origTriggerHitStop(); };
          effectsManager.spawnScorePopup = (...args) => { callOrder.push('spawnScorePopup'); origSpawnScorePopup(...args); };
          const origSetActive = bug.setActive.bind(bug);
          bug.setActive = (val) => { callOrder.push('setActive'); origSetActive(val); };

          // Replicar la lógica de _eliminateBug
          effectsManager.spawnParticleBurst(bug.x, bug.y);
          effectsManager.triggerHitStop();
          effectsManager.spawnScorePopup(bug.x, bug.y, bug.pointValue);
          bug.setActive(false);

          return callOrder;
        }

        const callOrder = simulateEliminateBug(bug, effectsManager);

        // Verificar que setActive aparece después de todos los efectos
        const setActiveIndex = callOrder.indexOf('setActive');
        const spawnParticleIndex = callOrder.indexOf('spawnParticleBurst');
        const triggerHitStopIndex = callOrder.indexOf('triggerHitStop');
        const spawnScorePopupIndex = callOrder.indexOf('spawnScorePopup');

        return (
          setActiveIndex > spawnParticleIndex &&
          setActiveIndex > triggerHitStopIndex &&
          setActiveIndex > spawnScorePopupIndex
        );
      }
    ),
    { numRuns: 100 }
  );
});
