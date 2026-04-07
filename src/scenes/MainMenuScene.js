/**
 * MainMenuScene — pantalla principal del juego.
 * Muestra el título animado, el high score guardado y un botón para iniciar la partida.
 * Incluye fondo desplazable en diagonal, overlay de scanlines y shader CRT.
 */

import { ProgressManager } from '../managers/ProgressManager.js';
import { createScanlineOverlay } from '../managers/EffectsManager.js';
import { CRTShader } from '../shaders/CRTShader.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Cargar el progreso guardado para mostrar el high score
    const progress = new ProgressManager().load();

    // Fondo negro
    this.cameras.main.setBackgroundColor('#000000');

    // Fondo de tiles desplazable en diagonal
    this._bg = this.add.tileSprite(0, 0, width, height, 'tileset').setOrigin(0, 0);

    // Título del juego centrado en la parte superior
    const titleText = this.add.text(width / 2, height / 2 - 100, 'BUG BUSTERS', {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      fill: '#00ff00',
    }).setOrigin(0.5);

    // Tween de pulso de escala sobre el título
    this.tweens.add({
      targets: titleText,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Mostrar el high score restaurado desde ProgressManager
    this.add.text(width / 2, height / 2 - 40, `HIGH SCORE: ${progress.score}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      fill: '#ffffff',
    }).setOrigin(0.5);

    // Botón de inicio interactivo
    const startBtn = this.add.text(width / 2, height / 2 + 40, 'PRESS START', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      fill: '#ffff00',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Al hacer clic, iniciar GameScene con los datos del nivel guardado
    startBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { level: progress.level });
    });

    // Efecto de parpadeo para llamar la atención sobre el botón
    this.tweens.add({
      targets: startBtn,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Panel de controles debajo del botón de inicio
    this.add.text(width / 2, 420, 'MOVE: ARROW KEYS / WASD\nFIRE: SPACE / CLICK\nFREEZE: Q\nPATCH BOMB: E', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#aaaaaa',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    // Overlay de scanlines sobre todos los elementos
    createScanlineOverlay(this);

    // Aplicar el shader CRT si el renderer es WebGL
    if (this.renderer && this.renderer.type === Phaser.WEBGL) {
      this.cameras.main.setPostPipeline(CRTShader);
    }
  }

  /**
   * Bucle de actualización: desplaza el fondo en diagonal a 20 px/s.
   * @param {number} time - Tiempo total transcurrido en ms.
   * @param {number} delta - Tiempo transcurrido desde el último frame en ms.
   */
  update(time, delta) {
    // Desplazar el fondo en diagonal a 20 px/s
    this._bg.tilePositionX += delta * 0.02;
    this._bg.tilePositionY += delta * 0.02;
  }
}
