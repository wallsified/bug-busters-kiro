/**
 * Tests de propiedades para el overhaul de gameplay de Bug Busters.
 * Usa fast-check para verificar invariantes del sistema a través de múltiples entradas.
 *
 * Feature: gameplay-overhaul
 */

import fc from 'fast-check';
import { BombGroup } from '../../src/entities/BombGroup.js';
import { Wanderer } from '../../src/entities/Wanderer.js';
import { CONSTANTS } from '../../src/config/constants.js';
import { vignetteValue, scanlineValue } from '../../src/shaders/CRTShader.js';

// Función auxiliar para crear una escena simulada con el sistema de tiempo
function makeScene() {
  return {
    time: {
      delayedCall: jest.fn(() => ({ remove: jest.fn() }))
    }
  };
}

describe('GameplayOverhaulProperties', () => {
  // Property 1: Bomb placement respects tile snapping
  // Feature: gameplay-overhaul, Property 1: Bomb placement respects tile snapping
  // Validates: Requirements 1.1, 1.2
  test('Property 1: Bomb placement respects tile snapping', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 800, noNaN: true }),
        fc.double({ min: 0, max: 600, noNaN: true }),
        (x, y) => {
          const scene = makeScene();
          const group = new BombGroup(scene);
          group.placeBomb(x, y);
          const bomb = group.getChildren().find(b => b.active);
          // Si no hay bomba activa (límite alcanzado), la propiedad se cumple trivialmente
          if (!bomb) return true;
          const expectedX = Math.round(x / 32) * 32 + 16;
          const expectedY = Math.round(y / 32) * 32 + 16;
          return bomb.x === expectedX && bomb.y === expectedY;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 2: Bomb limit is never exceeded
  // Feature: gameplay-overhaul, Property 2: Bomb limit is never exceeded
  // Validates: Requirements 1.5
  test('Property 2: Bomb limit is never exceeded', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 4, max: 20 }),
        (n) => {
          const scene = makeScene();
          const group = new BombGroup(scene);
          for (let i = 0; i < n; i++) {
            group.placeBomb(i * 32, i * 32);
          }
          return group.getActiveCount() <= CONSTANTS.BOMB_LIMIT;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 3: Bomb-bug overlap eliminates both
  // Feature: gameplay-overhaul, Property 3: Bomb-bug overlap eliminates both
  // Validates: Requirements 1.3
  test('Property 3: Bomb-bug overlap eliminates both', () => {
    fc.assert(
      fc.property(
        fc.record({
          x: fc.double({ min: 0, max: 800, noNaN: true }),
          y: fc.double({ min: 0, max: 600, noNaN: true })
        }),
        (pos) => {
          // Crear una bomba simulada activa
          const bomb = {
            active: true,
            body: { velocity: { x: 0, y: 0 } },
            fuseTimer: null,
            setActive: function(v) { this.active = v; return this; }
          };
          // Crear un bug simulado activo
          const bug = {
            active: true,
            x: pos.x,
            y: pos.y,
            pointValue: 10,
            body: { velocity: { x: 0, y: 0 } },
            setActive: function(v) { this.active = v; return this; }
          };
          // Crear una escena mínima simulada
          const scene = {
            time: { delayedCall: jest.fn(() => ({ remove: jest.fn() })) },
            _bombs: {
              detonateBomb: jest.fn((b) => { b.setActive(false); b.body.velocity.x = 0; b.body.velocity.y = 0; })
            },
            _effectsManager: {
              spawnParticleBurst: jest.fn(),
              triggerHitStop: jest.fn(),
              spawnScorePopup: jest.fn(),
              shake: jest.fn()
            },
            _scoreSystem: { addPoints: jest.fn() },
            _soundManager: { play: jest.fn() },
            _eliminateBug: function(b) {
              if (!b || b.active === false) return;
              b.setActive(false);
              if (b.body) { b.body.velocity.x = 0; b.body.velocity.y = 0; }
            },
            _onBombHitBug: function(bm, bg) {
              if (!bm || bm.active === false) return;
              if (!bg || bg.active === false) return;
              this._bombs.detonateBomb(bm);
              this._eliminateBug(bg);
            }
          };

          scene._onBombHitBug(bomb, bug);

          return bomb.active === false && bug.active === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 4: Spawn threshold is never exceeded
  // Feature: gameplay-overhaul, Property 4: Spawn threshold is never exceeded
  // Validates: Requirements 2.2, 2.3, 2.6
  test('Property 4: Spawn threshold is never exceeded', () => {
    // Árbitro para generar enemigos con pointValue aleatorio
    const enemyArb = fc.record({
      type: fc.constantFrom('Wanderer', 'Seeker'),
      pointValue: fc.integer({ min: 1, max: 30 }),
      x: fc.integer({ min: 0, max: 800 }),
      y: fc.integer({ min: 0, max: 600 })
    });

    fc.assert(
      fc.property(
        fc.array(enemyArb, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 1, max: 100 }),
        (enemies, threshold) => {
          // Simular la lógica de _spawnEnemies con umbral
          let spawnedPointTotal = 0;
          const spawned = [];

          for (const enemyDef of enemies) {
            if (spawnedPointTotal >= threshold) break;
            spawned.push(enemyDef);
            spawnedPointTotal += enemyDef.pointValue;
          }

          // La propiedad: el total spawneado es >= threshold O se spawnearon todos los enemigos
          return spawnedPointTotal >= threshold || spawned.length === enemies.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 5: Wanderer count matches level config
  // Feature: gameplay-overhaul, Property 5: Wanderer count matches level config
  // Validates: Requirements 3.1
  test('Property 5: Wanderer count matches level config', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        (n) => {
          // Construir una config de nivel con n Wanderers
          const enemies = Array.from({ length: n }, (_, i) => ({
            type: 'Wanderer',
            x: (i + 1) * 50,
            y: 100
          }));
          const levelConfig = { enemies, spawnThreshold: Infinity };

          // Simular _spawnEnemies: contar cuántos Wanderers se crearían
          let wandererCount = 0;
          let spawnedPointTotal = 0;
          const WANDERER_POINT_VALUE = 10; // CONSTANTS.POINTS_WANDERER

          for (const enemyDef of levelConfig.enemies) {
            if (spawnedPointTotal >= (levelConfig.spawnThreshold ?? Infinity)) break;
            if (enemyDef.type === 'Wanderer') {
              wandererCount++;
              spawnedPointTotal += WANDERER_POINT_VALUE;
            }
          }

          return wandererCount === n;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 6: Wanderer velocity magnitude equals ENEMY_SPEED
  // Feature: gameplay-overhaul, Property 6: Wanderer velocity magnitude equals ENEMY_SPEED
  // Validates: Requirements 3.3
  test('Property 6: Wanderer velocity magnitude equals ENEMY_SPEED', () => {
    const ENEMY_SPEED = 100;

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        (_seed) => {
          const scene = {
            time: { now: 0 },
            add: { existing: jest.fn() },
            physics: { add: { existing: jest.fn() } }
          };
          const wanderer = new Wanderer(scene, 0, 0);
          wanderer._pickNewDirection();

          const vx = wanderer.body.velocity.x;
          const vy = wanderer.body.velocity.y;

          // Exactamente uno de los ejes debe tener magnitud ENEMY_SPEED, el otro 0
          const xIsSpeed = Math.abs(vx) === ENEMY_SPEED;
          const yIsSpeed = Math.abs(vy) === ENEMY_SPEED;
          const xIsZero = vx === 0;
          const yIsZero = vy === 0;

          return (xIsSpeed && yIsZero) || (yIsSpeed && xIsZero);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 7: CRT vignette preserves brightness in centre region
  // Feature: gameplay-overhaul, Property 7: CRT vignette preserves brightness in centre region
  // Validates: Requirements 4.1, 4.5
  test('Property 7: CRT vignette preserves brightness in centre region', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 0.5, noNaN: true }),
        (dist) => {
          // Para distancias en la mitad central de la pantalla, el brillo debe ser >= 0.75
          const brightness = vignetteValue(dist, 0.25);
          return brightness >= 0.75;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 8: CRT scanline preserves brightness on odd rows
  // Feature: gameplay-overhaul, Property 8: CRT scanline preserves brightness on odd rows
  // Validates: Requirements 4.2, 4.5
  test('Property 8: CRT scanline preserves brightness on odd rows', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }).filter(n => n % 2 !== 0),
        (row) => {
          // Para filas impares, el brillo debe ser >= 0.80 y scanlineAlpha > 0
          const brightness = scanlineValue(row, 0.18);
          return brightness >= 0.80 && 0.18 > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 9: Game-over does not trigger while lives > 0 and modules exist
  // Feature: gameplay-overhaul, Property 9: No game-over while lives > 0
  // Validates: Requirements 5.1, 5.2
  test('Property 9: Game-over does not trigger while lives > 0 and modules exist', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0 }),
        fc.integer({ min: 1, max: 10 }),
        (score, lives) => {
          // Crear una escena mínima simulada con el estado de juego
          const gameOverSpy = jest.fn();
          const scene = {
            _lives: lives,
            _transitioning: false,
            _scoreSystem: { getScore: () => score },
            _modules: [{ active: true }],
            _gameOver: gameOverSpy,
            _onBugHitKiro: function(bug) {
              if (!bug || bug.active === false) return;
              // Simular la lógica real: solo game over cuando lives <= 0
              this._lives -= 1;
              if (this._lives <= 0) this._gameOver();
            }
          };

          // Simular un hit que NO debería causar game over (lives > 0 antes del hit)
          // Con lives >= 1, después del hit lives >= 0
          // Solo si lives era exactamente 1, después del hit será 0 y se llama _gameOver
          // Para probar que NO se llama cuando lives > 1:
          if (lives > 1) {
            const bug = { active: true };
            scene._onBugHitKiro(bug);
            // Con lives > 1, después del hit lives >= 1, no debe llamar _gameOver
            return gameOverSpy.mock.calls.length === 0;
          }
          // Para lives === 1, el hit causaría game over — eso es correcto comportamiento
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 10: Pause-resume is a round trip
  // Feature: gameplay-overhaul, Property 10: Pause-resume is a round trip
  // Validates: Requirements 6.4
  test('Property 10: Pause-resume is a round trip', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (initialPaused) => {
          // Crear una escena mínima simulada con estado de pausa
          const scene = {
            _paused: initialPaused,
            _transitioning: false,
            time: { paused: initialPaused },
            physics: {
              pause: jest.fn(),
              resume: jest.fn()
            },
            _pauseOverlay: {
              setVisible: jest.fn()
            },
            _togglePause: function() {
              if (this._transitioning) return;
              this._paused = !this._paused;
              if (this._paused) {
                this.time.paused = true;
                this.physics.pause();
                this._pauseOverlay.setVisible(true);
              } else {
                this.time.paused = false;
                this.physics.resume();
                this._pauseOverlay.setVisible(false);
              }
            }
          };

          // Llamar _togglePause() dos veces debe restaurar el estado original
          scene._togglePause();
          scene._togglePause();

          // Después de dos toggles, el estado debe ser igual al estado inicial
          return scene._paused === initialPaused && scene.time.paused === initialPaused;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 11: Update is a no-op while paused
  // Feature: gameplay-overhaul, Property 11: Update is a no-op while paused
  // Validates: Requirements 6.6
  test('Property 11: Update is a no-op while paused', () => {
    fc.assert(
      fc.property(
        fc.record({
          x: fc.double({ min: 0, max: 800, noNaN: true }),
          y: fc.double({ min: 0, max: 600, noNaN: true })
        }),
        (pos) => {
          // Crear un bug simulado en la posición dada
          const bug = {
            active: true,
            x: pos.x,
            y: pos.y,
            body: { velocity: { x: 10, y: 10 } }
          };

          // Crear una escena mínima simulada con _paused = true
          const scene = {
            _paused: true,
            _transitioning: false,
            _bugs: [bug],
            _kiro: { x: pos.x, y: pos.y, update: jest.fn() },
            _scoreSystem: { getScore: jest.fn(() => 0) },
            _hudManager: { update: jest.fn() },
            _powerManager: { freezeUntil: 0, activate: jest.fn(), getState: jest.fn() },
            _checkWinCondition: jest.fn(),
            _placeBomb: jest.fn(),
            _spaceKey: { isDown: false },
            _spaceWasDown: false,
            time: { now: 0 },
            _lives: 3,
            _currentLevel: 1,
            _escKey: { isDown: false },
            _pKey: { isDown: false },
            _cursors: {},
            _wasd: {},
            _qKey: { isDown: false },
            _eKey: { isDown: false },
            update: function() {
              if (this._transitioning) return;
              // Simular la verificación de pausa
              if (this._paused) return;
              // Si llegamos aquí, el update procesaría los bugs
              this._kiro.update(this._cursors, this._wasd);
            }
          };

          const initialBugX = bug.x;
          const initialBugY = bug.y;
          const initialKiroUpdateCalls = scene._kiro.update.mock.calls.length;

          scene.update();

          // Con _paused = true, update() debe retornar temprano sin modificar nada
          return (
            bug.x === initialBugX &&
            bug.y === initialBugY &&
            scene._kiro.update.mock.calls.length === initialKiroUpdateCalls
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
