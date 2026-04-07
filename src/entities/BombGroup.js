/**
 * Grupo de bombas colocadas por Kiro.
 * Gestiona el pool de bombas activas con lógica de fusible y detonación.
 *
 * Patrón de compatibilidad: si Phaser no está disponible (entorno Node/Jest),
 * se extiende una clase base mínima para permitir pruebas unitarias.
 */

import { CONSTANTS } from '../config/constants.js';

// Tamaño de tile en píxeles para el snapping de posición
const TILE_SIZE = 32;

// Clase base mínima para entornos sin Phaser (tests con Jest)
const BaseGroup = (typeof Phaser !== 'undefined')
  ? Phaser.Physics.Arcade.Group
  : class {
      constructor() {
        // Lista interna de bombas del pool
        this._children = [];
      }

      getChildren() {
        return this._children;
      }

      create(x, y, key) {
        // Crea un objeto bomba simulado con la interfaz mínima necesaria
        const obj = {
          x,
          y,
          active: true,
          body: {
            velocity: { x: 0, y: 0 },
            reset: function(px, py) { /* no-op en entorno mock */ }
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
    super(scene);

    // Referencia a la escena para acceder al sistema de tiempo
    this.scene = scene;
  }

  /**
   * Coloca una bomba en la posición de tile más cercana al punto dado.
   * Si ya se alcanzó el límite de bombas activas, la operación es un no-op.
   *
   * @param {number} x - Posición X de origen (posición de Kiro)
   * @param {number} y - Posición Y de origen (posición de Kiro)
   */
  placeBomb(x, y) {
    // Verificar si se alcanzó el límite de bombas activas
    if (this.getActiveCount() >= CONSTANTS.BOMB_LIMIT) {
      return;
    }

    // Calcular la posición snapeada al centro del tile más cercano
    const snappedX = Math.round(x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    const snappedY = Math.round(y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

    // Buscar una bomba inactiva en el pool para reutilizarla
    const existing = this.getChildren().find(b => !b.active);
    let bomb;

    if (existing) {
      // Reutilizar bomba inactiva del pool
      bomb = existing;
      bomb.setActive(true);
      bomb.setVisible(true);
    } else {
      // Crear una nueva bomba en el pool (usa la imagen estática 'projectile')
      bomb = this.create(snappedX, snappedY, 'projectile');
      if (!bomb) return; // guardia: fallo de creación
    }

    // Sincronizar posición del sprite y del cuerpo físico
    bomb.setPosition(snappedX, snappedY);
    if (bomb.body) bomb.body.reset(snappedX, snappedY);

    // Iniciar el temporizador del fusible
    bomb.fuseTimer = this.scene.time.delayedCall(
      CONSTANTS.BOMB_FUSE_DURATION,
      () => this.detonateBomb(bomb)
    );
  }

  /**
   * Detona una bomba específica, cancelando su fusible y desactivándola.
   * Puede ser llamado por contacto con un Bug o por expiración del fusible.
   *
   * @param {object} bomb - La bomba a detonar
   */
  detonateBomb(bomb) {
    // Guardia: ignorar si la bomba ya fue detonada o no existe
    if (!bomb || bomb.active === false) {
      return;
    }

    // Cancelar el temporizador del fusible si aún está activo
    if (bomb.fuseTimer) {
      if (typeof bomb.fuseTimer.remove === 'function') {
        bomb.fuseTimer.remove(false);
      }
      bomb.fuseTimer = null;
    }

    // Desactivar y ocultar la bomba
    bomb.setActive(false);
    bomb.setVisible(false);

    // Detener cualquier movimiento residual
    bomb.body.velocity.x = 0;
    bomb.body.velocity.y = 0;
  }

  /**
   * Retorna el número de bombas actualmente activas en el pool.
   *
   * @returns {number} Cantidad de bombas activas
   */
  getActiveCount() {
    return this.getChildren().filter(b => b.active === true).length;
  }
}
