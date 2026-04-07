/**
 * Grupo de proyectiles disparados por Kiro.
 * Extiende Phaser.Physics.Arcade.Group para gestionar el pool de proyectiles activos.
 *
 * Patrón de compatibilidad: si Phaser no está disponible (entorno Node/Jest),
 * se extiende una clase base mínima para permitir pruebas unitarias.
 */

import { CONSTANTS } from '../config/constants.js';

// Clase base mínima para entornos sin Phaser (tests con Jest)
const BaseGroup = (typeof Phaser !== 'undefined')
  ? Phaser.Physics.Arcade.Group
  : class {
      constructor() {
        // Lista interna de proyectiles del pool
        this._children = [];
      }

      getChildren() {
        return this._children;
      }

      create(x, y, key) {
        // Crea un objeto proyectil simulado con la interfaz mínima necesaria
        const obj = {
          x,
          y,
          active: true,
          body: { velocity: { x: 0, y: 0 } },
          setActive: function(v) { this.active = v; return this; },
          setVisible: function(v) { this.visible = v; return this; },
          setPosition: function(px, py) { this.x = px; this.y = py; return this; }
        };
        this._children.push(obj);
        return obj;
      }
    };

export class ProjectileGroup extends BaseGroup {
  /**
   * @param {Phaser.Scene} scene - La escena de Phaser que contiene el grupo
   */
  constructor(scene) {
    super(scene);

    // Referencia a la escena para acceder al sistema de física y límites del mundo
    this.scene = scene;
  }

  /**
   * Dispara un proyectil desde la posición indicada en la dirección dada.
   * Si ya hay 3 proyectiles activos, la operación es un no-op.
   *
   * @param {number} x - Posición X de origen del proyectil
   * @param {number} y - Posición Y de origen del proyectil
   * @param {'up'|'down'|'left'|'right'} direction - Dirección del disparo
   */
  fire(x, y, direction) {
    // Contar proyectiles activos actualmente en el pool
    const activeCount = this.getChildren().filter(p => p.active).length;

    // Si se alcanzó el límite, no disparar
    if (activeCount >= CONSTANTS.PROJECTILE_LIMIT) {
      return;
    }

    // Buscar un proyectil inactivo en el pool para reutilizarlo
    const existing = this.getChildren().find(p => !p.active);
    let projectile;

    if (existing) {
      // Reutilizar proyectil inactivo del pool
      projectile = existing;
      projectile.setPosition(x, y);
      projectile.setActive(true);
      projectile.setVisible(true);
    } else {
      // Crear un nuevo proyectil en el pool
      projectile = this.create(x, y, 'projectile');
      projectile.setVisible(true);
    }

    // Calcular la velocidad según la dirección del disparo
    const speed = CONSTANTS.PROJECTILE_SPEED;
    projectile.body.velocity.x = 0;
    projectile.body.velocity.y = 0;

    if (direction === 'up') {
      projectile.body.velocity.y = -speed;
    } else if (direction === 'down') {
      projectile.body.velocity.y = speed;
    } else if (direction === 'left') {
      projectile.body.velocity.x = -speed;
    } else if (direction === 'right') {
      projectile.body.velocity.x = speed;
    }

    // Configurar desactivación automática al salir de los límites del mundo (solo en Phaser)
    if (typeof Phaser !== 'undefined' && projectile.body) {
      projectile.body.onWorldBounds = true;
    }
  }
}
