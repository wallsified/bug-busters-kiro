/**
 * Constantes globales del juego Bug Busters.
 * Centraliza todos los valores numéricos y de configuración para facilitar el ajuste del balance.
 */

export const CONSTANTS = {

  // --- Jugador ---
  // Velocidad de movimiento de Kiro en píxeles por segundo
  PLAYER_SPEED: 200,
  // Duración del período de invencibilidad tras recibir daño (en milisegundos)
  INVINCIBILITY_DURATION: 3000,

  // --- Bombas ---
  // Número máximo de bombas activas simultáneamente
  BOMB_LIMIT: 3,
  // Duración del fusible de la bomba en milisegundos
  BOMB_FUSE_DURATION: 3000,

  // --- Poderes: umbrales de desbloqueo (puntos) ---
  POWER_UNLOCK_FREEZE: 150,
  POWER_UNLOCK_PATCH_BOMB: 300,

  // --- Poderes: cooldowns (en milisegundos) ---
  FREEZE_COOLDOWN: 15000,
  PATCH_BOMB_COOLDOWN: 20000,

  // --- Poderes: parámetros de efecto ---
  // Duración del efecto Freeze (en milisegundos)
  FREEZE_DURATION: 5000,
  // Radio de efecto del Patch_Bomb (en píxeles)
  PATCH_BOMB_RADIUS: 250,

  // --- Puntos por tipo de enemigo ---
  POINTS_WANDERER: 10,
  POINTS_SEEKER: 20,
  POINTS_REPLICATOR: 30,

  // --- Wanderer: intervalo de cambio de dirección (en milisegundos) ---
  WANDERER_DIR_CHANGE_MIN: 1000,
  WANDERER_DIR_CHANGE_MAX: 3000,

  // --- Seeker: intervalo de recálculo de ruta (en milisegundos) ---
  SEEKER_RECALC_INTERVAL: 500,

  // --- Replicator: parámetros de spawn ---
  // Intervalo entre spawns de Wanderers (en milisegundos)
  REPLICATOR_SPAWN_INTERVAL: 8000,
  // Número máximo de Wanderers que puede generar un Replicator
  REPLICATOR_MAX_SPAWNS: 3,

  // --- Efectos visuales: duración del hit-stop (en milisegundos) ---
  HIT_STOP_DURATION: 80,

  // --- Vidas iniciales del jugador ---
  PLAYER_INITIAL_LIVES: 3,

  // --- Clave de almacenamiento local ---
  STORAGE_KEY: 'bugbusters_progress'
};
