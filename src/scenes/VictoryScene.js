/**
 * VictoryScene — pantalla de victoria final.
 * Muestra el mensaje de victoria y el puntaje final al completar los tres niveles.
 */

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  init(data) {
    this._score = data.score || 0;
  }

  create() {
    const { width, height } = this.scale;

    // Fondo negro
    this.cameras.main.setBackgroundColor('#000000');

    // Mensaje de victoria en estilo pixelado (igual que la pantalla de carga)
    this.add.text(width / 2, height / 2 - 80, "I AIN'T AFRAID\nOF NO BUGS", {
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      fill: '#00ff00',
      align: 'center',
    }).setOrigin(0.5);

    // Mostrar puntuación final
    this.add.text(width / 2, height / 2, `FINAL SCORE: ${this._score}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      fill: '#ffffff',
    }).setOrigin(0.5);

    // Botón para volver al menú principal
    const menuBtn = this.add.text(width / 2, height / 2 + 80, 'MAIN MENU', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      fill: '#ffff00',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });

    // Efecto de parpadeo en el botón
    this.tweens.add({
      targets: menuBtn,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }
}
