/**
 * Seeker — enemigo que persigue activamente a Kiro.
 * Recalcula la dirección hacia Kiro cada 500ms.
 * Extiende la clase base Bug.
 */

import { Bug } from './Bug.js';
import { CONSTANTS } from '../config/constants.js';

// Velocidad de movimiento de los enemigos en píxeles por segundo
const ENEMY_SPEED = 100;

export class Seeker extends Bug {
  /**
   * @param {Phaser.Scene} scene - La escena de Phaser que contiene al enemigo
   * @param {number} x - Posición inicial en el eje X
   * @param {number} y - Posición inicial en el eje Y
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'seeker');

    // Posición actual del Seeker (almacenada como propiedad para testabilidad sin Phaser)
    this.x = x;
    this.y = y;

    // Marca de tiempo en la que se realizará el próximo recálculo de ruta
    this._nextRecalc = 0;
  }

  /**
   * Valor en puntos que otorga eliminar este enemigo.
   * @returns {number}
   */
  get pointValue() {
    return CONSTANTS.POINTS_SEEKER;
  }

  /**
   * Actualiza el comportamiento del Seeker en cada frame.
   * Cuando el tiempo actual supera _nextRecalc, recalcula la dirección hacia Kiro.
   *
   * @param {number} kiroX - Posición X actual de Kiro
   * @param {number} kiroY - Posición Y actual de Kiro
   */
  update(kiroX, kiroY) {
    const now = this.scene && this.scene.time ? this.scene.time.now : 0;

    if (now >= this._nextRecalc) {
      // Calcular el vector de dirección normalizado hacia Kiro
      const dx = kiroX - this.x;
      const dy = kiroY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        this.body.velocity.x = (dx / dist) * ENEMY_SPEED;
        this.body.velocity.y = (dy / dist) * ENEMY_SPEED;
      }

      // Reiniciar el temporizador de recálculo
      this._nextRecalc = now + CONSTANTS.SEEKER_RECALC_INTERVAL;
    }
  }
}
