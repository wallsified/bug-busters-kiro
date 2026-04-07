import { CONSTANTS } from '../config/constants.js';

/**
 * Gestiona el estado, desbloqueo y activación de los poderes especiales del juego.
 * Los poderes disponibles son: Freeze (congela todos los bugs) y Patch_Bomb (elimina bugs en radio).
 */
export class PowerManager {
  /**
   * @param {Phaser.Scene} scene - La escena de Phaser activa, usada para acceder al tiempo actual.
   */
  constructor(scene) {
    this._scene = scene;

    // Último score en que cada powerup automático fue disparado (para deduplicación)
    this._lastTriggered = { blastABug: -1, bugFreeZone: -1, extraLife: -1 };

    // Timestamp hasta el que Blast-a-Bug está activo (0 = inactivo)
    this._blastABugUntil = 0;

    // Estado interno de cada poder: desbloqueado, tiempo de fin de cooldown y duración del cooldown
    this._powers = {
      freeze: {
        unlocked: false,
        cooldownUntil: 0,
        cooldownDuration: CONSTANTS.FREEZE_COOLDOWN
      },
      patch_bomb: {
        unlocked: false,
        cooldownUntil: 0,
        cooldownDuration: CONSTANTS.PATCH_BOMB_COOLDOWN
      }
    };

    // Marca de tiempo hasta la que el efecto Freeze está activo
    this._freezeUntil = 0;
  }

  /**
   * Verifica si el puntaje actual desbloquea nuevos poderes.
   * @param {number} score - Puntaje actual del jugador.
   * @param {SoundManager} [soundManager] - Manager de sonido para reproducir sfx_power_unlock.
   */
  checkUnlocks(score, soundManager) {
    if (!this._powers.freeze.unlocked && score >= CONSTANTS.POWER_UNLOCK_FREEZE) {
      this._powers.freeze.unlocked = true;
      if (soundManager) soundManager.play('sfx_power_unlock');
    }
    if (!this._powers.patch_bomb.unlocked && score >= CONSTANTS.POWER_UNLOCK_PATCH_BOMB) {
      this._powers.patch_bomb.unlocked = true;
      if (soundManager) soundManager.play('sfx_power_unlock');
    }
  }

  /**
   * Intenta activar un poder por nombre.
   * @param {string} powerName - 'freeze' o 'patch_bomb'
   * @param {{ x: number, y: number }} kiroPosition - Posición actual de Kiro
   * @param {Array} bugs - Lista de bugs activos
   * @param {Function} [onBugEliminated] - Callback opcional para cada bug eliminado por Patch_Bomb
   * @returns {boolean} true si el poder fue activado
   */
  activate(powerName, kiroPosition, bugs, onBugEliminated) {
    const power = this._powers[powerName];
    if (!power || !power.unlocked) return false;

    const now = this._scene.time.now;
    if (now < power.cooldownUntil) return false;

    if (powerName === 'freeze') {
      // Congelar todos los bugs: establecer velocidad a cero
      for (const bug of bugs) {
        if (bug && bug.active !== false) {
          if (bug.body && typeof bug.body.setVelocity === 'function') {
            bug.body.setVelocity(0, 0);
          } else if (bug.body) {
            bug.body.velocity.x = 0;
            bug.body.velocity.y = 0;
          }
        }
      }
      this._freezeUntil = now + CONSTANTS.FREEZE_DURATION;
      power.cooldownUntil = now + power.cooldownDuration;
      return true;
    }

    if (powerName === 'patch_bomb') {
      // Eliminar bugs dentro del radio desde la posición de Kiro
      for (const bug of bugs) {
        if (!bug || bug.active === false) continue;
        const dx = bug.x - kiroPosition.x;
        const dy = bug.y - kiroPosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONSTANTS.PATCH_BOMB_RADIUS) {
          if (typeof onBugEliminated === 'function') {
            onBugEliminated(bug);
          } else if (typeof bug.destroy === 'function') {
            bug.destroy();
          } else if (typeof bug.setActive === 'function') {
            bug.setActive(false);
          }
        }
      }
      power.cooldownUntil = now + power.cooldownDuration;
      return true;
    }

    return false;
  }

  /**
   * Retorna el estado actual de todos los poderes para el HUD.
   * @param {number} [score=0] - Puntaje actual para calcular los próximos umbrales.
   * @returns {{ freeze: PowerState, patch_bomb: PowerState, blastABug: Object, nextBlastABug: number, nextBugFreeZone: number, nextExtraLife: number }}
   */
  getState(score = 0) {
    const now = this._scene.time.now;
    const buildState = (power) => {
      const onCooldown = now < power.cooldownUntil;
      const remainingMs = onCooldown ? power.cooldownUntil - now : 0;
      return {
        unlocked: power.unlocked,
        onCooldown,
        remainingCooldown: Math.ceil(remainingMs / 1000)
      };
    };

    const babActive = now < this._blastABugUntil;
    const babRemainingMs = babActive ? this._blastABugUntil - now : 0;

    return {
      freeze: buildState(this._powers.freeze),
      patch_bomb: buildState(this._powers.patch_bomb),
      blastABug: {
        active: babActive,
        remainingMs: babRemainingMs,
      },
      nextBlastABug: Math.ceil((score + 1) / CONSTANTS.POWERUP_BLAST_A_BUG_THRESHOLD) * CONSTANTS.POWERUP_BLAST_A_BUG_THRESHOLD,
      nextBugFreeZone: Math.ceil((score + 1) / CONSTANTS.POWERUP_BUG_FREE_ZONE_THRESHOLD) * CONSTANTS.POWERUP_BUG_FREE_ZONE_THRESHOLD,
      nextExtraLife: Math.ceil((score + 1) / CONSTANTS.POWERUP_EXTRA_LIFE_THRESHOLD) * CONSTANTS.POWERUP_EXTRA_LIFE_THRESHOLD,
    };
  }

  /**
   * Marca de tiempo hasta la que el efecto Freeze está activo.
   * @returns {number}
   */
  get freezeUntil() {
    return this._freezeUntil;
  }

  /**
   * Marca de tiempo hasta la que el efecto Blast-a-Bug está activo.
   * @returns {number}
   */
  get blastABugUntil() {
    return this._blastABugUntil;
  }

  /**
   * Evalúa los umbrales de powerup para el score dado y activa los que correspondan.
   * Score 0 nunca dispara ningún powerup.
   * @param {number} score - Puntaje actual del jugador.
   * @param {{ bugs: Array, kiro: Object, onLifeGained: Function, soundManager: Object, banner: Object }} ctx
   */
  checkMilestones(score, ctx) {
    if (score <= 0) return;

    const now = this._scene.time.now;
    const { bugs = [], kiro, onLifeGained, soundManager, banner } = ctx;

    // --- Blast-a-Bug: cada múltiplo de POWERUP_BLAST_A_BUG_THRESHOLD ---
    const babThreshold = CONSTANTS.POWERUP_BLAST_A_BUG_THRESHOLD;
    if (score % babThreshold === 0 && score !== this._lastTriggered.blastABug) {
      this._blastABugUntil = now + CONSTANTS.BLAST_A_BUG_DURATION;
      this._lastTriggered.blastABug = score;
      if (banner) banner.show('BLAST-A-BUG!');
      if (soundManager) soundManager.play('sfx_power_activate');
    }

    // --- Bug Free Zone: cada múltiplo de POWERUP_BUG_FREE_ZONE_THRESHOLD ---
    const bfzThreshold = CONSTANTS.POWERUP_BUG_FREE_ZONE_THRESHOLD;
    if (score % bfzThreshold === 0 && score !== this._lastTriggered.bugFreeZone) {
      this._lastTriggered.bugFreeZone = score;
      // Eliminar bugs dentro del radio desde la posición de Kiro
      if (kiro) {
        const radius = CONSTANTS.BUG_FREE_ZONE_RADIUS;
        for (const bug of bugs) {
          if (!bug || bug.active === false) continue;
          const dx = bug.x - kiro.x;
          const dy = bug.y - kiro.y;
          if (Math.sqrt(dx * dx + dy * dy) < radius) {
            bug.setActive(false);
          }
        }
      }
      if (banner) banner.show('BUG FREE ZONE!');
      if (soundManager) soundManager.play('sfx_power_activate');
    }

    // --- Extra Life: cada múltiplo de POWERUP_EXTRA_LIFE_THRESHOLD ---
    const elThreshold = CONSTANTS.POWERUP_EXTRA_LIFE_THRESHOLD;
    if (score % elThreshold === 0 && score !== this._lastTriggered.extraLife) {
      this._lastTriggered.extraLife = score;
      if (typeof onLifeGained === 'function') onLifeGained();
      if (banner) banner.show('EXTRA LIFE!');
      if (soundManager) soundManager.play('sfx_power_activate');
    }
  }
}
