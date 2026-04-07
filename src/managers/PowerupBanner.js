import { CONSTANTS } from '../config/constants.js';

/**
 * Muestra un mensaje de powerup centrado en pantalla durante POWERUP_BANNER_DURATION ms.
 * Clase auxiliar ligera que envuelve un único Phaser.GameObjects.Text.
 */
export class PowerupBanner {
  /**
   * @param {Phaser.Scene} scene - La escena de Phaser activa.
   */
  constructor(scene) {
    this._scene = scene;
    // Timer pendiente de auto-ocultamiento
    this._timer = null;

    if (scene && scene.add) {
      const { width, height } = scene.scale;
      this._text = scene.add.text(width / 2, height / 2, '', {
        fontFamily: '"Press Start 2P"',
        fontSize: '20px',
        fill: '#ffff00',
      })
        .setOrigin(0.5)
        .setDepth(500)
        .setScrollFactor(0)
        .setVisible(false);
    } else {
      // Entorno de pruebas sin Phaser
      this._text = {
        _text: '',
        _visible: false,
        _depth: 500,
        _scrollFactor: 0,
        setText(t) { this._text = t; return this; },
        setVisible(v) { this._visible = v; return this; },
        setOrigin() { return this; },
        setDepth(d) { this._depth = d; return this; },
        setScrollFactor(f) { this._scrollFactor = f; return this; },
      };
    }
  }

  /**
   * Muestra el banner con el texto indicado y reinicia el temporizador de auto-ocultamiento.
   * Si ya hay un timer pendiente, lo cancela antes de iniciar uno nuevo.
   * @param {string} text - Texto a mostrar en el banner.
   */
  show(text) {
    // Cancelar timer previo si existe
    if (this._timer) {
      if (typeof this._timer.remove === 'function') {
        this._timer.remove(false);
      }
      this._timer = null;
    }

    this._text.setText(text);
    this._text.setVisible(true);

    // Iniciar nuevo timer de auto-ocultamiento
    if (this._scene && this._scene.time) {
      this._timer = this._scene.time.delayedCall(
        CONSTANTS.POWERUP_BANNER_DURATION,
        () => { this.hide(); }
      );
    }
  }

  /**
   * Oculta el banner inmediatamente.
   */
  hide() {
    this._text.setVisible(false);
  }
}
