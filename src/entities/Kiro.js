/**
 * Entidad principal del jugador: el fantasma Kiro.
 * Extiende Phaser.Physics.Arcade.Sprite para integrarse con el sistema de física arcade.
 *
 * Patrón de compatibilidad: si Phaser no está disponible (entorno Node/Jest),
 * se extiende una clase base mínima para permitir pruebas unitarias.
 */

import { CONSTANTS } from '../config/constants.js';

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

export class Kiro extends BaseSprite {
  /**
   * @param {Phaser.Scene} scene - La escena de Phaser que contiene a Kiro
   * @param {number} x - Posición inicial en el eje X
   * @param {number} y - Posición inicial en el eje Y
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'kiro');

    // Referencia a la escena para acceder al reloj y otros sistemas
    this.scene = scene;

    // Dirección actual de Kiro; por defecto mira hacia abajo
    this._facing = 'down';

    // Marca de tiempo hasta la cual Kiro es invencible (0 = no invencible)
    this._invincibleUntil = 0;

    // Registrar el sprite en la escena y habilitar la física
    if (scene && scene.add) {
      if (typeof Phaser !== 'undefined') {
        scene.add.existing(this);
      }
      if (scene.physics && scene.physics.add) {
        scene.physics.add.existing(this);
      }
    }

    // Evitar que Kiro salga de los límites del mundo
    if (this.body && typeof this.body.setCollideWorldBounds === 'function') {
      this.body.setCollideWorldBounds(true);
    }
  }

  /**
   * Procesa el input del jugador y actualiza velocidad y animación.
   * Debe llamarse en el método update() de la escena.
   *
   * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors - Teclas de dirección
   * @param {object} wasd - Teclas WASD { up, down, left, right }
   */
  update(cursors, wasd) {
    // Reiniciar velocidad en cada frame
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;

    // Determinar si alguna tecla de movimiento está presionada
    const movingUp    = (cursors && cursors.up    && cursors.up.isDown)    || (wasd && wasd.up    && wasd.up.isDown);
    const movingDown  = (cursors && cursors.down  && cursors.down.isDown)  || (wasd && wasd.down  && wasd.down.isDown);
    const movingLeft  = (cursors && cursors.left  && cursors.left.isDown)  || (wasd && wasd.left  && wasd.left.isDown);
    const movingRight = (cursors && cursors.right && cursors.right.isDown) || (wasd && wasd.right && wasd.right.isDown);

    if (movingUp) {
      this.body.velocity.y = -CONSTANTS.PLAYER_SPEED;
      this._facing = 'up';
      this.anims.play('kiro-walk-up', true);
    } else if (movingDown) {
      this.body.velocity.y = CONSTANTS.PLAYER_SPEED;
      this._facing = 'down';
      this.anims.play('kiro-walk-down', true);
    } else if (movingLeft) {
      this.body.velocity.x = -CONSTANTS.PLAYER_SPEED;
      this._facing = 'left';
      this.anims.play('kiro-walk-left', true);
    } else if (movingRight) {
      this.body.velocity.x = CONSTANTS.PLAYER_SPEED;
      this._facing = 'right';
      this.anims.play('kiro-walk-right', true);
    } else {
      // Sin movimiento: detener animación y reproducir idle
      this.anims.stop();
      this.anims.play('kiro-idle', true);
    }
  }

  /**
   * Activa el período de invencibilidad de 3 segundos.
   * Se llama cuando Kiro recibe daño de un enemigo.
   */
  triggerInvincibility() {
    this._invincibleUntil = this.scene.time.now + CONSTANTS.INVINCIBILITY_DURATION;
  }

  /**
   * Indica si Kiro está actualmente en período de invencibilidad.
   * @returns {boolean}
   */
  get isInvincible() {
    return this.scene.time.now < this._invincibleUntil;
  }

  /**
   * Dirección actual hacia la que mira Kiro.
   * @returns {'up'|'down'|'left'|'right'}
   */
  get facing() {
    return this._facing;
  }
}
