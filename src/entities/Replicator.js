/**
 * Replicator — enemigo que genera nuevos Wanderers periódicamente.
 * Cada 8 segundos genera un Wanderer en su posición actual, hasta un máximo de 3.
 * Extiende la clase base Bug.
 */

import { Bug } from './Bug.js';
import { CONSTANTS } from '../config/constants.js';

export class Replicator extends Bug {
  /**
   * @param {Phaser.Scene} scene - La escena de Phaser que contiene al enemigo
   * @param {number} x - Posición inicial en el eje X
   * @param {number} y - Posición inicial en el eje Y
   * @param {Function|null} onSpawn - Callback(x, y) invocado al generar un Wanderer
   */
  constructor(scene, x, y, onSpawn = null) {
    super(scene, x, y, 'replicator');
    this.x = x;
    this.y = y;

    // Contador de Wanderers generados hasta el momento
    this._spawnCount = 0;

    // Marca de tiempo del próximo spawn; 0 para disparar inmediatamente en el primer update
    this._nextSpawn = 0;

    // Callback opcional invocado cuando se genera un Wanderer (útil para tests e integración)
    this._onSpawn = onSpawn;
  }

  /**
   * Valor en puntos que otorga eliminar este enemigo.
   * @returns {number}
   */
  get pointValue() {
    return CONSTANTS.POINTS_REPLICATOR;
  }

  /**
   * Número de Wanderers generados hasta el momento.
   * @returns {number}
   */
  get spawnCount() {
    return this._spawnCount;
  }

  /**
   * Actualiza el comportamiento del Replicator en cada frame.
   * Si el tiempo actual supera _nextSpawn y no se alcanzó el límite, genera un Wanderer.
   * @param {Phaser.Scene} scene - La escena activa (se usa scene.time.now para el reloj)
   */
  update(scene) {
    const now = (scene && scene.time) ? scene.time.now
      : (this.scene && this.scene.time) ? this.scene.time.now
      : 0;

    if (now >= this._nextSpawn && this._spawnCount < CONSTANTS.REPLICATOR_MAX_SPAWNS) {
      // Incrementar el contador de spawns
      this._spawnCount++;

      // Programar el próximo spawn
      this._nextSpawn = now + CONSTANTS.REPLICATOR_SPAWN_INTERVAL;

      // Notificar a la escena para que cree el Wanderer en la posición actual
      if (typeof this._onSpawn === 'function') {
        this._onSpawn(this.x, this.y);
      }
    }
  }
}
