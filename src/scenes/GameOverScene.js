/**
 * GameOverScene — pantalla de game over.
 * Muestra el puntaje final y ofrece la opción de reiniciar el juego.
 */

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this._score = data.score || 0;
    this._level = data.level || 1;
  }

  create() {
    const { width, height } = this.scale;

    // Fondo negro
    this.cameras.main.setBackgroundColor('#000000');

    // Texto de game over
    this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      fill: '#ff0000',
    }).setOrigin(0.5);

    // Mostrar puntuación final
    this.add.text(width / 2, height / 2 - 20, `SCORE: ${this._score}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      fill: '#ffffff',
    }).setOrigin(0.5);

    // Botón de reinicio
    const restartBtn = this.add.text(width / 2, height / 2 + 60, 'TRY AGAIN', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      fill: '#ffff00',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerdown', () => {
      // Reiniciar desde el nivel 1
      this.scene.start('GameScene', { level: 1 });
    });

    // Efecto de parpadeo en el botón
    this.tweens.add({
      targets: restartBtn,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }
}
