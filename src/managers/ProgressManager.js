/**
 * ProgressManager — gestiona la persistencia del progreso del jugador en localStorage.
 * Usa la clave 'bugbusters_progress' para evitar conflictos con otras entradas.
 */

import { CONSTANTS } from '../config/constants.js';

export class ProgressManager {
  // Clave de almacenamiento, sincronizada con CONSTANTS para consistencia
  static KEY = CONSTANTS.STORAGE_KEY;

  /**
   * Carga el progreso guardado desde localStorage.
   * Ante cualquier fallo (localStorage no disponible, JSON malformado,
   * campos faltantes) retorna los valores por defecto.
   * @returns {{ level: number, score: number }}
   */
  load() {
    const defaults = { level: 1, score: 0 };

    try {
      const raw = localStorage.getItem(ProgressManager.KEY);

      // Si no hay datos guardados, retornar valores por defecto
      if (raw === null) return defaults;

      const parsed = JSON.parse(raw);

      // Validar que los campos existan y sean números; usar defaults si faltan
      const level = typeof parsed.level === 'number' ? parsed.level : defaults.level;
      const score = typeof parsed.score === 'number' ? parsed.score : defaults.score;

      return { level, score };
    } catch (_err) {
      // Captura: localStorage no disponible, JSON malformado u otro error
      return defaults;
    }
  }

  /**
   * Guarda el progreso solo si los nuevos valores superan los almacenados.
   * Aplica semántica de máximo: conserva el nivel más alto y el score más alto
   * de forma independiente.
   * @param {number} level - Nivel alcanzado en la sesión actual
   * @param {number} score - Puntuación obtenida en la sesión actual
   */
  save(level, score) {
    try {
      const current = this.load();

      // Conservar el valor más alto de cada campo de forma independiente
      const newData = {
        level: Math.max(current.level, level),
        score: Math.max(current.score, score),
      };

      localStorage.setItem(ProgressManager.KEY, JSON.stringify(newData));
    } catch (_err) {
      // Si localStorage no está disponible, ignorar silenciosamente
    }
  }
}
