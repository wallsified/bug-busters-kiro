import { AssetLoader } from '../managers/AssetLoader.js';
import { CRTShader } from '../shaders/CRTShader.js';

/**
 * BootScene — Primera escena del juego. Se encarga de registrar todos los assets
 * usando AssetLoader y luego inicia la escena de carga (LoadingScene).
 * Phaser se carga vía CDN, por lo que no se importa aquí.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  /**
   * Registra todos los assets del juego en la cola de carga de Phaser.
   */
  preload() {
    const assetLoader = new AssetLoader();
    assetLoader.preload(this);
  }

  /**
   * Una vez registrados los assets, inicia la escena de carga con barra de progreso.
   * Registra el pipeline CRTShader si el renderer es WebGL.
   */
  create() {
    if (this.renderer && this.renderer.type === Phaser.WEBGL) {
      this.renderer.pipelines.addPostPipeline('CRTShader', CRTShader);
    }
    this.scene.start('LoadingScene');
  }
}
