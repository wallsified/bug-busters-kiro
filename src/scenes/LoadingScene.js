// Escena de carga: muestra pantalla de bienvenida con barra de progreso
// antes de transicionar al menú principal
import { createScanlineOverlay } from '../managers/EffectsManager.js';

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

    // Texto de carga con color verde y parpadeo estilo CRT
    const loadingText = this.add.text(width / 2, height / 2 + 60, 'LOADING...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      fill: '#00ff00',
    }).setOrigin(0.5);

    // Tween de parpadeo CRT sobre el texto de carga
    this.tweens.add({
      targets: loadingText,
      alpha: 0.7,
      duration: 120,
      yoyo: true,
      repeat: -1,
    });

    // Tween suave sobre el ancho de la barra (duración aleatoria entre 2000 y 3000 ms)
    const barDuration = 2000 + Math.random() * 1000;
    this.tweens.add({
      targets: bar,
      width: 400,
      duration: barDuration,
      ease: 'Linear',
      onComplete: () => {
        // Esperar 400 ms tras completar la barra antes de transicionar
        this.time.delayedCall(400, () => {
          this.scene.start('MainMenuScene');
        });
      },
    });

    // Overlay de líneas de escaneo sobre todos los elementos
    createScanlineOverlay(this);
  }
}
