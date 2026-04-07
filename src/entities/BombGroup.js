/**
 * Grupo de bombas colocadas por Kiro.
 * Gestiona el pool de bombas activas con lógica de fusible y detonación.
 *
 * Patrón de compatibilidad: si Phaser no está disponible (entorno Node/Jest),
 * se usa una implementación mock mínima.
 */

import { CONSTANTS } from '../config/constants.js';

// Tamaño de tile en píxeles para el snapping de posición
const TILE_SIZE = 32;

// Clase base mínima para entornos sin Phaser (tests con Jest)
const BaseGroup = (typeof Phaser !== 'undefined')
  ? Phaser.Physics.Arcade.Group
  : class {
      constructor() {
        this._children = [];
      }
      getChildren() { return this._children; }
      create(x, y, key) {
        const obj = {
          x, y, active: true, visible: true,
          body: {
            velocity: { x: 0, y: 0 },
            reset: function(px, py) { this.x = px; this.y = py; }
          },
          fuseTimer: null,
          setActive: function(v) { this.active = v; return this; },
          setVisible: function(v) { this.visible = v; return this; },
          setPosition: function(px, py) { this.x = px; this.y = py; return this; }
        };
        this._children.push(obj);
        return obj;
      }
    };

export class BombGroup extends BaseGroup {
  /**
   * @param {Phaser.Scene} scene - La escena de Phaser que contiene el grupo
   */
  constructor(scene) {
    super(scene, [], { runChildUpdate: false });
    this.scene = scene;
    // Pool de sprites de bomba creados manualmente
    this._pool = [];
  }

  /**
   * Coloca una bomba en la posición de tile más cercana al punto dado.
   */
  placeBomb(x, y) {
    if (this.getActiveCount() >= CONSTANTS.BOMB_LIMIT) return;

    const snappedX = Math.round(x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    const snappedY = Math.round(y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

    // Debug: registrar posición de colocación y tamaño actual del pool
    console.log('[BombGroup] placeBomb called at', snappedX, snappedY, 'pool size:', this._pool.length);

    let bomb = this._pool.find(b => !b.active);

    if (!bomb) {
      if (typeof Phaser !== 'undefined') {
        // Crear sprite de física directamente en la escena
        bomb = this.scene.physics.add.sprite(snappedX, snappedY, 'bomb');
        bomb.fuseTimer = null;
        this._pool.push(bomb);
        // Agregar al grupo para que los overlaps funcionen
        this.add(bomb);
      } else {
        // Entorno mock (Jest)
        bomb = this.create(snappedX, snappedY, 'bomb');
        bomb.fuseTimer = null;
        this._pool.push(bomb);
      }
    }

    bomb.setActive(true);
    bomb.setVisible(true);
    bomb.setPosition(snappedX, snappedY);
    if (bomb.body) bomb.body.reset(snappedX, snappedY);

    // Cancelar fusible anterior si existe
    if (bomb.fuseTimer) {
      if (typeof bomb.fuseTimer.remove === 'function') bomb.fuseTimer.remove(false);
      bomb.fuseTimer = null;
    }

    bomb.fuseTimer = this.scene.time.delayedCall(
      CONSTANTS.BOMB_FUSE_DURATION,
      () => this.detonateBomb(bomb)
    );
  }

  /**
   * Detona una bomba específica.
   */
  detonateBomb(bomb) {
    if (!bomb || bomb.active === false) return;

    if (bomb.fuseTimer) {
      if (typeof bomb.fuseTimer.remove === 'function') bomb.fuseTimer.remove(false);
      bomb.fuseTimer = null;
    }

    bomb.setActive(false);
    bomb.setVisible(false);
    if (bomb.body) {
      bomb.body.velocity.x = 0;
      bomb.body.velocity.y = 0;
    }
  }

  /**
   * Retorna el número de bombas actualmente activas.
   */
  getActiveCount() {
    return this._pool.filter(b => b.active === true).length;
  }

  /**
   * Retorna todos los sprites del pool (para overlaps).
   */
  getChildren() {
    if (typeof Phaser !== 'undefined') return this._pool;
    return super.getChildren ? super.getChildren() : this._pool;
  }
}
