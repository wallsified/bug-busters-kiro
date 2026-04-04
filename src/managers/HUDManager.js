/**
 * Gestiona el HUD (heads-up display) del juego.
 * Muestra puntuación, vidas, nivel actual y estado de los poderes especiales.
 * Todos los elementos están anclados a la cámara para que no se desplacen con el mundo.
 */
export class HUDManager {
  /**
   * @param {Phaser.Scene} scene - La escena de Phaser activa.
   */
  constructor(scene) {
    this._scene = scene;

    // Estilo de fuente común para todos los elementos del HUD
    const textStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      fill: '#ffffff'
    };

    if (scene.add) {
      // Crear textos del HUD y anclarlos a la cámara (scrollFactor 0)
      this._scoreText = scene.add.text(16, 16, 'SCORE: 0', textStyle).setScrollFactor(0);
      this._livesText = scene.add.text(16, 40, 'LIVES: 3', textStyle).setScrollFactor(0);
      this._levelText = scene.add.text(16, 64, 'LEVEL: 1', textStyle).setScrollFactor(0);

      // Textos de estado de poderes, posicionados en la parte superior derecha
      this._freezeText = scene.add.text(400, 16, '', textStyle).setScrollFactor(0);
      this._patchBombText = scene.add.text(400, 40, '', textStyle).setScrollFactor(0);
    } else {
      // Entorno de pruebas sin Phaser: almacenar null para evitar errores
      this._scoreText = null;
      this._livesText = null;
      this._levelText = null;
      this._freezeText = null;
      this._patchBombText = null;
    }
  }

  /**
   * Actualiza todos los elementos del HUD en cada frame.
   * @param {number} score - Puntuación actual del jugador.
   * @param {number} lives - Vidas restantes del jugador.
   * @param {number} level - Nivel actual del juego.
   * @param {Object} powerState - Estado de los poderes: { freeze: PowerState, patch_bomb: PowerState }
   */
  update(score, lives, level, powerState) {
    if (this._scoreText) this._scoreText.setText(`SCORE: ${score}`);
    if (this._livesText) this._livesText.setText(`LIVES: ${lives}`);
    if (this._levelText) this._levelText.setText(`LEVEL: ${level}`);

    if (powerState) {
      if (this._freezeText) {
        this._freezeText.setText(this._buildPowerText('FREEZE', powerState.freeze));
        this._applyPowerColor(this._freezeText, powerState.freeze);
      }
      if (this._patchBombText) {
        this._patchBombText.setText(this._buildPowerText('PATCH_BOMB', powerState.patch_bomb));
        this._applyPowerColor(this._patchBombText, powerState.patch_bomb);
      }
    }
  }

  /**
   * Construye el texto a mostrar para un poder según su estado.
   * @param {string} name - Nombre del poder a mostrar.
   * @param {Object} state - Estado del poder.
   * @returns {string}
   */
  _buildPowerText(name, state) {
    if (!state || !state.unlocked) return '';
    if (state.onCooldown) return `${name}: ${state.remainingCooldown}s`;
    return name;
  }

  /**
   * Aplica el color correspondiente al texto de un poder según su estado.
   * @param {Phaser.GameObjects.Text} textObj - Objeto de texto de Phaser.
   * @param {Object} state - Estado del poder.
   */
  _applyPowerColor(textObj, state) {
    if (!textObj || !state || !state.unlocked) return;
    textObj.setStyle({ fill: state.onCooldown ? '#888888' : '#00ff00' });
  }
}
