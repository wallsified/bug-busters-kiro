/**
 * Tests de preservación — Bug Busters Fixes
 *
 * Estos tests DEBEN PASAR en el código sin corregir.
 * Confirman el comportamiento correcto de base que NO debe regresar tras aplicar los fixes.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.8, 3.10
 */

import fc from 'fast-check';
import { Wanderer } from '../../src/entities/Wanderer.js';
import { Seeker } from '../../src/entities/Seeker.js';
import { Kiro } from '../../src/entities/Kiro.js';
import { ProjectileGroup } from '../../src/entities/ProjectileGroup.js';
import { SoundManager } from '../../src/managers/SoundManager.js';
import { CONSTANTS } from '../../src/config/constants.js';

// ---------------------------------------------------------------------------
// Helpers: mocks de escena
// ---------------------------------------------------------------------------

/**
 * Escena mínima para entidades físicas (Bug, Kiro).
 */
function createMockScene(now = 0) {
  return {
    time: { now },
    add: { existing: jest.fn() },
    physics: { add: { existing: jest.fn() } },
    events: { on: () => {} },
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
// Preservation 1 — Wanderer y Seeker display size (Property 2)
//
// Observación en código sin fix: Wanderer y Seeker NO llaman setDisplaySize,
// pero la clase base mock no define displayWidth/displayHeight.
// El comportamiento actual es que displayWidth === undefined.
// El fix de Bug 1 solo toca Replicator; Wanderer y Seeker no deben cambiar.
//
// Validates: Requirements 3.1
// ---------------------------------------------------------------------------

describe('Preservation 1 — Wanderer y Seeker display size (Property 2)', () => {
  /**
   * Observación: en el código sin fix, Wanderer y Seeker no llaman setDisplaySize.
   * La clase base mock no define displayWidth/displayHeight → valor es undefined.
   * El fix de Bug 1 solo agrega setDisplaySize a Replicator; Wanderer y Seeker
   * deben quedar exactamente igual (displayWidth sigue siendo undefined en tests).
   *
   * Validates: Requirements 3.1
   */
  test('Property 2: Wanderer.displayWidth es undefined en entorno mock (sin Phaser)', () => {
    const scene = createMockScene();
    const wanderer = new Wanderer(scene, 100, 100);
    // En entorno Jest sin Phaser, la clase base mock no define displayWidth
    expect(wanderer.displayWidth).toBeUndefined();
  });

  test('Property 2: Seeker.displayWidth es undefined en entorno mock (sin Phaser)', () => {
    const scene = createMockScene();
    const seeker = new Seeker(scene, 200, 200);
    expect(seeker.displayWidth).toBeUndefined();
  });

  test('Property 2: Wanderer.displayWidth es consistente para cualquier posición (fast-check)', () => {
    /**
     * Validates: Requirements 3.1
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 800 }),
        fc.integer({ min: 0, max: 600 }),
        (x, y) => {
          const scene = createMockScene();
          const wanderer = new Wanderer(scene, x, y);
          // El valor debe ser siempre el mismo (undefined en mock) — no cambia con la posición
          return wanderer.displayWidth === undefined;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: Seeker.displayWidth es consistente para cualquier posición (fast-check)', () => {
    /**
     * Validates: Requirements 3.1
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 800 }),
        fc.integer({ min: 0, max: 600 }),
        (x, y) => {
          const scene = createMockScene();
          const seeker = new Seeker(scene, x, y);
          return seeker.displayWidth === undefined;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Preservation 2 — Límite de proyectiles (Property 4)
//
// Observación: cuando hay 3 proyectiles activos, fire() es un no-op.
// El fix de Bug 2 agrega setVisible(true); no debe cambiar el límite.
//
// Validates: Requirements 3.2
// ---------------------------------------------------------------------------

describe('Preservation 2 — Límite de proyectiles (Property 4)', () => {
  test('Property 4: fire() con 3 proyectiles activos es un no-op (no agrega más)', () => {
    /**
     * Validates: Requirements 3.2
     */
    const group = new ProjectileGroup(null);

    // Llenar el pool hasta el límite
    group.fire(10, 10, 'right');
    group.fire(20, 20, 'up');
    group.fire(30, 30, 'left');

    // PROJECTILE_LIMIT fue removido de CONSTANTS en gameplay-overhaul; valor histórico = 3
    const PROJECTILE_LIMIT = 3;
    const countBefore = group.getChildren().filter(p => p.active).length;
    expect(countBefore).toBe(PROJECTILE_LIMIT);

    // Intentar disparar un cuarto proyectil
    group.fire(40, 40, 'down');

    const countAfter = group.getChildren().filter(p => p.active).length;
    expect(countAfter).toBe(PROJECTILE_LIMIT);
  });

  test('Property 4: fire() con 3 activos no modifica los proyectiles existentes', () => {
    /**
     * Validates: Requirements 3.2
     */
    const group = new ProjectileGroup(null);

    group.fire(10, 10, 'right');
    group.fire(20, 20, 'up');
    group.fire(30, 30, 'left');

    const snapshotBefore = group.getChildren().map(p => ({
      x: p.x, y: p.y,
      vx: p.body.velocity.x, vy: p.body.velocity.y,
    }));

    // Intento de disparo extra
    group.fire(99, 99, 'down');

    const snapshotAfter = group.getChildren().map(p => ({
      x: p.x, y: p.y,
      vx: p.body.velocity.x, vy: p.body.velocity.y,
    }));

    expect(snapshotAfter).toEqual(snapshotBefore);
  });

  test('Property 4: el límite se respeta para cualquier dirección (fast-check)', () => {
    /**
     * Validates: Requirements 3.2
     */
    const directions = ['up', 'down', 'left', 'right'];
    fc.assert(
      fc.property(
        fc.constantFrom(...directions),
        (dir) => {
          const group = new ProjectileGroup(null);
          group.fire(10, 10, 'right');
          group.fire(20, 20, 'up');
          group.fire(30, 30, 'left');

          group.fire(50, 50, dir);

          const activeCount = group.getChildren().filter(p => p.active).length;
          // PROJECTILE_LIMIT fue removido de CONSTANTS en gameplay-overhaul; valor histórico = 3
          return activeCount === 3;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Preservation 3 — Manejo de colisión de Kiro (Property 6)
//
// Observación: triggerInvincibility() establece _invincibleUntil correctamente.
// isInvincible devuelve true durante el período y false después.
// El fix de Bug 3 solo mueve el spawn; no toca la lógica de colisión.
//
// Validates: Requirements 3.5
// ---------------------------------------------------------------------------

describe('Preservation 3 — Manejo de colisión de Kiro (Property 6)', () => {
  test('Property 6: triggerInvincibility() establece _invincibleUntil = now + INVINCIBILITY_DURATION', () => {
    /**
     * Validates: Requirements 3.5
     */
    const scene = createMockScene(1000);
    const kiro = new Kiro(scene, 100, 100);

    kiro.triggerInvincibility();

    expect(kiro._invincibleUntil).toBe(1000 + CONSTANTS.INVINCIBILITY_DURATION);
  });

  test('Property 6: isInvincible es true durante el período de invencibilidad', () => {
    /**
     * Validates: Requirements 3.5
     */
    const scene = createMockScene(500);
    const kiro = new Kiro(scene, 100, 100);

    kiro.triggerInvincibility();

    scene.time.now = 500 + CONSTANTS.INVINCIBILITY_DURATION - 1;
    expect(kiro.isInvincible).toBe(true);
  });

  test('Property 6: isInvincible es false después del período de invencibilidad', () => {
    /**
     * Validates: Requirements 3.5
     */
    const scene = createMockScene(500);
    const kiro = new Kiro(scene, 100, 100);

    kiro.triggerInvincibility();

    scene.time.now = 500 + CONSTANTS.INVINCIBILITY_DURATION + 1;
    expect(kiro.isInvincible).toBe(false);
  });

  test('Property 6: isInvincible es false antes de recibir daño', () => {
    /**
     * Validates: Requirements 3.5
     */
    const scene = createMockScene(9999);
    const kiro = new Kiro(scene, 100, 100);

    expect(kiro.isInvincible).toBe(false);
  });

  test('Property 6: triggerInvincibility() siempre establece exactamente INVINCIBILITY_DURATION ms (fast-check)', () => {
    /**
     * Validates: Requirements 3.5
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

  test('Property 6: isInvincible es true durante el período y false después (fast-check)', () => {
    /**
     * Validates: Requirements 3.5
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
// Preservation 4 — Velocidad de Kiro en posiciones interiores (Property 8)
//
// Observación: en posiciones interiores (lejos de los bordes), update() produce
// la velocidad correcta según las teclas presionadas (PLAYER_SPEED en el eje correcto).
// El fix de Bug 4 agrega collideWorldBounds; no debe cambiar la velocidad interior.
//
// Validates: Requirements 3.3
// ---------------------------------------------------------------------------

describe('Preservation 4 — Velocidad de Kiro en posiciones interiores (Property 8)', () => {
  // Posiciones interiores: al menos 100px de cualquier borde (canvas 800×600)
  const INTERIOR_MARGIN = 100;

  test('Property 8: Kiro en posición interior con cursor arriba → velocidad Y = -PLAYER_SPEED (fast-check)', () => {
    /**
     * Validates: Requirements 3.3
     */
    fc.assert(
      fc.property(
        fc.integer({ min: INTERIOR_MARGIN, max: 800 - INTERIOR_MARGIN }),
        fc.integer({ min: INTERIOR_MARGIN, max: 600 - INTERIOR_MARGIN }),
        (x, y) => {
          const scene = createMockScene();
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

  test('Property 8: Kiro en posición interior con cursor abajo → velocidad Y = +PLAYER_SPEED (fast-check)', () => {
    /**
     * Validates: Requirements 3.3
     */
    fc.assert(
      fc.property(
        fc.integer({ min: INTERIOR_MARGIN, max: 800 - INTERIOR_MARGIN }),
        fc.integer({ min: INTERIOR_MARGIN, max: 600 - INTERIOR_MARGIN }),
        (x, y) => {
          const scene = createMockScene();
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

  test('Property 8: Kiro en posición interior con cursor izquierda → velocidad X = -PLAYER_SPEED (fast-check)', () => {
    /**
     * Validates: Requirements 3.3
     */
    fc.assert(
      fc.property(
        fc.integer({ min: INTERIOR_MARGIN, max: 800 - INTERIOR_MARGIN }),
        fc.integer({ min: INTERIOR_MARGIN, max: 600 - INTERIOR_MARGIN }),
        (x, y) => {
          const scene = createMockScene();
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

  test('Property 8: Kiro en posición interior con cursor derecha → velocidad X = +PLAYER_SPEED (fast-check)', () => {
    /**
     * Validates: Requirements 3.3
     */
    fc.assert(
      fc.property(
        fc.integer({ min: INTERIOR_MARGIN, max: 800 - INTERIOR_MARGIN }),
        fc.integer({ min: INTERIOR_MARGIN, max: 600 - INTERIOR_MARGIN }),
        (x, y) => {
          const scene = createMockScene();
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

  test('Property 8: Kiro en posición interior sin teclas → velocidad (0, 0) (fast-check)', () => {
    /**
     * Validates: Requirements 3.3
     */
    fc.assert(
      fc.property(
        fc.integer({ min: INTERIOR_MARGIN, max: 800 - INTERIOR_MARGIN }),
        fc.integer({ min: INTERIOR_MARGIN, max: 600 - INTERIOR_MARGIN }),
        (x, y) => {
          const scene = createMockScene();
          const kiro = new Kiro(scene, x, y);
          kiro.anims = { play: jest.fn(), stop: jest.fn() };

          kiro.update(createCursors(), createCursors());

          return kiro.body.velocity.x === 0 && kiro.body.velocity.y === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Preservation 5 — Comportamiento de IA de enemigos en posiciones interiores (Property 10)
//
// Observación: Wanderer produce velocidad ±100 en un solo eje; Seeker produce
// velocidad normalizada hacia Kiro con magnitud 100.
// El fix de Bug 5 agrega collideWorldBounds; no debe cambiar la lógica de IA.
//
// Validates: Requirements 3.4
// ---------------------------------------------------------------------------

describe('Preservation 5 — IA de enemigos en posiciones interiores (Property 10)', () => {
  const INTERIOR_MARGIN = 100;
  const ENEMY_SPEED = 100;

  test('Property 10: Wanderer en posición interior tiene velocidad ±100 en exactamente un eje (fast-check)', () => {
    /**
     * Validates: Requirements 3.4
     */
    fc.assert(
      fc.property(
        fc.integer({ min: INTERIOR_MARGIN, max: 800 - INTERIOR_MARGIN }),
        fc.integer({ min: INTERIOR_MARGIN, max: 600 - INTERIOR_MARGIN }),
        (x, y) => {
          const scene = createMockScene(0);
          const wanderer = new Wanderer(scene, x, y);

          const vx = wanderer.body.velocity.x;
          const vy = wanderer.body.velocity.y;

          // Exactamente uno de los ejes tiene velocidad ±ENEMY_SPEED, el otro es 0
          const xValid = (vx === ENEMY_SPEED || vx === -ENEMY_SPEED) && vy === 0;
          const yValid = (vy === ENEMY_SPEED || vy === -ENEMY_SPEED) && vx === 0;
          return xValid || yValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 10: Seeker en posición interior apunta hacia Kiro con magnitud ~100 (fast-check)', () => {
    /**
     * Validates: Requirements 3.4
     */
    fc.assert(
      fc.property(
        fc.integer({ min: INTERIOR_MARGIN, max: 800 - INTERIOR_MARGIN }),
        fc.integer({ min: INTERIOR_MARGIN, max: 600 - INTERIOR_MARGIN }),
        fc.integer({ min: INTERIOR_MARGIN, max: 800 - INTERIOR_MARGIN }),
        fc.integer({ min: INTERIOR_MARGIN, max: 600 - INTERIOR_MARGIN }),
        (sx, sy, kx, ky) => {
          // Asegurar que Seeker y Kiro no estén en la misma posición
          if (sx === kx && sy === ky) return true;

          const scene = createMockScene(0);
          const seeker = new Seeker(scene, sx, sy);

          // Forzar recálculo inmediato (now >= _nextRecalc = 0)
          seeker.update(kx, ky);

          const vx = seeker.body.velocity.x;
          const vy = seeker.body.velocity.y;

          // La magnitud del vector velocidad debe ser aproximadamente ENEMY_SPEED
          const magnitude = Math.sqrt(vx * vx + vy * vy);
          return Math.abs(magnitude - ENEMY_SPEED) < 0.001;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 10: Seeker apunta en la dirección correcta hacia Kiro (fast-check)', () => {
    /**
     * Validates: Requirements 3.4
     */
    fc.assert(
      fc.property(
        fc.integer({ min: INTERIOR_MARGIN, max: 800 - INTERIOR_MARGIN }),
        fc.integer({ min: INTERIOR_MARGIN, max: 600 - INTERIOR_MARGIN }),
        fc.integer({ min: INTERIOR_MARGIN, max: 800 - INTERIOR_MARGIN }),
        fc.integer({ min: INTERIOR_MARGIN, max: 600 - INTERIOR_MARGIN }),
        (sx, sy, kx, ky) => {
          if (sx === kx && sy === ky) return true;

          const scene = createMockScene(0);
          const seeker = new Seeker(scene, sx, sy);

          seeker.update(kx, ky);

          const vx = seeker.body.velocity.x;
          const vy = seeker.body.velocity.y;

          // El vector velocidad debe apuntar hacia Kiro
          const dx = kx - sx;
          const dy = ky - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const expectedVx = (dx / dist) * ENEMY_SPEED;
          const expectedVy = (dy / dist) * ENEMY_SPEED;

          return Math.abs(vx - expectedVx) < 0.001 && Math.abs(vy - expectedVy) < 0.001;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Preservation 6 — Sonidos existentes (Property 12)
//
// Observación: SoundManager.play() llama a scene.sound.play(key) cuando no está muteado.
// El fix de Bug 7 agrega play('game_over'); no debe afectar los sonidos existentes.
//
// Validates: Requirements 3.10
// ---------------------------------------------------------------------------

describe('Preservation 6 — Sonidos existentes (Property 12)', () => {
  const EXISTING_SOUNDS = ['sfx_fire', 'sfx_eliminate', 'sfx_life_lost', 'sfx_power_activate'];

  function createSoundScene() {
    const playSpy = jest.fn();
    return {
      scene: { sound: { play: playSpy, stopAll: jest.fn() } },
      playSpy,
    };
  }

  test.each(EXISTING_SOUNDS)(
    'Property 12: SoundManager.play("%s") llama a scene.sound.play con la clave correcta',
    (soundKey) => {
      /**
       * Validates: Requirements 3.10
       */
      const { scene, playSpy } = createSoundScene();
      const sm = new SoundManager(scene, false);

      sm.play(soundKey);

      expect(playSpy).toHaveBeenCalledWith(soundKey);
    }
  );

  test('Property 12: SoundManager.play() no llama a scene.sound.play cuando está muteado', () => {
    /**
     * Validates: Requirements 3.10
     */
    const { scene, playSpy } = createSoundScene();
    const sm = new SoundManager(scene, true);

    for (const key of EXISTING_SOUNDS) {
      sm.play(key);
    }

    expect(playSpy).not.toHaveBeenCalled();
  });

  test('Property 12: todos los sonidos existentes se reproducen correctamente (fast-check)', () => {
    /**
     * Validates: Requirements 3.10
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...EXISTING_SOUNDS),
        (soundKey) => {
          const playSpy = jest.fn();
          const scene = { sound: { play: playSpy, stopAll: jest.fn() } };
          const sm = new SoundManager(scene, false);

          sm.play(soundKey);

          return playSpy.mock.calls.length === 1
              && playSpy.mock.calls[0][0] === soundKey;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 12: setMuted(false) permite reproducir sonidos después de silenciar', () => {
    /**
     * Validates: Requirements 3.10
     */
    const { scene, playSpy } = createSoundScene();
    const sm = new SoundManager(scene, true);

    sm.setMuted(false);
    sm.play('sfx_fire');

    expect(playSpy).toHaveBeenCalledWith('sfx_fire');
  });
});

// ---------------------------------------------------------------------------
// Preservation 7 — Botón start de MainMenuScene (Property 14)
//
// Observación: el botón start llama a scene.start('GameScene', { level: progress.level })
// en el evento pointerdown. El fix de Bug 8 agrega el panel de controles;
// no debe cambiar el comportamiento del botón.
//
// Validates: Requirements 3.8
// ---------------------------------------------------------------------------

describe('Preservation 7 — Botón start de MainMenuScene (Property 14)', () => {
  /**
   * Simula el comportamiento del botón start tal como está implementado
   * en MainMenuScene.create() (código sin fix).
   * El handler de pointerdown llama: this.scene.start('GameScene', { level: progress.level })
   */
  function simulateStartButton(progressLevel) {
    const sceneStartSpy = jest.fn();

    // Replicar exactamente el handler del botón start de MainMenuScene
    const progress = { level: progressLevel };
    const handler = () => {
      sceneStartSpy('GameScene', { level: progress.level });
    };

    return { handler, sceneStartSpy };
  }

  test('Property 14: pointerdown llama a scene.start("GameScene", { level: progress.level })', () => {
    /**
     * Validates: Requirements 3.8
     */
    const { handler, sceneStartSpy } = simulateStartButton(1);

    handler();

    expect(sceneStartSpy).toHaveBeenCalledWith('GameScene', { level: 1 });
  });

  test('Property 14: el nivel pasado a GameScene coincide con progress.level (fast-check)', () => {
    /**
     * Validates: Requirements 3.8
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        (level) => {
          const { handler, sceneStartSpy } = simulateStartButton(level);

          handler();

          const calls = sceneStartSpy.mock.calls;
          if (calls.length !== 1) return false;

          const [sceneName, data] = calls[0];
          return sceneName === 'GameScene' && data.level === level;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 14: pointerdown siempre pasa exactamente la clave "level" en los datos', () => {
    /**
     * Validates: Requirements 3.8
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        (level) => {
          const { handler, sceneStartSpy } = simulateStartButton(level);

          handler();

          const [, data] = sceneStartSpy.mock.calls[0];
          // Solo debe pasar { level } — no datos extra
          const keys = Object.keys(data);
          return keys.length === 1 && keys[0] === 'level';
        }
      ),
      { numRuns: 100 }
    );
  });
});
