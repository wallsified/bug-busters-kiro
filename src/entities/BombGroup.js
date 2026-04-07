/**
 * Grupo de bombas colocadas por Kiro.
 * Gestiona el pool de bombas activas con lógica de fusible y detonación.
 * No extiende Phaser.Physics.Arcade.Group para evitar conflictos de ciclo de vida.
 */

import { CONSTANTS } from '../config/constants.js';

const TILE_SIZE = 32;

export class BombGroup {
  /**
   * Crea el grupo de bombas asociado a la escena indicada.
   * @param {Phaser.Scene} scene - La escena de Phaser que contiene el grupo
   */
  constructor(scene) {
    this.scene = scene;
    // Pool de sprites de bomba reutilizables (Phaser.Physics.Arcade.Sprite)
    this._pool = [];
  }

  /**
   * Coloca una bomba en la posición de tile más cercana al punto dado.
   * Reutiliza sprites inactivos del pool antes de crear uno nuevo.
   * Inicia el temporizador de fusible que detona la bomba automáticamente.
   * @param {number} x - Coordenada X del punto de colocación (en píxeles)
   * @param {number} y - Coordenada Y del punto de colocación (en píxeles)
   */
  placeBomb(x, y) {
    if (this.getActiveCount() >= CONSTANTS.BOMB_LIMIT) return;

    const snappedX = Math.round(x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    const snappedY = Math.round(y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

    // Reutilizar bomba inactiva del pool
    let bomb = this._pool.find(b => !b.active);

    if (!bomb) {
      if (typeof Phaser !== 'undefined') {
        bomb = this.scene.physics.add.sprite(snappedX, snappedY, 'bomb');
      } else {
        // Mock para Jest
        bomb = {
          x: snappedX, y: snappedY, active: true, visible: true,
          fuseTimer: null,
          body: { velocity: { x: 0, y: 0 }, reset: jest.fn ? jest.fn() : () => {} },
          setActive(v) { this.active = v; return this; },
          setVisible(v) { this.visible = v; return this; },
          setPosition(px, py) { this.x = px; this.y = py; return this; },
        };
      }
      bomb.fuseTimer = null;
      this._pool.push(bomb);
    }

    bomb.setActive(true);
    bomb.setVisible(true);
    bomb.setPosition(snappedX, snappedY);
    if (bomb.body && typeof bomb.body.reset === 'function') {
      bomb.body.reset(snappedX, snappedY);
    }

    if (bomb.fuseTimer && typeof bomb.fuseTimer.remove === 'function') {
      bomb.fuseTimer.remove(false);
    }
    bomb.fuseTimer = this.scene.time.delayedCall(
      CONSTANTS.BOMB_FUSE_DURATION,
      () => this.detonateBomb(bomb)
    );
  }

  /**
   * Detona una bomba específica: cancela su fusible y la desactiva del pool.
   * @param {object} bomb - El sprite de bomba a detonar
   */
  detonateBomb(bomb) {
    if (!bomb || bomb.active === false) return;
    if (bomb.fuseTimer) {
      if (typeof bomb.fuseTimer.remove === 'function') bomb.fuseTimer.remove(false);
      bomb.fuseTimer = null;
    }
    bomb.setActive(false);
    bomb.setVisible(false);
    if (bomb.body) { bomb.body.velocity.x = 0; bomb.body.velocity.y = 0; }
  }

  /**
   * Retorna el número de bombas actualmente activas en el pool.
   * @returns {number} Cantidad de bombas activas
   */
  getActiveCount() {
    return this._pool.filter(b => b.active === true).length;
  }

  /**
   * Retorna todos los sprites del pool para registrar overlaps manualmente.
   * @returns {object[]} Array con todos los sprites de bomba (activos e inactivos)
   */
  getChildren() {
    return this._pool;
  }
}
