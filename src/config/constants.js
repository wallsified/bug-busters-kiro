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
  STORAGE_KEY: 'bugbusters_progress',

  // --- Powerups automáticos: umbrales de score ---
  POWERUP_BLAST_A_BUG_THRESHOLD: 20,
  POWERUP_BUG_FREE_ZONE_THRESHOLD: 40,
  POWERUP_EXTRA_LIFE_THRESHOLD: 100,

  // --- Blast-a-Bug: parámetros ---
  // Duración del efecto Blast-a-Bug en milisegundos
  BLAST_A_BUG_DURATION: 5000,
  // Escala del proyectil durante Blast-a-Bug
  BLAST_A_BUG_SCALE: 2.5,

  // --- Bug Free Zone: radio de efecto en píxeles ---
  BUG_FREE_ZONE_RADIUS: 50,

  // --- Banner de powerup: duración de visibilidad en milisegundos ---
  POWERUP_BANNER_DURATION: 1500
};
