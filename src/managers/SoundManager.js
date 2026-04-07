/**
 * SoundManager — Envuelve el sistema de audio de Phaser.
 * Respeta el estado de silencio global y evita reproducir sonidos cuando está muteado.
 */
export class SoundManager {
  /**
   * @param {Phaser.Scene} scene - Referencia a la escena activa de Phaser
   * @param {boolean} isMuted - Estado inicial de silencio
   */
  constructor(scene, isMuted = false) {
    // Referencia a la escena para acceder a scene.sound
    this.scene = scene;
    // Estado actual de silencio
    this.muted = isMuted;
    // Referencia a la instancia de música de fondo (para evitar iniciarla múltiples veces)
    this.musicInstance = null;
  }

  /**
   * Reproduce un efecto de sonido por clave.
   * Si el audio está silenciado, no hace nada.
   * @param {string} key - Clave del asset de audio registrado en Phaser
   */
  play(key) {
    if (this.muted) return;

    try {
      this.scene.sound.play(key);
    } catch (e) {
      // Si la clave no está cargada o hay un error, se ignora silenciosamente
      console.warn(`SoundManager: no se pudo reproducir el sonido "${key}"`, e);
    }
  }

  /**
   * Inicia la música de fondo en bucle.
   * Si ya está reproduciéndose o el audio está silenciado, no hace nada.
   */
  startMusic() {
    // Evitar iniciar si ya hay música sonando en el sistema de audio global
    if (this.scene.sound.get('loop')) return;
    if (this.muted) return;
    try {
      this.musicInstance = this.scene.sound.add('loop', { loop: true, volume: 0.8 });
      this.musicInstance.play();
    } catch (e) {
      console.warn('SoundManager: no se pudo iniciar la música de fondo', e);
      this.musicInstance = null;
    }
  }

  /**
   * Detiene la música de fondo si está reproduciéndose.
   * Usa stopByKey para detener todas las instancias activas de la clave 'loop'.
   */
  stopMusic() {
    try {
      // Detener todas las instancias de 'loop' en el sistema de audio global
      this.scene.sound.stopByKey('loop');
    } catch (e) { /* ignorar */ }
    this.musicInstance = null;
  }

  /**
   * Silencia o activa todo el audio.
   * Al silenciar, detiene todos los sonidos en curso.
   * Al activar, permite que futuros sonidos se reproduzcan normalmente.
   * @param {boolean} muted - true para silenciar, false para activar
   */
  setMuted(muted) {
    this.muted = muted;

    if (muted) {
      // Detener todos los sonidos activos al silenciar
      try {
        this.scene.sound.stopAll();
      } catch (e) {
        console.warn('SoundManager: error al detener todos los sonidos', e);
      }
      // Limpiar la referencia de música ya que fue detenida
      this.musicInstance = null;
    }
    // Al desactivar el silencio, los futuros llamados a play() y startMusic() funcionarán normalmente
  }
}
