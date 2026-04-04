/**
 * Tests unitarios para la entidad Kiro.
 * Verifica el movimiento, la dirección, la invencibilidad y la animación.
 *
 * Nota: Phaser se carga vía CDN en el navegador; aquí se usa la clase base mínima
 * definida en Kiro.js para poder ejecutar los tests en Node/Jest.
 */

import fc from 'fast-check';
import { Kiro } from '../../src/entities/Kiro.js';
import { CONSTANTS } from '../../src/config/constants.js';

// ---------------------------------------------------------------------------
// Helpers: mocks de escena y cursores
// ---------------------------------------------------------------------------

/**
 * Crea una escena mínima de Phaser mockeada con un reloj controlable.
 * @param {number} now - Tiempo actual simulado en milisegundos
 */
function createMockScene(now = 0) {
  return {
    time: { now },
    add: { existing: jest.fn() },
    physics: { add: { existing: jest.fn() } },
  };
}

/**
 * Crea un objeto de cursores con todas las teclas sueltas por defecto.
 * @param {object} overrides - Teclas a sobreescribir con isDown: true
 */
function createCursors(overrides = {}) {
  const base = {
    up:    { isDown: false },
    down:  { isDown: false },
    left:  { isDown: false },
    right: { isDown: false },
  };
  for (const key of Object.keys(overrides)) {
    base[key] = { isDown: overrides[key] };
  }
  return base;
}

// ---------------------------------------------------------------------------
// Tests de construcción
// ---------------------------------------------------------------------------

test('Kiro se inicializa con facing "down" y sin invencibilidad', () => {
  const scene = createMockScene();
  const kiro = new Kiro(scene, 100, 100);

  expect(kiro.facing).toBe('down');
  expect(kiro.isInvincible).toBe(false);
});

test('Kiro se inicializa con velocidad (0, 0)', () => {
  const scene = createMockScene();
  const kiro = new Kiro(scene, 100, 100);

  expect(kiro.body.velocity.x).toBe(0);
  expect(kiro.body.velocity.y).toBe(0);
});

// ---------------------------------------------------------------------------
// Tests de movimiento con teclas de dirección (cursors)
// ---------------------------------------------------------------------------

test('update() con cursor arriba: velocidad Y negativa y facing "up"', () => {
  const scene = createMockScene();
  const kiro = new Kiro(scene, 0, 0);
  kiro.anims = { play: jest.fn(), stop: jest.fn() };

  kiro.update(createCursors({ up: true }), createCursors());

  expect(kiro.body.velocity.y).toBe(-CONSTANTS.PLAYER_SPEED);
  expect(kiro.body.velocity.x).toBe(0);
  expect(kiro.facing).toBe('up');
});

test('update() con cursor abajo: velocidad Y positiva y facing "down"', () => {
  const scene = createMockScene();
  const kiro = new Kiro(scene, 0, 0);
  kiro.anims = { play: jest.fn(), stop: jest.fn() };

  kiro.update(createCursors({ down: true }), createCursors());

  expect(kiro.body.velocity.y).toBe(CONSTANTS.PLAYER_SPEED);
  expect(kiro.body.velocity.x).toBe(0);
  expect(kiro.facing).toBe('down');
});

test('update() con cursor izquierda: velocidad X negativa y facing "left"', () => {
  const scene = createMockScene();
  const kiro = new Kiro(scene, 0, 0);
  kiro.anims = { play: jest.fn(), stop: jest.fn() };

  kiro.update(createCursors({ left: true }), createCursors());

  expect(kiro.body.velocity.x).toBe(-CONSTANTS.PLAYER_SPEED);
  expect(kiro.body.velocity.y).toBe(0);
  expect(kiro.facing).toBe('left');
});

test('update() con cursor derecha: velocidad X positiva y facing "right"', () => {
  const scene = createMockScene();
  const kiro = new Kiro(scene, 0, 0);
  kiro.anims = { play: jest.fn(), stop: jest.fn() };

  kiro.update(createCursors({ right: true }), createCursors());

  expect(kiro.body.velocity.x).toBe(CONSTANTS.PLAYER_SPEED);
  expect(kiro.body.velocity.y).toBe(0);
  expect(kiro.facing).toBe('right');
});

// ---------------------------------------------------------------------------
// Tests de movimiento con teclas WASD
// ---------------------------------------------------------------------------

test('update() con WASD arriba: velocidad Y negativa y facing "up"', () => {
  const scene = createMockScene();
  const kiro = new Kiro(scene, 0, 0);
  kiro.anims = { play: jest.fn(), stop: jest.fn() };

  kiro.update(createCursors(), createCursors({ up: true }));

  expect(kiro.body.velocity.y).toBe(-CONSTANTS.PLAYER_SPEED);
  expect(kiro.facing).toBe('up');
});

test('update() con WASD derecha: velocidad X positiva y facing "right"', () => {
  const scene = createMockScene();
  const kiro = new Kiro(scene, 0, 0);
  kiro.anims = { play: jest.fn(), stop: jest.fn() };

  kiro.update(createCursors(), createCursors({ right: true }));

  expect(kiro.body.velocity.x).toBe(CONSTANTS.PLAYER_SPEED);
  expect(kiro.facing).toBe('right');
});

// ---------------------------------------------------------------------------
// Tests de estado en reposo
// ---------------------------------------------------------------------------

test('update() sin teclas presionadas: velocidad (0, 0)', () => {
  const scene = createMockScene();
  const kiro = new Kiro(scene, 0, 0);
  kiro.anims = { play: jest.fn(), stop: jest.fn() };

  kiro.update(createCursors(), createCursors());

  expect(kiro.body.velocity.x).toBe(0);
  expect(kiro.body.velocity.y).toBe(0);
});

test('update() sin teclas presionadas: llama a anims.stop()', () => {
  const scene = createMockScene();
  const kiro = new Kiro(scene, 0, 0);
  kiro.anims = { play: jest.fn(), stop: jest.fn() };

  kiro.update(createCursors(), createCursors());

  expect(kiro.anims.stop).toHaveBeenCalled();
});

// ---------------------------------------------------------------------------
// Tests de invencibilidad
// ---------------------------------------------------------------------------

test('triggerInvincibility() activa isInvincible durante INVINCIBILITY_DURATION ms', () => {
  const scene = createMockScene(1000);
  const kiro = new Kiro(scene, 0, 0);

  kiro.triggerInvincibility();

  // Justo después de activar: debe ser invencible
  expect(kiro.isInvincible).toBe(true);
});

test('isInvincible es false cuando el tiempo supera _invincibleUntil', () => {
  const scene = createMockScene(1000);
  const kiro = new Kiro(scene, 0, 0);

  kiro.triggerInvincibility();

  // Avanzar el reloj más allá de la duración de invencibilidad
  scene.time.now = 1000 + CONSTANTS.INVINCIBILITY_DURATION + 1;

  expect(kiro.isInvincible).toBe(false);
});

test('isInvincible es true justo antes de que expire la invencibilidad', () => {
  const scene = createMockScene(5000);
  const kiro = new Kiro(scene, 0, 0);

  kiro.triggerInvincibility();

  // Un milisegundo antes de que expire
  scene.time.now = 5000 + CONSTANTS.INVINCIBILITY_DURATION - 1;

  expect(kiro.isInvincible).toBe(true);
});

test('isInvincible es false antes de llamar a triggerInvincibility()', () => {
  const scene = createMockScene(9999);
  const kiro = new Kiro(scene, 0, 0);

  expect(kiro.isInvincible).toBe(false);
});

// ---------------------------------------------------------------------------
// Property 3: Bug collision reduces Kiro's lives by exactly one
// (La lógica de reducción de vidas ocurre en GameScene; aquí verificamos
//  que triggerInvincibility() siempre establece exactamente 3 segundos de invencibilidad)
// ---------------------------------------------------------------------------

test('Property 3: triggerInvincibility() siempre establece exactamente INVINCIBILITY_DURATION ms', () => {
  // Feature: bug-busters, Property 3: Bug collision reduces Kiro's lives by exactly one
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 1_000_000 }),
      (now) => {
        const scene = createMockScene(now);
        const kiro = new Kiro(scene, 0, 0);

        kiro.triggerInvincibility();

        // El período de invencibilidad debe ser exactamente INVINCIBILITY_DURATION ms
        const expectedUntil = now + CONSTANTS.INVINCIBILITY_DURATION;
        return kiro._invincibleUntil === expectedUntil;
      }
    ),
    { numRuns: 100 }
  );
});

test('Property 3b: isInvincible es true durante el período y false después', () => {
  // Feature: bug-busters, Property 3: Bug collision reduces Kiro's lives by exactly one
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 1_000_000 }),
      fc.integer({ min: 1, max: CONSTANTS.INVINCIBILITY_DURATION - 1 }),
      (now, offset) => {
        const scene = createMockScene(now);
        const kiro = new Kiro(scene, 0, 0);

        kiro.triggerInvincibility();

        // Durante el período: debe ser invencible
        scene.time.now = now + offset;
        const duringPeriod = kiro.isInvincible;

        // Después del período: no debe ser invencible
        scene.time.now = now + CONSTANTS.INVINCIBILITY_DURATION + 1;
        const afterPeriod = kiro.isInvincible;

        return duringPeriod === true && afterPeriod === false;
      }
    ),
    { numRuns: 100 }
  );
});
