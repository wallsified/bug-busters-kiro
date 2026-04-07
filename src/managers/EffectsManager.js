import { CONSTANTS } from '../config/constants.js';

/**
 * Crea un overlay de líneas de escaneo (scanlines) sobre todos los elementos de la escena.
 * Dibuja franjas horizontales semitransparentes de 2 px con un hueco de 2 px entre ellas.
 * @param {Phaser.Scene} scene - La escena sobre la que se dibuja el overlay.
 * @returns {Phaser.GameObjects.Graphics} El objeto gráfico creado con el overlay.
 */
export function createScanlineOverlay(scene) {
  const { width, height } = scene.scale;
  const gfx = scene.add.graphics();
  const stripeCount = Math.ceil(height / 4);
  gfx.fillStyle(0x000000, 0.25);
  for (let i = 0; i < stripeCount; i++) {
    gfx.fillRect(0, i * 4, width, 2);
  }
  gfx.setScrollFactor(0);
  return gfx;
}

/**
 * EffectsManager — Centraliza todos los efectos visuales en tiempo de ejecución.
 * Recibe la escena propietaria en el constructor y delega todas las llamadas
 * a la API de Phaser a través de ella.
 */
export class EffectsManager {
  /**
   * @param {Phaser.Scene} scene - La escena propietaria que provee acceso a la API de Phaser.
   */
  constructor(scene) {
    /** @type {Phaser.Scene} Referencia a la escena propietaria */
    this._scene = scene;

    /** @type {Phaser.Tweens.Tween|null} Tween activo de parpadeo por daño */
    this._blinkTween = null;
  }

  /**
   * Aplica un efecto de sacudida de cámara.
   * @param {number} duration - Duración del shake en milisegundos.
   * @param {number} intensity - Intensidad del shake (0.0 – 1.0).
   */
  shake(duration, intensity) {
    this._scene.cameras.main.shake(duration, intensity);
  }

  /**
   * Genera una explosión de partículas en la posición indicada.
   * @param {number} x - Coordenada X del punto de explosión.
   * @param {number} y - Coordenada Y del punto de explosión.
   */
  spawnParticleBurst(x, y) {
    try {
      const particles = this._scene.add.particles(x, y, 'bomb', {
        speed: { min: 50, max: 150 },
        scale: { start: 0.5, end: 0 },
        lifespan: 400,
        quantity: 8,
        emitting: false,
      });
      particles.explode(8);
      // Destruir el emisor tras expirar el tiempo de vida de las partículas
      this._scene.time.delayedCall(400, () => particles.destroy());
    } catch (e) {
      console.warn('EffectsManager: error al crear explosión de partículas.', e);
    }
  }

  /**
   * Inicia el tween de parpadeo de daño sobre el sprite de Kiro.
   * Detiene el tween anterior si existe antes de crear uno nuevo.
   * @param {Phaser.GameObjects.Sprite} sprite - El sprite al que se aplica el parpadeo.
   */
  startDamageBlink(sprite) {
    if (this._blinkTween) {
      this._blinkTween.stop();
      this._blinkTween = null;
    }
    if (!this._scene || !this._scene.tweens) return;
    this._blinkTween = this._scene.tweens.add({
      targets: sprite,
      alpha: 0.15,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(CONSTANTS.INVINCIBILITY_DURATION / 200) - 1,
      onComplete: () => { if (sprite && sprite.active !== false) sprite.alpha = 1.0; },
    });
  }

  /**
   * Activa el efecto de hit-stop: congela brevemente la escala de tiempo.
   */
  triggerHitStop() {
    if (!this._scene || !this._scene.time) return;
    // Reducir la escala de tiempo para el efecto de freeze frame
    this._scene.time.timeScale = 0.05;
    // Restaurar la escala de tiempo tras la duración configurada
    this._scene.time.delayedCall(CONSTANTS.HIT_STOP_DURATION, () => {
      if (this._scene && this._scene.time) this._scene.time.timeScale = 1.0;
    });
  }

  /**
   * Genera un texto flotante con los puntos obtenidos sobre la posición del enemigo eliminado.
   * @param {number} x - Coordenada X de referencia.
   * @param {number} y - Coordenada Y de referencia.
   * @param {number} points - Puntos a mostrar.
   */
  spawnScorePopup(x, y, points) {
    // Crear el texto 16px por encima de la posición del enemigo
    const label = '+' + String(points ?? 0);
    const text = this._scene.add.text(x, y - 16, label, {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      fill: '#ffff00',
    });
    text.setScrollFactor(0);
    // Animar el texto hacia arriba con desvanecimiento y destruirlo al completar
    this._scene.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 600,
      onComplete: () => { text.destroy(); },
    });
  }
}
