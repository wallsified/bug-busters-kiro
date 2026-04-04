/**
 * LevelCompleteScene — pantalla de nivel completado.
 * Muestra el resumen del nivel, guarda el progreso y avanza al siguiente nivel o a VictoryScene.
 */

import { ProgressManager } from '../managers/ProgressManager.js';
import { LEVELS } from '../config/levels.js';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelCompleteScene' });
  }

  init(data) {
    // Recibir datos del nivel completado desde GameScene
    this._level = data.level || 1;
    this._score = data.score || 0;
    this._lives = data.lives || 0;
  }

  create() {
    const { width, height } = this.scale;

    // Guardar el progreso alcanzado
    const progressManager = new ProgressManager();
    progressManager.save(this._level, this._score);

    // Fondo negro
    this.cameras.main.setBackgroundColor('#000000');

    // Título de nivel completado
    this.add.text(width / 2, height / 2 - 80, 'LEVEL COMPLETE!', {
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      fill: '#00ff00',
    }).setOrigin(0.5);

    // Mostrar puntuación del nivel
    this.add.text(width / 2, height / 2 - 20, `SCORE: ${this._score}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      fill: '#ffffff',
    }).setOrigin(0.5);

    // Determinar si hay más niveles o si se completó el juego
    const nextLevel = this._level + 1;
    const hasNextLevel = LEVELS.some(l => l.id === nextLevel);

    // Botón para continuar
    const continueBtn = this.add.text(width / 2, height / 2 + 60, 'CONTINUE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      fill: '#ffff00',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    continueBtn.on('pointerdown', () => {
      if (hasNextLevel) {
        // Avanzar al siguiente nivel
        this.scene.start('GameScene', { level: nextLevel });
      } else {
        // Todos los niveles completados: ir a VictoryScene
        this.scene.start('VictoryScene', { score: this._score });
      }
    });

    // Efecto de parpadeo en el botón
    this.tweens.add({
      targets: continueBtn,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }
}
