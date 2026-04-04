/**
 * MainMenuScene — pantalla principal del juego.
 * Muestra el título, el high score guardado y un botón para iniciar la partida.
 */

import { ProgressManager } from '../managers/ProgressManager.js';

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

    // Título del juego centrado en la parte superior
    this.add.text(width / 2, height / 2 - 100, 'BUG BUSTERS', {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      fill: '#00ff00',
    }).setOrigin(0.5);

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
  }
}
