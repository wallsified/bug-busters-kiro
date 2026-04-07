/**
 * Clase base para todos los enemigos del juego Bug Busters.
 * Extiende Phaser.Physics.Arcade.Sprite para integrarse con el sistema de física arcade.
 *
 * Patrón de compatibilidad: si Phaser no está disponible (entorno Node/Jest),
 * se extiende una clase base mínima para permitir pruebas unitarias.
 *
 * Las subclases DEBEN implementar el getter `pointValue` y el método `update()`.
 */

// Clase base mínima para entornos sin Phaser (tests con Jest)
const BaseSprite = (typeof Phaser !== 'undefined')
  ? Phaser.Physics.Arcade.Sprite
  : class {
      constructor() {
        // Simula el cuerpo físico de Phaser para pruebas
        this.body = { velocity: { x: 0, y: 0 } };
        this.anims = {
          play: () => {},
          stop: () => {}
        };
      }
    };

export class Bug extends BaseSprite {
  /**
   * @param {Phaser.Scene} scene - La escena de Phaser que contiene al enemigo
   * @param {number} x - Posición inicial en el eje X
   * @param {number} y - Posición inicial en el eje Y
   * @param {string} texture - Clave del sprite a utilizar
   */
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);

    // Referencia a la escena para acceder al reloj y otros sistemas
    this.scene = scene;

    // Almacenar la clave de textura para acceso en pruebas y lógica de juego
    this.texture = texture;

    // Registrar el sprite en la escena y habilitar la física
    if (scene && scene.add) {
      if (typeof Phaser !== 'undefined') {
        scene.add.existing(this);
      }
      if (scene.physics && scene.physics.add) {
        scene.physics.add.existing(this);
      }
    }

    // Evitar que el enemigo salga de los límites del mundo
    if (this.body && typeof this.body.setCollideWorldBounds === 'function') {
      this.body.setCollideWorldBounds(true);
    }
  }

  /**
   * Valor en puntos que otorga eliminar este enemigo.
   * Las subclases DEBEN sobreescribir este getter.
   *
   * @returns {number}
   * @throws {Error} Si la subclase no implementa este getter
   */
  get pointValue() {
    throw new Error('Bug subclass must implement pointValue');
  }

  /**
   * Lógica de movimiento y comportamiento del enemigo.
   * Las subclases DEBEN sobreescribir este método.
   *
   * @param {number} kiroX - Posición X actual de Kiro
   * @param {number} kiroY - Posición Y actual de Kiro
   * @throws {Error} Si la subclase no implementa este método
   */
  update(kiroX, kiroY) {
    throw new Error('Bug subclass must implement update()');
  }
}
