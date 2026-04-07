/**
 * TutorialScene — Pantalla de tutorial mostrada antes del nivel 1.
 * Explica los tres powerups automáticos al jugador.
 * Si se carga con level > 1, redirige inmediatamente a GameScene.
 */

// Clase base condicional para compatibilidad con entornos sin Phaser (Jest)
const BaseScene = (typeof Phaser !== 'undefined')
  ? Phaser.Scene
  : class {
      constructor(_config) {}
    };

export class TutorialScene extends BaseScene {
  constructor() {
    super({ key: 'TutorialScene' });
  }

  /**
   * Recibe el nivel desde la escena anterior.
   * @param {{ level: number }} data
   */
  init(data) {
    this._level = data.level || 1;
    this._transitioning = false;
  }

  create() {
    // Si el nivel es mayor que 1, saltar el tutorial directamente
    if (this._level > 1) {
      this._dismiss();
      return;
    }

    const { width, height } = this.scale;

    // Fondo negro
    this.cameras.main.setBackgroundColor('#000000');

    // Título
    this.add.text(width / 2, 60, 'HOW TO PLAY', {
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      fill: '#00ff00',
    }).setOrigin(0.5);

    // Subtítulo de powerups
    this.add.text(width / 2, 110, 'AUTO POWERUPS:', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      fill: '#ffffff',
    }).setOrigin(0.5);

    // Descripción de los tres powerups
    const descriptions = [
      'Every 20 pts — BLAST-A-BUG!\nBigger projectile for 5 seconds',
      'Every 40 pts — BUG FREE ZONE!\nEliminates bugs within 50px',
      'Every 100 pts — EXTRA LIFE!\n+1 life',
    ];

    const colors = ['#ffff00', '#00ffff', '#ff88ff'];
    descriptions.forEach((desc, i) => {
      this.add.text(width / 2, 180 + i * 90, desc, {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        fill: colors[i],
        align: 'center',
        lineSpacing: 8,
      }).setOrigin(0.5);
    });

    // Botón de dismiss
    const dismissText = this.add.text(width / 2, height - 60, 'PRESS ANY KEY / CLICK', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      fill: '#ffff00',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Efecto de parpadeo en el botón
    this.tweens.add({
      targets: dismissText,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Escuchar clic en el botón
    dismissText.on('pointerdown', () => this._dismiss());

    // Escuchar cualquier tecla del teclado
    this.input.keyboard.once('keydown', () => this._dismiss());

    // Escuchar clic en cualquier parte de la pantalla
    this.input.once('pointerdown', () => this._dismiss());
  }

  /**
   * Transiciona a GameScene con level 1, usando el guard _transitioning.
   */
  _dismiss() {
    if (this._transitioning) return;
    this._transitioning = true;
    this.scene.start('GameScene', { level: 1 });
  }
}
