/**
 * AssetLoader — Responsable de registrar y cargar todos los assets del juego en la escena de Phaser.
 * Proporciona manejo de errores con assets de respaldo (fallback) para evitar que el juego se rompa.
 */
export class AssetLoader {

  /**
   * Registra todos los assets del manifiesto en la escena de Phaser para su precarga.
   * También configura un listener de errores de carga para sustituir assets fallidos con placeholders.
   * @param {Phaser.Scene} scene - La escena de Phaser donde se cargarán los assets
   */
  preload(scene) {
    // Tamaño de frame por defecto para todos los spritesheets
    const frameConfig = { frameWidth: 32, frameHeight: 32 };

    // --- Spritesheets de personajes ---
    scene.load.spritesheet('kiro', 'assets/sprites/kiro.png', frameConfig);
    scene.load.spritesheet('wanderer', 'assets/sprites/wanderer.png', frameConfig);
    scene.load.spritesheet('seeker', 'assets/sprites/seeker.png', frameConfig);
    scene.load.spritesheet('replicator', 'assets/sprites/replicator.png', frameConfig);

    // --- Imágenes estáticas ---
    scene.load.image('projectile', 'assets/sprites/projectile.png');
    scene.load.image('tileset', 'assets/sprites/tileset.png');

    // --- Tilemaps JSON de los niveles ---
    scene.load.tilemapTiledJSON('circuit_1', 'assets/tilemaps/circuit_1.json');
    scene.load.tilemapTiledJSON('circuit_2', 'assets/tilemaps/circuit_2.json');
    scene.load.tilemapTiledJSON('circuit_3', 'assets/tilemaps/circuit_3.json');

    // --- Efectos de sonido y música ---
    scene.load.audio('sfx_fire', 'assets/audio/sfx_fire.mp3');
    scene.load.audio('sfx_eliminate', 'assets/audio/sfx_eliminate.mp3');
    scene.load.audio('sfx_power_unlock', 'assets/audio/sfx_power_unlock.mp3');
    scene.load.audio('sfx_power_activate', 'assets/audio/sfx_power_activate.mp3');
    scene.load.audio('sfx_life_lost', 'assets/audio/sfx_life_lost.mp3');
    scene.load.audio('music_game', 'assets/audio/music_game.mp3');

    // Listener de errores: loguea el fallo y obtiene el asset de respaldo
    scene.load.on('loaderror', (file) => {
      const fallback = this.getFallback(file.key);
      console.error(
        `[AssetLoader] Error al cargar el asset "${file.key}" desde "${file.src}". ` +
        `Usando fallback: "${fallback}"`
      );
    });
  }

  /**
   * Retorna la clave del asset de respaldo (placeholder) cuando un asset falla al cargar.
   * Loguea el evento en la consola para facilitar el diagnóstico.
   * @param {string} key - La clave del asset que falló
   * @returns {string} La clave del placeholder de respaldo
   */
  getFallback(key) {
    console.warn(`[AssetLoader] Usando placeholder para el asset fallido: "${key}"`);
    return 'placeholder';
  }
}
