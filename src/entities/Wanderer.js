/**
 * Wanderer — enemigo que se mueve en direcciones aleatorias.
 * Cambia de dirección cada 1–3 segundos de forma aleatoria.
 * Extiende la clase base Bug.
 */

import { Bug } from './Bug.js';
import { CONSTANTS } from '../config/constants.js';

// Velocidad de movimiento de los enemigos en píxeles por segundo
const ENEMY_SPEED = 100;

// Direcciones posibles de movimiento
const DIRECTIONS = ['up', 'down', 'left', 'right'];

export class Wanderer extends Bug {
  /**
   * @param {Phaser.Scene} scene - La escena de Phaser que contiene al enemigo
   * @param {number} x - Posición inicial en el eje X
   * @param {number} y - Posición inicial en el eje Y
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'wanderer');

    // Marca de tiempo en la que se realizará el próximo cambio de dirección
    this._nextDirectionChange = 0;

    // Intervalo actual de cambio de dirección (almacenado para pruebas)
    this._dirChangeInterval = 0;

    // Elegir una dirección inicial aleatoria
    this._pickNewDirection();
  }

  /**
   * Valor en puntos que otorga eliminar este enemigo.
   * @returns {number}
   */
  get pointValue() {
    return CONSTANTS.POINTS_WANDERER;
  }

  /**
   * Actualiza el comportamiento del Wanderer en cada frame.
   * Si el tiempo actual supera _nextDirectionChange, elige una nueva dirección.
   */
  update() {
    const now = this.scene && this.scene.time ? this.scene.time.now : 0;
    if (now >= this._nextDirectionChange) {
      this._pickNewDirection();
    }
  }

  /**
   * Elige una nueva dirección aleatoria y reinicia el temporizador de cambio.
   * Genera un intervalo aleatorio entre WANDERER_DIR_CHANGE_MIN y WANDERER_DIR_CHANGE_MAX.
   */
  _pickNewDirection() {
    const min = CONSTANTS.WANDERER_DIR_CHANGE_MIN;
    const max = CONSTANTS.WANDERER_DIR_CHANGE_MAX;
    this._dirChangeInterval = Math.floor(Math.random() * (max - min + 1)) + min;

    const now = this.scene && this.scene.time ? this.scene.time.now : 0;
    this._nextDirectionChange = now + this._dirChangeInterval;

    const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

    switch (direction) {
      case 'up':
        this.body.velocity.x = 0;
        this.body.velocity.y = -ENEMY_SPEED;
        break;
      case 'down':
        this.body.velocity.x = 0;
        this.body.velocity.y = ENEMY_SPEED;
        break;
      case 'left':
        this.body.velocity.x = -ENEMY_SPEED;
        this.body.velocity.y = 0;
        break;
      case 'right':
        this.body.velocity.x = ENEMY_SPEED;
        this.body.velocity.y = 0;
        break;
    }
  }
}
