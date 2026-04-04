/**
 * Sistema de puntuación del juego Bug Busters.
 * Gestiona el puntaje actual, notifica cambios mediante un callback opcional
 * y expone utilidades estáticas para consultar la configuración de niveles.
 */

import { LEVELS } from '../config/levels.js';

export class ScoreSystem {
  /**
   * @param {Function|null} onScoreChange - Callback invocado con el nuevo puntaje tras cada cambio.
   */
  constructor(onScoreChange = null) {
    this._score = 0;
    this._onScoreChange = onScoreChange;
  }

  /**
   * Incrementa el puntaje en el valor indicado y notifica al callback si está definido.
   * @param {number} pointValue - Puntos a añadir
   */
  addPoints(pointValue) {
    this._score += pointValue;
    if (typeof this._onScoreChange === 'function') {
      this._onScoreChange(this._score);
    }
  }

  /**
   * Retorna el puntaje actual.
   * @returns {number}
   */
  getScore() {
    return this._score;
  }

  /**
   * Reinicia el puntaje a cero.
   */
  reset() {
    this._score = 0;
  }

  /**
   * Retorna los conteos de enemigos por tipo para un nivel dado.
   * @param {number} levelId - Identificador del nivel (1, 2 o 3)
   * @returns {{ wanderers: number, seekers: number, replicators: number }}
   */
  static getLevelEnemyCounts(levelId) {
    const level = LEVELS.find(l => l.id === levelId);
    if (!level) return { wanderers: 0, seekers: 0, replicators: 0 };
    return {
      wanderers: level.enemies.filter(e => e.type === 'Wanderer').length,
      seekers: level.enemies.filter(e => e.type === 'Seeker').length,
      replicators: level.enemies.filter(e => e.type === 'Replicator').length,
    };
  }
}
