/**
 * Module — objeto crítico del tablero que debe ser protegido de los bugs.
 * Cuando su integridad llega a cero, se invoca el callback de destrucción
 * para que la escena gestione la condición de fallo de nivel.
 */

// Clase base mínima para entornos sin Phaser (tests con Jest)
const BaseSprite = (typeof Phaser !== 'undefined')
  ? Phaser.Physics.Arcade.Sprite
  : class {
      constructor() {
        this.body = { velocity: { x: 0, y: 0 } };
      }
    };

export class Module extends BaseSprite {
  /**
   * @param {Phaser.Scene} scene - La escena de Phaser que contiene al módulo
   * @param {number} x - Posición inicial en el eje X
   * @param {number} y - Posición inicial en el eje Y
   * @param {number} integrity - Puntos de integridad iniciales (por defecto 3)
   * @param {Function|null} onDestroyed - Callback invocado cuando la integridad llega a cero
   */
  constructor(scene, x, y, integrity = 3, onDestroyed = null) {
    super(scene, x, y, 'module');
    this.x = x;
    this.y = y;

    // Integridad actual del módulo
    this._integrity = integrity;

    // Callback opcional invocado cuando el módulo es destruido (integridad = 0)
    this._onDestroyed = onDestroyed;

    // Registrar el sprite en la escena y habilitar la física si Phaser está disponible
    if (typeof Phaser !== 'undefined' && scene && scene.add) {
      scene.add.existing(this);
      scene.physics.add.existing(this);
    }
  }

  /**
   * Integridad actual del módulo.
   * @returns {number}
   */
  get integrity() {
    return this._integrity;
  }

  /**
   * Reduce la integridad del módulo en 1 unidad.
   * Si la integridad llega a cero, invoca el callback de destrucción.
   */
  hit() {
    this._integrity -= 1;

    // Si la integridad llegó a cero, notificar a la escena para gestionar el fallo de nivel
    if (this._integrity <= 0 && typeof this._onDestroyed === 'function') {
      this._onDestroyed();
    }
  }
}
