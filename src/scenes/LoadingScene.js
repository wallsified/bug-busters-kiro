// Escena de carga: muestra pantalla de bienvenida con barra de progreso
// antes de transicionar al menú principal
export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Fondo negro
    this.cameras.main.setBackgroundColor('#000000');

    // Texto principal con fuente pixelada Press Start 2P
    this.add.text(width / 2, height / 2 - 60, 'Who you gonna call?\nBug Hunters!', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // Contenedor de la barra de progreso (fondo gris oscuro)
    this.add.rectangle(width / 2, height / 2 + 20, 400, 20, 0x333333);

    // Barra de progreso (verde, crece de izquierda a derecha)
    const bar = this.add.rectangle(width / 2 - 200, height / 2 + 20, 0, 20, 0x00ff00).setOrigin(0, 0.5);

    // Simular progreso visual en 10 pasos de 50ms
    let progress = 0;
    this.time.addEvent({
      delay: 50,
      repeat: 9,
      callback: () => {
        progress += 0.1;
        bar.width = 400 * progress;
      }
    });

    // Transición a MainMenuScene 500ms después de que la animación termina
    this.time.delayedCall(500 + 50 * 10, () => {
      this.scene.start('MainMenuScene');
    });
  }
}
