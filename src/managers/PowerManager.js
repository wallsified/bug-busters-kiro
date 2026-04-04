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
   */
  checkUnlocks(score) {
    if (!this._powers.freeze.unlocked && score >= CONSTANTS.POWER_UNLOCK_FREEZE) {
      this._powers.freeze.unlocked = true;
    }
    if (!this._powers.patch_bomb.unlocked && score >= CONSTANTS.POWER_UNLOCK_PATCH_BOMB) {
      this._powers.patch_bomb.unlocked = true;
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
   * @returns {{ freeze: PowerState, patch_bomb: PowerState }}
   */
  getState() {
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
    return {
      freeze: buildState(this._powers.freeze),
      patch_bomb: buildState(this._powers.patch_bomb)
    };
  }

  /**
   * Marca de tiempo hasta la que el efecto Freeze está activo.
   * @returns {number}
   */
  get freezeUntil() {
    return this._freezeUntil;
  }
}
