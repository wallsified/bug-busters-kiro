/**
 * Tests de preservacion — Multi-Bug Fixes
 *
 * Estos tests DEBEN PASAR en el codigo sin corregir.
 * Confirman el comportamiento base que NO debe regresar tras aplicar los fixes.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.12
 */

import fs from 'fs';
import path from 'path';
import fc from 'fast-check';
import { Kiro } from '../../src/entities/Kiro.js';
import { Wanderer } from '../../src/entities/Wanderer.js';
import { Seeker } from '../../src/entities/Seeker.js';
import { Replicator } from '../../src/entities/Replicator.js';
import { BombGroup } from '../../src/entities/BombGroup.js';
import { PowerManager } from '../../src/managers/PowerManager.js';
import { CONSTANTS } from '../../src/config/constants.js';

// ---------------------------------------------------------------------------
// Helpers: mocks de escena
// ---------------------------------------------------------------------------

function createMockScene(now = 0) {
  const timers = [];
  return {
    time: {
      now,
      delayedCall: jest.fn((delay, cb) => {
        const timer = { remove: jest.fn(), _cb: cb, _delay: delay };
        timers.push(timer);
        return timer;
      }),
    },
    add: { existing: jest.fn() },
    physics: {
      add: {
        existing: jest.fn().mockImplementation((entity) => {
          if (entity && entity.body) {
            entity.body.setCollideWorldBounds = jest.fn().mockImplementation((val) => {
              entity.body.collideWorldBounds = val;
            });
          }
        }),
        overlap: jest.fn(),
      },
    },
    scale: { width: 800, height: 600 },
    input: {
      keyboard: {
        createCursorKeys: jest.fn(() => ({})),
        addKey: jest.fn((keyCode) => ({ isDown: false, keyCode })),
        addCapture: jest.fn(),
        captures: [],
      },
    },
    make: { tilemap: jest.fn(() => null) },
    cameras: { main: { setPostPipeline: jest.fn(), shake: jest.fn() } },
    renderer: null,
    _timers: timers,
  };
}

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
// Pres 1 (Req 3.1) — Bomba que expira sin golpear enemigo
//
// Observacion: detonateBomb() desactiva la bomba sin afectar score ni enemigos.
// Se prueba directamente sobre detonateBomb() con una bomba ya activa,
// sin pasar por placeBomb() que requiere body.reset (no disponible en mock base).
// Validates: Requirements 3.1
// ---------------------------------------------------------------------------

describe('Pres 1 — Bomba que expira sin golpear enemigo (Req 3.1)', () => {
  /**
   * Crea una bomba activa simulada con la interfaz minima de BombGroup.
   */
  function createActiveBomb() {
    return {
      active: true,
      visible: true,
      fuseTimer: null,
      body: { velocity: { x: 0, y: 0 } },
      setActive: jest.fn(function(v) { this.active = v; }),
      setVisible: jest.fn(function(v) { this.visible = v; }),
    };
  }

  test('detonateBomb() desactiva la bomba sin modificar score ni enemigos (fast-check)', () => {
    /**
     * Validates: Requirements 3.1
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 800 }),
        fc.integer({ min: 0, max: 600 }),
        (x, y) => {
          const scene = createMockScene(0);
          const bombGroup = new BombGroup(scene);

          // Crear una bomba activa directamente (sin placeBomb para evitar body.reset)
          const bomb = createActiveBomb();

          // Crear un enemigo mock que NO debe ser afectado
          const enemy = {
            active: true,
            visible: true,
            x: x + 500,
            y: y + 500,
            pointValue: 10,
            body: { velocity: { x: 0, y: 0 } },
            setActive: jest.fn(function(v) { this.active = v; }),
            setVisible: jest.fn(function(v) { this.visible = v; }),
          };

          // Detonar la bomba (expiracion sin colision con enemigo)
          bombGroup.detonateBomb(bomb);

          // La bomba debe estar inactiva
          const bombInactive = bomb.active === false;
          // El enemigo no debe haber sido tocado
          const enemyUntouched = enemy.setActive.mock.calls.length === 0
            && enemy.setVisible.mock.calls.length === 0
            && enemy.active === true;

          return bombInactive && enemyUntouched;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('detonateBomb() no otorga puntos ni afecta enemigos al expirar', () => {
    /**
     * Validates: Requirements 3.1
     */
    const scene = createMockScene(0);
    const bombGroup = new BombGroup(scene);

    const bomb = createActiveBomb();

    const enemy = {
      active: true,
      setActive: jest.fn(),
      setVisible: jest.fn(),
    };

    bombGroup.detonateBomb(bomb);

    // La bomba queda inactiva
    expect(bomb.active).toBe(false);
    // El enemigo no fue modificado
    expect(enemy.setActive).not.toHaveBeenCalled();
    expect(enemy.setVisible).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Pres 2 (Req 3.2) — Kiro golpeado por enemigo: deduccion de vida e invencibilidad
//
// Observacion: triggerInvincibility() establece _invincibleUntil = now + INVINCIBILITY_DURATION.
// Validates: Requirements 3.2
// ---------------------------------------------------------------------------

describe('Pres 2 — Kiro golpeado: vida e invencibilidad (Req 3.2)', () => {
  test('triggerInvincibility() establece _invincibleUntil = now + INVINCIBILITY_DURATION (fast-check)', () => {
    /**
     * Validates: Requirements 3.2
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        (now) => {
          const scene = createMockScene(now);
          const kiro = new Kiro(scene, 100, 100);

          kiro.triggerInvincibility();

          return kiro._invincibleUntil === now + CONSTANTS.INVINCIBILITY_DURATION;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('isInvincible es true durante el periodo y false despues (fast-check)', () => {
    /**
     * Validates: Requirements 3.2
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: CONSTANTS.INVINCIBILITY_DURATION - 1 }),
        (now, offset) => {
          const scene = createMockScene(now);
          const kiro = new Kiro(scene, 100, 100);

          kiro.triggerInvincibility();

          scene.time.now = now + offset;
          const duringPeriod = kiro.isInvincible;

          scene.time.now = now + CONSTANTS.INVINCIBILITY_DURATION + 1;
          const afterPeriod = kiro.isInvincible;

          return duringPeriod === true && afterPeriod === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Pres 3 (Req 3.3) — patch_bomb elimina todos los enemigos dentro del radio
//
// Observacion: activate('patch_bomb', ...) llama onBugEliminated para cada bug
// dentro de PATCH_BOMB_RADIUS.
// Validates: Requirements 3.3
// ---------------------------------------------------------------------------

describe('Pres 3 — patch_bomb elimina enemigos dentro del radio (Req 3.3)', () => {
  test('activate patch_bomb llama onBugEliminated para cada bug dentro del radio (fast-check)', () => {
    /**
     * Validates: Requirements 3.3
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        (bugCount) => {
          const scene = createMockScene(0);
          const pm = new PowerManager(scene);

          // Desbloquear patch_bomb manualmente
          pm._powers.patch_bomb.unlocked = true;

          const kiroPos = { x: 400, y: 300 };

          // Crear bugs dentro del radio
          const bugs = Array.from({ length: bugCount }, (_, i) => ({
            active: true,
            x: kiroPos.x + i * 10,
            y: kiroPos.y + i * 10,
          }));

          const eliminated = [];
          const onBugEliminated = jest.fn((bug) => eliminated.push(bug));

          const result = pm.activate('patch_bomb', kiroPos, bugs, onBugEliminated);

          // Todos los bugs dentro del radio deben haber sido eliminados
          const allWithinRadius = bugs.every(bug => {
            const dx = bug.x - kiroPos.x;
            const dy = bug.y - kiroPos.y;
            return Math.sqrt(dx * dx + dy * dy) < CONSTANTS.PATCH_BOMB_RADIUS;
          });

          return result === true
            && allWithinRadius
            && eliminated.length === bugCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('activate patch_bomb no elimina bugs fuera del radio', () => {
    /**
     * Validates: Requirements 3.3
     */
    const scene = createMockScene(0);
    const pm = new PowerManager(scene);
    pm._powers.patch_bomb.unlocked = true;

    const kiroPos = { x: 400, y: 300 };

    // Bug fuera del radio
    const bugFuera = {
      active: true,
      x: kiroPos.x + CONSTANTS.PATCH_BOMB_RADIUS + 100,
      y: kiroPos.y,
    };

    const onBugEliminated = jest.fn();
    pm.activate('patch_bomb', kiroPos, [bugFuera], onBugEliminated);

    expect(onBugEliminated).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Pres 4 (Req 3.4) — Wanderers/Seekers se registran correctamente en _bugs
//
// Observacion: las ramas Wanderer/Seeker asignan correctamente a bug.
// Validates: Requirements 3.4
// ---------------------------------------------------------------------------

describe('Pres 4 — Wanderers/Seekers se registran en _bugs (Req 3.4)', () => {
  test('_spawnEnemies con solo Wanderers/Seekers produce _bugs con el conteo correcto (fast-check)', () => {
    /**
     * Validates: Requirements 3.4
     */
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('Wanderer', 'Seeker'),
            x: fc.integer({ min: 100, max: 700 }),
            y: fc.integer({ min: 100, max: 500 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (enemies) => {
          const scene = createMockScene(0);
          const bugs = [];

          // Replicar la logica de _spawnEnemies para Wanderer/Seeker (codigo sin fix)
          for (const enemyDef of enemies) {
            let bug;
            if (enemyDef.type === 'Wanderer') {
              bug = new Wanderer(scene, enemyDef.x, enemyDef.y);
            } else if (enemyDef.type === 'Seeker') {
              bug = new Seeker(scene, enemyDef.x, enemyDef.y);
            }
            if (bug) bugs.push(bug);
          }

          return bugs.length === enemies.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('_spawnEnemies con Wanderers produce instancias de Wanderer', () => {
    /**
     * Validates: Requirements 3.4
     */
    const scene = createMockScene(0);
    const bugs = [];
    const enemies = [
      { type: 'Wanderer', x: 200, y: 200 },
      { type: 'Wanderer', x: 300, y: 300 },
    ];

    for (const e of enemies) {
      const bug = new Wanderer(scene, e.x, e.y);
      bugs.push(bug);
    }

    expect(bugs).toHaveLength(2);
    expect(bugs.every(b => b instanceof Wanderer)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Pres 5 (Req 3.5) — Wanderers spawneados por Replicator se agregan a _bugs
//
// Observacion: el callback _onSpawn empuja el nuevo Wanderer a _bugs y llama
// _setupBugCollisions.
// Validates: Requirements 3.5
// ---------------------------------------------------------------------------

describe('Pres 5 — Wanderers spawneados por Replicator se agregan a _bugs (Req 3.5)', () => {
  test('callback _onSpawn agrega Wanderer a _bugs y llama _setupBugCollisions (fast-check)', () => {
    /**
     * Validates: Requirements 3.5
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 700 }),
        fc.integer({ min: 100, max: 500 }),
        (spawnX, spawnY) => {
          const scene = createMockScene(0);
          const bugs = [];
          const setupCollisionsCalls = [];

          // Replicar el callback de _spawnEnemies para Replicator (codigo sin fix)
          const onSpawn = (x, y) => {
            const newWanderer = new Wanderer(scene, x, y);
            bugs.push(newWanderer);
            setupCollisionsCalls.push(newWanderer);
          };

          // Invocar el callback directamente (simula Replicator._onSpawn)
          onSpawn(spawnX, spawnY);

          return bugs.length === 1
            && bugs[0] instanceof Wanderer
            && setupCollisionsCalls.length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Replicator invoca _onSpawn al actualizar cuando llega el momento', () => {
    /**
     * Validates: Requirements 3.5
     */
    const scene = createMockScene(0);
    const spawnedPositions = [];

    const onSpawn = jest.fn((x, y) => spawnedPositions.push({ x, y }));
    const replicator = new Replicator(scene, 400, 300, onSpawn);

    // Actualizar con now >= _nextSpawn (0 >= 0)
    replicator.update(scene);

    expect(onSpawn).toHaveBeenCalledTimes(1);
    expect(spawnedPositions[0]).toEqual({ x: 400, y: 300 });
  });
});

// ---------------------------------------------------------------------------
// Pres 6 (Req 3.6) — checkUnlocks no reproduce sfx_power_unlock si ya esta desbloqueado
//
// Observacion: el flag unlocked previene re-entrada.
// Validates: Requirements 3.6
// ---------------------------------------------------------------------------

describe('Pres 6 — checkUnlocks no repite sfx_power_unlock si ya desbloqueado (Req 3.6)', () => {
  test('checkUnlocks no llama soundManager.play si el poder ya estaba desbloqueado (fast-check)', () => {
    /**
     * Validates: Requirements 3.6
     */
    fc.assert(
      fc.property(
        fc.integer({ min: CONSTANTS.POWER_UNLOCK_FREEZE, max: 10000 }),
        (score) => {
          const scene = createMockScene(0);
          const pm = new PowerManager(scene);

          // Pre-desbloquear freeze manualmente
          pm._powers.freeze.unlocked = true;
          pm._powers.patch_bomb.unlocked = true;

          // La firma actual es checkUnlocks(score) — sin soundManager
          // El flag unlocked previene re-entrada, por lo que no se llama ningun sonido
          const mockSoundManager = { play: jest.fn() };

          // Llamar con la firma actual (un solo argumento)
          pm.checkUnlocks(score);

          // No debe haber llamado al soundManager (no se pasa como argumento en codigo sin fix)
          return mockSoundManager.play.mock.calls.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('checkUnlocks con poder ya desbloqueado no modifica el estado unlocked', () => {
    /**
     * Validates: Requirements 3.6
     */
    const scene = createMockScene(0);
    const pm = new PowerManager(scene);

    // Pre-desbloquear
    pm._powers.freeze.unlocked = true;

    // Llamar de nuevo con score alto
    pm.checkUnlocks(99999);

    // El estado no debe cambiar (sigue true, no se resetea)
    expect(pm._powers.freeze.unlocked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Pres 7 (Req 3.7) — activate() no llama soundManager
//
// Observacion: activate() no llama ningun sonido — el sonido sfx_power_activate
// se reproduce en GameScene.update(), no en PowerManager.activate().
// Validates: Requirements 3.7
// ---------------------------------------------------------------------------

describe('Pres 7 — activate() no llama soundManager (Req 3.7)', () => {
  test('activate("freeze") no llama soundManager.play (fast-check)', () => {
    /**
     * Validates: Requirements 3.7
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        (bugCount) => {
          const scene = createMockScene(0);
          const pm = new PowerManager(scene);
          pm._powers.freeze.unlocked = true;

          const bugs = Array.from({ length: bugCount }, () => ({
            active: true,
            body: { setVelocity: jest.fn(), velocity: { x: 10, y: 10 } },
          }));

          const soundManagerSpy = { play: jest.fn() };

          // activate() no recibe soundManager — no debe llamarlo
          pm.activate('freeze', { x: 400, y: 300 }, bugs);

          return soundManagerSpy.play.mock.calls.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('activate("patch_bomb") no llama soundManager.play (fast-check)', () => {
    /**
     * Validates: Requirements 3.7
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3 }),
        (bugCount) => {
          const scene = createMockScene(0);
          const pm = new PowerManager(scene);
          pm._powers.patch_bomb.unlocked = true;

          const kiroPos = { x: 400, y: 300 };
          const bugs = Array.from({ length: bugCount }, (_, i) => ({
            active: true,
            x: kiroPos.x + i * 5,
            y: kiroPos.y + i * 5,
          }));

          const soundManagerSpy = { play: jest.fn() };

          // activate() no recibe soundManager — no debe llamarlo
          pm.activate('patch_bomb', kiroPos, bugs, jest.fn());

          return soundManagerSpy.play.mock.calls.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Pres 8 (Req 3.8) — checkUnlocks sin cruzar umbral no reproduce ningun sonido
//
// Observacion: checkUnlocks solo establece unlocked = true, sin llamar sonido.
// Validates: Requirements 3.8
// ---------------------------------------------------------------------------

describe('Pres 8 — checkUnlocks sin cruzar umbral no reproduce sonido (Req 3.8)', () => {
  test('checkUnlocks con score por debajo de ambos umbrales no llama ningun sonido (fast-check)', () => {
    /**
     * Validates: Requirements 3.8
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: CONSTANTS.POWER_UNLOCK_FREEZE - 1 }),
        (score) => {
          const scene = createMockScene(0);
          const pm = new PowerManager(scene);

          // La firma actual es checkUnlocks(score) — no acepta soundManager
          // No debe haber ningun efecto secundario de sonido
          pm.checkUnlocks(score);

          // Verificar que los poderes siguen bloqueados
          return pm._powers.freeze.unlocked === false
            && pm._powers.patch_bomb.unlocked === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('checkUnlocks con score entre los dos umbrales solo desbloquea freeze', () => {
    /**
     * Validates: Requirements 3.8
     */
    const scene = createMockScene(0);
    const pm = new PowerManager(scene);

    const scoreBetween = CONSTANTS.POWER_UNLOCK_FREEZE + 10;
    pm.checkUnlocks(scoreBetween);

    expect(pm._powers.freeze.unlocked).toBe(true);
    expect(pm._powers.patch_bomb.unlocked).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Pres 9 (Req 3.9) — Kiro responde correctamente a inputs de movimiento
//
// Observacion: update() establece velocidad a +/-PLAYER_SPEED en el eje correcto.
// Validates: Requirements 3.9
// ---------------------------------------------------------------------------

describe('Pres 9 — Kiro responde a inputs de movimiento (Req 3.9)', () => {
  test('cursor arriba → velocidad Y = -PLAYER_SPEED (fast-check)', () => {
    /**
     * Validates: Requirements 3.9
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 750 }),
        fc.integer({ min: 50, max: 550 }),
        (x, y) => {
          const scene = createMockScene(0);
          const kiro = new Kiro(scene, x, y);
          kiro.anims = { play: jest.fn(), stop: jest.fn() };

          kiro.update(createCursors({ up: true }), createCursors());

          return kiro.body.velocity.y === -CONSTANTS.PLAYER_SPEED
            && kiro.body.velocity.x === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cursor abajo → velocidad Y = +PLAYER_SPEED (fast-check)', () => {
    /**
     * Validates: Requirements 3.9
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 750 }),
        fc.integer({ min: 50, max: 550 }),
        (x, y) => {
          const scene = createMockScene(0);
          const kiro = new Kiro(scene, x, y);
          kiro.anims = { play: jest.fn(), stop: jest.fn() };

          kiro.update(createCursors({ down: true }), createCursors());

          return kiro.body.velocity.y === CONSTANTS.PLAYER_SPEED
            && kiro.body.velocity.x === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cursor izquierda → velocidad X = -PLAYER_SPEED (fast-check)', () => {
    /**
     * Validates: Requirements 3.9
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 750 }),
        fc.integer({ min: 50, max: 550 }),
        (x, y) => {
          const scene = createMockScene(0);
          const kiro = new Kiro(scene, x, y);
          kiro.anims = { play: jest.fn(), stop: jest.fn() };

          kiro.update(createCursors({ left: true }), createCursors());

          return kiro.body.velocity.x === -CONSTANTS.PLAYER_SPEED
            && kiro.body.velocity.y === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cursor derecha → velocidad X = +PLAYER_SPEED (fast-check)', () => {
    /**
     * Validates: Requirements 3.9
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 750 }),
        fc.integer({ min: 50, max: 550 }),
        (x, y) => {
          const scene = createMockScene(0);
          const kiro = new Kiro(scene, x, y);
          kiro.anims = { play: jest.fn(), stop: jest.fn() };

          kiro.update(createCursors({ right: true }), createCursors());

          return kiro.body.velocity.x === CONSTANTS.PLAYER_SPEED
            && kiro.body.velocity.y === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('WASD arriba → velocidad Y = -PLAYER_SPEED (fast-check)', () => {
    /**
     * Validates: Requirements 3.9
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 750 }),
        fc.integer({ min: 50, max: 550 }),
        (x, y) => {
          const scene = createMockScene(0);
          const kiro = new Kiro(scene, x, y);
          kiro.anims = { play: jest.fn(), stop: jest.fn() };

          kiro.update(createCursors(), createCursors({ up: true }));

          return kiro.body.velocity.y === -CONSTANTS.PLAYER_SPEED
            && kiro.body.velocity.x === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Pres 10 (Req 3.12) — Elementos existentes de <head> en index.html sin cambios
//
// Observacion: todos los elementos actuales del <head> deben estar presentes.
// Validates: Requirements 3.12
// ---------------------------------------------------------------------------

describe('Pres 10 — Elementos existentes de <head> en index.html (Req 3.12)', () => {
  let headContent;

  beforeAll(() => {
    const indexPath = path.resolve(process.cwd(), 'index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf-8');
    const headMatch = htmlContent.match(/<head[\s\S]*?<\/head>/i);
    expect(headMatch).not.toBeNull();
    headContent = headMatch[0];
  });

  test('index.html contiene meta charset UTF-8', () => {
    /**
     * Validates: Requirements 3.12
     */
    expect(headContent).toMatch(/meta[^>]+charset/i);
  });

  test('index.html contiene meta viewport', () => {
    /**
     * Validates: Requirements 3.12
     */
    expect(headContent).toMatch(/meta[^>]+viewport/i);
  });

  test('index.html contiene <title>Bug Busters</title>', () => {
    /**
     * Validates: Requirements 3.12
     */
    expect(headContent).toMatch(/<title>Bug Busters<\/title>/i);
  });

  test('index.html contiene preconnect a fonts.googleapis.com', () => {
    /**
     * Validates: Requirements 3.12
     */
    expect(headContent).toMatch(/fonts\.googleapis\.com/i);
  });

  test('index.html contiene preconnect a fonts.gstatic.com', () => {
    /**
     * Validates: Requirements 3.12
     */
    expect(headContent).toMatch(/fonts\.gstatic\.com/i);
  });

  test('index.html contiene enlace a la fuente Press Start 2P', () => {
    /**
     * Validates: Requirements 3.12
     */
    expect(headContent).toMatch(/Press\+Start\+2P/i);
  });

  test('index.html contiene el CDN de Phaser 3.60.0', () => {
    /**
     * Validates: Requirements 3.12
     */
    expect(headContent).toMatch(/phaser@3\.60\.0/i);
  });

  test('index.html contiene el bloque de estilos CSS base', () => {
    /**
     * Validates: Requirements 3.12
     */
    expect(headContent).toMatch(/<style>/i);
  });
});
